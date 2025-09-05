#!/bin/bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_PATH="files/app_flask/src/main.py"
VENV_PATH="$DIR/.venv"
PYTHON_VENV="$VENV_PATH/bin/python"
PIP_VENV="$VENV_PATH/bin/pip"

# Verifica se um comando existe
command_exists() {
    command -v "$1" &> /dev/null
}

# Instala pacotes do sistema se necessário (roda apenas como root)
install_system_deps() {
    echo "[INFO] Instalando dependências de sistema..."
    apt update
    apt install -y python3 python3-pip python3-venv ipcalc firefox
}

# Cria e inicializa o ambiente virtual
create_or_activate_venv() {
    rm -rf "$VENV_PATH"   # sempre recria
    echo "[INFO] Criando ambiente virtual Python em $VENV_PATH ..."
    python3 -m venv "$VENV_PATH"

    # Garante que o pip exista dentro do venv
    if [ ! -x "$PIP_VENV" ]; then
        echo "[INFO] Pip não encontrado dentro do venv. Instalando via ensurepip..."
        "$PYTHON_VENV" -m ensurepip --upgrade
    fi

    # Atualiza ferramentas básicas do venv
    "$PYTHON_VENV" -m pip install --upgrade pip setuptools wheel
}

# Instala o Flask no venv
install_flask_in_venv_if_needed() {
    echo "[INFO] Verificando Flask dentro do venv..."
    if ! "$PYTHON_VENV" -c "import flask" &>/dev/null; then
        echo "[INFO] Flask não encontrado no venv. Instalando..."
        "$PIP_VENV" install flask || {
            echo "[ERRO] Falha ao instalar o Flask no venv. Abortando."
            exit 1
        }
    else
        echo "[INFO] Flask já está instalado no venv."
    fi
}

# Função: checa se a porta 5001 está em uso
port_in_use() {
    if command_exists ss; then
        ss -ltn | grep -q ':5001 '
    else
        netstat -ltn 2>/dev/null | grep -q ':5001 '
    fi
}

# Bloco de execução - root instala dependências, depois relança como usuário comum
if [ "$EUID" -eq 0 ] && [ "$1" != "--as-user" ]; then
    install_system_deps
    chown -R "$SUDO_USER":"$SUDO_USER" "$DIR"
    if [[ -n "$SUDO_USER" ]]; then
        sudo -u "$SUDO_USER" bash "$0" --as-user
    else
        echo "[ERRO] Não foi possível identificar usuário comum."
        exit 1
    fi
    exit 0
fi

# --- Executa como usuário comum daqui para frente ---
create_or_activate_venv
install_flask_in_venv_if_needed

if port_in_use; then
    echo "[INFO] Porta 5001 já está em uso. Não iniciaremos o Flask."
else
    echo "[INFO] Iniciando aplicação Flask dentro do ambiente virtual..."
    sudo "$PYTHON_VENV" "$DIR/$APP_PATH" &
fi
# Executa o script de run.sh para abrir o Flask do instalador
./files/app_flask/src/run.sh

# Caminhos para atalhos
USER_HOME="$HOME"
APPLICATIONS_PATH="$USER_HOME/.local/share/applications"
DESKTOP_PATH="$USER_HOME/Desktop"
[ -d "$USER_HOME/Área de Trabalho" ] && DESKTOP_PATH="$USER_HOME/Área de Trabalho"
[ -d "$DESKTOP_PATH" ] || DESKTOP_PATH="$DIR"

# Criação de atalhos
mkdir -p "$APPLICATIONS_PATH"

cat > "$APPLICATIONS_PATH/Gerencia.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Interface de Gerenciamento
Comment=Atalho para abrir a Gerencia
Exec=$DIR/files/open_gerencia.sh
Icon=$DIR/files/LIFTO_ICON_NEW.png
Terminal=false
EOF

cat > "$APPLICATIONS_PATH/Instalador.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Instalador
Comment=Atalho para abrir o Instalador
Exec=$DIR/files/open_instalador.sh
Icon=$DIR/files/LiU_ICONs/Lifto_instalação_icon.png
Terminal=false
EOF

chmod +x "$DIR/files/open_gerencia.sh"
chmod +x "$DIR/files/open_instalador.sh"
chmod +x "$APPLICATIONS_PATH/Gerencia.desktop"
chmod +x "$APPLICATIONS_PATH/Instalador.desktop"

echo "[INFO] Atalhos criados em: $APPLICATIONS_PATH"

# Cria service
chmod +x "$DIR/files/create_service.sh"
sudo "$DIR/files/create_service.sh"

# Abre o navegador no Flask
firefox --new-tab "http://127.0.0.1:5001" &
