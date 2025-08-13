/**
 * WizardManager - Gerenciador principal do wizard de configuração LTSP
 * 
 * Responsabilidades:
 * - Gerenciar o estado atual do wizard
 * - Controlar navegação entre steps
 * - Manter dados do formulário
 * - Coordenar interações entre módulos
 */
class WizardManager {
    constructor() {
        this.currentStep = 1;
        this.formData = {
            network: {},
            image: {},
            users: []
        };
        
        console.log('WizardManager: Inicializado com formData:', this.formData);
        
        this.elements = {
            steps: document.querySelectorAll('.progress-step'),
            stepPanes: document.querySelectorAll('.step-pane'),
            prevStepButtons: document.querySelectorAll('.prev-step-btn')
        };
        
        this.initializeWizard();
    }

    /**
     * Inicializa o wizard verificando se existe o container necessário
     */
    initializeWizard() {
        if (!document.getElementById('step-content')) {
            console.warn('Container de steps não encontrado. Wizard não inicializado.');
            return;
        }
        
        this.bindNavigationEvents();
        this.updateProgressIndicator(this.currentStep);
    }

    /**
     * Atualiza o indicador de progresso visual
     * @param {number} targetStep - Step atual para destacar
     */
    updateProgressIndicator(targetStep) {
        console.log(`WizardManager: Atualizando indicador de progresso para step ${targetStep}`);
        this.elements.steps.forEach((step, index) => {
            const stepCircle = step.querySelector('.step-circle');
            step.classList.remove('active', 'completed');
            
            const stepNumber = parseFloat(step.dataset.step);
            console.log(`WizardManager: Step ${index}: dataset.step = ${step.dataset.step}, parsed = ${stepNumber}`);
            
            if (stepNumber < targetStep) {
                step.classList.add('completed');
                stepCircle.innerHTML = '&#10003;';
                console.log(`WizardManager: Step ${stepNumber} marcado como completado`);
            } else if (stepNumber === targetStep) {
                step.classList.add('active');
                stepCircle.innerHTML = index + 1;
                console.log(`WizardManager: Step ${stepNumber} marcado como ativo`);
            } else {
                stepCircle.innerHTML = index + 1;
                console.log(`WizardManager: Step ${stepNumber} marcado como inativo`);
            }
        });
    }

    /**
     * Mostra um step específico do wizard
     * @param {number} stepNumber - Número do step para mostrar
     */
    showStep(stepNumber) {
        console.log(`WizardManager: Mostrando step ${stepNumber}`);
        this.elements.stepPanes.forEach(pane => pane.classList.remove("active"));
        
        // Converter stepNumber para string para garantir compatibilidade com IDs
        const stepId = `step-${stepNumber}`;
        console.log(`WizardManager: Procurando elemento com ID: ${stepId}`);
        const targetPane = document.getElementById(stepId);
        
        if (targetPane) {
            targetPane.classList.add("active");
            console.log(`WizardManager: Step ${stepNumber} ativado`);
        } else {
            console.warn(`WizardManager: Step ${stepNumber} não encontrado (ID: ${stepId})`);
            // Listar todos os steps disponíveis para debug
            const allSteps = document.querySelectorAll('.step-pane');
            console.log('Steps disponíveis:', Array.from(allSteps).map(s => s.id));
        }
        
        this.updateProgressIndicator(stepNumber);
        this.currentStep = stepNumber;
        console.log(`WizardManager: Step atual definido como ${stepNumber}`);

        // Carregar dados específicos do step se necessário
        if (stepNumber === 2) {
            this.loadNetworkInfo();
        }
    }

    /**
     * Carrega informações de rede para o step 2
     */
    async loadNetworkInfo() {
        const networkModule = new NetworkModule();
        await networkModule.loadAndDisplayNetworkInfo();
    }

    /**
     * Vincula eventos de navegação
     */
    bindNavigationEvents() {
        // Event listeners para botões "Próximo"
        document.querySelectorAll('.next-step-btn:not(#step-1-next-btn):not(#step-3-5-next-btn):not(#confirm-summary-btn)').forEach(button => {
            button.addEventListener('click', (e) => this.handleNextStep(e));
        });

        // Event listeners para botões "Anterior"
        this.elements.prevStepButtons.forEach(button => {
            button.addEventListener('click', () => this.handlePrevStep());
        });
    }

    /**
     * Manipula a navegação para o próximo step
     * @param {Event} e - Evento do clique
     */
    handleNextStep(e) {
        if (e.currentTarget.disabled) return;
        
        let canProceed = this.validateCurrentStep();
        
        if (canProceed) {
            if (this.currentStep === 2) {
                this.showStep(3);
            } else if (this.currentStep === 3) {
                this.showStep(3.5);
            }
        }
    }

    /**
     * Manipula a navegação para o step anterior
     */
    handlePrevStep() {
        if (this.currentStep === 3.5) {
            this.showStep(3);
        } else if (this.currentStep > 1) {
            this.showStep(this.currentStep - 1);
        }
    }

    /**
     * Valida o step atual antes de prosseguir
     * @returns {boolean} - Se pode prosseguir
     */
    validateCurrentStep() {
        if (this.currentStep === 2) {
            const networkModule = new NetworkModule();
            return networkModule.validateCurrentState();
        } else if (this.currentStep === 3) {
            return this.validateImageStep();
        }
        return true;
    }

    /**
     * Valida o step de configuração de imagem
     * @returns {boolean} - Se o step é válido
     */
    validateImageStep() {
        const username = document.getElementById('username');
        if (username && username.value.trim() === '') {
            username.classList.add('is-invalid');
            return false;
        } else if (username) {
            username.classList.remove('is-invalid');
        }
        return true;
    }

    /**
     * Obtém os dados do formulário
     * @returns {Object} - Dados do formulário
     */
    getFormData() {
        return this.formData;
    }

    /**
     * Atualiza dados do formulário
     * @param {string} section - Seção dos dados (network, image, users)
     * @param {Object|Array} data - Dados para atualizar
     */
    updateFormData(section, data) {
        console.log(`WizardManager: Atualizando formData[${section}] com:`, data);
        console.log(`WizardManager: Tipo de data:`, Array.isArray(data) ? 'Array' : 'Object');
        
        if (Array.isArray(data)) {
            // Se for array (como users), substituir diretamente
            this.formData[section] = data;
            console.log(`WizardManager: Array ${section} atualizado:`, this.formData[section]);
        } else {
            // Se for objeto, fazer spread
            this.formData[section] = { ...this.formData[section], ...data };
            console.log(`WizardManager: Objeto ${section} atualizado:`, this.formData[section]);
        }
    }
}

// Exportar para uso global
window.WizardManager = WizardManager; 