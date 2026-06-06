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

    const GHOST_HINT_KEY = 'portfolio-terminal-discovered';
    let ghostHintStop = null;

    function stopGhostHint() {
        if (ghostHintStop) ghostHintStop();
    }

    function syncInputWidth() {
        terminalInputField.dataset.value = terminalInput.value;
        if (terminalInput.value) {
            stopGhostHint();
        }
    }

    function initGhostHint() {
        const ghost = document.getElementById('terminal-ghost');
        if (!ghost || localStorage.getItem(GHOST_HINT_KEY)) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const GHOST_TEXT = ' Enter help';
        const TYPE_MS = 130;
        const ERASE_MS = 95;
        const HOLD_TYPED_MS = 2800;
        const PAUSE_EMPTY_MS = 6000;
        const START_DELAY_MS = 2200;

        let timeoutId = null;
        let charIndex = 0;
        let stopped = false;

        function clearTimer() {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        }

        function shouldContinue() {
            return !stopped &&
                !localStorage.getItem(GHOST_HINT_KEY) &&
                !terminalInput.value;
        }

        function schedule(fn, delay) {
            clearTimer();
            timeoutId = window.setTimeout(fn, delay);
        }

        function tickErase() {
            if (!shouldContinue()) return;
            charIndex -= 1;
            ghost.textContent = GHOST_TEXT.slice(0, charIndex);
            if (charIndex > 0) {
                schedule(tickErase, ERASE_MS);
            } else {
                ghost.textContent = '';
                schedule(startTyping, PAUSE_EMPTY_MS);
            }
        }

        function tickType() {
            if (!shouldContinue()) return;
            charIndex += 1;
            ghost.textContent = GHOST_TEXT.slice(0, charIndex);
            if (charIndex < GHOST_TEXT.length) {
                schedule(tickType, TYPE_MS);
            } else {
                schedule(tickErase, HOLD_TYPED_MS);
            }
        }

        function startTyping() {
            if (!shouldContinue()) return;
            charIndex = 0;
            tickType();
        }

        ghostHintStop = function () {
            if (stopped) return;
            stopped = true;
            clearTimer();
            ghost.textContent = '';
            localStorage.setItem(GHOST_HINT_KEY, '1');
        };

        schedule(startTyping, START_DELAY_MS);
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
                return {
                    output: 'Umar Javaid, Software Engineer\nMcMaster · NVIDIA · AMD'
                };
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
        stopGhostHint();
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
        stopGhostHint();
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
        stopGhostHint();

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
    initGhostHint();
}
