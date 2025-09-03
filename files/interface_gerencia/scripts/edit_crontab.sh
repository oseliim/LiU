#!/bin/bash

# Script para editar crontab: listar e remover entradas
# Uso:
# Interativo: ./edit_crontab.sh
# Não-interativo: ./edit_crontab.sh --line <numero_linha>

# Função para listar crontab
list_crontab() {
    crontab -l 2>/dev/null
}

# Função para remover linha por número
remove_by_line() {
    local LINE_NUM="$1"

    # Lista o crontab
    local CRONS=$(list_crontab)
    if [ -z "$CRONS" ]; then
        echo "Não há entradas no crontab para este usuário."
        exit 1
    fi

    # Conta total de linhas
    local TOTAL=$(echo "$CRONS" | wc -l)

    # Verifica se é número válido
    if ! [[ "$LINE_NUM" =~ ^[0-9]+$ ]] || [ "$LINE_NUM" -lt 1 ] || [ "$LINE_NUM" -gt "$TOTAL" ]; then
        echo "Número da linha inválido: $LINE_NUM (total: $TOTAL)"
        exit 1
    fi

    # Remove a linha e atualiza crontab
    echo "$CRONS" | sed "${LINE_NUM}d" | crontab -

    echo "Entrada $LINE_NUM removida com sucesso!"
}

# Verifica argumentos
if [ "$1" = "--line" ] && [ -n "$2" ]; then
    # Modo não-interativo
    remove_by_line "$2"
elif [ $# -eq 0 ]; then
    # Modo interativo
    CRONS=$(list_crontab)
    if [ -z "$CRONS" ]; then
        echo "Não há entradas no crontab para este usuário."
        exit 1
    fi

    echo "Entradas atuais do crontab:"
    echo "$CRONS" | nl -w2 -s': '

    echo
    read -p "Digite o número da linha que deseja apagar: " NUM
    remove_by_line "$NUM"
else
    echo "Uso: $0 [--line <numero_linha>]"
    exit 1
fi
