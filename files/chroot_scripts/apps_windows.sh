#!/bin/bash
# Root-only tasks for Ubuntu 22.04 - Instalação de pacotes e serviços

set -e

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

    if ! command -v docker >/dev/null; then
        echo "🐳 Docker não encontrado. Instalando pelo script oficial..."
        curl -fsSL https://get.docker.com | sh
    fi

    # Docker Compose plugin
    if ! docker compose version >/dev/null 2>&1; then
        echo "➕ Instalando docker-compose-plugin..."
        apt-get update
        apt-get install -y docker-compose-plugin
    fi

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