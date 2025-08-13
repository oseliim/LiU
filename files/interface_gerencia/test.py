import psutil
import time
import os
import datetime

# To get the CPU model name, we need the py-cpuinfo library.
# We'll try to import it, and handle the case where it's not installed.
try:
    os.system('pip install py-cpuinfo')  # Ensure py-cpuinfo is installed
    import cpuinfo
except ImportError:
    cpuinfo = None

def clear_screen():
    """Clears the console screen."""
    os.system('cls' if os.name == 'nt' else 'clear')

def format_bytes(byte_count):
    """Converts a byte count to a human-readable format (KB, MB, GB, etc.)."""
    if byte_count is None:
        return "N/A"
    power = 1024
    n = 0
    power_labels = {0: '', 1: 'K', 2: 'M', 3: 'G', 4: 'T'}
    while byte_count >= power and n < len(power_labels):
        byte_count /= power
        n += 1
    return f"{byte_count:.2f} {power_labels[n]}B"

def display_boot_time():
    """Displays the system boot time."""
    print("="*40, "System Monitor", "="*40)
    boot_time_timestamp = psutil.boot_time()
    bt = datetime.datetime.fromtimestamp(boot_time_timestamp)
    print(f"System Boot Time: {bt.year}/{bt.month}/{bt.day} {bt.hour}:{bt.minute}:{bt.second}")
    print("-" * 96)

def display_cpu_info(interval):
    """Displays detailed CPU information and overall usage."""
    print("CPU Info:")
    
    # Get CPU model name using py-cpuinfo if available
    if cpuinfo:
        cpu_info_data = cpuinfo.get_cpu_info()
        cpu_name = cpu_info_data.get('brand_raw', 'N/A')
        print(f"  Processor:      {cpu_name}")
    else:
        print("  Processor:      'py-cpuinfo' not found. Cannot get CPU name.")
        print("                  (To install, run: pip install py-cpuinfo)")

    # CPU core counts from psutil
    physical_cores = psutil.cpu_count(logical=False)
    total_threads = psutil.cpu_count(logical=True)
    print(f"  Physical Cores: {physical_cores}")
    print(f"  Total Threads:  {total_threads}")

    # CPU usage from psutil
    cpu_percent_total = psutil.cpu_percent(interval=interval)
    print(f"  Overall Usage:  {cpu_percent_total}%")
    print("-" * 96)

def display_memory_info():
    """Displays virtual and SWAP memory usage."""
    print("Memory Usage:")
    mem = psutil.virtual_memory()
    print(f"  Total: {format_bytes(mem.total)}")
    print(f"  Available: {format_bytes(mem.available)}")
    print(f"  Used: {format_bytes(mem.used)} ({mem.percent}%)")
    print("-" * 96)

def display_disk_info():
    """Displays information for all mounted disk partitions."""
    print("Disk Usage:")
    partitions = psutil.disk_partitions()
    for partition in partitions:
        try:
            partition_usage = psutil.disk_usage(partition.mountpoint)
            print(f"  Device: {partition.device} ({partition.fstype}) at {partition.mountpoint}")
            print(f"    Total Size: {format_bytes(partition_usage.total)}")
            print(f"    Used:       {format_bytes(partition_usage.used)}")
            print(f"    Free:       {format_bytes(partition_usage.free)}")
            print(f"    Percentage: {partition_usage.percent}%")
        except PermissionError:
            print(f"  Could not retrieve info for partition: {partition.device}")
    print("-" * 96)

def display_network_info(last_net_io, interval):
    """Calculates and displays network usage rate."""
    current_net_io = psutil.net_io_counters()
    
    bytes_sent_rate = (current_net_io.bytes_sent - last_net_io.bytes_sent) / interval
    bytes_recv_rate = (current_net_io.bytes_recv - last_net_io.bytes_recv) / interval

    print("Network Usage Rate:")
    print(f"  Upload:   {format_bytes(bytes_sent_rate)}/s")
    print(f"  Download: {format_bytes(bytes_recv_rate)}/s")
    print("="*96)
    
    return current_net_io

if __name__ == "__main__":
    try:
        REFRESH_INTERVAL = 1.0 # seconds
        last_net_io = psutil.net_io_counters()
        
        # Initial call to psutil.cpu_percent() to avoid 0.0% on first run
        psutil.cpu_percent(interval=None)
        
        clear_screen()
        display_boot_time()
        # The main delay is handled by the interval in display_cpu_info
        display_cpu_info(interval=REFRESH_INTERVAL)
        display_memory_info()
        display_disk_info()
        last_net_io = display_network_info(last_net_io, REFRESH_INTERVAL)

    except KeyboardInterrupt:
        print("\nExiting system monitor. Goodbye!")
