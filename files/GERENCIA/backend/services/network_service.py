"""
Serviço de gerenciamento de rede/internet
"""
import subprocess
import os
from typing import Dict
from utils.helpers import get_script_path

class NetworkService:
    def __init__(self):
        self.turn_off_script = get_script_path('desliga_net.sh')
        self.turn_on_script = get_script_path('liga_net.sh')
    
    def turn_off_internet(self, ip_file: str) -> Dict:
        """Desliga internet para as máquinas"""
        if not os.path.exists(self.turn_off_script):
            return {'error': 'Script de desligar internet não encontrado'}
        
        try:
            result = subprocess.run(
                ['sudo', 'bash', self.turn_off_script, ip_file],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                return {'success': True, 'message': 'Internet desligada com sucesso'}
            else:
                return {'success': False, 'error': result.stderr}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def turn_on_internet(self, ip_file: str) -> Dict:
        """Liga internet para as máquinas"""
        if not os.path.exists(self.turn_on_script):
            return {'error': 'Script de ligar internet não encontrado'}
        
        try:
            result = subprocess.run(
                ['sudo', 'bash', self.turn_on_script, ip_file],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                return {'success': True, 'message': 'Internet ligada com sucesso'}
            else:
                return {'success': False, 'error': result.stderr}
        except Exception as e:
            return {'success': False, 'error': str(e)}

