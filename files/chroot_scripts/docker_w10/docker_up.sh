# 1. Parar tudo
systemctl stop docker docker.socket containerd

# 2. Criar diretórios no disco real (/home está em /dev/sda1)
mkdir -p /home/docker-data
mkdir -p /home/containerd-data

# 3. Configurar o Docker para usar /home
cat > /etc/docker/daemon.json << 'EOF'
{
  "data-root": "/home/docker-data"
}
EOF

# 4. Configurar o containerd para usar /home
mkdir -p /etc/containerd
cat > /etc/containerd/config.toml << 'EOF'
version = 2

[plugins."io.containerd.grpc.v1.cri"]
  [plugins."io.containerd.grpc.v1.cri".containerd]
    snapshotter = "overlayfs"

[plugins."io.containerd.snapshotter.v1.overlayfs"]
  root_path = "/home/containerd-data"
EOF

# 5. Limpar dados antigos
rm -rf /var/lib/containerd
rm -rf /var/lib/docker

# 6. Subir os serviços
systemctl start containerd
systemctl start docker

# 7. Verificar se está ok
docker info | grep -E "Storage Driver|Docker Root Dir"
