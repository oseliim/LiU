/**
 * UsersModule - Módulo para gerenciar criação e validação de usuários
 * 
 * Responsabilidades:
 * - Gerar usuários automaticamente com prefixo
 * - Validar campos de usuário
 * - Gerenciar campos dinâmicos de usuário
 * - Controlar visibilidade de senhas
 */
class UsersModule {
    constructor() {
        console.log('UsersModule: Iniciando construtor...');
        
        this.elements = {
            userCountInput: document.getElementById('user-count-auto'),
            usersContainer: document.getElementById('users-container'),
            step35NextBtn: document.getElementById('step-3-5-next-btn'),
            generateUsersBtn: document.getElementById('generate-users-btn'),
            userPrefix: document.getElementById('user-prefix'),
            defaultPassword: document.getElementById('default-password'),
        };
        
        console.log('UsersModule: Elementos encontrados:', {
            userCountInput: !!this.elements.userCountInput,
            usersContainer: !!this.elements.usersContainer,
            step35NextBtn: !!this.elements.step35NextBtn,
            generateUsersBtn: !!this.elements.generateUsersBtn,
            userPrefix: !!this.elements.userPrefix,
            defaultPassword: !!this.elements.defaultPassword,
        });
        
        this.bindEvents();
        
        // Inicializar estado do botão
        this.disableStep35NextBtn();
        
        console.log('UsersModule: Construtor concluído');
    }

    /**
     * Vincula eventos específicos do módulo de usuários
     */
    bindEvents() {
        console.log('UsersModule: Vinculando eventos...');
        
        if (this.elements.generateUsersBtn) {
            console.log('UsersModule: Vinculando evento generateUsersBtn');
            this.elements.generateUsersBtn.addEventListener('click', () => {
                console.log('UsersModule: Botão gerar usuários clicado');
                this.generateUsersWithPrefix();
            });
        } else {
            console.warn('UsersModule: generateUsersBtn não encontrado');
        }

        if (this.elements.step35NextBtn) {
            console.log('UsersModule: Vinculando evento step35NextBtn');
            this.elements.step35NextBtn.addEventListener('click', () => {
                console.log('UsersModule: Botão próximo step 3.5 clicado');
                this.handleStep35Next();
            });
        } else {
            console.warn('UsersModule: step35NextBtn não encontrado');
        }

        // Adicionar validação em tempo real para o campo de quantidade de usuários
        if (this.elements.userCountInput) {
            console.log('UsersModule: Vinculando evento userCountInput');
            this.elements.userCountInput.addEventListener('input', () => this.validateAndUpdateButton());
        } else {
            console.warn('UsersModule: userCountInput não encontrado');
        }
        
        console.log('UsersModule: Eventos vinculados');
    }

    /**
     * Gera usuários automaticamente com prefixo
     */
    generateUsersWithPrefix() {
        const prefix = this.elements.userPrefix.value.trim();
        const count = parseInt(this.elements.userCountInput.value) || 3;
        const defaultPassword = this.elements.defaultPassword.value.trim();
        
        // Validação
        if (!prefix) {
            alert('Por favor, insira um prefixo para os usuários.');
            return;
        }
        
        if (!defaultPassword) {
            alert('Por favor, insira uma senha padrão.');
            return;
        }
        
        // Gerar campos de usuários
        this.generateUserFields();
        
        // Preencher os campos com os valores gerados
        console.log('UsersModule: Preenchendo campos com valores gerados...');
        for (let i = 0; i < count; i++) {
            const username = `${prefix}${i+1}`;
            const usernameElement = document.getElementById(`username-${i}`);
            const passwordElement = document.getElementById(`password-${i}`);
            
            console.log(`UsersModule: Preenchendo usuário ${i}:`, {
                username: username,
                usernameElement: !!usernameElement,
                passwordElement: !!passwordElement
            });
            
            if (usernameElement && passwordElement) {
                usernameElement.value = username;
                passwordElement.value = defaultPassword;
                console.log(`UsersModule: Usuário ${i} preenchido com sucesso`);
            } else {
                console.warn(`UsersModule: Elementos não encontrados para usuário ${i}`);
            }
        }
        
        // Atualizar o formData e validar já com eventos dos campos vinculados
        setTimeout(() => {
            this.validateAndUpdateButton();
        }, 0);
    }

    /**
     * Gera campos de usuário dinamicamente
     */
    generateUserFields() {
        console.log('UsersModule: Gerando campos de usuário...');
        const userCount = parseInt(this.elements.userCountInput.value) || 1;
        console.log('UsersModule: Quantidade de usuários para gerar:', userCount);
        
        if (!this.elements.usersContainer) {
            console.error('UsersModule: usersContainer não encontrado');
            return;
        }
        
        this.elements.usersContainer.innerHTML = '';
        
        for (let i = 0; i < userCount; i++) {
            const userDiv = document.createElement('div');
            userDiv.className = 'user-entry card mb-3';
            userDiv.innerHTML = this.generateUserFieldHTML(i);
            this.elements.usersContainer.appendChild(userDiv);
            console.log(`UsersModule: Campo de usuário ${i} gerado`);
        }
        
        console.log('UsersModule: Vinculando eventos dos campos gerados...');
        this.bindPasswordToggleEvents();
        this.bindUserFieldValidationEvents();
        this.populateExistingData();
        
        console.log('UsersModule: Campos de usuário gerados com sucesso');
    }

    /**
     * Gera HTML para um campo de usuário
     * @param {number} index - Índice do usuário
     * @returns {string} - HTML do campo de usuário
     */
    generateUserFieldHTML(index) {
        return `
            <div class="card-header">
                <strong>Usuário ${index + 1}</strong>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="username-${index}" class="form-label">Nome de Usuário</label>
                        <input type="text" class="form-control username-input" id="username-${index}" 
                            placeholder="ex: aluno${index > 0 ? index + 1 : ''}" 
                            pattern="[a-z_][a-z0-9_-]{1,15}" required>
                        <div class="invalid-feedback">
                            Nome de usuário inválido. Use letras minúsculas, números, _ ou -, começando com letra, 2-16 caracteres.
                        </div>
                    </div>
                    <div class="col-md-6">
                        <label for="password-${index}" class="form-label">Senha</label>
                        <div class="input-group">
                            <input type="password" class="form-control password-input" id="password-${index}" 
                                placeholder="Digite a senha" minlength="4" required>
                            <button class="btn btn-outline-secondary toggle-password" type="button" data-target="password-${index}">
                                <i class="bi bi-eye"></i>
                            </button>
                        </div>
                        <div class="invalid-feedback">
                            A senha deve ter pelo menos 4 caracteres.
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Vincula eventos para mostrar/ocultar senhas
     */
    bindPasswordToggleEvents() {
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const passwordInput = document.getElementById(targetId);
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    this.innerHTML = '<i class="bi bi-eye-slash"></i>';
                } else {
                    passwordInput.type = 'password';
                    this.innerHTML = '<i class="bi bi-eye"></i>';
                }
            });
        });
    }

    /**
     * Vincula eventos de validação em tempo real para os campos de usuário
     */
    bindUserFieldValidationEvents() {
        console.log('UsersModule: Vinculando eventos de validação em tempo real...');
        const usernameInputs = document.querySelectorAll('.username-input');
        const passwordInputs = document.querySelectorAll('.password-input');
        
        console.log('UsersModule: Campos encontrados:', {
            usernameInputs: usernameInputs.length,
            passwordInputs: passwordInputs.length
        });
        
        usernameInputs.forEach((input, index) => {
            console.log(`UsersModule: Vinculando evento de validação para username ${index}`);
            input.addEventListener('input', () => {
                console.log(`UsersModule: Username ${index} alterado, validando...`);
                this.validateAndUpdateButton();
            });
        });
        
        passwordInputs.forEach((input, index) => {
            console.log(`UsersModule: Vinculando evento de validação para password ${index}`);
            input.addEventListener('input', () => {
                console.log(`UsersModule: Password ${index} alterado, validando...`);
                this.validateAndUpdateButton();
            });
        });
        
        console.log('UsersModule: Eventos de validação vinculados');
    }

    /**
     * Preenche com dados existentes, se houver
     */
    populateExistingData() {
        const wizardManager = window.wizardManager;
        if (wizardManager && wizardManager.getFormData().users.length > 0) {
            const userCount = parseInt(this.elements.userCountInput.value) || 1;
            const existingUsers = wizardManager.getFormData().users;
            const minLength = Math.min(userCount, existingUsers.length);
            
            for (let i = 0; i < minLength; i++) {
                document.getElementById(`username-${i}`).value = existingUsers[i].username || '';
                document.getElementById(`password-${i}`).value = existingUsers[i].password || '';
            }
        }
    }

    /**
     * Valida os campos de usuário
     * @returns {boolean} - Se os campos são válidos
     */
    validateUserFields() {
        console.log('UsersModule: Validando campos de usuário...');
        const userCount = parseInt(this.elements.userCountInput.value) || 1;
        const usernameRegex = /^[a-z_][a-z0-9_-]{1,15}$/;
        let hasValidUsers = false;
        
        console.log('UsersModule: Quantidade de usuários:', userCount);
        
        const wizardManager = window.wizardManager;
        if (wizardManager) {
            console.log('UsersModule: WizardManager encontrado, limpando array de usuários');
            // Limpar array de usuários
            wizardManager.updateFormData('users', []);
            
            for (let i = 0; i < userCount; i++) {
                const usernameInput = document.getElementById(`username-${i}`);
                const passwordInput = document.getElementById(`password-${i}`);
                
                console.log(`UsersModule: Validando usuário ${i}:`, {
                    username: usernameInput ? usernameInput.value : 'N/A',
                    password: passwordInput ? passwordInput.value.length : 'N/A',
                    usernameElement: !!usernameInput,
                    passwordElement: !!passwordInput
                });
                
                if (!usernameInput || !passwordInput) {
                    console.warn(`UsersModule: Elementos não encontrados para usuário ${i}`);
                    continue;
                }
                
                // Validar nome de usuário
                const isUsernameValid = usernameRegex.test(usernameInput.value);
                if (!isUsernameValid) {
                    usernameInput.classList.add('is-invalid');
                    console.log(`UsersModule: Nome de usuário ${i} inválido:`, usernameInput.value);
                } else {
                    usernameInput.classList.remove('is-invalid');
                    console.log(`UsersModule: Nome de usuário ${i} válido:`, usernameInput.value);
                }
                
                // Validar senha
                const isPasswordValid = passwordInput.value.length >= 4;
                if (!isPasswordValid) {
                    passwordInput.classList.add('is-invalid');
                    console.log(`UsersModule: Senha ${i} inválida:`, passwordInput.value.length, 'caracteres');
                } else {
                    passwordInput.classList.remove('is-invalid');
                    console.log(`UsersModule: Senha ${i} válida:`, passwordInput.value.length, 'caracteres');
                }
                
                // Adicionar ao formData se válido
                if (isUsernameValid && isPasswordValid) {
                    const formData = wizardManager.getFormData();
                    const users = Array.isArray(formData.users) ? formData.users : [];
                    users.push({
                        username: usernameInput.value,
                        password: passwordInput.value,
                    });
                    wizardManager.updateFormData('users', users);
                    hasValidUsers = true;
                    console.log(`UsersModule: Usuário ${i} adicionado ao formData`);
                }
            }
        } else {
            console.warn('UsersModule: WizardManager não encontrado');
        }
        
        console.log('UsersModule: Validação concluída, hasValidUsers:', hasValidUsers);
        // Só é válido se houver pelo menos um usuário válido
        return hasValidUsers;
    }

    /**
     * Valida os campos e atualiza o estado do botão próximo
     */
    validateAndUpdateButton() {
        console.log('UsersModule: validateAndUpdateButton chamado');
        const isValid = this.validateUserFields();
        console.log('UsersModule: Resultado da validação:', isValid);
        
        if (isValid) {
            console.log('UsersModule: Campos válidos, habilitando botão');
            this.enableStep35NextBtn();
        } else {
            console.log('UsersModule: Campos inválidos, desabilitando botão');
            this.disableStep35NextBtn();
        }
    }

    /**
     * Habilita o botão próximo do step 3.5
     */
    enableStep35NextBtn() {
        console.log('UsersModule: Habilitando botão próximo step 3.5');
        if (this.elements.step35NextBtn) {
            this.elements.step35NextBtn.disabled = false;
            this.elements.step35NextBtn.classList.remove('btn-secondary');
            this.elements.step35NextBtn.classList.add('btn-success');
            console.log('UsersModule: Botão próximo step 3.5 habilitado');
        } else {
            console.warn('UsersModule: step35NextBtn não encontrado para habilitar');
        }
    }

    /**
     * Desabilita o botão próximo do step 3.5
     */
    disableStep35NextBtn() {
        console.log('UsersModule: Desabilitando botão próximo step 3.5');
        if (this.elements.step35NextBtn) {
            this.elements.step35NextBtn.disabled = true;
            this.elements.step35NextBtn.disabled = true;
            this.elements.step35NextBtn.classList.remove('btn-success');
            this.elements.step35NextBtn.classList.add('btn-secondary');
            console.log('UsersModule: Botão próximo step 3.5 desabilitado');
        } else {
            console.warn('UsersModule: step35NextBtn não encontrado para desabilitar');
        }
    }

    /**
     * Manipula clique no botão próximo do step 3.5
     */
    handleStep35Next() {
        console.log('UsersModule: handleStep35Next chamado');
        const isValid = this.validateUserFields();
        console.log('UsersModule: Validação no handleStep35Next:', isValid);
        
        if (isValid) {
            console.log('UsersModule: Validação passou, navegando para próximo step');
            const wizardManager = window.wizardManager;
            if (wizardManager) {
                wizardManager.showStep(4);
                // Trigger summary population
                if (window.summaryModule) {
                    window.summaryModule.populateSummary();
                }
            } else {
                console.error('UsersModule: WizardManager não encontrado');
            }
        } else {
            console.log('UsersModule: Validação falhou, desabilitando botão');
            // Se a validação falhar, desabilitar o botão novamente
            this.disableStep35NextBtn();
            alert('Por favor, corrija os erros nos campos de usuário antes de continuar.');
        }
    }

    /**
     * Obtém dados de usuários válidos
     * @returns {Array} - Lista de usuários válidos
     */
    getValidUsers() {
        const wizardManager = window.wizardManager;
        if (wizardManager) {
            return wizardManager.getFormData().users;
        }
        return [];
    }
}

// Exportar para uso global
window.UsersModule = UsersModule; 