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

# Função que retorna lista de partições NTFS não montadas (device full path)
get_unmounted_ntfs_parts(){
  root_src=$(findmnt -n -o SOURCE / || true)
  lsblk -rno NAME,FSTYPE,MOUNTPOINT | \
    awk -v rootsrc="$root_src" '
      $2 == "ntfs" && $3 == "" {
        dev="/dev/" $1
        if (dev != rootsrc) print dev
      }'
}

# Função que retorna espaço livre em uma partição NTFS (em bytes)
get_ntfs_free_space(){
  local partition="$1"
  local mountpoint="/mnt/check_ntfs_$$"
  
  mkdir -p "$mountpoint"
  
  # Tenta montar temporariamente para checar espaço
  if mount -t ntfs-3g "$partition" "$mountpoint" 2>/dev/null; then
    free_space=$(df "$mountpoint" | tail -n1 | awk '{print $4*1024}')
    umount "$mountpoint" || umount -l "$mountpoint" || true
    rmdir "$mountpoint" 2>/dev/null || true
    echo "$free_space"
  else
    rmdir "$mountpoint" 2>/dev/null || true
    echo "0"
  fi
}

# Função que escolhe partição NTFS com maior espaço livre
pick_largest_ntfs(){
  local parts=("$@")
  if [ "${#parts[@]}" -eq 0 ]; then
    return 1
  fi
  
  for p in "${parts[@]}"; do
    free=$(get_ntfs_free_space "$p" 2>/dev/null || echo 0)
    echo "$free $p"
  done | sort -nr | head -n1 | awk '{print $2}'
}

# Função que desmonta todas as partições NTFS montadas
unmount_all_ntfs_parts(){
  log "[INFO] Desmontando todas as partições NTFS..."
  
  # Encontra todos os pontos de montagem NTFS
  local ntfs_mounts=$(findmnt -rno TARGET,FSTYPE | awk '$2 == "ntfs" {print $1}' || true)
  
  if [ -z "$ntfs_mounts" ]; then
    log "[INFO] Nenhuma partição NTFS montada no momento"
    return 0
  fi
  
  while IFS= read -r mount_point; do
    if [ -n "$mount_point" ]; then
      log "[INFO] Desmontando $mount_point..."
      if umount "$mount_point" 2>/tmp/umount-ntfs-error.log; then
        log "[✅] $mount_point desmontado com sucesso"
      else
        log "[WARN] Tentando umount -l (lazy) em $mount_point..."
        umount -l "$mount_point" 2>/dev/null || true
        log "[INFO] Lazy umount enviado para $mount_point"
      fi
    fi
  done <<< "$ntfs_mounts"
  
  return 0
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

# Função que monta partição NTFS diretamente em /home
mount_home_from_ntfs(){
  local ntfs_part="$1"
  local username="$2"
  
  log "[INFO] Montando partição NTFS diretamente: $ntfs_part"
  
  # Obter tamanho da partição para log
  local part_size_gb=$(($(lsblk -nbo SIZE "$ntfs_part" 2>/dev/null || echo 0) / 1024 / 1024 / 1024))
  log "[INFO] Tamanho da partição: ${part_size_gb}GB"
  
  # Montar partição NTFS em /home
  log "[INFO] Montando $ntfs_part em /home..."
  if ! mount -t ntfs-3g "$ntfs_part" /home 2>/tmp/mount-home-ntfs-error.log; then
    log "[ERROR] Falha ao montar $ntfs_part em /home:"
    sed -n '1,200p' /tmp/mount-home-ntfs-error.log || true
    return 1
  fi
  
  log "[✅] Partição NTFS montada com sucesso em /home"
  
  # Criar diretório home do usuário
  if [ ! -d "/home/$username" ]; then
    log "[INFO] Criando /home/$username e copiando /etc/skel"
    mkdir -p "/home/$username"
    cp -rT /etc/skel "/home/$username" || true
  fi
  
  chown -R "$username:$username" "/home/$username" || true
  
  # Atualizar XDG dirs
  if command -v xdg-user-dirs-update >/dev/null 2>&1; then
    log "[INFO] Atualizando xdg-user-dirs para $username"
    runuser -u "$username" -- env HOME="/home/$username" xdg-user-dirs-update || true
  fi
  
  log "[SUCCESS] /home montado com NTFS para $username (${part_size_gb}GB). Serviço encerrando com sucesso."
  return 0
}


# Loop principal: continua tentanto até sucesso ou até não existir partição para montar
while true; do
  # ===== DESMONTAR TODAS AS PARTIÇÕES NTFS PRIMEIRO =====
  unmount_all_ntfs_parts
  
  # ===== TENTAR COM EXT4 PRIMEIRO =====
  parts=( $(get_unmounted_ext4_parts) )
  
  if [ "${#parts[@]}" -gt 0 ]; then
    log "[INFO] Partições ext4 não montadas encontradas. Processando..."
    
    # Detecta usuário real (ignora root/nobody/systemd)
    USERNAME=$(who | awk '{print $1}' | grep -vE '^(root|nobody|systemd)' | head -n1 || true)

    if [ -z "$USERNAME" ]; then
      log "[INFO] Nenhum usuário detectado no momento. Aguardando..."
      sleep "$RETRY_INTERVAL"
      continue
    fi

    log "[INFO] Usuário detectado: $USERNAME"

    # Escolher maior partição disponível
    PART=$(pick_largest "${parts[@]}" || true)
    if [ -z "$PART" ]; then
      log "[WARN] Não foi possível selecionar partição ext4. Retry em ${RETRY_INTERVAL}s."
      sleep "$RETRY_INTERVAL"
      continue
    fi

    log "[INFO] Partição ext4 selecionada: $PART"

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
  fi
  
  # ===== SE NÃO HOUVER EXT4, TENTAR COM NTFS =====
  log "[INFO] Nenhuma partição ext4 não montada encontrada. Verificando partições NTFS..."
  
  ntfs_parts=( $(get_unmounted_ntfs_parts) )
  
  if [ "${#ntfs_parts[@]}" -eq 0 ]; then
    log "[INFO] Nenhuma partição NTFS não montada encontrada. Encerrando serviço."
    exit 0
  fi
  
  log "[INFO] Partições NTFS não montadas encontradas: ${#ntfs_parts[@]}"
  
  # Detecta usuário real
  USERNAME=$(who | awk '{print $1}' | grep -vE '^(root|nobody|systemd)' | head -n1 || true)

  if [ -z "$USERNAME" ]; then
    log "[INFO] Nenhum usuário detectado no momento. Aguardando..."
    sleep "$RETRY_INTERVAL"
    continue
  fi

  log "[INFO] Usuário detectado: $USERNAME"
  
  # Escolher partição NTFS com maior espaço livre
  NTFS_PART=$(pick_largest_ntfs "${ntfs_parts[@]}" || true)
  
  if [ -z "$NTFS_PART" ]; then
    log "[WARN] Não foi possível selecionar partição NTFS. Retry em ${RETRY_INTERVAL}s."
    sleep "$RETRY_INTERVAL"
    continue
  fi
  
  # Proteção: não montar se já estiver montada
  if mountpoint -q /home; then
    log "[INFO] /home já está montado. Saindo com sucesso."
    exit 0
  fi
  
  # Tentar montar home via NTFS
  if mount_home_from_ntfs "$NTFS_PART" "$USERNAME"; then
    exit 0
  else
    log "[INFO] Falha ao montar via NTFS $NTFS_PART. Tentará novamente em ${RETRY_INTERVAL}s."
    sleep "$RETRY_INTERVAL"
    continue
  fi
done
