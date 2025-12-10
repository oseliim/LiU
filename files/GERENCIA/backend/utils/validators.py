"""
Utilitários de validação
"""
import re
from typing import List, Optional

def validate_ip(ip: str) -> bool:
    """Valida formato de IP"""
    pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
    if not re.match(pattern, ip):
        return False
    
    parts = ip.split('.')
    return all(0 <= int(part) <= 255 for part in parts)

def validate_ip_range(ip_range: str) -> bool:
    """Valida faixa de IPs (ex: 10.100.64.100 - 10.100.64.150)"""
    if ' - ' not in ip_range:
        return False
    
    start_ip, end_ip = ip_range.split(' - ')
    if not validate_ip(start_ip.strip()) or not validate_ip(end_ip.strip()):
        return False
    
    start_parts = start_ip.strip().split('.')
    end_parts = end_ip.strip().split('.')
    
    # Verificar se os 3 primeiros octetos são iguais
    if start_parts[:3] != end_parts[:3]:
        return False
    
    # Verificar se o último octeto do início é menor que o do fim
    return int(start_parts[3]) < int(end_parts[3])

def validate_command(command: str, allowed_commands: Optional[List[str]] = None) -> bool:
    """Valida comando permitido"""
    if allowed_commands is None:
        # Comandos básicos permitidos por padrão
        allowed_commands = [
            'uptime', 'df', 'free', 'ps', 'top', 'who', 'w',
            'uname', 'hostname', 'date', 'ls', 'pwd'
        ]
    
    # Extrair o comando base (antes do primeiro espaço)
    base_command = command.split()[0] if command.split() else command
    
    # Verificar comandos perigosos
    dangerous_commands = ['rm', 'rmdir', 'del', 'format', 'mkfs', 'dd', 'shutdown', 'reboot']
    if base_command in dangerous_commands:
        return False
    
    return base_command in allowed_commands

def validate_cron_expression(cron_expr: str) -> bool:
    """Valida expressão cron básica"""
    parts = cron_expr.split()
    if len(parts) != 5:
        return False
    
    # Validar cada parte (minuto, hora, dia, mês, dia da semana)
    try:
        minute, hour, day, month, weekday = parts
        
        # Validar ranges básicos
        def validate_field(value, min_val, max_val):
            if value == '*':
                return True
            if '/' in value:
                return True  # Formato */5
            if '-' in value:
                start, end = value.split('-')
                return min_val <= int(start) <= max_val and min_val <= int(end) <= max_val
            return min_val <= int(value) <= max_val
        
        return (
            validate_field(minute, 0, 59) and
            validate_field(hour, 0, 23) and
            validate_field(day, 1, 31) and
            validate_field(month, 1, 12) and
            validate_field(weekday, 0, 6)
        )
    except:
        return False

def sanitize_input(text: str) -> str:
    """Sanitiza input do usuário"""
    # Remover caracteres perigosos
    dangerous_chars = [';', '|', '&', '`', '$', '(', ')', '<', '>']
    for char in dangerous_chars:
        text = text.replace(char, '')
    return text.strip()

