#!/bin/bash

# --- Parâmetro opcional para versão do Ubuntu ---
UBUNTU_VERSION="jammy"  # Padrão: Ubuntu 22.04

while [[ $# -gt 0 ]]; do
  case $1 in
    bionic|jammy)
      UBUNTU_VERSION="$1"
      shift
      ;;
    *) echo "[ERRO] Versão inválida: $1"; exit 1 ;;
  esac
done

echo "[INFO] Configurando ambiente LTSP com Ubuntu $UBUNTU_VERSION (${UBUNTU_VERSION^})"

# --- CONFIGURAÇÕES INICIAIS ---
DISTRO="Linux"
RELEASE="$UBUNTU_VERSION"
CHROOT_DIR="/srv/ltsp/${DISTRO}_${RELEASE}"
NAME="${DISTRO}_${RELEASE}"
ARCH="amd64"
MIRROR="http://ubuntu.c3sl.ufpr.br/ubuntu/"

echo "[1] Verificando dependências do host..."
apt-get update
apt-get install -y debootstrap squashfs-tools systemd-container ltsp

# --- Criação do chroot ---
if [ ! -e "$CHROOT_DIR/etc/os-release" ]; then
  echo "[2] Criando novo chroot Ubuntu $UBUNTU_VERSION em $CHROOT_DIR..."
  mkdir -p "$CHROOT_DIR"
  debootstrap --arch="$ARCH" "$UBUNTU_VERSION" "$CHROOT_DIR" "$MIRROR"
else
  echo "[2] Chroot já existe. Pulando debootstrap."
fi

# --- Customizações visuais (corrigido numeração) ---
echo "[3] Adicionando wallpaper e ícone personalizados..."
mkdir -p "$CHROOT_DIR/usr/share/backgrounds"
cp LIFTO_WALLPAPER_LI_BLACK.jpg "$CHROOT_DIR/usr/share/backgrounds/ltsp_wallpaper.jpg"
mkdir -p "$CHROOT_DIR/usr/share/icons/Yaru/scalable/actions"
cp LIFTO_ICON.svg "$CHROOT_DIR/usr/share/icons/Yaru/scalable/actions/view-app-grid-symbolic.svg"

# --- Copia de arquivos do host ---
#cp apps/VMware-*.bundle "$CHROOT_DIR/"
cp apps_pre_install.sh "$CHROOT_DIR/"
chmod +x "$CHROOT_DIR/apps_pre_install.sh"
cp tmp/additional_packages.txt "$CHROOT_DIR/"

# --- Montagem de FS críticos ---
#echo "[4] Montando fs críticos no chroot..."
for fs in dev proc sys; do
  if ! mountpoint -q "$CHROOT_DIR/$fs"; then
    mount --bind /$fs "$CHROOT_DIR/$fs"
  fi
done

# --- sources.list ---
echo "[5] Configurando sources.list no chroot..."
cat > "$CHROOT_DIR/etc/apt/sources.list" <<EOF
deb $MIRROR $UBUNTU_VERSION main universe multiverse restricted
deb $MIRROR $UBUNTU_VERSION-updates main universe multiverse restricted
deb $MIRROR $UBUNTU_VERSION-security main universe multiverse restricted
EOF

# --- Scripts auxiliares ---
#init.d para execução dos scripts de boot personalizados
cp chroot_scripts/init_file "$CHROOT_DIR/etc/init.d/ltsp-ssh-init"
chmod 777 "$CHROOT_DIR/etc/init.d/ltsp-ssh-init"  
# desmontagem de disco remoto e montagem local
cp chroot_scripts/desmonta_home.sh "$CHROOT_DIR/bin/"
chmod 755 "$CHROOT_DIR/bin/desmonta_home.sh"
# d é o desliga para permitir wakeonlan
cp chroot_scripts/d $CHROOT_DIR/usr/bin/
chmod 777 $CHROOT_DIR/usr/bin/
# abri uma porta para execução de comandos
cp chroot_scripts/executa.sh $CHROOT_DIR/usr/bin/
chmod 777 $CHROOT_DIR/usr/bin/executa.sh

# --- Chroot: instalação de pacotes e ajustes ---
echo "[6] Instalando pacotes no chroot..."
chroot "$CHROOT_DIR" /bin/bash -c "
export DEBIAN_FRONTEND=noninteractive

add-apt-repository -y ppa:ltsp
add-apt-repository -y universe
apt-get update -y
apt upgrade -y

apt-get install -y epoptes-client policykit-1 network-manager dbus \
  software-properties-common systemd-sysv ethtool wakeonlan

apt-get install --install-recommends -y ltsp ubuntu-desktop gdm3 nano gedit vim

echo '[6.1] Instalação do kernel e initramfs...'
apt-get install --reinstall -y linux-generic initramfs-tools
update-initramfs -u

echo '[6.2] Localização e teclado...'
apt-get install -y language-pack-pt language-pack-pt-base
locale-gen pt_BR.UTF-8
update-locale LANG=pt_BR.UTF-8 LANGUAGE=pt_BR:pt LC_ALL=pt_BR.UTF-8
sed -i 's/^XKBLAYOUT=.*/XKBLAYOUT=\"br\"/' /etc/default/keyboard

echo '[6.3] Instalando Google Chrome...'
apt-get install -y curl
curl -fsSLO https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
apt-get install -y ./google-chrome-stable_current_amd64.deb
rm -f google-chrome-stable_current_amd64.deb
update-alternatives --install /usr/bin/x-www-browser x-www-browser /usr/bin/google-chrome-stable 200

echo '[6.4] Configurando SSH...'
apt-get install -y openssh-server
ssh-keygen -A
systemctl enable ssh

echo '[6.5] Configurando epoptes...'
epoptes-client -c

echo '[6.6] Definindo configurações DConf...'
echo '[6.6] Configurando papel de parede e restrições GNOME via DConf...'

# Criar diretórios necessários
mkdir -p /etc/dconf/db/local.d/
mkdir -p /etc/dconf/db/local.d/locks

# Configuração do papel de parede
cat > /etc/dconf/db/local.d/00-wallpaper <<EOF
[org/gnome/desktop/background]
picture-uri='file:///usr/share/backgrounds/ltsp_wallpaper.jpg'
picture-uri-dark='file:///usr/share/backgrounds/ltsp_wallpaper.jpg'
picture-options='zoom'
EOF

# Bloquear alterações do usuário
echo "/org/gnome/desktop/background/picture-uri" >> /etc/dconf/db/local.d/locks/00-wallpaper
echo "/org/gnome/desktop/background/picture-uri-dark" >> /etc/dconf/db/local.d/locks/00-wallpaper

# Restrições de logout, switch e lock
cat > /etc/dconf/db/local.d/01-lockdown <<EOF
[org/gnome/desktop/lockdown]
disable-log-out=true
disable-user-switching=true
disable-lock-screen=true
EOF

dconf update

# Perfil dconf
echo "user-db:user" > /etc/dconf/profile/user
echo "system-db:local" >> /etc/dconf/profile/user

# Polkit - bloqueando desligar/reiniciar
mkdir -p /etc/polkit-1/localauthority/50-local.d/
cat > /etc/polkit-1/localauthority/50-local.d/disable-shutdown.pkla <<EOF
[Disable shutdown, reboot and suspend]
Identity=unix-user:*
Action=org.freedesktop.login1.reboot;org.freedesktop.login1.power-off;org.freedesktop.login1.suspend;org.freedesktop.login1.hibernate
ResultActive=no
EOF

echo '[6.7] Setando fuso horário'
echo "America/Araguaina" > /etc/timezone
ln -sf /usr/share/zoneinfo/America/Araguaina /etc/localtime
date


echo '[6.8] Sessão gráfica...'
echo '/usr/sbin/gdm3' > /etc/X11/default-display-manager
systemctl enable gdm3
systemctl set-default graphical.target


apt-get install -y net-tools virtualbox

update-rc.d ltsp-ssh-init defaults

chmod +x VMware-Workstation-Full-*.bundle
./VMware-Workstation-Full-*.bundle

grep -qx 'pref.vmplayer.fullscreen.nobar = \"TRUE\"' /etc/vmware/config || \
echo 'pref.vmplayer.fullscreen.nobar = \"TRUE\"' >> /etc/vmware/config

update-initramfs -u
"

# --- Desmontagem de bind mounts ---
#echo "[7] Desmontando sistemas montados..."
for fs in dev proc sys; do
  if mountpoint -q "$CHROOT_DIR/$fs"; then
    umount "$CHROOT_DIR/$fs" || umount -l "$CHROOT_DIR/$fs"
  fi
done

# --- Exportação da imagem LTSP ---
echo "[8] Exportando imagem squashfs com ltsp image..."
ltsp image "$CHROOT_DIR"

# --- Reinício de serviços e iPXE ---
echo "[9] Reiniciando serviços..."
bash reinicia.sh

echo "[10] Gerando menu iPXE..."
bash ipxe_menu.sh