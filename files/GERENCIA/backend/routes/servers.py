"""
Rotas de gerenciamento de servidores
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.server import Server
from utils.helpers import create_response

servers_bp = Blueprint('servers', __name__)

@servers_bp.route('', methods=['GET'])
@jwt_required()
def list_servers():
    """Lista servidores do usuário"""
    try:
        user_id = get_jwt_identity()
        user_id = int(user_id) if isinstance(user_id, str) else user_id
        servers = Server.query.filter_by(user_id=user_id).all()
        
        return jsonify(create_response(data={
            'servers': [s.to_dict() for s in servers]
        }))
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

@servers_bp.route('', methods=['POST'])
@jwt_required()
def create_server():
    """Cria novo servidor"""
    try:
        user_id = get_jwt_identity()
        user_id = int(user_id) if isinstance(user_id, str) else user_id
        data = request.get_json()
        
        if not data or not data.get('name') or not data.get('host'):
            return jsonify(create_response(
                error='Name e host são obrigatórios',
                status=400
            )), 400
        
        # Se for o primeiro servidor, marcar como ativo
        existing_servers = Server.query.filter_by(user_id=user_id).count()
        is_active = existing_servers == 0
        
        server = Server(
            user_id=user_id,
            name=data['name'],
            host=data['host'],
            port=data.get('port', 5000),
            api_key=data.get('api_key'),
            is_active=is_active
        )
        
        if data.get('config'):
            server.set_config(data['config'])
        
        db.session.add(server)
        db.session.commit()
        
        return jsonify(create_response(data=server.to_dict())), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify(create_response(error=str(e), status=500)), 500

@servers_bp.route('/<int:server_id>', methods=['PUT'])
@jwt_required()
def update_server(server_id):
    """Atualiza servidor"""
    try:
        user_id = get_jwt_identity()
        user_id = int(user_id) if isinstance(user_id, str) else user_id
        server = Server.query.filter_by(id=server_id, user_id=user_id).first()
        
        if not server:
            return jsonify(create_response(
                error='Servidor não encontrado',
                status=404
            )), 404
        
        data = request.get_json()
        
        if 'name' in data:
            server.name = data['name']
        if 'host' in data:
            server.host = data['host']
        if 'port' in data:
            server.port = data['port']
        if 'api_key' in data:
            server.api_key = data['api_key']
        if 'config' in data:
            server.set_config(data['config'])
        
        db.session.commit()
        
        return jsonify(create_response(data=server.to_dict()))
        
    except Exception as e:
        db.session.rollback()
        return jsonify(create_response(error=str(e), status=500)), 500

@servers_bp.route('/<int:server_id>/activate', methods=['POST'])
@jwt_required()
def activate_server(server_id):
    """Ativa servidor (desativa os outros)"""
    try:
        user_id = get_jwt_identity()
        user_id = int(user_id) if isinstance(user_id, str) else user_id
        server = Server.query.filter_by(id=server_id, user_id=user_id).first()
        
        if not server:
            return jsonify(create_response(
                error='Servidor não encontrado',
                status=404
            )), 404
        
        # Desativar todos os servidores do usuário
        Server.query.filter_by(user_id=user_id).update({'is_active': False})
        
        # Ativar servidor selecionado
        server.is_active = True
        db.session.commit()
        
        return jsonify(create_response(data=server.to_dict()))
        
    except Exception as e:
        db.session.rollback()
        return jsonify(create_response(error=str(e), status=500)), 500

@servers_bp.route('/<int:server_id>', methods=['DELETE'])
@jwt_required()
def delete_server(server_id):
    """Deleta servidor"""
    try:
        user_id = get_jwt_identity()
        user_id = int(user_id) if isinstance(user_id, str) else user_id
        server = Server.query.filter_by(id=server_id, user_id=user_id).first()
        
        if not server:
            return jsonify(create_response(
                error='Servidor não encontrado',
                status=404
            )), 404
        
        db.session.delete(server)
        db.session.commit()
        
        return jsonify(create_response(data={'message': 'Servidor deletado'}))
        
    except Exception as e:
        db.session.rollback()
        return jsonify(create_response(error=str(e), status=500)), 500

@servers_bp.route('/active', methods=['GET'])
@jwt_required()
def get_active_server():
    """Retorna servidor ativo do usuário"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify(create_response(
                error='Token inválido',
                status=422
            )), 422
        
        user_id = int(user_id) if isinstance(user_id, str) else user_id
        server = Server.query.filter_by(user_id=user_id, is_active=True).first()
        
        if not server:
            return jsonify(create_response(
                error='Nenhum servidor ativo',
                status=404
            )), 404
        
        return jsonify(create_response(data=server.to_dict()))
        
    except Exception as e:
        import traceback
        print(f"Erro em /servers/active: {e}")
        print(traceback.format_exc())
        return jsonify(create_response(error=str(e), status=500)), 500

