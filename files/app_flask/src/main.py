import sys
import os
import subprocess
from flask import Flask, render_template, jsonify, request, Response

import mac_scanner

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

app = Flask(__name__, template_folder='templates', static_folder='static')

BASE_PROJECT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
NETWORK_DATA_FILE = os.path.join(BASE_PROJECT_DIR, "tmp", "network_data.txt")
DNSMASQ_CONF_SCRIPT = os.path.join(BASE_PROJECT_DIR, "dnsmasq_conf.sh")
USER_CONF_SCRIPT = os.path.join(BASE_PROJECT_DIR, "user_conf.sh")
GERA_XFCE_SCRIPT = os.path.join(BASE_PROJECT_DIR, "gera_xfce.sh")
GERA_GDM_SCRIPT = os.path.join(BASE_PROJECT_DIR, "gera_gdm.sh")
AUTO_INSTALL_SCRIPT = os.path.join(BASE_PROJECT_DIR, "auto_install.sh")
NETWORK_SCRIPT = os.path.join(BASE_PROJECT_DIR, "network.sh")
MONTAR_CONF_SCRIPT = os.path.join(BASE_PROJECT_DIR, "montar_conf.sh")
IPXE_MENU = os.path.join(BASE_PROJECT_DIR, "ipxe_menu.sh")
MAC_FILE = os.path.join(BASE_PROJECT_DIR, "interface_gerencia", "scripts", "mac_maquinas")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/wizard')
def wizard():
    return render_template('wizard.html')

def stream_script_output(command, success_message="Script executado com sucesso!", error_message="Erro na execução do script"):
    app.logger.info(f"Executing command: {' '.join(command)}")
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1, universal_newlines=True, cwd=BASE_PROJECT_DIR)
    yield "<p>Iniciando execução do script...</p>"

    for line in process.stdout:
        app.logger.info(f"STDOUT: {line.strip()}")
        yield f"<p>{line.strip()}</p>"
    for line in process.stderr:
        app.logger.error(f"STDERR: {line.strip()}")
        yield f"<p style='color:red;'>{line.strip()}</p>"
    process.wait()
    app.logger.info(f"Script finished with return code: {process.returncode}")
    if process.returncode == 0:
        yield f"<p style='color:green;'>{success_message} (código de saída: {process.returncode})</p>"
    else:
        yield f"<p style='color:red;'>{error_message} (código de saída: {process.returncode}).</p>"

def parse_network_data(content):
    data = {
        "interface": None,
        "ip_address": None,
        "netmask": None,
        "gateway": None,
        "dns_servers": [],
        "dhcp_range_start": None,
        "dhcp_range_end": None,
        "error": None
    }
    try:
        lines = content.splitlines()
        for i, line in enumerate(lines):
            line_stripped = line.strip()
            if "Interface ativa principal (via rota padrão):" in line:
                data["interface"] = line.split(":", 1)[1].strip()
            elif line_stripped.startswith("Interface:") and not data["interface"]:
                data["interface"] = line_stripped.split(":", 1)[1].strip()
            elif line_stripped.startswith("IP Address (com CIDR):"):
                value = line_stripped.split(":", 1)[1].strip()
                if "Nenhum endereço IPv4" not in value:
                    ip_cidr = value.split('/')[0]
                    data["ip_address"] = ip_cidr
                    if ip_cidr:
                        ip_parts = ip_cidr.split('.')
                        if len(ip_parts) == 4:
                            prefix = ".".join(ip_parts[:3])
                            data["dhcp_range_start"] = f"{prefix}.100"
                            data["dhcp_range_end"] = f"{prefix}.150"
            elif line_stripped.startswith("Netmask:"):
                value = line_stripped.split(":", 1)[1].strip()
                if value != "N/A":
                    data["netmask"] = value
            elif line_stripped.startswith("Gateway:"):
                value = line_stripped.split(":", 1)[1].strip()
                if value != "Não encontrado" and value != "N/A":
                    data["gateway"] = value
            elif line_stripped.startswith("- ") and i > 0 and ("DNS (" in lines[i-1] or "DNS (" in lines[i-2]):
                dns = line_stripped.split("- ", 1)[1].strip()
                if dns and dns not in data["dns_servers"]:
                    data["dns_servers"].append(dns)
        if not all([data["interface"], data["ip_address"], data["netmask"]]):
            data["error"] = "Não foi possível extrair todas as informações de rede necessárias (Interface, IP, Máscara). Verifique o arquivo network_data.txt ou execute a coleta novamente."
            app.logger.warning(f"Parsing network_data.txt incomplete: {data}")

    except Exception as e:
        app.logger.error(f"Error parsing network_data.txt: {str(e)}")
        data["error"] = f"Erro ao processar dados de rede: {str(e)}"
    return data

def update_network_data_file(network_config):
    """
    Atualiza o arquivo network_data.txt com as configurações de rede editadas pelo usuário
    """
    try:
        # Verificar se o arquivo existe
        if not os.path.exists(NETWORK_DATA_FILE):
            # Criar diretório tmp se não existir
            os.makedirs(os.path.dirname(NETWORK_DATA_FILE), exist_ok=True)
            
            # Criar arquivo com conteúdo básico
            with open(NETWORK_DATA_FILE, 'w') as f:
                f.write(f"Interface ativa principal (via rota padrão): {network_config.get('interface', 'N/A')}\n")
                f.write(f"IP Address (com CIDR): {network_config.get('serverIp', 'N/A')}\n")
                f.write(f"Netmask: {network_config.get('netmask', 'N/A')}\n")
                f.write(f"Gateway: {network_config.get('gateway', 'N/A')}\n")
                f.write(f"DNS (configurado): \n")
                f.write(f"- {network_config.get('dnsServer', 'N/A')}\n")
                f.write(f"DHCP Range: {network_config.get('dhcpRangeStart', 'N/A')} - {network_config.get('dhcpRangeEnd', 'N/A')}\n")
            return True
        
        # Ler o arquivo existente
        with open(NETWORK_DATA_FILE, 'r') as f:
            lines = f.readlines()
        
        # Atualizar as linhas com os novos valores
        updated_lines = []
        for line in lines:
            if "Interface ativa principal (via rota padrão):" in line and network_config.get('interface'):
                updated_lines.append(f"Interface ativa principal (via rota padrão): {network_config.get('interface')}\n")
            elif line.strip().startswith("Interface:") and network_config.get('interface'):
                updated_lines.append(f"Interface: {network_config.get('interface')}\n")
            elif line.strip().startswith("IP Address (com CIDR):") and network_config.get('serverIp'):
                updated_lines.append(f"IP Address (com CIDR): {network_config.get('serverIp')}\n")
            elif line.strip().startswith("Netmask:") and network_config.get('netmask'):
                updated_lines.append(f"Netmask: {network_config.get('netmask')}\n")
            elif line.strip().startswith("Gateway:") and network_config.get('gateway'):
                updated_lines.append(f"Gateway: {network_config.get('gateway')}\n")
            elif line.strip().startswith("- ") and "DNS (" in lines[lines.index(line)-1] and network_config.get('dnsServer'):
                updated_lines.append(f"- {network_config.get('dnsServer')}\n")
            else:
                updated_lines.append(line)
        
        # Escrever as linhas atualizadas de volta ao arquivo
        with open(NETWORK_DATA_FILE, 'w') as f:
            f.writelines(updated_lines)
        
        return True
    except Exception as e:
        app.logger.error(f"Error updating network_data.txt: {str(e)}")
        return False

@app.route('/get_parsed_network_data', methods=['GET'])
def get_parsed_network_data():
    app.logger.info(f"Tentando ler o arquivo de dados de rede em: {NETWORK_DATA_FILE}")
    if not os.path.exists(NETWORK_DATA_FILE):
        app.logger.error(f"Arquivo network_data.txt não encontrado em {NETWORK_DATA_FILE}.")
        return jsonify({"error": f"Arquivo network_data.txt não encontrado em {NETWORK_DATA_FILE}. Execute a coleta de informações de rede primeiro."}), 404
    try:
        with open(NETWORK_DATA_FILE, 'r') as f:
            content = f.read()
        parsed_data = parse_network_data(content)
        if parsed_data.get("error") and not all([parsed_data["interface"], parsed_data["ip_address"], parsed_data["netmask"]]):
            return jsonify(parsed_data), 500
        return jsonify(parsed_data)
    except Exception as e:
        app.logger.error(f"Error in get_parsed_network_data: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/run_montar_conf', methods=['POST'])
def run_montar_conf():
    """
    Executa o script montar_conf.sh com os usuários fornecidos
    Espera um JSON:
    {
        "users": [
            {"username": "user1", "password": "pass1"},
            {"username": "user2", "password": "pass2"}
        ]
    }
    """
    data = request.get_json()
    users = data.get('users', [])
    
    if not users:
        return Response("<p style='color:red;'>Erro: Nenhum usuário fornecido.</p>", mimetype='text/html', status=400)
    
    # Extrair apenas os nomes de usuário
    usernames = [user.get('username') for user in users if user.get('username')]
    
    if not usernames:
        return Response("<p style='color:red;'>Erro: Nenhum nome de usuário válido encontrado.</p>", mimetype='text/html', status=400)
    
    # Construir o comando
    command = ["sudo", "bash", MONTAR_CONF_SCRIPT] + usernames
    
    app.logger.info(f"Executando configuração LTSP para usuários: {usernames}")
    return Response(stream_script_output(command, success_message="Configuração LTSP para usuários concluída com sucesso!"), mimetype='text/html')

@app.route('/run_auto_install', methods=['POST'])
def run_auto_install():
    if not os.path.exists(AUTO_INSTALL_SCRIPT):
        return Response(f"<p style='color:red;'>Erro: Script auto_install.sh não encontrado em {AUTO_INSTALL_SCRIPT}</p>", mimetype='text/html', status=404)
    command = ["sudo", "bash", AUTO_INSTALL_SCRIPT]
    return Response(stream_script_output(command, success_message="Instalação do LTSP concluída com sucesso!"), mimetype='text/html')
    mac_scanner.run_mac_scanner(MAC_FILE, app.logger)

@app.route('/run_network_info', methods=['POST'])
def run_network_info():
    if not os.path.exists(NETWORK_SCRIPT):
        return Response(f"<p style='color:red;'>Erro: Script network.sh não encontrado em {NETWORK_SCRIPT}</p>", mimetype='text/html', status=404)
    command = ["bash", NETWORK_SCRIPT]
    return Response(stream_script_output(command, success_message="Coleta de informações de rede concluída."), mimetype='text/html')

@app.route('/save_network_config', methods=['POST'])
def save_network_config():
    """
    Salva as configurações de rede editadas pelo usuário
    """
    data = request.get_json()
    app.logger.info(f"Received network configuration: {data}")
    
    network_config = data.get('network', {})
    
    # Validar dados mínimos necessários
    if not all([network_config.get('serverIp'), network_config.get('netmask'), network_config.get('dhcpRange')]):
        return jsonify({"error": "Dados de rede incompletos. IP, máscara e faixa DHCP são obrigatórios."}), 400
    
    # Extrair início e fim da faixa DHCP
    dhcp_range = network_config.get('dhcpRange', '')
    range_parts = dhcp_range.split('-')
    if len(range_parts) == 2:
        network_config['dhcpRangeStart'] = range_parts[0].strip()
        network_config['dhcpRangeEnd'] = range_parts[1].strip()
    
    # Atualizar o arquivo network_data.txt com as configurações editadas
    if update_network_data_file(network_config):
        return jsonify({"success": True, "message": "Configurações de rede salvas com sucesso"})
    else:
        return jsonify({"error": "Falha ao salvar configurações de rede no arquivo"}), 500
@app.route('/run_all_configurations', methods=['POST'])
def run_all_configurations():
    """
    Espera um JSON com as configurações de rede, imagem e usuários para executar
    todas as etapas de configuração do servidor LTSP de forma sequencial.
    """
    data = request.get_json()
    app.logger.info(f"Received data for configuration: {data}")

    # Validar dados mínimos
    if not data.get('users') or len(data.get('users', [])) == 0:
        return Response("<p style='color:red;'>Erro: Nenhum usuário fornecido.</p>", mimetype='text/html', status=400)

    # Extrair configurações
    network_config = data.get('network', {})
    image_config = data.get('image', {})
    users = data.get('users', [])
    
    # Atualizar o arquivo network_data.txt com as configurações de rede
    update_network_data_file(network_config)
    
    # Configurações da imagem
    ubuntu_version = image_config.get('version', 'jammy')
    desktop_env = image_config.get('desktopEnvironment', 'xfce')
    hide_users = image_config.get('hideUsers', False)
    autologin = image_config.get('autologin', False)
    additional_packages = image_config.get('additionalPackages', '')

    # Criando o arquivo com as aplicações adicionais, se necessário
    if additional_packages:
        additional_packages_file = os.path.join(BASE_PROJECT_DIR, "tmp", "additional_packages.txt")
        with open(additional_packages_file, 'w', encoding='utf-8') as f:
            for package in additional_packages:
                f.write(f"{package.strip()}\n")
        app.logger.info(f"Additional packages saved to {additional_packages_file}")
    else:
        additional_packages_file = None

    windows_selected = 'windows' in image_config.get('version', '').lower()
    if windows_selected:
        image_script_path = os.path.join(BASE_PROJECT_DIR, "gera_windows.sh")
    else:
        image_script_path = GERA_GDM_SCRIPT if desktop_env == 'gdm' else GERA_XFCE_SCRIPT
    
    dnsmasq_command = ["sudo", "bash", DNSMASQ_CONF_SCRIPT]
    if network_config.get('dhcpRangeStart') and network_config.get('dhcpRangeEnd'):
        dnsmasq_command.extend([
            network_config.get('dhcpRangeStart'),
            network_config.get('dhcpRangeEnd')
        ])
    if network_config.get('dnsServer'):
        dnsmasq_command.append(network_config.get('dnsServer'))
    
    image_command = ["sudo", "bash", image_script_path, ubuntu_version]

    # Execução sequencial sem streaming, checando retorno de cada etapa
    result = {
        "dnsmasq": None,
        "users": [],
        "montar_conf": None,
        "image": None,
        "ipxe": None,
        "success": False,
        "error": None
    }
    # 1. DNSMASQ CONFIG
    try:
        app.logger.info(f"Executing dnsmasq config: {' '.join(dnsmasq_command)}")
        proc_dnsmasq = subprocess.run(dnsmasq_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd=BASE_PROJECT_DIR)
        result["dnsmasq"] = {
            "returncode": proc_dnsmasq.returncode,
            "stdout": proc_dnsmasq.stdout,
            "stderr": proc_dnsmasq.stderr
        }
        if proc_dnsmasq.returncode != 0:
            result["error"] = f"Falha na configuração do dnsmasq. Código: {proc_dnsmasq.returncode}"
            return jsonify(result), 500
    except Exception as e:
        result["error"] = f"Erro inesperado na configuração do dnsmasq: {e}"
        return jsonify(result), 500

    # 2. USER CONFIG
    created_usernames = []
    for i, user in enumerate(users):
        username, password = user.get('username'), user.get('password')
        if not username or not password:
            result["users"].append({"username": username, "status": "incomplete"})
            continue
        user_conf_command = ["sudo", "bash", USER_CONF_SCRIPT, username, password]
        app.logger.info(f"Executing user configuration: {' '.join(user_conf_command)}")
        proc_user = subprocess.run(user_conf_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd=BASE_PROJECT_DIR)
        user_status = {
            "username": username,
            "returncode": proc_user.returncode,
            "stdout": proc_user.stdout,
            "stderr": proc_user.stderr
        }
        if proc_user.returncode == 0:
            user_status["status"] = "success"
            created_usernames.append(username)
        else:
            user_status["status"] = "fail"
        result["users"].append(user_status)

    # 2.5. MONTAR_CONF
    # Removido: chamada redundante ao montar_conf.sh, pois user_conf.sh já executa essa configuração.

    # 3. IMAGE GENERATION
    try:
        app.logger.info(f"Executing image generation: {' '.join(image_command)}")
        proc_image = subprocess.run(image_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd=BASE_PROJECT_DIR)
        result["image"] = {
            "returncode": proc_image.returncode,
            "stdout": proc_image.stdout,
            "stderr": proc_image.stderr
        }
        if proc_image.returncode != 0:
            result["error"] = f"Falha na geração da imagem. Código: {proc_image.returncode}"
            return jsonify(result), 500
    except Exception as e:
        result["error"] = f"Erro inesperado na geração da imagem: {e}"
        return jsonify(result), 500

    # 4. iPXE MENU EXECUÇÃO
    if not os.path.isfile(IPXE_MENU):
        result["ipxe"] = {"error": f"Arquivo IPXE_MENU não encontrado: {IPXE_MENU}"}
        result["error"] = result["ipxe"]["error"]
        return jsonify(result), 500
    else:
        image_name = f"ubuntu{desktop_env}_{ubuntu_version}"
        ipxe_command = ["sudo", "bash", IPXE_MENU, image_name]
        try:
            proc_ipxe = subprocess.run(ipxe_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd=BASE_PROJECT_DIR)
            result["ipxe"] = {
                "returncode": proc_ipxe.returncode,
                "stdout": proc_ipxe.stdout,
                "stderr": proc_ipxe.stderr
            }
            if proc_ipxe.returncode != 0:
                result["error"] = f"Erro ao executar iPXE menu. Código: {proc_ipxe.returncode}"
                return jsonify(result), 500
        except Exception as e:
            result["ipxe"] = {"error": f"Erro inesperado ao executar iPXE menu: {e}"}
            result["error"] = result["ipxe"]["error"]
            return jsonify(result), 500

    result["success"] = True
    # Quando tudo executa, retorna para a tela de execução (front-end pode redirecionar)
    return jsonify(result), 200
if __name__ == '__main__':
    import logging
    logging.basicConfig(level=logging.INFO)
    app.logger.info(f"BASE_PROJECT_DIR: {BASE_PROJECT_DIR}")
    app.logger.info(f"AUTO_INSTALL_SCRIPT path: {AUTO_INSTALL_SCRIPT}")
    app.logger.info(f"DNSMASQ_CONF_SCRIPT path: {DNSMASQ_CONF_SCRIPT}")
    app.logger.info(f"USER_CONF_SCRIPT path: {USER_CONF_SCRIPT}")
    app.logger.info(f"GERA_XFCE_SCRIPT path: {GERA_XFCE_SCRIPT}")
    app.logger.info(f"GERA_GDM_SCRIPT path: {GERA_GDM_SCRIPT}")
    app.logger.info(f"NETWORK_SCRIPT path: {NETWORK_SCRIPT}")
    app.logger.info(f"NETWORK_DATA_FILE path: {NETWORK_DATA_FILE}")
    app.run(host='0.0.0.0', port=5001, debug=True)