#!/bin/bash
# Script para sobrescrever o .bashrc do usuário com a versão padrão
# Execute isso apenas como root (ou durante o boot)

ARQUIVO_PADRAO="/etc/skel/.bashrc"
RETRY_INTERVAL=10

# Detecta usuário real (ignora root/nobody/systemd) da mesma forma que o mount_home.sh
while true; do
    USUARIO=$(who | awk '{print $1}' | grep -vE '^(root|nobody|systemd)' | head -n1 || true)
    if [ -n "$USUARIO" ]; then
        break
    fi
    sleep "$RETRY_INTERVAL"
done

DIRETORIO_HOME="/home/$USUARIO"

# Verifica se o diretório do usuário existe antes de tentar copiar
if [ -d "$DIRETORIO_HOME" ]; then
    cp "$ARQUIVO_PADRAO" "$DIRETORIO_HOME/.bashrc"
    
    # Garante que o arquivo pertença ao usuário e tenha as permissões corretas
    chown "$USUARIO:$USUARIO" "$DIRETORIO_HOME/.bashrc"
    chmod 644 "$DIRETORIO_HOME/.bashrc"
fi
