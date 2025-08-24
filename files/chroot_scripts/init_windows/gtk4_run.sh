#!/bin/bash
# GTK4 Application Compiler and Runner

set -e

# Configuration
SOURCE_FILE="${1:-interface_simples_gtk.c}"
OUTPUT_NAME="${2:-gtk_app}"
IMAGE_FILE="image.jpg"

# Set environment paths
export PKG_CONFIG_PATH="/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/local/lib/pkgconfig:/usr/share/pkgconfig:$PKG_CONFIG_PATH"
export LD_LIBRARY_PATH="/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"

# Function to compile GTK4 application
compile_app() {
    echo "🏗️ Compiling GTK4 application..."
    
    # Get compilation flags using pkg-config
    CFLAGS=$(pkg-config --cflags gtk4)
    LIBS=$(pkg-config --libs gtk4)
    
    # Compile with optimization and warnings
    gcc "$SOURCE_FILE" -o "$OUTPUT_NAME" \
        $CFLAGS \
        -O2 -Wall -Wextra \
        -L/usr/lib/x86_64-linux-gnu \
        $LIBS \
        -lm
    
    echo "✅ Successfully compiled: $OUTPUT_NAME"
}

# Function to run the application
run_app() {
    echo "🚀 Launching application..."
    
    # Check for background image
    if [ ! -f "$IMAGE_FILE" ]; then
        echo "⚠️  Background image not found: $IMAGE_FILE"
        echo "    Using default color background"
    fi
    
    # Execute the application
    ./"$OUTPUT_NAME"
}

# Verify requirements
verify_dependencies() {
    echo "🔍 Checking dependencies..."
    
    # Check compiler
    if ! command -v gcc &> /dev/null; then
        echo "❌ GCC compiler not found!"
        exit 1
    fi
    
    # Check pkg-config
    if ! command -v pkg-config &> /dev/null; then
        echo "❌ pkg-config not found!"
        exit 1
    fi
    
    # Check GTK4
    if ! pkg-config --exists gtk4; then
        echo "❌ GTK4 development files not installed!"
        exit 1
    fi
    
    echo "✅ All dependencies verified"
}

# Main execution flow
main() {
    echo "=== GTK4 Application Runner ==="
    echo "Source: $SOURCE_FILE"
    echo "Output: $OUTPUT_NAME"
    echo "=============================="
    
    verify_dependencies
    compile_app
    run_app
}

# Start the script
main
