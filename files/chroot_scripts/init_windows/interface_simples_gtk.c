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
static GtkButton *retry_button = NULL;
static guint home_timer_id = 0;

#define N_STEPS 10
static GtkLabel *step_labels[N_STEPS];
static int current_step_index = 0;
static const char *step_titles[N_STEPS] = {
    "Aguardando montagem de disco",
    "Verificando dependências",
    "Verificando diretório docker_windows",
    "Extraindo ambiente Windows",
    "Iniciando serviços Docker",
    "Iniciando container Windows",
    "Aguardando inicialização do container",
    "Redimensionando disco",
    "Inicializando Windows",
    "Windows iniciado"
};

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
    "    min-height: 45px;"
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
    "    font-size: 22px;"
    "    font-weight: bold;"
    "    margin-top: 10px;"
    "}";

// Declarações antecipadas
static void start_docker_logs(void);
static void close_app(void);
static void wait_for_home_mount(void);
static void set_current_step(int idx);
static void build_steps_ui(GtkWidget *container);
static void reset_and_restart(void);
static void show_error(const char *msg);
static void on_retry_clicked(GtkButton *button, gpointer user_data);

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
    if (home_timer_id) {
        g_source_remove(home_timer_id);
        home_timer_id = 0;
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
        g_print("Progresso concluído! Fechando em 10 segundos...\n");
        exit_timer_id = g_timeout_add(10000, exit_app, NULL);
    }
}

static void set_current_step(int idx) {
    if (idx < 0) idx = 0;
    if (idx >= N_STEPS) idx = N_STEPS - 1;
    current_step_index = idx;
    for (int i = 0; i < N_STEPS; i++) {
        if (!step_labels[i]) continue;
        const char *prefix = (i < idx) ? "✔ " : (i == idx ? "→ " : "• ");
        char buf[256];
        g_snprintf(buf, sizeof(buf), "%s%s", prefix, step_titles[i]);
        gtk_label_set_text(step_labels[i], buf);
    }
}

static void build_steps_ui(GtkWidget *container) {
    GtkWidget *steps_box = gtk_box_new(GTK_ORIENTATION_VERTICAL, 6);
    for (int i = 0; i < N_STEPS; i++) {
        step_labels[i] = GTK_LABEL(gtk_label_new(step_titles[i]));
        gtk_box_append(GTK_BOX(steps_box), GTK_WIDGET(step_labels[i]));
    }
    set_current_step(0);
    gtk_box_append(GTK_BOX(container), steps_box);
}

static void show_error(const char *msg) {
    update_progress(0.0, msg);
    if (retry_button) {
        gtk_widget_set_visible(GTK_WIDGET(retry_button), TRUE);
        gtk_widget_set_sensitive(GTK_WIDGET(retry_button), TRUE);
    }
}

static void reset_and_restart(void) {
    if (log_watch_id) { g_source_remove(log_watch_id); log_watch_id = 0; }
    if (exit_timer_id) { g_source_remove(exit_timer_id); exit_timer_id = 0; }
    if (home_timer_id) { g_source_remove(home_timer_id); home_timer_id = 0; }
    if (docker_pid > 0) { kill(docker_pid, SIGTERM); waitpid(docker_pid, NULL, 0); docker_pid = 0; }
    if (script_pid > 0) { kill(script_pid, SIGTERM); waitpid(script_pid, NULL, 0); script_pid = 0; }

    set_current_step(0);
    update_progress(0.0, "Aguardando montagem de disco");
    if (retry_button) {
        gtk_widget_set_visible(GTK_WIDGET(retry_button), FALSE);
        gtk_widget_set_sensitive(GTK_WIDGET(retry_button), FALSE);
    }

    wait_for_home_mount();
}

static void on_retry_clicked(GtkButton *button, gpointer user_data) {
    (void)button; (void)user_data;
    reset_and_restart();
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
                show_error("Erro: container 'windows' não encontrado. Execute 'docker compose' antes.");
                g_print("Container 'windows' não existe. Garanta que o docker compose foi executado com sucesso.\n");
                return G_SOURCE_REMOVE;
            }
            else if (strstr(buffer, "Error response from daemon")) {
                show_error("Erro: problema no daemon do Docker. Verifique o serviço do Docker.");
                g_print("Erro detectado no daemon do Docker.\n");
                return G_SOURCE_REMOVE;
            }
            else if (strstr(buffer, "Resizing disk")) {
                set_current_step(7);
                update_progress(0.5, "Redimensionando disco... (50%)");
            }
            else if (strstr(buffer, "Booting Windows")) {
                set_current_step(8);
                update_progress(0.7, "Inicializando Windows... (70%)");
            }
            else if (strstr(buffer, "Windows started succesfully")) {
                set_current_step(9);
                update_progress(1.0, "Windows iniciado com sucesso! (100%)");
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
            g_printerr("Erro ao ler saída do script: %s\n", error->message);
            g_error_free(error);
            show_error("Erro ao ler saída do script.");
            return G_SOURCE_REMOVE;
        }
        
        if (bytes_read > 0) {
            buffer[bytes_read] = '\0';
            g_print("%s", buffer);
            
            if (strstr(buffer, "Verificando dependências")) {
                set_current_step(1);
                update_progress(0.1, "Verificando dependências... (10%)");
            }
            else if (strstr(buffer, "Verificando diretório docker_windows")) {
                set_current_step(2);
                update_progress(0.15, "Verificando diretório docker_windows... (15%)");
            }
            else if (strstr(buffer, "Extraindo ambiente Windows")) {
                set_current_step(3);
                update_progress(0.25, "Extraindo ambiente Windows... (25%)");
            }
            else if (strstr(buffer, "docker compose up -d")) {
                set_current_step(4);
                update_progress(0.35, "Iniciando serviços Docker... (35%)");
            }
            else if (strstr(buffer, "docker start") && strstr(buffer, "windows")) {
                set_current_step(5);
                update_progress(0.4, "Iniciando container Windows... (40%)");
            }
            else if (strstr(buffer, "Aguardando inicialização do container")) {
                set_current_step(6);
                update_progress(0.45, "Aguardando inicialização do container... (45%)");
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
        g_printerr("Erro ao iniciar logs do Docker: %s\n", error->message);
        g_error_free(error);
        show_error("Erro: falha ao iniciar logs do Docker.");
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
        g_printerr("Erro ao iniciar script de implantação: %s\n", error->message);
        g_error_free(error);
        show_error("Erro: falha ao iniciar o script de implantação.");
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
    gtk_window_set_title(main_window, "Implantação do Windows (Docker)");
    gtk_window_fullscreen(main_window);
    
    GtkWidget *overlay = gtk_overlay_new();
    gtk_window_set_child(main_window, overlay);
    
    GtkWidget *background = NULL;
    
    if (g_file_test("image.jpg", G_FILE_TEST_EXISTS)) {
        background = gtk_picture_new_for_filename("image.jpg");
    } 
    else {
        g_printerr("image.jpg não encontrado! Usando cor de fundo padrão.\n");
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

    // Etapas do processo
    build_steps_ui(progress_container);
    
    progress_bar = GTK_PROGRESS_BAR(gtk_progress_bar_new());
    gtk_progress_bar_set_show_text(progress_bar, TRUE);
    gtk_progress_bar_set_fraction(progress_bar, 0.0);
    gtk_widget_set_size_request(GTK_WIDGET(progress_bar), 800, 45);
    gtk_progress_bar_set_text(progress_bar, "Aguardando montagem de disco");
    
    gtk_box_append(GTK_BOX(progress_container), GTK_WIDGET(progress_bar));
    
    GtkWidget *label = gtk_label_new("Pressione Alt+K para sair a qualquer momento");
    gtk_box_append(GTK_BOX(progress_container), label);

    // Botão Tentar novamente (aparece em erro)
    GtkWidget *retry = gtk_button_new_with_label("Tentar novamente");
    retry_button = GTK_BUTTON(retry);
    gtk_widget_set_visible(retry, FALSE);
    g_signal_connect(retry, "clicked", G_CALLBACK(on_retry_clicked), NULL);
    gtk_box_append(GTK_BOX(progress_container), retry);
    
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
            if (strcmp(mnt, "/home") == 0 && 
                (
                  strncmp(dev, "/dev/sd", 7) == 0 ||
                  strncmp(dev, "/dev/nvme", 9) == 0 ||
                  strncmp(dev, "/dev/vd", 7) == 0 ||
                  strncmp(dev, "/dev/mmcblk", 11) == 0 ||
                  strncmp(dev, "/dev/", 5) == 0 // fallback: qualquer dispositivo /dev/
                ) 
              ) {
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
        set_current_step(1);
        update_progress(0.05, "Disco montado. Iniciando...");
        start_deployment_script();
        return G_SOURCE_REMOVE;
    } else {
        set_current_step(0);
        update_progress(0.0, "Aguardando armazenamento: Conecte um HD, SSD, NVMe, cartão SD ou outro dispositivo para montagem do /home");
        return G_SOURCE_CONTINUE;
    }
}
// Função para iniciar a checagem periódica
static void wait_for_home_mount(void) {
    update_progress(0.0, "Aguardando montagem de disco");
    home_timer_id = g_timeout_add(1000, wait_for_home_mount_cb, NULL); // checa a cada 1 seg
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