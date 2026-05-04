#!/bin/bash
set -euo pipefail

UBUNTU_VERSION="jammy"
if [ "${1:-}" == "bionic" ]; then
  UBUNTU_VERSION="bionic"
fi

DISTRO="Linux"
RELEASE="$UBUNTU_VERSION"
CHROOT_DIR="/srv/ltsp/${DISTRO}_${RELEASE}"

if [ ! -d "$CHROOT_DIR" ]; then
    echo "Diretório de chroot não encontrado: $CHROOT_DIR" >&2
    exit 1
fi

ltsp image "$CHROOT_DIR" >/dev/null 2>&1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$SCRIPT_DIR/reinicia.sh" ]; then
    bash "$SCRIPT_DIR/reinicia.sh" >/dev/null 2>&1 || true
else
    systemctl restart dnsmasq >/dev/null 2>&1 || true
    systemctl restart nfs-kernel-server >/dev/null 2>&1 || true
fi

if [ -f "$SCRIPT_DIR/ipxe_menu.sh" ]; then
    bash "$SCRIPT_DIR/ipxe_menu.sh" >/dev/null 2>&1 || true
else
    ltsp ipxe >/dev/null 2>&1 || true
fi
