"""
Serviço de execução de comandos
"""
import subprocess
import os
from typing import Dict, Optional, Generator
from utils.helpers import get_script_path
from utils.validators import validate_ip, validate_command, sanitize_input

class CommandService:
    def __init__(self):
        self.exec_script = get_script_path('executa.sh')
        self.exec_one_script = get_script_path('executa_um.sh')
        self.allowed_commands = [
            'uptime', 'df', 'free', 'ps', 'top', 'who', 'w',
            'uname', 'hostname', 'date', 'ls', 'pwd', 'cat',
            'grep', 'find', 'du', 'netstat', 'ss', 'ifconfig',
            'ip', 'systemctl', 'journalctl'
        ]
    
    def execute_command(self, command: str, ip_file: str) -> Generator[str, None, None]:
        """Executa comando em todas as máquinas"""
        # Validar e sanitizar comando
        sanitized_cmd = sanitize_input(command)
        
        if not validate_command(sanitized_cmd, self.allowed_commands):
            yield f"Erro: Comando '{sanitized_cmd}' não permitido ou inválido"
            return
        
        if not os.path.exists(self.exec_script):
            yield "Erro: Script de execução não encontrado"
            return
        
        try:
            process = subprocess.Popen(
                ['sudo', 'bash', self.exec_script, sanitized_cmd, ip_file],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
            )
            
            # Stream stdout
            for line in process.stdout:
                yield line.strip()
            
            # Stream stderr
            for line in process.stderr:
                yield f"ERRO: {line.strip()}"
            
            process.wait()
            
            if process.returncode == 0:
                yield "Comando executado com sucesso!"
            else:
                yield f"Comando finalizado com código de retorno: {process.returncode}"
                
        except Exception as e:
            yield f"Erro ao executar comando: {str(e)}"
    
    def execute_command_one(self, command: str, ip: str) -> Generator[str, None, None]:
        """Executa comando em uma máquina específica"""
        if not validate_ip(ip):
            yield f"Erro: IP '{ip}' inválido"
            return
        
        sanitized_cmd = sanitize_input(command)
        
        if not validate_command(sanitized_cmd, self.allowed_commands):
            yield f"Erro: Comando '{sanitized_cmd}' não permitido ou inválido"
            return
        
        if not os.path.exists(self.exec_one_script):
            yield "Erro: Script de execução não encontrado"
            return
        
        try:
            process = subprocess.Popen(
                ['sudo', 'bash', self.exec_one_script, sanitized_cmd, ip],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
            )
            
            yield f"Executando '{sanitized_cmd}' em {ip}..."
            
            for line in process.stdout:
                yield line.strip()
            
            for line in process.stderr:
                yield f"ERRO: {line.strip()}"
            
            process.wait()
            
            if process.returncode == 0:
                yield f"Comando executado com sucesso em {ip}!"
            else:
                yield f"Comando finalizado com código: {process.returncode}"
                
        except Exception as e:
            yield f"Erro ao executar comando: {str(e)}"
    
    def get_allowed_commands(self) -> list:
        """Retorna lista de comandos permitidos"""
        return self.allowed_commands
    
    def add_allowed_command(self, command: str) -> bool:
        """Adiciona comando à lista de permitidos"""
        if command and command not in self.allowed_commands:
            self.allowed_commands.append(command)
            return True
        return False

