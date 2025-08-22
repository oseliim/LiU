#!/bin/bash

# =============================================
# Script: user_conf.sh
# Objetivo: Criar usuário com /home e Bash com senha personalizada
#           e registrar o par usuário:senha em /tmp/user_data.txt
# =============================================

# Verifica se é root
if [ "$(id -u)" -ne 0 ]; then
    echo "Este script precisa ser executado como root." >&2
    exit 1
fi

if [ -z "$1" ]; then
    echo "Uso: $0 <nome_do_usuario> [senha]"
    exit 1
fi

USUARIO="$1"
# Se a senha não for fornecida, usa o nome de usuário como senha
SENHA="${2:-$USUARIO}"
USER_DATA_FILE="tmp/user_data.txt"

# Garante que o diretório /tmp exista (geralmente existe)
mkdir -p /tmp

# Verifica se o usuário já existe no sistema
if id "$USUARIO" &>/dev/null; then
    echo "⚠️  O usuário '$USUARIO' já existe no sistema."
    # Atualiza a senha do sistema
    echo "$USUARIO:$SENHA" | chpasswd
    echo "✅ Senha atualizada para o usuário '$USUARIO' no sistema."

    # Atualiza ou adiciona a entrada no user_data.txt
    # Remove a linha antiga se existir (para evitar duplicatas com senhas diferentes)
    grep -v "^${USUARIO}:" "$USER_DATA_FILE" > "${USER_DATA_FILE}.tmp" || true # Ignora erro se o arquivo não existir ou estiver vazio
    mv "${USER_DATA_FILE}.tmp" "$USER_DATA_FILE"
    # Adiciona a nova entrada
    echo "${USUARIO}:${SENHA}" >> "$USER_DATA_FILE"
    echo "🔄 Entrada atualizada/adicionada para '$USUARIO' em $USER_DATA_FILE."

else
    # Cria o usuário com /home e bash
    useradd -m -s /bin/bash "$USUARIO"
    if [[ $? -ne 0 ]]; then
        echo "❌ Falha ao criar o usuário '$USUARIO' no sistema."
        exit 1
    fi
    echo "$USUARIO:$SENHA" | chpasswd
    if [[ $? -ne 0 ]]; then
        echo "❌ Falha ao definir a senha para o usuário '$USUARIO' no sistema."
        # Considerar remover o usuário recém-criado ou tratar o erro
    else
        echo "✅ Usuário '$USUARIO' criado com senha personalizada no sistema."
    fi

    # Adiciona aos grupos padrão
    usermod -aG audio,video,cdrom,plugdev,netdev "$USUARIO"
    echo "➕ Adicionado aos grupos padrão: audio, video, cdrom, plugdev, netdev"

    # Adiciona a entrada no user_data.txt (apenas se não existir)
    if ! grep -q "^${USUARIO}:" "$USER_DATA_FILE" 2>/dev/null; then
        echo "${USUARIO}:${SENHA}" >> "$USER_DATA_FILE"
        echo "➕ Entrada adicionada para '$USUARIO' em $USER_DATA_FILE."
    else
        echo "ℹ️ Entrada para '$USUARIO' já existe em $USER_DATA_FILE. Nenhuma alteração feita no arquivo."
        # Se chegou aqui, significa que o usuário não existia no sistema, mas existia no arquivo.
        # Poderia optar por atualizar a senha no arquivo aqui também, como no bloco 'if id ...'
        # Para consistência, vamos atualizar como no outro bloco:
        grep -v "^${USUARIO}:" "$USER_DATA_FILE" > "${USER_DATA_FILE}.tmp"
        mv "${USER_DATA_FILE}.tmp" "$USER_DATA_FILE"
        echo "${USUARIO}:${SENHA}" >> "$USER_DATA_FILE"
        echo "🔄 Entrada atualizada para '$USUARIO' em $USER_DATA_FILE (caso raro: usuário não existia no sistema mas existia no arquivo)."
    fi
fi

echo "🎉 Processo concluído para o usuário '$USUARIO'!"

