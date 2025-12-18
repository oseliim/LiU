#!/bin/bash
# ==========================================================
# Monitoramento de Estações LTSP Ativas no serviço LiU
# ==========================================================

# O primeiro argumento agora é opcionalmente o modo (ex: user-only)
MODE="$1"              

LOGFILE="/var/log/ltsp_sessions.log"
OUTFILE="maquinas.txt"

# ----------------------------
# Cores (tput)
# ----------------------------
BOLD=$(tput bold)
RESET=$(tput sgr0)
GREEN=$(tput setaf 2)
CYAN=$(tput setaf 6)
YELLOW=$(tput setaf 3)
BLUE=$(tput setaf 4)
RED=$(tput setaf 1)

# ----------------------------
# Validações e Autodetecção
# ----------------------------
if [[ $EUID -ne 0 ]]; then
    echo "Execute com sudo."
    exit 1
fi

# DETECÇÃO AUTOMÁTICA DA REDE
# Pega o IP/CIDR da primeira interface que não é loopback (127.0.0.1)
# Exemplo de saída esperada: 192.168.100.1/24
NETWORK=$(ip -o -f inet addr show | awk '!/127.0.0.1/ {print $4}' | head -n 1)

if [[ -z "$NETWORK" ]]; then
    echo "${RED}Erro: Não foi possível detectar a rede automaticamente.${RESET}"
    exit 1
fi

# IP do próprio servidor (para exclusão) - Pega todos os IPs locais para garantir
SERVER_IPS=$(hostname -I)
LOCAL_USER=$(logname 2>/dev/null)

# ----------------------------
# Inicialização
# ----------------------------
echo "" > "$LOGFILE"
echo "" > "$OUTFILE"

TOTAL=0
declare -A LAB_COUNT

echo ""
echo "${BOLD}${BLUE}══════════════════════════════════════════════════════${RESET}"
echo "${BOLD}${BLUE} 🖥️  Monitoramento de Estações Ativas${RESET}"
echo "${BOLD}${BLUE} 🌐 Rede Detectada: ${YELLOW}$NETWORK${RESET}"
echo "${BOLD}${BLUE}══════════════════════════════════════════════════════${RESET}"
echo ""

# ----------------------------
# Loop principal
# ----------------------------
while read -r SID; do

    USER=$(loginctl show-session "$SID" -p Name --value)
    REMOTE=$(loginctl show-session "$SID" -p Remote --value)
    HOST=$(loginctl show-session "$SID" -p RemoteHost --value)
    DISPLAY=$(loginctl show-session "$SID" -p Display --value)

    # ----------------------------
    # Filtros obrigatórios
    # ----------------------------

    # Apenas sessões remotas (LTSP)
    [[ "$REMOTE" != "yes" ]] && continue

    # Ignora root e usuário local do servidor
    [[ "$USER" == "root" || "$USER" == "$LOCAL_USER" ]] && continue

    # IP válido
    IP="$HOST"
    # Verifica se o IP está vazio ou se é um dos IPs do servidor
    [[ -z "$IP" || "$SERVER_IPS" == *"$IP"* ]] && continue

    # IP dentro da rede detectada (Auto-Detecção)
    # O ipcalc verifica se o HOST pertence à NETWORK detectada
    ipcalc -c "$IP" "$NETWORK" >/dev/null 2>&1 || continue

    # Resolve MAC somente para IP válido
    MAC=$(ip neigh show "$IP" 2>/dev/null | awk '{print $5}')
    [[ -z "$MAC" ]] && continue

    # Laboratório (prefixo do usuário)
    LAB=$(echo "$USER" | sed 's/[0-9].*$//')

    # ----------------------------
    # Contadores
    # ----------------------------
    ((TOTAL++))
    ((LAB_COUNT["$LAB"]++))

    # ----------------------------
    # Escrita segura no arquivo
    # ----------------------------
    echo "$LAB | $USER | $IP | $MAC" >> "$OUTFILE"

    # ----------------------------
    # Saída no terminal
    # ----------------------------
    if [[ "$MODE" == "user-only" ]]; then
        printf " • %-12s | %-15s | %s\n" "$USER" "$IP" "$MAC"
        continue
    fi

    echo "${CYAN}┌──────────────────────────────────────────────┐${RESET}"
    echo "${CYAN}│ 👤 Usuário:     ${BOLD}$USER${RESET}"
    echo "${CYAN}│ 🧪 Laboratório: $LAB"
    echo "${CYAN}│ 🌐 IP:          $IP"
    echo "${CYAN}│ 🔗 MAC:         $MAC"
    echo "${CYAN}│ 🖥️  Display:     ${DISPLAY:-N/A}"
    echo "${CYAN}└──────────────────────────────────────────────┘${RESET}"
    echo ""

    echo "$USER $SID $IP $MAC $LAB $DISPLAY" >> "$LOGFILE"

done < <(loginctl list-sessions --no-legend | awk '{print $1}')

# ----------------------------
# Resumo final
# ----------------------------
if [[ "$MODE" != "user-only" ]]; then
    echo "${BOLD}${GREEN}══════════════════════════════════════${RESET}"
    echo "${BOLD}${GREEN} 📊 Resumo${RESET}"
    echo "${BOLD}${GREEN}══════════════════════════════════════${RESET}"
    echo "Total de estações ativas: ${YELLOW}$TOTAL${RESET}"
    echo ""

    for LAB in "${!LAB_COUNT[@]}"; do
        printf " • %-12s : %d\n" "$LAB" "${LAB_COUNT[$LAB]}"
    done

    echo ""
    echo "${GREEN}✔ Arquivo '${OUTFILE}' gerado (somente clientes LTSP)${RESET}"
    echo ""
fi
