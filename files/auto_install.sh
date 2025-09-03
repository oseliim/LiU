#!/bin/bash

set -e

# Function to send progress
send_progress() {
    echo "PROGRESS:$1:$2"
}

send_progress "step1_progress" "10%"
echo "[INFO] Detectando versão do sistema..."
UBUNTU_VERSION=$(lsb_release -rs | cut -d'.' -f1)

send_progress "step1_progress" "20%"
echo "[INFO] Versão detectada: Ubuntu $UBUNTU_VERSION"

send_progress "step1_progress" "30%"
echo "[INFO] Atualizando pacotes..."
apt update

send_progress "step1_progress" "40%"
# Pacotes comuns a todas as versões
COMMON_PKGS="ltsp dnsmasq nfs-kernel-server openssh-server squashfs-tools ethtool net-tools epoptes debootstrap pxelinux syslinux wakeonlan"

if [ "$UBUNTU_VERSION" -lt 24 ]; then
    send_progress "step1_progress" "50%"
    echo "[INFO] Instalando repositório do LTSP..."
	add-apt-repository ppa:ltsp -y
	apt update
    send_progress "step1_progress" "60%"
    echo "[INFO] Instalando com suporte a ltsp-binaries (versões < 24)"
    	apt install --install-recommends $COMMON_PKGS ltsp-binaries -y
else
    send_progress "step1_progress" "50%"
    echo "[INFO] Instalando LTSP moderno (versão >= 24, sem ltsp-binaries)"
    	apt install --install-recommends $COMMON_PKGS ipxe -y
fi

send_progress "step1_progress" "70%"
echo "[INFO] Configurando diretórios e arquivos PXE..."
mkdir -p /srv/tftp/ltsp
wget -q https://boot.ipxe.org/ipxe.pxe -O /srv/tftp/ltsp/undionly.kpxe
ln -sf /usr/lib/PXELINUX/pxelinux.0 /srv/tftp/ltsp/pxelinux.0
ln -sf /usr/lib/syslinux/modules/bios /srv/tftp/ltsp/isolinux
mkdir -p /srv/tftp/ltsp/pxelinux.cfg
wget -q https://ltsp.org/guides/pxelinux.txt -O /srv/tftp/ltsp/pxelinux.cfg/default

send_progress "step1_progress" "80%"
echo "[INFO] Configurando DNS..."
systemctl stop systemd-resolved
systemctl disable systemd-resolved
rm -f /etc/resolv.conf
echo -e "nameserver 8.8.8.8\nnameserver 8.8.4.4" > /etc/resolv.conf

send_progress "step1_progress" "90%"
echo "[INFO] Criando ltsp.conf básico"
ltsp_conf_file="/etc/ltsp/ltsp.conf"

if [[ ! -f "$ltsp_conf_file" ]]; then
    echo "[INFO] Creating basic $ltsp_conf_file with [common] section."
    mkdir -p /etc/ltsp # Ensure directory exists
    # Use cat heredoc for robust file creation
    cat << EOF > "$ltsp_conf_file"
[common]
RELOGIN=1
HOSTNAME=liu
LIGHTDM_CONF="greeter-hide-users=true"
DNS_SERVER="8.8.8.8"
GDM3_CONF="WaylandEnable=false"

[clients]
EOF

    if [[ $? -ne 0 ]]; then
        echo "❌ Failed to create $ltsp_conf_file."
        exit 1
    fi
else
    echo "[INFO] $ltsp_conf_file already exists. Skipping creation."
fi

send_progress "step1_progress" "100%"
echo "[OK] Instalação e configuração inicial do LTSP concluída com sucesso."
