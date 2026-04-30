/* ====================================
   ENIGMA PROTOCOL V2 - GAME LOGIC
   Zagadki losowe, interaktywne, mobilne
==================================== */

document.addEventListener('DOMContentLoaded', () => {

    // --- GLOBAL STATE ---
    let currentLevel = 0;
    let startTime = null;
    let skippedCount = 0;
    const TOTAL_LEVELS = 10;
    let levelHistory = []; // stack of previously visited levels
    let backendPlayerId = null;

    // --- PROGRESS SAVING ---
    const saveProgress = () => {
        if (currentLevel === 0) return;
        const nick = document.getElementById('player-nick').value.trim();
        const state = { currentLevel, totalElapsedMs, nick, backendPlayerId, levelHistory };
        localStorage.setItem('ep_v2_progress', JSON.stringify(state));

        // BACKEND SYNC (Dla Panelu Admina na Żywo!)
        if (backendPlayerId) {
            fetch(`/api/players/${backendPlayerId}/level/${currentLevel}`, { method: 'PUT' }).catch(()=>null);
        }
    };
    
    const clearProgress = () => {
        localStorage.removeItem('ep_v2_progress');
        if (backendPlayerId) {
            fetch(`/api/players/${backendPlayerId}/finish`, { method: 'PUT' }).catch(()=>null);
        }
    };

    // --- SCREEN TRANSITIONS ---
    const showScreen = (id) => {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            setTimeout(() => { if (!s.classList.contains('active')) s.classList.add('hidden'); }, 400);
        });
        const t = document.getElementById(id);
        if (!t) return;
        t.classList.remove('hidden');
        setTimeout(() => { t.classList.add('active'); t.scrollTop = 0; }, 50);
    };

    const LEVEL_INITS = {
        1: initLevel1, 2: initLevel2, 3: initLevel3, 4: initLevel4,
        5: initLevel5, 6: initLevel6, 7: initLevel7, 8: initLevel8,
        9: initLevel9, 10: initLevel10
    };

    // --- SHOW LEVEL START SCREEN ---
    const LEVEL_NAMES = {
        1: 'Sekwencja Dostepu',
        2: 'Analiza Energetyczna',
        3: 'Protokol Holmesa',
        4: 'Klasyfikator Danych',
        5: 'Slepy Chronometr',
        6: 'Niestabilny Interfejs',
        7: 'Echo Pamieci',
        8: 'Dekoder Wzorca',
        9: 'Sygnal Blyskowy',
        10: 'Lamacz Kodu'
    };

    const LEVEL_DESCS = {
        1: 'Zapamiętaj kolejność podświetleń, a następnie powtórz je klikając kwadraty we właściwej kolejności.',
        2: 'Ułóż posiłki od najbardziej do najmniej kalorycznych. Nie znasz kalorii — bazuj na swojej wiedzy i przeciągaj kafelki ze stawką w dół!',
        3: 'Analiza Przestrzenna. Zapamiętaj ułożenie błękitnych kwadratów, które błysną na ekranie. Następnie odtwórz ten sam wzór z pamięci. Z każdym kolejnym z trzech etapów, obiektów do zapamiętania będzie więcej!',
        4: 'Znajdź 4 grupy po 4 powiązane elementy. Zaznacz 4 — zatwierdzi się automatycznie!',
        5: 'Uruchom timer i naciśnij STOP dokładnie gdy minie cel. Timera nie zobaczysz — licz w głowie!',
        6: 'Błyskawiczna Likwidacja! Na arenie będą pojawiać się cele. Musisz zbić ich 10. Każdy z nich po chwili znika — musisz być bardzo szybki! Skup się tylko na poprawnych celach.',
        7: 'Mechanizm Zapadniowy (Wytrych). Widzisz 4 skaczące piny w zamku. Użyj przycisków na dole, aby zablokować każdy z nich w momencie, gdy znajduje się w PASKU ZIELONYM. Błąd resetuje cały zamek!',
        8: 'Zapamietaj kolejnosc blyskajacych cyfr. Z kazda runda bedzie szybciej i wiecej cyfr. Uwaga: po kazdym Twoim kliknieciu siatka losuje pozycje od nowa!',
        9: 'Strojenie Sygnału. Przeprowadź kalibrację 3 modułów na chybił-trafił. Obserwuj wskaźnik "Dopasowania sygnału". Musisz manipulować suwakami jak wytrychem, aż osiągniesz dopasowanie bliskie 100%, po czym nadaj sygnał!',
        10: 'Odgadnij sekretny kod 4 symbolów. \u2713 = dobra pozycja, ? = zła pozycja, \u00B7 = brak w kodzie.'
    };

    const showLevelStart = (lvl) => {
        const screen = document.getElementById('level-start-screen');
        document.getElementById('ls-level-num').textContent = 'POZIOM ' + lvl;
        document.getElementById('ls-level-name').textContent = LEVEL_NAMES[lvl] || '';
        document.getElementById('ls-level-desc').textContent = LEVEL_DESCS[lvl] || '';
        if (lvl === 10) {
            // Keep instructions displayed for level 10
            const inLvlDesc = document.createElement('p');
            inLvlDesc.style.color = '#bbb';
            inLvlDesc.style.fontSize = '0.9rem';
            inLvlDesc.style.margin = '10px 0';
            inLvlDesc.textContent = LEVEL_DESCS[lvl];
            const header = document.querySelector('#level-10 .level-header'); 
            if(header && !header.querySelector('.in-lvl-desc')) {
                inLvlDesc.className = 'in-lvl-desc';
                header.appendChild(inLvlDesc);
                header.querySelector('p').style.display='block';
                header.querySelector('h3').style.display='block';
            }
        }
        
        // Pause timer tracking
        if (currentLevelStartMs) {
            totalElapsedMs += (Date.now() - currentLevelStartMs);
            currentLevelStartMs = null;
        }

        screen.classList.remove('hidden');
        setTimeout(() => screen.classList.add('active'), 100);
    };

    document.getElementById('ls-start-btn').addEventListener('click', () => {
        const screen = document.getElementById('level-start-screen');
        screen.classList.remove('active');
        currentLevelStartMs = Date.now(); // Start timer for this specific level
        // Informuj serwer o starcie konkretnego poziomu (live monitoring)
        if (sessionNick) {
            fetch('/api/auth/progress', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ username: sessionNick, protocol: 'v2', level: currentLevel, timeMs: totalElapsedMs, completed: false, levelStartedAt: currentLevelStartMs })
            }).catch(() => {});
        }
        setTimeout(() => {
            screen.classList.add('hidden');
            if (LEVEL_INITS[currentLevel]) LEVEL_INITS[currentLevel]();
            showScreen('level-' + currentLevel);
        }, 350);
    });

    // Heartbeat co 10s – admin widzi że gracz aktywnie rozwiązuje
    setInterval(() => {
        if (sessionNick && currentLevelStartMs && currentLevel > 0) {
            fetch('/api/auth/progress', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ username: sessionNick, protocol: 'v2', level: currentLevel, timeMs: totalElapsedMs + (Date.now() - currentLevelStartMs), completed: false, levelStartedAt: currentLevelStartMs })
            }).catch(() => {});
        }
    }, 10000);

    document.getElementById('ls-end-btn').addEventListener('click', () => {
        const screen = document.getElementById('level-start-screen');
        screen.classList.remove('active');
        setTimeout(() => {
            screen.classList.add('hidden');
            showVictory(true); // Terminate game early
        }, 350);
    });

    let totalElapsedMs = 0;
    let currentLevelStartMs = null;
    let levelTimes = {}; // czas per poziom {1: ms, 2: ms, ...}

    const advanceLevel = (showIntermission = true) => {
        let elapsed = 0;
        if (currentLevel > 0 && currentLevelStartMs) {
            elapsed = Date.now() - currentLevelStartMs;
            totalElapsedMs += elapsed;
        }
        currentLevelStartMs = null;

        if (currentLevel > 0) {
            levelHistory.push(currentLevel);
            levelTimes[currentLevel] = (levelTimes[currentLevel] || 0) + elapsed;
        }

        cleanupLevel(currentLevel);
        currentLevel++;
        
        // Zapis postępu do bazy
        if (sessionNick) {
            fetch('/api/auth/progress', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({
                    username: sessionNick,
                    protocol: 'v2',
                    level: currentLevel,
                    timeMs: totalElapsedMs,
                    completed: currentLevel > TOTAL_LEVELS,
                    levelTimes: levelTimes
                })
            });
            try {
                let s = JSON.parse(localStorage.getItem('enigma_mock_session'));
                if (s) { s.v2Level = currentLevel; s.v2TimeMs = totalElapsedMs; if(currentLevel > TOTAL_LEVELS) s.v2Completed = true; localStorage.setItem('enigma_mock_session', JSON.stringify(s)); }
            } catch(e) {}
        }

        if (currentLevel <= TOTAL_LEVELS) {
            if (showIntermission && currentLevel > 1) {
                showScreen('intermission-screen');
            } else {
                showLevelStart(currentLevel);
            }
        } else {
            showVictory(false);
        }
    };
    
    document.getElementById('int-next-btn')?.addEventListener('click', () => {
        const screen = document.getElementById('intermission-screen');
        screen.classList.remove('active');
        setTimeout(() => {
            screen.classList.add('hidden');
            showLevelStart(currentLevel);
        }, 350);
    });

    const _skipLevel = () => {
        if (currentLevel === 0) {
            document.getElementById('player-nick').value = document.getElementById('player-nick').value || 'TESTER';
            advanceLevel();
            return;
        }
        skippedCount++;
        totalElapsedMs += 30000; // 30 second penalty for skipping
        advanceLevel();
    };

    const _restartGame = () => {
        currentLevel = 0; totalElapsedMs = 0; currentLevelStartMs = null; skippedCount = 0;
        levelHistory = [];
        cleanupLevel(-1);
        showScreen('start-screen');
    };

    const _goBack = () => {
        if (levelHistory.length === 0) return;
        const fromLevel = currentLevel;
        if (fromLevel > 0 && currentLevelStartMs) {
            currentLevelStartMs = null;
        }
        cleanupLevel(fromLevel);
        const prevLevel = levelHistory.pop();
        currentLevel = prevLevel;
        showLevelStart(prevLevel);
    };

    // Expose only for internal dev-bar buttons via closure (NOT on window)
    document.getElementById('skip-btn')?.addEventListener('click', _skipLevel);
    document.getElementById('restart-btn')?.addEventListener('click', _restartGame);
    document.getElementById('play-again-btn')?.addEventListener('click', _restartGame);

    // goBack for briefing screen button
    document.getElementById('ls-back-btn')?.addEventListener('click', _goBack);
    
    // Hard reset from briefing
    document.getElementById('ls-hard-reset-btn')?.addEventListener('click', () => {
        document.getElementById('level-start-screen').classList.remove('active');
        setTimeout(() => {
            document.getElementById('level-start-screen').classList.add('hidden');
            _restartGame();
        }, 300);
    });

    const triggerSuccess = (statusId, delay = 1000) => {
        setStatus(statusId, '\u2713 ZABEZPIECZENIE ZLAMANE', true);
        setTimeout(advanceLevel, delay);
    };

    const triggerError = (statusId, msg, original) => {
        const el = document.getElementById(statusId);
        if (!el) return;
        const prev = original || el.textContent;
        el.textContent = '\u2717 ' + msg;
        el.className = 'status-msg error error-shake';
        setTimeout(() => { el.textContent = prev; el.className = 'status-msg error'; }, 2000);
    };

    const setStatus = (id, msg, success = false) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = msg;
        el.className = 'status-msg ' + (success ? 'success' : 'error');
    };

    // --- CLEANUP REGISTRY ---
    const cleanups = {};
    const registerCleanup = (lvl, fn) => { cleanups[lvl] = fn; };
    const cleanupLevel = (lvl) => { if (cleanups[lvl]) { cleanups[lvl](); delete cleanups[lvl]; } };

    // --- INTEGRACJA Z SESJĄ HUBA ---
    let sessionNick = null;
    let sessionRole = null;
    try {
        const session = JSON.parse(localStorage.getItem('enigma_mock_session'));
        if (session && session.nick) {
            sessionNick = session.nick;
            sessionRole = session.role;
            const nickInput = document.getElementById('player-nick');
            if (nickInput) {
                nickInput.value = sessionNick;
                nickInput.style.display = 'none'; // Ukryj wejście tekstowe
                // Pokaż tekstowo
                const nickDisplay = document.createElement('div');
                nickDisplay.innerHTML = `OPERATOR PODŁĄCZONY:<br><b style="color:var(--neon-green)">${sessionNick}</b>`;
                nickDisplay.style.cssText = 'color:#88aaff; font-family:var(--font-h); text-align:center; margin:15px 0; letter-spacing:2px; font-size:1.1rem;';
                nickInput.parentNode.insertBefore(nickDisplay, nickInput);
            }
            
            if (sessionRole === 'ADMIN') {
                const devBar = document.getElementById('dev-bar');
                if (devBar) devBar.style.display = 'flex';
            }
        }
    } catch(e) {}

    // --- START SCREEN ---
    document.getElementById('start-btn').addEventListener('click', async () => {
        const nick = document.getElementById('player-nick').value.trim();
        const inp = document.getElementById('player-nick');
        if (!nick) {
            inp.style.borderColor = 'var(--neon-red)';
            inp.style.boxShadow = '0 0 15px rgba(255,34,68,0.3)';
            setTimeout(() => { inp.style.borderColor = ''; inp.style.boxShadow = ''; }, 900);
            return;
        }

        currentLevel = 0; totalElapsedMs = 0; currentLevelStartMs = null; skippedCount = 0;
        levelHistory = [];

        // Odczyt postępu z sesji V2
        try {
            const session = JSON.parse(localStorage.getItem('enigma_mock_session'));
            if (session && session.nick === nick && session.v2Level > 1) {
                if (session.v2Level <= TOTAL_LEVELS) {
                    currentLevel = session.v2Level - 1;
                    totalElapsedMs = session.v2TimeMs || 0;
                } else {
                    currentLevel = TOTAL_LEVELS;
                    totalElapsedMs = session.v2TimeMs || 0;
                }
            }
        } catch(e) {}

        advanceLevel(false);
    });

    // --- AUTO-ŁADOWANIE WCZEŚNIEJSZEGO STANU ---
    // TYMCZASOWO WYŁĄCZONE NA PROŚBĘ UŻYTKOWNIKA
    /*
    const savedState = localStorage.getItem('ep_v2_progress');
    if (savedState) {
        try {
            const p = JSON.parse(savedState);
            currentLevel = p.currentLevel;
            totalElapsedMs = p.totalElapsedMs;
            backendPlayerId = p.backendPlayerId;
            levelHistory = p.levelHistory || [];
            document.getElementById('player-nick').value = p.nick || '';

            // Przeskocz od razu do zapisanego poziomu (Z ominięciem Ekranu Startowego)
            showScreen('level-start-screen');
            showLevelStart(currentLevel);
        } catch(e) {}
    }
    */
    // ================================================================
    // LEVEL 1 - TAP SEQUENCE
    // ================================================================
    const L1_BTNS = 9;
    const L1_ROUNDS = [{len: 3}, {len: 4}, {len: 5}];
    const L1_ICONS = ['\u25C6','\u25B2','\u25CF','\u25A0','\u2605','\u25BC','\u25C4','\u25B6','\u2B05'];
    let l1Round = 0, l1Seq = [], l1PlayerIdx = 0, l1Phase = 'idle';
    let l1ShowTimer = null;

    function initLevel1() {
        l1Round = 0;
        buildSeqGrid();
        setStatus('l1-status', 'Obserwuj sekwencje...');
        updateL1RoundInfo();
        startL1Round();
        registerCleanup(1, () => { clearTimeout(l1ShowTimer); l1Phase = 'idle'; });
    }

    function buildSeqGrid() {
        const grid = document.getElementById('seq-grid');
        grid.innerHTML = '';
        for (let i = 0; i < L1_BTNS; i++) {
            const btn = document.createElement('div');
            btn.className = 'seq-btn';
            btn.dataset.idx = i;
            btn.textContent = L1_ICONS[i];
            btn.addEventListener('click', () => handleL1Click(i));
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleL1Click(i); }, {passive: false});
            grid.appendChild(btn);
        }
    }

    function updateL1RoundInfo() {
        document.getElementById('l1-round').textContent = l1Round + 1;
        document.getElementById('l1-total-rounds').textContent = L1_ROUNDS.length;
        document.getElementById('l1-seq-len').textContent = L1_ROUNDS[l1Round].len;
    }

    function startL1Round() {
        l1Phase = 'show';
        l1PlayerIdx = 0;
        const len = L1_ROUNDS[l1Round].len;
        l1Seq = [];
        while (l1Seq.length < len) {
            const n = Math.floor(Math.random() * L1_BTNS);
            if (l1Seq[l1Seq.length - 1] !== n) l1Seq.push(n);
        }
        const prog = document.getElementById('l1-progress');
        prog.innerHTML = '';
        for (let i = 0; i < len; i++) {
            const dot = document.createElement('div');
            dot.className = 'seq-dot';
            dot.id = `l1-dot-${i}`;
            prog.appendChild(dot);
        }
        setAllSeqBtns('idle');
        setStatus('l1-status', 'Zapamietaj kolejnosc...');
        let i = 0;
        function showStep() {
            if (i > 0) flashSeqBtn(l1Seq[i - 1], 'idle');
            if (i >= len) {
                l1Phase = 'input';
                setAllSeqBtns('active');
                setStatus('l1-status', `Powtorz! Kliknij ${len} pol w tej samej kolejnosci.`);
                return;
            }
            flashSeqBtn(l1Seq[i], 'lit');
            i++;
            l1ShowTimer = setTimeout(showStep, 650);
        }
        l1ShowTimer = setTimeout(showStep, 500);
    }

    function setAllSeqBtns(mode) {
        document.querySelectorAll('.seq-btn').forEach(b => {
            b.classList.remove('seq-lit', 'seq-hit', 'seq-miss');
            b.style.pointerEvents = mode === 'active' ? '' : 'none';
        });
    }

    function flashSeqBtn(idx, state) {
        const btn = document.querySelector(`.seq-btn[data-idx="${idx}"]`);
        if (!btn) return;
        btn.classList.remove('seq-lit', 'seq-hit', 'seq-miss');
        if (state === 'lit') btn.classList.add('seq-lit');
    }

    function handleL1Click(idx) {
        if (l1Phase !== 'input') return;
        const btn = document.querySelector(`.seq-btn[data-idx="${idx}"]`);
        if (!btn) return;
        if (idx === l1Seq[l1PlayerIdx]) {
            btn.classList.add('seq-hit');
            setTimeout(() => btn.classList.remove('seq-hit'), 350);
            const dot = document.getElementById(`l1-dot-${l1PlayerIdx}`);
            if (dot) dot.classList.add('done');
            l1PlayerIdx++;
            if (l1PlayerIdx >= l1Seq.length) {
                l1Phase = 'idle';
                setAllSeqBtns('idle');
                l1Round++;
                if (l1Round >= L1_ROUNDS.length) {
                    triggerSuccess('l1-status', 800);
                } else {
                    setStatus('l1-status', `\u2713 Runda ${l1Round} zaliczona! Przygotuj sie...`);
                    updateL1RoundInfo();
                    l1ShowTimer = setTimeout(startL1Round, 1400);
                }
            } else {
                setStatus('l1-status', `${l1PlayerIdx}/${l1Seq.length} - kontynuuj!`);
            }
        } else {
            const missDot = document.getElementById(`l1-dot-${l1PlayerIdx}`);
            if (missDot) missDot.classList.add('miss');
            btn.classList.add('seq-miss');
            l1Phase = 'idle';
            setAllSeqBtns('idle');
            setTimeout(() => btn.classList.remove('seq-miss'), 400);
            setStatus('l1-status', '\u2717 Blad! Powtarzam sekwencje...');
            l1ShowTimer = setTimeout(startL1Round, 1200);
        }
    }

    // ================================================================
    // LEVEL 2 - CALORIE SORTER (losowe potrawy, prawidłowe kalorie)
    // ================================================================
    // Pula wszystkich potraw z kalorycznością (kcal) — sortujemy MALEJĄCO
    const caloriePool = [
        { id: 'maslo',      emoji: '🧈', name: 'Masło\n(100g)',              kcal: 717 },
        { id: 'boczek',     emoji: '🥓', name: 'Boczek smażony\n(100g)',     kcal: 541 },
        { id: 'czekolada',  emoji: '🍫', name: 'Czekolada mleczna\n(100g)',  kcal: 535 },
        { id: 'frytki',     emoji: '🍟', name: 'Frytki\n(porcja 200g)',      kcal: 520 },
        { id: 'cheesecake', emoji: '🍰', name: 'Sernik\n(kawałek 150g)',     kcal: 480 },
        { id: 'kebab',      emoji: '🌯', name: 'Kebab w bułce\n(350g)',      kcal: 700 },
        { id: 'pizza',      emoji: '🍕', name: 'Pizza Margherita\n(2 kawałki)', kcal: 540 },
        { id: 'burger',     emoji: '🍔', name: 'Burger wołowy\n(300g)',      kcal: 650 },
        { id: 'ryz',        emoji: '🍚', name: 'Ryż z kurczakiem\n(400g)',   kcal: 440 },
        { id: 'jajecznica', emoji: '🍳', name: 'Jajecznica\n(3 jajka)',      kcal: 320 },
        { id: 'banan',      emoji: '🍌', name: 'Banan\n(1 szt.)',            kcal: 105 },
        { id: 'jogurt',     emoji: '🥛', name: 'Jogurt naturalny\n(150g)',   kcal: 90  },
        { id: 'jablko',     emoji: '🍎', name: 'Jabłko\n(1 szt.)',           kcal: 70  },
        { id: 'marchew',    emoji: '🥕', name: 'Marchew\n(1 szt.)',          kcal: 41  },
        { id: 'ogurek',     emoji: '🥒', name: 'Ogórek\n(1 szt.)',           kcal: 20  },
        { id: 'seler',      emoji: '🥬', name: 'Seler naciowy\n(1 łodyga)',  kcal: 6   },
    ];

    // Aktualny zestaw wylosowanych potraw (generowany przy init)
    let activeCalorieItems = [];
    let calorieCorrect = [];
    let calorieDragSrc = null, calorieTouchSrc = null;

    function initLevel2() {
        // Losuj 6 potraw z puli (zapewniamy zróżnicowanie)
        const picked = shuffle([...caloriePool]).slice(0, 6);
        // Posortuj malejąco wg kalorii — to jest prawidłowa kolejność
        activeCalorieItems = [...picked];
        calorieCorrect = [...picked].sort((a, b) => b.kcal - a.kcal).map(i => i.id);

        const sorter = document.getElementById('calorie-sorter');
        const renderSorter = () => {
            sorter.innerHTML = '';
            activeCalorieItems.forEach((item, i) => {
                const div = document.createElement('div');
                div.className = 'calorie-item';
                div.dataset.id = item.id;
                div.innerHTML = `<span class="calorie-rank">${i+1}</span><span class="calorie-emoji">${item.emoji}</span><span class="calorie-name">${item.name.replace('\n','<br>')}</span>`;
                
                const btns = document.createElement('div');
                btns.className = 'arrow-btns';
                btns.innerHTML = `<button class="mv-up">▲</button><button class="mv-dn">▼</button>`;
                div.appendChild(btns);
                
                div.querySelector('.mv-up').onclick = (e) => { e.stopPropagation(); l2Move(i, -1); };
                div.querySelector('.mv-dn').onclick = (e) => { e.stopPropagation(); l2Move(i, 1); };
                
                sorter.appendChild(div);
            });
        };

        window.l2Move = function(idx, dir) {
            const newIdx = idx + dir;
            if(newIdx < 0 || newIdx >= activeCalorieItems.length) return;
            const temp = activeCalorieItems[idx];
            activeCalorieItems[idx] = activeCalorieItems[newIdx];
            activeCalorieItems[newIdx] = temp;
            renderSorter();
        };

        renderSorter();
    }

    function updateCalorieRanks() {
        document.querySelectorAll('.calorie-item').forEach((el, i) => {
            el.querySelector('.calorie-rank').textContent = i + 1;
        });
    }

    document.getElementById('verify-l2-btn').addEventListener('click', () => {
        const order = [...document.querySelectorAll('.calorie-item')].map(el => el.dataset.id);
        if (JSON.stringify(order) === JSON.stringify(calorieCorrect)) {
            triggerSuccess('l2-status');
        } else {
            triggerError('l2-status', 'Kolejność niepoprawna! Spróbuj jeszcze raz.', 'Ułóż od najbardziej kalorycznego!');
            document.querySelectorAll('.calorie-item').forEach(el => {
                el.style.borderColor = 'var(--neon-red)';
                setTimeout(() => el.style.borderColor = '', 900);
            });
        }
    });

    // Przycisk podpowiedzi - kosztuje 30s
    document.getElementById('l2-hint-btn')?.addEventListener('click', () => {
        totalElapsedMs += 30000;
        const currentOrder = [...document.querySelectorAll('.calorie-item')];
        currentOrder.forEach((el, i) => {
            if (el.dataset.id === calorieCorrect[i]) {
                el.style.borderColor = 'var(--neon-green)';
                el.style.boxShadow = '0 0 14px rgba(57,255,20,0.5)';
            } else {
                el.style.borderColor = 'var(--neon-red)';
                el.style.boxShadow = '0 0 14px rgba(255,34,68,0.5)';
            }
            setTimeout(() => {
                el.style.borderColor = '';
                el.style.boxShadow = '';
            }, 1800);
        });
        setStatus('l2-status', '💡 Zielone = dobra pozycja, Czerwone = błąd! (+30s do czasu)');
    });

    // ================================================================
    // LEVEL 3 - ANALIZA PRZESTRZENNA (Memory Matrix)
    // ================================================================
    let l3Round = 0, l3Phase = 'idle', l3Seq = [], l3Selected = [];
    const L3_ROUNDS = [{count:4, time:1200}, {count:5, time:1500}, {count:7, time:1800}];

    function initLevel3() {
        l3Round = 0; l3Phase = 'idle';
        document.getElementById('l3-verify-btn').style.display = 'none';
        buildL3Grid();
        setTimeout(startL3Round, 800);
        registerCleanup(3, () => { l3Phase = 'idle'; });
    }

    function buildL3Grid() {
        const grid = document.getElementById('l3-grid');
        grid.innerHTML = '';
        for (let i=0; i<16; i++) {
            const cell = document.createElement('div');
            cell.className = 'matrix-cell';
            cell.dataset.idx = i;
            cell.addEventListener('click', () => handleL3Click(cell, i));
            cell.addEventListener('touchstart', e => { e.preventDefault(); handleL3Click(cell, i); }, {passive:false});
            grid.appendChild(cell);
        }
    }

    function startL3Round() {
        l3Phase = 'show'; l3Selected = [];
        document.getElementById('l3-round-info').textContent = `ETAP: ${l3Round + 1} / 3`;
        document.getElementById('l3-verify-btn').style.display = 'none';
        setStatus('l3-status', '\uD83D\uDC41 Zapamiętaj ułożenie kwadratów...');
        
        document.querySelectorAll('.matrix-cell').forEach(c => {
            c.className = 'matrix-cell'; 
            c.style.pointerEvents = 'none';
        });
        
        const rConf = L3_ROUNDS[l3Round];
        const allIdx = shuffle(Array.from({length:16}, (_, i) => i));
        l3Seq = allIdx.slice(0, rConf.count);
        
        l3Seq.forEach(idx => {
            document.querySelector(`.matrix-cell[data-idx="${idx}"]`).classList.add('lit');
        });
        
        setTimeout(() => {
            document.querySelectorAll('.matrix-cell').forEach(c => {
                c.classList.remove('lit');
                c.style.pointerEvents = 'auto';
            });
            l3Phase = 'input';
            document.getElementById('l3-verify-btn').style.display = 'block';
            setStatus('l3-status', 'Odtwórz wzór! Kliknij odpowiednie kafelki.');
        }, rConf.time);
    }
    
    function handleL3Click(cell, idx) {
        if (l3Phase !== 'input') return;
        if (cell.classList.contains('lit')) {
            cell.classList.remove('lit');
            l3Selected = l3Selected.filter(i => i !== idx);
        } else {
            cell.classList.add('lit');
            if (!l3Selected.includes(idx)) l3Selected.push(idx);
        }
    }
    
    document.getElementById('l3-verify-btn').addEventListener('click', () => {
        if (l3Phase !== 'input') return;
        l3Phase = 'check';
        let errs = 0;
        document.querySelectorAll('.matrix-cell').forEach(c => {
            const idx = parseInt(c.dataset.idx);
            const isLit = c.classList.contains('lit');
            const shouldBeLit = l3Seq.includes(idx);
            if (isLit && !shouldBeLit) { c.classList.add('wrong'); errs++; }
            if (!isLit && shouldBeLit) { c.classList.add('lit', 'wrong'); errs++; }
            c.style.pointerEvents = 'none';
        });
        
        document.getElementById('l3-verify-btn').style.display = 'none';
        
        if (errs === 0) {
            setStatus('l3-status', '\u2705 Idealnie!');
            l3Round++;
            if (l3Round < 3) setTimeout(startL3Round, 1200);
            else setTimeout(() => triggerSuccess('l3-status', 500), 500);
        } else {
            setStatus('l3-status', '\u274C Błąd we wzorze! Spróbuj jeszcze raz.');
            setTimeout(startL3Round, 2000);
        }
    });

    // ================================================================
    // LEVEL 4 - PAIR MATCHING (4 grupy po 4) — auto-zatwierdzanie
    // ================================================================
    const pairGroups = [
        { label: 'AKTORZY',    color: '#00f5ff', items: ['DiCaprio','Pitt','De Niro','Pacino'] },
        { label: 'MUZYCY',     color: '#a259ff', items: ['Jackson','Presley','Mercury','Bowie'] },
        { label: 'FILOZOFOWIE',color: '#ff6b35', items: ['Sokrates','Platon','Arystoteles','Kartezjusz'] },
        { label: 'NAUKOWCY',   color: '#ffd700', items: ['Einstein','Newton','Tesla','Skłodowska'] },
    ];
    let l4Selected = [], l4MatchedGroups = 0, l4Errors = 0;

    function initLevel4() {
        l4Selected = []; l4MatchedGroups = 0; l4Errors = 0;
        document.getElementById('l4-pairs-count').textContent = '0';
        document.getElementById('l4-errors').textContent = '0';
        setStatus('l4-status', 'Zaznacz 4 pasujace elementy');
        const allItems = [];
        pairGroups.forEach((g, gi) => g.items.forEach(item => allItems.push({ text: item, gi })));
        shuffle(allItems);
        const grid = document.getElementById('pairs-grid');
        grid.innerHTML = '';
        allItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'pair-card';
            card.dataset.item = item.text;
            card.dataset.group = item.gi;
            card.textContent = item.text;
            card.addEventListener('click', handleL4CardClick);
            grid.appendChild(card);
        });
    }

    function handleL4CardClick(e) {
        const card = e.currentTarget;
        if (card.classList.contains('matched') || card.classList.contains('wrong')) return;
        if (card.classList.contains('selected')) {
            card.classList.remove('selected');
            l4Selected = l4Selected.filter(c => c !== card);
            return;
        }
        if (l4Selected.length >= 4) return;
        card.classList.add('selected');
        l4Selected.push(card);
        if (l4Selected.length === 4) {
            setTimeout(verifyL4, 220);
        }
    }

    function verifyL4() {
        const groups = l4Selected.map(c => c.dataset.group);
        const allSame = groups.every(g => g === groups[0]);
        if (allSame) {
            const gd = pairGroups[parseInt(groups[0])];
            l4Selected.forEach(card => {
                card.classList.remove('selected');
                card.classList.add('matched');
                card.style.borderColor = gd.color;
                card.style.color = gd.color;
                card.style.background = gd.color + '22';
            });
            l4MatchedGroups++;
            document.getElementById('l4-pairs-count').textContent = l4MatchedGroups;
            setStatus('l4-status', `\u2705 Grupa "${gd.label}" odblokowana!`);
            l4Selected = [];
            if (l4MatchedGroups === 4) setTimeout(() => triggerSuccess('l4-status', 700), 500);
        } else {
            l4Errors++;
            document.getElementById('l4-errors').textContent = l4Errors;
            l4Selected.forEach(card => {
                card.classList.remove('selected');
                card.classList.add('wrong');
                setTimeout(() => card.classList.remove('wrong'), 800);
            });
            setStatus('l4-status', `\u274C Nie tworza grupy! (blad #${l4Errors})`);
            l4Selected = [];
        }
    }

    // ================================================================
    // LEVEL 5 - INVISIBLE TIMER
    // ================================================================
    let l5Phase = 'idle', l5StartTime = null;
    const L5_TARGET_MS = 7000, L5_TOLERANCE = 500;

    function initLevel5() {
        l5Phase = 'idle'; l5StartTime = null;
        document.getElementById('l5-phase-msg').textContent = 'Nacisnij START aby uruchomic ukryty timer.';
        document.getElementById('l5-target-display').textContent = '7';
        setStatus('l5-status', 'Timer zatrzymany');
        const btn = document.getElementById('l5-blind-btn');
        btn.textContent = '\u25B6 START';
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.style.color = '';
    }

    document.getElementById('l5-blind-btn').addEventListener('click', () => {
        const btn = document.getElementById('l5-blind-btn');
        const msg = document.getElementById('l5-phase-msg');
        if (l5Phase === 'idle') {
            l5Phase = 'running'; l5StartTime = Date.now();
            btn.textContent = '\u25A0 STOP';
            btn.style.background = 'rgba(255,34,68,0.15)';
            btn.style.borderColor = 'var(--neon-red)';
            btn.style.color = 'var(--neon-red)';
            msg.textContent = '\u23F1 Timer uruchomiony... zatrzymaj go po 7 sekundach!';
            setStatus('l5-status', 'Licz w glowie: 1, 2, 3, 4, 5, 6, 7...');
        } else if (l5Phase === 'running') {
            const elapsed = Date.now() - l5StartTime;
            l5Phase = 'done';
            const diff = Math.abs(elapsed - L5_TARGET_MS);
            const secs = (elapsed / 1000).toFixed(2);
            btn.textContent = '\u25B6 PROBUJ PONOWNIE';
            btn.style.background = ''; btn.style.borderColor = ''; btn.style.color = '';
            if (diff <= L5_TOLERANCE) {
                msg.textContent = `\u2705 Idealnie! Zatrzymales po ${secs}s! (tolerancja: +-0.5s)`;
                triggerSuccess('l5-status', 1000);
            } else {
                const over = elapsed > L5_TARGET_MS ? 'za wolno' : 'za szybko';
                msg.textContent = `\u274C Zatrzymales po ${secs}s (${over})! Cel: 7.00s +-0.5s`;
                setStatus('l5-status', 'Sprobuj ponownie!');
                setTimeout(() => initLevel5(), 2200);
            }
        } else if (l5Phase === 'done') {
            initLevel5();
        }
    });

    registerCleanup(5, () => { l5Phase = 'idle'; });

    // ================================================================
    // LEVEL 6 - REAKCJA ŁAŃCUCHOWA (Błyskawiczna Likwidacja)
    // ================================================================
    let l6Score = 0, l6Phase = 'idle';
    let l6SpawnInt = null, l6T = {};

    function initLevel6() {
        l6Score = 0; l6Phase = 'idle';
        document.getElementById('l6-round-info').textContent = 'CELÓW: 0 / 10';
        document.getElementById('l6-target-arena').innerHTML = '';
        setStatus('l6-status', 'Zbijaj cele najszybciej jak potrafisz!');
        setTimeout(startL6Round, 800);
        registerCleanup(6, () => {
            clearInterval(l6SpawnInt);
            Object.values(l6T).forEach(clearTimeout);
            l6Phase = 'idle';
        });
    }

    function startL6Round() {
        l6Score = 0; l6Phase = 'active'; l6T = {};
        document.getElementById('l6-round-info').textContent = 'CELÓW: 0 / 10';
        document.getElementById('l6-target-arena').innerHTML = '';
        l6SpawnInt = setInterval(spawnL6Target, 650);
    }

    function spawnL6Target() {
        if (l6Phase !== 'active') return;
        const arena = document.getElementById('l6-target-arena');
        const rT = document.createElement('div');
        const id = Date.now() + Math.random();
        
        rT.className = 'l6-target good';
        const size = 65 + Math.random() * 35; // bigger targets
        const left = 5 + Math.random() * (90 - (size/10));
        const top = 5 + Math.random() * (90 - (size/10));
        
        rT.style.width = size + 'px'; rT.style.height = size + 'px';
        rT.style.left = left + '%'; rT.style.top = top + '%';
        rT.dataset.id = id;

        // Interaction
        rT.addEventListener('click', (e) => {
            e.stopPropagation();
            if (l6Phase !== 'active' || rT.classList.contains('dead')) return;
            rT.classList.add('dead');
            rT.style.transform = 'translate(-50%, -50%) scale(1.5)';
            rT.style.opacity = '0';
            clearTimeout(l6T[id]); delete l6T[id];
            
            l6Score++;
            document.getElementById('l6-round-info').textContent = `CELÓW: ${l6Score} / 10`;
            setTimeout(() => rT.remove(), 200);
            
            if (l6Score >= 10) {
                l6Phase = 'done';
                clearInterval(l6SpawnInt);
                Object.values(l6T).forEach(clearTimeout);
                setStatus('l6-status', '\u2705 Reakcja łańcuchowa ukończona!');
                triggerSuccess('l6-status', 800);
            }
        });
        rT.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            const clickEvent = new Event('click'); rT.dispatchEvent(clickEvent); 
        }, {passive:false});

        arena.appendChild(rT);
        
        // Pop in animation
        requestAnimationFrame(() => {
            rT.style.transform = 'translate(-50%, -50%) scale(1)';
        });
        
        // Expire
        l6T[id] = setTimeout(() => {
            if (l6Phase !== 'active' || rT.classList.contains('dead')) return;
            // Target expired! Failed level!
            l6Phase = 'failed';
            clearInterval(l6SpawnInt);
            Object.values(l6T).forEach(clearTimeout);
            setStatus('l6-status', '\u274C Cel uciekł! Spróbuj ponownie.');
            setTimeout(initLevel6, 1500);
        }, 1100);
    }

    // ================================================================
    // LEVEL 7 - MECHANIZM ZAPADNIOWY (Lockpick)
    // ================================================================
    let l7Phase = 'idle';
    let l7Pins = []; 
    let l7Raf = null;

    function initLevel7() {
        l7Phase = 'active';
        l7Pins = [
            { pos: 0, dir: 1, speed: 0.35 + Math.random() * 0.3, locked: false, state: 'norm' },
            { pos: 0, dir: 1, speed: 0.45 + Math.random() * 0.3, locked: false, state: 'norm' },
            { pos: 0, dir: 1, speed: 0.30 + Math.random() * 0.3, locked: false, state: 'norm' },
            { pos: 0, dir: 1, speed: 0.50 + Math.random() * 0.3, locked: false, state: 'norm' }
        ];
        
        document.querySelectorAll('.lp-chamber').forEach((c, i) => {
            const zone = c.querySelector('.lp-zone');
            const zoneBottom = 20 + Math.random() * 45; // Losowa dolna krawędź od 20% do 65%
            const zoneHeight = 25; // Strefa ma 25% wysokości (kula ma ~15%)
            const zoneTop = 100 - (zoneBottom + zoneHeight);
            
            zone.style.top = `${zoneTop}%`;
            zone.style.height = `${zoneHeight}%`;
            
            l7Pins[i].zoneB = zoneBottom;
            l7Pins[i].zoneT = zoneBottom + zoneHeight;
        });
        
        document.querySelectorAll('.lp-pin').forEach(p => {
            p.classList.remove('locked', 'failed');
            p.style.bottom = '0%';
        });
        
        setStatus('l7-status', 'Zablokuj kulę całkowicie wew. ZIELONEJ STREFY!');
        
        cancelAnimationFrame(l7Raf);
        l7Raf = requestAnimationFrame(updateL7Pins);
        
        registerCleanup(7, () => {
            cancelAnimationFrame(l7Raf);
            l7Phase = 'idle';
        });
    }

    function updateL7Pins() {
        if (l7Phase !== 'active') return;
        let allLocked = true;
        
        l7Pins.forEach((pin, i) => {
            if (pin.locked) return; // don't move if locked
            allLocked = false;
            pin.pos += pin.dir * pin.speed;
            if (pin.pos >= 85) { pin.pos = 85; pin.dir = -1; }
            else if (pin.pos <= 0) { pin.pos = 0; pin.dir = 1; }
            
            document.getElementById(`lp-pin-${i}`).style.bottom = `${pin.pos}%`;
        });
        
        if (allLocked) {
            l7Phase = 'done';
            setStatus('l7-status', '\u2705 Mechanizm otwarty!');
            triggerSuccess('l7-status', 800);
            return;
        }
        
        l7Raf = requestAnimationFrame(updateL7Pins);
    }

    function lockL7Pin(idx) {
        if (l7Phase !== 'active') return;
        const pin = l7Pins[idx];
        if (pin.locked) return;
        
        // Obliczamy dokładną wysokość kuli w procentach w stosunku do wysokości komory
        const chamber = document.querySelector('.lp-chamber');
        const chamberHeight = chamber ? chamber.clientHeight : 250;
        const pinHeight = (30 / chamberHeight) * 100; 
        
        // Kula musi być w strefie (dodajemy 3.5% tolerancji, żeby trafienia "na styk" też zaliczało)
        if (pin.pos >= pin.zoneB - 3.5 && (pin.pos + pinHeight) <= pin.zoneT + 3.5) {
            pin.locked = true;
            document.getElementById(`lp-pin-${idx}`).classList.add('locked');
            setStatus('l7-status', 'Dobrze, zablokowano!');
        } else {
            pin.locked = true;
            document.getElementById(`lp-pin-${idx}`).classList.add('failed');
            l7Phase = 'failed';
            cancelAnimationFrame(l7Raf);
            setStatus('l7-status', '\u274C Kula poza strefą! Zamek zablokowany.');
            setTimeout(initLevel7, 1500);
        }
    }

    [0,1,2,3].forEach(i => {
        const btn = document.getElementById(`lp-btn-${i}`);
        if(btn) btn.addEventListener('click', () => lockL7Pin(i));
    });

    // ================================================================
    // LEVEL 8 - DEKODER WZORCA
    // ================================================================
    let l8Nums = [], l8SeqNums = [], l8Idx = 0, l8Phase = 'show', l8T8 = null;
    const L8_ROUNDS = [{seqLen:4, speed:750}, {seqLen:5, speed:600}, {seqLen:6, speed:500}];
    let l8Round = 0;

    function initLevel8() {
        l8Round = 0;
        startL8Round();
        registerCleanup(8, () => { clearTimeout(l8T8); l8Phase = 'idle'; });
    }

    function startL8Round() {
        l8Phase = 'show'; l8Idx = 0; clearTimeout(l8T8);
        document.getElementById('l8-phase-msg').textContent = `\uD83D\uDC41 Runda ${l8Round+1}/3. Obserwuj...`;
        const count = L8_ROUNDS[l8Round].seqLen;
        l8Nums = shuffle([1,2,3,4,5,6,7,8,9]);
        l8SeqNums = shuffle([...l8Nums]).slice(0, count);
        
        renderDecoder('show');
        let si = 0;
        function showSeq() {
            document.querySelectorAll('.dec-cell').forEach(c => c.classList.remove('d-lit'));
            if (si >= count) {
                setTimeout(() => {
                    l8Nums = shuffle([...l8Nums]);
                    l8Phase = 'input'; renderDecoder('input');
                    document.getElementById('l8-phase-msg').textContent = '\uD83D\uDD00 Siatka przetasowana!';
                    setStatus('l8-status', `Kliknij cyfry w kolejności zapalania!`);
                }, 500);
                return;
            }
            const target = l8SeqNums[si];
            document.querySelectorAll('.dec-cell').forEach(c => { if (parseInt(c.dataset.n) === target) c.classList.add('d-lit'); });
            si++; l8T8 = setTimeout(showSeq, L8_ROUNDS[l8Round].speed);
        }
        l8T8 = setTimeout(showSeq, 600);
    }
    
    function renderDecoder(mode) {
        const grid = document.getElementById('decoder-grid');
        grid.innerHTML = '';
        l8Nums.forEach(n => {
            const c = document.createElement('div');
            c.className = 'dec-cell' + (mode === 'show' ? ' d-off' : '');
            c.textContent = n; c.dataset.n = n;
            if (mode === 'input') {
                c.addEventListener('click', () => handleDec(n, c));
                c.addEventListener('touchstart', e => { e.preventDefault(); handleDec(n, c); }, {passive:false});
            }
            grid.appendChild(c);
        });
    }

    function handleDec(n, cell) {
        if (l8Phase !== 'input') return;
        const count = L8_ROUNDS[l8Round].seqLen;
        if (n === l8SeqNums[l8Idx]) {
            cell.classList.add('d-ok'); 
            setStatus('l8-status', `${l8Idx+1}/${count} - trafiony! Pamietaj kolejnosc...`);
            l8Idx++;
            if (l8Idx >= count) {
                l8Phase = 'done';
                document.getElementById('l8-phase-msg').textContent = '\u2713 Sekwencja odkodowana!';
                l8Round++;
                if (l8Round < 3) {
                    setTimeout(startL8Round, 1200);
                } else {
                    triggerSuccess('l8-status', 900);
                }
            } else {
                l8Phase = 'idle'; // block briefly
                setTimeout(() => {
                    l8Nums = shuffle([...l8Nums]);
                    l8Phase = 'input';
                    renderDecoder('input');
                }, 300);
            }
        } else {
            cell.classList.add('d-err'); l8Phase = 'idle';
            document.querySelectorAll('.dec-cell').forEach(c => c.style.pointerEvents = 'none');
            document.getElementById('l8-phase-msg').textContent = '\u2717 Blad! Nowy wzorzec...';
            setTimeout(() => startL8Round(), 1400); // re-run current round
        }
    }

    // ================================================================
    // LEVEL 9 - STROJENIE SYGNAŁU
    // ================================================================
    let l9Phase = 'idle';
    let l9Target = [0, 0, 0];

    function initLevel9() {
        l9Phase = 'active';
        l9Target = [
            20 + Math.floor(Math.random() * 60),
            20 + Math.floor(Math.random() * 60),
            20 + Math.floor(Math.random() * 60)
        ];
        document.getElementById('l9-s1').value = 50;
        document.getElementById('l9-s2').value = 50;
        document.getElementById('l9-s3').value = 50;
        updateL9Match();
        setStatus('l9-status', 'Zacznij przesuwać suwaki by zestroić sygnał...');
        registerCleanup(9, () => { l9Phase = 'idle'; });
    }

    function updateL9Match() {
        if (l9Phase !== 'active') return;
        const v1 = parseInt(document.getElementById('l9-s1').value);
        const v2 = parseInt(document.getElementById('l9-s2').value);
        const v3 = parseInt(document.getElementById('l9-s3').value);
        
        const dist = Math.abs(v1 - l9Target[0]) + Math.abs(v2 - l9Target[1]) + Math.abs(v3 - l9Target[2]);
        let match = 100 - Math.floor((dist / 140) * 100);
        if (match < 0) match = 0;
        
        const display = document.getElementById('l9-match-val');
        display.textContent = match;
        
        if (match < 50) display.style.color = 'var(--neon-red)';
        else if (match < 95) display.style.color = 'var(--neon-yellow)';
        else display.style.color = 'var(--neon-green)';
    }

    ['l9-s1', 'l9-s2', 'l9-s3'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateL9Match);
    });

    const l9Btn = document.getElementById('l9-verify-btn');
    if (l9Btn) {
        l9Btn.addEventListener('click', () => {
            if (l9Phase !== 'active') return;
            const match = parseInt(document.getElementById('l9-match-val').textContent);
            if (match >= 98) {
                l9Phase = 'done';
                setStatus('l9-status', '\u2705 Sygnał uchwycony! Odszyfrowywanie...');
                triggerSuccess('l9-status', 800);
            } else {
                setStatus('l9-status', '\u274C Sygnał zbyt słaby (wymagane \u226598%). Szukaj dalej!');
            }
        });
    }

    // ================================================================
    // LEVEL 10 - LAMACZ KODU (Mastermind)
    // Sekretny kod 4 symboli (z 5 mozliwych). Max 7 prob.
    // ================================================================
    const MM_SYMS = ['\u25B2','\u25CF','\u25A0','\u2605','\u25C6'];
    const MM_NAMES = ['TRJ','OKR','KWD','GWZ','ROM']; // skrócone nazwy symboli
    let mmSecret = [], mmGuess = [], mmTriesLeft = 7;

    function initLevel10() {
        mmSecret = Array.from({length:4}, () => MM_SYMS[Math.floor(Math.random()*5)]);
        mmGuess = [MM_SYMS[0], MM_SYMS[0], MM_SYMS[0], MM_SYMS[0]];
        mmTriesLeft = 7;
        document.getElementById('mm-history').innerHTML = '';
        document.getElementById('mm-tries-left').textContent = 'Pozostalo prob: 7';
        setStatus('l10-status', 'Kliknij symbole aby je zmienic, potem SPRAWDZ');
        renderMMRow();
    }

    function renderMMRow() {
        const row = document.getElementById('mm-current-row');
        row.innerHTML = '';
        mmGuess.forEach((sym, i) => {
            const s = document.createElement('div');
            s.className = 'mm-sym';
            s.textContent = sym;
            s.addEventListener('click', () => { mmGuess[i] = MM_SYMS[(MM_SYMS.indexOf(mmGuess[i]) + 1) % 5]; renderMMRow(); });
            s.addEventListener('touchstart', e => { e.preventDefault(); mmGuess[i] = MM_SYMS[(MM_SYMS.indexOf(mmGuess[i]) + 1) % 5]; renderMMRow(); }, {passive:false});
            row.appendChild(s);
        });
        const fb = document.createElement('div'); fb.className = 'mm-fb';
        fb.innerHTML = '<span style="font-size:0.62rem;color:#557;font-family:var(--font-h);text-align:center;width:100%;display:block;">KLIKNIJ \u2192 ZMIENIA</span>';
        row.appendChild(fb);
    }

    document.getElementById('mm-guess-btn').addEventListener('click', () => {
        if (mmTriesLeft <= 0) return;
        const guess = [...mmGuess];
        const secret = [...mmSecret];
        let hits = 0, closes = 0;
        const usedS = [false,false,false,false], usedG = [false,false,false,false];
        for (let i = 0; i < 4; i++) { if (guess[i] === secret[i]) { hits++; usedS[i] = usedG[i] = true; } }
        for (let i = 0; i < 4; i++) { if (usedG[i]) continue; for (let j = 0; j < 4; j++) { if (!usedS[j] && guess[i] === secret[j]) { closes++; usedS[j] = usedG[i] = true; break; } } }
        const hist = document.getElementById('mm-history');
        const row = document.createElement('div'); row.className = 'mm-row';
        guess.forEach((s, i) => { 
            const d = document.createElement('div'); 
            d.className = 'mm-sym'; 
            d.style.pointerEvents='none'; 
            d.textContent = s; 
            
            // Kolorujemy konkretne kwadraciki w stylu Wordle/Lingo:
            if (guess[i] === secret[i]) {
                d.classList.add('hit');
            } else if (secret.includes(guess[i])) {
                // Sprawdzamy czy nie zabarwimy za dużo "żółtych"
                let targetCount = secret.filter(x => x === guess[i]).length;
                let correctCount = guess.filter((x, idx) => x === guess[i] && secret[idx] === guess[i]).length;
                let alreadyYellow = guess.slice(0, i).filter((x, idx) => x === guess[i] && secret[idx] !== guess[i]).length;
                if (targetCount - correctCount - alreadyYellow > 0) {
                    d.classList.add('close');
                } else {
                    d.classList.add('miss');
                }
            } else {
                d.classList.add('miss');
            }
            
            row.appendChild(d); 
        });
        const fb = document.createElement('div'); fb.className = 'mm-fb';
        fb.innerHTML = '<span style="font-size:0.6rem;color:#8ab;">\u2190 TWOJA PRÓBA</span>';
        row.appendChild(fb); hist.appendChild(row);
        hist.scrollTop = hist.scrollHeight;
        mmTriesLeft--;
        document.getElementById('mm-tries-left').textContent = `Pozostalo prob: ${mmTriesLeft}`;
        if (hits === 4) { triggerSuccess('l10-status', 800); return; }
        if (mmTriesLeft <= 0) {
            setStatus('l10-status', `Kod: ${mmSecret.join(' ')} - nie udalo sie!`);
            setTimeout(() => initLevel10(), 2500); return;
        }
        setStatus('l10-status', `${hits} dokladnie, ${closes} zly slot - kontynuuj!`);
    });

    // --- VICTORY ---
    function showVictory(earlyEnd) {
        clearProgress(); // Umyj ręce z wczytywania – gra zakończona

        if (currentLevelStartMs) {
            totalElapsedMs += (Date.now() - currentLevelStartMs);
        }
        currentLevelStartMs = null;
        
        showScreen('victory-screen');
        const el = Math.floor(totalElapsedMs / 1000);
        const m = Math.floor(el / 60), s = el % 60;
        document.getElementById('my-time-display').textContent = `${m}m ${s < 10 ? '0' : ''}${s}s`;
        document.getElementById('stat-skipped').textContent = skippedCount;
        let lvls = earlyEnd ? (currentLevel === 0 ? 0 : currentLevel - 1) : TOTAL_LEVELS;
        document.getElementById('stat-levels').textContent = `${lvls}/${TOTAL_LEVELS}`;
        
        // Brak zapisów lokalnych dla publicznej wersji
    }

    // play-again handled by closure above

    // --- UTILS ---
    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // --- PARTICLES ---
    (function() {
        const bg = document.getElementById('particles-bg');
        const style = document.createElement('style');
        style.textContent = `@keyframes fdot { from{transform:translate(0,0)scale(1);opacity:.2} to{transform:translate(var(--tx),var(--ty))scale(1.5);opacity:.7} }`;
        document.head.appendChild(style);
        for (let i = 0; i < 28; i++) {
            const d = document.createElement('div');
            const sz = Math.random() * 2 + 1;
            const tx = (Math.random() * 40 - 20).toFixed(0) + 'px';
            const ty = (Math.random() * 40 - 20).toFixed(0) + 'px';
            d.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;border-radius:50%;background:rgba(0,245,255,${(Math.random()*0.35+0.1).toFixed(2)});left:${Math.random()*100}%;top:${Math.random()*100}%;--tx:${tx};--ty:${ty};animation:fdot ${(Math.random()*7+5).toFixed(1)}s ease-in-out ${(Math.random()*4).toFixed(1)}s infinite alternate;`;
            bg.appendChild(d);
        }
    })();

}); // DOMContentLoaded
