#!/bin/bash
# Final GTK4 Autorun Script with Ubuntu Package Fix

set -e
set -x

# Ensure we run from the script directory so assets like image.jpg are found
cd "$(dirname "$0")"

# Mitigate blank window on some GPUs/drivers by forcing software rendering
export GSK_RENDERER="${GSK_RENDERER:-cairo}"

# Configuration
SOURCE_FILE="interface_simples_gtk.c"
GTK_VERSION=4

# Determine output path with fallback
DEFAULT_OUTPUT="/usr/local/bin/init_windows/my_gtk_app"
FALLBACK_OUTPUT="./my_gtk_app"
OUTPUT_DIR="$(dirname "$DEFAULT_OUTPUT")"
if { [ -d "$OUTPUT_DIR" ] && [ -w "$OUTPUT_DIR" ]; } || mkdir -p "$OUTPUT_DIR" 2>/dev/null; then
    OUTPUT_NAME="$DEFAULT_OUTPUT"
else
    echo "⚠️  No write permission to $OUTPUT_DIR, using local fallback: $FALLBACK_OUTPUT"
    OUTPUT_NAME="$FALLBACK_OUTPUT"
fi

# Set environment paths
export PKG_CONFIG_PATH="/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/local/lib/pkgconfig:/usr/share/pkgconfig:$PKG_CONFIG_PATH"
export LD_LIBRARY_PATH="/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"

# Function to install GTK4 development files
install_gtk4() {
    echo "⛔ GTK4 não encontrado. Execute com privilégios: sudo ./script.sh"
    exit 1
}

# Function to verify GTK installation
verify_gtk_installation() {
    echo "🔍 Verifying GTK4 installation..."
    
    # Check pkg-config
    if ! pkg-config --exists gtk4; then
        echo "⚠️  pkg-config cannot find GTK4, checking manual paths..."
        
        # Check header files
        if [ ! -f "/usr/include/gtk-4.0/gtk/gtk.h" ]; then
            echo "❌ GTK4 headers not found in /usr/include/gtk-4.0/"
            echo "Trying to locate headers..."
            find /usr -name "gtk.h" | grep gtk-4.0 || {
                echo "❌ Could not find GTK4 headers"
                exit 1
            }
        fi
        
        # Check library files
        if [ ! -f "/usr/lib/x86_64-linux-gnu/libgtk-4.so" ]; then
            echo "❌ GTK4 library not found in /usr/lib/x86_64-linux-gnu/"
            echo "Trying to locate library..."
            find /usr -name "libgtk-4.so" || {
                echo "❌ Could not find GTK4 library"
                exit 1
            }
        fi
    else
        echo "✅ GTK4 development files verified via pkg-config"
    fi
}

# Function to build the project
build_project() {
    echo "🏗️ Building application..."
    
    # Get compilation flags
    CFLAGS=$(pkg-config --cflags gtk4 2>/dev/null || echo "-I/usr/include/gtk-4.0 -I/usr/include/glib-2.0 -I/usr/lib/x86_64-linux-gnu/glib-2.0/include")
    LIBS=$(pkg-config --libs gtk4 2>/dev/null || echo "-lgtk-4 -lgobject-2.0 -lglib-2.0")
    
    # Compile with explicit paths
    gcc "$SOURCE_FILE" -o "$OUTPUT_NAME" \
        $CFLAGS \
        -L/usr/lib/x86_64-linux-gnu \
        $LIBS
    
    # Verify binary was created
    if [ ! -f "$OUTPUT_NAME" ]; then
        echo "❌ Compilation failed - binary not created"
        return 1
    fi
}

create_default_source() {
    if [ ! -f "$SOURCE_FILE" ]; then
        echo "📝 Creating default GTK4 application..."
        cat > "$SOURCE_FILE" << 'EOM'
EOM
    fi
}


# Main execution
main() {
    # Create source file if needed
    create_default_source

    # If a binary already exists and is executable, prefer to use it and skip build
    if [ -x "$OUTPUT_NAME" ]; then
        echo "🔎 Found existing binary at $OUTPUT_NAME, skipping build."
    else
        # Only verify/install GTK if we really need to build
        if ! pkg-config --exists gtk4 && [ ! -f "/usr/include/gtk-4.0/gtk/gtk.h" ]; then
            echo "⚠️  GTK4 dev files not found; build may fail. Proceeding to try build or fallback binary."
        else
            verify_gtk_installation
        fi

        if ! build_project; then
            echo "⚠️  Build failed. Attempting to use a prebuilt local binary as fallback..."
            if [ -x "./my_gtk_app" ]; then
                OUTPUT_NAME="./my_gtk_app"
                echo "✅ Using local binary: $OUTPUT_NAME"
            else
                echo "❌ No usable binary found to launch. Aborting."
                exit 1
            fi
        fi
    fi

    echo "🚀 Launching application: $OUTPUT_NAME"
    "$OUTPUT_NAME"
}

main
