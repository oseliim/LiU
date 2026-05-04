#!/bin/bash
set -euo pipefail

active_iface=$(ip route | grep default | awk '{print $5}' | head -n 1)

if [ -z "$active_iface" ]; then
  echo "Interface de rota padrão não encontrada." >&2
  exit 1
fi

iface_state=$(ip link show dev "$active_iface" | awk '{for (i=1; i<=NF; i++) if ($i == "state") {print $(i+1); exit}}')
if [ "$iface_state" != "UP" ] && [ "$iface_state" != "UNKNOWN" ]; then
    echo "A interface principal ($active_iface) não está UP." >&2
    exit 1
fi

IP_CIDR=$(ip addr show dev "$active_iface" | grep -w "inet" | awk '{print $2}' | head -n 1)
if [ -z "$IP_CIDR" ]; then
    echo "Nenhum endereço IPv4 para $active_iface." >&2
    exit 1
fi

DEFAULT_GATEWAY=$(ip route | grep default | grep "dev $active_iface" | awk '{print $3}' | head -n 1 || true)
if [ -z "$DEFAULT_GATEWAY" ]; then
    DEFAULT_GATEWAY=$(ip route | grep default | awk '{print $3}' | head -n 1 || true)
fi

IP_DNS="8.8.8.8"
if [ -f /etc/resolv.conf ]; then
    dns_tmp=$(grep "^nameserver" /etc/resolv.conf | awk '{print $2}' | head -n 1 || true)
    if [ -n "$dns_tmp" ] && [ "$dns_tmp" != "127.0.0.53" ]; then
        IP_DNS="$dns_tmp"
    fi
fi

NETWORK_PREFIX=$(echo "$IP_CIDR" | cut -d'/' -f1 | cut -d'.' -f1-3)
if [ $(echo "$NETWORK_PREFIX" | tr -cd '.' | wc -c) -ne 2 ]; then
    NETWORK_PREFIX="192.168.1"
fi
RANGE_INICIO="${NETWORK_PREFIX}.100"
RANGE_FIM="${NETWORK_PREFIX}.150"

DNSMASQ_LTSP_CONF="/etc/dnsmasq.d/ltsp-dnsmasq.conf"

rm -f "$DNSMASQ_LTSP_CONF"
ltsp dnsmasq > /dev/null 2>&1

if [ ! -f "$DNSMASQ_LTSP_CONF" ]; then
    echo "Arquivo $DNSMASQ_LTSP_CONF não encontrado após 'ltsp dnsmasq'." >&2
    exit 1
fi

sed -i '/^dhcp-range=.*/d' "$DNSMASQ_LTSP_CONF"
echo "dhcp-range=${RANGE_INICIO},${RANGE_FIM},12h" >> "$DNSMASQ_LTSP_CONF"

sed -i '/^dhcp-option=6,.*/d' "$DNSMASQ_LTSP_CONF"
sed -i '/^dhcp-option=option:dns-server,.*/d' "$DNSMASQ_LTSP_CONF"
echo "dhcp-option=6,${IP_DNS}" >> "$DNSMASQ_LTSP_CONF"

if [ -n "$DEFAULT_GATEWAY" ]; then
    sed -i '/^dhcp-option=3,.*/d' "$DNSMASQ_LTSP_CONF"
    sed -i '/^dhcp-option=option:router,.*/d' "$DNSMASQ_LTSP_CONF"
    echo "dhcp-option=3,${DEFAULT_GATEWAY}" >> "$DNSMASQ_LTSP_CONF"
fi

sed -i 's|^\(dhcp-boot=tag:!ipxe,tag:X86PC,ltsp/undionly.kpxe\)|#\1|' "$DNSMASQ_LTSP_CONF"
sed -i 's|^\(dhcp-boot=tag:!ipxe,tag:X86-64_EFI,ltsp/snponly.efi\)|#\1|' "$DNSMASQ_LTSP_CONF"
sed -i 's|^\(dhcp-boot=tag:ipxe,ltsp/ltsp.ipxe\)|#\1|' "$DNSMASQ_LTSP_CONF"

NEW_BOOT_LINE="dhcp-boot=tag:X86PC,ltsp/pxelinux.0"
if ! grep -qF "$NEW_BOOT_LINE" "$DNSMASQ_LTSP_CONF"; then
    echo "$NEW_BOOT_LINE" >> "$DNSMASQ_LTSP_CONF"
fi

SEQ_IP_CONF="/etc/dnsmasq.d/99-dhcp-seq-ip.conf"
echo "dhcp-sequential-ip" > "$SEQ_IP_CONF"

if ! systemctl restart dnsmasq > /dev/null 2>&1; then
    echo "Falha ao reiniciar dnsmasq" >&2
    exit 1
fi
