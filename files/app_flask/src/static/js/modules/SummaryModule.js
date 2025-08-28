/**
 * SummaryModule - Módulo para gerenciar resumo e aplicação de configurações
 * 
 * Responsabilidades:
 * - Gerar resumo das configurações
 * - Aplicar configurações no servidor
 * - Gerenciar progresso de aplicação
 * - Exportar configurações
 */
class SummaryModule {
    constructor() {
        this.elements = {
            summaryContent: document.getElementById('summary-content'),
            confirmSummaryBtn: document.getElementById('confirm-summary-btn'),
            applyProgressBar: document.getElementById('apply-progress-bar'),
            applyOutput: document.getElementById('apply-output'),
            exportConfigBtn: document.getElementById('export-config-btn'),
            restartWizardBtn: document.getElementById('restart-wizard-btn'),
            exportConfigBtnFinal: document.getElementById('export-config-btn-final'),
            restartWizardBtnFinal: document.getElementById('restart-wizard-btn-final')
        };
        
        this.bindEvents();
    }

    /**
     * Vincula eventos específicos do módulo de resumo
     */
    bindEvents() {
        if (this.elements.confirmSummaryBtn) {
            this.elements.confirmSummaryBtn.addEventListener('click', () => this.handleConfirmSummary());
        }

        if (this.elements.exportConfigBtn) {
            this.elements.exportConfigBtn.addEventListener('click', () => this.exportConfig());
        }

        if (this.elements.restartWizardBtn) {
            this.elements.restartWizardBtn.addEventListener('click', () => this.restartWizard());
        }

        if (this.elements.exportConfigBtnFinal) {
            this.elements.exportConfigBtnFinal.addEventListener('click', () => this.exportConfig());
        }

        if (this.elements.restartWizardBtnFinal) {
            this.elements.restartWizardBtnFinal.addEventListener('click', () => this.restartWizard());
        }
    }

    /**
     * Popula o resumo com dados do formulário
     */
    populateSummary() {
        const wizardManager = window.wizardManager;
        if (!wizardManager) return;

        const formData = wizardManager.getFormData();
        
        // Atualizar dados de rede
        this.updateNetworkData(formData);
        
        // Atualizar dados da imagem
        this.updateImageData(formData);
        
        // Gerar HTML do resumo
        this.elements.summaryContent.innerHTML = this.generateSummaryHTML(formData);
        
        if (window.updateTranslations) {
            window.updateTranslations();
        }
        
        this.bindEditButtons();
    }

    /**
     * Atualiza dados de rede no formData
     * @param {Object} formData - Dados do formulário
     */
    updateNetworkData(formData) {
        const networkFields = ['network-interface', 'server-ip', 'netmask', 'gateway', 'dns-server', 'dhcp-range'];
        const fieldMappings = {
            'network-interface': 'interface',
            'server-ip': 'serverIp',
            'netmask': 'netmask',
            'gateway': 'gateway',
            'dns-server': 'dnsServer',
            'dhcp-range': 'dhcpRange'
        };

        networkFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                const mapping = fieldMappings[fieldId];
                if (mapping) {
                    formData.network[mapping] = element.value;
                }
            }
        });
    }

    /**
     * Atualiza dados da imagem no formData
     * @param {Object} formData - Dados do formulário
     */
    updateImageData(formData) {
        const osSelector = document.getElementById('os-selector');
        if (osSelector) {
            formData.image.version = osSelector.value;
            if (formData.image.version === 'linux') {
                const ubuntuVersion = document.getElementById('ubuntu-version');
                if (ubuntuVersion) {
                    formData.image.version = ubuntuVersion.value;
                }
            }
        }

        // Ambiente gráfico padrão é GDM
        formData.image.desktopEnvironment = 'gdm';


    }

    /**
     * Gera HTML do resumo
     * @param {Object} formData - Dados do formulário
     * @returns {string} - HTML do resumo
     */
    generateSummaryHTML(formData) {
        const usersHtml = this.generateUsersHTML(formData.users);
        const soResumo = this.getSystemOSDisplay(formData.image.version);
        
        return `
            <h6 data-translate="summary_network_title">Configuração de Rede</h6>
            <table class="table table-sm">
                <tr><th data-translate="summary_network_interface">Interface:</th><td>${formData.network.interface || 'N/A'} <button class="btn btn-sm btn-link edit-step-btn" data-edit-step="2" data-translate="edit_button">Editar</button></td></tr>
                <tr><th data-translate="summary_server_ip">IP do Servidor:</th><td>${formData.network.serverIp || 'N/A'}</td></tr>
                <tr><th data-translate="summary_netmask">Máscara de Rede:</th><td>${formData.network.netmask || 'N/A'}</td></tr>
                <tr><th data-translate="summary_gateway">Gateway:</th><td>${formData.network.gateway || 'N/A'}</td></tr>
                <tr><th data-translate="summary_dns">DNS:</th><td>${formData.network.dnsServer || 'N/A'}</td></tr>
                <tr><th data-translate="summary_dhcp_range">Faixa DHCP:</th><td>${formData.network.dhcpRange || 'N/A'}</td></tr>
            </table>
            <hr>
            <h6 data-translate="summary_image_title">Configuração da Imagem</h6>
            <table class="table table-sm">
                <tr><th data-translate="summary_ubuntu_version">Sistema Operacional:</th><td>${soResumo} <button class="btn btn-sm btn-link edit-step-btn" data-edit-step="3" data-translate="edit_button">Editar</button></td></tr>
                <tr><th data-translate="summary_desktop_env">Ambiente Gráfico:</th><td>GDM (GNOME Display Manager) - Padrão</td></tr>
                <tr><th data-translate="summary_additional_packages">Pacotes Adicionais:</th><td>${formData.image.additionalPackages || 'Nenhum'}</td></tr>

            </table>
            <hr>
            <h6 data-translate="summary_users_title">Usuários</h6>
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Nome de Usuário</th>
                        <th>Senha</th>
                    </tr>
                </thead>
                <tbody>
                    ${usersHtml || '<tr><td colspan="3">Nenhum usuário configurado</td></tr>'}
                </tbody>
            </table>
            <button class="btn btn-sm btn-link edit-step-btn" data-edit-step="3.5" data-translate="edit_button">Editar Usuários</button>
        `;
    }

    /**
     * Gera HTML da tabela de usuários
     * @param {Array} users - Lista de usuários
     * @returns {string} - HTML da tabela de usuários
     */
    generateUsersHTML(users) {
        if (!users || users.length === 0) return '';
        
        return users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${'•'.repeat(user.password.length)}</td>
            </tr>
        `).join('');
    }

    /**
     * Obtém texto de exibição do sistema operacional
     * @param {string} version - Versão do sistema
     * @returns {string} - Texto de exibição
     */
    getSystemOSDisplay(version) {
        if (version === 'windows') {
            return 'Windows (Virtualizado)';
        } else if (version === 'bionic') {
            return 'Ubuntu 18.04 (Bionic Beaver)';
        } else if (version === 'jammy') {
            return 'Ubuntu 22.04 (Jammy Jellyfish)';
        }
        return version || 'N/A';
    }

    /**
     * Vincula botões de edição
     */
    bindEditButtons() {
        document.querySelectorAll('.edit-step-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const stepToEdit = parseFloat(e.target.dataset.editStep);
                const wizardManager = window.wizardManager;
                if (wizardManager) {
                    wizardManager.showStep(stepToEdit);
                }
            });
        });
    }

    /**
     * Manipula confirmação do resumo
     */
    async handleConfirmSummary() {
        this.populateSummary();
        
        const wizardManager = window.wizardManager;
        if (wizardManager) {
            wizardManager.showStep(5);
        }
        
        this.showProgressBar();
        this.showApplyOutput();
        
        try {
            await this.applyConfigurations();
        } catch (error) {
            this.handleApplyError(error);
        }
    }

    /**
     * Mostra barra de progresso
     */
    showProgressBar() {
        if (this.elements.applyProgressBar) {
            this.elements.applyProgressBar.style.width = '0%';
            this.elements.applyProgressBar.textContent = '0%';
            this.elements.applyProgressBar.closest('.progress').style.display = 'flex';
        }
    }

    /**
     * Mostra área de saída
     */
    showApplyOutput() {
        if (this.elements.applyOutput) {
            this.elements.applyOutput.innerHTML = '<p>Enviando configurações ao servidor e iniciando scripts...</p>';
            this.elements.applyOutput.style.display = 'block';
        }
    }

    /**
     * Aplica configurações no servidor
     */
    async applyConfigurations() {
        const wizardManager = window.wizardManager;
        if (!wizardManager) return;

        const formData = wizardManager.getFormData();
        
        // Preparar payload
        const payload = this.preparePayload(formData);
        
        // Configurar usuários primeiro
        await this.configureUsers(formData.users);
        
        // Aplicar outras configurações
        await this.applyAllConfigurations(payload);
    }

    /**
     * Prepara payload para envio
     * @param {Object} formData - Dados do formulário
     * @returns {Object} - Payload preparado
     */
    preparePayload(formData) {
        return {
            network: { ...formData.network },
            image: {
                version: formData.image.version,
                desktopEnvironment: formData.image.desktopEnvironment,
                additionalPackages: formData.image.additionalPackages
            },
            users: formData.users
        };
    }

    /**
     * Configura usuários no LTSP
     * @param {Array} users - Lista de usuários
     */
    async configureUsers(users) {
        const usersResponse = await fetch('/run_montar_conf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ users: users })
        });

        if (!usersResponse.ok) {
            throw new Error('Falha ao configurar usuários no LTSP');
        }
    }

    /**
     * Aplica todas as configurações
     * @param {Object} payload - Payload das configurações
     */
    async applyAllConfigurations(payload) {
        const response = await fetch('/run_all_configurations', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            this.elements.applyOutput.innerHTML += `<p style="color:red;">Erro na execução da configuração: ${response.status} ${response.statusText}</p>`;
            return;
        }

        await this.handleConfigurationResponse(response);
    }

    /**
     * Manipula resposta da configuração
     * @param {Response} response - Resposta da requisição
     */
    async handleConfigurationResponse(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let progress = 0;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            this.elements.applyOutput.innerHTML = buffer;
            this.elements.applyOutput.scrollTop = this.elements.applyOutput.scrollHeight;

            // Detecta o marcador de finalização do backend
            if (buffer.includes("id='install-finished'")) {
                this.showFinalStep();
                break;
            }
            
            // Verifica se o buffer contém a mensagem de sucesso
            if (buffer.includes("Configurações LTSP aplicadas com sucesso!")) {
                progress = 100;
                this.showFinalStep();
            } else {
                progress = Math.min(95, progress + 5);
            }

            this.updateProgressBar(progress);
        }
    }

    /**
     * Atualiza barra de progresso
     * @param {number} progress - Progresso atual
     */
    updateProgressBar(progress) {
        if (this.elements.applyProgressBar) {
            this.elements.applyProgressBar.style.width = `${progress}%`;
            this.elements.applyProgressBar.textContent = `${progress}%`;
        }
    }

    /**
     * Mostra step final
     */
    showFinalStep() {
        const wizardManager = window.wizardManager;
        if (wizardManager) {
            wizardManager.showStep(6);
        }
    }

    /**
     * Manipula erro de aplicação
     * @param {Error} error - Erro ocorrido
     */
    handleApplyError(error) {
        this.elements.applyOutput.innerHTML += `<p style='color:red;'>Erro inesperado durante a aplicação das configurações: ${error.message}</p>`;
    }

    /**
     * Exporta configurações
     */
    exportConfig() {
        const wizardManager = window.wizardManager;
        if (!wizardManager) return;

        const configData = JSON.stringify(wizardManager.getFormData(), null, 2);
        const blob = new Blob([configData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ltsp_config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Reinicia o wizard
     */
    restartWizard() {
        window.location.reload();
    }
}

// Exportar para uso global
window.SummaryModule = SummaryModule; 