#!/usr/bin/env bash
# Gerenciador simples de crontab em shell (sem interface gráfica)

# Função para adicionar cron job
add_cron_job() {
    local SCRIPT="$1"
    local CRON="$2"
    local LOGAR="$3"
    local LOGFILE="$4"
    local ACTION="$5"

    if [[ ! -f "$SCRIPT" ]]; then
        echo "❌ Arquivo não encontrado: $SCRIPT"
        exit 1
    fi
    chmod +x "$SCRIPT"

    # Definir o arquivo baseado na ação
    local FILE=""
    case "$ACTION" in
        turn_on)
            FILE="$(dirname "$0")/mac_maquinas"
            ;;
        turn_off)
            FILE="$(dirname "$0")/maquinas"
            ;;
        *)
            FILE=""
            ;;
    esac

    if [[ -n "$FILE" ]]; then
        CMD="sudo bash \"$SCRIPT\" \"$FILE\""
    else
        CMD="\"$SCRIPT\""
    fi

    if [[ "$LOGAR" == "true" ]]; then
        CMD="$CMD >> \"$LOGFILE\" 2>&1"
    fi

    CRONLINE="$CRON $CMD"

    (crontab -l 2>/dev/null; echo "$CRONLINE") | crontab -
    echo "✅ Entrada adicionada: $CRONLINE"
}

# Função para remover cron job por número da linha
# Esta função remove uma entrada específica do crontab baseada no número da linha listada.
# Parâmetros:
#   $1: Número da linha a ser removida (conforme listado pelo comando crontab -l)
# Retorno:
#   0: Sucesso
#   1: Falha (nenhum cron configurado ou linha inválida)
# Exemplo de uso:
#   remove_cron_job 2  # Remove a segunda linha do crontab
remove_cron_job() {
    local LINE_NUMBER="$1"

    # Verificar se o número da linha é válido
    if [[ ! "$LINE_NUMBER" =~ ^[0-9]+$ ]]; then
        echo "❌ Número da linha inválido: $LINE_NUMBER"
        return 1
    fi

    # Obter crontab atual
    local CRONS=$(crontab -l 2>/dev/null)
    if [[ -z "$CRONS" ]]; then
        echo "Nenhum cron configurado."
        return 1
    fi

    # Contar o número total de linhas
    local TOTAL_LINES=$(echo "$CRONS" | wc -l)
    if [[ "$LINE_NUMBER" -lt 1 || "$LINE_NUMBER" -gt "$TOTAL_LINES" ]]; then
        echo "❌ Número da linha fora do intervalo: $LINE_NUMBER (total: $TOTAL_LINES)"
        return 1
    fi

    # Remover a linha especificada usando sed
    local NEW_CRONS=$(echo "$CRONS" | sed "${LINE_NUMBER}d")

    # Atualizar crontab com as linhas restantes
    echo "$NEW_CRONS" | crontab -

    echo "✅ Entrada removida com sucesso!"
    return 0
}

# Verificar se argumentos foram passados para modo não-interativo
if [[ $# -gt 0 ]]; then
    ACTION=""
    CRON=""
    SCRIPT=""
    LOGAR="false"
    LOGFILE=""

    while [[ $# -gt 0 ]]; do
        case $1 in
            --action)
                ACTION="$2"
                shift 2
                ;;
            --cron)
                CRON="$2"
                shift 2
                ;;
            --script)
                SCRIPT="$2"
                shift 2
                ;;
            --log)
                LOGAR="true"
                LOGFILE="$2"
                shift 2
                ;;
            *)
                echo "Uso: $0 [--action turn_on|turn_off] [--cron 'expressão'] [--script caminho] [--log arquivo]"
                exit 1
                ;;
        esac
    done

    if [[ -z "$ACTION" || -z "$CRON" ]]; then
        echo "❌ Ação e expressão cron são obrigatórias."
        exit 1
    fi

    # Definir script padrão baseado na ação
    if [[ -z "$SCRIPT" ]]; then
        case "$ACTION" in
            turn_on)
                SCRIPT="$(dirname "$0")/liga.sh"
                ;;
            turn_off)
                SCRIPT="$(dirname "$0")/desliga.sh"
                ;;
            *)
                echo "❌ Ação inválida: $ACTION"
                exit 1
                ;;
        esac
    fi

    add_cron_job "$SCRIPT" "$CRON" "$LOGAR" "$LOGFILE" "$ACTION"
    exit 0
fi

# Modo interativo (menu original)
while true; do
    clear
    echo "=============================="
    echo "   GERENCIADOR DE CRONTAB"
    echo "=============================="
    echo "1) Adicionar novo cron"
    echo "2) Ver crons existentes"
    echo "3) Remover cron"
    echo "4) Sair"
    echo "=============================="
    read -rp "Escolha uma opção: " OPCAO

    case "$OPCAO" in
        1)
            read -rp "Informe o caminho completo do script: " SCRIPT
            if [[ ! -f "$SCRIPT" ]]; then
                echo "❌ Arquivo não encontrado."
                read -n1 -r -p "Pressione qualquer tecla para continuar..."
                continue
            fi
            chmod +x "$SCRIPT"

            echo "Escolha a frequência:"
            echo "1) A cada X minutos"
            echo "2) A cada hora"
            echo "3) Diariamente"
            echo "4) Semanalmente"
            echo "5) Mensalmente"
            echo "6) Avançado (expressão manual)"
            read -rp "Opção: " FREQ

            case "$FREQ" in
                1)
                    read -rp "Informe o intervalo de minutos (ex: 5): " MINUTOS
                    CRON="*/$MINUTOS * * * *"
                    ;;
                2)
                    read -rp "Informe o minuto da hora (0-59): " MIN
                    CRON="$MIN * * * *"
                    ;;
                3)
                    read -rp "Informe a hora (0-23): " HORA
                    read -rp "Informe o minuto (0-59): " MIN
                    CRON="$MIN $HORA * * *"
                    ;;
                4)
                    read -rp "Informe o dia da semana (0=Dom, 1=Seg, ... 6=Sáb): " DIASEM
                    read -rp "Informe a hora (0-23): " HORA
                    read -rp "Informe o minuto (0-59): " MIN
                    CRON="$MIN $HORA * * $DIASEM"
                    ;;
                5)
                    read -rp "Informe o dia do mês (1-31): " DIAMES
                    read -rp "Informe a hora (0-23): " HORA
                    read -rp "Informe o minuto (0-59): " MIN
                    CRON="$MIN $HORA $DIAMES * *"
                    ;;
                6)
                    read -rp "Digite a expressão cron (5 campos): " CRON
                    ;;
                *)
                    echo "❌ Opção inválida."
                    read -n1 -r -p "Pressione qualquer tecla para continuar..."
                    continue
                    ;;
            esac

            read -rp "Deseja salvar saída em log? (s/n): " LOGAR
            if [[ "$LOGAR" =~ ^[Ss]$ ]]; then
                read -rp "Informe o caminho do arquivo de log: " LOGFILE
                CMD="\"$SCRIPT\" >> \"$LOGFILE\" 2>&1"
            else
                CMD="\"$SCRIPT\""
            fi

            CRONLINE="$CRON $CMD"

            echo "A seguinte entrada será adicionada:"
            echo "$CRONLINE"
            read -rp "Confirma? (s/n): " CONF
            if [[ "$CONF" =~ ^[Ss]$ ]]; then
                (crontab -l 2>/dev/null; echo "$CRONLINE") | crontab -
                echo "✅ Entrada adicionada!"
            else
                echo "❌ Cancelado."
            fi
            read -n1 -r -p "Pressione qualquer tecla para continuar..."
            ;;
        2)
            echo "=== Crons existentes ==="
            crontab -l 2>/dev/null || echo "Nenhum cron configurado."
            echo "========================"
            read -n1 -r -p "Pressione qualquer tecla para continuar..."
            ;;
        3)
            CRONS=$(crontab -l 2>/dev/null)
            if [[ -z "$CRONS" ]]; then
                echo "Nenhum cron configurado."
                read -n1 -r -p "Pressione qualquer tecla para continuar..."
                continue
            fi

            echo "=== Entradas atuais ==="
            nl -w2 -s": " <<< "$CRONS"
            echo "======================="
            read -rp "Informe o número da linha a remover: " LINHA

            remove_cron_job "$LINHA"
            read -n1 -r -p "Pressione qualquer tecla para continuar..."
            ;;
        4)
            echo "Saindo..."
            exit 0
            ;;
        *)
            echo "Opção inválida."
            read -n1 -r -p "Pressione qualquer tecla para continuar..."
            ;;
    esac
done
