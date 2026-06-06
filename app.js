document.addEventListener('DOMContentLoaded', function () {
    const THEME_KEY = 'portfolio-theme';
    const root = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const navbar = document.querySelector('.navbar');

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

    function scrollToSection(selector) {
        const targetSection = document.querySelector(selector);
        if (!targetSection || !navbar) return false;

        window.scrollTo({
            top: targetSection.offsetTop - navbar.offsetHeight,
            behavior: 'smooth'
        });
        return true;
    }

    const links = document.querySelectorAll('.nav-link');

    for (const link of links) {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            scrollToSection(this.getAttribute('href'));
        });
    }

    initTerminal({ applyTheme, scrollToSection, root });
});

function initTerminal({ applyTheme, scrollToSection, root }) {
    const terminalPrompt = document.getElementById('terminal-prompt');
    const terminalInput = document.getElementById('terminal-input');
    const terminalInputField = document.getElementById('terminal-input-field');
    const terminalOutput = document.getElementById('terminal-output');
    const terminalWrap = document.getElementById('terminal-wrap');

    if (!terminalPrompt || !terminalInput || !terminalInputField || !terminalOutput || !terminalWrap) return;

    const HELP_COMMANDS = [
        ['help', 'show this message'],
        ['whoami', 'about me'],
        ['ls', 'list sections'],
        ['cd', 'navigate (experience, projects, contact)'],
        ['theme', 'toggle light/dark mode'],
        ['clear', 'clear output']
    ];

    const SECTIONS = {
        experience: '#experience',
        projects: '#projects',
        contact: '#contact'
    };

    const history = [];
    let historyIndex = -1;
    let draftInput = '';

    function buildHelpHtml() {
        const rows = HELP_COMMANDS.map(function (entry) {
            return (
                '<div class="terminal-help-row">' +
                '<span class="terminal-help-cmd">' + entry[0] + '</span>' +
                '<span class="terminal-help-desc">' + entry[1] + '</span>' +
                '</div>'
            );
        }).join('');

        return (
            '<div class="terminal-help-title">Available commands:</div>' +
            '<div class="terminal-help-grid">' + rows + '</div>'
        );
    }

    function syncInputWidth() {
        terminalInputField.dataset.value = terminalInput.value;
    }

    function normalizeDir(name) {
        if (!name) return '';
        return name.trim().toLowerCase().replace(/^\.?\/*/, '').replace(/\/+$/, '');
    }

    function scrollOutputToBottom() {
        requestAnimationFrame(function () {
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
        });
    }

    function appendBlock(commandLine, result) {
        const block = document.createElement('div');
        block.className = 'terminal-block';

        const cmdLine = document.createElement('div');
        cmdLine.className = 'terminal-line terminal-line--cmd';
        cmdLine.textContent = '$ ' + commandLine;
        block.appendChild(cmdLine);

        if (result && result.html) {
            const output = document.createElement('div');
            output.className = 'terminal-line terminal-line--output';
            output.innerHTML = result.html;
            block.appendChild(output);
        } else if (result && result.output) {
            const output = document.createElement('div');
            output.className = 'terminal-line terminal-line--output';
            output.textContent = result.output;
            block.appendChild(output);
        }

        terminalOutput.appendChild(block);
        scrollOutputToBottom();
    }

    function runCommand(raw) {
        const cmd = raw.trim();
        if (!cmd) return { output: '' };

        const parts = cmd.split(/\s+/);
        const name = parts[0].toLowerCase();
        const arg = parts[1]?.toLowerCase();

        switch (name) {
            case 'help':
                return { html: buildHelpHtml() };
            case 'whoami':
                return { output: 'Umar Javaid\nSoftware Engineer' };
            case 'ls':
                return { output: 'experience/  projects/  contact/' };
            case 'cd': {
                const arg = normalizeDir(parts.slice(1).join(' '));
                if (!arg) return { output: 'cd: missing operand' };
                const target = SECTIONS[arg];
                if (!target) return { output: 'cd: ' + arg + ': No such directory' };
                scrollToSection(target);
                return { output: '' };
            }
            case 'theme': {
                const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                applyTheme(next);
                return { output: 'Theme set to ' + next + ' mode.' };
            }
            case 'clear':
                return { clear: true };
            default:
                return { output: name + ': command not found. Type help for available commands.' };
        }
    }

    function submitCommand() {
        const value = terminalInput.value;
        const result = runCommand(value);

        if (result.clear) {
            terminalOutput.replaceChildren();
        } else if (value.trim() || result.output || result.html) {
            appendBlock(value, result);
        }

        if (value.trim()) {
            history.push(value);
            historyIndex = history.length;
            draftInput = '';
        }

        terminalInput.value = '';
        syncInputWidth();
        terminalInput.focus();
    }

    function focusTerminalInput() {
        terminalInput.focus();
    }

    function scrollPromptIntoView() {
        if (!window.matchMedia('(max-width: 991.98px)').matches) return;
        window.setTimeout(function () {
            terminalPrompt.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }, 300);
    }

    function bindOutputTapToFocus() {
        let touchStartX = 0;
        let touchStartY = 0;

        terminalOutput.addEventListener('touchstart', function (event) {
            if (!event.touches.length) return;
            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
        }, { passive: true });

        terminalOutput.addEventListener('touchend', function (event) {
            if (!event.changedTouches.length) return;
            const touch = event.changedTouches[0];
            const deltaX = Math.abs(touch.clientX - touchStartX);
            const deltaY = Math.abs(touch.clientY - touchStartY);
            if (deltaX < 12 && deltaY < 12) {
                focusTerminalInput();
            }
        });

        terminalOutput.addEventListener('mousedown', function (event) {
            if (event.pointerType === 'touch') return;
            event.preventDefault();
            focusTerminalInput();
        });
    }

    terminalPrompt.addEventListener('click', focusTerminalInput);

    bindOutputTapToFocus();

    terminalWrap.addEventListener('click', function (event) {
        if (event.target !== terminalInput) {
            focusTerminalInput();
        }
    });

    terminalInput.addEventListener('focus', scrollPromptIntoView);

    terminalInput.addEventListener('input', syncInputWidth);

    terminalInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            submitCommand();
            return;
        }

        if (event.key === 'Escape') {
            terminalInput.value = '';
            syncInputWidth();
            terminalInput.blur();
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (!history.length) return;

            if (historyIndex === history.length) {
                draftInput = terminalInput.value;
            }

            if (historyIndex > 0) {
                historyIndex -= 1;
                terminalInput.value = history[historyIndex];
                syncInputWidth();
            }
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (!history.length || historyIndex === history.length) return;

            if (historyIndex < history.length - 1) {
                historyIndex += 1;
                terminalInput.value = history[historyIndex];
            } else {
                historyIndex = history.length;
                terminalInput.value = draftInput;
            }
            syncInputWidth();
        }
    });

    document.addEventListener('click', function (event) {
        if (!terminalWrap.contains(event.target)) {
            terminalInput.blur();
        }
    });

    document.addEventListener('touchstart', function (event) {
        if (!terminalWrap.contains(event.target)) {
            terminalInput.blur();
        }
    }, { passive: true });

    syncInputWidth();
}
