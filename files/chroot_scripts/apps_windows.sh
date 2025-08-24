#!/bin/bash
# Root-only tasks for Ubuntu 22.04 - Instalação de pacotes e serviços

require_root() {
    if [ "$(id -u)" -ne 0 ]; then
        echo "⛔ Este script deve ser executado como root (use sudo)."
        exit 1
    fi
}

install_gtk4_deps() {
    echo "🔧 Instalando dependências de desenvolvimento GTK4..."
    apt-get install -y \
        libgtk-4-dev \
        build-essential \
        pkg-config \
        libglib2.0-dev \
        libcairo2-dev \
        libgraphene-1.0-dev \
        libwayland-dev
    echo "✅ Dependências GTK4 instaladas"
}

install_docker_stack() {
    echo "🔧 Verificando/instalando Docker e complementos..."

echo "🔧 Instalando Docker via repositório (mais rápido)..."
    
    # Adicionar repositório oficial do Docker
    apt-get update
    apt-get install -y ca-certificates curl
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc

    # Adicionar repositório
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Instalar Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    echo "✅ Docker instalado via repositório"

    # xfreerdp
    if ! command -v xfreerdp >/dev/null 2>&1; then
        echo "➕ Instalando xfreerdp..."
        apt-get install -y freerdp2-x11
    fi

    # Ensure docker service is enabled and running
    echo "🛠️  Habilitando e iniciando serviço docker..."
    systemctl enable docker
    systemctl start docker

    echo "✅ Docker e dependências instalados"
}

main() {
    require_root
    echo "=== Instalação de Pacotes e Serviços ==="
    install_gtk4_deps
    install_docker_stack
    echo "✅ Concluído. Pacotes instalados e serviços iniciados."
}

main "$@"