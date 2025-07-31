document.addEventListener('DOMContentLoaded', function() {
    
    // --- VARIÁVEIS GLOBAIS ---
    let monitoringInterval;
    const charts = {};
    let activeView = 'server';
    let activeClientIp = null;

    // --- ELEMENTOS DA UI ---
    const ipRangeForm = document.getElementById('ip-range-form');
    const monitoringWrapper = document.getElementById('monitoring-wrapper');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');

    // --- FUNÇÕES DE ATUALIZAÇÃO DE DADOS (sem alterações) ---
    async function fetchData(endpoint, body = {}) {
        // ... (código existente sem alterações)
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                throw new Error(`Erro na rede: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Falha ao buscar dados de ${endpoint}:`, error);
        }
    }
    async function updateCpuInfo() {
        // ... (código existente sem alterações)
        const isClient = activeView === 'client';
        const prefix = isClient ? 'client-' : '';
        const endpoint = isClient ? `/client-cpu-info` : '/cpu-info';
        const data = await fetchData(endpoint, { ip: activeClientIp });
        if (!data) return;

        const setText = (id, text) => {
            const el = document.getElementById(prefix + id);
            if (el) el.textContent = text;
        };

        setText('cpu-processor', data.processor);
        setText('cpu-cores', data.physical_cores);
        setText('cpu-threads', data.total_threads);
        setText('cpu-usage', data.overall_usage);
        setText('cpu-frequency', data.current_frequency);
        
        const usageValue = parseFloat(data.overall_usage) || 0;
        updateChart(charts[prefix + 'cpu'], usageValue);
    }
    async function updateMemoryInfo() {
        // ... (código existente sem alterações)
        const isClient = activeView === 'client';
        const prefix = isClient ? 'client-' : '';
        const endpoint = isClient ? `/client-memory-info` : '/memory-info';
        const data = await fetchData(endpoint, { ip: activeClientIp });
        if (!data) return;

        const setText = (id, text) => {
            const el = document.getElementById(prefix + id);
            if (el) el.textContent = text;
        };

        setText('mem-total', data.total);
        setText('mem-used', `${data.used} (${data.percent}%)`);
        setText('mem-available', data.available);
        
        updateChart(charts[prefix + 'memory'], data.percent);
    }
    async function updateDiskInfo() {
        // ... (código existente sem alterações)
        const endpoint = '/disk-info';
        const data = await fetchData(endpoint, { ip: activeClientIp });
        if (!data) return;

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
    async function updateNetworkInfo() {
        // ... (código existente sem alterações)
        const isClient = activeView === 'client';
        const prefix = isClient ? 'client-' : '';
        const endpoint = isClient ? `/client-network-info` : '/network-info';
        const data = await fetchData(endpoint, { ip: activeClientIp });
        if (!data) return;

        const setText = (id, text) => {
            const el = document.getElementById(prefix + id);
            if (el) el.textContent = text;
        };

        setText('net-upload', data.upload);
        setText('net-download', data.download);

        const uploadValue = parseFloat(data.upload) || 0;
        const downloadValue = parseFloat(data.download) || 0;
        updateDualChart(charts[prefix + 'network'], uploadValue, downloadValue);
    }

    // --- LÓGICA DE MONITORAMENTO E GRÁFICOS (sem alterações) ---
    const updateFunctions = {
        'cpu': updateCpuInfo,
        'memory': updateMemoryInfo,
        'disk': updateDiskInfo,
        'network': updateNetworkInfo,
        'client-cpu': updateCpuInfo,
        'client-memory': updateMemoryInfo,
        'client-network': updateNetworkInfo
    };
    function startMonitoring(metric) {
        // ... (código existente sem alterações)
        clearInterval(monitoringInterval);
        
        const updateFn = updateFunctions[metric];
        if (!updateFn) return;

        updateFn();
        monitoringInterval = setInterval(updateFn, 2500);
    }
    function initCharts(prefix = '') {
        // ... (código existente sem alterações)
        const createChartConfig = (datasets) => ({
            type: 'line',
            data: {
                labels: Array(60).fill(''),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true } },
                scales: {
                    y: { beginAtZero: true, suggestedMax: 100 },
                    x: { display: false }
                },
                elements: { line: { tension: 0.3 }, point: { radius: 0 } }
            }
        });

        const cpuCanvas = document.getElementById(`${prefix}cpuGraph`);
        if (cpuCanvas && !charts[`${prefix}cpu`]) {
            charts[`${prefix}cpu`] = new Chart(cpuCanvas.getContext('2d'), createChartConfig([{
                label: 'Uso da CPU (%)', data: Array(60).fill(0), borderColor: '#006600',
                backgroundColor: 'rgba(0, 100, 0, 0.1)', borderWidth: 2, fill: true
            }]));
        }

        const memoryCanvas = document.getElementById(`${prefix}memoryGraph`);
        if (memoryCanvas && !charts[`${prefix}memory`]) {
            charts[`${prefix}memory`] = new Chart(memoryCanvas.getContext('2d'), createChartConfig([{
                label: 'Uso de Memória (%)', data: Array(60).fill(0), borderColor: '#ff6384',
                backgroundColor: 'rgba(255, 99, 132, 0.1)', borderWidth: 2, fill: true
            }]));
        }
        
        const networkCanvas = document.getElementById(`${prefix}networkGraph`);
        if (networkCanvas && !charts[`${prefix}network`]) {
            charts[`${prefix}network`] = new Chart(networkCanvas.getContext('2d'), createChartConfig([
                { label: 'Upload (KB/s)', data: Array(60).fill(0), borderColor: '#36a2eb', backgroundColor: 'rgba(54, 162, 235, 0.1)', borderWidth: 2, fill: true },
                { label: 'Download (KB/s)', data: Array(60).fill(0), borderColor: '#cc65fe', backgroundColor: 'rgba(204, 101, 254, 0.1)', borderWidth: 2, fill: true }
            ]));
            charts[`${prefix}network`].options.scales.y.suggestedMax = null;
        }
    }
    function updateChart(chart, newValue) {
        // ... (código existente sem alterações)
        if (!chart) return;
        chart.data.datasets[0].data.push(newValue);
        chart.data.datasets[0].data.shift();
        chart.update('quiet');
    }
    function updateDualChart(chart, uploadValue, downloadValue) {
        // ... (código existente sem alterações)
        if (!chart) return;
        chart.data.datasets[0].data.push(uploadValue);
        chart.data.datasets[0].data.shift();
        chart.data.datasets[1].data.push(downloadValue);
        chart.data.datasets[1].data.shift();
        chart.update('quiet');
    }
    
    // --- LÓGICA NOVA PARA CONFIGURAÇÃO DA FAIXA DE IP ---

    if (ipRangeForm) {
        ipRangeForm.addEventListener('submit', handleIpRangeSubmit);
    }

    async function handleIpRangeSubmit(event) {
        event.preventDefault();
        const input = document.getElementById('ip-range-input');
        const range = input.value.trim();
        
        // Validação simples
        if (!range.includes('-') || range.split('.').length < 4) {
            alert('Formato da faixa de IP inválido. Use o formato: "IP_INICIAL - IP_FINAL"');
            return;
        }
        
        const submitButton = ipRangeForm.querySelector('button');
        submitButton.disabled = true;
        submitButton.textContent = 'Configurando...';
        
        try {
            // Envia a faixa para o backend para criar os arquivos
            const response = await fetch('/setup-range', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ range: range })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro no servidor');
            }
            
            // Se a configuração no backend foi bem sucedida
            generateMachineButtons(range); // Cria os botões na UI
            
            // Esconde o formulário e mostra a área de monitoramento
            ipRangeForm.classList.add('is-hidden');
            monitoringWrapper.classList.remove('is-hidden');

        } catch (error) {
            alert(`Falha ao configurar o laboratório: ${error.message}`);
            submitButton.disabled = false;
            submitButton.textContent = 'Confirmar';
        }
    }

    function generateMachineButtons(range) {
        const [startIp, endIp] = range.split(' - ').map(s => s.trim());
        const ipPrefix = startIp.substring(0, startIp.lastIndexOf('.') + 1);
        const startOctet = parseInt(startIp.split('.')[3]);
        const endOctet = parseInt(endIp.split('.')[3]);

        const container = document.querySelector('.ip-buttons-container');
        if (!container) return;
        container.innerHTML = ''; // Limpa botões antigos se houver

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

    // --- EVENT LISTENERS E LÓGICA EXISTENTE (com pequenas adaptações) ---
    
    // ... (função executeScript existente sem alterações)
    const metricIcons = document.querySelectorAll('.metric-icon');
    metricIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const parentMenu = this.closest('.server-info-container');
            parentMenu.querySelectorAll('.metric-icon').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            parentMenu.querySelectorAll('.info-section').forEach(section => {
                section.classList.remove('active');
            });
            
            const metric = this.getAttribute('data-metric');
            const infoSection = document.getElementById(`${metric}-info`);
            if (infoSection) {
                infoSection.classList.add('active');
            }
            
            const defaultMessage = parentMenu.querySelector('.info-default');
            if(defaultMessage) {
                defaultMessage.style.display = 'none';
            }
            
            startMonitoring(metric);
        });
    });

    const turnOnBtn = document.getElementById('btn-ligar');
    const turnOffBtn = document.getElementById('btn-desligar');
    const turnOffOneBtn = document.getElementById('client-btn-desligar');

    let outputDiv;
    if (turnOnBtn || turnOffBtn) {
        outputDiv = document.createElement('div');
        outputDiv.className = 'script-output';
        const commandBox = document.querySelector('.box.mt-4');
        if (commandBox) {
            commandBox.parentNode.insertBefore(outputDiv, commandBox.nextSibling);
        } else {
            document.querySelector('.main-content').appendChild(outputDiv);
        }
    }
    

    function executeScript(endpoint, body = null) {
        if (!outputDiv) return;
        outputDiv.innerHTML = '<p>Executando, aguarde...</p>';

        const fetchOptions = {
            method: 'POST',
            headers: {}
        };

        if (body) {
            fetchOptions.headers['Content-Type'] = 'application/json';
            fetchOptions.body = JSON.stringify(body);
        }

        fetch(endpoint, fetchOptions)
        .then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            outputDiv.innerHTML = ''; // Limpa antes de mostrar a saída real
            
            function readChunk() {
                reader.read().then(({value, done}) => {
                    if (done) return;
                    outputDiv.innerHTML += decoder.decode(value, {stream: true}).replace(/\n/g, '<br>');
                    outputDiv.scrollTop = outputDiv.scrollHeight;
                    readChunk();
                });
            }
            readChunk();
        })
        .catch(error => {
            if(outputDiv) outputDiv.innerHTML += `<p style='color:red;'>Erro: ${error.message}</p>`;
        });
    }

    if (turnOnBtn) {
        turnOnBtn.addEventListener('click', () => executeScript('/turn_on'));
    }
    if (turnOffBtn) {
        turnOffBtn.addEventListener('click', () => executeScript('/turn_off'));
    }
    if (turnOffOneBtn) {
        turnOffOneBtn.addEventListener('click', () => {
            if (activeClientIp) {
                console.log(`Sending turn off command to: ${activeClientIp}`);
                // Call the modified function with the endpoint and the IP in the body
                executeScript('/turn_off_one', { ip: activeClientIp });
            } else {
                alert("Erro: Nenhum IP de cliente ativo selecionado.");
            }
        });
    }

    const commandForm = document.getElementById('commandForm');
    if (commandForm) {
        commandForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const commandInput = document.getElementById('commandInput');
            if (!commandInput || !commandInput.value) {
                alert('Por favor, digite um comando.');
                return;
            }
            
            const command = commandInput.value;
            
            if (!outputDiv) return;

            outputDiv.innerHTML = `<p>Executando comando: ${command}...</p>`;
            
            fetch('/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ executed_command: command })
            })
            .then(response => {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                outputDiv.innerHTML = '';

                function readChunk() {
                    reader.read().then(({value, done}) => {
                        if (done) return;
                        outputDiv.innerHTML += decoder.decode(value, {stream: true}).replace(/\n/g, '<br>');
                        outputDiv.scrollTop = outputDiv.scrollHeight;
                        readChunk();
                    });
                }
                readChunk();
            })
            .catch(error => {
                if(outputDiv) outputDiv.innerHTML += `<p style='color:red;'>Erro de rede: ${error.message}</p>`;
            });

            commandInput.value = '';
        });
    }
    
    // --- Funções de gerenciamento dos PCs (showClientMenu, etc.) ---
    const serverInfoBox = document.querySelector('.serverInfo-box');
    const clientMenuBox = document.getElementById('clientMenu-box');
    const clientMenuTitle = document.getElementById('client-menu-title');
    const backToServerInfoBtn = document.getElementById('back-to-server-info');
    // ... (função showClientMenu, showServerInfo, etc. existentes sem alterações)
    function showClientMenu(event) {
        const button = event.currentTarget;
        activeClientIp = button.getAttribute('ip');
        const pcLabel = button.querySelector('.label').textContent;

        activeView = 'client';

    // 1. Fade the current title out
    clientMenuTitle.style.opacity = '0';

    // 2. Wait for the fade-out animation to finish (300ms)
    setTimeout(() => {
        // 3. Change the text while it's invisible
        clientMenuTitle.textContent = `${pcLabel} (${activeClientIp})`;

        // 4. Fade the new title back in
        clientMenuTitle.style.opacity = '1';
    }, 300); // IMPORTANT: This time must match the CSS transition duration

    initCharts('client-');

        serverInfoBox.style.opacity = '0';
        setTimeout(() => {
            serverInfoBox.classList.add('is-hidden');
            clientMenuBox.classList.remove('is-hidden');
            
            setTimeout(() => {
                clientMenuBox.style.opacity = '1';
            }, 10);

        }, 300);
    }

    function showServerInfo() {
        activeView = 'server';
        activeClientIp = null;
        clearInterval(monitoringInterval);

        clientMenuBox.style.opacity = '0';
        setTimeout(() => {
            clientMenuBox.classList.add('is-hidden');
            serverInfoBox.classList.remove('is-hidden');
            
            // Reactivate any previously active server monitoring
            const activeServerMetric = serverInfoBox.querySelector('.metric-icon.active');
            if (activeServerMetric) {
                startMonitoring(activeServerMetric.getAttribute('data-metric'));
            }

            setTimeout(() => {
                serverInfoBox.style.opacity = '1';
            }, 10);

        }, 300);
    }
    if (backToServerInfoBtn) {
        backToServerInfoBtn.addEventListener('click', showServerInfo);
    }
    
    // --- Funções de monitoramento de status (ON/OFF) ---
    let eventSource;
    // ... (funções startMachineMonitoring, stopMachineMonitoring existentes sem alterações)
    function startMachineMonitoring() {
        if (eventSource) {
            eventSource.close();
        }

        startButton.disabled = true;
        stopButton.disabled = false;
        
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
                if (status === 'ON') {
                    machineButton.classList.add('status-on');
                } else {
                    machineButton.classList.add('status-off');
                }
            }
        };

        eventSource.onerror = function() {
            console.log("Monitoring stream closed by server. Re-enabling start button.");
            eventSource.close();
            startButton.disabled = false;
            stopButton.disabled = true;
        };
    }

    function stopMachineMonitoring() {
        if (eventSource) {
            eventSource.close();
            console.log("Monitoring stopped by user.");
            startButton.disabled = false;
            stopButton.disabled = true;
        }
    }
    
    if (startButton) {
        startButton.addEventListener('click', startMachineMonitoring);
    }
    if (stopButton) {
        stopButton.addEventListener('click', stopMachineMonitoring);
    }

    // --- INICIALIZAÇÃO DA PÁGINA ---
    initCharts(); // Initialize server charts on load
});