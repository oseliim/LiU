/**
 * NetworkModule - Módulo para gerenciar configurações de rede
 * 
 * Responsabilidades:
 * - Carregar e exibir informações de rede
 * - Validar configurações de rede
 * - Gerenciar modo de edição de rede
 * - Salvar alterações de configuração
 */
class NetworkModule {
    constructor() {
        this.elements = {
            loading: document.getElementById("network-info-loading"),
            displayArea: document.getElementById("network-info-display-area"),
            editArea: document.getElementById("network-info-edit-area"),
            error: document.getElementById("network-info-error"),
            nextBtn: document.getElementById("step-2-next-btn"),
            toggleEditBtn: document.getElementById("toggle-network-edit-btn"),
            form: document.getElementById("network-form"),
            saveChangesBtn: document.getElementById("save-network-changes-btn")
        };
        
        this.bindEvents();
    }

    /**
     * Vincula eventos específicos do módulo de rede
     */
    bindEvents() {
        if (this.elements.toggleEditBtn) {
            this.elements.toggleEditBtn.addEventListener('click', () => this.toggleEditMode());
        }

        if (this.elements.saveChangesBtn) {
            this.elements.saveChangesBtn.addEventListener('click', () => this.saveNetworkChanges());
        }
    }

    /**
     * Carrega e exibe informações de rede do servidor
     */
    async loadAndDisplayNetworkInfo() {
        if (!this.validateElements()) {
            console.error("Elementos da UI da Etapa 2 não encontrados no DOM.");
            return;
        }

        this.showLoadingState();

        try {
            // Executar script de coleta de rede
            await this.executeNetworkCollection();
            
            // Buscar dados processados
            const networkData = await this.fetchParsedNetworkData();
            
            // Validar dados essenciais
            this.validateEssentialData(networkData);
            
            // Preencher interface
            this.populateDisplayArea(networkData);
            this.populateEditForm(networkData);
            this.updateFormData(networkData);
            
            this.showDisplayState();
            
        } catch (error) {
            this.handleError(error);
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Valida se todos os elementos necessários existem
     * @returns {boolean} - Se todos os elementos estão presentes
     */
    validateElements() {
        return this.elements.loading && 
               this.elements.displayArea && 
               this.elements.error && 
               this.elements.nextBtn;
    }

    /**
     * Mostra estado de carregamento
     */
    showLoadingState() {
        this.elements.loading.style.display = "block";
        this.elements.displayArea.style.display = "none";
        this.elements.editArea.style.display = "none";
        this.elements.error.style.display = "none";
        this.elements.error.innerHTML = "";
        this.elements.nextBtn.disabled = true;
        this.elements.toggleEditBtn.textContent = "Editar Configurações";
    }

    /**
     * Esconde estado de carregamento
     */
    hideLoadingState() {
        this.elements.loading.style.display = "none";
    }

    /**
     * Mostra estado de exibição
     */
    showDisplayState() {
        this.elements.displayArea.style.display = "block";
        this.elements.nextBtn.disabled = false;
    }

    /**
     * Executa script de coleta de rede
     */
    async executeNetworkCollection() {
        const collectResponse = await fetch("/run_network_info", { method: "POST" });
        if (!collectResponse.ok) {
            const errorText = await collectResponse.text();
            throw new Error(`Falha ao executar o script de coleta de rede: ${collectResponse.status} ${errorText}`);
        }
        
        const reader = collectResponse.body.getReader();
        while (true) {
            const { done } = await reader.read();
            if (done) break;
        }
    }

    /**
     * Busca dados de rede processados
     * @returns {Object} - Dados de rede
     */
    async fetchParsedNetworkData() {
        const parsedDataResponse = await fetch("/get_parsed_network_data", { method: "GET" });
        const networkData = await parsedDataResponse.json();

        if (!parsedDataResponse.ok || networkData.error) {
            throw new Error(networkData.error || `Falha ao buscar dados de rede processados: ${parsedDataResponse.status}`);
        }

        return networkData;
    }

    /**
     * Valida dados essenciais de rede
     * @param {Object} networkData - Dados de rede
     */
    validateEssentialData(networkData) {
        if (!networkData.ip_address || !networkData.netmask) {
            throw new Error("Dados de rede essenciais (IP/Máscara) não foram detectados. Verifique as configurações do servidor.");
        }
    }

    /**
     * Preenche área de exibição com dados de rede
     * @param {Object} networkData - Dados de rede
     */
    populateDisplayArea(networkData) {
        this.elements.displayArea.innerHTML = this.generateDisplayHTML(networkData);
        
        if (window.updateTranslations) {
            window.updateTranslations();
        }
    }

    /**
     * Gera HTML para exibição dos dados de rede
     * @param {Object} networkData - Dados de rede
     * @returns {string} - HTML gerado
     */
    generateDisplayHTML(networkData) {
        return `
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header"><strong data-translate="network_interface_label">Interface de Rede</strong></div>
                        <div class="card-body"><p class="card-text">${networkData.interface || "N/A"}</p></div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header"><strong data-translate="server_ip_label">Endereço IP</strong></div>
                        <div class="card-body"><p class="card-text">${networkData.ip_address || "N/A"}</p></div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header"><strong data-translate="netmask_label">Máscara de Rede</strong></div>
                        <div class="card-body"><p class="card-text">${networkData.netmask || "N/A"}</p></div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header"><strong data-translate="gateway_label">Gateway Padrão</strong></div>
                        <div class="card-body"><p class="card-text">${networkData.gateway || "N/A"}</p></div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header"><strong data-translate="dns_server_label">Servidores DNS</strong></div>
                        <div class="card-body"><p class="card-text">${networkData.dns_servers && networkData.dns_servers.length > 0 ? networkData.dns_servers.join(", ") : "N/A"}</p></div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header"><strong data-translate="dhcp_range_label">Faixa DHCP para LTSP</strong></div>
                        <div class="card-body"><p class="card-text"><strong>${networkData.dhcp_range_start || "N/A"}</strong> - <strong>${networkData.dhcp_range_end || "N/A"}</strong></p></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Preenche formulário de edição com dados de rede
     * @param {Object} networkData - Dados de rede
     */
    populateEditForm(networkData) {
        document.getElementById('network-interface').value = networkData.interface || "";
        document.getElementById('server-ip').value = networkData.ip_address || "";
        document.getElementById('netmask').value = networkData.netmask || "";
        document.getElementById('gateway').value = networkData.gateway || "";
        document.getElementById('dns-server').value = networkData.dns_servers && networkData.dns_servers.length > 0 ? networkData.dns_servers[0] : "";
        document.getElementById('dhcp-range').value = `${networkData.dhcp_range_start || ""} - ${networkData.dhcp_range_end || ""}`;
    }

    /**
     * Atualiza dados do formulário principal
     * @param {Object} networkData - Dados de rede
     */
    updateFormData(networkData) {
        const wizardManager = window.wizardManager;
        if (wizardManager) {
            wizardManager.updateFormData('network', {
                interface: networkData.interface,
                serverIp: networkData.ip_address,
                netmask: networkData.netmask,
                gateway: networkData.gateway,
                dnsServer: networkData.dns_servers && networkData.dns_servers.length > 0 ? networkData.dns_servers[0] : (networkData.gateway || ""),
                dhcpRangeStart: networkData.dhcp_range_start,
                dhcpRangeEnd: networkData.dhcp_range_end,
                dhcpRange: `${networkData.dhcp_range_start} - ${networkData.dhcp_range_end}`
            });
        }
    }

    /**
     * Manipula erros de carregamento
     * @param {Error} error - Erro ocorrido
     */
    handleError(error) {
        console.error("Erro ao carregar informações de rede:", error);
        this.elements.error.innerHTML = `
            <p data-translate="error_loading_network_info">Falha ao carregar informações de rede: ${error.message}</p>
            <p data-translate="error_loading_network_info_suggestion">Você pode tentar recarregar a página ou VOLTAR para corrigir e tentar novamente.</p>
        `;
        
        if (window.updateTranslations) {
            window.updateTranslations();
        }
        
        this.elements.error.style.display = "block";
        this.elements.nextBtn.disabled = true;
        this.elements.displayArea.style.display = "none";
    }

    /**
     * Alterna entre modo de exibição e edição
     */
    toggleEditMode() {
        if (this.elements.editArea.style.display === "none") {
            this.elements.displayArea.style.display = "none";
            this.elements.editArea.style.display = "block";
            this.elements.toggleEditBtn.textContent = "Mostrar Configurações";
            this.elements.nextBtn.disabled = true;
        } else {
            this.elements.displayArea.style.display = "block";
            this.elements.editArea.style.display = "none";
            this.elements.toggleEditBtn.textContent = "Editar Configurações";
        }
    }

    /**
     * Salva alterações de configuração de rede
     */
    saveNetworkChanges() {
        if (this.validateNetworkForm()) {
            this.updateFormDataFromEdit();
            this.updateDisplayFromFormData();
            this.showDisplayMode();
        }
    }

    /**
     * Atualiza dados do formulário a partir da edição
     */
    updateFormDataFromEdit() {
        const wizardManager = window.wizardManager;
        if (wizardManager) {
            const networkData = {
                serverIp: document.getElementById('server-ip').value,
                netmask: document.getElementById('netmask').value,
                gateway: document.getElementById('gateway').value,
                dnsServer: document.getElementById('dns-server').value
            };
            
            const dhcpRange = document.getElementById('dhcp-range').value;
            const rangeParts = dhcpRange.split('-').map(part => part.trim());
            if (rangeParts.length === 2) {
                networkData.dhcpRangeStart = rangeParts[0];
                networkData.dhcpRangeEnd = rangeParts[1];
                networkData.dhcpRange = dhcpRange;
            }
            
            wizardManager.updateFormData('network', networkData);
        }
    }

    /**
     * Atualiza exibição com dados do formulário
     */
    updateDisplayFromFormData() {
        const wizardManager = window.wizardManager;
        if (wizardManager) {
            const networkData = wizardManager.getFormData().network;
            
            this.elements.displayArea.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <div class="card mb-3">
                            <div class="card-header"><strong>Interface de Rede</strong></div>
                            <div class="card-body"><p class="card-text">${networkData.interface || "N/A"}</p></div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card mb-3">
                            <div class="card-header"><strong>Endereço IP</strong></div>
                            <div class="card-body"><p class="card-text">${networkData.serverIp || "N/A"}</p></div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="card mb-3">
                            <div class="card-header"><strong>Máscara de Rede</strong></div>
                            <div class="card-body"><p class="card-text">${networkData.netmask || "N/A"}</p></div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card mb-3">
                            <div class="card-header"><strong>Gateway Padrão</strong></div>
                            <div class="card-body"><p class="card-text">${networkData.gateway || "N/A"}</p></div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="card mb-3">
                            <div class="card-header"><strong>Servidores DNS</strong></div>
                            <div class="card-body"><p class="card-text">${networkData.dnsServer || "N/A"}</p></div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card mb-3 bg-light">
                            <div class="card-header"><strong>Faixa DHCP para LTSP</strong></div>
                            <div class="card-body"><p class="card-text"><strong>${networkData.dhcpRangeStart || "N/A"}</strong> - <strong>${networkData.dhcpRangeEnd || "N/A"}</strong></p></div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Mostra modo de exibição
     */
    showDisplayMode() {
        this.elements.displayArea.style.display = "block";
        this.elements.editArea.style.display = "none";
        this.elements.toggleEditBtn.textContent = "Editar Configurações";
        this.elements.nextBtn.disabled = false;
    }

    /**
     * Valida formulário de rede
     * @returns {boolean} - Se o formulário é válido
     */
    validateNetworkForm() {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const dhcpRangeRegex = /^(\d{1,3}\.){3}\d{1,3}\s*-\s*(\d{1,3}\.){3}\d{1,3}$/;
        
        const fields = {
            serverIp: document.getElementById('server-ip'),
            netmask: document.getElementById('netmask'),
            gateway: document.getElementById('gateway'),
            dnsServer: document.getElementById('dns-server'),
            dhcpRange: document.getElementById('dhcp-range')
        };
        
        let isValid = true;
        
        // Validar IP do servidor
        if (!ipRegex.test(fields.serverIp.value)) {
            fields.serverIp.classList.add('is-invalid');
            isValid = false;
        } else {
            fields.serverIp.classList.remove('is-invalid');
        }
        
        // Validar máscara de rede
        if (!ipRegex.test(fields.netmask.value)) {
            fields.netmask.classList.add('is-invalid');
            isValid = false;
        } else {
            fields.netmask.classList.remove('is-invalid');
        }
        
        // Validar gateway (opcional)
        if (fields.gateway.value && !ipRegex.test(fields.gateway.value)) {
            fields.gateway.classList.add('is-invalid');
            isValid = false;
        } else {
            fields.gateway.classList.remove('is-invalid');
        }
        
        // Validar DNS (opcional)
        if (fields.dnsServer.value && !ipRegex.test(fields.dnsServer.value)) {
            fields.dnsServer.classList.add('is-invalid');
            isValid = false;
        } else {
            fields.dnsServer.classList.remove('is-invalid');
        }
        
        // Validar faixa DHCP
        if (!dhcpRangeRegex.test(fields.dhcpRange.value)) {
            fields.dhcpRange.classList.add('is-invalid');
            isValid = false;
        } else {
            fields.dhcpRange.classList.remove('is-invalid');
        }
        
        return isValid;
    }

    /**
     * Valida estado atual do módulo
     * @returns {boolean} - Se o estado é válido
     */
    validateCurrentState() {
        if (this.elements.editArea.style.display !== "none") {
            return this.validateNetworkForm();
        }
        return true;
    }
}

// Exportar para uso global
window.NetworkModule = NetworkModule; 