#!/usr/bin/env bash
# Script para instalar os arquivos no sistema

if [ "$EUID" -ne 0 ]; then
  echo "Por favor, execute este script como root (sudo)."
  exit 1
fi

INSTALL_DIR="/usr/share/windows-docker"
BIN_PATH="/usr/bin/windows"

echo "Criando diretório de instalação em $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"

echo "Copiando scripts..."
cp docker_up.sh "$INSTALL_DIR/"
cp start_windows.sh "$INSTALL_DIR/"

echo "Ajustando permissões..."
chmod +x "$INSTALL_DIR/docker_up.sh"
chmod +x "$INSTALL_DIR/start_windows.sh"

echo "Criando executável em $BIN_PATH..."
cat > "$BIN_PATH" << 'EOF'
#!/usr/bin/env bash

# O primeiro script requer sudo
echo "Executando configuração inicial (requer sudo)..."
sudo /usr/share/windows-docker/docker_up.sh

# O segundo script executa como o usuário normal
echo "Iniciando o container Windows..."
/usr/share/windows-docker/start_windows.sh "$@"
EOF

chmod +x "$BIN_PATH"

echo "Instalação concluída com sucesso!"
echo "Agora você pode usar o comando 'windows' no terminal."
