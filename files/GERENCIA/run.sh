#!/bin/bash

# Script para executar o sistema completo
# Backend e Frontend

echo "=== Sistema de Gerenciamento Laboratorial LTSP v2.0 ==="
echo ""

# Verificar se estamos no diretório correto
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "Erro: Execute este script do diretório raiz do projeto (GERENCIA)"
    exit 1
fi

# Função para executar backend
run_backend() {
    echo "Iniciando backend..."
    cd backend
    
    # Verificar Python disponível (preferir 3.8+)
    if command -v python3.8 &> /dev/null; then
        PYTHON_CMD=python3.8
    elif command -v python3.9 &> /dev/null; then
        PYTHON_CMD=python3.9
    elif command -v python3.10 &> /dev/null; then
        PYTHON_CMD=python3.10
    else
        PYTHON_CMD=python3
        echo "Aviso: Usando python3 padrão. Flask 3.0 requer Python 3.8+"
    fi
    
    if [ ! -d "venv" ]; then
        echo "Criando ambiente virtual com $PYTHON_CMD..."
        $PYTHON_CMD -m venv venv
    fi
    source venv/bin/activate
    pip install -q --upgrade pip
    pip install -q -r requirements.txt
    echo "Backend rodando em http://localhost:5001"
    python app.py
}

# Função para executar frontend
run_frontend() {
    echo "Iniciando frontend..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        echo "Instalando dependências do frontend..."
        npm install
    fi
    echo "Frontend rodando em http://localhost:3000"
    npm run dev
}

# Executar em background
run_backend &
BACKEND_PID=$!

sleep 3

run_frontend &
FRONTEND_PID=$!

echo ""
echo "Sistema iniciado!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Pressione Ctrl+C para parar ambos os serviços"

# Aguardar sinais
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM

wait

