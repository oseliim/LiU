#!/bin/bash

CHROOT_DIR="/srv/ltsp/windows"
MIRROR="http://ubuntu.c3sl.ufpr.br/ubuntu/"
UBUNTU_VERSION="jammy"
debootstrap --arch=amd64 jammy "$CHROOT_DIR" "$MIRROR"

# --- Montagens básicas ---
for fs in dev proc sys; do
  if ! mountpoint -q "$CHROOT_DIR/$fs"; then
    echo "[3] Montando /$fs em $CHROOT_DIR..."
    mount --bind "/$fs" "$CHROOT_DIR/$fs"
  else
    echo "[3] $CHROOT_DIR/$fs já está montado."
  fi
done

cat > "$CHROOT_DIR/etc/apt/sources.list" <<EOF
deb http://archive.ubuntu.com/ubuntu $UBUNTU_VERSION main universe multiverse restricted
deb http://archive.ubuntu.com/ubuntu $UBUNTU_VERSION-updates main universe multiverse restricted
deb http://archive.ubuntu.com/ubuntu $UBUNTU_VERSION-security main universe multiverse restricted
EOF

#Configurando inicialização da máquina virtual com WINDOWS
cat << 'EOF' > "$CHROOT_DIR/etc/xdg/autostart/start-vm.desktop"
[Desktop Entry]
Type=Application
Name=Start User VM
Exec=/usr/local/bin/start_user_vm.sh
OnlyShowIn=XFCE;LXDE;MATE;GNOME;Unity;
X-GNOME-Autostart-enabled=true
Terminal=false
EOF

cat << 'EOF' > "$CHROOT_DIR/usr/local/bin/start_user_vm.sh"
#!/bin/bash

VM_NAME="VM-$(whoami)"


EOF

chmod +x "$CHROOT_DIR/usr/local/bin/start_user_vm.sh"

#Instala ambiente gráfico mínimo

chroot "$CHROOT_DIR" /bin/bash -c "
  export DEBIAN_FRONTEND=noninteractive
  apt-get update

  # Instalar pacotes básicos
  apt install --no-install-recommends -y linux-generic initramfs-tools
  apt install -y software-properties-common

  apt install nano vim gedit -y

  apt install --install-recommends -y ltsp
  apt install -y xfce4 
  apt install -y lightdm lightdm-gtk-greeter
  apt install -y network-manager dbus policykit-1  

  apt install -y mousepad xfce4-terminal thunar
  apt autoremove -y
  
  apt install -y libgtk-3-bin
  apt install -y xfce4 lightdm lightdm-gtk-greeter
  apt install -y adwaita-icon-theme gnome-themes-extra

  # Virtualização
  #apt install -y qemu qemu-kvm libvirt-daemon libvirt-daemon-system virtinst


  # Garante que a linha XKBLAYOUT seja substituída
  sed -i 's/^XKBLAYOUT=.*/XKBLAYOUT="br"/' /etc/default/keyboard
"

# --- Desmontagem ---
#echo "[11] Desmontando bind mounts..."
#for fs in dev proc sys; do
 #umount "$CHROOT_DIR/$fs" || true
#done

#ltsp image $CHROOT_DIR