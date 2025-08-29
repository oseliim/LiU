#!/bin/bash

RUN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Sobe 3 níveis para achar a pasta do autorun.sh
AUTORUN_DIR="$(cd "$RUN_DIR/../../" && pwd)"

# Caminho do venv criado pelo autorun.sh
VENV_PATH="$AUTORUN_DIR/.venv"
PYTHON_VENV="$VENV_PATH/bin/python"
PIP_VENV="$VENV_PATH/bin/pip"

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
    if ! $PYTHON_VENV -c "import flask" &> /dev/null; then
        echo "[INFO] Flask não encontrado. Instalando..."
        sudo $PIP_VENV install flask
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
    if ! $PYTHON_VENV -c "import cpuinfo" &> /dev/null; then
        echo "[INFO] cpuinfo não encontrado. Instalando..."
        $PIP_VENV install py-cpuinfo
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
    echo "[INFO] Verificando psutil..."
    if ! $PYTHON_VENV -c "import psutil" &> /dev/null; then
        echo "[INFO] psutil não encontrado. Instalando..."
        $PIP_VENV install psutil
        if [ $? -ne 0 ]; then
            echo "[ERRO] Falha ao instalar o psutil. Abortando."
            exit 1
        fi
    else
        echo "[INFO] psutil já está instalado."
    fi
}

# ---- Execução Principal ----

# Instala dependências
install_python_if_needed
install_pip_if_needed
install_flask_if_needed
install_cpuinfo_if_needed  # <-- Nova função adicionada
install_psutil_if_needed   # <-- Mais uma



# Executa a aplicação dentro do venv
"$PYTHON_VENV" "$RUN_DIR/main.py"

# Mantém o script rodando até que ambos os processos terminem
wait
