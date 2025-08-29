#!/bin/bash

# 1. Garante que o script está a ser executado como root (sudo)
if [[ $EUID -ne 0 ]]; then
    echo "Este script precisa ser executado com sudo." 
    exit 1
fi

# 2. Obtém o diretório absoluto de onde o script de instalação está
#    Esta parte do seu código original estava correta!
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 3. Define o caminho completo para o script que o serviço vai executar
EXEC_SCRIPT_PATH="${DIR}/interface_gerencia/run.sh"

# Garante que o script a ser executado pelo serviço também tenha permissão de execução
chmod +x "$EXEC_SCRIPT_PATH"

# 4. Cria o arquivo de serviço usando um Here Document e o comando 'tee'
#    Isto resolve o problema de permissão de escrita.
cat << EOF | tee /etc/systemd/system/gerencia.service
[Unit]
Description=Rodar gerência no boot
After=network.target

[Service]
Type=simple
# A variável $EXEC_SCRIPT_PATH é expandida AQUI, escrevendo o caminho completo no arquivo.
ExecStart=$EXEC_SCRIPT_PATH
Restart=on-failure
# É uma boa prática definir o diretório de trabalho para o mesmo do script
WorkingDirectory=$(dirname "$EXEC_SCRIPT_PATH")

[Install]
WantedBy=multi-user.target
EOF

chmod +x /etc/systemd/system/gerencia.service

# 5. Recarrega o systemd para que ele leia o novo arquivo de serviço
echo "A recarregar o daemon do systemd..."
systemctl daemon-reload

# 6. Ativa o serviço para iniciar no boot e inicia-o imediatamente
echo "A ativar e iniciar o serviço gerencia.service..."
systemctl enable gerencia.service
systemctl start gerencia.service

echo "Serviço 'gerencia.service' criado e iniciado com sucesso!"
