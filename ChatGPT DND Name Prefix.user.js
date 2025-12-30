// ==UserScript==
// @name         ChatGPT DND Name Prefix (Stable)
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Reliably prefix ChatGPT messages with player name
// @match        https://chatgpt.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const PLAYER_NAME = 'Rodney';
    const PREFIX = `[${PLAYER_NAME}]~ `;

    let editor = null;

    function findEditor() {
        editor = document.querySelector('#prompt-textarea.ProseMirror');
        return editor;
    }

    function applyPrefix(reason) {
        if (!editor) findEditor();
        if (!editor) return;

        const text = editor.innerText.trim();
        if (!text) return;
        if (text.startsWith(PREFIX)) return;

        editor.innerText = PREFIX + text;

        // restore caret
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editor);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);

        console.log('[DND PREFIX]', reason, editor.innerText);
    }

    function attachEditorHooks() {
        if (!editor || editor.dataset.dndBound) return;
        editor.dataset.dndBound = 'true';

        // ENTER key inside editor
        editor.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                applyPrefix('enter');
            }
        }, true);

        console.log('[DND PREFIX] editor bound');
    }

    // Hook send button EARLY
    document.addEventListener('pointerdown', e => {
        const btn = e.target.closest(
            'button[aria-label*="Send"], button[type="submit"]'
        );
        if (!btn) return;
        applyPrefix('send button');
    }, true);

    // Observe DOM changes (ChatGPT re-renders constantly)
    const observer = new MutationObserver(() => {
        if (!editor) {
            if (findEditor()) attachEditorHooks();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
