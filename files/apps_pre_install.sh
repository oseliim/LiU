#!/bin/bash

# Array associativo com os comandos de instalação (modo não-interativo)
declare -A INSTALL_COMMANDS=(
  ["vscode"]="
    # Adicionar repositório do VSCode
    apt-get install -y --no-install-recommends wget gpg > /dev/null
    wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --batch --dearmor > packages.microsoft.gpg
    install -D -o root -g root -m 644 packages.microsoft.gpg /etc/apt/keyrings/packages.microsoft.gpg > /dev/null
    sh -c 'echo \"deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main\" > /etc/apt/sources.list.d/vscode.list'
    
    # Instalar VSCode
    apt-get update -y > /dev/null
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends code > /dev/null
  "

  ["spotify"]="
    # Limpar configurações anteriores
    rm -f /etc/apt/sources.list.d/spotify.list > /dev/null 2>&1
    rm -f /usr/share/keyrings/spotify.gpg > /dev/null 2>&1
    
    # Adicionar chave GPG
    curl -sS https://download.spotify.com/debian/pubkey_7A3A762FAFD4A51F.gpg | gpg --batch --dearmor -o /usr/share/keyrings/spotify.gpg > /dev/null
    
    # Adicionar repositório
    echo \"deb [arch=amd64 signed-by=/usr/share/keyrings/spotify.gpg] http://repository.spotify.com stable non-free\" | tee /etc/apt/sources.list.d/spotify.list > /dev/null
    
    # Instalação forçada
    apt-get update -y --allow-unauthenticated > /dev/null
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends spotify-client > /dev/null 2>&1 || {
      echo \"Fallback para Snap...\" > /dev/null
      snap install spotify --classic > /dev/null 2>&1
    }
  "

  ["virtualbox"]="
    # Adicionar repositório
    wget -q https://www.virtualbox.org/download/oracle_vbox_2016.asc -O- | gpg --batch --dearmor --output /usr/share/keyrings/oracle-virtualbox-2016.gpg > /dev/null
    echo \"deb [arch=amd64 signed-by=/usr/share/keyrings/oracle-virtualbox-2016.gpg] https://download.virtualbox.org/virtualbox/debian \$(lsb_release -cs) contrib\" | tee /etc/apt/sources.list.d/virtualbox.list > /dev/null
    
    # Instalar VirtualBox
    apt-get update -y > /dev/null
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends virtualbox-7.0 > /dev/null
  "

  ["vlc"]="
    # Instalar VLC
    apt-get update -y > /dev/null
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends vlc > /dev/null
  "
)

# Verificar arquivo de seleção
SELECTION_FILE="./tmp/additional_packages.txt"
[[ ! -f "$SELECTION_FILE" ]] && { echo "Erro: Arquivo '$SELECTION_FILE' não encontrado!" >&2; exit 1; }

# Ler aplicativos selecionados
mapfile -t selected_apps < <(grep -v '^#' "$SELECTION_FILE" | tr '[:upper:]' '[:lower:]' | xargs -n1)

[[ ${#selected_apps[@]} -eq 0 ]] && { echo "Nenhum aplicativo selecionado."; exit 0; }

# Instalar pré-requisitos
echo ">>> Instalando pré-requisitos <<<" > /dev/null
DEBIAN_FRONTEND=noninteractive apt-get update -y > /dev/null
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  curl wget gpg apt-transport-https ca-certificates software-properties-common > /dev/null

# Processar instalações
for app in "${selected_apps[@]}"; do
  [[ -z "${INSTALL_COMMANDS[$app]}" ]] && { echo "[AVISO] $app não suportado" >&2; continue; }

  echo -e "\n>>> Instalando ${app^^} <<<" > /dev/null
  while IFS= read -r cmd; do
    [[ -z "$cmd" || "$cmd" =~ ^[[:space:]]*# ]] && continue
    eval "$cmd" > /dev/null 2>&1
  done <<< "${INSTALL_COMMANDS[$app]}"

  # Verificação simplificada
  case "$app" in
    spotify) command -v spotify > /dev/null || snap list | grep -q spotify ;;
    vscode) command -v code > /dev/null ;;
    virtualbox) command -v virtualbox > /dev/null ;;
    vlc) command -v vlc > /dev/null ;;
  esac && echo "[SUCESSO] ${app^^}" > /dev/null || echo "[ERRO] ${app^^}" >&2
done

# Limpeza final
DEBIAN_FRONTEND=noninteractive apt-get --fix-broken install -y > /dev/null
DEBIAN_FRONTEND=noninteractive apt-get autoremove -y > /dev/null