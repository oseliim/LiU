@echo off
echo ========================================
echo Sistema de Gerenciamento LTSP v2.0
echo ========================================
echo.

REM Verificar se estamos no diretório correto
if not exist "backend" (
    echo ERRO: Execute este script do diretorio GERENCIA
    pause
    exit /b 1
)

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python nao encontrado!
    pause
    exit /b 1
)

REM Verificar Node
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    pause
    exit /b 1
)

echo [1/4] Preparando backend...
cd backend

REM Criar venv se não existir
if not exist "venv" (
    echo Criando ambiente virtual...
    python -m venv venv
)

REM Ativar venv e instalar dependências
call venv\Scripts\activate.bat
echo Instalando dependencias do backend...
python -m pip install -q -r requirements.txt

echo.
echo [2/4] Iniciando backend...
start "Backend - LTSP Manager" cmd /k "cd /d %CD% && venv\Scripts\activate.bat && python app.py"

REM Aguardar backend iniciar
timeout /t 3 /nobreak >nul

cd ..

echo.
echo [3/4] Preparando frontend...
cd frontend

REM Instalar dependências se necessário
if not exist "node_modules" (
    echo Instalando dependencias do frontend...
    call npm install
)

echo.
echo [4/4] Iniciando frontend...
start "Frontend - LTSP Manager" cmd /k "npm run dev"

echo.
echo ========================================
echo Sistema iniciado!
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Pressione qualquer tecla para fechar esta janela...
echo (Os processos continuarao rodando)
echo ========================================
pause >nul

