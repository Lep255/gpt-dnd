// ==UserScript==
// @name         ChatGPT DND Name Prefix (Observer)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Automatically prefix ChatGPT messages with player name
// @match        https://chatgpt.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const PLAYER_NAME = 'Rodney';
    const PREFIX = `[${PLAYER_NAME}]~ `;

    let editor = null;

    function getEditor() {
        editor = document.querySelector('#prompt-textarea.ProseMirror');
        return editor;
    }

    function prefixMessage() {
        if (!editor) editor = getEditor();
        if (!editor) return;

        const text = editor.innerText.trim();
        if (!text) return;
        if (text.startsWith(PREFIX)) return;

        editor.innerText = PREFIX + text;

        // Move cursor to end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editor);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);

        console.log('Message prefixed:', editor.innerText);
    }

    function attachListeners() {
        if (!editor) return;

        // Avoid attaching multiple times
        if (editor.dataset.dndPrefixAttached) return;
        editor.dataset.dndPrefixAttached = 'true';

        // Intercept Enter
        editor.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                prefixMessage();
            }
        });

        // Intercept Send buttons
        document.addEventListener('click', e => {
            const btn = e.target.closest('button[aria-label="Send"], button[type="submit"]');
            if (!btn) return;
            prefixMessage();
        });
    }

    // Watch for editor dynamically
    const observer = new MutationObserver(() => {
        if (!editor) {
            if (getEditor()) attachListeners();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
