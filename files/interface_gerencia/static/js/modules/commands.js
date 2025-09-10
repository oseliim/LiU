import { AppState } from './AppState.js';

function streamToOutput(endpoint, body, outputDiv, preMessage) {
    if (!outputDiv) return;
    outputDiv.innerHTML = preMessage || '<p>Executando, aguarde...</p>';
    const fetchOptions = { method: 'POST', headers: {} };
    if (body) {
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(body);
    }
    fetch(endpoint, fetchOptions)
        .then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            outputDiv.innerHTML = '';
            function readChunk() {
                reader.read().then(({ value, done }) => {
                    if (done) return;
                    outputDiv.innerHTML += decoder.decode(value, { stream: true }).replace(/\n/g, '<br>');
                    outputDiv.scrollTop = outputDiv.scrollHeight;
                    readChunk();
                });
            }
            readChunk();
        })
        .catch(error => {
            if (outputDiv) outputDiv.innerHTML += `<p style='color:red;'>Erro: ${error.message}</p>`;
        });
}

export function setupCommandButtons() {
    const turnOnBtn = document.getElementById('btn-ligar');
    const turnOffBtn = document.getElementById('btn-desligar');
    const turnOffOneBtn = document.getElementById('client-btn-desligar');
    const turnOnNetBtn = document.getElementById('btn-ligar-internet');
    const turnOffNetBtn = document.getElementById('btn-desligar-internet');
    let outputDiv = document.querySelector('.script-output');
    if (turnOnBtn || turnOffBtn) {
        const commandBoxes = document.querySelectorAll('.box.mt-4');
        const commandBox = commandBoxes && commandBoxes[1];
        if (commandBox) {
            commandBox.parentNode.insertBefore(outputDiv, commandBox.nextSibling);
        }
    }
    if (turnOnBtn) turnOnBtn.addEventListener('click', () => streamToOutput('/turn_on', null, outputDiv));
    if (turnOffBtn) turnOffBtn.addEventListener('click', () => streamToOutput('/turn_off', null, outputDiv));
    if (turnOffOneBtn) {
        turnOffOneBtn.addEventListener('click', () => {
            if (AppState.activeClientIp) {
                streamToOutput('/turn_off_one', { ip: AppState.activeClientIp }, outputDiv);
            } else {
                alert('Erro: Nenhum IP de cliente ativo selecionado.');
            }
        });
    }
    if (turnOffNetBtn) turnOffNetBtn.addEventListener('click', () => streamToOutput('/turn_off_internet', null, outputDiv));
    if (turnOnNetBtn) turnOnNetBtn.addEventListener('click', () => streamToOutput('/turn_on_internet', null, outputDiv));
}

export function setupCommandForms() {
    const commandForm = document.getElementById('commandForm');
    const commandFormIndividual = document.getElementById('commandForm-individual');
    let outputDiv = document.querySelector('.script-output');
    if (commandForm) {
        commandForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const commandInput = document.getElementById('commandInput');
            if (!commandInput || !commandInput.value) {
                alert('Por favor, digite um comando.');
                return;
            }
            const command = commandInput.value;
            streamToOutput('/execute', { executed_command: command }, outputDiv, `<p>Executando comando: ${command}...</p>`);
            commandInput.value = '';
        });
    }
    if (commandFormIndividual) {
        commandFormIndividual.addEventListener('submit', function(event) {
            event.preventDefault();
            const commandInput = document.getElementById('commandInput-individual');
            if (!commandInput || !commandInput.value) {
                alert('Por favor, digite um comando.');
                return;
            }
            const command = commandInput.value;
            streamToOutput('/execute_one', { executed_command: command, ip: AppState.activeClientIp }, outputDiv, `<p>Executando comando: ${command} na máquina ${AppState.activeClientIp}...</p>`);
            commandInput.value = '';
        });
    }
}

