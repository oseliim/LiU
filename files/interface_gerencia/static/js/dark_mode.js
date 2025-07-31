document.addEventListener("DOMContentLoaded", () => {
    const darkModeToggle = document.createElement("button");
    darkModeToggle.innerHTML = "🌙";
    darkModeToggle.classList.add("btn", "btn-outline-secondary", "position-fixed", "bottom-0", "start-0", "m-3");
    darkModeToggle.style.zIndex = "1050";
    darkModeToggle.setAttribute("aria-label", "Toggle theme");
    document.body.appendChild(darkModeToggle);

    const getPreferredTheme = () => {
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme) {
            return storedTheme;
        }
        // Check system preference
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };

    const setTheme = (theme) => {
        if (theme === "dark") {
            document.documentElement.setAttribute("data-bs-theme", "dark");
            document.body.classList.remove('bg-custom-light');
            document.body.classList.add('bg-custom-dark');
            darkModeToggle.innerHTML = "☀️"; // Sun icon
        } else {
            document.documentElement.setAttribute("data-bs-theme", "light");
            document.body.classList.remove('bg-custom-dark');
            document.body.classList.add('bg-custom-light');
            darkModeToggle.innerHTML = "🌙"; // Moon icon
        }
        localStorage.setItem("theme", theme);
    };

    // Set initial theme on load
    setTheme(getPreferredTheme());

    darkModeToggle.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-bs-theme");
        setTheme(currentTheme === "dark" ? "light" : "dark");
    });
});