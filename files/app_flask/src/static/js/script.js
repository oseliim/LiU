/**
 * Script principal do Wizard LTSP
 * 
 * Este arquivo inicializa todos os módulos do wizard e coordena suas interações.
 * A arquitetura modular permite melhor organização, manutenção e testabilidade.
 */

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded: Iniciando...');
    
    // Verificar se o wizard existe na página
    const stepContent = document.getElementById('step-content');
    console.log('step-content encontrado:', stepContent);
    
    if (!stepContent) {
        console.log('Wizard não encontrado nesta página. Saindo...');
        return;
    }

    // Verificar se o botão existe
    const startInstallationBtn = document.getElementById('start-installation-btn');
    console.log('start-installation-btn encontrado:', startInstallationBtn);

    // Aguardar um pouco mais para garantir que tudo está carregado
    await new Promise(resolve => setTimeout(resolve, 100));

    // Inicializar módulos
    console.log('Iniciando carregamento de módulos...');
    await initializeModules();
    
    // Configurar módulos globais para acesso entre módulos
    setupGlobalModules();
    console.log('Inicialização concluída');
    
    // Verificação final
    setTimeout(() => {
        console.log('=== VERIFICAÇÃO FINAL ===');
        const btn = document.getElementById('start-installation-btn');
        console.log('Botão final:', btn);
        if (btn) {
            console.log('Event listeners do botão:', btn.onclick);
            console.log('Botão habilitado:', !btn.disabled);
        }
    }, 2000);
});

/**
 * Inicializa todos os módulos do wizard
 */
async function initializeModules() {
    try {
        console.log('initializeModules: Iniciando carregamento sequencial...');
        
        // Carregar módulos na ordem correta e aguardar carregamento
        await loadModule('WizardManager');
        await loadModule('NetworkModule');
        await loadModule('ImageModule');
        await loadModule('UsersModule');
        await loadModule('SummaryModule');
        await loadModule('InstallationModule');
        
        console.log('initializeModules: Todos os módulos carregados, criando instâncias...');
        
        // Inicializar instâncias dos módulos após carregamento
        console.log('script.js: Criando instâncias dos módulos...');
        window.wizardManager = new WizardManager();
        console.log('script.js: WizardManager criado');
        window.networkModule = new NetworkModule();
        console.log('script.js: NetworkModule criado');
        window.imageModule = new ImageModule();
        console.log('script.js: ImageModule criado');
        window.usersModule = new UsersModule();
        console.log('script.js: UsersModule criado');
        window.summaryModule = new SummaryModule();
        console.log('script.js: SummaryModule criado');
        window.installationModule = new InstallationModule();
        console.log('script.js: InstallationModule criado');
        
        // Adicionar event listener específico para o botão "Próximo" do passo 1
        const step1NextBtn = document.getElementById('step-1-next-btn');
        if (step1NextBtn) {
            step1NextBtn.addEventListener('click', function(e) {
                console.log('Botão "Próximo" do passo 1 clicado');
                if (window.wizardManager) {
                    window.wizardManager.showStep(2);
                } else {
                    console.error('WizardManager não encontrado');
                }
            });
        } else {
            console.warn('Botão step-1-next-btn não encontrado');
        }
        
        console.log('Todos os módulos inicializados com sucesso');
        
    } catch (error) {
        console.error('Erro ao inicializar módulos:', error);
        
        // Fallback: tentar inicializar apenas o InstallationModule
        console.log('Tentando fallback com apenas InstallationModule...');
        try {
            await loadModule('InstallationModule');
            window.installationModule = new InstallationModule();
            console.log('Fallback bem-sucedido');
        } catch (fallbackError) {
            console.error('Fallback também falhou:', fallbackError);
        }
    }
}

/**
 * Carrega um módulo específico
 * @param {string} moduleName - Nome do módulo para carregar
 */
function loadModule(moduleName) {
    console.log(`loadModule: Carregando ${moduleName}...`);
    
    const script = document.createElement('script');
    script.src = `/static/js/modules/${moduleName}.js`;
    script.async = false; // Garantir ordem de carregamento
    
    return new Promise((resolve, reject) => {
        script.onload = () => {
            console.log(`loadModule: Módulo ${moduleName} carregado com sucesso`);
            resolve();
        };
        script.onerror = () => {
            console.error(`loadModule: Erro ao carregar módulo ${moduleName}`);
            reject(new Error(`Falha ao carregar ${moduleName}`));
        };
        document.head.appendChild(script);
    });
}

/**
 * Configura módulos globais para acesso entre módulos
 */
function setupGlobalModules() {
    // Configurar referências globais para comunicação entre módulos
    window.getWizardManager = () => window.wizardManager;
    window.getNetworkModule = () => window.networkModule;
    window.getImageModule = () => window.imageModule;
    window.getUsersModule = () => window.usersModule;
    window.getSummaryModule = () => window.summaryModule;
    window.getInstallationModule = () => window.installationModule;
}

/**
 * Função utilitária para debug - lista todos os módulos ativos
 */
function listActiveModules() {
    const modules = {
        'WizardManager': window.wizardManager,
        'NetworkModule': window.networkModule,
        'ImageModule': window.imageModule,
        'UsersModule': window.usersModule,
        'SummaryModule': window.summaryModule,
        'InstallationModule': window.installationModule
    };
    
    console.log('Módulos ativos:', modules);
    return modules;
}

// Expor função de debug globalmente
window.listActiveModules = listActiveModules;

// Função de teste para verificar o botão
window.testButton = function() {
    console.log('=== TESTE DO BOTÃO ===');
    const btn = document.getElementById('start-installation-btn');
    console.log('Botão encontrado:', btn);
    if (btn) {
        console.log('Botão habilitado:', !btn.disabled);
        console.log('Botão visível:', btn.style.display !== 'none');
        console.log('Event listeners:', btn.onclick);
        
        // Testar clique direto
        console.log('Simulando clique...');
        btn.click();
    }
};

// Função de teste para verificar o UsersModule
window.testUsersModule = function() {
    console.log('=== TESTE DO USERS MODULE ===');
    
    // Verificar se o módulo existe
    console.log('UsersModule global:', window.usersModule);
    
    // Verificar elementos
    if (window.usersModule) {
        console.log('Elementos do UsersModule:', window.usersModule.elements);
        
        // Verificar botão próximo
        const nextBtn = document.getElementById('step-3-5-next-btn');
        console.log('Botão próximo encontrado:', nextBtn);
        if (nextBtn) {
            console.log('Botão próximo habilitado:', !nextBtn.disabled);
            console.log('Classes do botão:', nextBtn.className);
        }
        
        // Testar geração de usuários
        console.log('Testando geração de usuários...');
        if (window.usersModule.generateUsersWithPrefix) {
            window.usersModule.generateUsersWithPrefix();
        }
    }
};