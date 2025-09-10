import { AppState } from './AppState.js';
import { postJson } from './api.js';
import { updateChart, updateDualChart } from './charts.js';

function setTextWithPrefix(prefix, id, text) {
    const el = document.getElementById(prefix + id);
    if (el) el.textContent = text;
}

export async function updateCpuInfo() {
    const isClient = AppState.activeView === 'client';
    const prefix = isClient ? 'client-' : '';
    const endpoint = isClient ? '/client-cpu-info' : '/cpu-info';
    const data = await postJson(endpoint, { ip: AppState.activeClientIp });
    if (!data) return;

    setTextWithPrefix(prefix, 'cpu-processor', data.processor);
    setTextWithPrefix(prefix, 'cpu-cores', data.physical_cores);
    setTextWithPrefix(prefix, 'cpu-threads', data.total_threads);
    setTextWithPrefix(prefix, 'cpu-usage', data.overall_usage);
    setTextWithPrefix(prefix, 'cpu-frequency', data.current_frequency);

    const usageValue = parseFloat(data.overall_usage) || 0;
    updateChart(AppState.charts[prefix + 'cpu'], usageValue);
}

export async function updateMemoryInfo() {
    const isClient = AppState.activeView === 'client';
    const prefix = isClient ? 'client-' : '';
    const endpoint = isClient ? '/client-memory-info' : '/memory-info';
    const data = await postJson(endpoint, { ip: AppState.activeClientIp });
    if (!data) return;

    setTextWithPrefix(prefix, 'mem-total', data.total);
    setTextWithPrefix(prefix, 'mem-used', `${data.used} (${data.percent}%)`);
    setTextWithPrefix(prefix, 'mem-available', data.available);

    updateChart(AppState.charts[prefix + 'memory'], data.percent);
}

export async function updateDiskInfo() {
    const endpoint = '/disk-info';
    const data = await postJson(endpoint, { ip: AppState.activeClientIp });
    if (!data) return;

    const prefix = AppState.activeView === 'client' ? 'client-' : '';
    const diskDetails = document.getElementById(prefix + 'disk-details');
    if (!diskDetails) return;
    diskDetails.innerHTML = '';

    data.forEach(partition => {
        const row = document.createElement('div');
        row.className = 'spec-row-dynamic mb-3';
        row.innerHTML = `
                <strong class="spec-label d-block">${partition.mountpoint} (${partition.device})</strong>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar bg-success" role="progressbar" style="width: ${partition.percent}%;" 
                        aria-valuenow="${partition.percent}" aria-valuemin="0" aria-valuemax="100">
                        ${partition.percent}%
                    </div>
                </div>
                <small>${partition.used} usados de ${partition.total_size}</small>
            `;
        diskDetails.appendChild(row);
    });
}

export async function updateNetworkInfo() {
    const isClient = AppState.activeView === 'client';
    const prefix = isClient ? 'client-' : '';
    const endpoint = isClient ? '/client-network-info' : '/network-info';
    const data = await postJson(endpoint, { ip: AppState.activeClientIp });
    if (!data) return;

    setTextWithPrefix(prefix, 'net-upload', data.upload);
    setTextWithPrefix(prefix, 'net-download', data.download);

    const uploadValue = parseFloat(data.upload) || 0;
    const downloadValue = parseFloat(data.download) || 0;
    updateDualChart(AppState.charts[prefix + 'network'], uploadValue, downloadValue);
}

export const updateFunctions = {
    'cpu': updateCpuInfo,
    'memory': updateMemoryInfo,
    'disk': updateDiskInfo,
    'network': updateNetworkInfo,
    'client-cpu': updateCpuInfo,
    'client-memory': updateMemoryInfo,
    'client-network': updateNetworkInfo
};

