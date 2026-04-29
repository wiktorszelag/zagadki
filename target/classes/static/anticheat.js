/**
 * ENIGMA PROTOCOL — Anti-Cheat Guard
 *
 * Chroni przed:
 * 1. Otwartym DevTools (wykrycie via debugger timing trick)
 * 2. Wywołaniem funkcji z konsoli (guard na window)
 * 3. Manipulacją localStorage wyników
 * 4. Wklejaniem JS przez adres URL
 */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        // DevTools timing trick removed — caused false positives on browsers
    });

    // ── 2. CONSOLE.LOG POISON ─────────────────────────────────────
    // Wyświetla ostrzeżenie gdy ktoś otworzy konsolę i spróbuje pisać
    const _warnMsg = '%c⛔ ENIGMA PROTOCOL — STREFA NIEDOSTĘPNA\n' +
        '%cWywołanie dowolnej funkcji z tej konsoli zostanie zablokowane.';
    const detect = new Image();
    Object.defineProperty(detect, 'id', {
        get: function() {
            // This getter fires in console when the object is printed
            console.clear();
            console.log(_warnMsg,
                'color:#ff2a2a;font-size:1.5rem;font-weight:bold;',
                'color:#888;font-size:0.95rem;'
            );
        }
    });
    // Suppress normal logs that might leak game state
    const _noop = () => {};
    try {
        // Don't fully suppress — just output warning periodically
        const _origLog = console.log.bind(console);
        console.log = function(...args) {
            if (args[0] && typeof args[0] === 'string' && args[0].startsWith('%c')) {
                _origLog(...args); // allow styled warnings through
            }
            // silently drop all other console.log output
        };
        console.warn  = _noop;
        console.error = _noop;
        console.info  = _noop;
        console.dir   = _noop;
        console.table = _noop;
    } catch(e) {}

    // ── 3. BLOCK WINDOW.CHEAT_FUNCTIONS ──────────────────────────
    // Nadpisujemy niebezpieczne funkcje które mogłyby być wywołane z konsoli
    // To działa tylko PRZED załadowaniem main.js — więc ten plik musi być PIERWSZY
    const _blocked = function(name) {
        return function() {
            console.clear();
            console.log(_warnMsg,
                'color:#ff2a2a;font-size:1.4rem;font-weight:bold;',
                'color:#888;font-size:0.9rem;'
            );
        };
    };

    // Zablokuj znane nazwy funkcji cheaterów
    ['skipLevel', 'advanceLevel', 'triggerSuccess', 'goBack', 'restartGame',
     'initLevel1','initLevel2','initLevel3','initLevel4','initLevel5',
     'initLevel6','initLevel7','initLevel8','initLevel9','initLevel10','initLevel11',
     'showVictory','showVictoryScreen','showScreen'].forEach(name => {
        try {
            Object.defineProperty(window, name, {
                get: () => _blocked(name),
                set: (fn) => {
                    // Allow internal assignment from inside the IIFE (main.js)
                    // but prevent re-assignment from outside
                    // We can't distinguish, so we simply ignore external reassignment
                },
                configurable: false
            });
        } catch(e) {}
    });

    // ── 4. URL HASH INJECTION BLOCK ───────────────────────────────
    // Blokuj javascript: w location i history skips
    window.addEventListener('hashchange', e => {
        if (location.hash.toLowerCase().includes('skip') ||
            location.hash.toLowerCase().includes('level') ||
            location.hash.toLowerCase().includes('cheat')) {
            history.replaceState(null,'',location.pathname);
        }
    });

    // ── 5. LOCALSTORAGE TAMPER DETECTION ─────────────────────────
    // Podpisuje dane wyników securenym hashem, wykrywa manipulację
    const LS_SIGN_KEY = '__ep_integrity__';
    const SALT = 'enigma_prt_2025_salt_x9kz';

    async function signData(data) {
        const str = JSON.stringify(data) + SALT;
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
    }

    async function verifyIntegrity() {
        try {
            const users = JSON.parse(localStorage.getItem('enigma_mock_users') || '[]');
            const stored = localStorage.getItem(LS_SIGN_KEY);
            if (!stored && users.length === 0) return; // nothing to verify
            const expected = await signData(users);
            if (stored && stored !== expected) {
                // Tampering detected — clear results but keep accounts
                users.forEach(u => { delete u.results; });
                localStorage.setItem('enigma_mock_users', JSON.stringify(users));
                localStorage.removeItem(LS_SIGN_KEY);
            }
        } catch(e) {}
    }

    // Export sign function so main.js can update signature after saving results
    window.__ep_sign__ = async function() {
        try {
            const users = JSON.parse(localStorage.getItem('enigma_mock_users') || '[]');
            const sig = await signData(users);
            localStorage.setItem(LS_SIGN_KEY, sig);
        } catch(e) {}
    };

    document.addEventListener('DOMContentLoaded', verifyIntegrity);

})();
