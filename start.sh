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

# Detectar versão do Python (priorizar 3.8+)
PYTHON_CMD="python3"
if command -v python3.8 &> /dev/null; then
    PYTHON_CMD="python3.8"
elif command -v python3.9 &> /dev/null; then
    PYTHON_CMD="python3.9"
fi

# Verificar Python
if ! command -v $PYTHON_CMD &> /dev/null; then
    echo "ERRO: Python3 não encontrado!"
    exit 1
fi

echo "Usando Python: $($PYTHON_CMD --version)"

# Carregar NVM se disponível
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
fi

# Verificar Node
if ! command -v node &> /dev/null; then
    echo "ERRO: Node.js não encontrado!"
    echo "Instale Node.js via NVM: nvm install 14"
    exit 1
fi

echo "Usando Node.js: $(node --version)"
echo "Usando npm: $(npm --version)"

echo "[1/4] Preparando backend..."
cd backend

# Remover venv antigo se for do Windows
if [ -d "venv" ] && [ -f "venv/Scripts/activate" ]; then
    echo "Venv do Windows detectado. Recriando para Linux..."
    rm -rf venv
fi

# Criar venv se não existir
if [ ! -d "venv" ]; then
    echo "Criando ambiente virtual com $PYTHON_CMD..."
    $PYTHON_CMD -m venv venv
    if [ $? -ne 0 ]; then
        echo "ERRO: Falha ao criar ambiente virtual!"
        exit 1
    fi
fi

# Definir caminho do activate
VENV_ACTIVATE="venv/bin/activate"

# Verificar se o activate existe
if [ ! -f "$VENV_ACTIVATE" ]; then
    echo "ERRO: Arquivo activate não encontrado em $VENV_ACTIVATE"
    echo "Tentando recriar venv..."
    rm -rf venv
    $PYTHON_CMD -m venv venv
    if [ ! -f "$VENV_ACTIVATE" ]; then
        echo "ERRO: Não foi possível criar o ambiente virtual!"
        exit 1
    fi
fi

# Ativar venv e atualizar pip
source "$VENV_ACTIVATE"
echo "Atualizando pip..."
python -m pip install --upgrade pip setuptools wheel --quiet

# Usar requirements compatível se existir
REQUIREMENTS_FILE="requirements.txt"
if [ -f "requirements-ubuntu18.txt" ]; then
    REQUIREMENTS_FILE="requirements-ubuntu18.txt"
    echo "Usando requirements-ubuntu18.txt para compatibilidade"
fi

echo "Instalando dependências do backend..."
python -m pip install -q -r "$REQUIREMENTS_FILE"

echo ""
echo "[2/4] Iniciando backend..."
BACKEND_DIR=$(pwd)
gnome-terminal -- bash -c "cd $BACKEND_DIR && source $VENV_ACTIVATE && python app.py; exec bash" 2>/dev/null || \
xterm -e "cd $BACKEND_DIR && source $VENV_ACTIVATE && python app.py" 2>/dev/null || \
{
    echo "Backend iniciando em background..."
    source "$VENV_ACTIVATE"
    python app.py &
    BACKEND_PID=$!
}

# Aguardar backend iniciar
sleep 3

cd ..

echo ""
echo "[3/4] Preparando frontend..."
cd frontend

# Carregar nvm novamente se necessário
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
fi

# Limpar node_modules antigo se existir (opcional - descomente se necessário)
# if [ -d "node_modules" ]; then
#     echo "Removendo node_modules antigo..."
#     rm -rf node_modules package-lock.json
# fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências do frontend..."
    npm install
fi

echo ""
echo "[4/4] Iniciando frontend..."
FRONTEND_DIR=$(pwd)
gnome-terminal -- bash -c "cd $FRONTEND_DIR && npm run dev; exec bash" 2>/dev/null || \
xterm -e "cd $FRONTEND_DIR && npm run dev" 2>/dev/null || \
{
    echo "Frontend iniciando em background..."
    npm run dev &
    FRONTEND_PID=$!
}

cd ..

echo ""
echo "=========================================="
echo "Sistema iniciado!"
echo ""
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Pressione Ctrl+C para parar"
echo "=========================================="

# Aguardar sinais
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
