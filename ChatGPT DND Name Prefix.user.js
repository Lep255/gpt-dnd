// ==UserScript==
// @name         ChatGPT DND Prefix PreFill
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Pre-fills ChatGPT composer with [Name]~ so messages are always tagged
// @match        https://chatgpt.com/c/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const PLAYER_NAME = 'Rodney';
  const PREFIX = `[${PLAYER_NAME}]~ `;

  function getEditor() {
    // ChatGPT composer contenteditable
    return document.querySelector('#prompt-textarea.ProseMirror');
  }

  function setCaretToEnd(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function ensurePrefill(reason = '') {
    const editor = getEditor();
    if (!editor) return;

    // innerText on ProseMirror is generally reliable for "what user sees"
    const text = editor.innerText.replace(/\u200B/g, '').trim(); // strip zero-width
    const hasPrefix = editor.innerText.startsWith(PREFIX);

    // If empty or just whitespace, inject prefix
    if (!text) {
      if (!hasPrefix) {
        editor.innerText = PREFIX;
        // give the DOM a moment then move caret
        requestAnimationFrame(() => setCaretToEnd(editor));
        // console.log('[DND PREFILL]', reason, 'inserted');
      }
      return;
    }

    // If user started typing but prefix is missing (e.g., paste), add it once.
    if (!hasPrefix) {
      editor.innerText = PREFIX + editor.innerText;
      requestAnimationFrame(() => setCaretToEnd(editor));
      // console.log('[DND PREFILL]', reason, 'repaired');
    }
  }

  function bindEditor(editor) {
    if (editor.dataset.dndPrefillBound) return;
    editor.dataset.dndPrefillBound = 'true';

    // When user focuses into the box, ensure prefix exists
    editor.addEventListener('focus', () => ensurePrefill('focus'), true);

    // When user types/deletes/pastes, keep prefix present
    editor.addEventListener('input', () => ensurePrefill('input'), true);

    // If they try to backspace into the prefix, restore it
    editor.addEventListener('keydown', (e) => {
      if (e.key !== 'Backspace' && e.key !== 'Delete') return;

      // If they’re about to delete the prefix area, restore on next frame
      requestAnimationFrame(() => ensurePrefill('delete'));
    }, true);

    // Initial fill
    ensurePrefill('bind');
  }

  // Watch for ChatGPT re-rendering the composer
  const obs = new MutationObserver(() => {
    const editor = getEditor();
    if (editor) bindEditor(editor);
  });

  obs.observe(document.body, { childList: true, subtree: true });

  // Try immediately too
  const initial = getEditor();
  if (initial) bindEditor(initial);
})();
