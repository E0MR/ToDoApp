function toggleTheme() {
    const body = document.body;
    const themeBtn = document.getElementById("themeBtn");
    const isDark = body.getAttribute("data-theme") === "dark";
    const newTheme = isDark ? "light" : "dark";

    body.setAttribute("data-theme", newTheme);
    localStorage.setItem("todo-theme", newTheme);

    updateThemeIcon(newTheme);
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem("todo-theme") || "light";
    document.body.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    const themeBtn = document.getElementById("themeBtn");
    if (themeBtn && typeof ICONS !== 'undefined') {
        themeBtn.innerHTML = theme === "dark" ? ICONS.moon : ICONS.sun;
    } else if (themeBtn) {
        // Fallback if ICONS is not loaded yet (should not happen with regular script load)
        themeBtn.innerText = theme === "dark" ? "🌙" : "☀️";
    }
}
