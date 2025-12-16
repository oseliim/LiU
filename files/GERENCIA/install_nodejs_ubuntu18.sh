#!/bin/bash

# Script para instalar/atualizar Node.js no Ubuntu 18.04
# Node.js v8.10.0 é muito antigo para Vite (requer Node.js 14+)

echo "=== Instalando Node.js 18.x para Ubuntu 18.04 ==="
echo ""

# Verificar versão atual do Node.js
CURRENT_NODE=$(node -v 2>/dev/null || echo "não instalado")
echo "Versão atual do Node.js: $CURRENT_NODE"

# Verificar se já tem Node.js 14+
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 14 ]; then
        echo "Node.js versão $NODE_VERSION já está instalado e é compatível!"
        exit 0
    fi
fi

# Instalar Node.js 18.x usando NodeSource
echo "Instalando Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
echo ""
echo "=== Verificação ==="
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo "Node.js instalado: $NODE_VERSION"
echo "npm instalado: $NPM_VERSION"

# Verificar se a instalação foi bem-sucedida
if [ "$?" -eq 0 ]; then
    echo ""
    echo "✓ Node.js instalado com sucesso!"
    echo "Agora você pode executar 'npm install' no diretório frontend"
else
    echo ""
    echo "✗ Erro na instalação do Node.js"
    exit 1
fi


