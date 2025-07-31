
from utils import format_bytes
import psutil

def get_network_info(last_net_io, interval):
    current_net_io = psutil.net_io_counters()
    
    bytes_sent_rate = (current_net_io.bytes_sent - last_net_io.bytes_sent) / interval
    bytes_recv_rate = (current_net_io.bytes_recv - last_net_io.bytes_recv) / interval
    network_info = {
        'current_net_io': current_net_io,
        'upload': format_bytes(bytes_sent_rate) + '/s',
        'download': format_bytes(bytes_recv_rate) + '/s'
    }
    return network_info