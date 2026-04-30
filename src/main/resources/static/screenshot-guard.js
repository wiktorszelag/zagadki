/**
 * ENIGMA PROTOCOL — Screenshot Guard
 * Utrudnia robienie screenshotów przez:
 * 1. Nakładanie ciemnego overlay gdy okno traci focus (Snipping Tool, Alt+PrtSc)
 * 2. Wykrywanie nagrywania ekranu przez getDisplayMedia
 * 3. Blokowanie zaznaczania tekstu i prawego kliknięcia
 */
(function() {
    'use strict';

    // ── 1. DARK OVERLAY ──────────────────────────────────────────
    // Pojawia się gdy użytkownik przełącza okno (np. Alt+Tab, otwiera Snipping Tool)
    const overlay = document.createElement('div');
    overlay.id = '__ss_guard_overlay__';
    overlay.style.cssText = [
        'position:fixed',
        'inset:0',
        'z-index:2147483647',
        'background:#000',
        'display:none',
        'align-items:center',
        'justify-content:center',
        'flex-direction:column',
        'gap:16px',
        'pointer-events:all',
        'cursor:default',
        'user-select:none',
    ].join(';');

    overlay.innerHTML = `
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="24" r="10" stroke="#00f5ff" stroke-width="2.5" fill="none"/>
            <path d="M12 52c0-11 9-20 20-20s20 9 20 20" stroke="#00f5ff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            <line x1="4" y1="60" x2="60" y2="4" stroke="#ff2a2a" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        <p style="color:#00f5ff;font-family:'Share Tech Mono',monospace;font-size:1.1rem;letter-spacing:2px;text-align:center;">
            SESJA ZABEZPIECZONA
        </p>
        <p style="color:#446688;font-family:'Share Tech Mono',monospace;font-size:0.75rem;letter-spacing:1px;text-align:center;">
            Wróć do okna aby kontynuować
        </p>
    `;

    function showOverlay() {
        overlay.style.display = 'flex';
        // Wyślij licznik do serwera
        try {
            const session = JSON.parse(localStorage.getItem('enigma_mock_session') || '{}');
            if (session.username) {
                fetch('/api/auth/leave', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: session.username })
                }).catch(() => {});
            }
        } catch(e) {}
    }
    function hideOverlay() { overlay.style.display = 'none'; }

    // Używamy readyState bo skrypt może być załadowany przed <body>
    function attachOverlay() {
        if (document.body) document.body.appendChild(overlay);
        else document.addEventListener('DOMContentLoaded', () => document.body.appendChild(overlay));
    }
    attachOverlay();

    // Utrata focusu okna (Snipping Tool, Alt+Tab, itp.)
    window.addEventListener('blur',  showOverlay);
    window.addEventListener('focus', hideOverlay);

    // Zmiana widoczności zakładki
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) showOverlay();
        else hideOverlay();
    });

    // ── 2. SCREEN CAPTURE DETECTION ──────────────────────────────
    // Patchujemy getDisplayMedia — gdy ktoś próbuje nagrać ekran
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const _orig = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
        navigator.mediaDevices.getDisplayMedia = async function(constraints) {
            showOverlay();
            try {
                const stream = await _orig(constraints);
                // Gdy nagrywanie się skończy, chowamy overlay
                stream.getVideoTracks().forEach(track => {
                    track.addEventListener('ended', hideOverlay);
                });
                // Ale zawartość pozostaje zaciemniona przez cały czas nagrywania
                return stream;
            } catch (e) {
                hideOverlay();
                throw e;
            }
        };
    }

    // ── 3. BLOKADA ZAZNACZANIA I KOPIOWANIA ──────────────────────
    const noSelectStyle = document.createElement('style');
    noSelectStyle.textContent = `
        * {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
            -webkit-touch-callout: none !important;
        }
        input, textarea, [contenteditable] {
            -webkit-user-select: text !important;
            user-select: text !important;
        }
    `;
    document.head.appendChild(noSelectStyle);

    document.addEventListener('copy',  e => e.preventDefault());
    document.addEventListener('cut',   e => e.preventDefault());
    document.addEventListener('paste', e => {
        // Pozwól na wklejanie w polach tekstowych (np. hasła)
        const tag = e.target.tagName.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
            e.preventDefault();
        }
    }, { capture: false });

    // ── 4. BLOKADA PRAWEGO PRZYCISKU ─────────────────────────────
    document.addEventListener('contextmenu', e => e.preventDefault());

    // ── 5. BLOKADA SKRÓTÓW DEVTOOLS / PRINTSCREEN ────────────────
    document.addEventListener('keydown', e => {
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (źródło)
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key.toUpperCase())) ||
            (e.ctrlKey && e.key.toUpperCase() === 'U') ||
            (e.ctrlKey && e.key.toUpperCase() === 'S') ||
            e.key === 'PrintScreen'
        ) {
            e.preventDefault();
            e.stopPropagation();
            showOverlay();
            setTimeout(hideOverlay, 1200); // brief flash
        }
    }, true);

    // ── 6. POBIERANIE PLIKU DRAG OUT ─────────────────────────────
    document.addEventListener('dragstart', e => e.preventDefault());

})();
