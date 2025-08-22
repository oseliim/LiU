#!/bin/bash

# Uso: ./script.sh <usuario> <ip>
if [ $# -lt 2 ]; then
  echo "Uso: $0 <usuario> <ip_destino>"
  exit 1
fi

user="$1"
ip="$2"
dest_dir="/home/$user/Documentos"
source_file="/home/tandson/Documents/1734981101018.png"

# Atualiza chave SSH do cliente
ssh-keygen -R "$ip" -f /root/.ssh/known_hosts >/dev/null 2>&1
ssh-keyscan -H "$ip" >> /root/.ssh/known_hosts 2>/dev/null

# Garante que o diretório exista no cliente
sshpass -p "$user" ssh -o StrictHostKeyChecking=no "$user@$ip" "mkdir -p \"$dest_dir\""

# Copia o arquivo
echo "[INFO] Enviando arquivo para $user@$ip:$dest_dir"
if sshpass -p "$user" scp -o StrictHostKeyChecking=no $source_file $user@$ip:$dest_dir; then
  echo "✅ Arquivo copiado com sucesso."
else
  echo "❌ Falha ao copiar arquivo para $ip"
fi