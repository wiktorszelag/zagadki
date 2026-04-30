document.addEventListener('DOMContentLoaded', () => {
    let currentLevel = 0;
    let totalTimeMs = 0;
    let levelStartMs = null;
    let skippedCount = 0;
    let levelHistory = [];

    // --- SCREEN TRANSITIONS (V2-style) ---
    const showScreen = (id) => {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            setTimeout(() => { if (!s.classList.contains('active')) s.classList.add('hidden'); }, 400);
        });
        const target = document.getElementById(id);
        if (!target) return;
        target.classList.remove('hidden');
        setTimeout(() => { target.classList.add('active'); target.scrollTop = 0; }, 50);
    };

    const triggerSuccess = (statusId, delay = 1000) => {
        const el = document.getElementById(statusId);
        if (el) { el.innerHTML = '&#10003; POZYTYWNY'; el.className = 'status-msg success'; }
        setTimeout(advanceLevel, delay);
    };
    const triggerError = (statusId, msg, cb) => {
        const el = document.getElementById(statusId);
        if (!el) return;
        el.innerHTML = '&#215; ' + msg;
        el.className = 'status-msg error';
        setTimeout(() => { el.innerHTML = ''; if (cb) cb(); }, 1800);
    };

    // --- LEVEL NAMES & DESCRIPTIONS ---
    const NAMES = { 1:'Sortowanie Seriali', 2:'Kalibracja Zasilania', 3:'Rekonstrukcja Obrazu', 4:'Kod Liczbowy', 5:'Zakłócona Transmisja', 6:'Ścieżka Algorytmiczna', 7:'Grawitacyjny Labirynt', 8:'Relacje Czasowe', 9:'Pamięć Matrycy', 10:'Lokalizator Anomalii' };
    const DESCS = {
        1: 'Ułóż podane polskie seriale od tego, który ma najwięcej wyemitowanych epizodów, do tego z najmniejszą liczbą. Użyj strzałek ▲▼.',
        2: 'Wybierz moduły zasilające, których napięcia sumują się dokładnie do wartości docelowej.',
        3: 'Przesuwaj kafelki na planszy 3x3, aby ułożyć je w odpowiedniej kolejności i odtworzyć pełny obraz (1-8).',
        4: 'Znajdź brakującą liczbę w ciągu liczbowym i wybierz poprawną odpowiedź.',
        5: 'Zapamiętaj sekwencję sygnału i odtwórz ją zgodnie z podanym modyfikatorem.',
        6: 'Zaprogramuj dronową drogę do celu, zbierając pakiety i omijając miny.',
        7: 'Obracaj modułem, aby kulka spadła grawitacyjnie do zielonego celu.',
        8: 'Ułóż zdarzenia historyczne od najstarszego do najnowszego.',
        9: 'Zapamiętaj wzór świetlny i odtwórz go po odliczeniu czasu.',
        10: 'Zlokalizuj ukryte nastąpienie danych na siatce. Cyfra = odległość Manhattan.'
    };

    // --- LEVEL START SCREEN (V2-style overlay) ---
    const showLevelStart = (lvl) => {
        document.getElementById('ls-level-num').textContent = 'POZIOM ' + lvl;
        document.getElementById('ls-level-name').textContent = NAMES[lvl] || '';
        document.getElementById('ls-level-desc').textContent = DESCS[lvl] || '';

        if (levelStartMs) { totalTimeMs += (Date.now() - levelStartMs); levelStartMs = null; }

        const screen = document.getElementById('level-start-screen');
        screen.classList.remove('hidden');
        setTimeout(() => screen.classList.add('active'), 80);
    };

    document.getElementById('ls-start-btn')?.addEventListener('click', () => {
        const screen = document.getElementById('level-start-screen');
        screen.classList.remove('active');
        levelStartMs = Date.now();
        setTimeout(() => {
            screen.classList.add('hidden');
            initLevel(currentLevel);
            showScreen('level-' + currentLevel);
        }, 350);
    });

    document.getElementById('ls-back-btn')?.addEventListener('click', () => {
        if (levelHistory.length === 0) return;
        const screen = document.getElementById('level-start-screen');
        screen.classList.remove('active');
        setTimeout(() => { screen.classList.add('hidden'); }, 350);
        currentLevel = levelHistory.pop();
        showLevelStart(currentLevel);
    });

    document.getElementById('ls-end-btn')?.addEventListener('click', () => {
        const screen = document.getElementById('level-start-screen');
        screen.classList.remove('active');
        setTimeout(() => {
            screen.classList.add('hidden');
            showScreen('victory-screen');
            document.getElementById('my-time-display').textContent = formatTime(totalTimeMs);
            document.getElementById('stat-skipped').textContent = skippedCount;
        }, 350);
    });

    const advanceLevel = (showIntermission = true) => {
        if (currentLevel > 0 && levelStartMs) { totalTimeMs += (Date.now() - levelStartMs); levelStartMs = null; }
        if (currentLevel > 0) levelHistory.push(currentLevel);
        currentLevel++;
        
        // Zapis postępu do bazy
        if (sessionNick) {
            fetch('/api/auth/progress', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({
                    username: sessionNick,
                    protocol: 'v1',
                    level: currentLevel,
                    timeMs: totalTimeMs,
                    completed: currentLevel > 10
                })
            });
            try {
                let s = JSON.parse(localStorage.getItem('enigma_mock_session'));
                if (s) { s.v1Level = currentLevel; s.v1TimeMs = totalTimeMs; if(currentLevel > 10) s.v1Completed = true; localStorage.setItem('enigma_mock_session', JSON.stringify(s)); }
            } catch(e) {}
        }

        if (currentLevel <= 10) {
            if (showIntermission && currentLevel > 1) {
                showScreen('intermission-screen');
            } else {
                showLevelStart(currentLevel);
            }
        } else {
            showScreen('victory-screen');
            document.getElementById('my-time-display').textContent = formatTime(totalTimeMs);
            document.getElementById('stat-skipped').textContent = skippedCount;
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

    const formatTime = (ms) => {
        const s = Math.floor(ms / 1000);
        return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
    };

    // --- DEV BAR ---
    document.getElementById('skip-btn')?.addEventListener('click', () => {
        skippedCount++;
        totalTimeMs += 30000;
        if (currentLevel === 0) currentLevel = 1;
        const screen = document.getElementById('level-start-screen');
        if (screen.classList.contains('active')) { screen.classList.remove('active'); setTimeout(() => screen.classList.add('hidden'), 350); }
        advanceLevel();
    });
    document.getElementById('restart-btn')?.addEventListener('click', () => {
        currentLevel = 0; totalTimeMs = 0; levelStartMs = null; skippedCount = 0; levelHistory = [];
        showScreen('start-screen');
    });
    document.getElementById('play-again-btn')?.addEventListener('click', () => {
        currentLevel = 0; totalTimeMs = 0; levelStartMs = null; skippedCount = 0; levelHistory = [];
        showScreen('start-screen');
    });
    window.jumpToLevelHandler = (n) => {
        currentLevel = n - 1;
        advanceLevel(false);
    };

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
                nickInput.style.display = 'none';
                
                const nickDisplay = document.createElement('div');
                nickDisplay.innerHTML = `OPERATOR PODŁĄCZONY:<br><b style="color:var(--neon-green)">${sessionNick}</b>`;
                nickDisplay.style.cssText = 'color:#88aaff; font-family:var(--font-h); text-align:center; margin:15px 0; letter-spacing:2px; font-size:1.1rem;';
                nickInput.parentNode.insertBefore(nickDisplay, nickInput);
            }
            if (sessionRole === 'ADMIN') {
                const devBar = document.getElementById('dev-bar');
                if (devBar) devBar.style.display = 'flex';
            }
            if (session.v1Level && session.v1Level > 1) {
                if (session.v1Level <= 10) {
                    currentLevel = session.v1Level - 1;
                    totalTimeMs = session.v1TimeMs || 0;
                } else {
                    currentLevel = 10;
                    totalTimeMs = session.v1TimeMs || 0;
                }
            }
        }
    } catch(e) {}

    // --- START SCREEN ---
    document.getElementById('start-btn')?.addEventListener('click', () => {
        const nick = document.getElementById('player-nick').value.trim();
        const inp = document.getElementById('player-nick');
        if (!nick) {
            inp.style.borderColor = 'var(--neon-red)';
            inp.style.boxShadow = '0 0 15px rgba(255,34,68,0.3)';
            setTimeout(() => { inp.style.borderColor = ''; inp.style.boxShadow = ''; }, 900);
            return;
        }
        advanceLevel(false);
    });

    const initLevel = (lvl) => { const el = document.getElementById(`l${lvl}-status`); if (el) el.textContent = ''; window[`initL${lvl}`](); };

    // L1 Seriale
    const polishSeries = [
        { name: "Klan", eps: 4500 }, { name: "Pierwsza miłość", eps: 3850 }, { name: "Na Wspólnej", eps: 3800 }, { name: "Barwy szczęścia", eps: 3000 },
        { name: "Plebania", eps: 1829 }, { name: "M jak miłość", eps: 1800 }, { name: "Złotopolscy", eps: 1121 }, { name: "Na dobre i na złe", eps: 900 },
        { name: "Świat według Kiepskich", eps: 588 }, { name: "BrzydUla", eps: 527 }, { name: "Ojciec Mateusz", eps: 400 }, { name: "Rodzinka.pl", eps: 287 },
        { name: "Niania", eps: 134 }, { name: "Miodowe lata", eps: 131 }, { name: "Ranczo", eps: 130 }, { name: "13 posterunek", eps: 83 },
        { name: "Czas honoru", eps: 78 }, { name: "Wataha", eps: 18 }, { name: "Alternatywy 4", eps: 9 }, { name: "Ślepnąc od świateł", eps: 8 }
    ];
    let l1CurrentSeries = [];
    let l1Fails = 0;
    window.initL1 = function() {
        l1Fails = 0;
        const fl = document.getElementById('l1-fails'); if(fl) fl.textContent = `0/3`;
        const c = document.getElementById('l1-slots'); c.innerHTML='';
        let shuffled = [...polishSeries].sort(() => Math.random() - 0.5);
        l1CurrentSeries = shuffled.slice(0, 5);
        let items = [...l1CurrentSeries].sort(() => Math.random() - 0.5);
        items.forEach((s) => {
            const d = document.createElement('div'); d.className='chrono-btn'; 
            d.style.display = 'flex'; d.style.justifyContent = 'space-between'; d.style.alignItems = 'center'; d.style.padding = '8px 12px';
            d.innerHTML = `<span class="item-text" style="font-weight:bold; letter-spacing:1px; flex:1;">${s.name}</span> 
                           <div style="display:flex; flex-direction:column; gap:4px;">
                               <button class="sort-arr up">▲</button>
                               <button class="sort-arr dn">▼</button>
                           </div>`;
            d.querySelector('.up').onclick = (e) => { e.stopPropagation(); if(d.previousElementSibling) d.parentNode.insertBefore(d, d.previousElementSibling); };
            d.querySelector('.dn').onclick = (e) => { e.stopPropagation(); if(d.nextElementSibling) d.parentNode.insertBefore(d.nextElementSibling, d); };
            c.appendChild(d);
        });
    };
    document.getElementById('l1-hint-btn')?.addEventListener('click', () => {
        totalTimeMs += 30000; // +30s kara
        let els = document.getElementById('l1-slots').children;
        let sortedDesc = [...l1CurrentSeries].sort((a,b) => b.eps - a.eps);
        for(let i=0;i<5;i++) {
            if(els[i].querySelector('.item-text').textContent === sortedDesc[i].name) els[i].style.borderColor = '#0f5';
            else els[i].style.borderColor = '#f55';
        }
    });
    document.getElementById('verify-l1-btn')?.addEventListener('click', () => {
        let els = document.getElementById('l1-slots').children; let ok=true;
        let sortedDesc = [...l1CurrentSeries].sort((a,b) => b.eps - a.eps);
        for(let i=0;i<5;i++) {
            els[i].style.borderColor = '#555'; // reset borders
            if(els[i].querySelector('.item-text').textContent !== sortedDesc[i].name) ok=false;
        }
        if(ok) { triggerSuccess('l1-status'); }
        else {
            l1Fails++;
            document.getElementById('l1-fails').textContent = `${l1Fails}/3`;
            if(l1Fails >= 3) {
                triggerError('l1-status', 'LIMIT BŁĘDÓW! RESTART...', () => { initL1(); });
            } else {
                triggerError('l1-status', 'BŁĘDNA KOLEJNOŚĆ WZGLĘDEM ODCINKÓW');
            }
        }
    });

    // L2 Kalibracja Zasilania
    let l2Target = 0, l2Bats = [], l2Selected = [];
    window.initL2=function(){
        l2Selected = [];
        let base = Math.floor(Math.random() * 7) + 2; // Wielokrotności od 2 do 8
        let uniqueVals = new Set();
        while(uniqueVals.size < 6) {
           uniqueVals.add((Math.floor(Math.random()*14)+2)*base);
        }
        let arr = Array.from(uniqueVals);
        let r1 = arr[0], r2 = arr[1], r3 = arr[2];
        l2Target = r1 + r2 + r3;
        l2Bats = [...arr].sort(() => Math.random() - 0.5);
        let tl = document.getElementById('l2-target-volt'); if(tl) tl.textContent = l2Target;
        let st = document.getElementById('l2-status'); if(st) st.textContent='Zaznacz odpowiednie komórki zasilania.';
        const wl = document.getElementById('l2-current-volt'); if(wl) { wl.textContent='0'; wl.style.color='#0f5'; }
        renderL2();
    };
    function renderL2(){
        let elCur = document.getElementById('l2-current-volt');
        let current = l2Selected.reduce((acc, idx) => acc + l2Bats[idx], 0);
        if(elCur) { elCur.textContent = current; elCur.style.color = current===l2Target?'#0f5':'#0af'; }
        
        const cont = document.getElementById('l2-batteries'); if(!cont) return;
        cont.innerHTML='';
        l2Bats.forEach((val, idx) => {
            let btn = document.createElement('div');
            btn.className = 'act-btn';
            let isSel = l2Selected.includes(idx);
            btn.style.cssText = `font-family:var(--font-mono);font-size:1.4rem;font-weight:bold;padding:12px;cursor:pointer;border-color:${isSel?'#0f5':'#335'};color:${isSel?'#000':'#0af'};background:${isSel?'#0f5':'rgba(0,170,255,0.05)'};width:42%;text-align:center;border-radius:6px;`;
            btn.textContent = val + 'V';
            btn.onclick = () => {
                if(isSel) l2Selected = l2Selected.filter(i=>i!==idx);
                else l2Selected.push(idx); // No max limit
                renderL2();
            };
            cont.appendChild(btn);
        });
    }
    window.l2Reset=function(){ l2Selected=[]; renderL2(); document.getElementById('l2-status').textContent=''; };
    document.getElementById('verify-l2-btn')?.addEventListener('click',()=>{
        let current = l2Selected.reduce((acc, idx) => acc + l2Bats[idx], 0);
        if(current===l2Target && l2Selected.length>0) triggerSuccess('l2-status');
        else triggerError('l2-status', current===l2Target?'Zaznacz jakiekolwiek komórki!':'Przebicie! Suma musi się idealnie zgadzać z celem.', ()=>{
            l2Selected=[]; renderL2();
        });
    });

    // L3 Rekonstrukcja Obrazu (8-puzzle)
    let l3State = []; // 0 to 8, 8 is empty space
    window.initL3=function(){
        l3State = [0,1,2,3,4,5,6,7,8];
        let inversions = 0;
        do {
            l3State.sort(() => Math.random() - 0.5);
            inversions = 0;
            for(let i=0; i<9; i++) {
                if(l3State[i] === 8) continue;
                for(let j=i+1; j<9; j++) {
                    if(l3State[j] !== 8 && l3State[i] > l3State[j]) inversions++;
                }
            }
        } while (inversions % 2 !== 0 || l3State.every((val, index) => val === index));
        
        renderL3();
        checkL3Win();
    };

    function renderL3(){
        const board = document.getElementById('l3-board');
        if(!board) return;
        board.innerHTML = '';
        board.style.cssText = 'display:grid; grid-template-columns:repeat(3, 1fr); gap:4px; width:220px; height:220px; margin:0 auto; background:#112; padding:4px; border:2px solid var(--neon-cyan); border-radius:8px;';
        
        l3State.forEach((val, idx) => {
            const tile = document.createElement('div');
            if (val === 8) {
                tile.style.cssText = 'background:transparent; border-radius:4px;';
            } else {
                tile.style.cssText = `
                    background: linear-gradient(135deg, #112, #224);
                    background-size: 300% 300%;
                    background-position: ${(val % 3) * 50}% ${Math.floor(val / 3) * 50}%;
                    border-radius: 4px;
                    border: 1px solid #0af;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: var(--font-h);
                    font-size: 1.8rem;
                    font-weight: bold;
                    color: #0af;
                    text-shadow: 0 0 5px #0af;
                    cursor: pointer;
                    box-shadow: inset 0 0 10px rgba(0,170,255,0.2);
                    transition: transform 0.1s, box-shadow 0.1s;
                `;
                tile.textContent = val + 1;
                tile.onclick = () => l3ClickTile(idx);
            }
            board.appendChild(tile);
        });
    }

    function l3ClickTile(idx) {
        let emptyIdx = l3State.indexOf(8);
        let validMoves = [
            emptyIdx - 3, emptyIdx + 3,
            (emptyIdx % 3 !== 0) ? emptyIdx - 1 : -1,
            (emptyIdx % 3 !== 2) ? emptyIdx + 1 : -1
        ];
        
        if (validMoves.includes(idx)) {
            l3State[emptyIdx] = l3State[idx];
            l3State[idx] = 8;
            renderL3();
            checkL3Win();
        }
    }

    function checkL3Win() {
        const verifyBtn = document.getElementById('verify-l3-btn');
        if (!verifyBtn) return;
        if (l3State.every((val, index) => val === index)) {
            verifyBtn.style.display = 'block';
            verifyBtn.style.borderColor = '#0f5';
            verifyBtn.style.color = '#0f5';
        } else {
            verifyBtn.style.display = 'none';
        }
    }

    document.getElementById('verify-l3-btn')?.addEventListener('click',()=>{
        if (l3State.every((val, index) => val === index)) {
            triggerSuccess('l3-status');
        }
    });

    document.getElementById('l3-hint-btn')?.addEventListener('click', function(){
        this.disabled = true; this.style.opacity = '0.5';
        totalTimeMs += 480000; // +8 min penalty
        l3State = [0,1,2,3,4,5,6,7,8];
        renderL3();
        checkL3Win();
        const st=document.getElementById('l3-status');
        if(st){st.textContent='🔍 PODPOWIEDŹ zastosowana (+8 minut). Ułożono poprawnie!'; st.style.color='#f90';}
    });

    // L4 Kod Liczbowy (Proceduralnie generowane ciągi)
    let l4ActiveSeq = null;
    
    window.initL4 = function() {
        const types = [
            // 0: x + N
            () => { const step = Math.floor(Math.random()*15)+3; const start = Math.floor(Math.random()*20)+1; return { seq: [start, start+step, start+step*2, start+step*3, start+step*4], ans: start+step*3, idx: 3, hint: 'Stała różnica (dodawanie)' }; },
            // 1: x * N
            () => { const step = Math.floor(Math.random()*3)+2; const start = Math.floor(Math.random()*4)+2; return { seq: [start, start*step, start*step*step, start*step*step*step, start*Math.pow(step,4)], ans: start*step*step, idx: 2, hint: 'Stały mnożnik' }; },
            // 2: x^2
            () => { const start = Math.floor(Math.random()*4)+2; return { seq: [start, start*start, Math.pow(start,4), Math.pow(start,8), Math.pow(start,16)], ans: Math.pow(start,4), idx: 2, hint: 'Poprzednia liczba do kwadratu' }; },
            // 3: Fibonacci-like
            () => { const a = Math.floor(Math.random()*5)+1; const b = Math.floor(Math.random()*5)+1; const s = [a, b, a+b, a+2*b, 2*a+3*b, 3*a+5*b]; return { seq: s, ans: s[4], idx: 4, hint: 'Suma dwóch poprzednich' }; },
            // 4: x^3
            () => { const s = [1, 8, 27, 64, 125, 216]; const shift = Math.floor(Math.random()*2); return { seq: s.slice(shift, shift+5), ans: s[shift+3], idx: 3, hint: 'Sześciany liczb całkowitych (x³)' }; }
        ];

        const generator = types[Math.floor(Math.random() * types.length)]();
        
        let choices = new Set();
        choices.add(generator.ans);
        while(choices.size < 4) {
            let offset = Math.floor(Math.random() * 20) - 10;
            if (offset === 0) offset = 1;
            let wrong = generator.ans + offset;
            if (generator.ans > 100) wrong = generator.ans + (offset * 10);
            if (wrong > 0 && !choices.has(wrong)) choices.add(wrong);
        }

        let seqDisplay = [...generator.seq];
        seqDisplay[generator.idx] = -1;

        l4ActiveSeq = { seq: seqDisplay, ans: generator.ans, choices: Array.from(choices), hint: generator.hint };

        const seqEl = document.getElementById('l4-sequence');
        const hintEl = document.getElementById('l4-hint');
        const chEl = document.getElementById('l4-choices');
        
        if(!seqEl || !chEl) return;
        seqEl.textContent = l4ActiveSeq.seq.map(n => n === -1 ? '  ?  ' : n).join(' • ');
        if(hintEl) hintEl.textContent = '';
        chEl.innerHTML = '';
        
        const st = document.getElementById('l4-status'); 
        if(st) st.textContent = '';
        
        [...l4ActiveSeq.choices].sort(() => Math.random() - 0.5).forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'act-btn';
            btn.style.cssText = 'font-size:1.6rem;font-family:var(--font-mono);font-weight:bold;padding:14px 24px;border-color:#0af;color:#0af;min-width:80px;';
            btn.textContent = c;
            btn.onclick = () => {
                if(c === l4ActiveSeq.ans) { 
                    btn.style.background = '#0a3a0a'; btn.style.borderColor = '#0f5'; btn.style.color = '#0f5'; 
                    triggerSuccess('l4-status'); 
                } else { 
                    btn.style.background = '#3a0a0a'; btn.style.borderColor = '#f55'; btn.disabled = true; 
                    setTimeout(() => initL4(), 900); 
                }
            };
            chEl.appendChild(btn);
        });
    };

    // L5 Transmisja modified
    let l5Seq = []; let l5Idx = 0; let l5Mod = 0; let l5Round = 0; let l5Playing = false;
    const L5_ROUNDS = [4, 5, 6];

    window.initL5 = function() {
        l5Round = 0;
        l5Playing = false;
        startL5Round();
    };

    function startL5Round() {
        l5Seq = []; 
        for(let i=0; i<L5_ROUNDS[l5Round]; i++) l5Seq.push(Math.floor(Math.random()*4));
        l5Mod = 1;
        document.getElementById('l5-modifier').textContent = 'Odtwórz OD TYŁU';
        const indicator = document.getElementById('l5-round-indicator');
        if (indicator) indicator.textContent = `RUNDA ${l5Round + 1}/3`;
        const st = document.getElementById('l5-status');
        if (st) st.textContent = '';
        l5Idx = 0;
        document.getElementById('start-l5-btn').style.display='block';
        
        document.querySelectorAll('#l5-grid .simon-quad').forEach((el, idx) => {
            el.onclick = () => window.l5Press(idx);
            el.ontouchstart = (e) => { e.preventDefault(); window.l5Press(idx); };
        });
    }

    window.l5Press = function(id) {
        if(l5Seq.length===0 || l5Playing) return;
        const qs=document.querySelectorAll('#l5-grid .simon-quad');
        if(qs[id]) { qs[id].style.outline='4px solid #fff'; qs[id].style.opacity='1'; setTimeout(()=>{qs[id].style.outline='';qs[id].style.opacity='';},300); }
        let tgt = []; if(l5Mod===1) tgt=[...l5Seq].reverse(); else tgt=l5Seq.slice(1);
        if(id===tgt[l5Idx]) { 
            l5Idx++; 
            if(l5Idx===tgt.length) { 
                l5Seq = [];
                l5Round++;
                if (l5Round >= L5_ROUNDS.length) {
                    triggerSuccess('l5-status'); 
                } else {
                    const st = document.getElementById('l5-status');
                    if(st) { st.textContent='SEKWENCJA ZALICZONA. PRZYGOTUJ SIĘ...'; st.style.color='#0f5'; }
                    setTimeout(() => startL5Round(), 1500);
                }
            } 
        }
        else { triggerError('l5-status', 'BŁĄD. RESET ZADANIA!'); l5Seq=[]; setTimeout(() => window.initL5(), 1500); }
    };
    document.getElementById('start-l5-btn')?.addEventListener('click', () => {
        document.getElementById('start-l5-btn').style.display='none'; 
        let d = 0;
        l5Playing = true;
        l5Seq.forEach(v => { 
            setTimeout(() => { 
                const qs=document.querySelectorAll('#l5-grid .simon-quad'); 
                if(qs[v]) {
                    qs[v].classList.add('active'); 
                    setTimeout(()=>qs[v].classList.remove('active'),300); 
                }
            }, d); 
            d+=600; 
        });
        setTimeout(() => { l5Playing = false; }, d);
    });

    // L6 Dron Algorithm
    let l6Map = []; let l6Pos = {x:0, y:0, d:0}; let l6Code = [];
    let l6BlindInterval = null;
    window.initL6 = function() {
        if(l6BlindInterval) clearInterval(l6BlindInterval);
        const g = document.getElementById('l6-grid'); g.innerHTML=''; l6Code=[]; document.getElementById('l6-program').textContent='';
        let valid = false;
        while(!valid) {
            l6Map = Array(25).fill(0); l6Map[4] = 2; l6Map[20] = 9; l6Pos = {x:0, y:4, d:0};
            let traps = 0;
            while(traps < 6) {
                let r = Math.floor(Math.random()*25);
                if(l6Map[r] === 0) { l6Map[r] = 1; traps++; }
            }
            let pickups = 0;
            while(pickups < 2) {
                let r = Math.floor(Math.random()*25);
                if(l6Map[r] === 0) { l6Map[r] = 3; pickups++; }
            }
            let q = [20]; let visited = new Set([20]); valid = false;
            while(q.length > 0) {
                let curr = q.shift();
                let cx = curr % 5; let cy = Math.floor(curr / 5);
                [[0,-1],[0,1],[-1,0],[1,0]].forEach(d => {
                    let nx = cx + d[0]; let ny = cy + d[1];
                    if(nx>=0 && nx<5 && ny>=0 && ny<5) {
                        let nIdx = ny * 5 + nx;
                        if(l6Map[nIdx] !== 1 && !visited.has(nIdx)) { visited.add(nIdx); q.push(nIdx); }
                    }
                });
            }
            if(visited.size === 19) valid = true; // 25-6=19
        }
        
        let timerEl = document.getElementById('l6-timer');
        if (timerEl) { timerEl.remove(); }
        
        for(let i=0;i<25;i++) {
            const d = document.createElement('div'); d.className='cell-path ' + (l6Map[i]===1?'trap':l6Map[i]===2?'goal':'');
            if(l6Map[i]===9) d.innerHTML = '<span style="color:#0af; font-family:sans-serif;" id="l6-drone">▲</span>'; 
            if(l6Map[i]===3) d.innerHTML = '<span style="color:#ff0; font-size:1.5rem;" class="pickup">♦</span>'; 
            g.appendChild(d);
        }
    };
    window.l6AddCmd = function(c) { if(l6Code.length<50) { l6Code.push(c); document.getElementById('l6-program').textContent = l6Code.join(' '); } };
    window.l6Undo = function() { l6Code.pop(); document.getElementById('l6-program').textContent = l6Code.join(' '); };
    document.getElementById('verify-l6-btn')?.addEventListener('click', () => {
        document.getElementById('verify-l6-btn').disabled = true;
        let p = {x:l6Pos.x, y:l6Pos.y, d:l6Pos.d}; let crash=false; let win=false;
        let step = 0;
        let collected = 0;
        let runMap = [...l6Map];
        let failMsg = "Kolizja / Poza mapą!";
        
        function drawDrone() {
            document.querySelectorAll('#l6-grid .cell-path').forEach((el, i) => {
                if(el.querySelector('#l6-drone')) { el.querySelector('#l6-drone').remove(); }
                if(runMap[i]===3 && !el.querySelector('.pickup')) {
                    el.innerHTML = '<span style="color:#ff0; font-size:1.5rem;" class="pickup">♦</span>';
                }
                if(runMap[i]===0) { el.innerHTML=''; }
            });
            if(p.x>=0 && p.x<=4 && p.y>=0 && p.y<=4) {
               let nIdx = p.y*5 + p.x;
               let arrow = p.d===0?'▲':p.d===1?'▶':p.d===2?'▼':'◀';
               let el = document.querySelectorAll('#l6-grid .cell-path')[nIdx];
               if(runMap[nIdx]===3) el.innerHTML = `<span style="color:#ff0; font-size:1.5rem;" class="pickup">♦</span>`;
               else if(runMap[nIdx]!==1 && runMap[nIdx]!==2) el.innerHTML = '';
               el.innerHTML += `<span style="color:#0af; font-family:sans-serif; position:absolute;" id="l6-drone">${arrow}</span>`;
            }
        }
        
        function nextMove() {
            if(step >= l6Code.length || crash || win) {
                document.getElementById('verify-l6-btn').disabled = false;
                if(win && !crash) triggerSuccess('l6-status');
                else { triggerError('l6-status', crash?failMsg:'Cel nieosiągnięty'); setTimeout(initL6,1500); }
                return;
            }
            let c = l6Code[step++];
            if(c==='↶') p.d = (p.d+3)%4;
            if(c==='↷') p.d = (p.d+1)%4;
            if(c==='↑') { if(p.d===0) p.y--; if(p.d===1) p.x++; if(p.d===2) p.y++; if(p.d===3) p.x--; }
            drawDrone();
            
            if(p.x<0||p.x>4||p.y<0||p.y>4) { crash=true; }
            else {
                let idx = p.y*5 + p.x;
                if(runMap[idx]===1) crash=true;
                if(runMap[idx]===3) { collected++; runMap[idx]=0; drawDrone(); }
                if(runMap[idx]===2) {
                    if(collected === 2) win = true;
                    else { crash = true; failMsg = "Brak pakietów danych (♦)!"; }
                }
            }
            
            setTimeout(nextMove, 500);
        }
        nextMove();
    });

    // L7 Gravity Maze z wizualną rotacją
    const L7_MAPS = [
        { grid:[ [0,0,0,0,0], [0,1,0,1,0], [0,0,0,0,0], [0,1,0,1,0], [0,0,2,0,0] ], start:{x:0,y:0} },
        { grid:[ [0,0,0,0,0], [0,1,1,0,0], [0,0,0,0,1], [1,0,1,0,0], [0,0,2,0,0] ], start:{x:4,y:0} },
        { grid:[ [0,0,0,1,0], [0,1,0,0,0], [0,0,0,1,0], [1,0,0,0,0], [0,0,2,0,0] ], start:{x:0,y:4} }
    ];
    let l7Grid=[], l7Rot=0, l7Ball={x:0,y:0};
    
    window.initL7 = function() {
        l7Rot = 0; 
        document.getElementById('l7-box').style.transform = `rotate(0deg)`;
        const mapObj = L7_MAPS[Math.floor(Math.random()*L7_MAPS.length)];
        l7Grid = mapObj.grid.map(row=>[...row]);
        l7Ball = {...mapObj.start};
        renderL7();
    };
    function renderL7() {
        const b = document.getElementById('l7-box'); if(!b) return; b.innerHTML='';
        for(let y=0; y<5; y++) {
            for(let x=0; x<5; x++) {
                const c = document.createElement('div'); 
                c.className='grav-cell ' + (l7Grid[y][x]===1?'grav-wall':l7Grid[y][x]===2?'grav-goal':'');
                c.style.cssText = 'position:relative;width:100%;height:100%;border-radius:4px;';
                if(l7Grid[y][x]===1) c.style.background='#0af';
                if(l7Grid[y][x]===2) c.style.background='#0f5';
                if(l7Ball.x===x && l7Ball.y===y) {
                    c.innerHTML = `<div style="width:80%;height:80%;border-radius:50%;background:#0ff;box-shadow:0 0 10px #0ff;position:absolute;top:10%;left:10%;transition:all 0.1s;"></div>`;
                }
                b.appendChild(c);
            }
        }
    }
    window.l7Rotate = function(dir) {
        l7Rot += dir*90; 
        document.getElementById('l7-box').style.transform = `rotate(${l7Rot}deg)`;
        
        let r = ((l7Rot % 360) + 360) % 360;
        let dx=0, dy=0;
        // Wektor "Tylko w dół na ekranie" mapowany do obróconej wirtualnej siatki
        if(r===0)   { dx=0; dy=1; }
        if(r===90)  { dx=1; dy=0; }
        if(r===180) { dx=0; dy=-1; }
        if(r===270) { dx=-1; dy=0; }
        
        // Pętla spadania kulki
        let moved = false;
        while(true) { 
            let nx=l7Ball.x+dx; let ny=l7Ball.y+dy; 
            if(nx>=0 && nx<5 && ny>=0 && ny<5 && l7Grid[ny][nx]!==1) { 
                l7Ball.x=nx; l7Ball.y=ny; moved=true;
            } else break; 
        }
        
        renderL7(); 
        if(l7Grid[l7Ball.y][l7Ball.x]===2) triggerSuccess('l7-status');
    };


    // L8 Relacje Czasowe (multiple random sets)
    const l8EventSets = [
        {items:['Odkrycie ognia','Wynalezienie koła','Prasa drukarska Gutenberga','Rewolucja przemysłowa','Lądowanie na Księżycu'],
         desc:'Ułóż wynalazki i odkrycia od <b>najstarszego</b> (góra) do <b>najnowszego</b> (dół).'},
        {items:['Pierwsze Igrzyska Olimpijskie','Chrzest Polski','Odkrycie Ameryki','Rewolucja Francuska','Druga Wojna Światowa'],
         desc:'Ułóż wydarzenia historyczne od <b>najstarszego</b> do <b>najnowszego</b>.'},
        {items:['Wynalezienie telefonu','Wynalezienie radia','Pierwszy komputer PC','Sieć WWW (Internet)','Smartfony'],
         desc:'Ułóż przełomy technologiczne od <b>najwcześniejszego</b> do <b>najpóźniejszego</b>.'},
        {items:['Budowa Kolosseum','Wynalezienie prochu','Galileusz - teleskop','Szczepionka na ospę','Teoria względności Einsteina'],
         desc:'Ułóż odkrycia naukowe od <b>najstarszego</b> do <b>najnowszego</b>.'}
    ];
    let l8ActiveSet = null;
    window.initL8 = function() {
        l8ActiveSet = l8EventSets[Math.floor(Math.random()*l8EventSets.length)];
        document.getElementById('l8-clues').innerHTML = l8ActiveSet.desc + ' <span style="color:#0af;">Używaj strzałek ▲▼</span>.';
        const c = document.getElementById('l8-slots'); c.innerHTML='';
        [...l8ActiveSet.items].sort(()=>Math.random()-0.5).forEach(v => {
            const d = document.createElement('div'); d.className='chrono-btn';
            d.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:8px 12px;';
            d.innerHTML = `<span class="item-text" style="font-weight:bold;letter-spacing:1px;flex:1;">${v}</span>
                           <div style="display:flex;flex-direction:column;gap:4px;">
                               <button class="sort-arr up">▲</button>
                               <button class="sort-arr dn">▼</button>
                           </div>`;
            d.querySelector('.up').onclick=(e)=>{e.stopPropagation();if(d.previousElementSibling) d.parentNode.insertBefore(d,d.previousElementSibling);};
            d.querySelector('.dn').onclick=(e)=>{e.stopPropagation();if(d.nextElementSibling) d.parentNode.insertBefore(d.nextElementSibling,d);};
            c.appendChild(d);
        });
    };
    document.getElementById('verify-l8-btn')?.addEventListener('click',()=>{
        const els=document.getElementById('l8-slots').children; let ok=true;
        for(let i=0;i<5;i++) if(els[i].querySelector('.item-text').textContent!==l8ActiveSet.items[i]) ok=false;
        
        // Show correct / wrong for a moment
        for(let i=0;i<5;i++) {
            if(els[i].querySelector('.item-text').textContent===l8ActiveSet.items[i]) {
                els[i].style.borderColor = '#0f5'; els[i].style.boxShadow = '0 0 8px #0f5';
            } else {
                els[i].style.borderColor = '#f55'; els[i].style.boxShadow = '0 0 8px #f55';
            }
        }
        setTimeout(() => {
            for(let i=0;i<5;i++) { els[i].style.borderColor = '#335'; els[i].style.boxShadow = 'none'; }
        }, 1200);

        if(ok) triggerSuccess('l8-status'); else triggerError('l8-status','BŁĘDNA KOLEJNOŚĆ CHRONOLOGICZNA');
    });
    
    document.getElementById('l8-hint-btn')?.addEventListener('click', function(){
        totalTimeMs += 30000; // +30s penalty
        const c=document.getElementById('l8-slots');
        const els=[...c.children];
        for(let i=0;i<5;i++) {
            if(els[i].querySelector('.item-text').textContent === l8ActiveSet.items[i]) {
                els[i].style.borderColor = '#0f5';
                els[i].style.boxShadow = '0 0 8px rgba(0, 255, 85, 0.5)';
            } else {
                els[i].style.borderColor = '#f55';
                els[i].style.boxShadow = '0 0 8px rgba(255, 85, 85, 0.5)';
            }
        }
        const st=document.getElementById('l8-status');
        if(st){st.textContent='🔍 PODPOWIEDŹ zastosowana (+30s). Czerwone: źle, Zielone: dobrze!'; st.style.color='#f90';}
    });

    // L9 Pamięć Matrycy (5x5, 3 rundy, rosnące trudności)
    let l9Target=[], l9Phase='memorize', l9CountTimer=null, l9UserSelected=[], l9Round=0;
    const L9_CELLS=25, L9_ROUNDS=[{lit:7,time:4},{lit:9,time:3},{lit:11,time:3}];
    window.initL9=function(){ l9Round=0; l9StartRound(); };
    function l9StartRound(){
        if(l9CountTimer){clearInterval(l9CountTimer);l9CountTimer=null;}
        const cfg=L9_ROUNDS[l9Round]; l9Phase='memorize'; l9Target=[]; l9UserSelected=[];
        while(l9Target.length<cfg.lit){let r=Math.floor(Math.random()*L9_CELLS);if(!l9Target.includes(r))l9Target.push(r);}
        const inst=document.getElementById('l9-instruction');
        const ri=document.getElementById('l9-round-info');
        if(ri) ri.textContent='Runda '+(l9Round+1)+'/'+L9_ROUNDS.length+' | Pol: '+cfg.lit+' | Czas: '+cfg.time+'s';
        if(inst) inst.innerHTML='<b style="color:#f05;">ZAPAMIETAJ</b> pola! Masz <b style="color:#ff0;">'+cfg.time+'s</b>.';
        const cdEl=document.getElementById('l9-countdown');
        renderL9Grid(true);
        let secs=cfg.time; if(cdEl) cdEl.textContent=secs;
        l9CountTimer=setInterval(function(){
            secs--;
            if(cdEl) cdEl.textContent=secs>0?secs:'';
            if(secs<=0){
                clearInterval(l9CountTimer); l9CountTimer=null; l9Phase='recall';
                if(inst) inst.innerHTML='<b style="color:#0af;">KLIKNIJ</b> zapamietane pola, potem zatwierdz.';
                if(cdEl) cdEl.textContent='';
                renderL9Grid(false);
            }
        },1000);
    }
    function renderL9Grid(showPattern){
        const grid=document.getElementById('l9-grid');
        if(!grid) return; grid.innerHTML='';
        const cellSz=Math.min(48,Math.floor((Math.min(window.innerWidth,400)-80)/5));
        for(let i=0;i<L9_CELLS;i++){
            const cell=document.createElement('div');
            const isLit=l9Target.includes(i);
            const isUserSel=l9UserSelected.includes(i);
            cell.style.cssText='width:'+cellSz+'px;height:'+cellSz+'px;border-radius:6px;cursor:'+(l9Phase==='recall'?'pointer':'default')+';transition:background 0.12s,box-shadow 0.12s;touch-action:manipulation;border:1px solid #2a2a3a;';
            if(showPattern&&isLit){cell.style.background='#0af';cell.style.boxShadow='0 0 12px #0af';}
            else if(!showPattern&&isUserSel){cell.style.background='#0af';cell.style.boxShadow='0 0 10px #0af';}
            else{cell.style.background='#1a1a2e';cell.style.boxShadow='none';}
            if(l9Phase==='recall'){
                (function(idx){
                    cell.onclick=function(){
                        var si=l9UserSelected.indexOf(idx);
                        if(si>=0){l9UserSelected.splice(si,1);this.style.background='#1a1a2e';this.style.boxShadow='none';}
                        else{l9UserSelected.push(idx);this.style.background='#0af';this.style.boxShadow='0 0 10px #0af';}
                    };
                })(i);
            }
            grid.appendChild(cell);
        }
    }
    document.getElementById('verify-l9-btn')?.addEventListener('click',function(){
        if(l9Phase!=='recall') return triggerError('l9-status','Zaczekaj na odliczanie!');
        var correct=l9Target.every(function(i){return l9UserSelected.includes(i);})&&l9UserSelected.length===l9Target.length;
        if(correct){
            l9Round++;
            if(l9Round>=L9_ROUNDS.length){ triggerSuccess('l9-status'); }
            else {
                var st=document.getElementById('l9-status');
                if(st){st.textContent='OK! Runda '+l9Round+' zaliczona! Nastepna...';st.style.color='#0f5';}
                setTimeout(function(){if(st)st.textContent='';l9StartRound();},1200);
            }
        } else { triggerError('l9-status','Blad! Od poczatku...',function(){initL9();}); }
    });

    // L10 Lokalizator Sygnałów (Triangulation)
    let l10TargetX=0, l10TargetY=0, l10Tries=0;
    const L10_MAX_TRIES = 6;
    window.initL10=function(){
        l10TargetX = Math.floor(Math.random()*5);
        l10TargetY = Math.floor(Math.random()*5);
        l10Tries = 0;
        let st=document.getElementById('l10-status'); if(st) {st.textContent='Zainicjowano radar. Wykryj sygnał badając kafelki!'; st.className='status-msg';}
        let ts=document.getElementById('l10-tries'); if(ts) ts.textContent = `0/${L10_MAX_TRIES}`;
        renderL10Grid();
    };
    function renderL10Grid(){
        const grid=document.getElementById('l10-grid'); if(!grid) return; grid.innerHTML='';
        for(let y=0; y<5; y++){
            for(let x=0; x<5; x++){
                const c=document.createElement('div');
                c.className = 'l10-cell';
                c.dataset.x = x; c.dataset.y = y;
                c.style.cssText=`aspect-ratio:1;border-radius:4px;cursor:pointer;background:rgba(0,170,255,0.1);border:1px solid #004466;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:1.4rem;font-weight:bold;color:#fff;transition:all 0.2s;`;
                c.onclick = function() { l10Click(this, x, y); };
                grid.appendChild(c);
            }
        }
    }
    function l10Click(el, x, y) {
        if(l10Tries >= L10_MAX_TRIES || el.classList.contains('revealed')) return;
        el.classList.add('revealed');
        l10Tries++;
        let ts=document.getElementById('l10-tries'); if(ts) ts.textContent = `${l10Tries}/${L10_MAX_TRIES}`;
        
        let dist = Math.abs(x - l10TargetX) + Math.abs(y - l10TargetY);
        
        if(dist === 0) {
            el.style.background = '#0f5'; el.style.borderColor = '#0f5'; el.style.color = '#000';
            el.innerHTML = '<span style="font-size:1.6rem;">🎯</span>';
            triggerSuccess('l10-status', 'ZŁAMANO BARIERĘ! LOKALIZACJA POTWIERDZONA!');
        } else {
            let intensity = Math.max(0, 255 - dist*40);
            el.style.background = `rgba(255,${intensity},0,0.25)`;
            el.style.borderColor = `rgba(255,${intensity},0,1)`;
            el.style.color = `rgba(255,${intensity},0,1)`;
            el.textContent = dist;
            
            if(l10Tries >= L10_MAX_TRIES) {
                triggerError('l10-status', 'Limit skanów wyczerpany! Odtwarzam losową siatkę...', ()=>initL10());
            }
        }
    }

});

