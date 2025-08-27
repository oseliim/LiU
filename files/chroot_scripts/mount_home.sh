#!/bin/bash
set -euo pipefail

log(){ echo "[$(date +'%F %T')] $*"; }

# Intervalo entre tentativas (segundos)
RETRY_INTERVAL=10

# Função que retorna lista de partições ext4 não montadas (device full path)
get_unmounted_ext4_parts(){
  # Exclude loops, ram, and partitions already mounted; exclude rootfs source
  root_src=$(findmnt -n -o SOURCE / || true)
  lsblk -rno NAME,FSTYPE,MOUNTPOINT | \
    awk -v rootsrc="$root_src" '
      $2 == "ext4" && $3 == "" {
        dev="/dev/" $1
        if (dev != rootsrc) print dev
      }'
}

# Função que escolhe "maior" partição da lista (por size)
pick_largest(){
  local parts=("$@")
  if [ "${#parts[@]}" -eq 0 ]; then
    return 1
  fi
  # Print size and pick top
  for p in "${parts[@]}"; do
    size=$(lsblk -nbo SIZE "$p" 2>/dev/null || echo 0)
    echo "$size $p"
  done | sort -nr | head -n1 | awk '{print $2}'
}

# Loop principal: continua tentanto até sucesso ou até não existir partição para montar
while true; do
  parts=( $(get_unmounted_ext4_parts) )
  if [ "${#parts[@]}" -eq 0 ]; then
    log "[INFO] Nenhuma partição ext4 não montada encontrada. Encerrando serviço."
    exit 0
  fi

  # Detecta usuário real (ignora root/nobody/systemd)
  USERNAME=$(who | awk '{print $1}' | grep -vE '^(root|nobody|systemd)' | head -n1 || true)

  if [ -z "$USERNAME" ]; then
    log "[INFO] Nenhum usuário detectado no momento. Existem partições para montar, aguardando usuário..."
    sleep "$RETRY_INTERVAL"
    continue
  fi

  log "[INFO] Usuário detectado: $USERNAME"

  # Escolher maior partição disponível
  PART=$(pick_largest "${parts[@]}" || true)
  if [ -z "$PART" ]; then
    log "[WARN] Não foi possível selecionar partição. Retry em ${RETRY_INTERVAL}s."
    sleep "$RETRY_INTERVAL"
    continue
  fi

  log "[INFO] Partição selecionada: $PART"

  # Proteção: não montar se já estiver montada por algum motivo
  if mountpoint -q /home; then
    log "[INFO] /home já está montado. Saindo com sucesso."
    exit 0
  fi

  # Tenta desmontar qualquer montagem temporária em /home que não seja ext4
  if mountpoint -q /home; then
    fstype=$(findmnt -n -o FSTYPE /home || true)
    if [[ "$fstype" != "ext4" ]]; then
      log "[INFO] Desmontando /home (fstype=$fstype)"
      umount /home || umount -l /home || true
    fi
  fi

  # Tenta montar
  log "[INFO] Tentando montar $PART em /home..."
  if mount "$PART" /home 2>/tmp/mount-home-error.log; then
    log "[✅] Montagem de $PART em /home realizada com sucesso."

    # Criar usuário home se não existir
    if [ ! -d "/home/$USERNAME" ]; then
      log "[INFO] Criando /home/$USERNAME e copiando /etc/skel"
      mkdir -p "/home/$USERNAME"
      cp -rT /etc/skel "/home/$USERNAME" || true
    fi

    chown -R "$USERNAME:$USERNAME" "/home/$USERNAME" || true

    # Atualizar XDG dirs (rodar como usuário)
    if command -v xdg-user-dirs-update >/dev/null 2>&1; then
      log "[INFO] Atualizando xdg-user-dirs para $USERNAME"
      runuser -u "$USERNAME" -- env HOME="/home/$USERNAME" xdg-user-dirs-update || true
    fi

    log "[SUCCESS] /home montado e configurado para $USERNAME. Serviço encerrando com sucesso."
    exit 0
  else
    log "[ERROR] Falha ao montar $PART. Conteúdo de /tmp/mount-home-error.log:"
    sed -n '1,200p' /tmp/mount-home-error.log || true
    log "[INFO] Tentará novamente em ${RETRY_INTERVAL}s."
    sleep "$RETRY_INTERVAL"
    continue
  fi
done
