"""
Modelos de banco de dados
"""
from flask_sqlalchemy import SQLAlchemy

# Instância do SQLAlchemy
db = SQLAlchemy()

# Importar modelos (após criar db)
from .user import User
from .server import Server

__all__ = ['db', 'User', 'Server']
