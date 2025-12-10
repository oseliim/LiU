"""
Serviço de monitoramento do servidor
"""
import psutil
import time
from typing import Dict, Optional
try:
    import cpuinfo
except ImportError:
    cpuinfo = None

from utils.helpers import format_bytes

class MonitoringService:
    def __init__(self):
        self.last_net_io = psutil.net_io_counters()
        self.last_cpu_times = psutil.cpu_times()
    
    def get_cpu_info(self, interval: float = 1.0) -> Dict:
        """Retorna informações da CPU"""
        cpu_info = {}
        
        # Informações do processador
        if cpuinfo:
            try:
                cpu_info_data = cpuinfo.get_cpu_info()
                cpu_info['processor'] = cpu_info_data.get('brand_raw', 'N/A')
            except:
                cpu_info['processor'] = 'N/A'
        else:
            cpu_info['processor'] = 'py-cpuinfo não instalado'
        
        # Núcleos e threads
        cpu_info['physical_cores'] = psutil.cpu_count(logical=False)
        cpu_info['total_threads'] = psutil.cpu_count(logical=True)
        
        # Uso da CPU
        cpu_info['overall_usage'] = psutil.cpu_percent(interval=interval)
        
        # Uso por núcleo
        cpu_info['per_core_usage'] = psutil.cpu_percent(interval=interval, percpu=True)
        
        # Frequência
        freq = psutil.cpu_freq()
        if freq:
            cpu_info['current_frequency'] = f"{freq.current/1000:.2f} GHz"
            cpu_info['min_frequency'] = f"{freq.min/1000:.2f} GHz"
            cpu_info['max_frequency'] = f"{freq.max/1000:.2f} GHz"
        else:
            cpu_info['current_frequency'] = 'N/A'
        
        # Tempos de CPU
        cpu_times = psutil.cpu_times()
        cpu_info['user_time'] = cpu_times.user
        cpu_info['system_time'] = cpu_times.system
        cpu_info['idle_time'] = cpu_times.idle
        
        return cpu_info
    
    def get_memory_info(self) -> Dict:
        """Retorna informações de memória"""
        mem = psutil.virtual_memory()
        swap = psutil.swap_memory()
        
        return {
            'total': format_bytes(mem.total),
            'available': format_bytes(mem.available),
            'used': format_bytes(mem.used),
            'percent': mem.percent,
            'swap_total': format_bytes(swap.total),
            'swap_used': format_bytes(swap.used),
            'swap_percent': swap.percent
        }
    
    def get_disk_info(self) -> list:
        """Retorna informações de disco"""
        partitions = psutil.disk_partitions()
        disk_info = []
        
        for partition in partitions:
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                disk_info.append({
                    'device': partition.device,
                    'mountpoint': partition.mountpoint,
                    'fstype': partition.fstype,
                    'total_size': format_bytes(usage.total),
                    'used': format_bytes(usage.used),
                    'free': format_bytes(usage.free),
                    'percent': usage.percent
                })
            except PermissionError:
                disk_info.append({
                    'device': partition.device,
                    'error': 'Permissão negada'
                })
        
        return disk_info
    
    def get_network_info(self, interval: float = 1.0) -> Dict:
        """Retorna informações de rede"""
        current_net_io = psutil.net_io_counters()
        
        bytes_sent_rate = (current_net_io.bytes_sent - self.last_net_io.bytes_sent) / interval
        bytes_recv_rate = (current_net_io.bytes_recv - self.last_net_io.bytes_recv) / interval
        
        self.last_net_io = current_net_io
        
        return {
            'upload': format_bytes(bytes_sent_rate) + '/s',
            'download': format_bytes(bytes_recv_rate) + '/s',
            'bytes_sent': current_net_io.bytes_sent,
            'bytes_recv': current_net_io.bytes_recv,
            'packets_sent': current_net_io.packets_sent,
            'packets_recv': current_net_io.packets_recv,
            'errors_in': current_net_io.errin,
            'errors_out': current_net_io.errout
        }
    
    def get_system_info(self) -> Dict:
        """Retorna informações gerais do sistema"""
        boot_time = psutil.boot_time()
        
        return {
            'boot_time': boot_time,
            'uptime': time.time() - boot_time,
            'platform': psutil.sys.platform,
            'users': len(psutil.users())
        }
    
    def get_all_metrics(self, interval: float = 1.0) -> Dict:
        """Retorna todas as métricas"""
        return {
            'cpu': self.get_cpu_info(interval),
            'memory': self.get_memory_info(),
            'disk': self.get_disk_info(),
            'network': self.get_network_info(interval),
            'system': self.get_system_info(),
            'timestamp': time.time()
        }

