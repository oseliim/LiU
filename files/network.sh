#!/bin/bash
set -euo pipefail

# Script unificado para coletar informações de rede e configurar dnsmasq para LTSP

# --- Seção 1: Coleta de Informações de Rede ---
echo "--- Iniciando Coleta de Informações de Rede da Interface Ativa Principal ---"

network_output_file="tmp/network_data.txt"
mkdir -p "$(dirname "$network_output_file")"
rm -f "$network_output_file"

echo "Informações da Interface de Rede Ativa Principal:" | tee -a "$network_output_file"
echo "==============================================" | tee -a "$network_output_file"

active_iface=$(ip route | grep default | awk '{print $5}' | head -n 1)

if [ -z "$active_iface" ]; then
  echo "Nenhuma interface de rota padrão encontrada. Não foi possível determinar a interface ativa principal." | tee -a "$network_output_file"
  echo "Verifique suas configurações de rede." | tee -a "$network_output_file"
else
  echo "Interface ativa principal (via rota padrão): $active_iface" | tee -a "$network_output_file"
  echo "-------------------------------------" | tee -a "$network_output_file"

  IFACE_NAME="$active_iface"
  echo "  Interface: $IFACE_NAME" | tee -a "$network_output_file"

  iface_state=$(ip link show dev "$IFACE_NAME" | awk '{for (i=1; i<=NF; i++) if ($i == "state") {print $(i+1); exit}}')
  echo "  Estado: $iface_state" | tee -a "$network_output_file"

  if [ "$iface_state" != "UP" ] && [ "$iface_state" != "UNKNOWN" ]; then
    echo "  A interface principal ($IFACE_NAME) não está UP. Informações de IP não podem ser coletadas." | tee -a "$network_output_file"
  else
    ip_info=$(ip addr show dev "$IFACE_NAME" | grep -w "inet")
    IP_CIDR=$(echo "$ip_info" | awk '{print $2}' | head -n 1)

    if [ -z "$IP_CIDR" ]; then
      echo "  IP Address (com CIDR): Nenhum endereço IPv4 configurado para $IFACE_NAME" | tee -a "$network_output_file"
      echo "  Netmask: N/A" | tee -a "$network_output_file"
      echo "  Gateway: N/A" | tee -a "$network_output_file"
    else
      echo "  IP Address (com CIDR): $IP_CIDR" | tee -a "$network_output_file"

      # Calcular netmask a partir do prefixo CIDR
      CALCULATED_NETMASK="N/A"
      if [[ "$IP_CIDR" == *"/"* ]]; then
        cidr_prefix_val=$(echo "$IP_CIDR" | cut -d'/' -f2)
        if [[ "$cidr_prefix_val" -ge 0 && "$cidr_prefix_val" -le 32 ]]; then
          bits=$(( 32 - cidr_prefix_val ))
          mask_int=$(( (2**32-1) - (2**bits-1) ))
          CALCULATED_NETMASK=$(printf "%d.%d.%d.%d" "$((mask_int>>24))" "$((mask_int>>16 & 255))" "$((mask_int>>8 & 255))" "$((mask_int & 255))")
        fi
      fi
      echo "  Netmask: $CALCULATED_NETMASK" | tee -a "$network_output_file"

      DEFAULT_GATEWAY=$(ip route | grep default | grep "dev $IFACE_NAME" | awk '{print $3}' | head -n 1)
      if [ -z "$DEFAULT_GATEWAY" ]; then
        DEFAULT_GATEWAY=$(ip route | grep default | awk '{print $3}' | head -n 1)
      fi
      echo "  Gateway: ${DEFAULT_GATEWAY:-Não encontrado}" | tee -a "$network_output_file"
    fi
  fi
fi

echo "" | tee -a "$network_output_file"
echo "-------------------------------------" | tee -a "$network_output_file"
echo "Servidores DNS (Configuração Global):" | tee -a "$network_output_file"

# DNS via /etc/resolv.conf
if [ -f /etc/resolv.conf ]; then
  mapfile -t DNS_SERVERS_RESOLVCONF < <(grep "^nameserver" /etc/resolv.conf | awk '{print $2}' | sort -u)
  if [ ${#DNS_SERVERS_RESOLVCONF[@]} -gt 0 ]; then
    echo "  DNS (/etc/resolv.conf):" | tee -a "$network_output_file"
    for server in "${DNS_SERVERS_RESOLVCONF[@]}"; do
      echo "    - $server" | tee -a "$network_output_file"
    done
  else
    echo "  Nenhum servidor DNS encontrado em /etc/resolv.conf" | tee -a "$network_output_file"
  fi
else
  echo "  Arquivo /etc/resolv.conf não encontrado." | tee -a "$network_output_file"
fi

# DNS via resolvectl
if command -v resolvectl &> /dev/null; then
  if [ -n "${active_iface:-}" ]; then
    DNS_SERVERS_RESOLVECTL_IFACE=$(resolvectl dns "$active_iface" 2>/dev/null | awk '
      /^[0-9]+:/ {next}
      {for(i=1;i<=NF;i++) if($i ~ /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/) print $i}' | sort -u)
  fi

  if [ -z "${DNS_SERVERS_RESOLVECTL_IFACE:-}" ]; then
    DNS_SERVERS_RESOLVECTL_GLOBAL=$(resolvectl dns 2>/dev/null | awk '
      /^[0-9]+:/ {next}
      {for(i=1;i<=NF;i++) if($i ~ /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/) print $i}' | sort -u)

    if [ -z "$DNS_SERVERS_RESOLVECTL_GLOBAL" ]; then
      DNS_SERVERS_RESOLVECTL_GLOBAL=$(resolvectl status | grep -oP 'DNS Servers: \K[^ ]+' | tr ' ' '\n')
    fi

    DNS_SERVERS_RESOLVECTL="$DNS_SERVERS_RESOLVECTL_GLOBAL"
    dns_source_info="Global"
  else
    DNS_SERVERS_RESOLVECTL="$DNS_SERVERS_RESOLVECTL_IFACE"
    dns_source_info="da interface $active_iface"
  fi

  if [ -n "$DNS_SERVERS_RESOLVECTL" ]; then
    echo "  DNS (systemd-resolve $dns_source_info):" | tee -a "$network_output_file"
    echo "$DNS_SERVERS_RESOLVECTL" | while IFS= read -r server; do
      echo "    - $server" | tee -a "$network_output_file"
    done
  else
    echo "  Nenhuma informação de DNS via resolvectl encontrada." | tee -a "$network_output_file"
  fi
else
  echo "  Comando resolvectl não encontrado." | tee -a "$network_output_file"
fi

echo "-------------------------------------" | tee -a "$network_output_file"
echo "Coleta de informações de rede concluída. Dados salvos em $network_output_file"
