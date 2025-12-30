// ==UserScript==
// @name         ChatGPT DND Prefix PreFill (ProseMirror-safe)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Pre-fills ChatGPT composer with [Name]~ before typing
// @match        https://chatgpt.com/c/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const PLAYER_NAME = 'Rodney';
  const PREFIX = `[${PLAYER_NAME}]~ `;

  function getEditor() {
    // Matches your provided HTML exactly
    const el = document.querySelector('#prompt-textarea');
    if (!el) return null;
    if (el.getAttribute('contenteditable') !== 'true') return null;
    return el;
  }

  function getPlainText(editor) {
    // ProseMirror often includes trailing newlines / zero-width chars
    return (editor.textContent || '').replace(/\u200B/g, '').trim();
  }

  function ensureFirstParagraph(editor) {
    // Make sure there's at least one <p>
    let p = editor.querySelector('p');
    if (!p) {
      p = document.createElement('p');
      editor.innerHTML = '';
      editor.appendChild(p);
    }
    return p;
  }

  function setCaretToEnd(node) {
    const sel = window.getSelection();
    if (!sel) return;

    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function insertPrefix(editor, reason) {
    const p = ensureFirstParagraph(editor);

    // If prefix already present anywhere at the start, do nothing
    const current = (p.textContent || '').replace(/\u200B/g, '');
    if (current.startsWith(PREFIX)) return;

    // If user already typed something, we’ll just prepend
    p.textContent = PREFIX + current.trimStart();

    // Remove placeholder class if present
    p.classList.remove('placeholder');
    p.removeAttribute('data-placeholder');

    // Put caret at end so user can keep typing
    requestAnimationFrame(() => setCaretToEnd(p));

    // Debug (optional)
    // console.log('[DND PREFILL]', reason, p.textContent);
  }

  function ensurePrefill(reason) {
    const editor = getEditor();
    if (!editor) return;

    const text = getPlainText(editor);

    // If empty OR only placeholder, add prefix
    if (!text) {
      insertPrefix(editor, reason || 'empty');
      return;
    }

    // If they started typing but prefix is missing (paste, rerender), repair once
    const p = ensureFirstParagraph(editor);
    const first = (p.textContent || '').replace(/\u200B/g, '');
    if (!first.startsWith(PREFIX)) {
      insertPrefix(editor, reason || 'repair');
    }
  }

  function bind(editor) {
    if (editor.dataset.dndPrefillBound) return;
    editor.dataset.dndPrefillBound = 'true';

    // Ensure on focus/click into the composer
    editor.addEventListener('focus', () => ensurePrefill('focus'), true);
    editor.addEventListener('pointerdown', () => ensurePrefill('pointerdown'), true);

    // Ensure while typing/pasting/deleting
    editor.addEventListener('input', () => ensurePrefill('input'), true);

    // If they delete everything, restore prefix next frame
    editor.addEventListener('keydown', (e) => {
      if (e.key !== 'Backspace' && e.key !== 'Delete') return;
      requestAnimationFrame(() => ensurePrefill('delete'));
    }, true);

    // Initial prefill
    ensurePrefill('init');
  }

  // ChatGPT re-renders — observe and re-bind
  const obs = new MutationObserver(() => {
    const editor = getEditor();
    if (editor) bind(editor);
  });

  obs.observe(document.body, { childList: true, subtree: true });

  // Try immediately
  const editorNow = getEditor();
  if (editorNow) bind(editorNow);
})();
