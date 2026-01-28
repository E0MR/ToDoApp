document.addEventListener("DOMContentLoaded", () => {
    applySavedTheme();
    // Initialize Clocks UI
    ["h1", "h2", "m1", "m2", "s1", "s2"].forEach(createDigitUI);
    initAnalogClock();
    updateClocks();
    setInterval(updateClocks, 1000);

    // Initialize Database and Categories
    initDB(() => {
        loadCategories();
        render();
    });
});
