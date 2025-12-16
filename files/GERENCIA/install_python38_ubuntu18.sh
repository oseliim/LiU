#!/bin/bash

# Script para instalar Python 3.8+ no Ubuntu 18.04
# Flask 3.0.0 requer Python 3.8+

echo "=== Instalando Python 3.8+ para Ubuntu 18.04 ==="
echo ""

# Verificar versão atual do Python
CURRENT_PYTHON=$(python3 --version 2>/dev/null || echo "não instalado")
echo "Versão atual do Python: $CURRENT_PYTHON"

# Verificar se já tem Python 3.8+
if command -v python3.8 &> /dev/null; then
    PYTHON_VERSION=$(python3.8 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
    MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
    if [ "$MAJOR" -ge 3 ] && [ "$MINOR" -ge 8 ]; then
        echo "Python $PYTHON_VERSION já está instalado e é compatível!"
        exit 0
    fi
fi

# Adicionar repositório deadsnakes
echo "Adicionando repositório deadsnakes..."
sudo apt update
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update

# Instalar Python 3.8
echo "Instalando Python 3.8..."
sudo apt install -y python3.8 python3.8-venv python3.8-dev python3.8-distutils

# Instalar pip para Python 3.8
echo "Instalando pip para Python 3.8..."
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.8

# Verificar instalação
echo ""
echo "=== Verificação ==="
PYTHON_VERSION=$(python3.8 --version 2>/dev/null)
PIP_VERSION=$(python3.8 -m pip --version 2>/dev/null || echo "pip não encontrado")
echo "Python instalado: $PYTHON_VERSION"
echo "pip instalado: $PIP_VERSION"

# Verificar se a instalação foi bem-sucedida
if [ -n "$PYTHON_VERSION" ]; then
    echo ""
    echo "✓ Python 3.8 instalado com sucesso!"
    echo ""
    echo "Para usar Python 3.8 no venv:"
    echo "  python3.8 -m venv venv"
    echo "  source venv/bin/activate"
else
    echo ""
    echo "✗ Erro na instalação do Python 3.8"
    exit 1
fi

