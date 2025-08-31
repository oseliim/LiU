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
    // Steps flow (cards)
    const stepCards = [
        document.getElementById('card-step1'),
        document.getElementById('card-step2'),
        document.getElementById('card-step3'),
        document.getElementById('card-step4')
    ];
    const progressBar = document.getElementById('main-progress-bar');
    const startBtn = document.getElementById('start-install-btn');
    const configMsg = document.getElementById('config-message');
    const finalMsg = document.getElementById('final-message');

    let currentStep = -1;
    let polling = null;

    function showStep(idx) {
        stepCards.forEach((card, i) => {
            if (card) card.classList.toggle('d-none', i !== idx);
        });
        if (progressBar) {
            const percent = Math.round(((idx+1)/stepCards.length)*100);
            progressBar.style.width = percent + '%';
            progressBar.setAttribute('aria-valuenow', percent);
            progressBar.textContent = percent + '%';
        }
        currentStep = idx;
    }

    if (startBtn) {
        startBtn.addEventListener('click', function() {
            startBtn.style.display = 'none';
            if (configMsg) configMsg.style.display = 'none';
            showStep(0);

            // Start server-side expresso if route exists
            fetch('/expresso/start', { method: 'POST' }).catch(()=>{});
            // Start polling for progress (only if endpoint exists)
            polling = setInterval(updateProgress, 1200);
        });
    }

    document.querySelectorAll('.next-step-btn').forEach((btn, idx) => {
        btn.addEventListener('click', function() {
            showStep(idx+1);
        });
    });

    const finishBtn = document.querySelector('.finish-btn');
    if (finishBtn) {
        finishBtn.addEventListener('click', function() {
            stepCards.forEach(card => card && card.classList.add('d-none'));
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.textContent = '100%';
            }
            if (finalMsg) {
                finalMsg.classList.remove('d-none');
                finalMsg.textContent = 'Instala\u00e7\u00e3o Expresso conclu\u00edda!';
            }
            if (polling) { clearInterval(polling); }
        });
    }

    function updateProgress() {
        fetch('/expresso/progress')
            .then(r => { if (!r.ok) throw new Error('no-progress'); return r.json(); })
            .then(data => {
                try {
                    // map data to page elements if present
                    const card1 = document.getElementById('card-step1');
                    const card2 = document.getElementById('card-step2');
                    const card3 = document.getElementById('card-step3');
                    const card4 = document.getElementById('card-step4');

                    if (card1 && data.step1) {
                        const s = card1.querySelector('.status'); if (s) s.textContent = data.step1;
                    }
                    if (card2 && data.step2) {
                        const p = card2.querySelector('.progress'); if (p) p.textContent = data.step2.progress || data.step2;
                        const sp = card2.querySelector('.speed'); if (sp) sp.textContent = data.step2.speed || '';
                    }
                    if (card3 && data.step3) {
                        const p3 = card3.querySelector('.progress'); if (p3) p3.textContent = data.step3;
                    }
                    if (card4 && data.step4) {
                        const s4 = card4.querySelector('.status'); if (s4) s4.textContent = data.step4;
                    }
                    if (data.finished) {
                        if (polling) { clearInterval(polling); polling = null; }
                        if (startBtn) startBtn.disabled = false;
                    }
                } catch (e) {
                    console.warn('updateProgress map failed', e);
                }
            })
            .catch(() => {
                // Ignore missing endpoint or network errors
            });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initI18n();
    initExpressoStepsAndPolling();
});
