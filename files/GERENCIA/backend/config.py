"""
Configurações da aplicação
"""
import os
from pathlib import Path

class Config:
    """Configurações da aplicação"""
    
    # Chaves secretas
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', os.getenv('SECRET_KEY', 'jwt-secret-key-change-in-production'))
    JWT_ACCESS_TOKEN_EXPIRES = False  # Tokens não expiram (ou definir tempo, ex: timedelta(hours=24))
    JWT_ALGORITHM = 'HS256'
    
    # Banco de Dados
    # SQLite (padrão - 100% gratuito, arquivo local)
    BASE_DIR = Path(__file__).parent  # Diretório backend
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        f'sqlite:///{BASE_DIR}/ltsp_manager.db'
    )
    
    # Para PostgreSQL (Supabase, Railway, etc.) - descomente e configure:
    # SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False  # True para debug SQL
    
    # Cache
    CACHE_TYPE = 'simple'
    CACHE_DEFAULT_TIMEOUT = 300

