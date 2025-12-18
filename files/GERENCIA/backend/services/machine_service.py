"""
Serviço de gerenciamento de máquinas
"""
import subprocess
import os
import threading
from typing import List, Dict, Optional
from utils.helpers import get_script_path, get_root_script_path, parse_ip_range
from utils.validators import validate_ip

class MachineService:
    def __init__(self, socketio=None):
        self.socketio = socketio
        self.machines_cache = {}
        self.ip_file = get_script_path('maquinas')
        self.mac_file = get_script_path('mac_maquinas')
        
    def get_all_machines_status(self) -> List[Dict]:
        """Retorna status de todas as máquinas"""
        machines = []
        
        if not os.path.exists(self.ip_file):
            return machines
        
        with open(self.ip_file, 'r') as f:
            ips = [line.strip() for line in f if line.strip()]
        
        for ip in ips:
            if validate_ip(ip):
                status = self._check_machine_status(ip)
                machines.append({
                    'ip': ip,
                    'status': status,
                    'hostname': self._get_hostname(ip),
                    'last_seen': self.machines_cache.get(ip, {}).get('last_seen')
                })
        
        return machines
    
    def get_machine_status(self, ip: str) -> Dict:
        """Retorna status de uma máquina específica"""
        if not validate_ip(ip):
            return {'error': 'IP inválido'}
        
        status = self._check_machine_status(ip)
        return {
            'ip': ip,
            'status': status,
            'hostname': self._get_hostname(ip),
            'last_seen': self.machines_cache.get(ip, {}).get('last_seen')
        }
    
    def turn_on_machines(self, ips: Optional[List[str]] = None, lab: Optional[str] = None) -> Dict:
        """Liga máquinas usando liga.sh"""
        script = get_root_script_path('liga.sh')
        
        if not os.path.exists(script):
            return {'error': 'Script de ligar não encontrado'}
        
        try:
            if lab:
                # Ligar laboratório específico: liga.sh -l labconf
                command = ['sudo', 'bash', script, '-l', lab]
            else:
                # Ligar todas: liga.sh -a
                command = ['sudo', 'bash', script, '-a']
            
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                return {'success': True, 'message': 'Máquinas ligadas com sucesso', 'output': result.stdout}
            else:
                return {'success': False, 'error': result.stderr or result.stdout}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_active_machines(self) -> Dict:
        """Executa list_users.sh e retorna máquinas ativas"""
        script = get_root_script_path('list_users.sh')
        output_file = get_root_script_path('maquinas.txt')
        
        if not os.path.exists(script):
            return {'error': 'Script list_users.sh não encontrado'}
        
        try:
            # Executa o script (ele gera o arquivo maquinas.txt)
            result = subprocess.run(
                ['sudo', 'bash', script],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            machines = []
            
            # Lê o arquivo maquinas.txt gerado pelo script
            if os.path.exists(output_file):
                with open(output_file, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line and '|' in line:
                            parts = [p.strip() for p in line.split('|')]
                            if len(parts) >= 4:
                                lab = parts[0]
                                user = parts[1]
                                ip = parts[2]
                                mac = parts[3]
                                
                                machines.append({
                                    'lab': lab,
                                    'user': user,
                                    'ip': ip,
                                    'mac': mac
                                })
            
            return {
                'success': True,
                'machines': machines,
                'total': len(machines)
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def turn_off_machines(self, ips: Optional[List[str]] = None) -> Dict:
        """Desliga máquinas"""
        script = get_script_path('desliga.sh')
        
        if not os.path.exists(script):
            return {'error': 'Script de desligar não encontrado'}
        
        if ips is None or len(ips) == 0:
            # Desligar todas
            command = ['sudo', 'bash', script, self.ip_file]
        else:
            # Desligar máquinas específicas
            script_one = get_script_path('desliga_um.sh')
            results = []
            for ip in ips:
                if validate_ip(ip):
                    result = subprocess.run(
                        ['sudo', 'bash', script_one, ip],
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                    results.append({'ip': ip, 'success': result.returncode == 0})
            return {'success': True, 'results': results}
        
        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                return {'success': True, 'message': 'Máquinas desligadas com sucesso'}
            else:
                return {'success': False, 'error': result.stderr}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def turn_off_one(self, ip: str) -> Dict:
        """Desliga uma máquina específica"""
        if not validate_ip(ip):
            return {'error': 'IP inválido'}
        
        script = get_script_path('desliga_um.sh')
        
        if not os.path.exists(script):
            return {'error': 'Script não encontrado'}
        
        try:
            result = subprocess.run(
                ['sudo', 'bash', script, ip],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                return {'success': True, 'message': f'Máquina {ip} desligada'}
            else:
                return {'success': False, 'error': result.stderr}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def setup_ip_range(self, ip_range: str) -> Dict:
        """Configura faixa de IPs"""
        from utils.validators import validate_ip_range
        
        if not validate_ip_range(ip_range):
            return {'error': 'Faixa de IPs inválida'}
        
        ips = parse_ip_range(ip_range)
        
        try:
            with open(self.ip_file, 'w') as f:
                for ip in ips:
                    f.write(ip + '\n')
            
            return {'success': True, 'message': f'{len(ips)} IPs configurados', 'count': len(ips)}
        except Exception as e:
            return {'error': str(e)}
    
    def start_monitoring(self) -> None:
        """Inicia monitoramento contínuo via ping"""
        def monitor_loop():
            ping_script = get_script_path('ping.sh')
            if not os.path.exists(ping_script):
                return
            
            while True:
                try:
                    result = subprocess.run(
                        ['sudo', 'bash', ping_script, self.ip_file],
                        capture_output=True,
                        text=True,
                        timeout=120
                    )
                    
                    if result.returncode == 0:
                        # Processar output e emitir via WebSocket
                        for line in result.stdout.split('\n'):
                            if line.strip():
                                parts = line.split()
                                if len(parts) >= 2:
                                    ip = parts[0]
                                    status = parts[1].upper()
                                    
                                    if self.socketio:
                                        self.socketio.emit('machine_status_update', {
                                            'ip': ip,
                                            'status': 'online' if status == 'ON' else 'offline'
                                        })
                                    
                                    # Atualizar cache
                                    self.machines_cache[ip] = {
                                        'status': 'online' if status == 'ON' else 'offline',
                                        'last_seen': None  # Implementar timestamp
                                    }
                except Exception as e:
                    print(f"Erro no monitoramento: {e}")
                
                import time
                time.sleep(5)  # Verificar a cada 5 segundos
        
        thread = threading.Thread(target=monitor_loop, daemon=True)
        thread.start()
    
    def _check_machine_status(self, ip: str) -> str:
        """Verifica status de uma máquina via ping"""
        try:
            result = subprocess.run(
                ['ping', '-c', '1', '-W', '1', ip],
                capture_output=True,
                timeout=2
            )
            return 'online' if result.returncode == 0 else 'offline'
        except:
            return 'offline'
    
    def _get_hostname(self, ip: str) -> Optional[str]:
        """Tenta obter hostname de um IP"""
        try:
            result = subprocess.run(
                ['host', ip],
                capture_output=True,
                text=True,
                timeout=2
            )
            if result.returncode == 0:
                return result.stdout.split()[4] if len(result.stdout.split()) > 4 else None
        except:
            pass
        return None

