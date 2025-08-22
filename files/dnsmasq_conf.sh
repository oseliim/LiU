#!/bin/bash

# ==========================
# Script para regenerar dnsmasq via LTSP e ajustar DHCP range, DNS e Boot options
# ==========================

# --- Verificação e carregamento dos dados de rede ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
network_output_file="${SCRIPT_DIR}/tmp/network_data.txt"

# Inicializa variáveis para evitar erros de unbound
IP_CIDR=""
DEFAULT_GATEWAY=""
DNS_SERVERS=""

# Permitir passar RANGE_INICIO e RANGE_FIM como argumentos
ARG_RANGE_INICIO="$1"
ARG_RANGE_FIM="$2"
ARG_DNS_SERVER="$3"

if [ ! -f "$network_output_file" ]; then
    echo "⚠️ Arquivo de dados de rede não encontrado (${network_output_file}). Usando configurações padrão."
    # Definir padrões
    IP_CIDR="192.168.1.10/24" # Exemplo
    DEFAULT_GATEWAY="192.168.1.1"
    DNS_SERVERS="8.8.8.8"
else
    # Captura o IP/CIDR e DNS servers (Corrigido awk para linha única)
    IP_CIDR=$(grep "IP Address (com CIDR):" "$network_output_file" | awk '{print $5}')
    DEFAULT_GATEWAY=$(grep "Gateway:" "$network_output_file" | awk '{print $2}')
    # Captura todos os servidores DNS listados e pega o primeiro
    DNS_SERVERS_LIST=$(grep -A 10 "Servidores DNS" "$network_output_file" | grep "    - " | awk '{print $2}')

    # Validações
    if [ -z "$IP_CIDR" ]; then
        echo "❌ Não foi possível obter o IP/CIDR do arquivo de rede. Saindo."
        exit 1
    fi
fi

# Extrai o prefixo de rede (primeiros três octetos)
NETWORK_PREFIX=$(echo "$IP_CIDR" | cut -d'/' -f1 | cut -d'.' -f1-3)
if [ $(echo "$NETWORK_PREFIX" | tr -cd '.' | wc -c) -ne 2 ]; then
    echo "❌ Formato de IP inválido para extrair o prefixo: $NETWORK_PREFIX. Usando 192.168.1."
    NETWORK_PREFIX="192.168.1"
fi

# Define os ranges DHCP
if [ -n "$ARG_RANGE_INICIO" ] && [ -n "$ARG_RANGE_FIM" ]; then
    RANGE_INICIO="$ARG_RANGE_INICIO"
    RANGE_FIM="$ARG_RANGE_FIM"
else
    RANGE_INICIO="${NETWORK_PREFIX}.100"
    RANGE_FIM="${NETWORK_PREFIX}.150"
fi

# Usa o DNS passado como argumento, senão o primeiro DNS encontrado ou o padrão (Google)
if [ -n "$ARG_DNS_SERVER" ]; then
    IP_DNS="$ARG_DNS_SERVER"
elif [ -z "$DNS_SERVERS_LIST" ]; then
    IP_DNS="8.8.8.8"
else
    IP_DNS=$(echo "$DNS_SERVERS_LIST" | head -n1)
fi

DNSMASQ_LTSP_CONF="/etc/dnsmasq.d/ltsp-dnsmasq.conf"

# --- Configuração do dnsmasq ---
echo "[+] Removendo configuração antiga (se existir)..."
rm -f "$DNSMASQ_LTSP_CONF"

echo "[+] Gerando nova configuração base com LTSP..."
ltsp dnsmasq

if [ ! -f "$DNSMASQ_LTSP_CONF" ]; then
    echo "❌ Arquivo $DNSMASQ_LTSP_CONF não encontrado após 'ltsp dnsmasq'. Verifique a instalação do LTSP."
    exit 1
fi

echo "[+] Ajustando configurações no $DNSMASQ_LTSP_CONF..."
echo "    • DHCP Range: $RANGE_INICIO - $RANGE_FIM"
echo "    • Gateway: ${DEFAULT_GATEWAY:-Usando padrão do LTSP}"
echo "    • DNS Server: $IP_DNS"

# Atualiza o range DHCP
sed -i "s|^dhcp-range=.*|dhcp-range=${RANGE_INICIO},${RANGE_FIM},12h|" "$DNSMASQ_LTSP_CONF"

# Atualiza o DNS server
if grep -q "^dhcp-option=6," "$DNSMASQ_LTSP_CONF"; then
    sed -i "s|^dhcp-option=6,.*|dhcp-option=6,${IP_DNS}|" "$DNSMASQ_LTSP_CONF"
else
    echo "dhcp-option=6,${IP_DNS}" >> "$DNSMASQ_LTSP_CONF"
fi

# Configura o gateway se encontrado
if [ -n "$DEFAULT_GATEWAY" ]; then
    if grep -q "^dhcp-option=3," "$DNSMASQ_LTSP_CONF"; then
        sed -i "s|^dhcp-option=3,.*|dhcp-option=3,${DEFAULT_GATEWAY}|" "$DNSMASQ_LTSP_CONF"
    else
        echo "dhcp-option=3,${DEFAULT_GATEWAY}" >> "$DNSMASQ_LTSP_CONF"
    fi
fi

# --- Ajuste das opções dhcp-boot --- 
echo "[+] Ajustando opções dhcp-boot para iPXE personalizado..."

# Comenta as linhas existentes (se existirem)
sed -i 's|^\(dhcp-boot=tag:!ipxe,tag:X86PC,ltsp/undionly.kpxe\)|#\1|' "$DNSMASQ_LTSP_CONF"
sed -i 's|^\(dhcp-boot=tag:!ipxe,tag:X86-64_EFI,ltsp/snponly.efi\)|#\1|' "$DNSMASQ_LTSP_CONF"
sed -i 's|^\(dhcp-boot=tag:ipxe,ltsp/ltsp.ipxe\)|#\1|' "$DNSMASQ_LTSP_CONF"

# Adiciona a nova linha (garante que não seja adicionada múltiplas vezes)
NEW_BOOT_LINE="dhcp-boot=tag:X86PC,ltsp/pxelinux.0"
if ! grep -qF "$NEW_BOOT_LINE" "$DNSMASQ_LTSP_CONF"; then
    echo "$NEW_BOOT_LINE" >> "$DNSMASQ_LTSP_CONF"
    echo "    • Adicionada linha: $NEW_BOOT_LINE"
else
    echo "    • Linha '$NEW_BOOT_LINE' já existe."
fi

# Configurando o DHCP para funcionar em ordem sequencial
SEQ_IP_CONF="/etc/dnsmasq.d/99-dhcp-seq-ip.conf"
echo "[+] Configurando IP sequencial em $SEQ_IP_CONF..."
echo "dhcp-sequential-ip" > "$SEQ_IP_CONF"

# --- Reinício do serviço ---
echo "[+] Reiniciando dnsmasq..."
if systemctl restart dnsmasq; then
    echo "✓ dnsmasq reiniciado com sucesso"
    echo "Configuração aplicada em $DNSMASQ_LTSP_CONF:"
    echo "----------------------"
    grep -E "dhcp-range=|dhcp-option=6,|dhcp-option=3,|dhcp-boot=" "$DNSMASQ_LTSP_CONF"
    echo "----------------------"
    echo "Configuração em $SEQ_IP_CONF:"
    cat "$SEQ_IP_CONF"
else
    echo "❌ Falha ao reiniciar dnsmasq"
    # Adicionar mais detalhes do erro, se possível
    systemctl status dnsmasq --no-pager
    journalctl -u dnsmasq --no-pager | tail -n 20
    exit 1
fi

echo "[✅] Configuração do DNSMasq concluída."
exit 0