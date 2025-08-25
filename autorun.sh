#!/bin/bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_PATH="files/app_flask/src/main.py"

# Verifica se um comando existe
command_exists() {
    command -v "$1" &> /dev/null
}

# Instala o Python 3 se necessário
install_python_if_needed() {
    if ! command_exists python3; then
        echo "[INFO] Python3 não encontrado. Instalando..."
        sudo apt update
        sudo apt install -y python3
    else
        echo "[INFO] Python3 já está instalado."
    fi
}

# Instala o pip3 se necessário
install_pip_if_needed() {
    if ! command_exists pip3; then
        echo "[INFO] pip3 não encontrado. Instalando..."
        sudo apt install -y python3-pip
    else
        echo "[INFO] pip3 já está instalado."
    fi
}

# Instala o Flask se necessário
install_flask_if_needed() {
    echo "[INFO] Verificando Flask..."
    if ! python3 -c "import flask" &> /dev/null; then
        echo "[INFO] Flask não encontrado. Instalando..."
        sudo pip3 install flask
        if [ $? -ne 0 ]; then
            echo "[ERRO] Falha ao instalar o Flask. Abortando."
            exit 1
        fi
    else
        echo "[INFO] Flask já está instalado."
    fi
}

# ---- Execução ----

install_python_if_needed
install_pip_if_needed
install_flask_if_needed

echo "[INFO] Iniciando aplicação Flask com pkexec..."
pkexec python3 "$DIR/$APP_PATH" &

# Define a variável com o caminho da área de trabalho
DESKTOP_PATH=""

# Verifica se o diretório "Desktop" existe
if [ -d "$HOME/Desktop" ]; then
    DESKTOP_PATH="$HOME/Desktop"
# Se não, verifica se o diretório "Área de Trabalho" existe
elif [ -d "$HOME/Área de Trabalho" ]; then
    DESKTOP_PATH="$HOME/Área de Trabalho"
fi

# Verifica se o caminho foi encontrado antes de continuar
if [ -z "$DESKTOP_PATH" ]; then
    echo "Não foi possível encontrar o diretório 'Desktop' ou 'Área de Trabalho'."
    echo "Por favor, verifique o nome da sua pasta de área de trabalho e ajuste o script."
    exit 1
fi

# Cria o arquivo .desktop no caminho correto
echo "[Desktop Entry]
Version=1.0
Type=Application
Name=Interface de Gerenciamento
Comment=Atalho para abrir a Gerencia
Exec=$DIR/files/open_gerencia.sh
Icon=$DIR/files/LIFTO_ICON_NEW.png
Terminal=false" > "$DESKTOP_PATH/Gerencia.desktop"

# Adiciona permissão de execução
pkexec chmod +x "$DESKTOP_PATH/Gerencia.desktop"

echo "O atalho 'Gerencia.desktop' foi criado com sucesso em: $DESKTOP_PATH"

pkexec $DIR/files/create_service.sh

xdg-open "http://127.0.0.1:5001"
sleep 2

wait
