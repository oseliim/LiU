import { AppState } from './AppState.js';

export function initCharts(prefix = '') {
    const createChartConfig = (datasets) => ({
        type: 'line',
        data: { labels: Array(60).fill(''), datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true } },
            scales: { y: { beginAtZero: true, suggestedMax: 100 }, x: { display: false } },
            elements: { line: { tension: 0.3 }, point: { radius: 0 } }
        }
    });

    const cpuCanvas = document.getElementById(`${prefix}cpuGraph`);
    if (cpuCanvas && !AppState.charts[`${prefix}cpu`]) {
        AppState.charts[`${prefix}cpu`] = new Chart(cpuCanvas.getContext('2d'), createChartConfig([
            { label: 'Uso da CPU (%)', data: Array(60).fill(0), borderColor: '#006600', backgroundColor: 'rgba(0, 100, 0, 0.1)', borderWidth: 2, fill: true }
        ]));
    }

    const memoryCanvas = document.getElementById(`${prefix}memoryGraph`);
    if (memoryCanvas && !AppState.charts[`${prefix}memory`]) {
        AppState.charts[`${prefix}memory`] = new Chart(memoryCanvas.getContext('2d'), createChartConfig([
            { label: 'Uso de Memória (%)', data: Array(60).fill(0), borderColor: '#ff6384', backgroundColor: 'rgba(255, 99, 132, 0.1)', borderWidth: 2, fill: true }
        ]));
    }

    const networkCanvas = document.getElementById(`${prefix}networkGraph`);
    if (networkCanvas && !AppState.charts[`${prefix}network`]) {
        AppState.charts[`${prefix}network`] = new Chart(networkCanvas.getContext('2d'), createChartConfig([
            { label: 'Upload (KB/s)', data: Array(60).fill(0), borderColor: '#36a2eb', backgroundColor: 'rgba(54, 162, 235, 0.1)', borderWidth: 2, fill: true },
            { label: 'Download (KB/s)', data: Array(60).fill(0), borderColor: '#cc65fe', backgroundColor: 'rgba(204, 101, 254, 0.1)', borderWidth: 2, fill: true }
        ]));
        AppState.charts[`${prefix}network`].options.scales.y.suggestedMax = null;
    }
}

export function updateChart(chart, newValue) {
    if (!chart) return;
    chart.data.datasets[0].data.push(newValue);
    chart.data.datasets[0].data.shift();
    chart.update('quiet');
}

export function updateDualChart(chart, uploadValue, downloadValue) {
    if (!chart) return;
    chart.data.datasets[0].data.push(uploadValue);
    chart.data.datasets[0].data.shift();
    chart.data.datasets[1].data.push(downloadValue);
    chart.data.datasets[1].data.shift();
    chart.update('quiet');
}

