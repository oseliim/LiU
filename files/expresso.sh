#!/bin/bash
set -euo pipefail

# =====================
# expresso.sh - Instalação e configuração automatizada para laboratório
# =====================

# Função para tratamento de erros
error_handler() {
    echo "[ERRO] Script falhou na linha $1"
    echo "[ERRO] Comando: $2"
    exit 1
}

trap 'error_handler ${LINENO} "$BASH_COMMAND"' ERR

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" &> /dev/null
}

# --- auto_install.sh ---
echo "[expresso] Executando etapa: auto_install.sh"
UBUNTU_VERSION=$(lsb_release -rs | cut -d'.' -f1)
echo "[INFO] Versão detectada: Ubuntu $UBUNTU_VERSION"
echo "[INFO] Atualizando pacotes..."
apt update
COMMON_PKGS="ltsp dnsmasq nfs-kernel-server openssh-server squashfs-tools ethtool net-tools epoptes debootstrap pxelinux syslinux"
if [ "$UBUNTU_VERSION" -lt 24 ]; then
    echo "[INFO] Instalando repositório do LTSP..."
    add-apt-repository ppa:ltsp -y
    apt update
    echo "[INFO] Instalando com suporte a ltsp-binaries (versões < 24)"
    apt install --install-recommends $COMMON_PKGS ltsp-binaries -y
else
    echo "[INFO] Instalando LTSP moderno (versão >= 24, sem ltsp-binaries)"
    apt install --install-recommends $COMMON_PKGS ipxe -y
fi

mkdir -p /srv/tftp/ltsp
wget -q https://boot.ipxe.org/ipxe.pxe -O /srv/tftp/ltsp/undionly.kpxe
ln -sf /usr/lib/PXELINUX/pxelinux.0 /srv/tftp/ltsp/pxelinux.0
ln -sf /usr/lib/syslinux/modules/bios /srv/tftp/ltsp/isolinux
mkdir -p /srv/tftp/ltsp/pxelinux.cfg
wget -q https://ltsp.org/guides/pxelinux.txt -O /srv/tftp/ltsp/pxelinux.cfg/default

# Configurar estrutura de diretórios do LTSP
echo "[INFO] Configurando estrutura de diretórios do LTSP..."
mkdir -p /srv/ltsp
if [ -d "/srv/images" ]; then
    echo "[INFO] Movendo /srv/images para /srv/ltsp/images..."
    mv /srv/images /srv/ltsp/images
else
    echo "[INFO] Diretório /srv/images não encontrado, criando /srv/ltsp/images..."
    mkdir -p /srv/ltsp/images
fi

systemctl stop systemd-resolved
systemctl disable systemd-resolved
rm -f /etc/resolv.conf
echo -e "nameserver 8.8.8.8\nnameserver 8.8.4.4" > /etc/resolv.conf

ltsp_conf_file="/etc/ltsp/ltsp.conf"
if [[ ! -f "$ltsp_conf_file" ]]; then
    echo "[INFO] Creating basic $ltsp_conf_file with [common] section."
    mkdir -p /etc/ltsp
    cat << EOF > "$ltsp_conf_file"
[common]
RELOGIN=1
HOSTNAME=lifto
LIGHTDM_CONF="greeter-hide-users=true"
DNS_SERVER="8.8.8.8"
GDM3_CONF="WaylandEnable=false"

[clients]
EOF
else
    echo "[INFO] $ltsp_conf_file already exists. Skipping creation."
fi

echo "[OK] Instalação e configuração inicial do LTSP concluída com sucesso."

# --- network.sh ---
echo "[expresso] Executando etapa: network.sh"
network_output_file="/tmp/network_data.txt"
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
      CALCULATED_NETMASK="N/A"
      if [[ "$IP_CIDR" == */* ]]; then
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
echo "-------------------------------------" | tee -a "$network_output_file"
echo "Coleta de informações de rede concluída. Dados salvos em $network_output_file"

# --- dnsmasq_conf.sh (modificado) ---
echo "[expresso] Executando etapa: dnsmasq_conf.sh (modificado)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
network_output_file="/tmp/network_data.txt"

# Verificar se o arquivo de rede existe e tem dados válidos
if [[ ! -f "$network_output_file" ]]; then
    echo "[ERRO] Arquivo $network_output_file não encontrado!"
    exit 1
fi

IP_CIDR=$(awk '/IP Address \(com CIDR\):/ {print $5}' "$network_output_file")
if [[ -z "$IP_CIDR" || "$IP_CIDR" == "Nenhum" ]]; then
    echo "[ERRO] Não foi possível obter o IP CIDR do arquivo de rede!"
    exit 1
fi

DEFAULT_GATEWAY=$(awk '/Gateway:/ {print $2}' "$network_output_file" | head -n1)
NETWORK_PREFIX=$(echo "$IP_CIDR" | cut -d'/' -f1 | cut -d'.' -f1-3)
RANGE_INICIO="${NETWORK_PREFIX}.100"
RANGE_FIM="${NETWORK_PREFIX}.150"
IP_DNS="8.8.8.8"
DNSMASQ_LTSP_CONF="/etc/dnsmasq.d/ltsp-dnsmasq.conf"

echo "[INFO] Configurando dnsmasq com rede: $NETWORK_PREFIX, range: $RANGE_INICIO-$RANGE_FIM"

rm -f "$DNSMASQ_LTSP_CONF"
ltsp dnsmasq

if [ ! -f "$DNSMASQ_LTSP_CONF" ]; then
    echo "❌ Arquivo $DNSMASQ_LTSP_CONF não encontrado após 'ltsp dnsmasq'."
    exit 1
fi

sed -i "s|^dhcp-range=.*|dhcp-range=${RANGE_INICIO},${RANGE_FIM},12h|" "$DNSMASQ_LTSP_CONF"
if grep -q "^dhcp-option=6," "$DNSMASQ_LTSP_CONF"; then
    sed -i "s|^dhcp-option=6,.*|dhcp-option=6,${IP_DNS}|" "$DNSMASQ_LTSP_CONF"
else
    echo "dhcp-option=6,${IP_DNS}" >> "$DNSMASQ_LTSP_CONF"
fi

if [ -n "$DEFAULT_GATEWAY" ] && [ "$DEFAULT_GATEWAY" != "Não" ]; then
    if grep -q "^dhcp-option=3," "$DNSMASQ_LTSP_CONF"; then
        sed -i "s|^dhcp-option=3,.*|dhcp-option=3,${DEFAULT_GATEWAY}|" "$DNSMASQ_LTSP_CONF"
    else
        echo "dhcp-option=3,${DEFAULT_GATEWAY}" >> "$DNSMASQ_LTSP_CONF"
    fi
fi

sed -i 's|^\(dhcp-boot=tag:!ipxe,tag:X86PC,ltsp/undionly.kpxe\)|#\1|' "$DNSMASQ_LTSP_CONF"
sed -i 's|^\(dhcp-boot=tag:!ipxe,tag:X86-64_EFI,ltsp/snponly.efi\)|#\1|' "$DNSMASQ_LTSP_CONF"
sed -i 's|^\(dhcp-boot=tag:ipxe,ltsp/ltsp.ipxe\)|#\1|' "$DNSMASQ_LTSP_CONF"
NEW_BOOT_LINE="dhcp-boot=tag:X86PC,ltsp/pxelinux.0"
if ! grep -qF "$NEW_BOOT_LINE" "$DNSMASQ_LTSP_CONF"; then
    echo "$NEW_BOOT_LINE" >> "$DNSMASQ_LTSP_CONF"
fi

echo "dhcp-sequential-ip" > /etc/dnsmasq.d/99-dhcp-seq-ip.conf
systemctl restart dnsmasq

# --- user_conf.sh + criar 30 usuários sudoers ---
echo "[expresso] Criando usuários"
USER_DATA_FILE="/tmp/user_data.txt"
mkdir -p /tmp
> "$USER_DATA_FILE"

# Criando usuários, senha, nome e quantidade
for i in $(seq -w 1 20); do
    USUARIO="aluno${i}"
    SENHA="aluno"
    
    if id "$USUARIO" &>/dev/null; then
        echo "[INFO] Usuário $USUARIO já existe. Atualizando senha..."
        echo "$USUARIO:$SENHA" | chpasswd
        # Remove entrada existente e adiciona nova
        grep -v "^${USUARIO}:" "$USER_DATA_FILE" > "${USER_DATA_FILE}.tmp" 2>/dev/null || true
        mv "${USER_DATA_FILE}.tmp" "$USER_DATA_FILE"
        echo "${USUARIO}:${SENHA}" >> "$USER_DATA_FILE"
    else
        echo "[INFO] Criando usuário $USUARIO..."
        useradd -m -s /bin/bash "$USUARIO"
        echo "$USUARIO:$SENHA" | chpasswd
        usermod -aG audio,video,cdrom,plugdev,netdev,sudo "$USUARIO"
        echo "${USUARIO}:${SENHA}" >> "$USER_DATA_FILE"
    fi
    echo "[expresso] Usuário $USUARIO pronto."
done

# --- montar_conf.sh ---
echo "[expresso] Montando IPs dos usuários no ltsp.conf"
ltsp_conf_file="/etc/ltsp/ltsp.conf"
user_data_file="/tmp/user_data.txt"
network_output_file="/tmp/network_data.txt"
range_start=100
range_end=150

# Verificar se os arquivos necessários existem
if [[ ! -f "$user_data_file" ]]; then
    echo "[ERRO] Arquivo $user_data_file não encontrado!"
    exit 1
fi

# Monta a lista de usuários explicitamente e garante processamento de todos
if [[ -f "$network_output_file" ]]; then
    ip_cidr=$(awk '/IP Address \(com CIDR\):/ {print $5}' "$network_output_file")
    if [[ -z "$ip_cidr" || "$ip_cidr" == "Nenhum" ]]; then
        echo "[AVISO] Não foi possível obter IP CIDR, usando padrão 192.168.1"
        network_prefix="192.168.1"
    else
        network_prefix=$(cut -d/ -f1 <<< "$ip_cidr" | cut -d. -f1-3)
    fi
else
    echo "[AVISO] Arquivo de rede não encontrado, usando padrão 192.168.1"
    network_prefix="192.168.1"
fi

echo "[INFO] Usando prefixo de rede: $network_prefix"

mkdir -p /etc/ltsp
if [[ ! -f "$ltsp_conf_file" ]]; then
    cat << EOF > "$ltsp_conf_file"
[common]
XKBMODEL=br
TIMEZONE=America/Sao_Paulo
RELOGIN=1
HOSTNAME=lifto
LIGHTDM_CONF="greeter-hide-users=true"

[clients]
EOF
fi

user_count=0
ip_suffix=$range_start

for i in $(seq -w 1 20); do
    user="aluno${i}"
    
    # Verificar se o usuário já está configurado
    if grep -q "AUTOLOGIN=${user}" "$ltsp_conf_file"; then
        echo "[INFO] Usuário $user já configurado, pulando..."
        continue
    fi
    
    # Encontrar próximo IP disponível
    while (( ip_suffix <= range_end )); do
        ip="${network_prefix}.${ip_suffix}"
        if ! grep -q "^\[${ip//./\\.}\]" "$ltsp_conf_file"; then
            break
        fi
        ((ip_suffix++))
    done
    
    if (( ip_suffix > range_end )); then
        echo "[AVISO] Não há mais IPs disponíveis no range $range_start-$range_end"
        break
    fi
    
    # Obter senha do arquivo de dados
    senha=$(grep "^${user}:" "$user_data_file" | cut -d: -f2-)
    if [[ -z "$senha" ]]; then
        echo "[AVISO] Senha não encontrada para $user, usando padrão"
        senha="aluno"
    fi
    
    senha_b64=$(echo -n "$senha" | base64)
    {
        echo ""
        echo "[${ip}]"
        echo "AUTOLOGIN=${user}"
        echo "PASSWORDS_LAB=\"${user}/${senha_b64}\""
    } >> "$ltsp_conf_file"
    
    echo "✔ $user configurado com IP $ip"
    user_count=$((user_count + 1))
    ip_suffix=$((ip_suffix + 1))
done

echo "[✅] $user_count usuários adicionados ao $ltsp_conf_file."

echo "[INFO] Reiniciando serviços do LTSP..."

# Função auxiliar para reiniciar serviços e comandos com verificação de sucesso
restart_service() {
    local name="$1"
    local cmd="$2"

    echo -n "  -> Reiniciando ${name}... "
    if eval "$cmd" &> /dev/null; then
        echo "OK"
    else
        echo "FALHOU"
        echo "[AVISO] Falha ao reiniciar $name, mas continuando..."
        return 1
    fi
}

# Lista de serviços e comandos essenciais
restart_service "NetworkManager" "systemctl restart NetworkManager"
restart_service "LTSP iPXE"        "ltsp ipxe"
restart_service "LTSP initrd"      "ltsp initrd"
restart_service "LTSP NFS"         "ltsp nfs"
restart_service "LTSP daemon"      "systemctl restart ltsp"
restart_service "dnsmasq"          "systemctl restart dnsmasq"

echo "[INFO] Todos os serviços foram reiniciados com sucesso."

echo "[expresso] Processo concluído com sucesso!"