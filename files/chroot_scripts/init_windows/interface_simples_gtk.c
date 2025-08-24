#include <gtk/gtk.h>
#include <glib.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <fcntl.h>
#include <signal.h>
#include <sys/wait.h>

// Global variables
static GtkProgressBar *progress_bar;
static GtkWindow *main_window;
static guint log_watch_id = 0;
static guint exit_timer_id = 0;
static GPid docker_pid = 0;
static GPid script_pid = 0;

// CSS for styling - white theme
const char *css = 
    ".progress-container {"
    "    background-color: white;"
    "    border-radius: 20px;"
    "    padding: 20px;"
    "    box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
    "}"
    "progressbar {"
    "    border-radius: 10px;"
    "    min-height: 30px;"
    "}"
    "trough {"
    "    background-color: #f0f0f0;"
    "    border-radius: 10px;"
    "    border: 1px solid #ddd;"
    "}"
    "progress {"
    "    background-color: #4285F4;"
    "    border-radius: 10px;"
    "    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);"
    "}"
    "label {"
    "    color: #444;"
    "    font-size: 16px;"
    "    font-weight: bold;"
    "    margin-top: 10px;"
    "}";

// Declarações antecipadas
static void start_docker_logs(void);
static void close_app(void);
static void wait_for_home_mount(void);

// Close the application
static void close_app() {
    if (log_watch_id) {
        g_source_remove(log_watch_id);
        log_watch_id = 0;
    }
    if (exit_timer_id) {
        g_source_remove(exit_timer_id);
        exit_timer_id = 0;
    }
    if (docker_pid > 0) {
        kill(docker_pid, SIGTERM);
        waitpid(docker_pid, NULL, 0);
        docker_pid = 0;
    }
    if (script_pid > 0) {
        kill(script_pid, SIGTERM);
        waitpid(script_pid, NULL, 0);
        script_pid = 0;
    }
    if (main_window) {
        gtk_window_destroy(main_window);
    }
}

// Timer callback for exit
static gboolean exit_app(gpointer data) {
    (void)data;
    close_app();
    return G_SOURCE_REMOVE;
}

// Update progress bar and text
static void update_progress(double value, const char *text) {
    gtk_progress_bar_set_fraction(progress_bar, value);
    gtk_progress_bar_set_text(progress_bar, text);
    
    if (value >= 1.0) {
        g_print("Progress complete! Closing in 10 seconds...\n");
        exit_timer_id = g_timeout_add(10000, exit_app, NULL);
    }
}

// Read Docker logs and update progress
static gboolean read_docker_logs(GIOChannel *channel, GIOCondition condition, gpointer data) {
    (void)data;
    
    if (condition & G_IO_HUP) {
        g_print("Docker logs process ended.\n");
        return G_SOURCE_REMOVE;
    }

    if (condition & G_IO_IN) {
        gchar buffer[1024];
        gsize bytes_read;
        GError *error = NULL;
        
        GIOStatus status = g_io_channel_read_chars(channel, buffer, sizeof(buffer)-1, &bytes_read, &error);
        if (status == G_IO_STATUS_ERROR) {
            g_printerr("Error reading logs: %s\n", error->message);
            g_error_free(error);
            return G_SOURCE_REMOVE;
        }
        
        if (bytes_read > 0) {
            buffer[bytes_read] = '\0';
            g_print("%s", buffer);
            
            // Check for Docker errors
            if (strstr(buffer, "No such container")) {
                update_progress(0.0, "Error: Container 'windows' not found. Please run docker compose first.");
                g_print("Container 'windows' does not exist. Please ensure docker compose was executed successfully.\n");
                return G_SOURCE_REMOVE;
            }
            else if (strstr(buffer, "Error response from daemon")) {
                update_progress(0.0, "Error: Docker daemon error. Please check Docker service.");
                g_print("Docker daemon error detected.\n");
                return G_SOURCE_REMOVE;
            }
            else if (strstr(buffer, "Resizing disk")) {
                update_progress(0.5, "Resizing disk... (50%)");
            }
            else if (strstr(buffer, "Booting Windows")) {
                update_progress(0.7, "Booting Windows... (70%)");
            }
            else if (strstr(buffer, "Windows started succesfully")) {
                update_progress(1.0, "Windows started successfully! (100%)");
                return G_SOURCE_REMOVE;
            }
        }
    }
    
    return G_SOURCE_CONTINUE;
}

// Read script output and update progress
static gboolean read_script_output(GIOChannel *channel, GIOCondition condition, gpointer data) {
    (void)data;
    
    if (condition & G_IO_HUP) {
        g_print("Script execution completed.\n");
        start_docker_logs();
        return G_SOURCE_REMOVE;
    }

    if (condition & G_IO_IN) {
        gchar buffer[1024];
        gsize bytes_read;
        GError *error = NULL;
        
        GIOStatus status = g_io_channel_read_chars(channel, buffer, sizeof(buffer)-1, &bytes_read, &error);
        if (status == G_IO_STATUS_ERROR) {
            g_printerr("Error reading script output: %s\n", error->message);
            g_error_free(error);
            return G_SOURCE_REMOVE;
        }
        
        if (bytes_read > 0) {
            buffer[bytes_read] = '\0';
            g_print("%s", buffer);
            
            if (strstr(buffer, "Verificando dependências")) {
                update_progress(0.1, "Verifying dependencies... (10%)");
            }
            else if (strstr(buffer, "Verificando diretório docker_windows")) {
                update_progress(0.15, "Checking docker_windows directory... (15%)");
            }
            else if (strstr(buffer, "Extraindo ambiente Windows")) {
                update_progress(0.25, "Extracting Windows environment... (25%)");
            }
            else if (strstr(buffer, "docker compose up -d")) {
                update_progress(0.35, "Starting Docker services... (35%)");
            }
            else if (strstr(buffer, "docker start") && strstr(buffer, "windows")) {
                update_progress(0.4, "Starting Windows container... (40%)");
            }
            else if (strstr(buffer, "Aguardando inicialização do container")) {
                update_progress(0.45, "Waiting for container initialization... (45%)");
            }
        }
    }
    
    return G_SOURCE_CONTINUE;
}

// Start Docker logs process
static void start_docker_logs(void) {
    // Default sudo password if not provided by environment
    const char *pwd = getenv("DOCKER_SUDO_PASSWORD");
    if (pwd == NULL || *pwd == '\0') {
        // Do not overwrite if user already set; use default "aluno"
        setenv("DOCKER_SUDO_PASSWORD", "aluno", 0);
    }

    // Try docker without sudo, fallback to sudo -S using DOCKER_SUDO_PASSWORD
    gchar *cmd = g_strdup("docker logs -f windows || echo \"$DOCKER_SUDO_PASSWORD\" | sudo -S -p \"\" docker logs -f windows");
    gchar *argv[] = {"/bin/bash", "-lc", cmd, NULL};
    
    gint stdout_fd;
    gint stderr_fd;
    GError *error = NULL;
    
    gboolean success = g_spawn_async_with_pipes(
        NULL,
        argv,
        NULL,
        G_SPAWN_SEARCH_PATH,
        NULL,
        NULL,
        &docker_pid,
        NULL,
        &stdout_fd,
        &stderr_fd,
        &error
    );
    
    if (!success) {
        g_printerr("Error starting Docker logs: %s\n", error->message);
        g_error_free(error);
        update_progress(0.0, "Error: Failed to start Docker logs");
        g_free(cmd);
        return;
    }
    
    GIOChannel *channel = g_io_channel_unix_new(stdout_fd);
    g_io_channel_set_encoding(channel, NULL, NULL);
    g_io_channel_set_buffered(channel, FALSE);
    
    log_watch_id = g_io_add_watch(
        channel,
        G_IO_IN | G_IO_HUP,
        (GIOFunc)read_docker_logs,
        NULL
    );
    
    // Also monitor stderr for error messages
    GIOChannel *error_channel = g_io_channel_unix_new(stderr_fd);
    g_io_channel_set_encoding(error_channel, NULL, NULL);
    g_io_channel_set_buffered(error_channel, FALSE);
    
    g_io_add_watch(
        error_channel,
        G_IO_IN | G_IO_HUP,
        (GIOFunc)read_docker_logs,
        NULL
    );

    g_free(cmd);
}

// Start deployment script
static void start_deployment_script(void) {
    gchar *argv[] = {"/bin/bash", "./install_windows.sh", NULL};
    
    gint stdout_fd;
    GError *error = NULL;
    
    gboolean success = g_spawn_async_with_pipes(
        NULL,
        argv,
        NULL,
        G_SPAWN_SEARCH_PATH,
        NULL,
        NULL,
        &script_pid,
        NULL,
        &stdout_fd,
        NULL,
        &error
    );
    
    if (!success) {
        g_printerr("Error starting deployment script: %s\n", error->message);
        g_error_free(error);
        update_progress(0.0, "Error: Failed to start deployment script");
        return;
    }
    
    GIOChannel *channel = g_io_channel_unix_new(stdout_fd);
    g_io_channel_set_encoding(channel, NULL, NULL);
    g_io_channel_set_buffered(channel, FALSE);
    
    // Não precisamos armazenar o ID pois é temporário
    guint watch_id = g_io_add_watch(
        channel,
        G_IO_IN | G_IO_HUP,
        (GIOFunc)read_script_output,
        NULL
    );
    (void)watch_id; // Evita warning de variável não utilizada
}

// Key press event handler
static void on_key_pressed(GtkEventControllerKey *controller,
                           guint keyval,
                           guint keycode,
                           GdkModifierType state,
                           gpointer user_data) {
    (void)controller;
    (void)keycode;
    (void)user_data;
    
    if ((state & GDK_ALT_MASK) && (keyval == GDK_KEY_k)) {
        g_print("Alt+K pressed! Closing application...\n");
        close_app();
    }
}

// Create the application UI
static void activate(GtkApplication *app, gpointer user_data) {
    (void)user_data;
    
    main_window = GTK_WINDOW(gtk_application_window_new(app));
    gtk_window_set_title(main_window, "Windows Docker Deployment");
    gtk_window_fullscreen(main_window);
    
    GtkWidget *overlay = gtk_overlay_new();
    gtk_window_set_child(main_window, overlay);
    
    GtkWidget *background = NULL;
    
    if (g_file_test("image.jpg", G_FILE_TEST_EXISTS)) {
        background = gtk_picture_new_for_filename("image.jpg");
    } 
    else {
        g_printerr("image.jpg not found! Using fallback color.\n");
        background = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 0);
        gtk_widget_set_name(background, "background-box");
        
        const char *fallback_css = "#background-box { background-color: #f0f0f0; }";
        GtkCssProvider *fallback_provider = gtk_css_provider_new();
        gtk_css_provider_load_from_data(fallback_provider, fallback_css, -1);
        gtk_style_context_add_provider(
            gtk_widget_get_style_context(background),
            GTK_STYLE_PROVIDER(fallback_provider),
            GTK_STYLE_PROVIDER_PRIORITY_APPLICATION
        );
    }
    
    gtk_widget_set_size_request(background, -1, -1);
    gtk_widget_set_hexpand(background, TRUE);
    gtk_widget_set_vexpand(background, TRUE);
    gtk_overlay_set_child(GTK_OVERLAY(overlay), background);
    
    GtkWidget *progress_container = gtk_box_new(GTK_ORIENTATION_VERTICAL, 10);
    gtk_widget_add_css_class(progress_container, "progress-container");
    gtk_widget_set_halign(progress_container, GTK_ALIGN_CENTER);
    gtk_widget_set_valign(progress_container, GTK_ALIGN_END);
    gtk_widget_set_margin_bottom(progress_container, 100);
    
    progress_bar = GTK_PROGRESS_BAR(gtk_progress_bar_new());
    gtk_progress_bar_set_show_text(progress_bar, TRUE);
    gtk_progress_bar_set_fraction(progress_bar, 0.0);
    gtk_widget_set_size_request(GTK_WIDGET(progress_bar), 600, 35);
    gtk_progress_bar_set_text(progress_bar, "Aguardando montagem de disco");
    
    gtk_box_append(GTK_BOX(progress_container), GTK_WIDGET(progress_bar));
    
    GtkWidget *label = gtk_label_new("Press Alt+K to exit anytime");
    gtk_box_append(GTK_BOX(progress_container), label);
    
    gtk_overlay_add_overlay(GTK_OVERLAY(overlay), progress_container);
    
    GtkEventController *key_controller = gtk_event_controller_key_new();
    g_signal_connect(key_controller, "key-pressed", G_CALLBACK(on_key_pressed), NULL);
    gtk_widget_add_controller(GTK_WIDGET(main_window), key_controller);
    
    GtkCssProvider *provider = gtk_css_provider_new();
    gtk_css_provider_load_from_data(provider, css, -1);
    gtk_style_context_add_provider_for_display(
        gdk_display_get_default(),
        GTK_STYLE_PROVIDER(provider),
        GTK_STYLE_PROVIDER_PRIORITY_APPLICATION
    );
    
    wait_for_home_mount();
    gtk_widget_show(GTK_WIDGET(main_window));
}

// Função para checar se o /home está montado em /dev/* (retorna TRUE se sim)
static gboolean is_home_mounted() {
    FILE *mounts = fopen("/proc/mounts", "r");
    if (!mounts) return FALSE;
    char line[512];
    gboolean found = FALSE;
    while (fgets(line, sizeof(line), mounts)) {
        char dev[256], mnt[256];
        if (sscanf(line, "%255s %255s", dev, mnt) == 2) {
            if (strcmp(mnt, "/home") == 0 && strncmp(dev, "/dev/", 5) == 0) {
                found = TRUE;
                break;
            }
        }
    }
    fclose(mounts);
    return found;
}
// Callback para aguardar montagem do /home
gboolean wait_for_home_mount_cb(gpointer user_data) {
    (void)user_data;
    if (is_home_mounted()) {
        update_progress(0.05, "Disco montado. Iniciando...");
        start_deployment_script();
        return G_SOURCE_REMOVE;
    } else {
        update_progress(0.0, "Aguardando montagem de disco");
        return G_SOURCE_CONTINUE;
    }
}
// Função para iniciar a checagem periódica
static void wait_for_home_mount(void) {
    update_progress(0.0, "Aguardando montagem de disco");
    g_timeout_add(1000, wait_for_home_mount_cb, NULL); // checa a cada 1 seg
}

int main(int argc, char **argv) {
    GtkApplication *app = gtk_application_new("com.example.dockermonitor", 0);
    g_signal_connect(app, "activate", G_CALLBACK(activate), NULL);
    
    int status = g_application_run(G_APPLICATION(app), argc, argv);
    
    if (log_watch_id) g_source_remove(log_watch_id);
    if (exit_timer_id) g_source_remove(exit_timer_id);
    
    if (docker_pid > 0) {
        kill(docker_pid, SIGTERM);
        waitpid(docker_pid, NULL, 0);
    }
    
    if (script_pid > 0) {
        kill(script_pid, SIGTERM);
        waitpid(script_pid, NULL, 0);
    }
    
    g_object_unref(app);
    
    return status;
}