from utils import format_bytes
import psutil

def get_memory_info():
    mem = psutil.virtual_memory()
    memory_info = {
        'total': format_bytes(mem.total),
        'available': format_bytes(mem.available),
        'used': format_bytes(mem.used),
        'percent': mem.percent
    }
    return memory_info