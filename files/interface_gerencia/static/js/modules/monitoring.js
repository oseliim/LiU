import { AppState, setMonitoringInterval, clearMonitoringInterval } from './AppState.js';
import { updateFunctions } from './metrics.js';

export function startMonitoring(metric) {
    clearMonitoringInterval();
    const updateFn = updateFunctions[metric];
    if (!updateFn) return;
    updateFn();
    const id = setInterval(updateFn, 2500);
    setMonitoringInterval(id);
}

export function setupMetricIconClicks() {
    const metricIcons = document.querySelectorAll('.metric-icon');
    metricIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const parentMenu = this.closest('.server-info-container');
            parentMenu.querySelectorAll('.metric-icon').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            parentMenu.querySelectorAll('.info-section').forEach(section => section.classList.remove('active'));
            const metric = this.getAttribute('data-metric');
            const infoSection = document.getElementById(`${metric}-info`);
            if (infoSection) infoSection.classList.add('active');
            const defaultMessage = parentMenu.querySelector('.info-default');
            if (defaultMessage) defaultMessage.style.display = 'none';
            startMonitoring(metric);
        });
    });
}

export function setupSseStatusMonitoring(startButton) {
    let eventSource;
    function startMachineMonitoring() {
        if (eventSource) eventSource.close();
        if (startButton) startButton.disabled = true;
        document.querySelectorAll('.ip-button').forEach(btn => {
            btn.classList.remove('status-on', 'status-off');
            btn.classList.add('status-unknown');
        });
        eventSource = new EventSource('/start-monitoring');
        eventSource.onmessage = function(event) {
            const data = event.data;
            const parts = data.split(' ');
            if (parts.length < 2) return;
            const ip = parts[0];
            const status = parts[1].toUpperCase();
            const machineButton = document.querySelector(`.ip-button[ip="${ip}"]`);
            if (machineButton) {
                machineButton.classList.remove('status-unknown', 'status-on', 'status-off');
                machineButton.classList.add(status === 'ON' ? 'status-on' : 'status-off');
            }
        };
        eventSource.onerror = function() {
            console.log('Monitoring stream closed by server. Re-enabling start button.');
            eventSource.close();
            if (startButton) startButton.disabled = false;
        };
    }
    if (startButton) startButton.addEventListener('click', startMachineMonitoring);
}

