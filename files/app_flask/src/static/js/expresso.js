// expresso.js - merged script for the Expresso page
// Contains: dark mode toggle, i18n (language switcher), and expresso step flow + progress polling

const translations = {
    "en": {
        "title": "Laborat\u00f3rios Inteligentes Unificados",
        "subtitle": "Installation and Configuration Wizard",
        "loading_text": "Loading..."
    },
    "pt-BR": {
        "title": "Laborat\u00f3rios Inteligentes Unificados",
        "subtitle": "Assistente de Instala\u00e7\u00e3o e Configura\u00e7\u00e3o",
        "loading_text": "Carregando..."
    }
};

let currentLanguage = localStorage.getItem("language") || "pt-BR";

function translate(key) {
    return (translations[currentLanguage] && translations[currentLanguage][key]) || (translations['en'] && translations['en'][key]) || key;
}

function updateTranslations() {
    document.querySelectorAll("[data-translate]").forEach(element => {
        const key = element.dataset.translate;
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        } else if (translations["en"] && translations["en"][key]) {
            element.textContent = translations["en"][key];
        }
    });
    // Update placeholders (best-effort)
    document.querySelectorAll("input[placeholder]").forEach(input => {
        const key = input.getAttribute("placeholder");
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            input.setAttribute("placeholder", translations[currentLanguage][key]);
        }
    });
}

function initDarkMode() {
    try {
        const darkModeToggle = document.createElement("button");
        darkModeToggle.textContent = "\ud83c\udf19";
        darkModeToggle.classList.add("btn", "btn-outline-secondary", "position-fixed", "bottom-0", "end-0", "m-3");
        darkModeToggle.style.zIndex = "1050";
        document.body.appendChild(darkModeToggle);

        const setDarkMode = (isDark) => {
            if (isDark) {
                document.body.classList.add("dark-mode");
                darkModeToggle.textContent = "\u2600\ufe0f";
                localStorage.setItem("darkMode", "enabled");
            } else {
                document.body.classList.remove("dark-mode");
                darkModeToggle.textContent = "\ud83c\udf19";
                localStorage.setItem("darkMode", "disabled");
            }
        };

        if (localStorage.getItem("darkMode") === "enabled") {
            setDarkMode(true);
        }

        darkModeToggle.addEventListener("click", () => {
            setDarkMode(!document.body.classList.contains("dark-mode"));
        });
    } catch (e) {
        console.warn('dark mode init failed', e);
    }
}

function initI18n() {
    try {
        const languageSelector = document.createElement("div");
        languageSelector.classList.add("position-fixed", "bottom-0", "start-0", "m-3", "btn-group");
        languageSelector.style.zIndex = "1050";

        const ptButton = document.createElement("button");
        ptButton.classList.add("btn", "btn-sm");
        ptButton.textContent = "\ud83c\udde7\ud83c\uddf7 PT";
        ptButton.addEventListener("click", () => setLanguage("pt-BR"));

        const enButton = document.createElement("button");
        enButton.classList.add("btn", "btn-sm");
        enButton.textContent = "\ud83c\uddfa\ud83c\uddf8 EN";
        enButton.addEventListener("click", () => setLanguage("en"));

        languageSelector.appendChild(ptButton);
        languageSelector.appendChild(enButton);
        document.body.appendChild(languageSelector);

        function setLanguage(lang) {
            currentLanguage = lang;
            localStorage.setItem("language", lang);
            updateButtonStyles();
            updateTranslations();
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

        updateButtonStyles();
        updateTranslations();
        window.updateTranslations = updateTranslations;
        window.translate = translate;
    } catch (e) {
        console.warn('i18n init failed', e);
    }
}

function initExpressoStepsAndPolling() {
    const stepsContainer = document.getElementById('expresso-steps');
    const progressBar = document.getElementById('main-progress-bar');
    const startBtn = document.getElementById('start-install-btn');
    const configMsg = document.getElementById('config-message');
    const finalMsg = document.getElementById('final-message');
    const progressSteps = document.querySelectorAll('.progress-step');

    let polling = null;

    function updateProgressUI(data) {
        // Normalize step2 progress value (backend may send an object or simple string)
        let step2ProgressVal = '';
        if (data && data.step2) {
            if (typeof data.step2 === 'string') {
                step2ProgressVal = data.step2;
            } else if (data.step2.progress) {
                step2ProgressVal = data.step2.progress;
            }
        }

        // Update step statuses
        if (data.step1) {
            const status1 = document.querySelector('#step-1 .status');
            if (status1) status1.textContent = data.step1;
            const bar1 = document.getElementById('step1-progress');
            if (bar1) {
                // Extract percentage from progress string if present
                const match = data.step1.match(/(\d+)%/);
                if (match) {
                    bar1.style.width = match[1] + '%';
                    bar1.textContent = match[1] + '%';
                } else if (data.step1.includes('concluída')) {
                    bar1.style.width = '100%';
                    bar1.textContent = '100%';
                }
            }
            // Automatically move to next step if completed
            if (data.step1.includes('concluída')) {
                progressSteps[0].classList.remove('active');
                progressSteps[0].classList.add('completed');
                progressSteps[1].classList.add('active');
                if (stepsContainer) {
                    const step1Pane = document.getElementById('step-1');
                    const step2Pane = document.getElementById('step-2');
                    if (step1Pane) step1Pane.classList.add('d-none');
                    if (step2Pane) step2Pane.classList.remove('d-none');
                }
            }
        }

        if (data.step2) {
            const bar2 = document.getElementById('step2-progress');
            if (bar2) {
                if (data.step2.progress) {
                    // Ensure progress string ends with '%'
                    let progressValue = data.step2.progress;
                    if (!progressValue.endsWith('%')) {
                        progressValue += '%';
                    }
                    bar2.style.width = progressValue;
                    bar2.textContent = progressValue;
                }
                if (data.step2.speed) {
                    const speedEl = document.querySelector('#step-2 .speed');
                    if (speedEl) speedEl.textContent = data.step2.speed;
                }
            }
        }

        if (data.step3) {
            const bar3 = document.getElementById('step3-progress');
            if (bar3 && data.step3.includes('concluída')) {
                bar3.style.width = '100%';
                bar3.textContent = '100%';
            }
        }

        if (data.step4) {
            const status4 = document.querySelector('#step-4 .status');
            if (status4) status4.textContent = data.step4;
            const bar4 = document.getElementById('step4-progress');
            if (bar4 && data.step4.includes('concluída')) {
                bar4.style.width = '100%';
                bar4.textContent = '100%';
            }
        }

        // Update main progress bar based on completion
        let mainProgress = 0;
        if (data.step1 && data.step1.includes('concluída')) mainProgress += 25;
    if (step2ProgressVal && (step2ProgressVal === 'Download concluído' || step2ProgressVal.includes('conclu'))) mainProgress += 25;
        if (data.step3 && data.step3.includes('concluída')) mainProgress += 25;
        if (data.step4 && data.step4.includes('concluída')) mainProgress += 25;

        if (progressBar) {
            progressBar.style.width = mainProgress + '%';
            progressBar.textContent = mainProgress + '%';
        }

        // Update progress steps visual
        progressSteps.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index === 0 && data.step1 && data.step1.includes('concluída')) {
                step.classList.add('completed');
            } else if (index === 1 && step2ProgressVal && (step2ProgressVal === 'Download concluído' || step2ProgressVal.includes('conclu'))) {
                step.classList.add('completed');
            } else if (index === 2 && data.step3 && data.step3.includes('concluída')) {
                step.classList.add('completed');
            } else if (index === 3 && data.step4 && data.step4.includes('concluída')) {
                step.classList.add('completed');
            } else if (index === 0 && data.step1 && !data.step1.includes('Erro')) {
                step.classList.add('active');
            }
        });

        if (data.finished) {
            if (polling) { clearInterval(polling); polling = null; }
            if (finalMsg) {
                finalMsg.classList.remove('d-none');
                finalMsg.innerHTML = 'Instalação concluída com sucesso!<br><a href="/" class="btn btn-primary mt-3">Voltar para Início</a>';
            }
        }
    }

    function pollProgress() {
        fetch('/expresso/progress')
            .then(r => { if (!r.ok) throw new Error('no-progress'); return r.json(); })
            .then(data => {
                updateProgressUI(data);
            })
            .catch(() => {
                // Ignore missing endpoint or network errors
            });
    }

    if (startBtn) {
        startBtn.addEventListener('click', function() {
            startBtn.classList.add('d-none');
            if (configMsg) configMsg.style.display = 'none';
            if (stepsContainer) stepsContainer.classList.remove('d-none');

            // Start server-side expresso
            fetch('/expresso/start', { method: 'POST' }).catch(()=>{});
            // Start polling for progress
            polling = setInterval(pollProgress, 1000);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initI18n();
    initExpressoStepsAndPolling();
});
