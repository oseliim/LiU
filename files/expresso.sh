#!/bin/bash

# =====================
# expresso.sh - Instalação e configuração automatizada para laboratório
# =====================

#Instala pacotes básicos
bash auto_install.sh
#Download
wget -P / 'http://192.168.100.64/downloads/liu_expresso.tgz'
#Extração
tar -xvf /liu_expresso.tgz

#Criação de usuários
bash user_conf.sh aluno aluno #Criando aluno padrão

# Alterando dnsmasq
echo "⚙️ Alterando configuração do dnsmasq..."

NET_FILE="tmp/network_data.txt"
CONF_FILE="/etc/dnsmasq.d/ltsp-dnsmasq.conf"

bash network.sh

if [[ ! -f "$NET_FILE" ]]; then
    echo "❌ Arquivo $NET_FILE não encontrado. Execute primeiro: bash network.sh"
    exit 1
fi

echo "📖 Lendo informações de rede do arquivo $NET_FILE..."

IP_CIDR=$(grep "IP Address" "$NET_FILE" | awk -F': ' '{print $2}')
NETMASK=$(grep "Netmask" "$NET_FILE" | awk -F': ' '{print $2}')
GATEWAY=$(grep "Gateway" "$NET_FILE" | awk -F': ' '{print $2}')

IP=$(echo "$IP_CIDR" | cut -d'/' -f1)
CIDR=$(echo "$IP_CIDR" | cut -d'/' -f2)

if ! command -v ipcalc &>/dev/null; then
    echo "❌ O utilitário 'ipcalc' não está instalado. Instale com: apt install ipcalc"
    exit 1
fi

REDE=$(ipcalc "$IP/$CIDR" | grep "Network:" | awk '{print $2}' | cut -d'/' -f1)

echo "ℹ️ Informações extraídas:"
echo "   - Endereço de Rede: $REDE"
echo "   - Máscara: $NETMASK"
echo "   - Gateway: $GATEWAY"

echo "📝 Criando backup do arquivo de configuração..."

# Diretório de backup
BKP_DIR="/etc/dnsmasq.d/bkp"
mkdir -p "$BKP_DIR"

# Copiando arquivo de configuração para o diretório de backup
cp "$CONF_FILE" "$BKP_DIR/$(basename "$CONF_FILE").bak"
echo "✅ Backup criado em $BKP_DIR/$(basename "$CONF_FILE").bak"

echo "✏️ Atualizando configuração do dnsmasq..."
sed -i "s|dhcp-range=set:proxy,.*|dhcp-range=set:proxy,${REDE},proxy,${NETMASK}|" "$CONF_FILE"
sed -i "s|dhcp-option=option:router,.*|dhcp-option=option:router,${GATEWAY}|" "$CONF_FILE"
echo "✅ Configuração de $CONF_FILE atualizada."

# Reiniciando serviços
echo "🔄 Reiniciando serviços..."
bash reinicia.sh
if [[ $? -ne 0 ]]; then
    echo "❌ Falha ao reiniciar serviços."
    exit 1
fi
echo "✅ Serviços reiniciados."
#Reiniciando serviços
bash reinicia.sh

#PRONTO!
