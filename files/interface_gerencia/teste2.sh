#!/bin/bash

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

# Instala o wakeonlan se necessário
install_wakeonlan_if_needed() {
    if ! command_exists wakeonlan; then
        echo "[INFO] wakeonlan não encontrado. Instalando..."
        sudo apt update
        sudo apt install -y wakeonlan
    else
        echo "[INFO] wakeonlan já está instalado."
    fi
}

# Instala o arp-scan se necessário
install_arp-scan_if_needed() {
    if ! command_exists arp-scan; then
        echo "[INFO] arp-scan não encontrado. Instalando..."
        sudo apt update
        sudo apt install -y arp-scan
    else
        echo "[INFO] arp-scan já está instalado."
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

# Instala o cpuinfo se necessário
install_cpuinfo_if_needed() {
    echo "[INFO] Verificando cpuinfo..."
    if ! python3 -c "import cpuinfo" &> /dev/null; then
        echo "[INFO] cpuinfo não encontrado. Instalando..."
        sudo pip3 install py-cpuinfo
        if [ $? -ne 0 ]; then
            echo "[ERRO] Falha ao instalar o cpuinfo. Abortando."
            exit 1
        fi
    else
        echo "[INFO] cpuinfo já está instalado."
    fi
}

# Instala o psutil se necessário
install_psutil_if_needed() {
    echo "[INFO] Verificando Flask..."
    if ! python3 -c "import psutil" &> /dev/null; then
        echo "[INFO] psutil não encontrado. Instalando..."
        sudo pip3 install psutil
        if [ $? -ne 0 ]; then
            echo "[ERRO] Falha ao instalar o psutil. Abortando."
            exit 1
        fi
    else
        echo "[INFO] psutil já está instalado."
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

# Instala o logging se necessário
install_logging_if_needed() {
    echo "[INFO] Verificando logging..."
    if ! python3 -c "import logging" &> /dev/null; then
        echo "[INFO] logging não encontrado. Instalando..."
        sudo pip3 install logging
        if [ $? -ne 0 ]; then
            echo "[ERRO] Falha ao instalar o logging. Abortando."
            exit 1
        fi
    else
        echo "[INFO] logging já está instalado."
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

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# ---- Execução Principal ----

# Instala dependências
install_python_if_needed
install_wakeonlan_if_needed
install_arp-scan_if_needed
install_pip_if_needed
install_flask_if_needed
install_cpuinfo_if_needed  # <-- Nova função adicionada
install_psutil_if_needed
install_subprocess_if_needed
install_os_if_needed
install_logging_if_needed
install_re_if_needed

pkexec python3 $DIR/app.py &  # Executa em segundo plano

# Aguarda um pouco para os servidores iniciarem
sleep 4

xdg-open "http://127.0.0.1:5000"

# Mantém o script rodando até que ambos os processos terminem
wait