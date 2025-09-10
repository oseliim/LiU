import { initCharts } from './modules/charts.js';
import { setupMetricIconClicks, setupSseStatusMonitoring } from './modules/monitoring.js';
import { attachIpRangeHandler, setupBackToServer } from './modules/ipRange.js';
import { setupCommandButtons, setupCommandForms } from './modules/commands.js';
import { setupSchedule, setupScheduleViewer } from './modules/schedule.js';

document.addEventListener('DOMContentLoaded', function() {
    const ipRangeForm = document.getElementById('ip-range-form');
    const monitoringWrapper = document.getElementById('monitoring-wrapper');
    const startButton = document.getElementById('startButton');

    initCharts();
    setupMetricIconClicks();
    setupSseStatusMonitoring(startButton);
    attachIpRangeHandler(ipRangeForm, monitoringWrapper);
    setupBackToServer();
    setupCommandButtons();
    setupCommandForms();
    setupSchedule();
    setupScheduleViewer();
});

