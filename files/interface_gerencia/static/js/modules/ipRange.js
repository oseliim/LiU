import { setActiveClientIp, setActiveView, clearMonitoringInterval } from './AppState.js';
import { initCharts } from './charts.js';

export function attachIpRangeHandler(ipRangeForm, monitoringWrapper) {
    if (!ipRangeForm) return;
    ipRangeForm.addEventListener('submit', handleIpRangeSubmit);

    async function handleIpRangeSubmit(event) {
        event.preventDefault();
        const input = document.getElementById('ip-range-input');
        const range = input.value.trim();
        if (!range.includes('-') || range.split('.').length < 4) {
            alert('Formato da faixa de IP inválido. Use o formato: "IP_INICIAL - IP_FINAL"');
            return;
        }
        const submitButton = ipRangeForm.querySelector('button');
        submitButton.disabled = true;
        submitButton.textContent = 'Configurando...';
        try {
            const response = await fetch('/setup-range', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ range })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro no servidor');
            }
            generateMachineButtons(range);
            ipRangeForm.classList.add('is-hidden');
            monitoringWrapper.classList.remove('is-hidden');
        } catch (error) {
            alert(`Falha ao configurar o laboratório: ${error.message}`);
            submitButton.disabled = false;
            submitButton.textContent = 'Confirmar';
        }
    }
}

export function generateMachineButtons(range) {
    const [startIp, endIp] = range.split(' - ').map(s => s.trim());
    const ipPrefix = startIp.substring(0, startIp.lastIndexOf('.') + 1);
    const startOctet = parseInt(startIp.split('.')[3]);
    const endOctet = parseInt(endIp.split('.')[3]);
    const container = document.querySelector('.ip-buttons-container');
    if (!container) return;
    container.innerHTML = '';
    for (let i = startOctet; i <= endOctet; i++) {
        const currentIp = `${ipPrefix}${i}`;
        const button = document.createElement('div');
        button.className = 'ip-button btn d-flex flex-column align-items-center status-unknown';
        button.setAttribute('ip', currentIp);
        const icon = document.createElement('img');
        icon.className = 'icon';
        icon.src = '../static/img/pc_icon.svg';
        const label = document.createElement('label');
        label.className = 'label';
        label.textContent = `PC - ${i}`;
        button.appendChild(icon);
        button.appendChild(label);
        button.addEventListener('click', showClientMenu);
        container.appendChild(button);
    }
}

function showClientMenu(event) {
    const serverInfoBox = document.querySelector('.serverInfo-box');
    const clientMenuBox = document.getElementById('clientMenu-box');
    const clientMenuTitle = document.getElementById('client-menu-title');
    const button = event.currentTarget;
    setActiveClientIp(button.getAttribute('ip'));
    const pcLabel = button.querySelector('.label').textContent;
    setActiveView('client');
    clientMenuTitle.style.opacity = '0';
    setTimeout(() => {
        clientMenuTitle.textContent = `${pcLabel} (${button.getAttribute('ip')})`;
        clientMenuTitle.style.opacity = '1';
    }, 300);
    initCharts('client-');
    serverInfoBox.style.opacity = '0';
    setTimeout(() => {
        serverInfoBox.classList.add('is-hidden');
        clientMenuBox.classList.remove('is-hidden');
        setTimeout(() => { clientMenuBox.style.opacity = '1'; }, 10);
    }, 300);
}

export function setupBackToServer() {
    const backToServerInfoBtn = document.getElementById('back-to-server-info');
    const serverInfoBox = document.querySelector('.serverInfo-box');
    const clientMenuBox = document.getElementById('clientMenu-box');
    function showServerInfo() {
        setActiveView('server');
        setActiveClientIp(null);
        clearMonitoringInterval();
        clientMenuBox.style.opacity = '0';
        setTimeout(() => {
            clientMenuBox.classList.add('is-hidden');
            serverInfoBox.classList.remove('is-hidden');
            setTimeout(() => { serverInfoBox.style.opacity = '1'; }, 10);
        }, 300);
    }
    if (backToServerInfoBtn) backToServerInfoBtn.addEventListener('click', showServerInfo);
}

