"""
Rotas de autenticação
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db
from models.user import User
from utils.helpers import create_response

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Registra novo usuário"""
    try:
        data = request.get_json()
        
        # Validação
        if not data or not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify(create_response(
                error='Username, email e password são obrigatórios',
                status=400
            )), 400
        
        # Verificar se usuário já existe
        if User.query.filter_by(username=data['username']).first():
            return jsonify(create_response(
                error='Username já existe',
                status=400
            )), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify(create_response(
                error='Email já cadastrado',
                status=400
            )), 400
        
        # Criar usuário
        user = User(
            username=data['username'],
            email=data['email']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Criar token (identity deve ser string)
        access_token = create_access_token(identity=str(user.id))
        print(f"Registro bem-sucedido para usuário: {data['username']} (ID: {user.id})")
        print(f"Token criado (primeiros 20 chars): {access_token[:20]}...")
        
        response_data = create_response(data={
            'user': user.to_dict(),
            'token': access_token
        })
        
        return jsonify(response_data), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify(create_response(error=str(e), status=500)), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login de usuário"""
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify(create_response(
                error='Username e password são obrigatórios',
                status=400
            )), 400
        
        username = data.get('username')
        password = data.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if not user:
            print(f"Usuário não encontrado: {username}")
            return jsonify(create_response(
                error='Credenciais inválidas',
                status=401
            )), 401
        
        if not user.check_password(password):
            print(f"Senha incorreta para usuário: {username}")
            return jsonify(create_response(
                error='Credenciais inválidas',
                status=401
            )), 401
        
        # Criar token (identity deve ser string)
        access_token = create_access_token(identity=str(user.id))
        print(f"Login bem-sucedido para usuário: {username} (ID: {user.id})")
        print(f"Token criado (primeiros 20 chars): {access_token[:20]}...")
        
        response_data = create_response(data={
            'user': user.to_dict(),
            'token': access_token
        })
        
        return jsonify(response_data)
        
    except Exception as e:
        import traceback
        print(f"Erro no login: {e}")
        print(traceback.format_exc())
        return jsonify(create_response(error=str(e), status=500)), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Retorna usuário atual"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify(create_response(
                error='Token inválido',
                status=422
            )), 422
        
        # Converter string para int se necessário
        user_id = int(user_id) if isinstance(user_id, str) else user_id
        user = User.query.get(user_id)
        
        if not user:
            return jsonify(create_response(
                error='Usuário não encontrado',
                status=404
            )), 404
        
        return jsonify(create_response(data=user.to_dict()))
        
    except Exception as e:
        import traceback
        print(f"Erro em /me: {e}")
        print(traceback.format_exc())
        return jsonify(create_response(error=str(e), status=500)), 500
