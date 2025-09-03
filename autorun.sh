#!/bin/bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_PATH="files/app_flask/src/main.py"
VENV_PATH="$DIR/.venv"
PYTHON_VENV="$VENV_PATH/bin/python"
PIP_VENV="$VENV_PATH/bin/pip"

# ==============================
# FUNÇÕES
# ==============================

# Mostra mensagem no Zenity
progress_msg() {
    echo "# $1"
}

# Verifica se comando existe
command_exists() {
    command -v "$1" &> /dev/null
}

# Instala dependências do sistema
install_system_deps() {
    progress_msg "Verificando dependências do sistema..."
    apt update -y
    apt install -y python3 python3-pip python3-venv python3.12-venv
}

# Cria/ativa o ambiente virtual
create_or_activate_venv() {
    progress_msg "Preparando ambiente virtual..."
    if [ ! -d "$VENV_PATH" ]; then
        python3 -m venv "$VENV_PATH"
        chmod -R 755 "$VENV_PATH"
    fi
    "$PYTHON_VENV" -m ensurepip --upgrade
    "$PYTHON_VENV" -m pip install --upgrade pip setuptools wheel
}

# Instala Flask se não estiver presente
install_flask_in_venv_if_needed() {
    progress_msg "Verificando instalação do Flask..."
    if ! "$PYTHON_VENV" -c "import flask" &>/dev/null; then
        "$PIP_VENV" install flask
    fi
}

# Verifica se porta está em uso
port_in_use() {
    if command_exists ss; then
        ss -ltn | grep -q ':5001 '
    else
        netstat -ltn 2>/dev/null | grep -q ':5001 '
    fi
}

# ==============================
# BLOCO ROOT
# ==============================
if [ "$EUID" -eq 0 ] && [ "$1" != "--as-user" ]; then
    (
        install_system_deps
        create_or_activate_venv
        install_flask_in_venv_if_needed

        progress_msg "Criando serviço..."
        chmod +x "$DIR/files/create_service.sh"
        "$DIR/files/create_service.sh"

        if port_in_use; then
            progress_msg "Flask já está em execução na porta 5001."
        else
            progress_msg "Iniciando aplicação Flask..."
            "$PYTHON_VENV" "$DIR/$APP_PATH" &
            sleep 2
        fi

        progress_msg "Carregamento concluído!"
        sleep 1

        # Completa barra de progresso e fecha Zenity
        echo "100"
        exit 0
    ) | zenity --progress \
        --title="Instalação e Inicialização" \
        --text="Preparando ambiente..." \
        --pulsate \
        --auto-close \
        --no-cancel \
        --width=400 \
        --height=120

    # Executa bloco usuário comum
    if [[ -n "$SUDO_USER" ]]; then
        exec sudo -u "$SUDO_USER" bash "$0" --as-user
    else
        zenity --error --text="Não foi possível identificar usuário comum."
        exit 1
    fi
fi

# ==============================
# BLOCO USUÁRIO NORMAL
# ==============================
USER_HOME="$HOME"
APPLICATIONS_PATH="$USER_HOME/.local/share/applications"

mkdir -p "$APPLICATIONS_PATH"

# Cria atalhos
cat > "$APPLICATIONS_PATH/Gerencia.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Interface de Gerenciamento
Exec=$DIR/files/open_gerencia.sh
Icon=$DIR/files/LIFTO_ICON_NEW.png
Terminal=false
EOF

cat > "$APPLICATIONS_PATH/Instalador.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Instalador
Exec=$DIR/files/open_instalador.sh
Icon=$DIR/files/LiU_ICONs/Lifto_instalação_icon.png
Terminal=false
EOF

chmod +x "$DIR/files/open_gerencia.sh"
chmod +x "$DIR/files/open_instalador.sh"
chmod +x "$APPLICATIONS_PATH/Gerencia.desktop"
chmod +x "$APPLICATIONS_PATH/Instalador.desktop"

# Abre navegador sem interferir no Zenity
google-chrome "http://127.0.0.1:5001" &

