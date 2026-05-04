#!/bin/bash
# Uso: sudo ./03_cria_usuario_e_monta.sh <nome_do_usuario> [senha]
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
    echo "Execute como root." >&2
    exit 1
fi

if [ -z "${1:-}" ]; then
    echo "Uso: $0 <nome_do_usuario> [senha]" >&2
    exit 1
fi

USUARIO="$1"
SENHA="${2:-$USUARIO}"
ltsp_conf_file="/etc/ltsp/ltsp.conf"
dnsmasq_conf="/etc/dnsmasq.d/ltsp-dnsmasq.conf"

if id "$USUARIO" &>/dev/null; then
    echo "$USUARIO:$SENHA" | chpasswd
else
    if ! useradd -m -s /bin/bash "$USUARIO" > /dev/null 2>&1; then
        echo "Falha ao criar o usuário '$USUARIO'." >&2
        exit 1
    fi
    echo "$USUARIO:$SENHA" | chpasswd
    usermod -aG audio,video,cdrom,plugdev,netdev "$USUARIO" > /dev/null 2>&1
fi
usermod -aG sudo "$USUARIO" > /dev/null 2>&1

mkdir -p /etc/ltsp
if [[ ! -f "$ltsp_conf_file" ]]; then
    cat << EOF > "$ltsp_conf_file"
[common]
RELOGIN=1
HOSTNAME=liu
LIGHTDM_CONF="greeter-hide-users=true"
DNS_SERVER="8.8.8.8"
GDM3_CONF="WaylandEnable=false"

[clients]
EOF
fi

if grep -q "AUTOLOGIN=${USUARIO}" "$ltsp_conf_file"; then
    exit 0
fi

range_start=100
range_end=150
network_prefix="192.168.1"

if [[ -f "$dnsmasq_conf" ]]; then
    dhcp_line=$(grep "^dhcp-range=" "$dnsmasq_conf" | head -n1 || true)
    if [[ -n "$dhcp_line" ]]; then
        start_ip=$(echo "$dhcp_line" | cut -d'=' -f2 | cut -d',' -f1)
        end_ip=$(echo "$dhcp_line" | cut -d',' -f2)
        range_start=$(echo "$start_ip" | awk -F. '{print $4}')
        range_end=$(echo "$end_ip" | awk -F. '{print $4}')
        network_prefix=$(echo "$start_ip" | cut -d. -f1-3)
    fi
else
    active_iface=$(ip route | grep default | awk '{print $5}' | head -n 1 || true)
    if [ -n "$active_iface" ]; then
        IP_CIDR=$(ip addr show dev "$active_iface" | grep -w "inet" | awk '{print $2}' | head -n 1 || true)
        if [ -n "$IP_CIDR" ]; then
            network_prefix=$(echo "$IP_CIDR" | cut -d'/' -f1 | cut -d'.' -f1-3)
        fi
    fi
fi

ultimo_host=$(grep -o "HOSTNAME=LiU[0-9]\+" "$ltsp_conf_file" | sed 's/.*LiU//' | sort -n | tail -1 || true)
if [[ -z "$ultimo_host" ]]; then
    ultimo_host=0
fi

ip_suffix=$range_start

while (( ip_suffix <= range_end )); do
    ip="${network_prefix}.${ip_suffix}"
    if ! grep -q "^\[${ip//./\\.}\]" "$ltsp_conf_file"; then
        break
    fi
    ((ip_suffix++))
done

if (( ip_suffix > range_end )); then
    echo "Range de IPs esgotado." >&2
    exit 1
fi

senha_b64=$(echo -n "$SENHA" | base64)
ultimo_host=$((ultimo_host+1))

{
    echo ""
    echo "[${ip}]"
    echo "AUTOLOGIN=${USUARIO}"
    echo "PASSWORDS_LAB=\"${USUARIO}/${senha_b64}\""
    printf "HOSTNAME=LiU%02d\n" "$ultimo_host"
} >> "$ltsp_conf_file"
