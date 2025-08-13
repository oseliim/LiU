#!/bin/bash

# =============================================
# Script: ipxe_menu.sh (preserva o estilo original do arquivo default)
# Objetivo: Gerar dinamicamente blocos LABEL para todas as imagens .img
#           e inserir esses blocos no local adequado do arquivo default.
# =============================================

# === Variáveis ===
SOURCE_PXE_DIR="pxelinux.cfg"
TARGET_PXE_DIR="/srv/tftp/ltsp/pxelinux.cfg"
TFTP_ROOT_DIR="/srv/tftp/ltsp"
IMAGES_DIR="/srv/ltsp/images"
DEFAULT_FILE_PATH="${TARGET_PXE_DIR}/default"
#SERVER_IP="192.168.1.1"  # Ajuste conforme necessário

# === Verificações Iniciais ===
if [[ "$(id -u)" -ne 0 ]]; then
    echo "❌ Este script precisa ser executado como root."
    exit 1
fi

if [[ ! -d "$SOURCE_PXE_DIR" ]]; then
    echo "❌ Diretório de origem '$SOURCE_PXE_DIR' não encontrado."
    exit 1
fi

if [[ ! -d "$IMAGES_DIR" ]]; then
    echo "❌ Diretório de imagens '$IMAGES_DIR' não encontrado."
    exit 1
fi

# === Preparação do Diretório PXE ===
echo "[INFO] Preparando diretório de destino: $TARGET_PXE_DIR"
mkdir -p "$TFTP_ROOT_DIR"
rm -rf "${TARGET_PXE_DIR:?}/"*
mkdir -p "$TARGET_PXE_DIR"

# === Cópia da Estrutura Base ===
cp -r "$SOURCE_PXE_DIR"/. "$TARGET_PXE_DIR/"
if [[ $? -ne 0 ]]; then
    echo "❌ Falha ao copiar a estrutura base do menu PXE."
    exit 1
fi

# === Armazena o conteúdo original sem entradas LABEL ===
LABEL_START_LINE=$(grep -n -m 1 "^LABEL " "$DEFAULT_FILE_PATH" | cut -d: -f1)

if [[ -z "$LABEL_START_LINE" ]]; then
    echo "❌ Arquivo default original não possui nenhuma entrada LABEL para servir de âncora."
    exit 1
fi

head -n $((LABEL_START_LINE - 1)) "$DEFAULT_FILE_PATH" > "${DEFAULT_FILE_PATH}.new"

# === Geração das novas entradas ===
declare -A seen_labels
echo "[INFO] Gerando entradas de boot para imagens encontradas em $IMAGES_DIR..."

for img_path in "$IMAGES_DIR"/*.img; do
    [[ -e "$img_path" ]] || continue

    image_file=$(basename "$img_path")
    image_label="${image_file%.img}"

    if [[ -n "${seen_labels[$image_label]:-}" ]]; then
        echo "[WARN] Label duplicada ignorada: $image_label"
        continue
    fi

    seen_labels["$image_label"]=1

    cat <<EOF >> "${DEFAULT_FILE_PATH}.new"
LABEL $image_label
  MENU LABEL $image_label
  KERNEL $image_label/vmlinuz
  INITRD ltsp.img,$image_label/initrd.img
  APPEND ro init=/sbin/init boot=ltsp root=/dev/nfs nfsroot=$SERVER_IP:/srv/ltsp/$image_label/ net.ifnames=0 biosdevname=0 ip=dhcp ltsp.image=images/$image_file

EOF

done

# === Substitui o arquivo default preservando o cabeçalho ===
mv "${DEFAULT_FILE_PATH}.new" "$DEFAULT_FILE_PATH"

# === Finalização ===
if [[ ${#seen_labels[@]} -eq 0 ]]; then
    echo "⚠️ Nenhuma imagem válida encontrada em $IMAGES_DIR."
else
    echo "[✅] Menu PXE criado com sucesso com ${#seen_labels[@]} imagem(ns):"
    printf ' - %s\n' "${!seen_labels[@]}"
fi

exit 0

