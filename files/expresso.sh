#!/bin/bash

# =====================
# expresso.sh - Instalação e configuração automatizada para laboratório
# =====================

# Função para enviar progresso
send_progress() {
    echo "PROGRESS:$1:$2"
}

# Etapa 1: Instala pacotes básicos
send_progress "step1" "Iniciando instalação de pacotes básicos..."
bash auto_install.sh
if [[ $? -eq 0 ]]; then
    send_progress "step1" "Instalação de pacotes básicos concluída."
else
    send_progress "step1" "Erro na instalação de pacotes básicos."
    exit 1
fi

# Etapa 2: Download
send_progress "step2" "Iniciando download do arquivo..."
HOME_PATH="$HOME"
FILE_PATH="$HOME_PATH/liu_expresso.tgz"
FILE_PATH_ROOT="/root/liu_expresso.tgz"
FILE_PATH_ROOT_FINAL="/liu_expresso.tgz"
if [[ -f "$FILE_PATH_ROOT_FINAL" ]]; then
    # File already present in /
    send_progress "step2_progress" "100%"
    send_progress "step2" "Arquivo liu_expresso.tgz já presente em /. Pulando download."
elif [[ -f "$FILE_PATH" ]]; then
    # File present in home
    send_progress "step2_progress" "100%"
    send_progress "step2" "Arquivo liu_expresso.tgz encontrado em home. Movendo para /."
    mv "$FILE_PATH" /liu_expresso.tgz
elif [[ -f "$FILE_PATH_ROOT" ]]; then
    # File present in /root
    send_progress "step2_progress" "100%"
    send_progress "step2" "Arquivo liu_expresso.tgz encontrado em /root. Movendo para /."
    mv "$FILE_PATH_ROOT" /liu_expresso.tgz
else
    wget -P "$HOME_PATH" 'http://200.129.176.42/files/liu_expresso.tgz' 2>&1 | while read -r line; do
        if [[ $line =~ ([0-9]+)% ]]; then
            percent="${BASH_REMATCH[1]}"
            # Only send progress update if percent changed
            if [[ "$percent" != "$last_percent" ]]; then
                send_progress "step2_progress" "$percent%"
                last_percent="$percent"
            fi
        fi
    done
    if [[ $? -eq 0 ]]; then
        send_progress "step2" "Download concluído."
        mv "$FILE_PATH" /liu_expresso.tgz
    else
        send_progress "step2" "Erro no download."
        exit 1
    fi
fi

# Etapa 3: Extração
send_progress "step3" "Iniciando extração do arquivo..."
tar -xvf /liu_expresso.tgz -C /
if [[ $? -eq 0 ]]; then
    send_progress "step3" "Extração concluída."
else
    send_progress "step3" "Erro na extração."
    exit 1
fi

# Etapa 4: Criação de usuários
send_progress "step4" "Criando usuário padrão..."
send_progress "step4_progress" "10%"
bash user_conf.sh aluno aluno #Criando aluno padrão
if [[ $? -eq 0 ]]; then
    send_progress "step4" "Usuário criado com sucesso."
    send_progress "step4_progress" "30%"
else
    send_progress "step4" "Erro na criação do usuário."
    exit 1
fi

# Alterando dnsmasq
send_progress "step4" "Alterando configuração do dnsmasq..."
send_progress "step4_progress" "50%"

NET_FILE="tmp/network_data.txt"
CONF_FILE="/etc/dnsmasq.d/ltsp-dnsmasq.conf"

bash network.sh

if [[ ! -f "$NET_FILE" ]]; then
    send_progress "step4" "Erro: Arquivo $NET_FILE não encontrado."
    exit 1
fi

send_progress "step4" "Lendo informações de rede..."

IP_CIDR=$(grep "IP Address" "$NET_FILE" | awk -F': ' '{print $2}')
NETMASK=$(grep "Netmask" "$NET_FILE" | awk -F': ' '{print $2}')
GATEWAY=$(grep "Gateway" "$NET_FILE" | awk -F': ' '{print $2}')

IP=$(echo "$IP_CIDR" | cut -d'/' -f1)
CIDR=$(echo "$IP_CIDR" | cut -d'/' -f2)

if ! command -v ipcalc &>/dev/null; then
    send_progress "step4" "Erro: Utilitário 'ipcalc' não instalado."
    exit 1
fi

REDE=$(ipcalc "$IP/$CIDR" | grep "Network:" | awk '{print $2}' | cut -d'/' -f1)

send_progress "step4" "Criando backup da configuração dnsmasq..."
send_progress "step4_progress" "70%"

# Diretório de backup
BKP_DIR="/etc/dnsmasq.d/bkp"
mkdir -p "$BKP_DIR"

# Copiando arquivo de configuração para o diretório de backup
cp "$CONF_FILE" "$BKP_DIR/$(basename "$CONF_FILE").bak"
send_progress "step4" "Backup criado."
send_progress "step4_progress" "80%"

send_progress "step4" "Atualizando configuração dnsmasq..."
sed -i "s|dhcp-range=set:proxy,.*|dhcp-range=set:proxy,${REDE},proxy,${NETMASK}|" "$CONF_FILE"
sed -i "s|dhcp-option=option:router,.*|dhcp-option=option:router,${GATEWAY}|" "$CONF_FILE"
send_progress "step4" "Configuração dnsmasq atualizada."
send_progress "step4_progress" "90%"

# Reiniciando serviços
send_progress "step4" "Reiniciando serviços..."
send_progress "step4_progress" "95%"
bash reinicia.sh
if [[ $? -ne 0 ]]; then
    send_progress "step4" "Erro ao reiniciar serviços."
    exit 1
fi
send_progress "step4" "Serviços reiniciados."
send_progress "step4_progress" "100%"
/etc/init.d/dnsmasq restart

send_progress "finished" "Instalação concluída com sucesso!"
