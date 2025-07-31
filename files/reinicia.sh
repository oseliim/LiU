#!/bin/bash

echo "[INFO] Reiniciando serviços do LTSP..."

# Função auxiliar para reiniciar serviços e comandos com verificação de sucesso
restart_service() {
    local name="$1"
    local cmd="$2"

    echo -n "  -> Reiniciando ${name}... "
    if eval "$cmd" &> /dev/null; then
        echo "OK"
    else
        echo "FALHOU"
        exit 1
    fi
}

# Lista de serviços e comandos essenciais
restart_service "NetworkManager" "systemctl restart NetworkManager"
restart_service "LTSP iPXE"        "ltsp ipxe"
restart_service "LTSP initrd"      "ltsp initrd"
restart_service "LTSP NFS"         "ltsp nfs"
restart_service "LTSP daemon"      "systemctl restart ltsp"
restart_service "dnsmasq"          "systemctl restart dnsmasq"

echo "[INFO] Todos os serviços foram reiniciados com sucesso."
