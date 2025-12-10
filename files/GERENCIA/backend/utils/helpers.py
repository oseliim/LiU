"""
Funções auxiliares
"""
import os
from typing import Dict, Any

# Caminho base do projeto
BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
SCRIPTS_DIR = os.path.join(BASE_DIR, '..', 'scripts')

def get_script_path(script_name: str) -> str:
    """Retorna o caminho completo de um script"""
    return os.path.join(SCRIPTS_DIR, script_name)

def format_bytes(byte_count: int) -> str:
    """Converte bytes para formato legível"""
    if byte_count is None:
        return "N/A"
    
    power = 1024
    n = 0
    power_labels = {0: '', 1: 'K', 2: 'M', 3: 'G', 4: 'T'}
    
    while byte_count >= power and n < len(power_labels):
        byte_count /= power
        n += 1
    
    return f"{byte_count:.2f} {power_labels[n]}B"

def parse_ip_range(ip_range: str) -> list:
    """Converte faixa de IPs em lista de IPs"""
    if ' - ' not in ip_range:
        return []
    
    start_ip, end_ip = ip_range.split(' - ')
    start_parts = start_ip.strip().split('.')
    end_parts = end_ip.strip().split('.')
    
    ip_base = '.'.join(start_parts[:3])
    start_octet = int(start_parts[3])
    end_octet = int(end_parts[3])
    
    return [f"{ip_base}.{i}" for i in range(start_octet, end_octet + 1)]

def create_response(data: Any = None, message: str = None, error: str = None, status: int = 200) -> Dict:
    """Cria resposta padronizada"""
    response = {
        'status': 'success' if not error else 'error',
        'status_code': status
    }
    
    if data is not None:
        response['data'] = data
    if message:
        response['message'] = message
    if error:
        response['error'] = error
    
    return response

