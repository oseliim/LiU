#!/bin/bash
# gera_gdm.sh - Gera ambiente LTSP com Ubuntu, GDM3, autologin e configurações personalizadas

#set -euo pipefail

# =============================
# VARIÁVEIS GLOBAIS
# =============================
UBUNTU_VERSION="Windows"
DISTRO="linux"
ARCH="amd64"
MIRROR="http://ubuntu.c3sl.ufpr.br/ubuntu"

# =============================
# PARSE DE ARGUMENTOS
# =============================
while [[ $# -gt 0 ]]; do
  case $1 in
    bionic|jammy)
      UBUNTU_VERSION="$1"
      shift
      ;;
  esac
done

RELEASE="$UBUNTU_VERSION"
CHROOT_DIR="/srv/ltsp/${DISTRO}_${RELEASE}"
NAME="${DISTRO}_${RELEASE}"

# =============================
# FUNÇÕES
# =============================

instalar_dependencias() {
  echo "[1] Instalando dependências..."
  apt-get update
  apt-get install -y debootstrap squashfs-tools systemd-container ltsp curl wget gnupg2
}

criar_chroot() {
  if [ ! -e "$CHROOT_DIR/etc/os-release" ]; then
    echo "[2] Criando chroot em $CHROOT_DIR..."
    mkdir -p "$CHROOT_DIR"
    debootstrap --arch="$ARCH" "$RELEASE" "$CHROOT_DIR" "$MIRROR"
  else
    echo "[2] Chroot já existe. Pulando debootstrap."
  fi
}

montar_bind_dirs() {
  for fs in dev proc sys run tmp; do
    if ! mountpoint -q "$CHROOT_DIR/$fs"; then
      echo "[3] Montando $fs..."
      mount --bind "/$fs" "$CHROOT_DIR/$fs"
    fi
  done
}

desmontar_bind_dirs() {
  echo "[12] Desmontando sistemas montados..."
  for fs in dev proc sys run tmp; do
    umount "$CHROOT_DIR/$fs" || true
  done
}

customizar_visuais() {
  echo "[4] Adicionando wallpaper e ícone personalizados..."
  mkdir -p "$CHROOT_DIR/usr/share/backgrounds"
  cp LIFTO_WALLPAPER_LI_BLACK.jpg "$CHROOT_DIR/usr/share/backgrounds/ltsp_wallpaper.jpg"
  mkdir -p "$CHROOT_DIR/usr/share/icons/Yaru/scalable/actions"
  cp LIFTO_ICON.svg "$CHROOT_DIR/usr/share/icons/Yaru/scalable/actions/view-app-grid-symbolic.svg"

  cat > "$CHROOT_DIR/etc/profile.d/set-wallpaper.sh" << 'EOF'
#!/bin/bash
if [[ "$XDG_CURRENT_DESKTOP" == *GNOME* ]] && command -v gsettings >/dev/null; then
   gsettings set org.gnome.desktop.background picture-uri 'file:///usr/share/backgrounds/ltsp_wallpaper.jpg'
fi
EOF
  chmod +x "$CHROOT_DIR/etc/profile.d/set-wallpaper.sh"
}

preparar_chroot() {
  cp apps_pre_install.sh "$CHROOT_DIR/"
  chmod +x "$CHROOT_DIR/apps_pre_install.sh"
  cp -r tmp "$CHROOT_DIR/"
  cp /home/tandson/Downloads/vmware/VMware-Workstation-Full-17.6.3-24583834.x86_64.bundle "$CHROOT_DIR/"
}

configurar_sources() {
  cat > "$CHROOT_DIR/etc/apt/sources.list" <<EOF
deb $MIRROR $UBUNTU_VERSION main universe multiverse restricted
deb $MIRROR $UBUNTU_VERSION-updates main universe multiverse restricted
deb $MIRROR $UBUNTU_VERSION-security main universe multiverse restricted
EOF
}

instalar_dentro_do_chroot() {
  chroot "$CHROOT_DIR" bash -c "
export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y software-properties-common

add-apt-repository -y universe
add-apt-repository -y ppa:ltsp
apt-get update -y

apt-get install --install-recommends -y \
  ltsp ubuntu-desktop gdm3 firefox epoptes-client \
  policykit-1 network-manager dbus xserver-xorg \
  linux-generic initramfs-tools language-pack-pt \
  language-pack-pt-base curl net-tools virtualbox \
  openssh-server systemd-sysv

# Localização
locale-gen pt_BR.UTF-8
update-locale LANG=pt_BR.UTF-8 LANGUAGE=pt_BR:pt LC_ALL=pt_BR.UTF-8
sed -i 's/^XKBLAYOUT=.*/XKBLAYOUT=\"br\"/' /etc/default/keyboard
timedatectl set-timezone America/Sao_Paulo

# Chrome
curl -fsSLO https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
apt-get install -y ./google-chrome-stable_current_amd64.deb
rm -f google-chrome-stable_current_amd64.deb
update-alternatives --install /usr/bin/x-www-browser x-www-browser /usr/bin/google-chrome-stable 200

# SSH
ssh-keygen -A
systemctl enable ssh

# Epoptes
epoptes-client -c

# GDM e sessão gráfica
echo '/usr/sbin/gdm3' > /etc/X11/default-display-manager
systemctl enable gdm3
systemctl set-default graphical.target

mkdir -p /etc/gdm3/
cat >> /etc/gdm3/custom.conf <<EOC
[daemon]
AutomaticLoginEnable=true
AutomaticLogin=ltsp
EOC

# Wallpaper DConf
mkdir -p /etc/dconf/db/local.d
cat > /etc/dconf/db/local.d/00-wallpaper <<EOC
[org/gnome/desktop/background]
picture-uri='file:///usr/share/backgrounds/ltsp_wallpaper.jpg'
picture-options='zoom'
EOC
dconf update

update-initramfs -u
chmod +x VMware-Workstation-Full-17.6.3-24583834.x86_64.bundle
./VMware-Workstation-Full-17.6.3-24583834.x86_64.bundle
"
}

configurar_autostart_timezone() {
  cat > "$CHROOT_DIR/etc/xdg/autostart/set-timezone.desktop" << 'EOF'
[Desktop Entry]
Type=Application
Name=Set Timezone
Exec=timedatectl set-timezone America/Sao_Paulo
X-GNOME-Autostart-enabled=true
NoDisplay=true
Terminal=false
EOF

configurar_sessao_vmplayer() {
  echo "[11] Configurando sessão gráfica personalizada com VMPlayer..."

  # Cria .desktop da sessão
  cat > "$CHROOT_DIR/usr/share/xsessions/vmplayer-session.desktop" << 'EOF'
[Desktop Entry]
Name=VMPlayer Session
Comment=Inicia uma sessão com vmplayer personalizado
Exec=/usr/local/bin/start-vmplayer-session.sh
TryExec=/usr/local/bin/start-vmplayer-session.sh
Type=Application
DesktopNames=VMPLAYER
X-GNOME-Autostart-enabled=true
EOF

  # Script de inicialização da sessão
  cat > "$CHROOT_DIR/usr/local/bin/start-vmplayer-session.sh" << 'EOF'
#!/bin/bash

# Iniciar o vmplayer (pode ser expandido futuramente)
pgrep -x vmplayer >/dev/null || {
  echo "[INFO] Iniciando VMware Player..."
  vmplayer &
}

# Iniciar a sessão GNOME por padrão (pode ser substituído por xfce4-session etc.)
exec gnome-session
EOF

  chmod +x "$CHROOT_DIR/usr/local/bin/start-vmplayer-session.sh"

  # Define a sessão como padrão para o autologin
  sed -i '/^AutomaticLogin/ a DefaultSession=vmplayer-session.desktop' "$CHROOT_DIR/etc/gdm3/custom.conf"
}


  mkdir -p "$CHROOT_DIR/etc/polkit-1/localauthority/50-local.d"
  cat > "$CHROOT_DIR/etc/polkit-1/localauthority/50-local.d/10-timezone.pkla" <<EOF
[Allow timezone for all users]
Identity=unix-user:*
Action=org.freedesktop.timedate1.set-timezone
ResultActive=yes
EOF
}

gerar_imagem_e_menu() {
  echo "[13] Gerando imagem LTSP..."
  ltsp image "$CHROOT_DIR"
  bash ipxe_menu.sh "$NAME"
  bash reinicia.sh
}

# =============================
# EXECUÇÃO
# =============================
#echo "🚀 Criando imagem LTSP com Ubuntu $UBUNTU_VERSION e GDM3..."
#instalar_dependencias
#criar_chroot
#montar_bind_dirs
#customizar_visuais
#preparar_chroot
#configurar_sources
#instalar_dentro_do_chroot
#configurar_autostart_timezone
#onfigurar_sessao_vmplayer
desmontar_bind_dirs
#gerar_imagem_e_menu
echo "✅ Ambiente LTSP $UBUNTU_VERSION com GNOME e GDM3 pronto."