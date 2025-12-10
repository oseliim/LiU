"""
Rotas de execução de comandos
"""
from flask import Blueprint, Response, request, jsonify
from services.command_service import CommandService
from utils.helpers import get_script_path, create_response

commands_bp = Blueprint('commands', __name__)
command_service = CommandService()

@commands_bp.route('/execute', methods=['POST'])
def execute_command():
    """Executa comando em todas as máquinas"""
    data = request.get_json()
    
    if not data or 'command' not in data:
        return jsonify(create_response(error='Comando não fornecido', status=400)), 400
    
    command = data['command']
    ip_file = get_script_path('maquinas')
    
    def generate():
        for output in command_service.execute_command(command, ip_file):
            yield f"data: {output}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')

@commands_bp.route('/execute-one', methods=['POST'])
def execute_command_one():
    """Executa comando em uma máquina específica"""
    data = request.get_json()
    
    if not data or 'command' not in data or 'ip' not in data:
        return jsonify(create_response(error='Comando ou IP não fornecido', status=400)), 400
    
    command = data['command']
    ip = data['ip']
    
    def generate():
        for output in command_service.execute_command_one(command, ip):
            yield f"data: {output}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')

@commands_bp.route('/allowed', methods=['GET'])
def get_allowed_commands():
    """Retorna lista de comandos permitidos"""
    commands = command_service.get_allowed_commands()
    return jsonify(create_response(data={'commands': commands}))

