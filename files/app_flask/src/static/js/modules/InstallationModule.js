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
    async executeInstallation() {
        // Reset output
        this.elements.startInstallationBtn.disabled = true;
        if (this.elements.installationOutput) {
            this.elements.installationOutput.innerHTML = '<p>Iniciando instalação...</p>';
            this.elements.installationOutput.style.display = 'block';
        }
        // Barra de progresso gradual
        let progress = 5;
        if (this.elements.progressBarContainer) {
            this.elements.progressBarContainer.style.display = 'flex';
        }
        const progressBar = document.getElementById('installation-progress-bar');
        const setProgress = (val) => {
            if (progressBar) {
                progressBar.style.width = val + '%';
                progressBar.textContent = val + '%';
            }
        };
        setProgress(progress);
        let timer = setInterval(() => {
            if (progress < 90) {
                progress += 1;
                setProgress(progress);
            } else {
                clearInterval(timer);
            }
        }, 40);
        try {
            const response = await fetch('/run_auto_install', { method: 'POST' });
            const text = await response.text();
            clearInterval(timer);
            setProgress(100);
            if (response.ok) {
                if (this.elements.installationOutput) {
                    this.elements.installationOutput.innerHTML += `<p style='color:green;'>Instalação concluída com sucesso!</p>`;
                }
                this.handleInstallationSuccess();
            } else {
                if (this.elements.installationOutput) {
                    this.elements.installationOutput.innerHTML += `<p style='color:red;'>Erro: ${text}</p>`;
                }
                this.handleInstallationError();
            }
        } catch (e) {
            clearInterval(timer);
            setProgress(0);
            if (this.elements.installationOutput) {
                this.elements.installationOutput.innerHTML += `<p style='color:red;'>Erro inesperado: ${e}</p>`;
            }
            this.handleInstallationError();
        }
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


}

// Exportar para uso global
window.InstallationModule = InstallationModule; 