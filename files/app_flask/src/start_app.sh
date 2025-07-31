#!/bin/bash

# Navega para a pasta do projeto
cd /home/alvaro/Desktop/web_installer_ltsp/app_flask/src/

# Ativa o ambiente virtual (cria se não existir)
if [ ! -d "../venv" ]; then
    python3 -m venv ../venv
    echo "Ambiente virtual criado."
fi

source ../venv/bin/activate

# Instala dependências (se necessário)
pip install flask

# Inicia a aplicação
python3 main.py

sleep 2

# Tenta abrir no navegador padrão
xdg-open brave http://127.0.0.1:5001

# Mantém o terminal aberto
read -p "Pressione Enter para encerrar..."
