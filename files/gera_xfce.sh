#!/bin/bash
# gera_xfce.sh
# Gera ambiente chroot LTSP para Ubuntu com XFCE e configurações personalizadas

#set -euo pipefail

# Processamento de parâmetros
UBUNTU_VERSION="jammy"  # Padrão: Ubuntu 22.04 (Jammy)


# Verificar parâmetros
while [[ $# -gt 0 ]]; do
  case $1 in
    bionic|jammy)
      UBUNTU_VERSION="$1"
      shift
      ;;
    *)
      # Assume que é o nome de usuário
      USER="$1"
      shift
      ;;
  esac
done

echo "[INFO] Configurando ambiente LTSP com Ubuntu $UBUNTU_VERSION (${UBUNTU_VERSION^})"
echo "[INFO] Autologin: $AUTOLOGIN"
echo "[INFO] Ocultar usuários: $HIDE_USERS"
echo "[INFO] Usuário principal: $USER"

# ---------------- CONFIGURÁVEIS -------------------
DISTRO="ubuntuxfce"
RELEASE="$UBUNTU_VERSION"
CHROOT_DIR="/srv/ltsp/${DISTRO}_${RELEASE}"
NAME="${DISTRO}_${RELEASE}"
ARCH="amd64"
PASSWORD="$USER"  # Por compatibilidade, mantém a senha igual ao nome de usuário
MIRROR="http://ubuntu.c3sl.ufpr.br/ubuntu/"
# --------------------------------------------------

echo "[1] Verificando dependências do host..."
apt-get update
apt-get install -y debootstrap squashfs-tools systemd-container ltsp

# --- Criação do chroot se necessário ---
if [ ! -e "$CHROOT_DIR/etc/os-release" ]; then
  echo "[2] Criando novo chroot Ubuntu $UBUNTU_VERSION em $CHROOT_DIR..."
  mkdir -p "$CHROOT_DIR"
  debootstrap --arch="$ARCH" "$UBUNTU_VERSION" "$CHROOT_DIR" "$MIRROR"
else
  echo "[2] Chroot já existe. Pulando debootstrap."
fi

# --- Montagens ---
for fs in dev proc sys; do
  if ! mountpoint -q "$CHROOT_DIR/$fs"; then
    echo "[3] Montando /$fs em $CHROOT_DIR..."
    mount --bind "/$fs" "$CHROOT_DIR/$fs"
  else
    echo "[3] $CHROOT_DIR/$fs já está montado."
  fi
done

#Copia os apps script
cp apps_pre_install.sh $CHROOT_DIR/
chmod +x $CHROOT_DIR/apps_pre_install.sh
cp -r tmp $CHROOT_DIR/

#--WALLPAPER --#
mkdir -p "$CHROOT_DIR/usr/share/backgrounds/"
cp LIFTO_WALLPAPER_LI_BLACK.jpg "$CHROOT_DIR/usr/share/backgrounds/ltsp_wallpaper.jpg"

# --- Configurando sources.list e instalando pacotes ---
echo "[4] Configurando sources.list no chroot para $UBUNTU_VERSION..."
cat > "$CHROOT_DIR/etc/apt/sources.list" <<EOF
deb http://archive.ubuntu.com/ubuntu $UBUNTU_VERSION main universe multiverse restricted
deb http://archive.ubuntu.com/ubuntu $UBUNTU_VERSION-updates main universe multiverse restricted
deb http://archive.ubuntu.com/ubuntu $UBUNTU_VERSION-security main universe multiverse restricted
EOF

echo "[5] Instalando pacotes no chroot..."
chroot "$CHROOT_DIR" /bin/bash -c "
  export DEBIAN_FRONTEND=noninteractive
  apt-get update

  # Instalar pacotes básicos
  apt install --no-install-recommends -y linux-generic initramfs-tools
  apt install -y software-properties-common

  apt install nano vim gedit -y
  
  # Adicionar repositórios
  add-apt-repository -y ppa:ltsp
  add-apt-repository -y universe
  apt update
  
  # Instalar LTSP e ambiente gráfico
  apt install --install-recommends -y ltsp
  apt install -y xfce4 
  apt install -y lightdm lightdm-gtk-greeter
  apt install -y network-manager dbus policykit-1
  systemctl enable NetworkManager
  
  # Instalar aplicativos básicos
  apt install -y mousepad xfce4-terminal thunar
  apt autoremove -y
  
  apt install -y libgtk-3-bin
  apt install -y xfce4 lightdm lightdm-gtk-greeter
  apt install -y adwaita-icon-theme gnome-themes-extra

  gtk-update-icon-cache
  
  # Instalar kernel e atualizar initramfs
  apt install --reinstall linux-generic initramfs-tools -y
  update-initramfs -u

  # Instalando Google-Chrome
  apt install curl -y
  curl -fsSLO https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
  apt-get install -y ./google-chrome-stable_current_amd64.deb && \
  rm -f google-chrome-stable_current_amd64.deb && \
  update-alternatives --install /usr/bin/x-www-browser x-www-browser /usr/bin/google-chrome-stable 200

  #Teclado em portugues
  sed -i 's/^XKBLAYOUT=.*/XKBLAYOUT="br"/' /etc/default/keyboard

  #epoptes
  apt-get install --install-recommends epoptes-client
  epoptes-client -c

  bash apps_pre_install.sh
"

#Setando Wallpaper#
cat > "$CHROOT_DIR/usr/local/bin/set-wallpaper.sh" <<'EOF'
#!/bin/bash

IMAGEM="/usr/share/backgrounds/ltsp_wallpaper.jpg"
MAX_WAIT=30 # Wait up to 30 seconds

echo "[INFO] Set-Wallpaper: Aguardando sessão XFCE..."

# Espera até que o xfdesktop esteja rodando e o xfconf-query funcione
for i in $(seq 1 $MAX_WAIT); do
    # Verifica se xfdesktop está rodando
    if pgrep -x xfdesktop >/dev/null 2>&1; then
        # Tenta obter as propriedades. Se funcionar, a sessão está pronta.
        PROPERTIES=$(xfconf-query -c xfce4-desktop -l | grep '/backdrop/screen.*/monitor.*/workspace.*/last-image')
        if [ -n "$PROPERTIES" ]; then
            echo "[INFO] Set-Wallpaper: Sessão XFCE pronta."
            break
        fi
    fi
    if [ $i -eq $MAX_WAIT ]; then
        echo "[ERROR] Set-Wallpaper: Timeout esperando pela sessão XFCE ou xfconf-query."
        exit 1
    fi
    sleep 1
done

echo "[INFO] Set-Wallpaper: Definindo wallpaper para $IMAGEM..."

# Tenta definir o wallpaper para todas as telas/monitores/workspaces encontrados
PROPERTIES=$(xfconf-query -c xfce4-desktop -l | grep '/backdrop/screen.*/monitor.*/workspace.*/last-image')

if [ -z "$PROPERTIES" ]; then
    echo "[WARN] Set-Wallpaper: Não foi possível encontrar propriedades de wallpaper via xfconf-query. Tentando propriedades padrão."
    # Tenta definir propriedades padrão como fallback (pode não funcionar em todas as configs)
    xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitor0/workspace0/last-image -s "$IMAGEM"
    xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitorVGA-1/workspace0/last-image -s "$IMAGEM" # Exemplo comum
else
    for PROP in $PROPERTIES; do
        echo "[INFO] Set-Wallpaper: Definindo propriedade $PROP"
        xfconf-query -c xfce4-desktop -p "$PROP" -s "$IMAGEM"
    done
fi

# Força a atualização do desktop
echo "[INFO] Set-Wallpaper: Recarregando xfdesktop..."
# Tenta primeiro o reload, depois o kill HUP como fallback
if ! xfdesktop --reload; then
    echo "[WARN] Set-Wallpaper: xfdesktop --reload falhou, tentando killall -HUP xfdesktop."
    killall -HUP xfdesktop || echo "[ERROR] Set-Wallpaper: Falha ao recarregar xfdesktop via killall."
fi

echo "[INFO] Set-Wallpaper: Script concluído."
exit 0
EOF

chmod +x "$CHROOT_DIR/usr/local/bin/set-wallpaper.sh"

cat << 'EOF' > "$CHROOT_DIR/etc/xdg/autostart/set-wallpaper.desktop"
[Desktop Entry]
Type=Application
Name=Set LTSP Wallpaper
Exec=/usr/local/bin/set-wallpaper.sh
OnlyShowIn=XFCE;
X-GNOME-Autostart-enabled=true
NoDisplay=false
Terminal=false
EOF

# --- Desmontagem de segurança ---
echo "[9] Desmontando dev, proc, sys..."
for fs in dev proc sys; do
  umount "$CHROOT_DIR/$fs" || true
done

# --- Exportando imagem LTSP ---
echo "[10] Exportando imagem squashfs com ltsp image..."
ltsp image "$CHROOT_DIR"


# --- Atualizando initrd e NFS/iPXE ---
echo "[11] Atualizando initrd e serviços de rede..."
bash reinicia.sh

# --- Gerando Menu IPXE customizado ---
bash ipxe_menu.sh $NAME

echo "✅ Ambiente LTSP ${UBUNTU_VERSION^} com XFCE pronto para o usuário"
