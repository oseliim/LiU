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

# Cria e ativa o ambiente virtual Python (venv)
create_and_activate_venv() {
    VENV_PATH="$DIR/venv"
    if [ ! -d "$VENV_PATH" ]; then
        echo "[INFO] Ambiente virtual não encontrado. Criando em $VENV_PATH..."
        python3 -m venv "$VENV_PATH"
    else
        echo "[INFO] Ambiente virtual já existe em $VENV_PATH."
    fi
    # Ativa o venv para o shell atual
    source "$VENV_PATH/bin/activate"
}

# Instala o Flask no venv se necessário
install_flask_in_venv() {
    echo "[INFO] Verificando Flask no ambiente virtual..."
    if ! "$VENV_PATH/bin/python" -c "import flask" &> /dev/null; then
        echo "[INFO] Flask não encontrado no venv. Instalando..."
        "$VENV_PATH/bin/pip" install flask
        if [ $? -ne 0 ]; then
            echo "[ERRO] Falha ao instalar o Flask no venv. Abortando."
            exit 1
        fi
    else
        echo "[INFO] Flask já está instalado no venv."
    fi
}

# Instala o subprocess se necessário
install_subprocess_if_needed() {
    echo "[INFO] Verificando subprocess..."
    if ! python3 -c "import subprocess" &> /dev/null; then
        echo "[INFO] subprocess não encontrado. Instalando..."
        sudo pip3 install subprocess
        if [ $? -ne 0 ]; then
            echo "[ERRO] Falha ao instalar o subprocess. Abortando."
            exit 1
        fi
    else
        echo "[INFO] subprocess já está instalado."
    fi
}

# Instala o os se necessário
install_os_if_needed() {
    echo "[INFO] Verificando os..."
    if ! python3 -c "import os" &> /dev/null; then
        echo "[INFO] os não encontrado. Instalando..."
        sudo pip3 install os
        if [ $? -ne 0 ]; then
            echo "[ERRO] Falha ao instalar o os. Abortando."
            exit 1
        fi
    else
        echo "[INFO] os já está instalado."
    fi
}

# Instala o re se necessário
install_re_if_needed() {
    echo "[INFO] Verificando re..."
    if ! python3 -c "import re" &> /dev/null; then
        echo "[INFO] re não encontrado. Instalando..."
        sudo pip3 install re
        if [ $? -ne 0 ]; then
            echo "[ERRO] Falha ao instalar o re. Abortando."
            exit 1
        fi
    else
        echo "[INFO] re já está instalado."
    fi
}

# ---- Execução ----

install_python_if_needed
install_pip_if_needed
create_and_activate_venv
install_flask_in_venv
install_os_if_needed
install_subprocess_if_needed
install_re_if_needed

echo "[INFO] Iniciando aplicação Flask com pkexec..."
pkexec python3 "$DIR/$APP_PATH" &
bash -x $DIR/files/interface_gerencia/teste2.sh
sleep 3

xdg-open "http://127.0.0.1:5001"
sleep 2
xdg-open "http://127.0.0.1:5000"

wait
