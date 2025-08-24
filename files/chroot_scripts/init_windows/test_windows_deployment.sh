#!/bin/bash
# Script de teste para verificar a nova lógica de implantação

set -e

echo "🧪 Testando nova lógica de implantação do Windows..."
echo "=================================================="

# Configurações
TARBALL="windows10.tgz"
DOCKER_DIR="$HOME/docker_windows"
CONTAINER_NAME="windows"

echo "📋 Configurações:"
echo "   TARBALL: $TARBALL"
echo "   DOCKER_DIR: $DOCKER_DIR"
echo "   CONTAINER_NAME: $CONTAINER_NAME"
echo ""

# Teste 1: Verificar se o arquivo existe
echo "🔍 Teste 1: Verificando arquivo $TARBALL..."
if [ -f "$TARBALL" ]; then
    echo "✅ Arquivo $TARBALL encontrado"
    ls -lh "$TARBALL"
else
    echo "❌ Arquivo $TARBALL não encontrado"
    echo "   Você precisa ter o arquivo windows10.tgz no diretório atual"
fi
echo ""

# Teste 2: Verificar se o diretório já existe
echo "🔍 Teste 2: Verificando diretório $DOCKER_DIR..."
if [ -d "$DOCKER_DIR" ]; then
    echo "✅ Diretório $DOCKER_DIR já existe"
    echo "   Conteúdo do diretório:"
    ls -la "$DOCKER_DIR"
else
    echo "❌ Diretório $DOCKER_DIR não existe"
    echo "   Será criado durante a extração"
fi
echo ""

# Teste 3: Verificar dependências
echo "🔍 Teste 3: Verificando dependências..."
if command -v docker &> /dev/null; then
    echo "✅ Docker instalado: $(docker --version)"
else
    echo "❌ Docker não instalado"
fi

if command -v xfreerdp &> /dev/null; then
    echo "✅ xfreerdp instalado: $(xfreerdp /version 2>/dev/null || echo 'versão não disponível')"
else
    echo "❌ xfreerdp não instalado"
fi

if docker compose version &> /dev/null; then
    echo "✅ Docker Compose instalado: $(docker compose version)"
else
    echo "❌ Docker Compose não instalado"
fi
echo ""

# Teste 4: Simular extração (sem executar)
echo "🔍 Teste 4: Simulando extração..."
if [ -f "$TARBALL" ]; then
    echo "✅ Arquivo disponível para extração"
    echo "   Comando que será executado: tar -xzf $TARBALL -C $HOME"
else
    echo "❌ Arquivo não disponível para extração"
fi
echo ""

# Teste 5: Verificar comandos Docker
echo "🔍 Teste 5: Verificando comandos Docker..."
if [ -d "$DOCKER_DIR" ]; then
    echo "✅ Diretório existe, comandos que serão executados:"
    echo "   1. cd $DOCKER_DIR"
    echo "   2. docker compose up -d"
    echo "   3. docker start $CONTAINER_NAME"
else
    echo "❌ Diretório não existe ainda"
fi
echo ""

# Teste 6: Verificar IP local
echo "🔍 Teste 6: Verificando IP local..."
IP=$(ip route get 1 2>/dev/null | awk '{print $7; exit}' || echo "127.0.0.1")
echo "✅ IP local detectado: $IP"
echo "   Comando RDP que será executado:"
echo "   xfreerdp /v:$IP /u:aluno /p:aluno /sound:sys:pulse /microphone /clipboard /f /dynamic-resolution +auto-reconnect /cert:ignore"
echo ""

echo "🎯 Resumo dos testes:"
echo "====================="
if [ -f "$TARBALL" ]; then
    echo "✅ Arquivo de backup disponível"
else
    echo "❌ Arquivo de backup não encontrado"
fi

if [ -d "$DOCKER_DIR" ]; then
    echo "✅ Diretório docker_windows já existe"
else
    echo "⚠️  Diretório docker_windows será criado durante extração"
fi

if command -v docker &> /dev/null && command -v xfreerdp &> /dev/null; then
    echo "✅ Dependências principais instaladas"
else
    echo "❌ Algumas dependências estão faltando"
fi

echo ""
echo "🚀 Para executar a implantação completa, use:"
echo "   ./install_windows.sh"
echo ""
echo "🎨 Para executar com interface gráfica, use:"
echo "   ./autorun.sh"
