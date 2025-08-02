const translations = {
    "en": {
        "title": "Laboratórios Inteligentes do IFTO",
        "subtitle": "Installation and Configuration Wizard",
        "step1_label": "Installation",
        "step2_label": "Network",
        "step3_label": "Image",
        "step4_label": "Summary",
        "step5_label": "Configuration",
        "step1_title": "Standard Packages Installation",
        "step1_description": "Click the button below to start installing the standard packages required for LTSP.",
        "start_installation_button": "Start Installation",
        "step2_title": "Network Configuration",
        "step2_description": "Configure the network options for the LTSP server.",
        "network_interface_label": "Network Interface",
        "server_ip_label": "Server IP Address",
        "netmask_label": "Netmask",
        "gateway_label": "Default Gateway",
        "dns_server_label": "DNS Server",
        "dhcp_range_label": "DHCP Range",
        "previous_button": "Previous",
        "next_button": "Next",
        "step3_title": "Image Creation",
        "ubuntu_version_label": "Select Ubuntu version:",
        "ubuntu_jammy": "Ubuntu 22.04 (Jammy Jellyfish)",
        "ubuntu_focal": "Ubuntu 20.04 (Focal Fossa)",
        "ubuntu_bionic": "Ubuntu 18.04 (Bionic Beaver)",
        "additional_packages_label": "Additional packages (comma-separated):",
        "customize_image_label": "Customize image (optional)",
        "step4_title": "Configuration Summary",
        "confirm_button": "Confirm and Apply",
        "edit_button": "Edit",
        "step5_title": "Applying Configurations",
        "step5_description": "Please wait while the configurations are being applied...",
        "loading_text": "Loading...",
        "modal_title": "Process Completed!",
        "modal_body": "LTSP configuration has been completed successfully.",
        "export_button": "Export Settings",
        "restart_button": "Restart Wizard",
        "error_invalid_server_ip": "Invalid Server IP Address.",
        "error_invalid_netmask": "Invalid Netmask.",
        "error_invalid_gateway": "Invalid Gateway Address.",
        "error_invalid_dns": "Invalid DNS Server Address.",
        "summary_network_title": "Network Configuration",
        "summary_network_interface": "Interface:",
        "summary_server_ip": "Server IP:",
        "summary_netmask": "Netmask:",
        "summary_gateway": "Gateway:",
        "summary_dns": "DNS:",
        "summary_dhcp_range": "DHCP Range:",
        "summary_image_title": "Image Configuration",
        "summary_ubuntu_version": "Ubuntu Version:",
        "summary_additional_packages": "Additional Packages:",
        "summary_customize_image": "Customize Image:",
        "yes": "Yes",
        "no": "No"
    },
    "pt-BR": {
        "title": "Laboratórios Inteligentes do IFTO",
        "subtitle": "Assistente de Instalação e Configuração",
        "step1_label": "Instalação",
        "step2_label": "Rede",
        "step3_label": "Imagem",
        "step4_label": "Resumo",
        "step5_label": "Configuração",
        "step1_title": "Instalação dos Pacotes Padrão",
        "step1_description": "Clique no botão abaixo para iniciar a instalação dos pacotes padrão necessários para o LTSP.",
        "start_installation_button": "Iniciar Instalação",
        "step2_title": "Configuração de Rede",
        "step2_description": "Configure as opções de rede para o servidor LTSP.",
        "network_interface_label": "Interface de Rede",
        "server_ip_label": "Endereço IP",
        "netmask_label": "Máscara de Rede",
        "gateway_label": "Gateway Padrão",
        "dns_server_label": "Servidor DNS",
        "dhcp_range_label": "Faixa DHCP",
        "previous_button": "Voltar",
        "next_button": "Próximo",
        "step3_title": "Criação de Imagem",
        "ubuntu_version_label": "Selecione a versão do Ubuntu:",
        "ubuntu_jammy": "Ubuntu 22.04 (Jammy Jellyfish)",
        "ubuntu_focal": "Ubuntu 20.04 (Focal Fossa)",
        "ubuntu_bionic": "Ubuntu 18.04 (Bionic Beaver)",
        "additional_packages_label": "Pacotes adicionais (separados por vírgula):",
        "customize_image_label": "Personalizar imagem (opcional)",
        "step4_title": "Resumo das Configurações",
        "confirm_button": "Confirmar e Aplicar",
        "edit_button": "Editar",
        "step5_title": "Aplicando Configurações",
        "step5_description": "Por favor, aguarde enquanto as configurações são aplicadas...",
        "loading_text": "Carregando...",
        "modal_title": "Processo Concluído!",
        "modal_body": "A configuração do LTSP foi concluída com sucesso.",
        "export_button": "Exportar Configurações",
        "restart_button": "Reiniciar Assistente",
        "error_invalid_server_ip": "Endereço IP do Servidor inválido.",
        "error_invalid_netmask": "Máscara de Rede inválida.",
        "error_invalid_gateway": "Endereço do Gateway inválido.",
        "error_invalid_dns": "Endereço do Servidor DNS inválido.",
        "summary_network_title": "Configuração de Rede",
        "summary_network_interface": "Interface:",
        "summary_server_ip": "IP do Servidor:",
        "summary_netmask": "Máscara de Rede:",
        "summary_gateway": "Gateway:",
        "summary_dns": "DNS:",
        "summary_dhcp_range": "Faixa DHCP:",
        "summary_image_title": "Configuração da Imagem",
        "summary_ubuntu_version": "Versão Ubuntu:",
        "summary_additional_packages": "Pacotes Adicionais:",
        "summary_customize_image": "Personalizar Imagem:",
        "yes": "Sim",
        "no": "Não"
    }
};

let currentLanguage = localStorage.getItem("language") || "pt-BR"; // Default to Portuguese

function translate(key) {
    return translations[currentLanguage][key] || key;
}

function updateTranslations() {
    document.querySelectorAll("[data-translate]").forEach(element => {
        const key = element.dataset.translate;
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        } else if (translations["en"] && translations["en"][key]) { // Fallback to English if key not found in current lang
             element.textContent = translations["en"][key];
        }
    });
    // Update placeholders
    document.querySelectorAll("input[placeholder]").forEach(input => {
        const key = input.getAttribute("placeholder");
        // Assuming placeholders are also keys or can be mapped to keys
        // For simplicity, this example assumes direct key match or a convention
        // A more robust solution might involve data-translate-placeholder attributes
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
             input.setAttribute("placeholder", translations[currentLanguage][key]);
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const languageSelector = document.createElement("div");
    languageSelector.classList.add("position-fixed", "bottom-0", "start-0", "m-3", "btn-group");
    languageSelector.style.zIndex = "1050";

    const ptButton = document.createElement("button");
    ptButton.classList.add("btn", "btn-sm");
    ptButton.textContent = "🇧🇷 PT";
    ptButton.addEventListener("click", () => setLanguage("pt-BR"));

    const enButton = document.createElement("button");
    enButton.classList.add("btn", "btn-sm");
    enButton.textContent = "🇺🇸 EN";
    enButton.addEventListener("click", () => setLanguage("en"));

    languageSelector.appendChild(ptButton);
    languageSelector.appendChild(enButton);
    document.body.appendChild(languageSelector);

    function setLanguage(lang) {
        currentLanguage = lang;
        localStorage.setItem("language", lang);
        updateButtonStyles();
        updateTranslations();
        // Special case for summary, as it might be dynamically generated
        if (document.getElementById("step-4").classList.contains("active")){
            // This assumes populateSummary() is globally available or part of script.js scope
            // and that it calls updateTranslations() internally or we call it after.
            if(typeof populateSummary === "function") {
                // populateSummary(); // This might re-render summary, then updateTranslations will handle it.
            }
        }
    }

    function updateButtonStyles() {
        if (currentLanguage === "pt-BR") {
            ptButton.classList.add("btn-primary");
            ptButton.classList.remove("btn-outline-primary");
            enButton.classList.add("btn-outline-primary");
            enButton.classList.remove("btn-primary");
        } else {
            enButton.classList.add("btn-primary");
            enButton.classList.remove("btn-outline-primary");
            ptButton.classList.add("btn-outline-primary");
            ptButton.classList.remove("btn-primary");
        }
    }

    // Initial load
    updateButtonStyles();
    updateTranslations();
    window.updateTranslations = updateTranslations; // Make it globally accessible for script.js
    window.translate = translate; // Make translate function global for script.js alerts
});

