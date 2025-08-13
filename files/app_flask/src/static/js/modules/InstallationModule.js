/**
 * InstallationModule - Módulo para gerenciar instalação inicial
 * 
 * Responsabilidades:
 * - Executar instalação automática
 * - Gerenciar saída de instalação
 * - Controlar progresso de instalação
 * - Validar conclusão da instalação
 */
class InstallationModule {
    constructor() {
        console.log('InstallationModule: Inicializando...');
        
        this.elements = {
            startInstallationBtn: document.getElementById('start-installation-btn'),
            installationOutput: document.getElementById('installation-output'),
            step1NextBtn: document.getElementById('step-1-next-btn'),
            progressBarContainer: document.getElementById('installation-progress-bar-container')
        };
        
        console.log('InstallationModule: Elementos encontrados:', this.elements);
        
        this.bindEvents();
        console.log('InstallationModule: Inicialização concluída');
        
        // Teste direto após inicialização
        setTimeout(() => {
            console.log('InstallationModule: Teste direto após 1 segundo...');
            const btn = document.getElementById('start-installation-btn');
            if (btn) {
                console.log('InstallationModule: Botão ainda existe, testando clique...');
                btn.addEventListener('click', () => {
                    console.log('InstallationModule: Clique detectado via teste direto!');
                });
            }
        }, 1000);
    }

    /**
     * Vincula eventos específicos do módulo de instalação
     */
    bindEvents() {
        console.log('InstallationModule: Tentando vincular eventos...');
        console.log('InstallationModule: startInstallationBtn =', this.elements.startInstallationBtn);
        
        if (this.elements.startInstallationBtn) {
            console.log('InstallationModule: Botão encontrado, vinculando evento...');
            this.elements.startInstallationBtn.addEventListener('click', () => {
                console.log('InstallationModule: Botão clicado!');
                this.startInstallation();
            });
            console.log('InstallationModule: Evento vinculado com sucesso');
        } else {
            console.error('InstallationModule: Botão start-installation-btn não encontrado!');
        }
    }

    /**
     * Inicia o processo de instalação
     */
    startInstallation() {
        this.elements.startInstallationBtn.disabled = true;
        
        if (this.elements.step1NextBtn) {
            this.elements.step1NextBtn.style.display = 'none';
        }
        
        this.showInstallationOutput();
        this.showProgressBar();
        
        this.executeInstallation();
    }

    /**
     * Mostra área de saída da instalação
     */
    showInstallationOutput() {
        if (this.elements.installationOutput) {
            this.elements.installationOutput.style.display = 'block';
        }
    }

    /**
     * Mostra barra de progresso da instalação
     */
    showProgressBar() {
        if (this.elements.progressBarContainer) {
            this.elements.progressBarContainer.style.display = 'flex';
        }
    }

    /**
     * Executa o script de instalação
     */
    executeInstallation() {
        this.fetchScriptOutput(
            '/run_auto_install', 
            this.elements.installationOutput, 
            'POST', 
            null,
            () => this.handleInstallationSuccess(),
            () => this.handleInstallationError()
        );
    }

    /**
     * Manipula sucesso da instalação
     */
    handleInstallationSuccess() {
        if (this.elements.step1NextBtn) {
            this.elements.step1NextBtn.style.display = 'inline-block';
        }
        
        this.markStepAsCompleted();
        this.elements.startInstallationBtn.disabled = false;
    }

    /**
     * Manipula erro da instalação
     */
    handleInstallationError() {
        this.elements.startInstallationBtn.disabled = false;
    }

    /**
     * Marca o step como concluído
     */
    markStepAsCompleted() {
        const steps = document.querySelectorAll('.progress-step');
        if (steps[0]) {
            steps[0].classList.add('completed');
            const stepCircle = steps[0].querySelector('.step-circle');
            if (stepCircle) {
                stepCircle.innerHTML = '&#10003;';
            }
        }
    }

    /**
     * Função auxiliar para buscar saída de script
     * @param {string} url - URL do endpoint
     * @param {HTMLElement} outputElement - Elemento para exibir saída
     * @param {string} method - Método HTTP
     * @param {Object} body - Corpo da requisição
     * @param {Function} onSuccess - Callback de sucesso
     * @param {Function} onError - Callback de erro
     */
    async fetchScriptOutput(url, outputElement, method = 'GET', body = null, onSuccess = null, onError = null) {
        try {
            outputElement.style.display = 'block';
            outputElement.innerHTML = '<p>Iniciando execução...</p>';
            
            const options = {
                method: method,
                headers: {}
            };
            
            if (body) {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(body);
            }
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    if (onSuccess) onSuccess();
                    break;
                }
                
                const text = decoder.decode(value);
                outputElement.innerHTML += text;
                outputElement.scrollTop = outputElement.scrollHeight;
            }
        } catch (error) {
            console.error("Erro ao executar script:", error);
            outputElement.innerHTML += `<p style="color:red;">Erro: ${error.message}</p>`;
            if (onError) onError(error);
        }
    }
}

// Exportar para uso global
window.InstallationModule = InstallationModule; 