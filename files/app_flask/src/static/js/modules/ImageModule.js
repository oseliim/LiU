/**
 * ImageModule - Módulo para gerenciar configurações de imagem
 * 
 * Responsabilidades:
 * - Gerenciar seleção de sistema operacional
 * - Controlar aplicativos opcionais
 * - Validar configurações de imagem
 * - Gerenciar ambiente gráfico
 */
class ImageModule {
    constructor() {
        this.elements = {
            osSelector: document.getElementById('os-selector'),
            linuxOptions: document.getElementById('linux-options'),
            ubuntuVersion: document.getElementById('ubuntu-version'),
            desktopEnvironment: document.querySelectorAll('input[name="desktopEnvironment"]'),
            autologinCheck: document.getElementById('autologin-check'),
            optionalApps: document.querySelectorAll('.optional-app'),
            optionalAppsError: document.getElementById('optional-apps-error'),
            step34NextBtn: document.getElementById('step-3-4-next-btn')
        };
        
        this.bindEvents();
    }

    /**
     * Vincula eventos específicos do módulo de imagem
     */
    bindEvents() {
        if (this.elements.osSelector) {
            this.elements.osSelector.addEventListener('change', () => this.toggleLinuxOptions());
        }

        if (this.elements.step34NextBtn) {
            this.elements.step34NextBtn.addEventListener('click', () => this.handleStep34Next());
        }

        // Event listeners para aplicativos opcionais
        this.elements.optionalApps.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateStep34NextBtn());
        });

        // Executar ao carregar para garantir o estado correto
        this.toggleLinuxOptions();
        this.updateStep34NextBtn();
    }

    /**
     * Alterna visibilidade das opções Linux baseado na seleção do SO
     */
    toggleLinuxOptions() {
        if (this.elements.osSelector && this.elements.linuxOptions) {
            if (this.elements.osSelector.value === 'windows') {
                this.elements.linuxOptions.style.display = 'none';
            } else {
                this.elements.linuxOptions.style.display = '';
            }
        }
        // Sempre que mudar SO, atualizar estado do botão próxima etapa
        this.updateStep34NextBtn();
    }

    /**
     * Atualiza estado do botão próximo baseado na seleção de aplicativos
     */
    updateStep34NextBtn() {
        const selectedOS = this.elements.osSelector ? this.elements.osSelector.value : 'linux';
        const anyChecked = Array.from(this.elements.optionalApps).some(cb => cb.checked);
        // Se for Linux, só avança se algum app estiver marcado
        if (selectedOS === 'linux') {
            this.elements.step34NextBtn.disabled = !anyChecked;
        } else {
            // Para Windows, permite avançar independentemente dos apps
            this.elements.step34NextBtn.disabled = false;
        }
        if ((selectedOS === 'linux' && anyChecked) && this.elements.optionalAppsError) {
            this.elements.optionalAppsError.style.display = 'none';
            this.elements.optionalAppsError.textContent = '';
        }
    }

    /**
     * Manipula clique no botão próximo do step 3.4
     */
    handleStep34Next() {
        const selectedOS = this.elements.osSelector ? this.elements.osSelector.value : 'linux';
        const selectedApps = this.getSelectedApps();
        // Se for Linux, verificar se marcou algum app
        if (selectedOS === 'linux' && selectedApps.length === 0) {
            if (this.elements.optionalAppsError) {
                this.elements.optionalAppsError.textContent = 'Selecione pelo menos um aplicativo adicional para prosseguir.';
                this.elements.optionalAppsError.style.display = 'block';
            }
            this.elements.step34NextBtn.disabled = true;
            return;
        }
        if (this.elements.optionalAppsError) {
            this.elements.optionalAppsError.style.display = 'none';
            this.elements.optionalAppsError.textContent = '';
        }
        this.updateFormData(selectedApps);
        // Avançar para o próximo step
        const wizardManager = window.wizardManager;
        if (wizardManager) {
            wizardManager.showStep(3.5);
        }
    }

    /**
     * Obtém aplicativos selecionados
     * @returns {Array} - Lista de aplicativos selecionados
     */
    getSelectedApps() {
        const selectedApps = [];
        this.elements.optionalApps.forEach((checkbox) => {
            if (checkbox.checked) {
                selectedApps.push(" " + checkbox.value);
            }
        });
        return selectedApps;
    }

    /**
     * Atualiza dados do formulário com aplicativos selecionados
     * @param {Array} selectedApps - Aplicativos selecionados
     */
    updateFormData(selectedApps) {
        const wizardManager = window.wizardManager;
        if (wizardManager) {
            wizardManager.updateFormData('image', {
                additionalPackages: selectedApps
            });
        }
    }

    /**
     * Obtém configurações atuais de imagem
     * @returns {Object} - Configurações de imagem
     */
    getImageConfig() {
        const config = {
            version: this.elements.osSelector.value,
            desktopEnvironment: 'xfce',
            autologin: this.elements.autologinCheck.checked
        };

        if (config.version === 'linux') {
            config.version = this.elements.ubuntuVersion.value;
        }

        const selectedDesktop = document.querySelector('input[name="desktopEnvironment"]:checked');
        if (selectedDesktop) {
            config.desktopEnvironment = selectedDesktop.value;
        }

        return config;
    }

    /**
     * Valida configurações de imagem
     * @returns {boolean} - Se as configurações são válidas
     */
    validateImageConfig() {
        // Validação básica - pode ser expandida conforme necessário
        if (!this.elements.osSelector.value) {
            return false;
        }

        if (this.elements.osSelector.value === 'linux' && !this.elements.ubuntuVersion.value) {
            return false;
        }

        return true;
    }
}

// Exportar para uso global
window.ImageModule = ImageModule; 