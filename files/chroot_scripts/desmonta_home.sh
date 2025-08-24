#!/bin/bash
set -euo pipefail

# 1. Detectar usuário real (ignora root/nobody/systemd)
USER=$(who | awk '{print $1}' | grep -vE '^(root|nobody|systemd)' | head -n1)
[ -z "$USER" ] && echo "[ERRO] Nenhum usuário válido encontrado." && exit 1

echo "[INFO] Usuário detectado: $USER"

# 2. Listar e analisar discos físicos e suas partições
mapfile -t ALL_DISKS < <(lsblk -ndo NAME,TYPE | awk '$2 == "disk" { print "/dev/" $1 }')

for d in "${ALL_DISKS[@]}"; do
  echo "Disco encontrado: $d"
  mapfile -t PARTICOES < <(lsblk -lnpo NAME,FSTYPE,LABEL "$d" | awk '$2 != "" { printf "  Partição: %s | FS: %s | Label: %s\n", $1, $2, ($3 == "" ? "<sem nome>" : $3) }')
  if [ "${#PARTICOES[@]}" -gt 0 ]; then
    printf '%s\n' "${PARTICOES[@]}"
  else
    echo "  [INFO] Nenhuma partição com FS detectada"
  fi
done

# 3. Selecionar maior partição ext4 disponível
echo "[INFO] Buscando partições ext4 disponíveis..."

mapfile -t EXT4_PARTS < <(
  lsblk -rno NAME,FSTYPE,SIZE,MOUNTPOINT | \
  awk '$2 == "ext4" && $4 == "" { printf "/dev/%s %s\n", $1, $3 }' | \
  sort -k2 -h -r
)

if [ "${#EXT4_PARTS[@]}" -eq 0 ]; then
  echo "[ERRO] Nenhuma partição ext4 disponível encontrada."
  exit 1
fi

PART=$(echo "${EXT4_PARTS[0]}" | awk '{print $1}')
DISCO="/dev/$(lsblk -no PKNAME "$PART")"
echo "[INFO] Maior partição ext4 disponível: $PART (disco: $DISCO)"

# 4. Desmontar /home atual (overlay, tmpfs, NFS etc.)
if mountpoint -q /home; then
  fstype=$(findmnt -n -o FSTYPE /home)
  if [[ "$fstype" != "ext4" ]]; then
    echo "[INFO] Desmontando /home ($fstype)"
    umount /home || umount -l /home || true
  fi
fi

# 5. Montar partição escolhida em /home
echo "[INFO] Montando $PART em /home"
mount "$PART" /home

# 6. Criar /home/$USER se não existir, e copiar /etc/skel
if [ ! -d "/home/$USER" ]; then
  echo "[INFO] Criando diretório /home/$USER e populando com /etc/skel"
  mkdir -p "/home/$USER"
  cp -rT /etc/skel "/home/$USER"
fi

chown -R "$USER:$USER" "/home/$USER"

# 7. Atualizar diretórios XDG
echo "[INFO] Atualizando diretórios do usuário com xdg-user-dirs-update"
sudo -u "$USER" env HOME="/home/$USER" xdg-user-dirs-update

echo "[✅] /home montado localmente com sucesso para o usuário $USER"