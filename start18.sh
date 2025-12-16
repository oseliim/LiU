#!/bin/bash

echo "=========================================="
echo "Instalação para Ubuntu 18.04"
echo "=========================================="
echo ""

# Atualizar sistema
echo "[1/5] Atualizando sistema..."
sudo apt update

# Instalar dependências básicas
echo "[2/5] Instalando dependências básicas..."
sudo apt install -y python3-pip python3-dev build-essential software-properties-common curl

# Instalar python3-venv
echo "[3/5] Instalando python3-venv..."
sudo apt install -y python3-venv

# Adicionar repositório para Python 3.8
echo "[4/5] Adicionando repositório Python 3.8..."
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.8 python3.8-venv python3.8-dev

# Instalar Node.js
echo "[5/5] Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

echo ""
echo "=========================================="
echo "Instalação concluída!"
echo ""
echo "Python 3.8: $(python3.8 --version)"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "=========================================="
