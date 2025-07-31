#!/bin/bash
# =============================================
# Script: montar_conf.sh
# Objetivo: Adicionar configurações de cliente ao ltsp.conf,
#           garantindo a integridade e estrutura do arquivo,
#           lendo senhas do /tmp/user_data.txt e mapeando
#           usuários *únicos* sequenciais a IPs DHCP.
# Uso: sudo ./montar_conf.sh [--range INICIO-FIM] usuario1 [usuario2 ...]
# =============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
network_output_file="${SCRIPT_DIR}/tmp/network_data.txt"
user_data_file="${SCRIPT_DIR}/tmp/user_data.txt"
ltsp_conf_file="/etc/ltsp/ltsp.conf"

range_start=100
range_end=150

function exibir_ajuda() {
    echo "Uso: sudo $0 [--range INICIO-FIM] usuario1 [usuario2 ...]"
    echo "  --range INICIO-FIM     Define o range de IPs (ex: 100-150)"
    echo "  usuario1 [usuario2...] Lista de nomes de usuário para configurar"
    echo ""
    echo "Senhas devem estar no arquivo $user_data_file no formato usuario:senha"
}

# === Argumentos ===
usuarios_input=()
while [[ $# -gt 0 ]]; do
    case "$1" in
        --range)
            [[ "$2" =~ ^[0-9]+-[0-9]+$ ]] || { echo "❌ Range inválido."; exibir_ajuda; exit 1; }
            range_start="${2%-*}"
            range_end="${2#*-}"
            shift 2
            ;;
        --help|-h)
            exibir_ajuda; exit 0
            ;;
        *)
            usuarios_input+=("$1"); shift
            ;;
    esac
done

# === Validações ===
[[ "$(id -u)" -eq 0 ]] || { echo "❌ Execute como root."; exit 1; }
[[ ${#usuarios_input[@]} -eq 0 ]] && { echo "❌ Nenhum usuário."; exibir_ajuda; exit 1; }
[[ -f "$user_data_file" ]] || { echo "❌ Arquivo de senhas $user_data_file não encontrado."; exit 1; }

# === Deduplicação e validação ===
usuarios_unicos=($(printf '%s\n' "${usuarios_input[@]}" | sort -u))
for u in "${usuarios_unicos[@]}"; do
    [[ "$u" =~ ^[a-z_][a-z0-9_-]*$ ]] || { echo "❌ Nome inválido: $u"; exit 1; }
done

# === Prefixo de rede ===
if [[ -f "$network_output_file" ]]; then
    ip_cidr=$(awk '/IP Address \(com CIDR\):/ {print $5}' "$network_output_file")
    network_prefix=$(cut -d/ -f1 <<< "$ip_cidr" | cut -d. -f1-3)
else
    echo "⚠️ Rede não detectada, usando 192.168.1"
    network_prefix="192.168.1"
fi

# === Garante estrutura básica do ltsp.conf ===
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

# === Adiciona usuários únicos com IPs ===
user_count=0
ip_suffix=$range_start
declare -A configurados

for user in "${usuarios_unicos[@]}"; do
    grep -q "AUTOLOGIN=${user}" "$ltsp_conf_file" && {
        echo "[INFO] $user já está configurado. Pulando."
        continue
    }

    while (( ip_suffix <= range_end )); do
        ip="${network_prefix}.${ip_suffix}"
        grep -q "^\[${ip//./\\.}\]" "$ltsp_conf_file" || break
        ((ip_suffix++))
    done

    [[ $ip_suffix -gt $range_end ]] && {
        echo "⚠️ Range de IPs esgotado."; break
    }

    senha=$(grep "^${user}:" "$user_data_file" | cut -d: -f2-)
    [[ -z "$senha" ]] && { echo "❌ Senha não encontrada para $user. Pulando."; continue; }
    senha_b64=$(echo -n "$senha" | base64)

    {
        echo ""
        echo "[${ip}]"
        echo "AUTOLOGIN=${user}"
        echo "PASSWORDS_LAB=\"${user}/${senha_b64}\""
    } >> "$ltsp_conf_file"

    echo "✔ $user configurado com IP $ip"
    ((user_count++))
    ((ip_suffix++))
done

echo "[✅] $user_count usuários únicos adicionados ao $ltsp_conf_file."
exit 0
