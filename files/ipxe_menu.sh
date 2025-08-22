#!/bin/bash

# =============================================
# Script: ipxe_menu.sh
# Objetivo: Montar o menu PXE personalizado no /srv/tftp/ltsp/pxelinux.cfg,
#           limpando o diretório existente, copiando a nova estrutura
#           e ajustando dinamicamente o caminho da imagem no arquivo default.
# Uso: sudo ./ipxe_menu.sh [NOME_DA_IMAGEM]
#      Se NOME_DA_IMAGEM não for fornecido, tenta detectar automaticamente
#      o primeiro diretório em /srv/ltsp/images/.
# =============================================

# === Variáveis ===
SOURCE_PXE_DIR="pxelinux.cfg" # Onde o zip foi descompactado
TARGET_PXE_DIR="/srv/tftp/ltsp/pxelinux.cfg"
TFTP_ROOT_DIR="/srv/tftp/ltsp"
IMAGES_DIR="/srv/ltsp/images"
DEFAULT_FILE_PATH="${TARGET_PXE_DIR}/default"

# === Verificações Iniciais ===
if [[ "$(id -u)" -ne 0 ]]; then
    echo "❌ Este script precisa ser executado como root."
    exit 1
fi

if [[ ! -d "$SOURCE_PXE_DIR" ]]; then
    echo "❌ Diretório de origem 

'$SOURCE_PXE_DIR' não encontrado."
    echo "   Certifique-se de que o arquivo pxelinux.cfg.zip foi descompactado corretamente em /home/ubuntu/pxelinux.cfg/."
    exit 1
fi

# === Determina o Nome/Diretório da Imagem ===
IMAGE_NAME="$1"


# === Preparação do Diretório de Destino ===
echo "[INFO] Preparando diretório de destino: $TARGET_PXE_DIR"
mkdir -p "$TFTP_ROOT_DIR"
if [[ $? -ne 0 ]]; then echo "❌ Falha ao criar $TFTP_ROOT_DIR."; exit 1; fi

if [[ -d "$TARGET_PXE_DIR" ]]; then
    echo "[INFO] Limpando diretório de destino existente..."
    rm -rf "${TARGET_PXE_DIR:?}/"*
    if [[ $? -ne 0 ]]; then echo "❌ Falha ao limpar $TARGET_PXE_DIR."; exit 1; fi
else
    echo "[INFO] Criando diretório de destino..."
    mkdir -p "$TARGET_PXE_DIR"
    if [[ $? -ne 0 ]]; then echo "❌ Falha ao criar $TARGET_PXE_DIR."; exit 1; fi
fi

# === Cópia da Estrutura do Menu ===
echo "[INFO] Copiando a estrutura do menu PXE de $SOURCE_PXE_DIR para $TARGET_PXE_DIR..."
cp -r "$SOURCE_PXE_DIR"/. "$TARGET_PXE_DIR/"
if [[ $? -ne 0 ]]; then
    echo "❌ Falha ao copiar a estrutura do menu PXE."
    exit 1
fi

# === Ajuste Dinâmico do Arquivo Default ===
if [[ -f "$DEFAULT_FILE_PATH" ]]; then
    echo "[INFO] Ajustando dinamicamente o arquivo '$DEFAULT_FILE_PATH' com o nome da imagem '$IMAGE_NAME'..."

    # Substitui as ocorrências do placeholder (ex: ubuntuxfce_jammy) pelo nome da imagem
    # Usando '#' como delimitador no sed para evitar conflitos com '/' nos caminhos
    sed -i "s#KERNEL ubuntuxfce_jammy/vmlinuz#KERNEL ${IMAGE_NAME}/vmlinuz#g" "$DEFAULT_FILE_PATH"
    sed -i "s#ltsp.image=images/ubuntuxfce_jammy.img#ltsp.image=images/${IMAGE_NAME}.img#g" "$DEFAULT_FILE_PATH"
    sed -i "s#INITRD ltsp.img,ubuntuxfce_jammy/initrd.img#INITRD ltsp.img,${IMAGE_NAME}/initrd.img#g" "$DEFAULT_FILE_PATH"

    # Ajusta o MENU LABEL também (opcional, mas bom para clareza)
    # Assume que o label original é 'Ubuntu 22.04' e o novo label será o nome da imagem
    sed -i "s/MENU LABEL Ubuntu 22.04/MENU LABEL ${IMAGE_NAME}/g" "$DEFAULT_FILE_PATH"

    echo "[INFO] Arquivo '$DEFAULT_FILE_PATH' ajustado."
else
    echo "❌ Erro: Arquivo '$DEFAULT_FILE_PATH' não encontrado após a cópia. Não foi possível ajustar dinamicamente."
    exit 1
fi

echo "[✅] Processo de montagem e ajuste do menu PXE concluído."
exit 0