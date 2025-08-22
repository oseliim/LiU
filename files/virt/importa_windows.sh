#!/bin/bash

input_file="../tmp/user_data.txt"
QCOW2_PATH="/home/shared/windows.qcow2"
BASE_VM_NAME="VM"
log="/var/log/ltsp-vm-import.log"

[ ! -f "$QCOW2_PATH" ] && echo "❌ Arquivo QCOW2 não encontrado em $QCOW2_PATH" && exit 1
[ ! -f "$input_file" ] && echo "❌ Arquivo de entrada não encontrado: $input_file" && exit 1

i=0
lines=$(wc -l < "$input_file")

while [ $i -lt $lines ]; do
    ((i++))
    line=$(sed -n "${i}p" "$input_file")
    user=$(echo "$line" | cut -d ':' -f 1 | xargs)

    if [ -z "$user" ]; then
        echo "[$i/$lines] ⚠️ Linha inválida - pulando" | tee -a "$log"
        continue
    fi

    if ! id "$user" &>/dev/null; then
        echo "[$i/$lines] ❌ Usuário $user não existe - pulando" | tee -a "$log"
        continue
    fi

    vm_name="${BASE_VM_NAME}-${user}"
    home_dir="/home/$user"
    vm_dir="${home_dir}/VMs"
    vm_disk="${vm_dir}/${vm_name}.qcow2"

    echo "[$i/$lines] 🛠️ Preparando VM $vm_name para o usuário $user" | tee -a "$log"

    #Adiciona usuário no grupo dos mecanismos de virtualizacao
    usermod -aG kvm,libvirt $user

    mkdir -p "$vm_dir"
    chown "$user:$user" "$vm_dir"

    if [ -f "$vm_disk" ]; then
        echo "[$i/$lines] ⚠️ Disco $vm_disk já existe - pulando cópia" | tee -a "$log"
    else
        cp "$QCOW2_PATH" "$vm_disk"
        chown "$user:$user" "$vm_disk"
    fi

    # Verifica se a VM já existe
    if sudo -u "$user" virsh --connect qemu:///session list --all | grep -q "$vm_name"; then
        echo "[$i/$lines] ⚠️ VM $vm_name já registrada - pulando criação" | tee -a "$log"
        continue
    fi

    # Registra a VM no libvirt da sessão do usuário
    sudo -u "$user" virt-install --print-xml\
        --connect qemu:///session \
        --name "$vm_name" \
        --memory 4096 \
        --vcpus 4 \
        --disk path="$vm_disk",format=qcow2 \
        --os-variant win10 \
        --import \
        --graphics spice \
        --sound hw:ich9 \
        --noautoconsole \
        --network network=default

    echo "[$i/$lines] ✅ VM $vm_name criada para $user" | tee -a "$log"
done