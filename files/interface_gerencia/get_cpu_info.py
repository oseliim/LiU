from utils import format_bytes
import psutil
import cpuinfo

def get_cpu_info(interval):
    cpu_info = {}
    
    if cpuinfo:
        cpu_info_data = cpuinfo.get_cpu_info()
        cpu_name = cpu_info_data.get('brand_raw', 'N/A')
        cpu_info['processor'] = cpu_name
    else:
        cpu_info['processor'] = "'py-cpuinfo' not found. Cannot get CPU name. (To install, run: pip install py-cpuinfo)"
    
    physical_cores = psutil.cpu_count(logical=False)
    total_threads = psutil.cpu_count(logical=True)
    cpu_info['physical_cores'] = physical_cores
    cpu_info['total_threads'] = total_threads
    
    cpu_percent_total = psutil.cpu_percent(interval=interval)
    frequency = psutil.cpu_freq()
    cpu_info['overall_usage'] = f"{cpu_percent_total}%"
    cpu_info['current_frequency'] = f"{(frequency.current/1000):.2f} GHz" if frequency else "N/A"
    
    return cpu_info