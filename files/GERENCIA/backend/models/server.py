"""
Modelo de Servidor
"""
from . import db
from datetime import datetime
import json

class Server(db.Model):
    """Modelo de servidor LTSP"""
    __tablename__ = 'servers'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    host = db.Column(db.String(255), nullable=False)  # IP ou domínio
    port = db.Column(db.Integer, default=5000)
    api_key = db.Column(db.String(255), nullable=True)  # Para autenticação do servidor
    is_active = db.Column(db.Boolean, default=False)
    config = db.Column(db.Text)  # JSON com configurações
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def get_config(self):
        """Retorna config como dict"""
        if self.config:
            try:
                return json.loads(self.config)
            except:
                return {}
        return {}
    
    def set_config(self, config_dict):
        """Salva config como JSON"""
        if config_dict:
            self.config = json.dumps(config_dict)
        else:
            self.config = None
    
    def to_dict(self):
        """Serializa para JSON"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'host': self.host,
            'port': self.port,
            'is_active': self.is_active,
            'config': self.get_config(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Server {self.name} ({self.host}:{self.port})>'

