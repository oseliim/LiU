#!/bin/bash
set -euo pipefail

UBUNTU_VERSION="jammy"
if [ "${1:-}" == "bionic" ]; then
  UBUNTU_VERSION="bionic"
fi

DISTRO="Linux"
RELEASE="$UBUNTU_VERSION"
CHROOT_DIR="/srv/ltsp/${DISTRO}_${RELEASE}"
ARCH="amd64"
MIRROR="http://ubuntu.c3sl.ufpr.br/ubuntu/"

apt-get update >/dev/null 2>&1 || true
apt-get install -y debootstrap squashfs-tools systemd-container ltsp >/dev/null 2>&1 || true

if [ ! -e "$CHROOT_DIR/etc/os-release" ]; then
  mkdir -p "$CHROOT_DIR"
  debootstrap --arch="$ARCH" "$UBUNTU_VERSION" "$CHROOT_DIR" "$MIRROR" >/dev/null 2>&1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -d "$SCRIPT_DIR" ]; then
  mkdir -p "$CHROOT_DIR/usr/share/backgrounds"
  cp "./LIFTO_WALLPAPER_LI_BLACK.jpg" "$CHROOT_DIR/usr/share/backgrounds/ltsp_wallpaper.jpg" 2>/dev/null || true
  mkdir -p "$CHROOT_DIR/usr/share/icons/Yaru/scalable/actions"
  cp "$SCRIPT_DIR/LIFTO_ICON.svg" "$CHROOT_DIR/usr/share/icons/Yaru/scalable/actions/view-app-grid-symbolic.svg" 2>/dev/null || true

  cp "$SCRIPT_DIR/apps_pre_install.sh" "$CHROOT_DIR/" 2>/dev/null || true
  if [ -f "$CHROOT_DIR/apps_pre_install.sh" ]; then
      chmod +x "$CHROOT_DIR/apps_pre_install.sh"
  fi
  if [ -d "$SCRIPT_DIR/tmp" ]; then
      cp -r "$SCRIPT_DIR/tmp" "$CHROOT_DIR/" 2>/dev/null || true
  fi
fi

for fs in dev proc sys; do
  if ! mountpoint -q "$CHROOT_DIR/$fs"; then
    mount --bind /$fs "$CHROOT_DIR/$fs"
  fi
done

cat > "$CHROOT_DIR/etc/apt/sources.list" <<EOF
deb $MIRROR $UBUNTU_VERSION main universe multiverse restricted
deb $MIRROR $UBUNTU_VERSION-updates main universe multiverse restricted
deb $MIRROR $UBUNTU_VERSION-security main universe multiverse restricted
EOF

if [ -d "$SCRIPT_DIR/chroot_scripts" ]; then
  cp "$SCRIPT_DIR/chroot_scripts/init_file" "$CHROOT_DIR/etc/init.d/ltsp-ssh-init" 2>/dev/null || true
  chmod 777 "$CHROOT_DIR/etc/init.d/ltsp-ssh-init" 2>/dev/null || true
  
  cp "$SCRIPT_DIR/chroot_scripts/desmonta_home.sh" "$CHROOT_DIR/bin/" 2>/dev/null || true
  chmod 755 "$CHROOT_DIR/bin/desmonta_home.sh" 2>/dev/null || true
  
  cp "$SCRIPT_DIR/chroot_scripts/d" "$CHROOT_DIR/usr/bin/" 2>/dev/null || true
  chmod 777 "$CHROOT_DIR/usr/bin/d" 2>/dev/null || true
  
  cp "$SCRIPT_DIR/chroot_scripts/executa.sh" "$CHROOT_DIR/usr/bin/" 2>/dev/null || true
  chmod 777 "$CHROOT_DIR/usr/bin/executa.sh" 2>/dev/null || true
  
  cp "$SCRIPT_DIR/chroot_scripts/mount_home.sh" "$CHROOT_DIR/usr/local/sbin/" 2>/dev/null || true
  cp "$SCRIPT_DIR/chroot_scripts/mount_home.service" "$CHROOT_DIR/etc/systemd/system/" 2>/dev/null || true
fi

chroot "$CHROOT_DIR" /bin/bash -c "
export DEBIAN_FRONTEND=noninteractive

add-apt-repository -y ppa:ltsp >/dev/null 2>&1 || true
add-apt-repository -y universe >/dev/null 2>&1 || true
apt-get update -y >/dev/null 2>&1 || true
apt-get upgrade -y >/dev/null 2>&1 || true

apt-get install -y epoptes-client policykit-1 network-manager dbus \
  software-properties-common systemd-sysv ethtool wakeonlan >/dev/null 2>&1 || true

apt-get install --install-recommends -y ltsp ubuntu-desktop gdm3 nano gedit vim curl >/dev/null 2>&1 || true

apt-get install --reinstall -y linux-generic initramfs-tools >/dev/null 2>&1 || true
update-initramfs -u >/dev/null 2>&1 || true

apt-get install -y language-pack-pt language-pack-pt-base >/dev/null 2>&1 || true
locale-gen pt_BR.UTF-8 >/dev/null 2>&1 || true
update-locale LANG=pt_BR.UTF-8 LANGUAGE=pt_BR:pt LC_ALL=pt_BR.UTF-8 >/dev/null 2>&1 || true
sed -i 's/^XKBLAYOUT=.*/XKBLAYOUT=\"br\"/' /etc/default/keyboard >/dev/null 2>&1 || true

apt-get install -y curl >/dev/null 2>&1 || true
curl -fsSLO https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb >/dev/null 2>&1 || true
apt-get install -y ./google-chrome-stable_current_amd64.deb >/dev/null 2>&1 || true
rm -f google-chrome-stable_current_amd64.deb >/dev/null 2>&1 || true
update-alternatives --install /usr/bin/x-www-browser x-www-browser /usr/bin/google-chrome-stable 200 >/dev/null 2>&1 || true

apt-get install -y openssh-server >/dev/null 2>&1 || true
ssh-keygen -A >/dev/null 2>&1 || true
systemctl enable ssh >/dev/null 2>&1 || true

epoptes-client -c >/dev/null 2>&1 || true

mkdir -p /etc/dconf/db/local.d/
mkdir -p /etc/dconf/db/local.d/locks

cat > /etc/dconf/db/local.d/00-wallpaper <<EOF
[org/gnome/desktop/background]
picture-uri='file:///usr/share/backgrounds/ltsp_wallpaper.jpg'
picture-uri-dark='file:///usr/share/backgrounds/ltsp_wallpaper.jpg'
picture-options='zoom'
EOF

echo \"/org/gnome/desktop/background/picture-uri\" >> /etc/dconf/db/local.d/locks/00-wallpaper
echo \"/org/gnome/desktop/background/picture-uri-dark\" >> /etc/dconf/db/local.d/locks/00-wallpaper

cat > /etc/dconf/db/local.d/01-lockdown <<EOF
[org/gnome/desktop/lockdown]
disable-log-out=true
disable-user-switching=true
disable-lock-screen=true
EOF
cat > /etc/dconf/profile/gdm << 'EOF'
user-db:user
system-db:gdm
file-db:/usr/share/gdm/greeter-dconf-defaults
EOF

mkdir -p /etc/dconf/db/gdm.d

cat > /etc/dconf/db/gdm.d/00-login-screen << 'EOF'
[org/gnome/login-screen]
disable-user-list=true
EOF
dconf update >/dev/null 2>&1 || true

echo \"user-db:user\" > /etc/dconf/profile/user
echo \"system-db:local\" >> /etc/dconf/profile/user

mkdir -p /etc/polkit-1/localauthority/50-local.d/
cat > /etc/polkit-1/localauthority/50-local.d/disable-shutdown.pkla <<EOF
[Disable shutdown, reboot and suspend]
Identity=unix-user:*
Action=org.freedesktop.login1.reboot;org.freedesktop.login1.power-off;org.freedesktop.login1.suspend;org.freedesktop.login1.hibernate
ResultActive=no
EOF

echo \"America/Araguaina\" > /etc/timezone
ln -sf /usr/share/zoneinfo/America/Araguaina /etc/localtime

echo '/usr/sbin/gdm3' > /etc/X11/default-display-manager
systemctl enable gdm3 >/dev/null 2>&1 || true
systemctl set-default graphical.target >/dev/null 2>&1 || true

chmod 755 /usr/local/sbin/mount_home.sh 2>/dev/null || true
systemctl daemon-reload >/dev/null 2>&1 || true
systemctl enable mount_home.service >/dev/null 2>&1 || true

apt-get install -y net-tools virtualbox >/dev/null 2>&1 || true

update-rc.d ltsp-ssh-init defaults >/dev/null 2>&1 || true

if ls VMware-Workstation-Full-*.bundle 1> /dev/null 2>&1; then
    chmod +x VMware-Workstation-Full-*.bundle
    ./VMware-Workstation-Full-*.bundle >/dev/null 2>&1 || true
fi

if [ -f /etc/vmware/config ]; then
    grep -qx 'pref.vmplayer.fullscreen.nobar = \"TRUE\"' /etc/vmware/config || \
    echo 'pref.vmplayer.fullscreen.nobar = \"TRUE\"' >> /etc/vmware/config
fi

if [ -f ./apps_pre_install.sh ]; then
    ./apps_pre_install.sh >/dev/null 2>&1 || true
fi
update-initramfs -u >/dev/null 2>&1 || true
"

for fs in dev proc sys; do
  if mountpoint -q "$CHROOT_DIR/$fs"; then
    umount "$CHROOT_DIR/$fs" || umount -l "$CHROOT_DIR/$fs"
  fi
done
