#!/bin/bash

echo "========================================"
echo "Sistema de Gerenciamento LTSP v2.0"
echo "========================================"
echo ""

# Verificar se estamos no diretório correto
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "ERRO: Execute este script do diretório GERENCIA"
    exit 1
fi

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "ERRO: Python3 não encontrado!"
    exit 1
fi

# Verificar Node
if ! command -v node &> /dev/null; then
    echo "ERRO: Node.js não encontrado!"
    exit 1
fi

echo "[1/4] Preparando backend..."
cd backend

# Criar venv se não existir
if [ ! -d "venv" ]; then
    echo "Criando ambiente virtual..."
    python3 -m venv venv
fi

# Ativar venv e instalar dependências
source venv/bin/activate
echo "Instalando dependências do backend..."
pip install -q -r requirements.txt

echo ""
echo "[2/4] Iniciando backend..."
gnome-terminal -- bash -c "cd $(pwd) && source venv/bin/activate && python app.py; exec bash" 2>/dev/null || \
xterm -e "cd $(pwd) && source venv/bin/activate && python app.py" 2>/dev/null || \
{
    echo "Backend iniciando em background..."
    source venv/bin/activate
    python app.py &
    BACKEND_PID=$!
}

# Aguardar backend iniciar
sleep 3

cd ..

echo ""
echo "[3/4] Preparando frontend..."
cd frontend

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências do frontend..."
    npm install
fi

echo ""
echo "[4/4] Iniciando frontend..."
gnome-terminal -- bash -c "cd $(pwd) && npm run dev; exec bash" 2>/dev/null || \
xterm -e "cd $(pwd) && npm run dev" 2>/dev/null || \
{
    echo "Frontend iniciando em background..."
    npm run dev &
    FRONTEND_PID=$!
}

cd ..

echo ""
echo "========================================"
echo "Sistema iniciado!"
echo ""
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Pressione Ctrl+C para parar"
echo "========================================"

# Aguardar sinais
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait

