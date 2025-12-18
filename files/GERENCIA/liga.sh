#!/bin/bash

# Configurações
PREFIXO_ARQ="macs_"
TIMEOUT_WOL="0.1" # Pequeno delay para não flodar o switch se forem muitas máquinas

# Cores
VERDE="\033[32m"
NORMAL="\033[0m"

# Função de Ajuda
usage() {
    echo "Uso: $0 [-a | -l <nome_do_lab>]"
    echo "  -a : Liga TODAS as máquinas (lê todos arquivos macs_*)"
    echo "  -l : Liga um laboratório específico (ex: -l labconf busca 'macs_labconf')"
    echo "Exemplo: $0 -l labconf"
    exit 1
}

# Verifica dependência
if ! command -v wakeonlan &> /dev/null; then
    echo "Erro: O pacote 'wakeonlan' não está instalado."
    echo "Instale com: sudo apt install wakeonlan"
    exit 1
fi

# Variáveis de controle
MODO=""
ARQUIVOS=()

# Processamento de Argumentos
while getopts "al:" opt; do
    case $opt in
        a) 
            MODO="ALL"
            # Carrega todos os arquivos que começam com o prefixo
            ARQUIVOS=(${PREFIXO_ARQ}*)
            ;;
        l) 
            MODO="LAB"
            ALVO="$OPTARG"
            ARQ_ALVO="${PREFIXO_ARQ}${ALVO}"
            if [[ -f "$ARQ_ALVO" ]]; then
                ARQUIVOS+=("$ARQ_ALVO")
            else
                echo "Erro: Arquivo '$ARQ_ALVO' não encontrado."
                exit 1
            fi
            ;;
        *) usage ;;
    esac
done

if [[ -z "$MODO" ]]; then
    usage
fi

if [ ${#ARQUIVOS[@]} -eq 0 ]; then
    echo "Nenhum arquivo de MACs encontrado."
    exit 1
fi

echo "--- Iniciando Wake-on-LAN ---"

# Loop pelos arquivos selecionados
for arquivo in "${ARQUIVOS[@]}"; do
    
    echo "Processando arquivo: $arquivo"
    
    # Processamento linha a linha
    # O AWK pega a coluna 1 (MAC) e a coluna 3 (Hostname, assumindo o separador ' - ')
    awk '{print $1, $3}' "$arquivo" | while read -r mac hostname; do
        
        # Validação básica de MAC (ignora linhas vazias ou comentários)
        if [[ -n "$mac" && "$mac" != \#* ]]; then
            # Dispara o pacote
            wakeonlan "$mac" > /dev/null
            
            # Feedback visual
            echo -e "[ ${VERDE}WOL ENVIADO${NORMAL} ] $mac ($hostname)"
            
            # Pequena pausa opcional para segurança da rede
            sleep "$TIMEOUT_WOL"
        fi
    done
done

echo "--- Processo Finalizado ---"
