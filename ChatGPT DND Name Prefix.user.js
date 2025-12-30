// ==UserScript==
// @name         ChatGPT DND Name Prefix Debug
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Automatically prefix ChatGPT messages with player name (with debug)
// @match        https://chatgpt.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const PLAYER_NAME = 'Rodney';
    const PREFIX = `[${PLAYER_NAME}]~ `;

    function getEditor() {
        const editor = document.querySelector('#prompt-textarea.ProseMirror');
        if (!editor) console.log('Editor not found!');
        return editor;
    }

    function prefixMessage() {
        const editor = getEditor();
        if (!editor) return;

        const text = editor.innerText.trim();
        console.log('Original text:', text);

        if (!text) return;
        if (text.startsWith(PREFIX)) {
            console.log('Already prefixed, skipping.');
            return;
        }

        editor.innerText = PREFIX + text;
        console.log('Prefixed text:', editor.innerText);

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

            console.log('Enter pressed in editor.');
            prefixMessage();
        }
    }, true);

    // Intercept Send button click
    document.addEventListener('click', e => {
        const btn = e.target.closest('button[aria-label="Send"], button[type="submit"]');
        if (!btn) return;

        console.log('Send button clicked.');
        prefixMessage();
    }, true);

})();
