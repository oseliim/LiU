"""
Rotas de monitoramento do servidor
"""
from flask import Blueprint, jsonify, request
from services.monitoring_service import MonitoringService
from utils.helpers import create_response

monitoring_bp = Blueprint('monitoring', __name__)
monitoring_service = MonitoringService()

@monitoring_bp.route('/cpu', methods=['GET', 'POST'])
def get_cpu_info():
    """Retorna informações da CPU"""
    try:
        interval = float(request.args.get('interval', 1.0))
        cpu_info = monitoring_service.get_cpu_info(interval)
        return jsonify(create_response(data=cpu_info))
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

@monitoring_bp.route('/memory', methods=['GET', 'POST'])
def get_memory_info():
    """Retorna informações de memória"""
    try:
        memory_info = monitoring_service.get_memory_info()
        return jsonify(create_response(data=memory_info))
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

@monitoring_bp.route('/disk', methods=['GET', 'POST'])
def get_disk_info():
    """Retorna informações de disco"""
    try:
        disk_info = monitoring_service.get_disk_info()
        return jsonify(create_response(data=disk_info))
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

@monitoring_bp.route('/network', methods=['GET', 'POST'])
def get_network_info():
    """Retorna informações de rede"""
    try:
        interval = float(request.args.get('interval', 1.0))
        network_info = monitoring_service.get_network_info(interval)
        return jsonify(create_response(data=network_info))
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

@monitoring_bp.route('/system', methods=['GET'])
def get_system_info():
    """Retorna informações do sistema"""
    try:
        system_info = monitoring_service.get_system_info()
        return jsonify(create_response(data=system_info))
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

@monitoring_bp.route('/all', methods=['GET', 'POST'])
def get_all_metrics():
    """Retorna todas as métricas"""
    try:
        interval = float(request.args.get('interval', 1.0))
        all_metrics = monitoring_service.get_all_metrics(interval)
        return jsonify(create_response(data=all_metrics))
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

