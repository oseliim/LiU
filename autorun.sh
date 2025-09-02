#!/bin/bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_PATH="files/app_flask/src/main.py"
VENV_PATH="$DIR/.venv"
PYTHON_VENV="$VENV_PATH/bin/python"
PIP_VENV="$VENV_PATH/bin/pip"

rm -r "$VENV_PATH"
apt install -y ipcalc

# Verifica se um comando existe
command_exists() {
    command -v "$1" &> /dev/null
}

# Instala pacotes do sistema se necessário (roda apenas como root)
install_system_deps() {
    if ! command_exists python3; then
        echo "[INFO] Python3 não encontrado. Instalando..."
        apt update && apt install -y python3
    else
        echo "[INFO] Python3 já está instalado."
    fi

    if ! command_exists pip3; then
        echo "[INFO] pip3 não encontrado. Instalando..."
        apt install -y python3-pip
    else
        echo "[INFO] pip3 já está instalado."
    fi

    if ! python3 -c "import venv" &>/dev/null; then
        echo "[INFO] python3-venv não encontrado. Instalando..."
        apt install -y python3-venv
    else
        echo "[INFO] python3-venv já está instalado."
    fi
        apt install -y python3.12-venv
}

# Cria e inicializa o ambiente virtual, se necessário
create_or_activate_venv() {
    if [ ! -d "$VENV_PATH" ]; then
        echo "[INFO] Criando ambiente virtual Python em $VENV_PATH ..."
        sudo python3 -m venv "$VENV_PATH"
        sudo chmod -R 755 "$VENV_PATH"
    else
        echo "[INFO] Ambiente virtual Python já existe em $VENV_PATH."
    fi

    # Garante que o pip exista dentro do venv
    if [ ! -x "$PIP_VENV" ]; then
        echo "[INFO] Pip não encontrado dentro do venv. Instalando via ensurepip..."
        "$PYTHON_VENV" -m ensurepip --upgrade
    fi

    # Atualiza ferramentas básicas do venv
    "$PYTHON_VENV" -m pip install --upgrade pip setuptools wheel
}

# Instala o Flask no venv se necessário
install_flask_in_venv_if_needed() {
    echo "[INFO] Verificando Flask dentro do venv..."
    if ! "$PYTHON_VENV" -c "import flask" &>/dev/null; then
        echo "[INFO] Flask não encontrado no venv. Instalando..."
        "$PIP_VENV" install flask
        if [ $? -ne 0 ]; then
            echo "[ERRO] Falha ao instalar o Flask no venv. Abortando."
            exit 1
        fi
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

# Bloco de execução - root: instala dependências, depois relança como usuário comum
if [ "$EUID" -eq 0 ] && [ "$1" != "--as-user" ]; then
    install_system_deps
    # Relança script como usuário comum para o resto
    if [[ -n "$SUDO_USER" ]]; then
        sudo -u "$SUDO_USER" bash "$0" --as-user
    else
        echo "[ERRO] Não foi possível identificar usuário comum."
        exit 1
    fi
    exit 0
fi

# Resto: executa como usuário comum
create_or_activate_venv
install_flask_in_venv_if_needed

if port_in_use; then
    echo "[INFO] Porta 5001 já está em uso. Não iniciaremos o Flask."
else
    echo "[INFO] Iniciando aplicação Flask dentro do ambiente virtual..."
    pkexec "$PYTHON_VENV" "$DIR/$APP_PATH" &
fi

# Define a variável com o caminho da área de trabalho, usuário comum
USER_HOME="$HOME"
DESKTOP_PATH=""
APPLICATIONS_PATH="$USER_HOME/.local/share/applications"
if [ -d "$USER_HOME/Desktop" ]; then
    DESKTOP_PATH="$USER_HOME/Desktop"
elif [ -d "$USER_HOME/Área de Trabalho" ]; then
    DESKTOP_PATH="$USER_HOME/Área de Trabalho"
fi
if [ -z "$DESKTOP_PATH" ]; then
    echo "[WARN] Não foi possível encontrar o diretório 'Desktop' ou 'Área de Trabalho'. Usando diretório atual como fallback."
    DESKTOP_PATH="$DIR"
fi

# Cria o arquivo .desktop no caminho correto do menu de aplicativos DO usuário
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

# Cria o arquivo .desktop no caminho correto do menu de aplicativos DO usuário
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

echo "Os atalhos foram criados com sucesso em: $APPLICATIONS_PATH"

chmod +x "$DIR/files/create_service.sh"
pkexec "$DIR/files/create_service.sh"

# Abre o navegador
#sudo apt install firefox -y
google-chrome "http://127.0.0.1:5001" &
#firefox --new-tab "http://127.0.0.1:5001" 
sleep 2

wait
