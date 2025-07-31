from utils import format_bytes
import psutil

def get_disk_info():
    partitions = psutil.disk_partitions()
    disk_info = []
    
    for partition in partitions:
        try:
            partition_usage = psutil.disk_usage(partition.mountpoint)
            disk_info.append({
                'device': partition.device,
                'fstype': partition.fstype,
                'mountpoint': partition.mountpoint,
                'total_size': format_bytes(partition_usage.total),
                'used': format_bytes(partition_usage.used),
                'free': format_bytes(partition_usage.free),
                'percent': partition_usage.percent
            })
        except PermissionError:
            disk_info.append({'error': f"Could not retrieve info for partition: {partition.device}"})
    
    return disk_info