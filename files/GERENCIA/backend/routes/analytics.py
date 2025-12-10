"""
Rotas de analytics e relatórios
"""
from flask import Blueprint, jsonify, request
from utils.helpers import create_response
from datetime import datetime, timedelta
import psutil
import json
import os

analytics_bp = Blueprint('analytics', __name__)

# Armazenamento simples em memória (em produção, usar banco de dados)
# Estrutura: {timestamp: {cpu, memory, disk, network, machines}}
metrics_history = []

def add_metric_to_history(metric_data):
    """Adiciona métrica ao histórico (limitado a últimas 1000 entradas)"""
    global metrics_history
    metrics_history.append({
        'timestamp': datetime.now().isoformat(),
        **metric_data
    })
    # Manter apenas últimas 1000 entradas
    if len(metrics_history) > 1000:
        metrics_history = metrics_history[-1000:]

def get_metrics_in_range(start_date, end_date):
    """Retorna métricas dentro de um intervalo de datas"""
    start = datetime.fromisoformat(start_date) if isinstance(start_date, str) else start_date
    end = datetime.fromisoformat(end_date) if isinstance(end_date, str) else end_date
    
    filtered = []
    for metric in metrics_history:
        metric_time = datetime.fromisoformat(metric['timestamp'])
        if start <= metric_time <= end:
            filtered.append(metric)
    return filtered

@analytics_bp.route('/usage-stats', methods=['GET'])
def get_usage_stats():
    """Retorna estatísticas de uso agregadas"""
    try:
        from services.monitoring_service import MonitoringService
        from services.machine_service import MachineService
        
        monitoring_service = MonitoringService()
        machine_service = MachineService()
        
        # Obter dados atuais
        monitoring_data = monitoring_service.get_all_metrics(interval=1)
        machines_data = machine_service.get_all_machines_status()
        
        # machines_data é uma lista diretamente
        machines_list = machines_data if isinstance(machines_data, list) else machines_data.get('machines', [])
        total_machines = len(machines_list)
        online_machines = sum(1 for m in machines_list if m.get('status') == 'online')
        offline_machines = total_machines - online_machines
        
        # Adicionar ao histórico
        add_metric_to_history({
            'cpu': monitoring_data.get('cpu', {}).get('overall_usage', 0),
            'memory': monitoring_data.get('memory', {}).get('percent', 0),
            'disk': monitoring_data.get('disk', [{}])[0].get('percent', 0) if monitoring_data.get('disk') else 0,
            'network_upload': 0,  # Será calculado
            'network_download': 0,  # Será calculado
            'machines_online': online_machines,
            'machines_offline': offline_machines,
            'machines_total': total_machines
        })
        
        # Calcular médias das últimas 24 horas
        now = datetime.now()
        last_24h = now - timedelta(hours=24)
        recent_metrics = get_metrics_in_range(last_24h.isoformat(), now.isoformat())
        
        avg_cpu = sum(m.get('cpu', 0) for m in recent_metrics) / len(recent_metrics) if recent_metrics else 0
        avg_memory = sum(m.get('memory', 0) for m in recent_metrics) / len(recent_metrics) if recent_metrics else 0
        avg_online = sum(m.get('machines_online', 0) for m in recent_metrics) / len(recent_metrics) if recent_metrics else 0
        
        stats = {
            'current': {
                'cpu_usage': float(monitoring_data.get('cpu', {}).get('overall_usage', 0)),
                'memory_usage': float(monitoring_data.get('memory', {}).get('percent', 0)),
                'disk_usage': float(monitoring_data.get('disk', [{}])[0].get('percent', 0)) if monitoring_data.get('disk') else 0,
                'machines_online': online_machines,
                'machines_offline': offline_machines,
                'machines_total': total_machines,
                'uptime_percentage': (online_machines / total_machines * 100) if total_machines > 0 else 0
            },
            'averages_24h': {
                'cpu': round(avg_cpu, 2),
                'memory': round(avg_memory, 2),
                'machines_online': round(avg_online, 1)
            },
            'history_count': len(metrics_history)
        }
        
        return jsonify(create_response(data=stats))
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

@analytics_bp.route('/trends', methods=['GET'])
def get_trends():
    """Retorna dados de tendências para gráficos"""
    try:
        # Parâmetros de data
        hours = request.args.get('hours', 24, type=int)
        metric_type = request.args.get('type', 'all')  # cpu, memory, disk, network, machines, all
        
        now = datetime.now()
        start = now - timedelta(hours=hours)
        
        filtered_metrics = get_metrics_in_range(start.isoformat(), now.isoformat())
        
        if not filtered_metrics:
            return jsonify(create_response(data={'trends': []}))
        
        trends = []
        for metric in filtered_metrics:
            trend_point = {
                'timestamp': metric['timestamp'],
                'time': datetime.fromisoformat(metric['timestamp']).strftime('%H:%M')
            }
            
            if metric_type in ['cpu', 'all']:
                trend_point['cpu'] = metric.get('cpu', 0)
            if metric_type in ['memory', 'all']:
                trend_point['memory'] = metric.get('memory', 0)
            if metric_type in ['disk', 'all']:
                trend_point['disk'] = metric.get('disk', 0)
            if metric_type in ['machines', 'all']:
                trend_point['machines_online'] = metric.get('machines_online', 0)
                trend_point['machines_offline'] = metric.get('machines_offline', 0)
            
            trends.append(trend_point)
        
        return jsonify(create_response(data={'trends': trends}))
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

@analytics_bp.route('/machine-stats', methods=['GET'])
def get_machine_stats():
    """Retorna estatísticas detalhadas por máquina"""
    try:
        from services.machine_service import MachineService
        
        machine_service = MachineService()
        machines_data = machine_service.get_all_machines_status()
        machines = machines_data if isinstance(machines_data, list) else machines_data.get('machines', [])
        
        stats = {
            'total': len(machines),
            'online': sum(1 for m in machines if m.get('status') == 'online'),
            'offline': sum(1 for m in machines if m.get('status') == 'offline'),
            'unknown': sum(1 for m in machines if m.get('status') not in ['online', 'offline']),
            'by_status': {}
        }
        
        # Agrupar por status
        for machine in machines:
            status = machine.get('status', 'unknown')
            if status not in stats['by_status']:
                stats['by_status'][status] = []
            stats['by_status'][status].append({
                'ip': machine.get('ip'),
                'name': machine.get('name', machine.get('ip')),
                'last_seen': machine.get('last_seen')
            })
        
        return jsonify(create_response(data=stats))
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

@analytics_bp.route('/performance-summary', methods=['GET'])
def get_performance_summary():
    """Retorna resumo de performance"""
    try:
        from services.monitoring_service import MonitoringService
        
        monitoring_service = MonitoringService()
        monitoring_data = monitoring_service.get_all_metrics(interval=1)
        
        cpu_usage = float(monitoring_data.get('cpu', {}).get('overall_usage', 0))
        memory_usage = float(monitoring_data.get('memory', {}).get('percent', 0))
        disk_data = monitoring_data.get('disk', [])
        disk_usage = float(disk_data[0].get('percent', 0)) if disk_data else 0
        
        # Classificar performance
        def get_performance_status(usage):
            if usage < 50:
                return 'excellent'
            elif usage < 70:
                return 'good'
            elif usage < 85:
                return 'warning'
            else:
                return 'critical'
        
        summary = {
            'cpu': {
                'usage': cpu_usage,
                'status': get_performance_status(cpu_usage),
                'cores': monitoring_data.get('cpu', {}).get('physical_cores', 0)
            },
            'memory': {
                'usage': memory_usage,
                'status': get_performance_status(memory_usage),
                'total': monitoring_data.get('memory', {}).get('total', 'N/A')
            },
            'disk': {
                'usage': disk_usage,
                'status': get_performance_status(disk_usage),
                'partitions': len(disk_data)
            },
            'overall_status': 'excellent' if all([
                cpu_usage < 70,
                memory_usage < 70,
                disk_usage < 70
            ]) else 'good' if all([
                cpu_usage < 85,
                memory_usage < 85,
                disk_usage < 85
            ]) else 'warning'
        }
        
        return jsonify(create_response(data=summary))
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

@analytics_bp.route('/reports', methods=['GET'])
def get_reports():
    """Retorna relatórios disponíveis ou gera novo relatório"""
    try:
        report_type = request.args.get('type', 'summary')
        format_type = request.args.get('format', 'json')  # json, csv
        
        if report_type == 'summary':
            # Relatório resumido
            from services.monitoring_service import MonitoringService
            from services.machine_service import MachineService
            
            monitoring_service = MonitoringService()
            machine_service = MachineService()
            
            monitoring_data = monitoring_service.get_all_metrics(interval=1)
            machines_data = machine_service.get_all_machines_status()
            machines_list = machines_data if isinstance(machines_data, list) else machines_data.get('machines', [])
            
            report = {
                'generated_at': datetime.now().isoformat(),
                'type': 'summary',
                'server': {
                    'cpu': monitoring_data.get('cpu', {}),
                    'memory': monitoring_data.get('memory', {}),
                    'disk': monitoring_data.get('disk', [])
                },
                'machines': {
                    'total': len(machines_list),
                    'online': sum(1 for m in machines_list if m.get('status') == 'online'),
                    'offline': sum(1 for m in machines_list if m.get('status') == 'offline')
                }
            }
            
            if format_type == 'csv':
                # Converter para CSV simples
                csv_lines = [
                    'Relatório de Sistema LTSP',
                    f'Gerado em: {report["generated_at"]}',
                    '',
                    'Servidor',
                    f'CPU: {report["server"]["cpu"].get("overall_usage", 0)}%',
                    f'Memória: {report["server"]["memory"].get("percent", 0)}%',
                    '',
                    'Máquinas',
                    f'Total: {report["machines"]["total"]}',
                    f'Online: {report["machines"]["online"]}',
                    f'Offline: {report["machines"]["offline"]}'
                ]
                return '\n'.join(csv_lines), 200, {'Content-Type': 'text/csv'}
            
            return jsonify(create_response(data=report))
        
        return jsonify(create_response(error='Tipo de relatório não suportado', status=400)), 400
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

@analytics_bp.route('/comparison', methods=['GET'])
def get_comparison():
    """Compara métricas entre dois períodos"""
    try:
        period1_start = request.args.get('period1_start')
        period1_end = request.args.get('period1_end')
        period2_start = request.args.get('period2_start')
        period2_end = request.args.get('period2_end')
        
        if not all([period1_start, period1_end, period2_start, period2_end]):
            return jsonify(create_response(
                error='Todos os parâmetros de período são obrigatórios',
                status=400
            )), 400
        
        period1_metrics = get_metrics_in_range(period1_start, period1_end)
        period2_metrics = get_metrics_in_range(period2_start, period2_end)
        
        def calculate_avg(metrics, key):
            if not metrics:
                return 0
            values = [m.get(key, 0) for m in metrics if key in m]
            return sum(values) / len(values) if values else 0
        
        comparison = {
            'period1': {
                'start': period1_start,
                'end': period1_end,
                'avg_cpu': round(calculate_avg(period1_metrics, 'cpu'), 2),
                'avg_memory': round(calculate_avg(period1_metrics, 'memory'), 2),
                'avg_machines_online': round(calculate_avg(period1_metrics, 'machines_online'), 1)
            },
            'period2': {
                'start': period2_start,
                'end': period2_end,
                'avg_cpu': round(calculate_avg(period2_metrics, 'cpu'), 2),
                'avg_memory': round(calculate_avg(period2_metrics, 'memory'), 2),
                'avg_machines_online': round(calculate_avg(period2_metrics, 'machines_online'), 1)
            },
            'differences': {
                'cpu': round(calculate_avg(period2_metrics, 'cpu') - calculate_avg(period1_metrics, 'cpu'), 2),
                'memory': round(calculate_avg(period2_metrics, 'memory') - calculate_avg(period1_metrics, 'memory'), 2),
                'machines_online': round(calculate_avg(period2_metrics, 'machines_online') - calculate_avg(period1_metrics, 'machines_online'), 1)
            }
        }
        
        return jsonify(create_response(data=comparison))
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

@analytics_bp.route('/processes', methods=['GET'])
def get_processes():
    """Retorna lista de processos em execução (similar ao top)"""
    try:
        sort_by = request.args.get('sort', 'cpu')  # cpu, memory, name
        limit = request.args.get('limit', 50, type=int)
        
        processes = []
        # Obter todos os processos de uma vez
        for proc in psutil.process_iter(['pid', 'name', 'status', 'username', 'create_time']):
            try:
                pinfo = proc.info
                proc_obj = psutil.Process(pinfo['pid'])
                
                # Obter métricas
                with proc_obj.oneshot():
                    cpu_percent = proc_obj.cpu_percent(interval=None)  # Não bloqueia, pode retornar 0.0
                    memory_info = proc_obj.memory_info()
                    memory_percent = proc_obj.memory_percent()
                    status = pinfo.get('status', 'unknown')
                    username = pinfo.get('username', 'N/A')
                    create_time = pinfo.get('create_time', 0)
                
                processes.append({
                    'pid': pinfo['pid'],
                    'name': pinfo.get('name', 'N/A') or 'N/A',
                    'cpu_percent': round(cpu_percent, 2) if cpu_percent else 0.0,
                    'memory_percent': round(memory_percent, 2),
                    'memory_mb': round((memory_info.rss / 1024 / 1024), 2) if memory_info else 0,
                    'status': status or 'unknown',
                    'username': username or 'N/A',
                    'uptime': round((psutil.boot_time() - create_time) / 3600, 2) if create_time else 0
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
            except Exception:
                # Ignorar outros erros
                pass
        
        # Ordenar processos
        if sort_by == 'cpu':
            processes.sort(key=lambda x: x['cpu_percent'], reverse=True)
        elif sort_by == 'memory':
            processes.sort(key=lambda x: x['memory_percent'], reverse=True)
        elif sort_by == 'name':
            processes.sort(key=lambda x: x['name'].lower())
        
        # Limitar quantidade
        processes = processes[:limit]
        
        return jsonify(create_response(data={'processes': processes, 'total': len(processes)}))
    except Exception as e:
        import traceback
        return jsonify(create_response(error=f"Erro ao obter processos: {str(e)}", status=500)), 500

@analytics_bp.route('/network-ports', methods=['GET'])
def get_network_ports():
    """Retorna lista de portas de rede abertas"""
    try:
        sort_by = request.args.get('sort', 'port')  # port, pid, status
        limit = request.args.get('limit', 100, type=int)
        
        connections = []
        for conn in psutil.net_connections(kind='inet'):
            try:
                conn_info = {
                    'fd': conn.fd,
                    'family': str(conn.family),
                    'type': str(conn.type),
                    'laddr': f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else 'N/A',
                    'raddr': f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else 'N/A',
                    'status': conn.status or 'N/A',
                    'pid': conn.pid or 'N/A'
                }
                
                # Obter nome do processo se houver PID
                if conn.pid:
                    try:
                        proc = psutil.Process(conn.pid)
                        conn_info['process_name'] = proc.name()
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        conn_info['process_name'] = 'N/A'
                else:
                    conn_info['process_name'] = 'N/A'
                
                connections.append(conn_info)
            except (psutil.AccessDenied, AttributeError):
                pass
        
        # Ordenar conexões
        if sort_by == 'port':
            connections.sort(key=lambda x: int(x['laddr'].split(':')[-1]) if ':' in x['laddr'] and x['laddr'] != 'N/A' else 0)
        elif sort_by == 'pid':
            connections.sort(key=lambda x: x['pid'] if isinstance(x['pid'], int) else 0, reverse=True)
        elif sort_by == 'status':
            connections.sort(key=lambda x: x['status'])
        
        # Limitar quantidade
        connections = connections[:limit]
        
        return jsonify(create_response(data={'connections': connections, 'total': len(connections)}))
    except Exception as e:
        import traceback
        error_msg = f"Erro ao obter portas de rede: {str(e)}"
        # No Windows, pode não ter permissão
        if 'AccessDenied' in str(e) or 'permission' in str(e).lower():
            error_msg += " (Permissão negada. Execute como administrador no Windows ou com sudo no Linux)"
        return jsonify(create_response(error=error_msg, status=500)), 500
