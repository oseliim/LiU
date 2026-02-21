#!/bin/bash
# Script de implantação e acesso ao Windows no Docker
# Versão Automática 3.0 - Com correções RDP

set -e  # Sai imediatamente se qualquer comando falhar

# Configurações
TARBALL="windows10.tgz"
# Determinar o usuário correto (funciona tanto com sudo quanto sem)
if [ -n "$SUDO_USER" ]; then
    USER_HOME=$(eval echo ~$SUDO_USER)
    ACTUAL_USER=$SUDO_USER
else
    USER_HOME=$HOME
    ACTUAL_USER=$USER
fi
DOCKER_DIR="$USER_HOME/docker_windows"
CONTAINER_NAME="windows"
USERNAME="aluno"
PASSWORD="aluno"
RDP_PORT="3389"

# Função para detectar o IP local
get_local_ip() {
    local ip
    # Tenta vários métodos para obter o IP
    if command -v ip &> /dev/null; then
        ip=$(ip route get 1 2>/dev/null | awk '{print $7; exit}')
    elif command -v ifconfig &> /dev/null; then
        ip=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | 
             grep -Eo '([0-9]*\.){3}[0-9]*' | 
             grep -v '127.0.0.1' | 
             head -n1)
    else
        ip="127.0.0.1"
    fi
    
    [[ -z "$ip" ]] && ip="127.0.0.1"
    echo "$ip"
}

# Função para verificar dependências
check_dependencies() {
    echo "🔍 Verificando dependências..."
    local missing=0
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker não instalado. Execute: sudo ./script.sh"
        missing=1
    fi
    if ! docker compose version &> /dev/null; then
        echo "❌ Docker Compose não instalado. Execute: sudo ./script.sh"
        missing=1
    fi
    if ! command -v xfreerdp &> /dev/null; then
        echo "❌ xfreerdp não instalado. Execute: sudo ./script.sh"
        missing=1
    fi
    if command -v systemctl &> /dev/null; then
        if ! systemctl is-active --quiet docker; then
            echo "⚠️ Serviço Docker inativo. Execute: sudo ./script.sh"
        fi
    fi
    if [ "$missing" -eq 1 ]; then
        exit 1
    fi
    echo "✅ Todas dependências verificadas"
}

# Verificar e extrair ambiente Windows
check_and_extract_windows() {
    echo "🔍 Verificando ambiente Windows no home do usuário..."
    
    if [ -d "$DOCKER_DIR" ]; then
        echo "✅ Diretório $DOCKER_DIR encontrado no home do usuário"
        return 0
    fi
    
    echo "❌ Diretório $DOCKER_DIR não encontrado"
    
    if [ -f "$USER_HOME/$TARBALL" ]; then
        echo "✅ Arquivo $TARBALL encontrado no home do usuário"
    else
        echo "❌ Arquivo $TARBALL não encontrado no home do usuário!"
        echo "📥 Baixando arquivo do servidor para $USER_HOME..."
        
        if wget -P "$USER_HOME" http://200.129.176.42/files/windows10.tgz; then
            echo "✅ Download concluído com sucesso"
        else
            echo "❌ Erro: Falha no download do arquivo"
            exit 1
        fi
    fi
    
    echo "📦 Extraindo ambiente Windows..."
    
    if tar -xzf "$USER_HOME/$TARBALL" -C "$USER_HOME"; then
        echo "✅ Extração completa"
        
        if [ -d "$DOCKER_DIR" ]; then
            echo "✅ Diretório $DOCKER_DIR criado com sucesso"
        else
            echo "❌ Erro: Extração falhou - diretório não foi criado"
            exit 1
        fi
    else
        echo "❌ Erro: Falha na extração do arquivo $USER_HOME/$TARBALL"
        exit 1
    fi
}

# Iniciar container Docker
start_container() {
    echo "🐳 Iniciando container Windows..."

    if [ ! -d "$DOCKER_DIR" ]; then
        echo "❌ Diretório $DOCKER_DIR não encontrado!"
        exit 1
    fi

    cd "$DOCKER_DIR"

    echo "🔍 Verificando se o container 'windows' já existe..."
    if docker ps -a --format "table {{.Names}}" | grep -q "^windows$"; then
        echo "✅ Container 'windows' já existe"
    else
        echo "⚠️ Container 'windows' não existe, será criado pelo docker compose"
    fi

    echo "🚀 Executando 'docker compose up -d'..."
    if ! docker compose up -d; then
        echo "❌ Erro: Falha ao executar 'docker compose up -d'"
        cd ..
        exit 1
    fi

    echo "🔍 Verificando se o container foi criado..."
    if ! docker ps -a --format "table {{.Names}}" | grep -q "^windows$"; then
        echo "❌ Erro: Container 'windows' não foi criado pelo docker compose"
        cd ..
        exit 1
    fi

    echo "🚀 Verificando status do container 'windows'..."
    if docker ps --format "table {{.Names}}" | grep -q "^windows$"; then
        echo "✅ Container 'windows' já está rodando"
    else
        echo "🚀 Iniciando container 'windows'..."
        if ! docker start "$CONTAINER_NAME"; then
            echo "❌ Erro: Falha ao iniciar container 'windows'"
            cd ..
            exit 1
        fi
    fi

    # Monitorar logs até Windows estar 100% inicializado
    wait_windows_ready

    echo "🔄 Status final do container:"
    docker ps

    cd ..
}

# Função para aguardar Windows 100% inicializado
wait_windows_ready() {
    echo "⏳ Aguardando Windows inicializar 100%..."
    echo "🔍 Monitorando logs do container..."

    local timeout=600  # 10 minutos de timeout máximo
    local elapsed=0

    while [ $elapsed -lt $timeout ]; do
        # Procura pela mensagem de sucesso nos logs
        if docker logs "$CONTAINER_NAME" 2>/dev/null | grep -q "Windows started successfully"; then
            echo "✅ Windows inicializado com sucesso!"
            echo "⏳ Aguardando mais 10 segundos para RDP ficar 100% pronto..."
            sleep 10
            return 0
        fi

        # Aguarda 10 segundos antes de próxima verificação
        sleep 10
        elapsed=$((elapsed + 10))
        echo "⏳ Ainda aguardando... ($elapsed segundos)"
    done

    echo "❌ Timeout: Windows não iniciou em 10 minutos"
    echo "💡 Verifique com: docker logs $CONTAINER_NAME"
    return 1
}

# Função simplificada para conectar via RDP com retry
connect_rdp() {
    echo "🌐 Obtendo endereço IP..."
    IP=$(get_local_ip)
    echo "📍 Usando IP: $IP"

    # Obter ID do usuário atual
    USER_ID=$(id -u)

    # Configurar variáveis de ambiente para o usuário atual
    export DISPLAY=":0"
    export XAUTHORITY="/home/$ACTUAL_USER/.Xauthority"
    export PULSE_SERVER="unix:/run/user/$USER_ID/pulse/native"

    # Tentar conectar RDP com retry a cada 10 segundos
    local max_attempts=30  # 30 tentativas = 5 minutos
    local attempt=0

    echo "🔍 Testando conexão RDP (máximo 30 tentativas a cada 10 segundos)..."

    while [ $attempt -lt $max_attempts ]; do
        attempt=$((attempt + 1))

        # Verificar se porta RDP está aberta
        if nc -z "$IP" "$RDP_PORT" 2>/dev/null; then
            echo "✅ [Tentativa $attempt] Serviço RDP detectado na porta $RDP_PORT"

            echo "🚀 Iniciando conexão RDP com xfreerdp..."
            echo "📋 Comando: xfreerdp /v:$IP /u:$USERNAME /p:$PASSWORD /sound:sys:pulse /microphone /clipboard /f /dynamic-resolution +auto-reconnect /cert:ignore"

            # Executar xfreerdp diretamente
            xfreerdp /v:"$IP" /u:"$USERNAME" /p:"$PASSWORD" \
                /sound:sys:pulse \
                /microphone \
                /clipboard \
                /f \
                /dynamic-resolution \
                +auto-reconnect \
                /cert:ignore

            RDP_EXIT_CODE=$?

            if [ $RDP_EXIT_CODE -eq 0 ]; then
                echo "✅ Conexão RDP encerrada normalmente"
                return 0
            else
                echo "❌ Conexão RDP falhou com código de saída: $RDP_EXIT_CODE"
                echo "💡 RDP pode estar iniciando, tentando novamente..."
                sleep 10
            fi
        else
            echo "⏳ [Tentativa $attempt/$max_attempts] Porta RDP não respondendo ainda, aguardando 10 segundos..."
            sleep 10
        fi
    done

    echo "❌ RDP não respondeu após 30 tentativas (5 minutos)"
    echo "💡 Tentando método alternativo com terminal..."
    open_rdp_in_terminal
}

# Função para abrir RDP em um terminal
open_rdp_in_terminal() {
    echo "🖥️ Tentando abrir RDP em um terminal..."
    
    IP=$(get_local_ip)
    
    # Comando RDP simplificado
    RDP_CMD="xfreerdp /v:$IP /u:$USERNAME /p:$PASSWORD /f /cert:ignore"
    
    # Tentar diferentes terminais
    if command -v xterm >/dev/null 2>&1; then
        echo "✅ Usando xterm para conexão RDP"
        xterm -hold -e "$RDP_CMD" &
    elif command -v gnome-terminal >/dev/null 2>&1; then
        echo "✅ Usando gnome-terminal para conexão RDP"
        gnome-terminal -- bash -c "$RDP_CMD; echo 'Pressione Enter para fechar...'; read" &
    elif command -v konsole >/dev/null 2>&1; then
        echo "✅ Usando konsole para conexão RDP"
        konsole --hold -e bash -c "$RDP_CMD" &
    elif command -v xfce4-terminal >/dev/null 2>&1; then
        echo "✅ Usando xfce4-terminal para conexão RDP"
        xfce4-terminal --hold -e "$RDP_CMD" &
    else
        echo "❌ Nenhum terminal gráfico encontrado"
        echo "📋 Execute manualmente:"
        echo "$RDP_CMD"
        return 1
    fi
    
    echo "⏳ Terminal iniciado em segundo plano com a conexão RDP"
    return 0
}

# Execução automática passo a passo
echo "Iniciando processo automático de implantação..."

# Verificar se o ambiente Windows já existe
echo "🔍 Verificando se o ambiente Windows já está disponível..."
if [ -d "$DOCKER_DIR" ]; then
    echo "✅ Ambiente Windows encontrado em $DOCKER_DIR"
    echo "🚀 Pulando download e extração - ambiente já existe!"
else
    echo "❌ Ambiente Windows não encontrado. Iniciando processo de download..."
    check_and_extract_windows
fi

# Verificar dependências (Docker, etc.)
echo "🔍 Verificando dependências necessárias..."
check_dependencies

# Iniciar container Docker
start_container

# Conectar via RDP
echo "🔗 Tentando conectar via RDP..."
if ! connect_rdp; then
    echo "❌ Falha na conexão RDP principal"
    echo "🔄 Tentando método alternativo com terminal..."
    if ! open_rdp_in_terminal; then
        echo "❌ Todos os métodos de conexão RDP falharam"
        echo "📋 Execute manualmente:"
        echo "xfreerdp /v:$(get_local_ip) /u:aluno /p:aluno /f /cert:ignore"
        exit 1
    fi
fi

echo "✅ Processo completo!"