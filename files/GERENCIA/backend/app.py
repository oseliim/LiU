"""
Sistema de Gerenciamento Laboratorial LTSP - Backend API
Versão 2.0 - Flask API com WebSocket
"""
from flask import Flask, request
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_caching import Cache
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv
from config import Config
from models import db

# Carregar variáveis de ambiente
load_dotenv()

# Configuração da aplicação
app = Flask(__name__)
app.config.from_object(Config)

# Inicializar extensões
db.init_app(app)
jwt = JWTManager(app)

# Configurar handlers de erro do JWT
from flask import jsonify
from utils.helpers import create_response

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify(create_response(error='Token expirado', status=401)), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    import traceback
    print(f"Token inválido: {error}")
    print(f"Tipo do erro: {type(error)}")
    print(f"Traceback:")
    traceback.print_exc()
    return jsonify(create_response(error=f'Token inválido: {str(error)}', status=422)), 422

@jwt.unauthorized_loader
def missing_token_callback(error):
    print(f"Token não fornecido: {error}")
    return jsonify(create_response(error='Token não fornecido', status=401)), 401

# Habilitar CORS
CORS(app, resources={
    r"/api/*": {"origins": "*"},
    r"/socket.io/*": {"origins": "*"}
})

# Inicializar SocketIO
# Tenta usar eventlet, se não disponível usa threading
try:
    import eventlet
    eventlet.monkey_patch()
    async_mode = 'eventlet'
    socketio_logger = True
    socketio_engineio_logger = True
except ImportError:
    async_mode = 'threading'
    # Desabilitar logger em threading mode para evitar erros com Werkzeug
    socketio_logger = False
    socketio_engineio_logger = False

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode=async_mode,
    logger=socketio_logger,
    engineio_logger=socketio_engineio_logger,
    allow_upgrades=True,
    transports=['websocket', 'polling']
)

# Inicializar Cache
cache = Cache(app)

# Criar tabelas do banco de dados (apenas em desenvolvimento)
with app.app_context():
    db.create_all()

# Importar e registrar blueprints
from routes.machines import machines_bp
from routes.monitoring import monitoring_bp
from routes.commands import commands_bp
from routes.scheduling import scheduling_bp
from routes.analytics import analytics_bp
from routes.auth import auth_bp
from routes.servers import servers_bp

app.register_blueprint(machines_bp, url_prefix='/api/machines')
app.register_blueprint(monitoring_bp, url_prefix='/api/monitoring')
app.register_blueprint(commands_bp, url_prefix='/api/commands')
app.register_blueprint(scheduling_bp, url_prefix='/api/scheduling')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(servers_bp, url_prefix='/api/servers')

# Middleware para logar tokens recebidos (apenas em debug)
@app.before_request
def log_request_info():
    """Log informações da requisição para debug"""
    if app.debug:
        auth_header = request.headers.get('Authorization', '')
        if auth_header:
            token_preview = auth_header[:30] + '...' if len(auth_header) > 30 else auth_header
            print(f"[DEBUG] Requisição para {request.path} com token: {token_preview}")

# Rota de health check
@app.route('/api/health')
def health():
    """Health check endpoint"""
    return {'status': 'ok', 'version': '2.0'}

# Eventos WebSocket
@socketio.on('connect')
def handle_connect():
    """Cliente conectado via WebSocket"""
    print('Cliente conectado')
    socketio.emit('connected', {'message': 'Conectado ao servidor'})

@socketio.on('disconnect')
def handle_disconnect():
    """Cliente desconectado"""
    print('Cliente desconectado')

@socketio.on('subscribe_machines')
def handle_subscribe_machines():
    """Cliente quer receber atualizações de máquinas"""
    print('Cliente inscrito para atualizações de máquinas')

@socketio.on('subscribe_server_metrics')
def handle_subscribe_server_metrics():
    """Cliente quer receber métricas do servidor"""
    print('Cliente inscrito para métricas do servidor')

if __name__ == '__main__':
    # Em desenvolvimento
    if async_mode == 'eventlet':
        socketio.run(
            app,
            host='0.0.0.0',
            port=5001,
            debug=True,
            allow_unsafe_werkzeug=True
        )
    else:
        # Usar Flask dev server quando eventlet não está disponível
        app.run(
            host='0.0.0.0',
            port=5001,
            debug=True
        )

