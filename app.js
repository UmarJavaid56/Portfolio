document.addEventListener('DOMContentLoaded', function () {
    const THEME_KEY = 'portfolio-theme';
    const root = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');

    function applyTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') theme = 'dark';
        root.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
        if (themeToggle) {
            themeToggle.setAttribute(
                'aria-label',
                theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            );
        }
    }

    let stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') {
        applyTheme(stored);
    } else {
        applyTheme('dark');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(next);
        });
    }

    const links = document.querySelectorAll('.nav-link');

    for (const link of links) {
        link.addEventListener('click', function (event) {
            event.preventDefault();

            const targetID = this.getAttribute('href');
            const targetSection = document.querySelector(targetID);

            window.scrollTo({
                top: targetSection.offsetTop - document.querySelector('.navbar').offsetHeight,
                behavior: 'smooth'
            });
        });
    }
});

