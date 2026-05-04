#!/bin/bash
set -e

UBUNTU_VERSION=$(lsb_release -rs | cut -d'.' -f1)

apt update > /dev/null

COMMON_PKGS="ltsp dnsmasq nfs-kernel-server openssh-server squashfs-tools ethtool net-tools epoptes debootstrap pxelinux syslinux wakeonlan ipcalc"

if [ "$UBUNTU_VERSION" -lt 24 ]; then
	add-apt-repository ppa:ltsp -y > /dev/null 2>&1
	apt update > /dev/null
    apt install --install-recommends $COMMON_PKGS ltsp-binaries -y > /dev/null
else
    apt install --install-recommends $COMMON_PKGS ipxe -y > /dev/null
fi

mkdir -p /srv/tftp/ltsp
wget -q https://boot.ipxe.org/ipxe.pxe -O /srv/tftp/ltsp/undionly.kpxe
ln -sf /usr/lib/PXELINUX/pxelinux.0 /srv/tftp/ltsp/pxelinux.0
ln -sf /usr/lib/syslinux/modules/bios /srv/tftp/ltsp/isolinux
mkdir -p /srv/tftp/ltsp/pxelinux.cfg
wget -q https://ltsp.org/guides/pxelinux.txt -O /srv/tftp/ltsp/pxelinux.cfg/default

systemctl stop systemd-resolved > /dev/null 2>&1 || true
systemctl disable systemd-resolved > /dev/null 2>&1 || true
rm -f /etc/resolv.conf
echo -e "nameserver 8.8.8.8\nnameserver 8.8.4.4" > /etc/resolv.conf

ltsp_conf_file="/etc/ltsp/ltsp.conf"

if [[ ! -f "$ltsp_conf_file" ]]; then
    mkdir -p /etc/ltsp
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
        echo "Falha ao criar o $ltsp_conf_file." >&2
        exit 1
    fi
fi
