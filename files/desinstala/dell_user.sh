#!/bin/bash

# Verifica se é root
if [ "$(id -u)" -ne 0 ]; then
    echo "Erro: Este script precisa ser executado como root" >&2
    exit 1
fi

# Obtém o usuário comum atual (quem chamou o sudo)
current_user=$(logname 2>/dev/null || echo "$SUDO_USER")
if [ -z "$current_user" ]; then
    current_user=$(who am i | awk '{print $1}')
fi

input_file="../tmp/user_data.txt"
temp_file="../tmp/user_data.tmp"
> "$temp_file"  # Esvazia o temporário

i=0
lines=$(wc -l < "$input_file")

echo "=== REMOÇÃO SEGURA DE USUÁRIOS ==="
echo "Usuário comum atual: $current_user (protegido)"
echo "Total de usuários a verificar: $lines"
echo "-----------------------------------"

while [ $i -lt $lines ]; do
    ((i++))
    line=$(sed -n "${i}p" "$input_file")
    user=$(echo "$line" | cut -d ':' -f 1 | xargs)
    
    # Verificações de segurança
    if [ -z "$user" ]; then
        echo "[$i/$lines] Linha vazia - pulando"
        continue
    fi
    
    if [ "$user" = "$current_user" ]; then
        echo "[$i/$lines] PULADO: Usuário atual protegido ($user)"
        echo "$line" >> "$temp_file"
        continue
    fi
    
    if [ "$user" = "root" ]; then
        echo "[$i/$lines] PULADO: Tentativa de remover root ($user)"
        echo "$line" >> "$temp_file"
        continue
    fi
    
    if ! id "$user" &>/dev/null; then
        echo "[$i/$lines] $user não existe - pulando"
        # Usuário já não existe, não grava no novo arquivo
        continue
    fi

    pkill -KILL -u "$user"

    # Processo de remoção
    echo -n "[$i/$lines] Removendo $user..."
    if userdel -r "$user" &>/dev/null; then
        echo " OK"
        # Usuário removido com sucesso — não adiciona no novo arquivo
    else
        echo " FALHA (usuário pode estar logado ou ter processos ativos)"
        echo "$line" >> "$temp_file"
    fi
    sleep 1
done

# Substitui o arquivo original pelo temporário
mv "$temp_file" "$input_file"

echo "-----------------------------------"
echo "Processo concluído. Verifique acima por erros."
