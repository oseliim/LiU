document.addEventListener("DOMContentLoaded", () => {
	const darkModeToggle = document.createElement("button");
	darkModeToggle.textContent = "🌙"; // Initial icon, can be improved
	darkModeToggle.classList.add("btn", "btn-outline-secondary", "position-fixed", "bottom-0", "end-0", "m-3");
	darkModeToggle.style.zIndex = "1050"; // Ensure it's above other elements
	document.body.appendChild(darkModeToggle);

	const setDarkMode = (isDark) => {
		if (isDark) {
			document.body.classList.add("dark-mode");
			darkModeToggle.textContent = "☀️"; // Sun icon for light mode
			localStorage.setItem("darkMode", "enabled");
		} else {
			document.body.classList.remove("dark-mode");
			darkModeToggle.textContent = "🌙"; // Moon icon for dark mode
			localStorage.setItem("darkMode", "disabled");
		}
	};

	// Check local storage for saved preference
	if (localStorage.getItem("darkMode") === "enabled") {
		setDarkMode(true);
	}

	darkModeToggle.addEventListener("click", () => {
		setDarkMode(!document.body.classList.contains("dark-mode"));
	});
});

