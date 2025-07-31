#!/bin/bash
set -e

echo "[INFO] Iniciando desinstalação do LTSP..."

# Detectar versão do Ubuntu
UBUNTU_VERSION=$(lsb_release -rs | cut -d'.' -f1)
echo "[INFO] Versão detectada: Ubuntu $UBUNTU_VERSION"

# Pacotes principais
COMMON_PKGS="ltsp dnsmasq nfs-kernel-server openssh-server squashfs-tools epoptes debootstrap pxelinux syslinux"

# Adicionais por versão
if [ "$UBUNTU_VERSION" -lt 24 ]; then
    echo "[INFO] Removendo ltsp-binaries..."
    EXTRA_PKGS="ltsp-binaries"
else
    echo "[INFO] Removendo ipxe..."
    EXTRA_PKGS="ipxe"
fi

# Desinstalar pacotes sem afetar dependências de sistema
echo "[INFO] Removendo pacotes LTSP..."
apt remove --purge -y $COMMON_PKGS $EXTRA_PKGS || echo "[WARN] Alguns pacotes não estavam instalados."

# Autoremove limpa dependências órfãs
echo "[INFO] Limpando pacotes órfãos e caches..."
apt autoremove --purge -y
apt clean

# Remover diretórios e arquivos criados
echo "[INFO] Removendo arquivos e diretórios do LTSP..."

rm -rf /srv/tftp/ltsp #Apaga ambiente tftp
rm -rf /srv/ltsp #Apaga ambiente chroot e imagens
rm -f /etc/resolv.conf #Apaga dns default
ln -sf /run/systemd/resolve/resolv.conf /etc/resolv.conf  # Restaura o symlink padrão do Ubuntu
rm -rf /etc/ltsp  #Apaga configurações do ltsp

# Opcional: remover repositório PPA
if [ "$UBUNTU_VERSION" -lt 24 ]; then
    echo "[INFO] Removendo repositório PPA do LTSP..."
    add-apt-repository --remove ppa:ltsp -y
    apt update
fi

echo "[OK] LTSP removido com sucesso. Sistema limpo."