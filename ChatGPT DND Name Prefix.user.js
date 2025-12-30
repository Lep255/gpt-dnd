// ==UserScript==
// @name         ChatGPT DND Prefix (Sanity + Badge)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds a visible badge + prefixes messages
// @match        https://chatgpt.com/c/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const PLAYER_NAME = 'Rodney';
  const PREFIX = `[${PLAYER_NAME}]~ `;

  // --- Visible badge so you KNOW it loaded ---
  const badge = document.createElement('div');
  badge.textContent = 'DND PREFIX ACTIVE';
  badge.style.cssText = `
    position: fixed; top: 10px; right: 10px;
    z-index: 9999999;
    background: rgba(0,0,0,.85);
    color: #fff;
    padding: 6px 10px;
    border-radius: 8px;
    font: 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  `;
  document.documentElement.appendChild(badge);

  console.log('[DND PREFIX] script loaded');

  function findEditor() {
    return document.querySelector('#prompt-textarea.ProseMirror');
  }

  function flash() {
    badge.style.transform = 'scale(1.06)';
    setTimeout(() => (badge.style.transform = ''), 120);
  }

  function applyPrefix(reason) {
    const editor = findEditor();
    if (!editor) return;

    const text = editor.innerText.trim();
    if (!text) return;
    if (text.startsWith(PREFIX)) return;

    editor.innerText = PREFIX + text;

    // caret to end
    const r = document.createRange();
    const s = window.getSelection();
    r.selectNodeContents(editor);
    r.collapse(false);
    s.removeAllRanges();
    s.addRange(r);

    console.log('[DND PREFIX]', reason, editor.innerText);
    flash();
  }

  // Send button hook (early)
  document.addEventListener(
    'pointerdown',
    (e) => {
      const btn = e.target.closest('button[aria-label*="Send"],button[type="submit"]');
      if (!btn) return;
      applyPrefix('send');
    },
    true
  );

  // Enter hook (in editor)
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Enter' || e.shiftKey) return;
      const editor = findEditor();
      if (!editor) return;
      // only when typing in the editor
      if (!editor.contains(document.activeElement) && document.activeElement !== editor) return;
      applyPrefix('enter');
    },
    true
  );
})();
