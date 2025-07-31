#!/bin/bash
set -euo pipefail

# 1. Detectar usuário real (ignora root/nobody/systemd)
USER=$(who | awk '{print $1}' | grep -vE '^(root|nobody|systemd)' | head -n1)
[ -z "$USER" ] && echo "[ERRO] Nenhum usuário válido encontrado." && exit 1

echo "[INFO] Usuário detectado: $USER"

# 2. Listar e analisar discos físicos
mapfile -t ALL_DISKS < <(lsblk -ndo NAME,TYPE | awk '$2 == "disk" { print "/dev/" $1 }')

for d in "${ALL_DISKS[@]}"; do
  PART="${d}1"
  fs=$(lsblk -no FSTYPE "$PART" 2>/dev/null || echo "Nenhum")
  label=$(lsblk -no LABEL "$PART" 2>/dev/null || echo "")
  echo
  echo "Disco encontrado: $d"
  echo "  Partição: $PART"
  echo "  FS: ${fs:-Desconhecido} | Label: ${label:-<sem nome>}"

  #read -rp "👉 Deseja usar este disco para montar /home? [s/N]: " resposta
  resposta="s"
  if [[ "$resposta" =~ ^[Ss]$ ]]; then
    DISCOS+=("$d")
  fi
done

# 3. Validar escolha
if [ "${#DISCOS[@]}" -eq 0 ]; then
  echo "[ABORTADO] Nenhum disco selecionado para uso."
  exit 0
fi

DISCO="${DISCOS[0]}"
PART="${DISCO}1"

# 4. Criar e formatar partição, se necessário
if ! lsblk -no FSTYPE "$PART" 2>/dev/null | grep -q ext4; then
  echo "[INFO] Criando partição ext4 em $PART..."
  parted "$DISCO" --script mklabel gpt mkpart primary ext4 0% 100%
  mkfs.ext4 -F "$PART"
else
  echo "[INFO] Partição $PART já formatada com ext4"
fi

# 5. Desmontar /home atual (overlay, tmpfs, NFS etc.)
if mountpoint -q /home; then
  fstype=$(findmnt -n -o FSTYPE /home)
  if [[ "$fstype" != "ext4" ]]; then
    echo "[INFO] Desmontando /home ($fstype)"
    umount /home || umount -l /home || true
  fi
fi

# 6. Montar partição escolhida em /home
echo "[INFO] Montando $PART em /home"
mount "$PART" /home

# 7. Criar /home/$USER se não existir, e copiar /etc/skel
if [ ! -d "/home/$USER" ]; then
  echo "[INFO] Criando diretório /home/$USER e populando com /etc/skel"
  mkdir -p "/home/$USER"
  cp -rT /etc/skel "/home/$USER"
fi

chown -R "$USER:$USER" "/home/$USER"

# 8. Atualizar diretórios XDG
echo "[INFO] Atualizando diretórios do usuário com xdg-user-dirs-update"
sudo -u "$USER" env HOME="/home/$USER" xdg-user-dirs-update

echo "[✅] /home montado localmente com sucesso para o usuário $USER"