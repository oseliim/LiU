"""
Rotas de gerenciamento de máquinas
"""
from flask import Blueprint, jsonify, request
from services.machine_service import MachineService
from services.network_service import NetworkService
from utils.helpers import get_script_path, create_response

machines_bp = Blueprint('machines', __name__)
machine_service = MachineService()
network_service = NetworkService()

@machines_bp.route('/status', methods=['GET'])
def get_machines_status():
    """Retorna status de todas as máquinas"""
    try:
        machines = machine_service.get_all_machines_status()
        online_count = sum(1 for m in machines if m.get('status') == 'online')
        
        return jsonify(create_response(data={
            'machines': machines,
            'total': len(machines),
            'online': online_count,
            'offline': len(machines) - online_count
        }))
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

@machines_bp.route('/<ip>/status', methods=['GET'])
def get_machine_status(ip):
    """Status de uma máquina específica"""
    try:
        status = machine_service.get_machine_status(ip)
        if 'error' in status:
            return jsonify(create_response(error=status['error'], status=400)), 400
        return jsonify(create_response(data=status))
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

@machines_bp.route('/setup-range', methods=['POST'])
def setup_ip_range():
    """Configura faixa de IPs do laboratório"""
    data = request.get_json()
    
    if not data or 'range' not in data:
        return jsonify(create_response(error='Faixa de IPs não fornecida', status=400)), 400
    
    ip_range = data['range']
    result = machine_service.setup_ip_range(ip_range)
    
    if 'error' in result:
        return jsonify(create_response(error=result['error'], status=400)), 400
    
    return jsonify(create_response(data=result, message='Faixa de IPs configurada com sucesso'))

@machines_bp.route('/turn-on', methods=['POST'])
def turn_on_machines():
    """Liga máquinas"""
    data = request.get_json() or {}
    ips = data.get('ips', [])
    
    result = machine_service.turn_on_machines(ips if ips else None)
    
    if 'error' in result:
        return jsonify(create_response(error=result['error'], status=500)), 500
    
    return jsonify(create_response(data=result))

@machines_bp.route('/turn-off', methods=['POST'])
def turn_off_machines():
    """Desliga máquinas"""
    data = request.get_json() or {}
    ips = data.get('ips', [])
    
    result = machine_service.turn_off_machines(ips if ips else None)
    
    if 'error' in result:
        return jsonify(create_response(error=result['error'], status=500)), 500
    
    return jsonify(create_response(data=result))

@machines_bp.route('/<ip>/turn-off', methods=['POST'])
def turn_off_one(ip):
    """Desliga uma máquina específica"""
    result = machine_service.turn_off_one(ip)
    
    if 'error' in result:
        return jsonify(create_response(error=result['error'], status=400)), 400
    
    return jsonify(create_response(data=result))

@machines_bp.route('/internet/turn-on', methods=['POST'])
def turn_on_internet():
    """Liga internet"""
    ip_file = get_script_path('maquinas')
    result = network_service.turn_on_internet(ip_file)
    
    if 'error' in result:
        return jsonify(create_response(error=result['error'], status=500)), 500
    
    return jsonify(create_response(data=result))

@machines_bp.route('/internet/turn-off', methods=['POST'])
def turn_off_internet():
    """Desliga internet"""
    ip_file = get_script_path('maquinas')
    result = network_service.turn_off_internet(ip_file)
    
    if 'error' in result:
        return jsonify(create_response(error=result['error'], status=500)), 500
    
    return jsonify(create_response(data=result))

