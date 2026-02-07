
"""
Rotas para configuração da aplicação
"""
from flask import Blueprint, jsonify, request
from services.machine_service import MachineService
from models.lab_config import LabConfig
from utils.helpers import create_response

config_bp = Blueprint('config', __name__)
machine_service = MachineService()

@config_bp.route('/', methods=['GET'])
def get_app_config():
    """Retorna a configuração atual do laboratório."""
    try:
        config = machine_service.get_lab_config()
        return jsonify(create_response(data=config))
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

@config_bp.route('/', methods=['POST'])
def update_app_config():
    """Atualiza a configuração do laboratório."""
    data = request.get_json()
    if not data:
        return jsonify(create_response(error='Dados não fornecidos', status=400)), 400

    try:
        lab_name = data.get('lab_name')
        max_devices = data.get('max_devices')
        
        # Atualizar configuração no banco
        if lab_name is not None or max_devices is not None:
            updated_config = LabConfig.update_config(lab_name=lab_name, max_devices=max_devices)
        
        # Obter configuração atualizada
        config = machine_service.get_lab_config()
        
        return jsonify(create_response(data=config, message='Configuração atualizada com sucesso'))
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500
