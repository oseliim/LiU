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
bash -x $DIR/files/interface_gerencia/teste2.sh
sleep 3

xdg-open "http://127.0.0.1:5001"
sleep 2
xdg-open "http://127.0.0.1:5000"

wait
