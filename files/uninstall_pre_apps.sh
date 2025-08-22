#!/bin/bash

# Array associativo com os comandos de desinstalação para cada aplicativo
declare -A UNINSTALL_COMMANDS=(
  ["vscode"]="
    # Remover o VSCode
    apt purge -y code
    
    # Remover repositório e chave
    rm -f /etc/apt/sources.list.d/vscode.list
    rm -f /etc/apt/keyrings/packages.microsoft.gpg
    rm -f /usr/share/keyrings/packages.microsoft.gpg
  "

  ["spotify"]="
    # Remover o Spotify (tanto via APT quanto via Snap)
    apt purge -y spotify-client || true
    snap remove spotify || true
    
    # Remover repositório e chave
    rm -f /etc/apt/sources.list.d/spotify.list
    rm -f /usr/share/keyrings/spotify.gpg
    rm -f /etc/apt/trusted.gpg.d/spotify.gpg
  "

  ["virtualbox"]="
    # Remover o VirtualBox
    apt purge -y virtualbox-7.0*
    
    # Remover repositório e chave
    rm -f /etc/apt/sources.list.d/virtualbox.list
    rm -f /usr/share/keyrings/oracle-virtualbox-2016.gpg
  "

  ["vlc"]="
    # Remover o VLC
    apt purge -y vlc vlc-bin vlc-plugin*
  "
)

# Ler o arquivo de seleção (mesmo usado na instalação)
SELECTION_FILE="./tmp/addional_packages.txt"
if [[ ! -f "$SELECTION_FILE" ]]; then
    echo "Erro: Arquivo '$SELECTION_FILE' não encontrado!" >&2
    exit 1
fi

# Ler aplicativos do arquivo
selected_apps=()
while IFS= read -r line; do
    if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
        selected_apps+=("$line")
    fi
done < "$SELECTION_FILE"

if [[ ${#selected_apps[@]} -eq 0 ]]; then
    echo "Nenhum aplicativo selecionado no arquivo '$SELECTION_FILE'."
    exit 0
fi

# Processar desinstalação dos selecionados
for app in "${selected_apps[@]}"; do
  if [[ -n "${UNINSTALL_COMMANDS[$app]}" ]]; then
    echo -e "\n>>> Iniciando desinstalação do ${app^^} <<<"
    
    # Executar comandos linha por linha
    while IFS= read -r cmd; do
        [[ -z "$cmd" || "$cmd" =~ ^[[:space:]]*# ]] && continue
        
        echo "Executando: $cmd"
        eval "$cmd"
        
        if [ $? -ne 0 ]; then
            echo -e "[AVISO] Falha no comando: $cmd\n" >&2
        fi
    done <<< "${UNINSTALL_COMMANDS[$app]}"
    
    # Verificar se o pacote foi removido
    if [[ $app == "spotify" ]]; then
        if ! command -v spotify &> /dev/null && ! snap list | grep -q spotify; then
            echo -e "[SUCESSO] ${app^^} desinstalado corretamente!\n"
        else
            echo -e "[ERRO] Falha na desinstalação do ${app^^}\n" >&2
        fi
    elif [[ $app == "vscode" ]]; then
        if ! command -v code &> /dev/null; then
            echo -e "[SUCESSO] ${app^^} desinstalado corretamente!\n"
        else
            echo -e "[ERRO] Falha na desinstalação do ${app^^}\n" >&2
        fi
    elif [[ $app == "virtualbox" ]]; then
        if ! command -v virtualbox &> /dev/null; then
            echo -e "[SUCESSO] ${app^^} desinstalado corretamente!\n"
        else
            echo -e "[ERRO] Falha na desinstalação do ${app^^}\n" >&2
        fi
    elif [[ $app == "vlc" ]]; then
        if ! command -v vlc &> /dev/null; then
            echo -e "[SUCESSO] ${app^^} desinstalado corretamente!\n"
        else
            echo -e "[ERRO] Falha na desinstalação do ${app^^}\n" >&2
        fi
    else
        echo -e "[AVISO] Verificação de desinstalação para $app não implementada\n" >&2
    fi
  else
    echo -e "[AVISO] Comandos de desinstalação para $app não encontrados!\n" >&2
  fi
done

# Limpeza final
echo ">>> Limpeza final do sistema <<<"
apt autoremove -y
apt autoclean
