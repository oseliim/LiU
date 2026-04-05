#!/bin/bash
# import_eve.sh — Copia imagem EVE-NG (vmdk + vmx) para o VMware do usuário
#                 e registra a VM na lista de VMs disponíveis do VMware.

#set -euo pipefail

# =============================
# CONFIGURAÇÃO
# =============================
EVE_SOURCE_DIR="/eve/EVE-NG_REDESBRASIL"   # Diretório com os arquivos da VM (*.vmdk, *.vmx, etc.)
EVE_VM_DIRNAME="EVE"                                # Nome do subdiretório criado no vmware do usuário
LOG="/var/log/ltsp-eve-import.log"

# =============================
# FUNÇÕES
# =============================

log() {
    echo "$*" | tee -a "$LOG"
}

# Detecta o próximo índice de tab livre no preferences do VMware
next_tab_index() {
    local prefs_file="$1"
    local max_tab=-1
    local idx

    if [ -f "$prefs_file" ]; then
        while IFS= read -r line; do
            if [[ "$line" =~ pref\.ws\.session\.window0\.tab([0-9]+)\. ]]; then
                idx="${BASH_REMATCH[1]}"
                (( idx > max_tab )) && max_tab=$idx
            fi
        done < "$prefs_file"
    fi

    echo $(( max_tab + 1 ))
}

# =============================
# DETECTAR USUÁRIO EM TEMPO DE EXECUÇÃO
# =============================
if [ -n "${SUDO_USER:-}" ]; then
    CURRENT_USER="$SUDO_USER"
else
    CURRENT_USER="$(logname 2>/dev/null || whoami)"
fi

HOME_DIR="/home/${CURRENT_USER}"
VMWARE_DIR="${HOME_DIR}/vmware"
DEST_DIR="${VMWARE_DIR}/${EVE_VM_DIRNAME}"
PREFS_FILE="${HOME_DIR}/.vmware/preferences"
INVENTORY_FILE="${HOME_DIR}/.vmware/inventory.vmls"

log "=========================================="
log "[INFO] Usuário       : $CURRENT_USER"
log "[INFO] Fonte         : $EVE_SOURCE_DIR"
log "[INFO] Destino       : $DEST_DIR"
log "=========================================="

# =============================
# VALIDAÇÕES
# =============================

if [ ! -d "$HOME_DIR" ]; then
    log "[ERRO] Home não encontrado: $HOME_DIR"
    exit 1
fi

if [ ! -d "$EVE_SOURCE_DIR" ]; then
    log "[ERRO] Diretório fonte não encontrado: $EVE_SOURCE_DIR"
    exit 1
fi

# Localizar o .vmx dentro do diretório fonte
VMX_FILE=$(find "$EVE_SOURCE_DIR" -maxdepth 1 -name "*.vmx" | head -1)
if [ -z "$VMX_FILE" ]; then
    log "[ERRO] Nenhum arquivo .vmx encontrado em: $EVE_SOURCE_DIR"
    exit 1
fi

VMX_BASENAME="$(basename "$VMX_FILE")"

# =============================
# COPIAR ARQUIVOS DA VM
# =============================

if [ -d "$DEST_DIR" ]; then
    log "[SKIP] Diretório já existe: $DEST_DIR — pulando cópia."
else
    log "[COPY] Copiando $EVE_SOURCE_DIR/* -> $DEST_DIR ..."
    mkdir -p "$DEST_DIR"
    cp "$EVE_SOURCE_DIR"/* "$DEST_DIR/"
    chown -R "${CURRENT_USER}:${CURRENT_USER}" "$DEST_DIR"
    log "[OK]   Arquivos copiados."
fi

DEST_VMX="${DEST_DIR}/${VMX_BASENAME}"

# =============================
# REGISTRAR NO VMWARE PREFERENCES
# =============================

mkdir -p "$(dirname "$PREFS_FILE")"
chown "${CURRENT_USER}:${CURRENT_USER}" "$(dirname "$PREFS_FILE")"

# Verificar se a VM já está registrada no preferences
if [ -f "$PREFS_FILE" ] && grep -qF "$DEST_VMX" "$PREFS_FILE"; then
    log "[SKIP] VM já registrada em preferences — pulando."
else
    TAB_IDX=$(next_tab_index "$PREFS_FILE")
    VM_LABEL="$(basename "$EVE_SOURCE_DIR")"

    log "[PREFS] Registrando como tab${TAB_IDX} em $PREFS_FILE ..."

    sudo -u "$CURRENT_USER" tee -a "$PREFS_FILE" > /dev/null <<EOF

# ${VM_LABEL}
pref.ws.session.window0.tab${TAB_IDX}.cnxType = "vmdb"
pref.ws.session.window0.tab${TAB_IDX}.dest = ""
pref.ws.session.window0.tab${TAB_IDX}.file = "${DEST_VMX}"
pref.ws.session.window0.tab${TAB_IDX}.type = "vm"
pref.ws.session.window0.tab${TAB_IDX}.focused = "FALSE"
EOF

    log "[OK]   VM registrada como tab${TAB_IDX}."
fi

# =============================
# REGISTRAR NA LIBRARY (inventory.vmls)
# =============================

if [ -f "$INVENTORY_FILE" ] && grep -qF "$DEST_VMX" "$INVENTORY_FILE"; then
    log "[SKIP] VM já presente em inventory.vmls — nada a fazer."
else
    log "[INVENTORY] Registrando VM na Library do VMware ..."

    # Criar arquivo se não existir
    if [ ! -f "$INVENTORY_FILE" ]; then
        sudo -u "$CURRENT_USER" tee "$INVENTORY_FILE" > /dev/null <<'ENDINV'
.encoding = "UTF-8"
inventory.count = "0"
ENDINV
        chown "${CURRENT_USER}:${CURRENT_USER}" "$INVENTORY_FILE"
    fi

    # Ler índice atual
    CURRENT_COUNT=$(grep -oP '(?<=inventory\.count = ")[0-9]+' "$INVENTORY_FILE" || echo "0")
    NEW_COUNT=$(( CURRENT_COUNT + 1 ))
    ITEM_IDX=$CURRENT_COUNT

    # Gerar UID no formato VMware
    VM_UID="{$(uuidgen | tr '[:lower:]' '[:upper:]')}"

    # Atualizar inventory.count
    sed -i "s/^inventory\.count = \"[0-9]*\"/inventory.count = \"${NEW_COUNT}\"/" "$INVENTORY_FILE"
    chown "${CURRENT_USER}:${CURRENT_USER}" "$INVENTORY_FILE"

    # Adicionar entrada da VM
    sudo -u "$CURRENT_USER" tee -a "$INVENTORY_FILE" > /dev/null <<EOF

item${ITEM_IDX}.path = "${DEST_VMX}"
item${ITEM_IDX}.type = "VirtualMachine"
item${ITEM_IDX}.uid = "${VM_UID}"
EOF

    log "[OK]   VM adicionada à Library como item${ITEM_IDX} (uid=${VM_UID})."
fi

log "=========================================="
log "[INFO] Importação concluída. Log: $LOG"
log "=========================================="

# =============================
# INICIAR VM E OBTER IP
# =============================

log "[VM] Ligando a VM: $DEST_VMX ..."
vmrun -T ws start "$DEST_VMX" nogui

log "[VM] Aguardando inicialização (10s) ..."
sleep 10

log "[VM] Obtendo IP da VM ..."
VM_IP=$(vmrun -T ws getGuestIPAddress "$DEST_VMX" -wait 2>/dev/null | tr -d '[:space:]')

if [ -z "$VM_IP" ]; then
    log "[ERRO] Não foi possível obter o IP da VM. Verifique se o VMware Tools está instalado."
    exit 1
fi

log "[OK]   IP da VM EVE-NG: $VM_IP"

log "[CHROME] Abrindo EVE-NG no Chrome: http://$VM_IP ..."
sudo -u "$CURRENT_USER" DISPLAY=:0 google-chrome --new-tab "http://${VM_IP}" &

log "=========================================="
