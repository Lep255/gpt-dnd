// ==UserScript==
// @name         ChatGPT DND Name Prefix
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically prefix ChatGPT messages with player name
// @match        https://chatgpt.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const PLAYER_NAME = 'Rodney';
    const PREFIX = `[${PLAYER_NAME}]~ `;

    function getEditor() {
        return document.querySelector('#prompt-textarea.ProseMirror');
    }

    function prefixMessage() {
        const editor = getEditor();
        if (!editor) return;

        const text = editor.innerText.trim();
        if (!text) return;

        // Prevent double prefix
        if (text.startsWith(PREFIX)) return;

        editor.innerText = PREFIX + text;

        // Move cursor to end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editor);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    // Intercept Enter key
    document.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            const editor = getEditor();
            if (!editor) return;
            if (!editor.contains(document.activeElement)) return;

            prefixMessage();
        }
    }, true);

    // Intercept Send button click
    document.addEventListener('click', e => {
        const btn = e.target.closest('button[aria-label="Send"], button[type="submit"]');
        if (!btn) return;

        prefixMessage();
    }, true);

})();
