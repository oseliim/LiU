#!/bin/bash

# =============================================
# Script: ipxe_menu.sh (formato validado e compatível)
# Objetivo: Gerar dinamicamente entradas PXE 100% compatíveis
# =============================================

SOURCE_PXE_DIR="pxelinux.cfg"
TARGET_PXE_DIR="/srv/tftp/ltsp/pxelinux.cfg"
TFTP_ROOT_DIR="/srv/tftp/ltsp"
IMAGES_DIR="/srv/ltsp/images"
DEFAULT_FILE_PATH="${TARGET_PXE_DIR}/default"


if [[ "$(id -u)" -ne 0 ]]; then
    echo "❌ Este script precisa ser executado como root."
    exit 1
fi

if [[ ! -d "$SOURCE_PXE_DIR" ]]; then
    echo "❌ Diretório '$SOURCE_PXE_DIR' não encontrado."
    exit 1
fi

if [[ ! -d "$IMAGES_DIR" ]]; then
    echo "❌ Diretório de imagens '$IMAGES_DIR' não encontrado."
    exit 1
fi

echo "[INFO] Preparando destino: $TARGET_PXE_DIR"
mkdir -p "$TFTP_ROOT_DIR"
rm -rf "${TARGET_PXE_DIR:?}/"*
mkdir -p "$TARGET_PXE_DIR"

cp -r "$SOURCE_PXE_DIR"/. "$TARGET_PXE_DIR/"
if [[ $? -ne 0 ]]; then
    echo "❌ Falha ao copiar estrutura base."
    exit 1
fi

LABEL_START_LINE=$(grep -n -m 1 "^LABEL " "$DEFAULT_FILE_PATH" | cut -d: -f1)
if [[ -z "$LABEL_START_LINE" ]]; then
    echo "❌ Nenhuma entrada LABEL encontrada no default base."
    exit 1
fi

head -n $((LABEL_START_LINE - 1)) "$DEFAULT_FILE_PATH" > "${DEFAULT_FILE_PATH}.new"

declare -A seen_labels
echo "[INFO] Gerando entradas de menu PXE..."

for img_path in "$IMAGES_DIR"/*.img; do
    [[ -e "$img_path" ]] || continue

    image_file=$(basename "$img_path")
    image_label="${image_file%.img}"

    if [[ -n "${seen_labels[$image_label]:-}" ]]; then
        echo "[WARN] Ignorando duplicata: $image_label"
        continue
    fi
    seen_labels["$image_label"]=1

    # Gera entrada PXE com formatação exata
    cat <<EOF >> "${DEFAULT_FILE_PATH}.new"

LABEL $image_label
        MENU LABEL $image_label
#TEXT HELP
#       Boots /srv/ltsp/images/$image_file via NFS.
#ENDTEXT
        MENU INDENT 2
        KERNEL $image_label/vmlinuz
        APPEND root=/dev/nfs nfsroot=/srv/ltsp ltsp.image=images/$image_file loop.max_part=9
        INITRD ltsp.img,$image_label/initrd.img
        IPAPPEND 3
EOF

done

mv "${DEFAULT_FILE_PATH}.new" "$DEFAULT_FILE_PATH"

if [[ ${#seen_labels[@]} -eq 0 ]]; then
    echo "⚠️ Nenhuma imagem encontrada."
else
    echo "[✅] Menu PXE atualizado com ${#seen_labels[@]} imagem(ns):"
    printf ' - %s\n' "${!seen_labels[@]}"
fi

exit 0

