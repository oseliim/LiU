"""
Modelo de configuração do laboratório
"""
from datetime import datetime
from models import db

class LabConfig(db.Model):
    """Configurações do laboratório"""
    
    __tablename__ = 'lab_config'
    
    id = db.Column(db.Integer, primary_key=True)
    lab_name = db.Column(db.String(100), nullable=False, default='Laboratório')
    max_devices = db.Column(db.Integer, nullable=False, default=50)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Converte para dicionário"""
        return {
            'id': self.id,
            'lab_name': self.lab_name,
            'max_devices': self.max_devices,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_config(cls):
        """Obtém configuração atual (cria uma se não existir)"""
        config = cls.query.first()
        if not config:
            config = cls()
            db.session.add(config)
            db.session.commit()
        return config
    
    @classmethod
    def update_config(cls, lab_name=None, max_devices=None):
        """Atualiza configuração"""
        config = cls.get_config()
        
        if lab_name is not None:
            config.lab_name = lab_name
        if max_devices is not None:
            config.max_devices = max_devices
            
        config.updated_at = datetime.utcnow()
        db.session.commit()
        return config
