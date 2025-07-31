from flask import Flask, render_template, request, Response, jsonify, stream_with_context
import subprocess
import os
import logging
import psutil
import re

# Importando os módulos personalizados
import get_cpu_info
import get_mem_info
import get_disk_info
import get_network_info

app = Flask(__name__)
app.logger.setLevel(logging.INFO)

try:
    os.system('pip3 install py-cpuinfo')
    import cpuinfo
except ImportError:
    cpuinfo = None

# Configuração dos caminhos dos scripts
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
TURN_ON_SCRIPT = os.path.join(BASE_DIR, "scripts", "liga.sh")
TURN_OFF_SCRIPT = os.path.join(BASE_DIR, "scripts", "desliga.sh")
TURN_OFF_ONE_SCRIPT = os.path.join(BASE_DIR, "scripts", "desliga_um.sh")
EX_SCRIPT = os.path.join(BASE_DIR, "scripts", "ex1.sh")
IP_FILE = os.path.join(BASE_DIR, "scripts", "maquinas")
MAC_FILE = os.path.join(BASE_DIR, "scripts", "mac_maquinas")
PING_FILE = os.path.join(BASE_DIR, "scripts", "ping.sh")

# Configurando variáveis globais
last_net_io = psutil.net_io_counters()

# --- FUNÇÕES AUXILIARES ---


# --- ROTAS DA APLICAÇÃO ---

@app.route('/')
def index():
    return render_template('index.html')

# <-- NOVA ROTA para configurar a faixa de IPs e rodar o scanner -->
@app.route('/setup-range', methods=['POST'])
def setup_range():
    data = request.get_json()
    if not data or 'range' not in data:
        return jsonify({"error": "Nenhuma faixa de IP fornecida."}), 400
    
    dhcp_range = data['range']
    
    try:
        app.logger.info(f"Recebida nova faixa de IPs: {dhcp_range}")
        app.logger.info(f"Gerando arquivo '{os.path.basename(IP_FILE)}'...")
        
        start_ip_str, end_ip_str = dhcp_range.split(' - ')
        ip_parts = start_ip_str.split('.')
        ip_base = '.'.join(ip_parts[0:3])
        start_octet = int(ip_parts[3])
        end_octet = int(end_ip_str.split('.')[3])

        with open(IP_FILE, 'w') as f:
            for i in range(start_octet, end_octet + 1):
                ip_address = f"{ip_base}.{i}"
                f.write(ip_address + '\n')

        app.logger.info(f"Arquivo '{os.path.basename(IP_FILE)}' criado com sucesso.")

        return jsonify({"status": "success", "message": "Laboratório configurado."})

    except Exception as e:
        app.logger.error(f"Erro crítico durante a configuração da faixa: {e}")
        return jsonify({"error": f"Erro interno do servidor: {e}"}), 500


def stream_script_output(command, success_msg, error_msg):
    # ... (código existente sem alterações)
    """Função para executar scripts e streamar a saída em tempo real"""
    app.logger.info(f"Executando comando: {' '.join(command)}")
    
    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
        universal_newlines=True,
        cwd=BASE_DIR
    )
    
    yield "<p>Iniciando execução do script...</p>"
    
    # Stream da saída padrão
    for line in process.stdout:
        app.logger.info(f"STDOUT: {line.strip()}")
        yield f"<p>{line.strip()}</p>"
    
    # Stream dos erros
    for line in process.stderr:
        app.logger.error(f"STDERR: {line.strip()}")
        yield f"<p style='color:red;'>{line.strip()}</p>"
    
    process.wait()
    
    # Mensagem final baseada no código de retorno
    if process.returncode == 0:
        yield f"<p style='color:green;'>{success_msg}</p>"
    else:
        yield f"<p style='color:red;'>{error_msg} (Código: {process.returncode})</p>"

def run_ping_script():
    # ... (código existente sem alterações)
    """A generator function that runs the script and yields output line by line."""
    command = ["sudo", "bash", PING_FILE, IP_FILE]
    
    # Use Popen to run the script and capture output in real-time
    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1  # Line-buffered
    )
    

    # Yield each line from stdout as it's generated
    for line in iter(process.stdout.readline, ''):
        # The SSE format requires data to be prefixed with "data: " and end with "\n\n"
        yield f"data: {line.strip()}\n\n"
    
    process.stdout.close()
    # Wait for the process to finish and check for errors
    return_code = process.wait()
    if return_code != 0:
        error_output = process.stderr.read()
        yield f"data: --- SCRIPT ERROR ---\n\n"
        yield f"data: {error_output.strip()}\n\n"

@app.route('/start-monitoring')
def start_monitoring():
    # ... (código existente sem alterações)
    # We return a Response object with the generator and the event-stream mimetype
    return Response(stream_with_context(run_ping_script()), mimetype='text/event-stream')

# ... (Restante das suas rotas /turn_on, /turn_off, etc. permanecem iguais)
@app.route('/turn_on', methods=['POST'])
def turn_on():
    if not os.path.exists(TURN_ON_SCRIPT):
        return Response("<p style='color:red;'>Erro: Script de inicialização não encontrado!</p>", 
                    mimetype='text/html', status=404)
    
    return Response(
        stream_script_output(
            command=["sudo", "bash", TURN_ON_SCRIPT, MAC_FILE],
            success_msg="Laboratório ligado com sucesso!",
            error_msg="Erro ao ligar laboratório"
        ),
        mimetype='text/html'
    )

@app.route('/turn_off', methods=['POST'])
def turn_off():
    if not os.path.exists(TURN_OFF_SCRIPT):
        return Response("<p style='color:red;'>Erro: Script desligamento não encontrado!</p>", 
                    mimetype='text/html', status=404)
    
    return Response(
        stream_script_output(
            command=["sudo", "bash", TURN_OFF_SCRIPT, IP_FILE],
            success_msg="Laboratório desligado com sucesso!",
            error_msg="Erro ao desligar laboratório"
        ),
        mimetype='text/html'
    )

"""@app.route('/turn_on_one', methods=['POST'])
def turn_on_one():
    if not os.path.exists(TURN_ON_SCRIPT):
        return Response("<p style='color:red;'>Erro: Script de inicialização não encontrado!</p>", 
                    mimetype='text/html', status=404)
    
    return Response(
        stream_script_output(
            command=["sudo", "bash", TURN_ON_SCRIPT, "mac_maquinas"],
            success_msg="Laboratório ligado com sucesso!",
            error_msg="Erro ao ligar laboratório"
        ),
        mimetype='text/html'
    )"""

@app.route('/turn_off_one', methods=['POST'])
def turn_off_one():
    data = request.get_json()
    if not data or 'ip' not in data:
        return Response("<p style='color:red;'>Erro: 'ip' não foi fornecido no corpo da requisição.</p>", 
                    mimetype='text/html', status=400)
    
    if not os.path.exists(TURN_OFF_ONE_SCRIPT):
        return Response("<p style='color:red;'>Erro: Script desligamento não encontrado!</p>", 
                    mimetype='text/html', status=404)
    
    ip = data.get('ip')

    return Response(
        stream_script_output(
            command=["sudo", "bash", TURN_OFF_ONE_SCRIPT, ip],
            success_msg=f"Computador {ip} desligado com sucesso!",
            error_msg=f"Erro ao desligar computador {ip}"
        ),
        mimetype='text/html'
    )

@app.route('/execute', methods=['POST'])
def execute_command():
    data = request.get_json()
    if not data or 'executed_command' not in data:
        # Returning a streaming response even for an error is consistent
        def error_stream():
            yield "<p style='color:red;'>Erro: 'executed_command' não foi fornecido no corpo da requisição.</p>"
        return Response(error_stream(), mimetype='text/html', status=400)

    # Get the specific command the user typed
    user_command = data.get('executed_command')

    # Construct the full command as a list for security and correctness
    command_list = ["sudo", "bash", EX_SCRIPT, user_command, IP_FILE]
    
    # Use the existing streaming function to send output to the browser
    return Response(
        stream_script_output(
            command=command_list,
            success_msg=f"Comando '{user_command}' executado com sucesso!",
            error_msg=f"Erro ao executar o comando '{user_command}'"
        ),
        mimetype='text/html'
    )
    
@app.route('/cpu-info', methods=['POST'])
def cpu_info():
    interval = 1.0
    return jsonify(get_cpu_info.get_cpu_info(interval))
    
@app.route('/memory-info', methods=['POST'])
def memory_info():
    return jsonify(get_mem_info.get_memory_info())


@app.route('/disk-info', methods=['POST'])
def disk_info():
    return jsonify(get_disk_info.get_disk_info())

@app.route('/network-info', methods=['POST'])
def network_info():
    global last_net_io
    interval = 1.0
    network_info = get_network_info.get_network_info(last_net_io, interval)
    last_net_io = network_info['current_net_io']
    del network_info['current_net_io']
    return jsonify(network_info)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
