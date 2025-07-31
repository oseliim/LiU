#!/bin/bash

input_file="../tmp/user_data.txt"
#Diretório do windows baixado
OVA_PATH="/home/shared/Windows.ova"
BASE_VM_NAME="VM"
log="/var/log/ltsp-vm-import.log"

[ ! -f "$OVA_PATH" ] && echo "Arquivo OVA não encontrado em $OVA_PATH" && exit 1

i=0
lines=$(wc -l < "$input_file")

while [ $i -lt $lines ]; do
    ((i++))
    line=$(sed -n "${i}p" "$input_file")
    user=$(echo "$line" | cut -d ':' -f 1 | xargs)
    ip=$(echo "$line" | cut -d ':' -f 2 | xargs)

    if [ -z "$user" ] || [ -z "$ip" ]; then
        echo "[$i/$lines] Linha inválida - pulando" | tee -a "$log"
        continue
    fi

    vm_name="${BASE_VM_NAME}-${user}"
    home_dir="/home/$user"
    vm_dir="${home_dir}/VirtualBox VMs"

    echo "[$i/$lines] Preparando VM $vm_name para o usuário $user" | tee -a "$log"

    # Cria diretório da VM se necessário
    mkdir -p "$vm_dir"
    chown -R "$user:$user" "$vm_dir"

    # Importa a VM como o usuário
    sudo -u "$user" VBoxManage import "$OVA_PATH" --vsys 0 --vmname "$vm_name" --basefolder "$vm_dir"
done