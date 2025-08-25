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
    python3 -c "import psutil" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "psutil não encontrado. Instalando..."
        pip3 install psutil
    else
        echo "psutil já está instalado."
    fi
}

# ---- Execução Principal ----

# Instala dependências
install_python_if_needed
install_pip_if_needed
install_flask_if_needed
install_cpuinfo_if_needed  # <-- Nova função adicionada
install_psutil_if_needed   # <-- Mais uma

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" #Encontra o caminho do arquivo (adicionado 15/08/2025)

python3 "$DIR/app.py" & #Roda em background

# Mantém o script rodando até que ambos os processos terminem
wait
