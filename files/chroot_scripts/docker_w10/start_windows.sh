#!/usr/bin/env bash
# =============================================================================
#  start_windows.sh — Sobe o dockur/windows e conecta via RDP automaticamente
#  Uso: ./start_windows.sh [--no-rdp] [--rebuild]
# =============================================================================

#set -euo pipefail

# Execução de docker como sudo e xfreerdp como usuário comum

# ── Configurações ─────────────────────────────────────────────────────────────
if [ "$EUID" -eq 0 ] && [ -n "$SUDO_USER" ]; then
    USER_HOME=$(getent passwd "$SUDO_USER" | cut -d: -f6)
else
    USER_HOME="$HOME"
fi
COMPOSE_DIR="${USER_HOME}/docker_windows10"
CONTAINER_NAME="windows"           # nome do serviço/container no compose
RDP_USER="aluno"
RDP_PASS="aluno"
RDP_PORT=3389

# Tentativas de conexão RDP
RDP_MAX_ATTEMPTS=30               # máx de tentativas antes de desistir
RDP_RETRY_INTERVAL=10             # segundos entre tentativas
RDP_TCP_TIMEOUT=3                 # timeout do teste de porta TCP (nc)

# Flags de linha de comando
NO_RDP=false
REBUILD=false

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Funções auxiliares ─────────────────────────────────────────────────────────
log_info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
log_ok()      { echo -e "${GREEN}[OK]${RESET}    $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
log_error()   { echo -e "${RED}[ERROR]${RESET} $*" >&2; }
log_step()    { echo -e "\n${BOLD}══════════════════════════════════════${RESET}"; \
                echo -e "${BOLD} $*${RESET}"; \
                echo -e "${BOLD}══════════════════════════════════════${RESET}"; }

parse_args() {
    for arg in "$@"; do
        case "$arg" in
            --no-rdp)   NO_RDP=true ;;
            --rebuild)  REBUILD=true ;;
            --help|-h)
                echo "Uso: $0 [--no-rdp] [--rebuild]"
                echo "  --no-rdp    Sobe o container mas não abre RDP"
                echo "  --rebuild   Força docker compose pull + up --build"
                exit 0 ;;
            *) log_warn "Argumento desconhecido: $arg (ignorado)" ;;
        esac
    done
}

# ── Dependências ───────────────────────────────────────────────────────────────
check_deps() {
    log_step "Verificando dependências"
    local missing=()

    for cmd in docker nc xfreerdp; do
        if command -v "$cmd" &>/dev/null; then
            log_ok "$cmd encontrado: $(command -v "$cmd")"
        else
            log_error "$cmd NÃO encontrado"
            missing+=("$cmd")
        fi
    done

    # docker compose (plugin v2) ou docker-compose (v1)
    if sudo docker compose version &>/dev/null 2>&1; then
        DOCKER_COMPOSE="sudo docker compose"
        log_ok "docker compose (plugin) encontrado"
    elif command -v docker-compose &>/dev/null; then
        DOCKER_COMPOSE="sudo docker-compose"
        log_ok "docker-compose (standalone) encontrado"
    else
        log_error "docker compose / docker-compose NÃO encontrado"
        missing+=("docker-compose")
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Instale os pacotes ausentes e tente novamente:"
        for pkg in "${missing[@]}"; do
            case "$pkg" in
                nc)        echo "  sudo apt install netcat-openbsd" ;;
                xfreerdp)  echo "  sudo apt install freerdp2-x11" ;;
                docker)    echo "  https://docs.docker.com/engine/install/" ;;
                *)         echo "  apt/pip: $pkg" ;;
            esac
        done
        exit 1
    fi
}

# ── Docker ─────────────────────────────────────────────────────────────────────
start_container() {
    log_step "Iniciando container Docker Windows"

    if [[ ! -d "$COMPOSE_DIR" ]]; then
        log_error "Diretório não encontrado: $COMPOSE_DIR"
        log_error "Crie o diretório e coloque o docker-compose.yml lá."
        exit 1
    fi

    local compose_file="$COMPOSE_DIR/docker-compose.yml"
    if [[ ! -f "$compose_file" ]] && [[ ! -f "$COMPOSE_DIR/compose.yml" ]]; then
        log_error "Nenhum docker-compose.yml encontrado em $COMPOSE_DIR"
        exit 1
    fi

    cd "$COMPOSE_DIR"

    log_info "Verificando e removendo containers antigos que possam estar atrapalhando..."
    $DOCKER_COMPOSE down --remove-orphans 2>/dev/null || true
    sudo docker rm -f "$CONTAINER_NAME" w10 2>/dev/null || true

    if $REBUILD; then
        log_info "Modo rebuild: fazendo pull e recriando containers…"
        $DOCKER_COMPOSE pull || log_warn "Pull falhou (imagem pode já estar local)"
        if ! $DOCKER_COMPOSE up -d --build --force-recreate; then
            log_warn "Erro no rebuild! Limpando snapshots corrompidos..."
            sudo docker system prune -a -f --volumes || true
            $DOCKER_COMPOSE pull || true
            $DOCKER_COMPOSE up -d --build --force-recreate
        fi
    else
        if ! $DOCKER_COMPOSE up -d; then
            log_warn "Falha ao iniciar. Possível snapshot/cache corrompido!"
            log_info "Executando limpeza profunda (docker system prune)..."
            sudo docker system prune -a -f --volumes || true
            log_info "Fazendo pull da imagem novamente..."
            $DOCKER_COMPOSE pull || true
            log_info "Tentando subir o container de novo..."
            $DOCKER_COMPOSE up -d
        fi
    fi

    log_ok "docker compose up -d concluído"
}

# ── Descoberta de IP ────────────────────────────────────────────────────────────
get_container_ip() {
    # Tenta várias estratégias para obter o IP do container
    local ip=""

    # 1. docker inspect (mais confiável)
    ip=$(sudo docker inspect -f \
        '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' \
        "$CONTAINER_NAME" 2>/dev/null | head -n1)

    if [[ -n "$ip" && "$ip" != "" ]]; then
        echo "$ip"
        return 0
    fi

    # 2. docker compose ps --format
    ip=$(cd "$COMPOSE_DIR" && \
        $DOCKER_COMPOSE ps -q "$CONTAINER_NAME" 2>/dev/null | \
        xargs -r sudo docker inspect -f \
        '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' \
        2>/dev/null | head -n1)

    if [[ -n "$ip" && "$ip" != "" ]]; then
        echo "$ip"
        return 0
    fi

    # 3. Fallback: porta mapeada no host
    local mapped_port
    mapped_port=$(cd "$COMPOSE_DIR" && \
        $DOCKER_COMPOSE port "$CONTAINER_NAME" "$RDP_PORT" 2>/dev/null | \
        cut -d: -f2)

    if [[ -n "$mapped_port" ]]; then
        echo "127.0.0.1"   # usa localhost com a porta mapeada
        return 0
    fi

    return 1
}

get_rdp_port() {
    # Verifica se a porta RDP está mapeada no host
    local mapped
    mapped=$(cd "$COMPOSE_DIR" && \
        $DOCKER_COMPOSE port "$CONTAINER_NAME" "$RDP_PORT" 2>/dev/null | \
        cut -d: -f2 || true)
    echo "${mapped:-$RDP_PORT}"
}

# ── Espera pela porta RDP ──────────────────────────────────────────────────────
wait_for_rdp() {
    local ip="$1"
    local port="$2"
    local attempt=0

    log_step "Aguardando RDP ficar disponível em ${ip}:${port}"
    log_info "Máx. tentativas: ${RDP_MAX_ATTEMPTS} | Intervalo: ${RDP_RETRY_INTERVAL}s"
    log_info "Isso pode levar vários minutos (Windows está inicializando)…"
    echo ""

    while (( attempt < RDP_MAX_ATTEMPTS )); do
        (( attempt++ )) || true
        printf "${CYAN}[%2d/%d]${RESET} Testando ${ip}:${port}… " \
               "$attempt" "$RDP_MAX_ATTEMPTS"

        # ── Tática 1: nc (netcat) — teste TCP puro, mais rápido ──────────────
        if nc -z -w "$RDP_TCP_TIMEOUT" "$ip" "$port" 2>/dev/null; then
            echo -e "${GREEN}porta aberta!${RESET}"

            # ── Tática 2: pequena espera extra para o serviço RDP estabilizar ─
            # A porta pode abrir antes do servidor RDP estar pronto para negociar
            log_info "Porta respondendo. Aguardando 5s para RDP estabilizar…"
            sleep 5

            # ── Tática 3: confirma com segundo teste antes de abrir o cliente ─
            if nc -z -w "$RDP_TCP_TIMEOUT" "$ip" "$port" 2>/dev/null; then
                log_ok "RDP confirmado e estável!"
                return 0
            else
                log_warn "Porta fechou logo depois — aguardando mais…"
            fi
        else
            # Container ainda inicializando
            local elapsed=$(( attempt * RDP_RETRY_INTERVAL ))
            printf "${YELLOW}sem resposta${RESET} (${elapsed}s decorridos)\n"
        fi

        # Não dorme na última tentativa
        if (( attempt < RDP_MAX_ATTEMPTS )); then
            sleep "$RDP_RETRY_INTERVAL"
        fi
    done

    log_error "RDP não respondeu após ${RDP_MAX_ATTEMPTS} tentativas."
    log_error "Verifique os logs: cd ${COMPOSE_DIR} && ${DOCKER_COMPOSE} logs -f"
    return 1
}

# ── Conectar via xfreerdp ──────────────────────────────────────────────────────
connect_rdp() {
    local ip="$1"
    local port="$2"

    log_step "Abrindo sessão RDP"
    log_info "Host : ${ip}:${port}"
    log_info "Usuário: ${RDP_USER}"

    # Monta o comando — porta só é adicionada se diferente de 3389
    local target="${ip}"
    [[ "$port" != "3389" ]] && target="${ip}:${port}"

    local cmd=()
    if [ "$EUID" -eq 0 ]; then
        local real_user="${SUDO_USER:-$(stat -c '%U' "$0")}"
        log_info "Executando xfreerdp como usuário comum: $real_user"
        cmd+=(sudo -u "$real_user" -H)
    fi

    cmd+=(
        xfreerdp
        /v:"${target}"
        /u:"${RDP_USER}"
        /p:"${RDP_PASS}"
        /sound:sys:alsa
        /microphone
        /clipboard
        /f
        /bpp:32
        /gfx
        /network:auto
        +auto-reconnect
        /cert:ignore
        /relax-order-checks
    )

    log_info "Comando: ${cmd[*]}"
    echo ""

    # Executa o xfreerdp com mecanismo de retry para erros críticos
    local max_attempts=4  # 1 tentativa inicial + 3 retentativas
    local attempt=1
    local exit_code=0

    while (( attempt <= max_attempts )); do
        if (( attempt > 1 )); then
            log_warn "Tentando novamente conectar via RDP (Tentativa ${attempt}/${max_attempts}) em 5 segundos..."
            sleep 5
        fi

        # Executa o xfreerdp — quando o usuário fechar a janela, o script termina
        "${cmd[@]}"
        exit_code=$?

        # xfreerdp retorna != 0 em desconexões normais; só alerta/retenta se grave
        if (( exit_code <= 1 )); then
            break
        fi

        log_error "xfreerdp encerrou com erro crítico (código ${exit_code})."
        (( attempt++ ))
    done

    if (( exit_code > 1 )); then
        log_error "Falha persistente ao conectar via RDP após $((attempt - 1)) tentativas."
        return "$exit_code"
    fi
}

# ── Limpeza ao sair ────────────────────────────────────────────────────────────
cleanup() {
    echo ""
    log_info "Script finalizado."
}
trap cleanup EXIT

# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════════════
main() {
    parse_args "$@"

    echo ""
    echo -e "${BOLD}╔══════════════════════════════════════════╗${RESET}"
    echo -e "${BOLD}║   dockur/windows — Launcher com RDP      ║${RESET}"
    echo -e "${BOLD}╚══════════════════════════════════════════╝${RESET}"
    echo ""

    check_deps
    start_container

    if $NO_RDP; then
        log_ok "Container iniciado. RDP pulado (--no-rdp)."
        exit 0
    fi

    # Descobre IP e porta
    log_step "Descobrindo IP do container"
    local container_ip
    if ! container_ip=$(get_container_ip); then
        log_error "Não foi possível determinar o IP do container."
        log_error "Verifique se o serviço se chama '${CONTAINER_NAME}' no compose."
        exit 1
    fi
    local rdp_port
    rdp_port=$(get_rdp_port)

    log_ok "IP   : ${container_ip}"
    log_ok "Porta: ${rdp_port}"

    # Aguarda e conecta
    wait_for_rdp "$container_ip" "$rdp_port"
    connect_rdp  "$container_ip" "$rdp_port"
}

main "$@"
