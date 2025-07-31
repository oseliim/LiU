#!/bin/bash
echo "[*] Instalando dependências de build..."
apt update
apt install -y build-essential linux-headers-$(uname -r) gcc make perl

echo "[*] Instalando e configurando VMware (espera-se que o .bundle já esteja instalado)"
# Se necessário, você pode instalar com:
# ./VMware-Player*.bundle --console --required --eulas-agreed

echo "[*] Criando systemd unit para compilar e carregar módulos VMware..."
cat > /etc/systemd/system/vmware-modules.service << 'EOF'
[Unit]
Description=Compile and load VMware kernel modules
Before=vmware.service
After=network-online.target local-fs.target
Requires=local-fs.target

[Service]
Type=oneshot
ExecStart=/usr/bin/vmware-modconfig --console --install-all
ExecStartPost=/sbin/depmod
ExecStartPost=/sbin/modprobe vmmon
ExecStartPost=/sbin/modprobe vmnet
RemainAfterExit=true

[Install]
WantedBy=multi-user.target
EOF

echo "[*] Habilitando serviço no boot do fat client..."
ln -sf /etc/systemd/system/vmware-modules.service /etc/systemd/system/multi-user.target.wants/vmware-modules.service