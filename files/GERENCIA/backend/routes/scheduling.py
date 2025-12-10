"""
Rotas de agendamento (Cron)
"""
from flask import Blueprint, jsonify, request
import subprocess
import os
from utils.helpers import get_script_path, create_response
from utils.validators import validate_cron_expression

scheduling_bp = Blueprint('scheduling', __name__)

@scheduling_bp.route('/schedule', methods=['POST'])
def schedule_action():
    """Agenda uma ação (ligar/desligar laboratório)"""
    data = request.get_json()
    
    if not data or 'action' not in data or 'cron_expression' not in data:
        return jsonify(create_response(error='Ação e expressão cron são obrigatórias', status=400)), 400
    
    action = data['action']
    cron_expression = data['cron_expression']
    
    if action not in ['turn_on', 'turn_off']:
        return jsonify(create_response(error='Ação inválida. Use turn_on ou turn_off', status=400)), 400
    
    if not validate_cron_expression(cron_expression):
        return jsonify(create_response(error='Expressão cron inválida', status=400)), 400
    
    crontab_script = get_script_path('crontab.sh')
    
    if not os.path.exists(crontab_script):
        return jsonify(create_response(error='Script de crontab não encontrado', status=404)), 404
    
    try:
        result = subprocess.run(
            ['sudo', 'bash', crontab_script, '--action', action, '--cron', cron_expression],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            return jsonify(create_response(
                data={'action': action, 'cron': cron_expression},
                message='Ação agendada com sucesso'
            ))
        else:
            return jsonify(create_response(error=result.stderr, status=500)), 500
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

@scheduling_bp.route('/list', methods=['GET'])
def list_schedules():
    """Lista todos os agendamentos ativos"""
    import platform
    
    # Verificar se estamos no Windows (crontab não está disponível)
    if platform.system() == 'Windows':
        return jsonify(create_response(
            data={'schedules': []},
            message='Agendamento via crontab não está disponível no Windows. Use o Task Scheduler do Windows.'
        ))
    
    try:
        result = subprocess.run(
            ['crontab', '-l'],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        cron_jobs = []
        # Se crontab não existe ou está vazio, retorna lista vazia
        if result.returncode == 0 and result.stdout.strip():
            for line in result.stdout.strip().split('\n'):
                if line.strip() and not line.startswith('#'):
                    parts = line.split()
                    if len(parts) >= 6:
                        command = ' '.join(parts[5:])
                        cron_jobs.append({
                            'minute': parts[0],
                            'hour': parts[1],
                            'day': parts[2],
                            'month': parts[3],
                            'weekday': parts[4],
                            'command': command,
                            'cron_expression': f"{parts[0]} {parts[1]} {parts[2]} {parts[3]} {parts[4]}"
                        })
        # Se crontab não existe (returncode != 0), retorna lista vazia (não é erro)
        elif result.returncode != 0:
            # Crontab não existe ainda - não é um erro, apenas não há agendamentos
            pass
        
        return jsonify(create_response(data={'schedules': cron_jobs}))
    except FileNotFoundError:
        # Comando crontab não encontrado
        return jsonify(create_response(
            data={'schedules': []},
            message='Comando crontab não encontrado. Certifique-se de que está em um sistema Linux/Unix.'
        ))
    except subprocess.TimeoutExpired:
        return jsonify(create_response(
            error='Timeout ao ler crontab',
            status=500
        )), 500
    except Exception as e:
        import traceback
        error_msg = f"Erro ao listar agendamentos: {str(e)}"
        return jsonify(create_response(error=error_msg, status=500)), 500

@scheduling_bp.route('/remove', methods=['POST'])
def remove_schedule():
    """Remove um agendamento"""
    data = request.get_json()
    
    if not data or 'command' not in data:
        return jsonify(create_response(error='Comando é obrigatório', status=400)), 400
    
    command_to_remove = data['command']
    edit_script = get_script_path('edit_crontab.sh')
    
    if not os.path.exists(edit_script):
        return jsonify(create_response(error='Script de edição não encontrado', status=404)), 404
    
    try:
        # Obter crontab atual
        result = subprocess.run(
            ['crontab', '-l'],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            return jsonify(create_response(error='Erro ao ler crontab', status=500)), 500
        
        cron_lines = result.stdout.strip().split('\n')
        line_number = None
        
        for i, line in enumerate(cron_lines, 1):
            if command_to_remove in line and not line.lstrip().startswith('#'):
                line_number = i
                break
        
        if line_number is None:
            return jsonify(create_response(error='Agendamento não encontrado', status=404)), 404
        
        # Remover linha
        result = subprocess.run(
            ['bash', edit_script, '--line', str(line_number)],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            return jsonify(create_response(message='Agendamento removido com sucesso'))
        else:
            return jsonify(create_response(error=result.stderr, status=500)), 500
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

