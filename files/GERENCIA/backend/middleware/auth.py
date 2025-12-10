"""
Middleware de autenticação
"""
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models import db
from models.server import Server
from utils.helpers import create_response

def get_current_server():
    """Obtém servidor ativo do usuário atual"""
    try:
        user_id = get_jwt_identity()
        user_id = int(user_id) if isinstance(user_id, str) else user_id
        server = Server.query.filter_by(user_id=user_id, is_active=True).first()
        return server
    except:
        return None

def require_server(f):
    """Decorator que garante que há um servidor ativo"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        server = get_current_server()
        
        if not server:
            return jsonify(create_response(
                error='Nenhum servidor ativo. Selecione um servidor primeiro.',
                status=400
            )), 400
        
        # Adiciona server ao contexto
        request.current_server = server
        return f(*args, **kwargs)
    
    return decorated_function

