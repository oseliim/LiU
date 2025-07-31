document.addEventListener('DOMContentLoaded', () => {
    // Só inicializa o wizard se existir o container de steps
    if (!document.getElementById('step-content')) {
        return;
    }
    const steps = document.querySelectorAll('.progress-step');
    const stepPanes = document.querySelectorAll('.step-pane');
    const prevStepButtons = document.querySelectorAll('.prev-step-btn');

    // Step 1: Installation
    const startInstallationBtn = document.getElementById('start-installation-btn');
    const installationOutput = document.getElementById('installation-output');
    const step1NextBtn = document.getElementById('step-1-next-btn');

    // Step 2: Network Display and Edit
    const networkInfoLoading = document.getElementById("network-info-loading");
    const networkInfoDisplayArea = document.getElementById("network-info-display-area");
    const networkInfoEditArea = document.getElementById("network-info-edit-area");
    const networkInfoError = document.getElementById("network-info-error");
    const step2NextBtn = document.getElementById("step-2-next-btn");
    const toggleNetworkEditBtn = document.getElementById("toggle-network-edit-btn");
    const networkForm = document.getElementById("network-form");
    const saveNetworkChangesBtn = document.getElementById("save-network-changes-btn");

    // Step 3: Image
    const imageForm = document.getElementById('image-form');
    const userCountInput = document.getElementById('user-count-auto');
    const autologinCheck = document.getElementById('autologin-check');
    const step34NextBtn = document.getElementById('step-3-4-next-btn');

    // Step 3.5: Users
    const usersForm = document.getElementById('users-form');
    const usersContainer = document.getElementById('users-container');
    const step35NextBtn = document.getElementById('step-3-5-next-btn');

    // Step 4: Summary
    const summaryContent = document.getElementById('summary-content');
    const confirmSummaryBtn = document.getElementById('confirm-summary-btn');

    // Step 5: Apply/Loading
    const applyProgressBar = document.getElementById('apply-progress-bar');
    const applyOutput = document.getElementById('apply-output');
    const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    const exportConfigBtn = document.getElementById('export-config-btn');
    const restartWizardBtn = document.getElementById('restart-wizard-btn');

    let currentStep = 1;
    const formData = {
        network: {},
        image: {},
        users: []
    };

    // Função para atualizar o indicador de progresso
    function updateProgressIndicator(targetStep) {
        steps.forEach((step, index) => {
            const stepCircle = step.querySelector('.step-circle');
            step.classList.remove('active', 'completed');
            
            // Ajuste para o novo passo 3.5
            const stepNumber = parseFloat(step.dataset.step);
            
            if (stepNumber < targetStep) {
                step.classList.add('completed');
                stepCircle.innerHTML = '&#10003;';
            } else if (stepNumber === targetStep) {
                step.classList.add('active');
                stepCircle.innerHTML = index + 1;
            } else {
                stepCircle.innerHTML = index + 1;
            }
        // Ocultar opções Linux ao selecionar Windows
    const osSelector = document.getElementById('os-selector');
    const linuxOptions = document.getElementById('linux-options');
    if (osSelector && linuxOptions) {
        function toggleLinuxOptions() {
            if (osSelector.value === 'windows') {
                linuxOptions.style.display = 'none';
            } else {
                linuxOptions.style.display = '';
            }
        }
        osSelector.addEventListener('change', toggleLinuxOptions);
        // Executa ao carregar a página para garantir o estado correto
        toggleLinuxOptions();
    }
});
    }

    // Função para mostrar um passo específico
    function showStep(stepNumber) {
        stepPanes.forEach(pane => pane.classList.remove("active"));
        const targetPane = document.getElementById(`step-${stepNumber}`);
        if (targetPane) {
            targetPane.classList.add("active");
        }
        updateProgressIndicator(stepNumber);
        currentStep = stepNumber;

        if (stepNumber === 2) {
            loadAndDisplayNetworkInfo();
        }
    }

    // Função para carregar e exibir informações de rede
    async function loadAndDisplayNetworkInfo() {
        if (!networkInfoLoading || !networkInfoDisplayArea || !networkInfoError || !step2NextBtn) {
            console.error("Elementos da UI da Etapa 2 não encontrados no DOM.");
            return;
        }

        networkInfoLoading.style.display = "block";
        networkInfoDisplayArea.style.display = "none";
        networkInfoEditArea.style.display = "none";
        networkInfoError.style.display = "none";
        networkInfoError.innerHTML = "";
        step2NextBtn.disabled = true;
        toggleNetworkEditBtn.textContent = "Editar Configurações";

        try {
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

            const parsedDataResponse = await fetch("/get_parsed_network_data", { method: "GET" });
            const networkData = await parsedDataResponse.json();

            if (!parsedDataResponse.ok || networkData.error) {
                throw new Error(networkData.error || `Falha ao buscar dados de rede processados: ${parsedDataResponse.status}`);
            }

            if (!networkData.ip_address || !networkData.netmask) {
                throw new Error("Dados de rede essenciais (IP/Máscara) não foram detectados. Verifique as configurações do servidor.");
            }

            // Preencher a área de exibição
            networkInfoDisplayArea.innerHTML = `
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

            // Preencher o formulário de edição
            document.getElementById('network-interface').value = networkData.interface || "";
            document.getElementById('server-ip').value = networkData.ip_address || "";
            document.getElementById('netmask').value = networkData.netmask || "";
            document.getElementById('gateway').value = networkData.gateway || "";
            document.getElementById('dns-server').value = networkData.dns_servers && networkData.dns_servers.length > 0 ? networkData.dns_servers[0] : "";
            document.getElementById('dhcp-range').value = `${networkData.dhcp_range_start || ""} - ${networkData.dhcp_range_end || ""}`;

            if (window.updateTranslations) window.updateTranslations();

            // Armazenar dados no formData
            formData.network.interface = networkData.interface;
            formData.network.serverIp = networkData.ip_address;
            formData.network.netmask = networkData.netmask;
            formData.network.gateway = networkData.gateway;
            formData.network.dnsServer = networkData.dns_servers && networkData.dns_servers.length > 0 ? networkData.dns_servers[0] : (networkData.gateway || "");
            formData.network.dhcpRangeStart = networkData.dhcp_range_start;
            formData.network.dhcpRangeEnd = networkData.dhcp_range_end;
            formData.network.dhcpRange = `${networkData.dhcp_range_start} - ${networkData.dhcp_range_end}`;

            networkInfoDisplayArea.style.display = "block";
            step2NextBtn.disabled = false;
        } catch (error) {
            console.error("Erro ao carregar informações de rede:", error);
            networkInfoError.innerHTML = `<p data-translate="error_loading_network_info">Falha ao carregar informações de rede: ${error.message}</p><p data-translate="error_loading_network_info_suggestion">Você pode tentar recarregar a página ou VOLTAR para corrigir e tentar novamente.</p>`;
            if (window.updateTranslations) window.updateTranslations();
            networkInfoError.style.display = "block";
            step2NextBtn.disabled = true;
            networkInfoDisplayArea.style.display = "none";
        } finally {
            networkInfoLoading.style.display = "none";
        }
    }

    // Função para alternar entre exibição e edição de rede
    if (toggleNetworkEditBtn) {
        toggleNetworkEditBtn.addEventListener('click', () => {
            if (networkInfoEditArea.style.display === "none") {
                networkInfoDisplayArea.style.display = "none";
                networkInfoEditArea.style.display = "block";
                toggleNetworkEditBtn.textContent = "Mostrar Configurações";
                step2NextBtn.disabled = true; // Desabilita o botão next quando entra em modo de edição
            } else {
                networkInfoDisplayArea.style.display = "block";
                networkInfoEditArea.style.display = "none";
                toggleNetworkEditBtn.textContent = "Editar Configurações";
            }
        });
    }

    // Event listener para o botão de salvar alterações de rede
    if (saveNetworkChangesBtn) {
        saveNetworkChangesBtn.addEventListener('click', () => {
            if (validateNetworkForm()) {
                // Atualizar formData com os valores editados
                formData.network.serverIp = document.getElementById('server-ip').value;
                formData.network.netmask = document.getElementById('netmask').value;
                formData.network.gateway = document.getElementById('gateway').value;
                formData.network.dnsServer = document.getElementById('dns-server').value;
                
                const dhcpRange = document.getElementById('dhcp-range').value;
                const rangeParts = dhcpRange.split('-').map(part => part.trim());
                if (rangeParts.length === 2) {
                    formData.network.dhcpRangeStart = rangeParts[0];
                    formData.network.dhcpRangeEnd = rangeParts[1];
                    formData.network.dhcpRange = dhcpRange;
                }
                
                // Atualizar a exibição
                networkInfoDisplayArea.innerHTML = `
                    <div class="row">
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-header"><strong>Interface de Rede</strong></div>
                                <div class="card-body"><p class="card-text">${formData.network.interface || "N/A"}</p></div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-header"><strong>Endereço IP</strong></div>
                                <div class="card-body"><p class="card-text">${formData.network.serverIp || "N/A"}</p></div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-header"><strong>Máscara de Rede</strong></div>
                                <div class="card-body"><p class="card-text">${formData.network.netmask || "N/A"}</p></div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-header"><strong>Gateway Padrão</strong></div>
                                <div class="card-body"><p class="card-text">${formData.network.gateway || "N/A"}</p></div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-header"><strong>Servidores DNS</strong></div>
                                <div class="card-body"><p class="card-text">${formData.network.dnsServer || "N/A"}</p></div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card mb-3 bg-light">
                                <div class="card-header"><strong>Faixa DHCP para LTSP</strong></div>
                                <div class="card-body"><p class="card-text"><strong>${formData.network.dhcpRangeStart || "N/A"}</strong> - <strong>${formData.network.dhcpRangeEnd || "N/A"}</strong></p></div>
                            </div>
                        </div>
                    </div>
                `;
                
                networkInfoDisplayArea.style.display = "block";
                networkInfoEditArea.style.display = "none";
                toggleNetworkEditBtn.textContent = "Editar Configurações";
                step2NextBtn.disabled = false; // Habilita o botão next após salvar as alterações
            }
        });
    }

    // Função para validar o formulário de rede
    function validateNetworkForm() {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const dhcpRangeRegex = /^(\d{1,3}\.){3}\d{1,3}\s*-\s*(\d{1,3}\.){3}\d{1,3}$/;
        
        const serverIp = document.getElementById('server-ip');
        const netmask = document.getElementById('netmask');
        const gateway = document.getElementById('gateway');
        const dnsServer = document.getElementById('dns-server');
        const dhcpRange = document.getElementById('dhcp-range');
        
        let isValid = true;
        
        // Validar IP do servidor
        if (!ipRegex.test(serverIp.value)) {
            serverIp.classList.add('is-invalid');
            isValid = false;
        } else {
            serverIp.classList.remove('is-invalid');
        }
        
        // Validar máscara de rede
        if (!ipRegex.test(netmask.value)) {
            netmask.classList.add('is-invalid');
            isValid = false;
        } else {
            netmask.classList.remove('is-invalid');
        }
        
        // Validar gateway (opcional)
        if (gateway.value && !ipRegex.test(gateway.value)) {
            gateway.classList.add('is-invalid');
            isValid = false;
        } else {
            gateway.classList.remove('is-invalid');
        }
        
        // Validar DNS (opcional)
        if (dnsServer.value && !ipRegex.test(dnsServer.value)) {
            dnsServer.classList.add('is-invalid');
            isValid = false;
        } else {
            dnsServer.classList.remove('is-invalid');
        }
        
        // Validar faixa DHCP
        if (!dhcpRangeRegex.test(dhcpRange.value)) {
            dhcpRange.classList.add('is-invalid');
            isValid = false;
        } else {
            dhcpRange.classList.remove('is-invalid');
        }
        
        return isValid;
    }

    // Função para coletar os aplicativos opicionais
    if(step34NextBtn) {
        // Adiciona listeners para habilitar/desabilitar o botão conforme seleção
        const options = document.querySelectorAll('.optional-app');
        const optionalAppsError = document.getElementById('optional-apps-error');
        function updateStep34NextBtn() {
            const anyChecked = Array.from(options).some(cb => cb.checked);
            step34NextBtn.disabled = !anyChecked;
            if (anyChecked && optionalAppsError) {
                optionalAppsError.style.display = 'none';
                optionalAppsError.textContent = '';
            }
        }
        options.forEach((checkbox) => {
            checkbox.addEventListener('change', updateStep34NextBtn);
        });
        // Executa ao carregar para garantir o estado correto
        updateStep34NextBtn();

        step34NextBtn.addEventListener('click', () => {
            const selectedApps = [];
            options.forEach((checkbox) => {
                if(checkbox.checked) {
                    selectedApps.push(" "+checkbox.value);
                }
            });
            if(selectedApps.length === 0) {
                if (optionalAppsError) {
                    optionalAppsError.textContent = 'Selecione pelo menos um aplicativo adicional para prosseguir.';
                    optionalAppsError.style.display = 'block';
                }
                step34NextBtn.disabled = true;
                return;
            }
            if (optionalAppsError) {
                optionalAppsError.style.display = 'none';
                optionalAppsError.textContent = '';
            }
            formData.image.additionalPackages = selectedApps;
        })
    }

    // Função para gerar usuários automaticamente com prefixo
    function generateUsersWithPrefix() {
        const prefix = document.getElementById('user-prefix').value.trim();
        const count = parseInt(userCountInput.value) || 3;
        const defaultPassword = document.getElementById('default-password').value.trim();
        
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
        generateUserFields();
        
        // Preencher os campos com os valores gerados
        for (let i = 0; i < count; i++) {
            const username = `${prefix}${i+1}`;
            document.getElementById(`username-${i}`).value = username;
            document.getElementById(`password-${i}`).value = defaultPassword;
        }
        
        // Atualizar o formData
        validateUserFields();
        
        // Habilitar o botão "Próximo" após gerar usuários
        if (step35NextBtn) {
            step35NextBtn.disabled = false;
            step35NextBtn.classList.remove('btn-secondary');
            step35NextBtn.classList.add('btn-success');
        }
    }

    // Função para gerar campos de usuário dinamicamente
    function generateUserFields() {
        const userCount = parseInt(userCountInput.value) || 1;
        usersContainer.innerHTML = '';
        
        for (let i = 0; i < userCount; i++) {
            const userDiv = document.createElement('div');
            userDiv.className = 'user-entry card mb-3';
            userDiv.innerHTML = `
                <div class="card-header">
                    <strong>Usuário ${i + 1}</strong>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="username-${i}" class="form-label">Nome de Usuário</label>
                            <input type="text" class="form-control username-input" id="username-${i}" 
                                placeholder="ex: aluno${i > 0 ? i + 1 : ''}" 
                                pattern="^[a-z_][a-z0-9_-]{2,15}$" required>
                            <div class="invalid-feedback">
                                Nome de usuário inválido. Use letras minúsculas, números, _ ou -, começando com letra, 3-16 caracteres.
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label for="password-${i}" class="form-label">Senha</label>
                            <div class="input-group">
                                <input type="password" class="form-control password-input" id="password-${i}" 
                                    placeholder="Digite a senha" minlength="4" required>
                                <button class="btn btn-outline-secondary toggle-password" type="button" data-target="password-${i}">
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
            usersContainer.appendChild(userDiv);
        }
        
        // Adicionar event listeners para os botões de mostrar/ocultar senha
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
        
        // Preencher com dados existentes, se houver
        if (formData.users.length > 0) {
            const minLength = Math.min(userCount, formData.users.length);
            for (let i = 0; i < minLength; i++) {
                document.getElementById(`username-${i}`).value = formData.users[i].username || '';
                document.getElementById(`password-${i}`).value = formData.users[i].password || '';
            }
        }
    }

    // Função para validar os campos de usuário
    function validateUserFields() {
        const userCount = parseInt(userCountInput.value) || 1;
        const usernameRegex = /^[a-z_][a-z0-9_-]{2,15}$/;
        let isValid = true;
        let hasValidUsers = false;
        
        // Limpar array de usuários
        formData.users = [];
        
        for (let i = 0; i < userCount; i++) {
            const usernameInput = document.getElementById(`username-${i}`);
            const passwordInput = document.getElementById(`password-${i}`);
            
            // Validar nome de usuário
            if (!usernameRegex.test(usernameInput.value)) {
                usernameInput.classList.add('is-invalid');
                isValid = false;
            } else {
                usernameInput.classList.remove('is-invalid');
            }
            
            // Validar senha
            if (passwordInput.value.length < 4) {
                passwordInput.classList.add('is-invalid');
                isValid = false;
            } else {
                passwordInput.classList.remove('is-invalid');
            }
            
            // Adicionar ao formData se válido
            if (usernameRegex.test(usernameInput.value) && passwordInput.value.length >= 4) {
                formData.users.push({
                    username: usernameInput.value,
                    password: passwordInput.value,
                    autologin: i === 0 && autologinCheck.checked
                });
                hasValidUsers = true;
            }
        }
        
        // Só é válido se houver pelo menos um usuário válido
        return isValid && hasValidUsers;
    }

    // Função para popular o resumo
    function populateSummary() {
        // Dados de rede
        formData.network.interface = document.getElementById('network-interface') ? document.getElementById('network-interface').value : formData.network.interface;
        formData.network.serverIp = document.getElementById('server-ip') ? document.getElementById('server-ip').value : formData.network.serverIp;
        formData.network.netmask = document.getElementById('netmask') ? document.getElementById('netmask').value : formData.network.netmask;
        formData.network.gateway = document.getElementById('gateway') ? document.getElementById('gateway').value : formData.network.gateway;
        formData.network.dnsServer = document.getElementById('dns-server') ? document.getElementById('dns-server').value : formData.network.dnsServer;
        formData.network.dhcpRange = document.getElementById('dhcp-range') ? document.getElementById('dhcp-range').value : formData.network.dhcpRange;
        
        // Dados da imagem
        // Salvar o SO selecionado (linux ou windows) ANTES de enviar
        formData.image.version = document.getElementById('os-selector').value;
        if (formData.image.version === 'linux') {
            formData.image.version = document.getElementById('ubuntu-version').value;
        }
        formData.image.desktopEnvironment = document.querySelector('input[name="desktopEnvironment"]:checked') ? document.querySelector('input[name="desktopEnvironment"]:checked').value : 'xfce';
        formData.image.autologin = document.getElementById('autologin-check').checked;
        
        // Gerar HTML do resumo
        let usersHtml = '';
        formData.users.forEach((user, index) => {
            usersHtml += `
                <tr>
                    <td>${user.username}</td>
                    <td>${'•'.repeat(user.password.length)}</td>
                </tr>
            `;
        });
        
        // Mostrar SO correto no resumo
        let soResumo = '';
        if (document.getElementById('os-selector').value === 'windows') {
            soResumo = 'Windows (Virtualizado)';
        } else {
            soResumo = formData.image.version === 'bionic' ? 'Ubuntu 18.04 (Bionic Beaver)' : 'Ubuntu 22.04 (Jammy Jellyfish)';
        }
        
        summaryContent.innerHTML = `
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
                <tr><th data-translate="summary_desktop_env">Ambiente Gráfico:</th><td>${formData.image.desktopEnvironment === 'xfce' ? 'XFCE (leve)' : 'GDM (completo)'}</td></tr>
                <tr><th data-translate="summary_additional_packages">Pacotes Adicionais:</th><td>${formData.image.additionalPackages}</td></tr>
                <tr><th data-translate="summary_autologin">Autologin:</th><td>${formData.image.autologin ? 'Sim' : 'Não'}</td></tr>
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
        
        if (window.updateTranslations) window.updateTranslations();
        
        document.querySelectorAll('.edit-step-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const stepToEdit = parseFloat(e.target.dataset.editStep);
                showStep(stepToEdit);
            });
        });
    }

    // Event listener para o botão de instalação
    if (startInstallationBtn) {
        startInstallationBtn.addEventListener('click', () => {
            startInstallationBtn.disabled = true;
            if(step1NextBtn) step1NextBtn.style.display = 'none';
            
            // Mostrar área de saída e barra de progresso
            installationOutput.style.display = 'block';
            const progressBarContainer = document.getElementById('installation-progress-bar-container');
            if (progressBarContainer) progressBarContainer.style.display = 'flex';
            
            // Iniciar instalação
            fetchScriptOutput('/run_auto_install', installationOutput, 'POST', null, 
                () => {
                    if (step1NextBtn) step1NextBtn.style.display = 'inline-block';
                    if (steps[0]) {
                        steps[0].classList.add('completed');
                        const stepCircle = steps[0].querySelector('.step-circle');
                        if (stepCircle) stepCircle.innerHTML = '&#10003;';
                    }
                    startInstallationBtn.disabled = false;
                },
                () => {
                    startInstallationBtn.disabled = false;
                }
            );
        });
    }

    // Event listener para o botão "Próximo" do passo 1
    if (step1NextBtn) {
        step1NextBtn.addEventListener('click', () => showStep(2));
    }

    // Event listener para o botão "Próximo" do passo 3.5 (Usuários)
    if (step35NextBtn) {
        step35NextBtn.addEventListener('click', () => {
            if (validateUserFields()) {
                showStep(4);
                populateSummary();
            } else {
                // Se a validação falhar, desabilitar o botão novamente
                step35NextBtn.disabled = true;
                step35NextBtn.classList.remove('btn-success');
                step35NextBtn.classList.add('btn-secondary');
            }
        });
    }
    
    // Event listener para o botão de geração automática de usuários
    document.getElementById('generate-users-btn')?.addEventListener('click', generateUsersWithPrefix);

    // "Next" navigation for steps 2 and 3
    document.querySelectorAll('.next-step-btn:not(#step-1-next-btn):not(#step-3-5-next-btn):not(#confirm-summary-btn)').forEach(button => {
        button.addEventListener('click', (e) => {
            if (e.currentTarget.disabled) return;
            let canProceed = true;
            
            if (currentStep === 2) {
                // Validar dados de rede se estiver no modo de edição
                if (networkInfoEditArea.style.display !== "none") {
                    canProceed = validateNetworkForm();
                    if (canProceed) {
                        // Atualizar formData com os valores editados
                        formData.network.serverIp = document.getElementById('server-ip').value;
                        formData.network.netmask = document.getElementById('netmask').value;
                        formData.network.gateway = document.getElementById('gateway').value;
                        formData.network.dnsServer = document.getElementById('dns-server').value;
                        
                        const dhcpRange = document.getElementById('dhcp-range').value;
                        const rangeParts = dhcpRange.split('-').map(part => part.trim());
                        if (rangeParts.length === 2) {
                            formData.network.dhcpRangeStart = rangeParts[0];
                            formData.network.dhcpRangeEnd = rangeParts[1];
                            formData.network.dhcpRange = dhcpRange;
                        }
                    }
                }
            } else if (currentStep === 3) {
                // Validar dados da imagem
                const username = document.getElementById('username');
                if (username && username.value.trim() === '') {
                    username.classList.add('is-invalid');
                    canProceed = false;
                } else if (username) {
                    username.classList.remove('is-invalid');
                }
            }
            
            if (canProceed) {
                if (currentStep === 2) {
                    showStep(3);
                } else if (currentStep === 3) {
                    showStep(3.5);
                }
            }
        });
    });

    // "Back" navigation for all steps
    prevStepButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep === 3.5) {
                showStep(3);
            } else if (currentStep > 1) {
                showStep(currentStep - 1);
            }
        });
    });

    // Event listeners para os botões do step final
    document.getElementById('export-config-btn-final')?.addEventListener('click', () => {
        const configData = JSON.stringify(formData, null, 2);
        const blob = new Blob([configData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ltsp_config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    document.getElementById('restart-wizard-btn-final')?.addEventListener('click', () => {
        window.location.reload();
    });

    // Confirm and apply configurations
    if (confirmSummaryBtn) {
        confirmSummaryBtn.addEventListener('click', async () => {
            populateSummary();
            showStep(5);
            
            if(applyProgressBar) {
                applyProgressBar.style.width = '0%';
                applyProgressBar.textContent = '0%';
                applyProgressBar.closest('.progress').style.display = 'flex';
            }
            
            if(applyOutput) {
                applyOutput.innerHTML = '<p>Enviando configurações ao servidor e iniciando scripts...</p>';
                applyOutput.style.display = 'block';
            }
            
            // Coletar todos os dados para enviar
            // Salvar o SO selecionado (linux ou windows) ANTES de enviar
            formData.image.version = document.getElementById('os-selector').value;
            if (formData.image.version === 'linux') {
                formData.image.version = document.getElementById('ubuntu-version').value;
            }
            const payload = {
                network: { ...formData.network },
                image: {
                    version: formData.image.version,
                    desktopEnvironment: formData.image.desktopEnvironment,
                    additionalPackages: formData.image.additionalPackages,
                    autologin: formData.image.autologin
                },
                users: formData.users
            };
            
            try {
                // Primeiro, configurar os usuários no ltsp.conf
                const usersResponse = await fetch('/run_montar_conf', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ users: formData.users })
                });

                if (!usersResponse.ok) {
                    throw new Error('Falha ao configurar usuários no LTSP');
                }

                // Depois, executar todas as outras configurações
                const response = await fetch('/run_all_configurations', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });

                
                
                if (!response.ok) {
                    applyOutput.innerHTML += `<p style="color:red;">Erro na execução da configuração: ${response.status} ${response.statusText}</p>`;
                    return;
                }
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let progress = 0;
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    applyOutput.innerHTML = buffer;
                    applyOutput.scrollTop = applyOutput.scrollHeight;

                    // Detecta o marcador de finalização do backend
                    if (buffer.includes("id='install-finished'")) {
                        showStep(6); // ou window.location.href = '/concluido';
                        break;
                    }
                    // Verifica se o buffer contém a mensagem de sucesso
                    if (buffer.includes("Configurações LTSP aplicadas com sucesso!")) {
                        progress = 100; // Completa a barra de progresso
                        // Mostrar o step final de conclusão
                        showStep(6);
                    } else {
                        // Incrementa gradualmente até 95% (para deixar os últimos 5% para a mensagem final)
                        progress = Math.min(95, progress + 5);
                    }
    
                    if(applyProgressBar) {
                        applyProgressBar.style.width = `${progress}%`;
                        applyProgressBar.textContent = `${progress}%`;
                    }
                }
                
            } catch (error) {
                applyOutput.innerHTML += `<p style='color:red;'>Erro inesperado durante a aplicação das configurações: ${error.message}</p>`;
            }
        });
    }

    // Função auxiliar para buscar saída de script
    async function fetchScriptOutput(url, outputElement, method = 'GET', body = null, onSuccess = null, onError = null) {
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

    // Restart wizard button
    if (restartWizardBtn) {
        restartWizardBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }

    // Export config button
    if (exportConfigBtn) {
        exportConfigBtn.addEventListener('click', () => {
            const configData = JSON.stringify(formData, null, 2);
            const blob = new Blob([configData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ltsp_config.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
});