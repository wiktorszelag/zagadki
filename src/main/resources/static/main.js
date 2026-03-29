document.addEventListener('DOMContentLoaded', () => {
    // --- Global State ---
    let currentLevel = 0;
    let playerId = null;
    let lbInterval = null;

    // --- Utility Functions ---
    const showScreen = (id) => {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
            setTimeout(() => {
                if (!screen.classList.contains('active')) {
                    screen.classList.add('hidden');
                }
            }, 500); 
        });
        
        const target = document.getElementById(id);
        target.classList.remove('hidden');
        setTimeout(() => {
            target.classList.add('active');
            target.scrollTop = 0; // Fix scroll on mobile
        }, 50);
    };

    const advanceLevel = () => {
        if (playerId && currentLevel > 0 && currentLevel <= 11) {
            fetch(`/api/players/${playerId}/level/${currentLevel}`, { method: 'PUT' }).catch(e => console.log(e));
        }
        
        currentLevel++;
        if (currentLevel === 1) {
            initLevel1();
            showScreen('level-1');
        } else if (currentLevel > 1 && currentLevel <= 11) {
            // Level resets/inits if needed
            if (currentLevel === 3) initLevel3();
            if (currentLevel === 4) initLevel4();
            if (currentLevel === 6) initLevel6();
            if (currentLevel === 8) initLevel8();
            if (currentLevel === 9) initLevel9();
            if (currentLevel === 11) initLevel11();
            showScreen(`level-${currentLevel}`);
        } else if (currentLevel > 11) {
            showScreen('victory-screen');
            if (playerId) {
                fetch(`/api/players/${playerId}/finish`, { method: 'PUT' })
                  .then(r => r.json())
                  .then(data => {
                      document.getElementById('my-time-display').textContent = formatMs(data.totalTimeMs);
                      pollLeaderboard();
                  })
                  .catch(e => console.log(e));
            }
        }
    };

    const triggerSuccess = (statusElementId, nextDelay = 1500) => {
        if (!statusElementId) {
            advanceLevel();
            return;
        }
        const status = document.getElementById(statusElementId);
        if (status) {
            status.textContent = "ZABEZPIECZENIE ZŁAMANE";
            status.classList.remove('error');
            status.classList.add('success');
            
            setTimeout(() => {
                advanceLevel();
                setTimeout(() => {
                    status.classList.remove('success');
                    status.classList.add('error');
                }, 1000);
            }, nextDelay);
        } else {
            advanceLevel();
        }
    };

    const triggerError = (statusElementId, defaultText) => {
        const status = document.getElementById(statusElementId);
        if(!status) return;
        status.textContent = "BŁĘDNY KOD / UKŁAD";
        status.classList.add('error-shake');
        
        setTimeout(() => {
            status.textContent = defaultText;
            status.classList.remove('error-shake');
        }, 2000);
    };


    // --- Level 1: Lights Out ---
    let l1Grid = [ [0, 1, 0], [1, 0, 1], [0, 1, 0] ];
    const initLevel1 = () => {
        const container = document.getElementById('lights-out-grid');
        container.innerHTML = '';
        document.getElementById('l1-status').textContent = "System Zablokowany";
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const cell = document.createElement('div');
                cell.className = `grid-cell ${l1Grid[r][c] ? 'on' : ''}`;
                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.addEventListener('click', () => handleL1Click(r, c));
                container.appendChild(cell);
            }
        }
    };
    const handleL1Click = (r, c) => {
        const toggle = (row, col) => {
            if (row >= 0 && row < 3 && col >= 0 && col < 3) {
                l1Grid[row][col] = l1Grid[row][col] ? 0 : 1;
            }
        };
        toggle(r, c);
        toggle(r - 1, c);
        toggle(r + 1, c);
        toggle(r, c - 1);
        toggle(r, c + 1);
        
        const container = document.getElementById('lights-out-grid');
        let index = 0;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const cell = container.children[index];
                if (l1Grid[r][c]) cell.classList.add('on');
                else cell.classList.remove('on');
                index++;
            }
        }
        if (l1Grid.every(row => row.every(cell => cell === 1))) {
            triggerSuccess('l1-status');
        }
    };

    // --- Level 2: Deductive Code (835) ---
    document.querySelectorAll('.l2-digit').forEach((input, index, inputs) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length > 1) e.target.value = e.target.value.slice(-1);
            if (e.target.value !== '' && index < inputs.length - 1) inputs[index + 1].focus();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) inputs[index - 1].focus();
        });
    });

    document.getElementById('verify-l2-btn').addEventListener('click', () => {
        const inputs = document.querySelectorAll('.l2-digit');
        const code = Array.from(inputs).map(i => i.value).join('');
        if (code === '835') {
            triggerSuccess('l2-status');
        } else {
            triggerError('l2-status', 'Czekam na input...');
            inputs.forEach(i => {
                i.style.borderColor = 'var(--neon-red)';
                setTimeout(() => i.style.borderColor = '', 1000);
            });
        }
    });

    // --- Level 3: Power Sliders (A:50, B:25, C:50) ---
    const initLevel3 = () => {
        ['a', 'b', 'c'].forEach(id => {
            document.getElementById(`slider-${id}`).value = "0";
            document.getElementById(`val-${id}`).textContent = "0";
        });
        document.getElementById('l3-status').textContent = 'Asymetria energetyczna';
    };
    document.querySelectorAll('.power-slider').forEach(slider => {
        slider.addEventListener('input', (e) => {
            const valId = e.target.id.replace('slider', 'val');
            document.getElementById(valId).textContent = e.target.value;
        });
    });
    document.getElementById('verify-l3-btn').addEventListener('click', () => {
        const a = parseInt(document.getElementById('slider-a').value);
        const b = parseInt(document.getElementById('slider-b').value);
        const c = parseInt(document.getElementById('slider-c').value);
        if (a === 50 && b === 25 && c === 50) {
            triggerSuccess('l3-status');
        } else {
            triggerError('l3-status', 'Błędny przydział energii');
            document.querySelectorAll('.power-slider').forEach(s => {
                s.style.boxShadow = '0 0 10px var(--neon-red)';
                setTimeout(() => s.style.boxShadow = '', 1000);
            });
        }
    });

    // --- Level 4: Color Registers (A:blue, B:green, C:red, D:yellow) ---
    const colors = ['grey', 'blue', 'green', 'red', 'yellow'];
    const initLevel4 = () => {
        document.querySelectorAll('.color-node').forEach(node => {
            node.dataset.color = 'grey';
        });
        document.getElementById('l4-status').textContent = 'Błąd widma światła';
    };
    document.querySelectorAll('.color-node').forEach(node => {
        node.addEventListener('click', (e) => {
            const currentColor = e.target.dataset.color;
            let nextIndex = (colors.indexOf(currentColor) + 1) % colors.length;
            if(nextIndex === 0) nextIndex = 1; // Skip grey after 1st click
            e.target.dataset.color = colors[nextIndex];
        });
    });
    document.getElementById('verify-l4-btn').addEventListener('click', () => {
        const nodes = document.querySelectorAll('.color-node');
        const c1 = nodes[0].dataset.color;
        const c2 = nodes[1].dataset.color;
        const c3 = nodes[2].dataset.color;
        const c4 = nodes[3].dataset.color;
        
        if (c1 === 'blue' && c2 === 'green' && c3 === 'red' && c4 === 'yellow') {
            triggerSuccess('l4-status');
        } else {
            triggerError('l4-status', 'Niekompatybilne filtry');
        }
    });

    // --- Level 5: Mathematical Lock v2 (419) ---
    document.querySelectorAll('.l5-digit').forEach((input, index, inputs) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length > 1) e.target.value = e.target.value.slice(-1);
            if (e.target.value !== '' && index < inputs.length - 1) inputs[index + 1].focus();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) inputs[index - 1].focus();
        });
    });
    document.getElementById('verify-l5-btn').addEventListener('click', () => {
        const inputs = document.querySelectorAll('.l5-digit');
        const code = Array.from(inputs).map(i => i.value).join('');
        if (code === '419') {
            triggerSuccess('l5-status');
        } else {
            triggerError('l5-status', 'Trwa nasłuch na portach...');
            inputs.forEach(i => {
                i.style.borderColor = 'var(--neon-red)';
                setTimeout(() => i.style.borderColor = '', 1000);
            });
        }
    });

    // --- Level 6: Cable Defusal (C -> A -> B -> D) ---
    const l6TargetSeq = ['C', 'A', 'B', 'D'];
    let l6CurrentSeq = [];
    
    const initLevel6 = () => {
        l6CurrentSeq = [];
        document.querySelectorAll('.cable-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('l6-status').textContent = 'Gotowość do przecięcia';
    };

    const handleL6Click = (e) => {
        if (e.target.classList.contains('active')) return;
        const cable = e.target.dataset.cable;
        e.target.classList.add('active');
        l6CurrentSeq.push(cable);

        const checkFail = () => {
            triggerError('l6-status', 'BŁĄD ZASILANIA ZWARCIE!');
            document.querySelectorAll('.cable-btn').forEach(b => b.style.borderColor = 'red');
            setTimeout(() => {
                document.querySelectorAll('.cable-btn').forEach(b => b.style.borderColor = '');
                initLevel6();
            }, 1500);
        };

        const idx = l6CurrentSeq.length - 1;
        if (l6CurrentSeq[idx] !== l6TargetSeq[idx]) {
            checkFail();
            return;
        }

        if (l6CurrentSeq.length === 4) {
            triggerSuccess('l6-status', 1000);
        }
    };
    document.querySelectorAll('.cable-btn').forEach(btn => btn.addEventListener('click', handleL6Click));

    // --- Level 7: Radar Coordinates (X:7, Y:3) ---
    document.getElementById('verify-l7-btn').addEventListener('click', () => {
        const x = parseInt(document.getElementById('coord-x').value);
        const y = parseInt(document.getElementById('coord-y').value);
        if (x === 7 && y === 3) {
            triggerSuccess('l7-status');
        } else {
            triggerError('l7-status', 'Współrzędne namierzania nieudane');
        }
    });

    // --- Level 8: Fingerprint Hold (3.0s, +/- 0.5s tolerance) ---
    let l8Timer = null;
    let l8StartTime = 0;
    const l8Btn = document.getElementById('l8-fingerprint');
    
    const initLevel8 = () => {
        l8Btn.classList.remove('holding');
        document.getElementById('l8-status').textContent = 'Skaner oczekuje...';
    };

    const startHold = (e) => {
        e.preventDefault(); // Prevent text selection/scrolling
        l8Btn.classList.add('holding');
        l8StartTime = Date.now();
        document.getElementById('l8-status').textContent = 'Skanowanie... Nie puszczaj.';
    };

    const endHold = (e) => {
        e.preventDefault();
        l8Btn.classList.remove('holding');
        if (l8StartTime === 0) return;
        
        const diff = Date.now() - l8StartTime;
        l8StartTime = 0;
        
        // 3 seconds target (3000ms), tolerance: 2500 - 3500ms
        if (diff >= 2500 && diff <= 3500) {
            triggerSuccess('l8-status');
        } else {
            let msg = diff < 2500 ? 'Zbyt krótko. ' : 'Zbyt długo. ';
            msg += `Zmierzono ${(diff/1000).toFixed(2)}s`;
            triggerError('l8-status', 'Błąd: ' + msg);
            setTimeout(() => {
                if(document.getElementById('l8-status') && document.getElementById('l8-status').classList.contains('error')) {
                    document.getElementById('l8-status').textContent = 'Skaner oczekuje...';
                }
            }, 2000);
        }
    };

    l8Btn.addEventListener('mousedown', startHold);
    window.addEventListener('mouseup', endHold);
    l8Btn.addEventListener('touchstart', startHold, {passive: false});
    window.addEventListener('touchend', endHold, {passive: false});

    // --- Level 9: Logic Gates (F1: |, F2: |, F3: -, F4: -) ---
    // states: "none", "0" (|), "1" (-)
    const initLevel9 = () => {
        document.querySelectorAll('.gate-btn').forEach(btn => {
            btn.dataset.state = 'none';
            btn.textContent = 'F' + btn.textContent.slice(-1); // Reset label
        });
        document.getElementById('l9-status').textContent = 'Trwa pomiar załamania';
    };
    document.querySelectorAll('.gate-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let s = e.target.dataset.state;
            if (s === 'none') s = '0';
            else if (s === '0') s = '1';
            else s = '0'; // Toggle between 0 and 1 after first click
            e.target.dataset.state = s;
            e.target.textContent = s === '0' ? '|' : '—';
        });
    });
    document.getElementById('verify-l9-btn').addEventListener('click', () => {
        const gates = Array.from(document.querySelectorAll('.gate-btn')).map(b => b.dataset.state);
        if (gates[0] === '0' && gates[1] === '0' && gates[2] === '1' && gates[3] === '1') {
            triggerSuccess('l9-status');
        } else {
            triggerError('l9-status', 'Promień został rozproszony!');
        }
    });

    // --- Level 10: Final Text Riddle ("JUTRO") ---
    document.getElementById('verify-l10-btn').addEventListener('click', () => {
        const input = document.getElementById('l10-answer').value.trim().toUpperCase();
        if (input === 'JUTRO') {
            triggerSuccess('l10-status');
        } else {
            triggerError('l10-status', 'Odrzucono.');
            const el = document.getElementById('l10-answer');
            el.style.borderColor = 'var(--neon-red)';
            setTimeout(() => el.style.borderColor = '', 1000);
        }
    });


    // --- Level 11: Cognitive Reactor ---
    const l11Sequences = [
        { text: "KLIKNIJ 3 RAZY!", color: "var(--neon-green)", sub: "", target: 3, time: 2500 },
        { text: "KLIKNIJ 2 RAZY!", color: "yellow", sub: "", target: 0, time: 2000 },
        { text: "ZABRANIA SIĘ KLIKANIA!", color: "var(--neon-green)", sub: "MODYFIKUJ NASTĘPNĄ RUNDĘ (ODWRÓĆ)", target: 0, time: 2000 },
        { text: "ZAMROŻENIE! NIE KLIKAJ!", color: "var(--neon-green)", sub: "", target: 1, time: 2000 },
        { text: "ABSOLUTNIE NIE KLIKAJ!", color: "yellow", sub: "MODYFIKUJ NASTĘPNĄ RUNDĘ (ODWRÓĆ)", target: 1, time: 2500 },
        { text: "KLIKNIJ 2 RAZY!", color: "yellow", sub: "", target: 2, time: 2500 },
        { text: "SZYBKO! KLIKNIJ 5 RAZY!", color: "var(--neon-green)", sub: "", target: 5, time: 3000 }
    ];
    let l11Round = 0;
    let l11Clicks = 0;
    let l11Timer = null;
    let l11Interval = null;
    let l11Active = false;

    const initLevel11 = () => {
        l11Round = 0;
        l11Clicks = 0;
        l11Active = false;
        clearTimeout(l11Timer);
        clearInterval(l11Interval);
        document.getElementById('l11-instruction').textContent = "GOTOWY?";
        document.getElementById('l11-instruction').style.color = "var(--neon-cyan)";
        document.getElementById('l11-sub').textContent = "";
        document.getElementById('l11-round').textContent = "0/7";
        document.getElementById('l11-timer-bar').style.width = "100%";
        document.getElementById('l11-action-btn').classList.add('disabled');
        document.getElementById('start-l11-btn').style.display = "block";
        document.getElementById('start-l11-btn').textContent = "INICJUJ ZAPŁON";
        document.getElementById('l11-status').textContent = "Reaktor uśpiony";
    };

    document.getElementById('start-l11-btn').addEventListener('click', () => {
        document.getElementById('start-l11-btn').style.display = "none";
        document.getElementById('l11-status').textContent = "Rozgrzewanie...";
        setTimeout(startL11Round, 1000);
    });

    const triggerL11Fail = () => {
        l11Active = false;
        clearTimeout(l11Timer);
        clearInterval(l11Interval);
        document.getElementById('l11-action-btn').classList.add('disabled');
        document.getElementById('l11-instruction').textContent = "PORAŻKA!";
        document.getElementById('l11-instruction').style.color = "var(--neon-red)";
        document.getElementById('l11-sub').textContent = "";
        triggerError('l11-status', 'Błąd sekwencji. Reset.');
        setTimeout(() => {
            initLevel11();
        }, 2000);
    };

    const runL11Timer = (duration) => {
        const bar = document.getElementById('l11-timer-bar');
        const start = Date.now();
        clearInterval(l11Interval);
        l11Interval = setInterval(() => {
            const passed = Date.now() - start;
            let percent = 100 - (passed / duration * 100);
            if (percent < 0) percent = 0;
            bar.style.width = percent + "%";
            if (percent === 0) clearInterval(l11Interval);
        }, 30);
    };

    const startL11Round = () => {
        if (l11Round >= l11Sequences.length) {
            triggerSuccess('l11-status');
            return;
        }

        const seq = l11Sequences[l11Round];
        l11Clicks = 0;
        l11Active = true;
        
        document.getElementById('l11-instruction').textContent = seq.text;
        document.getElementById('l11-instruction').style.color = seq.color;
        document.getElementById('l11-sub').textContent = seq.sub;
        document.getElementById('l11-round').textContent = `${l11Round + 1}/7`;
        document.getElementById('l11-action-btn').classList.remove('disabled');
        document.getElementById('l11-status').textContent = "Rejestruję sygnały...";

        runL11Timer(seq.time);

        l11Timer = setTimeout(() => {
            l11Active = false;
            document.getElementById('l11-action-btn').classList.add('disabled');
            
            if (l11Clicks === seq.target) {
                // Success round
                document.getElementById('l11-status').textContent = "Poprawnie!";
                document.getElementById('l11-instruction').textContent = "DOBRZE!";
                document.getElementById('l11-instruction').style.color = "var(--neon-cyan)";
                document.getElementById('l11-sub').textContent = "";
                l11Round++;
                setTimeout(startL11Round, 1000);
            } else {
                // Fail
                triggerL11Fail();
            }
        }, seq.time);
    };

    document.getElementById('l11-action-btn').addEventListener('click', () => {
        if (!l11Active) return;
        l11Clicks++;
        
        const seq = l11Sequences[l11Round];
        if (l11Clicks > seq.target) {
            triggerL11Fail();
        }
    });

    // --- API Calls & Leaderboard ---
    function formatMs(ms) {
        if (!ms) return "--:--";
        let s = Math.floor(ms / 1000);
        let m = Math.floor(s / 60);
        s = s % 60;
        return `${m}m ${s < 10 ? '0' : ''}${s}s`;
    }

    function pollLeaderboard() {
        const fetchLb = () => {
            fetch('/api/players/leaderboard')
                .then(r => r.json())
                .then(lb => {
                    const tbody = document.getElementById('leaderboard-tbody');
                    tbody.innerHTML = '';
                    lb.forEach((p, index) => {
                        const tr = document.createElement('tr');
                        tr.className = 'table-row-anim';
                        tr.style.animationDelay = (index * 0.1) + 's';
                        
                        // Oznacz mój własny wynik
                        if (p.id === playerId) {
                            tr.style.background = 'rgba(0, 255, 255, 0.2)';
                            tr.style.fontWeight = 'bold';
                            document.getElementById('my-rank-display').textContent = `#${index + 1}`;
                        }
                        
                        tr.innerHTML = `
                            <td>${index + 1}</td>
                            <td style="word-break: break-all;">${p.nickname}</td>
                            <td style="text-align: right; color: var(--neon-cyan);">${formatMs(p.totalTimeMs)}</td>
                        `;
                        tbody.appendChild(tr);
                    });
                }).catch(e => console.error(e));
        };
        fetchLb();
        clearInterval(lbInterval);
        lbInterval = setInterval(fetchLb, 3000);
    }

    // --- Init App ---
    document.getElementById('start-btn').addEventListener('click', async () => {
        const nickInput = document.getElementById('player-nick');
        const btn = document.getElementById('start-btn');
        const nick = nickInput.value.trim();
        
        if (!nick) {
            nickInput.style.borderColor = 'var(--neon-red)';
            setTimeout(() => nickInput.style.borderColor = '', 1000);
            return;
        }

        btn.textContent = "ŁĄCZENIE Z BAZĄ...";
        btn.classList.add('disabled');

        try {
            const res = await fetch('/api/players', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: nick })
            });
            const data = await res.json();
            playerId = data.id;
            advanceLevel();
        } catch (error) {
            alert('Błąd połączenia z serwerem. Upewnij się, że backend Spring Boot oraz baza PostgreSQL działa.');
            btn.textContent = "SPRÓBUJ PONOWNIE";
            btn.classList.remove('disabled');
        }
    });

});
