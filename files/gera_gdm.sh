#!/bin/bash
# gera_gdm.sh - Gera ambiente LTSP com Ubuntu, GDM3, autologin e configurações personalizadas

set -euo pipefail

# Parâmetros padrão
UBUNTU_VERSION="jammy"  # Ubuntu 22.04
HIDE_USERS=true
AUTOLOGIN=false
USER="aluno"

# Parse de argumentos
while [[ $# -gt 0 ]]; do
  case $1 in
    bionic|jammy)
      UBUNTU_VERSION="$1"
      shift
      ;;
    --autologin)
      AUTOLOGIN=true
      shift
      ;;
    --hide-users)
      HIDE_USERS=true
      shift
      ;;
    *)
      USER="$1"
      shift
      ;;
  esac
done

echo "[INFO] Criando imagem LTSP com Ubuntu $UBUNTU_VERSION e GDM3"
echo "[INFO] Usuário: $USER | Autologin: $AUTOLOGIN | Ocultar usuários: $HIDE_USERS"

# Diretórios e config
DISTRO="linux"
RELEASE="$UBUNTU_VERSION"
CHROOT_DIR="/srv/ltsp/${DISTRO}_${RELEASE}"
ARCH="amd64"
PASSWORD="$USER"
MIRROR="http://ubuntu.c3sl.ufpr.br/ubuntu/"

# Verifica dependências
echo "[1] Instalando dependências..."
apt-get update
apt-get install -y debootstrap squashfs-tools systemd-container ltsp curl wget gnupg2

# Criação do chroot
if [ ! -e "$CHROOT_DIR/etc/os-release" ]; then
  echo "[2] Criando chroot em $CHROOT_DIR..."
  mkdir -p "$CHROOT_DIR"
  debootstrap --arch="$ARCH" "$RELEASE" "$CHROOT_DIR" "$MIRROR"
else
  echo "[2] Chroot já existe. Pulando debootstrap."
fi

# Customizações visuais
echo "[3] Adicionando wallpaper e ícone personalizados..."
mkdir -p "$CHROOT_DIR/usr/share/backgrounds"
cp LIFTO_WALLPAPER_LI_BLACK.jpg "$CHROOT_DIR/usr/share/backgrounds/ltsp_wallpaper.jpg"
mkdir -p "$CHROOT_DIR/usr/share/icons/Yaru/scalable/actions"
cp LIFTO_ICON.svg "$CHROOT_DIR/usr/share/icons/Yaru/scalable/actions/view-app-grid-symbolic.svg"

# Força o wallpaper via gsettings ao logar
cat > "$CHROOT_DIR/etc/profile.d/set-wallpaper.sh" << 'EOF'
#!/bin/bash
if [[ "$XDG_CURRENT_DESKTOP" == *GNOME* ]] && command -v gsettings >/dev/null; then
   gsettings set org.gnome.desktop.background picture-uri 'file:///usr/share/backgrounds/ltsp_wallpaper.jpg'
fi
EOF
chmod +x "$CHROOT_DIR/etc/profile.d/set-wallpaper.sh"

# Bind mounts
for fs in dev proc sys; do
  if ! mountpoint -q "$CHROOT_DIR/$fs"; then
    echo "[4] Montando $fs..."
    mount --bind "/$fs" "$CHROOT_DIR/$fs"
  fi
done

# Cópia de scripts e diretórios temporários
cp apps_pre_install.sh "$CHROOT_DIR/"
chmod +x "$CHROOT_DIR/apps_pre_install.sh"
cp -r tmp "$CHROOT_DIR/"

# Sources list
cat > "$CHROOT_DIR/etc/apt/sources.list" <<EOF
deb http://ubuntu.c3sl.ufpr.br/ubuntu $UBUNTU_VERSION main universe multiverse restricted
deb http://ubuntu.c3sl.ufpr.br/ubuntu $UBUNTU_VERSION-updates main universe multiverse restricted
deb http://ubuntu.c3sl.ufpr.br/ubuntu $UBUNTU_VERSION-security main universe multiverse restricted
EOF
#SSH set-up#
cat > "$CHROOT_DIR/etc/init.d/ltsp-ssh-init" << 'EOF'
#!/bin/bash
### BEGIN INIT INFO
# Provides:          ltsp-ssh-init
# Required-Start:    $network
# Required-Stop:
# Default-Start:     2 3 4 5
# Default-Stop:
# Short-Description: Gera chaves SSH e reinicia o serviço
### END INIT INFO

case "$1" in
  start)
    echo "[ltsp-ssh-init] Gerando chaves SSH (se necessário)..."
    ssh-keygen -A
    echo "[ltsp-ssh-init] Reiniciando o serviço SSH..."
    systemctl restart ssh || service ssh restart

    ;;
  *)
    echo "Uso: /etc/init.d/ltsp-ssh-init start"
    exit 1
    ;;
esac

exit 0
EOF
chmod +x "$CHROOT_DIR/etc/init.d/ltsp-ssh-init"

#Define X11 como gerencidor grafico (necessario para epoptes)
sed -i 's/^#\?\s*WaylandEnable=.*/WaylandEnable=false/' "$CHROOT_DIR/etc/gdm3/custom.conf"

# Instalação dos pacotes dentro do chroot
chroot "$CHROOT_DIR" bash -c "
export DEBIAN_FRONTEND=noninteractive
apt-get update

echo '[5] Instalando pacotes principais...'
apt-get install --install-recommends -y \
  gdm3 ubuntu-desktop-minimal xterm curl wget firefox \
  epoptes-client policykit-1 network-manager dbus \
  software-properties-common systemd-sysv

echo '[6] Instalação do kernel e initramfs...'
apt install --reinstall -y linux-generic initramfs-tools
update-initramfs -u

echo '[7] Configurando localização e teclado...'
apt-get install -y language-pack-pt language-pack-pt-base
locale-gen pt_BR.UTF-8
update-locale LANG=pt_BR.UTF-8 LANGUAGE=pt_BR:pt LC_ALL=pt_BR.UTF-8
sed -i 's/^XKBLAYOUT=.*/XKBLAYOUT="br"/' /etc/default/keyboard
timedatectl set-timezone America/Sao_Paulo

#Epoptes
  apt-get install --install-recommends epoptes-client -y
  epoptes-client -c  
#Instalando Google-Chrome
  apt install curl -y
  curl -fsSLO https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
  apt-get install -y ./google-chrome-stable_current_amd64.deb && \
  rm -f google-chrome-stable_current_amd64.deb && \
  update-alternatives --install /usr/bin/x-www-browser x-www-browser /usr/bin/google-chrome-stable 200
#SSH
  apt install openssh-server -y
  ssh-keygen -A
  systemctl enable ssh

echo '[8] Aplicando configurações DConf...'
mkdir -p /etc/dconf/db/local.d

cat > /etc/dconf/db/local.d/00-wallpaper <<EOF
[org/gnome/desktop/background]
picture-uri='file:///usr/share/backgrounds/ltsp_wallpaper.jpg'
picture-options='zoom'
EOF

cat > /etc/dconf/db/local.d/00-lockdown <<EOF
[org/gnome/desktop/lockdown]
disable-user-switching=true
disable-lock-screen=true

[org/gnome/desktop/screensaver]
lock-enabled=false
user-switch-enabled=false
EOF

mkdir -p /etc/dconf/profile
echo 'user-db:user' > /etc/dconf/profile/user
echo 'system-db:local' >> /etc/dconf/profile/user
dconf update

echo '[10] Executando script de apps personalizados...'
#bash /apps_pre_install.sh
apt install virtualbox
update-rc.d ltsp-ssh-init defaults

apt install net-tools -y
"

# Obriga horário certo
cat > "$CHROOT_DIR/etc/xdg/autostart/set-timezone.desktop" << 'EOF'
[Desktop Entry]
Type=Application
Name=Set Timezone
Exec=timedatectl set-timezone America/Sao_Paulo
X-GNOME-Autostart-enabled=true
NoDisplay=true
Terminal=false
EOF
mkdir -p "$CHROOT_DIR/etc/polkit-1/localauthority/50-local.d"

cat > "$CHROOT_DIR/etc/polkit-1/localauthority/50-local.d/10-timezone.pkla" <<EOF
[Allow timezone for all users]
Identity=unix-user:*
Action=org.freedesktop.timedate1.set-timezone
ResultActive=yes
EOF


# --- Configurar PAM para permitir acesso ao home ---
echo "[11] Configurando PAM para garantir acesso ao diretório home..."
# Garantir que o módulo pam_mkhomedir.so esteja habilitado para criar o diretório home se não existir
if [ -f "$CHROOT_DIR/etc/pam.d/common-session" ]; then
  if ! grep -q "pam_mkhomedir.so" "$CHROOT_DIR/etc/pam.d/common-session"; then
    echo "session optional pam_mkhomedir.so skel=/etc/skel umask=077" >> "$CHROOT_DIR/etc/pam.d/common-session"
  fi
fi

# --- Desmonta os binds ---
echo "[12] Desmontando sistemas montados..."
for fs in dev proc sys; do
  umount "$CHROOT_DIR/$fs" || true
done

# --- Gera a imagem ---
echo "[13] Gerando imagem LTSP..."
ltsp image "$CHROOT_DIR"

# --- Reinicia rede PXE / serviços ---
echo "[14] Reiniciando Serviços..."
bash reinicia.sh

# --- Mensagem final ---
echo "✅ Ambiente LTSP $UBUNTU_VERSION com GNOME e GDM3 pronto."
echo "   Usuário: $USER"
if [ "$AUTOLOGIN" = true ]; then
  echo "   ✓ Autologin GDM ativado"
fi
if [ "$HIDE_USERS" = true ]; then
  echo "   ✓ Ocultação e bloqueio de troca de usuário ativado"
fi
