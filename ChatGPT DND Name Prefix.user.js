// ==UserScript==
// @name         ChatGPT DND Prefix (BeforeInput - Reliable)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Prepend [Name]~ before the user starts typing (ProseMirror-safe)
// @match        https://chatgpt.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const PLAYER_NAME = 'Rodney';
  const PREFIX = `[${PLAYER_NAME}]~ `;

  function getEditorFromTarget(t) {
    if (!t) return null;
    const editor = t.closest?.('#prompt-textarea');
    if (!editor) return null;
    if (editor.getAttribute('contenteditable') !== 'true') return null;
    return editor;
  }

  function getEditorText(editor) {
    return (editor.textContent || '').replace(/\u200B/g, '').trim();
  }

  function setEditorText(editor, text) {
    // Keep it simple: ensure there's a paragraph and set its textContent
    let p = editor.querySelector('p');
    if (!p) {
      p = document.createElement('p');
      editor.innerHTML = '';
      editor.appendChild(p);
    }
    p.classList.remove('placeholder');
    p.removeAttribute('data-placeholder');
    p.textContent = text;

    // caret to end
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.selectNodeContents(p);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function ensurePrefix(editor) {
    const raw = (editor.textContent || '').replace(/\u200B/g, '');
    if (raw.startsWith(PREFIX)) return true;

    const trimmed = raw.trim();
    if (!trimmed) {
      setEditorText(editor, PREFIX);
      return true;
    }

    // If somehow text exists without prefix, prepend once
    setEditorText(editor, PREFIX + trimmed);
    return true;
  }

  // 1) On focus/click into the editor, if empty -> insert prefix
  document.addEventListener('focusin', (e) => {
    const editor = getEditorFromTarget(e.target);
    if (!editor) return;
    if (!getEditorText(editor)) {
      ensurePrefix(editor);
    }
  }, true);

  document.addEventListener('pointerdown', (e) => {
    const editor = getEditorFromTarget(e.target);
    if (!editor) return;
    if (!getEditorText(editor)) {
      // Delay a tick so selection is established
      requestAnimationFrame(() => ensurePrefix(editor));
    }
  }, true);

  // 2) 핵심: BEFOREINPUT intercepts the very first character and injects prefix first
  document.addEventListener('beforeinput', (e) => {
    const editor = getEditorFromTarget(e.target);
    if (!editor) return;

    // Only act on actual text insertions/paste
    const t = e.inputType || '';
    const isTextInsert =
      t.startsWith('insertText') ||
      t.startsWith('insertCompositionText') ||
      t === 'insertFromPaste';

    if (!isTextInsert) return;

    const current = (editor.textContent || '').replace(/\u200B/g, '');
    if (current.startsWith(PREFIX)) return;

    // If empty, we will insert PREFIX + whatever user is inserting (so they don’t lose their first char)
    const incoming = (typeof e.data === 'string' ? e.data : '');
    const base = current.trim();

    e.preventDefault();

    if (!base) {
      // Empty editor: prefix + first typed character (if any)
      setEditorText(editor, PREFIX + incoming);
    } else {
      // Non-empty but no prefix (rare): prepend and keep existing + incoming
      setEditorText(editor, PREFIX + base + incoming);
    }
  }, true);

})();
