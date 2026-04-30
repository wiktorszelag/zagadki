// ==========================================================
// SESSION MANAGEMENT (Real Backend Authentication tied to LocalStorage)
// ==========================================================

const DB_SESSION_KEY = 'enigma_mock_session';

function getSession() {
    try {
        return JSON.parse(localStorage.getItem(DB_SESSION_KEY));
    } catch(e) {
        return null;
    }
}
function saveSession(user) {
    try {
        if(user) localStorage.setItem(DB_SESSION_KEY, JSON.stringify(user));
        else localStorage.removeItem(DB_SESSION_KEY);
    } catch(e) {}
}

function formatMsLocal(ms) {
    let sc = Math.floor(ms / 1000);
    let m = Math.floor(sc / 60);
    let s = sc % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

// ==========================================================
// PARTICLES BACKGROUND (Constellation)
// ==========================================================
function initParticles() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height, particles = [];
    let mouse = { x: null, y: null };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });
    window.addEventListener('mouseout', () => {
        mouse.x = null; mouse.y = null;
    });

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = (Math.random() - 0.5) * 1.5;
            this.size = Math.random() * 2 + 0.5;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }
        draw() {
            ctx.fillStyle = 'rgba(0, 245, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < 90; i++) particles.push(new Particle());

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        for (let i = 0; i < particles.length; i++) {
            // Draw lines between particles
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 130) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(0, 245, 255, ${(1 - dist/130) * 0.4})`;
                    ctx.lineWidth = 0.8;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
            // Draw lines from mouse to particles
            if (mouse.x != null) {
                const mx = particles[i].x - mouse.x;
                const my = particles[i].y - mouse.y;
                const mdist = Math.sqrt(mx * mx + my * my);
                if (mdist < 180) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255, 0, 255, ${(1 - mdist/180) * 0.6})`;
                    ctx.lineWidth = 1.2;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}

function init3DTilt() {
    const wrap = document.querySelector('.box-shadow-wrap');
    if (!wrap) return;
    
    // Tylko dla ekranów większych niż telefony (żeby nie psuć dotyku)
    if (window.innerWidth <= 600) return;

    window.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        const offsetX = (x - centerX) / centerX; // -1 do 1
        const offsetY = (y - centerY) / centerY; // -1 do 1
        
        const maxRotation = 8; // maksymalnie 8 stopni
        const rotX = -offsetY * maxRotation;
        const rotY = offsetX * maxRotation;
        
        wrap.style.setProperty('--rotate-x', `${rotX}deg`);
        wrap.style.setProperty('--rotate-y', `${rotY}deg`);
    });
    
    window.addEventListener('mouseout', () => {
        wrap.style.setProperty('--rotate-x', `0deg`);
        wrap.style.setProperty('--rotate-y', `0deg`);
    });
}

// ==========================================================
// UI LOGIC
// ==========================================================
function initApp() {
    initPrologue(() => {
        // Callback after prologue finishes or is skipped
        document.getElementById('hub-container').style.display = 'flex';
        initParticles();
        init3DTilt();
        initTabs();
        initForms();
        checkSession();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function initPrologue(onComplete) {
    const overlay = document.getElementById('prologue-overlay');
    const textEl = document.getElementById('prologue-text');
    const skipBtn = document.getElementById('skip-prologue-btn');
    
    // Check if seen (with try-catch for strict incognito modes)
    let seen = false;
    try {
        seen = localStorage.getItem('ep_prologue_seen') === '1';
    } catch(e) {}

    if (seen) {
        overlay.style.display = 'none';
        onComplete();
        return;
    }

    const lines = [
        "[ NAWIĄZYWANIE BEZPIECZNEGO POŁĄCZENIA... ]",
        "<span class='warn'>UWAGA: Transmisja szyfrowana. Poziom autoryzacji: OMEGA.</span>",
        "",
        "Witaj w systemie ENIGMA PROTOCOL.",
        "Jesteś tutaj, ponieważ zostałeś wyselekcjonowany spośród tysięcy kandydatów.",
        "Kilka miesięcy temu tajne serwery z najważniejszymi danymi zostały zamknięte.",
        "Zabezpieczono je serią zaawansowanych, kognitywnych testów logicznych.",
        "Nasza organizacja potrzebuje kogoś, kto potrafi myśleć nieszablonowo.",
        "Kogoś, kto potrafi złamać kody, zapamiętać ułożenie błyskawicznych sygnałów",
        "i manipulować systemami zapadniowymi pod presją.",
        "",
        "Przed Tobą dwa pakiety testowe:",
        "- <b style='color:#fff'>PROTOKÓŁ V1</b> (Logika, wiedza i klasyczna dedukcja)",
        "- <b style='color:#fff'>PROTOKÓŁ V2</b> (Pamięć operacyjna, refleks i łamanie wzorców)",
        "",
        "<span class='err'>Pamiętaj: Każdy twój ruch, każda sekunda jest mierzona.</span>",
        "Najlepsze czasy trafiają do globalnego rankingu Operatorów.",
        "Tylko najlepsi przejdą weryfikację i otrzymają dostęp do głównego rdzenia.",
        "",
        "Utwórz swój alias i zaloguj się do systemu, by rozpocząć.",
        "Powodzenia, Agencie."
    ];

    let lineIdx = 0;
    let isSkipped = false;

    const finishPrologue = () => {
        if (isSkipped) return;
        isSkipped = true;
        try { localStorage.setItem('ep_prologue_seen', '1'); } catch(e) {}
        overlay.classList.add('fade-out');
        setTimeout(() => {
            overlay.style.display = 'none';
            onComplete();
        }, 1000); // Wait for fade out
    };

    skipBtn.classList.remove('hidden');
    skipBtn.addEventListener('click', finishPrologue);

    const typeLine = () => {
        if (isSkipped) return;
        if (lineIdx >= lines.length) {
            setTimeout(finishPrologue, 3000); // Give user time to read the last line
            return;
        }

        const line = lines[lineIdx];
        
        // Calculate delay based on line length so user has time to read
        let delay = line.length === 0 ? 400 : (line.length * 40 + 500);
        if (line.includes('NAWIĄZYWANIE')) delay = 1500;
        
        const div = document.createElement('div');
        // Add typing effect via CSS or just append
        div.innerHTML = line;
        div.style.opacity = '0';
        div.style.transition = 'opacity 0.4s ease';
        textEl.appendChild(div);
        
        // Trigger reflow
        void div.offsetWidth;
        div.style.opacity = '1';
        
        lineIdx++;
        setTimeout(typeLine, delay);
    };

    setTimeout(typeLine, 500);
}


function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('visible'));
    document.getElementById(viewId).classList.add('visible');
}

function initTabs() {
    const tLog = document.getElementById('tab-login');
    const tReg = document.getElementById('tab-register');
    const fLog = document.getElementById('login-form');
    const fReg = document.getElementById('register-form');
    const mLog = document.getElementById('log-msg');
    const mReg = document.getElementById('reg-msg');

    tLog.addEventListener('click', () => {
        tReg.classList.remove('active'); tLog.classList.add('active');
        fReg.classList.remove('visible'); fLog.classList.add('visible');
        mLog.textContent = ''; mReg.textContent = '';
    });
    tReg.addEventListener('click', () => {
        tLog.classList.remove('active'); tReg.classList.add('active');
        fLog.classList.remove('visible'); fReg.classList.add('visible');
        mLog.textContent = ''; mReg.textContent = '';
    });
}

function initForms() {
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');

    // REAL REGISTRATION
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nick = document.getElementById('reg-nick').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const pass = document.getElementById('reg-pass').value;
        const pass2 = document.getElementById('reg-pass2').value;
        const msg = document.getElementById('reg-msg');
        
        if (pass !== pass2) {
            msg.className = 'msg-box msg-err';
            msg.textContent = 'Hasła nie są identyczne!';
            return;
        }

        const passRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,20}$/;
        if (!passRegex.test(pass)) {
            msg.className = 'msg-box msg-err';
            msg.textContent = 'Hasło nie spełnia wymagań bezpieczeństwa.';
            return;
        }
        
        try {
            msg.className = 'msg-box';
            msg.style.color = '#fff';
            msg.textContent = 'Autoryzacja systemu. Proszę czekać...';

            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: nick, email: email, password: pass })
            });
            const data = await res.json();
            
            if (data.success) {
                msg.className = 'msg-box msg-suc';
                msg.textContent = 'Zarejestrowano! Na Twój e-mail wysłaliśmy link aktywacyjny. (Sprawdź też SPAM)';
                regForm.reset();
                setTimeout(() => document.getElementById('tab-login').click(), 2500);
            } else {
                msg.className = 'msg-box msg-err';
                msg.textContent = 'Błąd: ' + data.message;
            }
        } catch (err) {
            msg.className = 'msg-box msg-err';
            msg.textContent = 'Błąd serwera. Spróbuj ponownie później.';
        }
    });

    // REAL LOGIN
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('log-email').value.trim(); // This is the username input
        const pass = document.getElementById('log-pass').value;
        const msg = document.getElementById('log-msg');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password: pass })
            });
            const data = await res.json();
            
            if (data.success) {
                msg.className = 'msg-box msg-suc';
                msg.textContent = 'Autoryzacja przyznana...';
                saveSession({ 
                    nick: data.username, 
                    role: data.role,
                    v1Level: data.v1Level,
                    v2Level: data.v2Level,
                    v1TimeMs: data.v1TimeMs,
                    v2TimeMs: data.v2TimeMs,
                    v1Completed: data.v1Completed,
                    v2Completed: data.v2Completed
                });
                setTimeout(() => {
                    loginForm.reset();
                    showDashboard();
                }, 800);
            } else {
                msg.className = 'msg-box msg-err';
                msg.textContent = 'Brak autoryzacji: ' + data.message;
            }
        } catch (err) {
            msg.className = 'msg-box msg-err';
            msg.textContent = 'Błąd serwera. Spróbuj ponownie później.';
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        saveSession(null);
        switchView('auth-view');
    });
}

function checkSession() {
    const session = getSession();
    if(session && session.nick) {
        showDashboard();
    } else {
        switchView('auth-view');
    }
}

function showDashboard() {
    const session = getSession();
    if(!session) return;
    document.getElementById('user-display').textContent = session.nick;

    // Reset badge states before reading (handles re-login / logout)
    ['v1','v2'].forEach(v => {
        const badge = document.getElementById(`badge-${v}-done`);
        const bestBox = document.getElementById(`card-${v}-best`);
        if (badge) badge.classList.add('hidden');
        if (bestBox) bestBox.style.display = 'none';
        const statEl = document.getElementById(`stat-${v}-best`);
        if (statEl) statEl.textContent = '--:--';
    });
    const missionsEl = document.getElementById('stat-missions');
    if (missionsEl) missionsEl.textContent = '0';

    const user = null; // No local saves for user progress on public version
    const MAX_LEVELS = 10;
    let totalMissions = 0;

    ['v1', 'v2'].forEach(v => {
        const badge = document.getElementById(`badge-${v}-done`);
        const statEl = document.getElementById(`stat-${v}-best`);
        const cardBestBox = document.getElementById(`card-${v}-best`);
        const cardBestTime = document.getElementById(`card-${v}-best-time`);

        let lvl = session[`${v}Level`] || 1;
        let ms = session[`${v}TimeMs`] || 0;
        let comp = session[`${v}Completed`] || false;

        if (badge) {
            badge.classList.remove('hidden');
            if (comp) {
                badge.innerHTML = `&#10003; UKOŃCZONY`;
                badge.className = 'card-status status-active';
                if (cardBestBox && ms > 0) {
                    cardBestBox.style.display = 'block';
                    cardBestTime.textContent = formatMsLocal(ms);
                    if (statEl) statEl.textContent = formatMsLocal(ms);
                }
            } else {
                badge.innerHTML = `⏳ POSTĘP: ${lvl > MAX_LEVELS ? MAX_LEVELS : lvl - 1} / ${MAX_LEVELS}`;
                badge.className = 'card-status status-active';
            }
        }
        if (lvl > 1) totalMissions += (lvl > MAX_LEVELS ? MAX_LEVELS : lvl - 1);
    });

    if (missionsEl) missionsEl.textContent = totalMissions;

    switchView('dashboard-view');
    initLeaderboard(); // re-render leaderboard on each login (fresh data)
}


function initLeaderboard() {
    const sel = document.getElementById('leaderboard-lb-select');
    if (sel) {
        // Remove previous listener if any (prevent duplicates on re-login)
        sel.replaceWith(sel.cloneNode(true));
        const freshSel = document.getElementById('leaderboard-lb-select');
        if (freshSel) freshSel.addEventListener('change', renderLeaderboard);
    }
    renderLeaderboard();
}


async function renderLeaderboard() {
    let proto = 'v1';
    const sel = document.getElementById('leaderboard-lb-select');
    if (sel) proto = sel.value;

    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Ładowanie...</td></tr>';
    
    try {
        const res = await fetch(`/api/auth/leaderboard/${proto}`);
        let entries = await res.json();
        
        tbody.innerHTML = '';
        
        if(entries.length < 1) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-low);">Brak danych. Bądź pierwszym agentem!</td></tr>';
            return;
        }

        entries.forEach((e, i) => {
            const tr = document.createElement('tr');
            if (i < 3) tr.className = `rank-${i + 1}`;
            tr.innerHTML = `<td>${i + 1}</td><td>${e.nick}</td><td style="font-family:var(--font-mono);">${formatMsLocal(e.timeMs)}</td>`;
            tbody.appendChild(tr);
        });
    } catch(e) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#ff2a2a;">Błąd połączenia z serwerem.</td></tr>';
    }
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function logout() {
    try { localStorage.removeItem('enigma_mock_session'); } catch(e) {}
    checkSession();
}

async function sendResetLink() {
    const email = document.getElementById('reset-email').value.trim();
    const msg = document.getElementById('reset-msg');
    if (!email) {
        msg.style.color = '#ff2a2a';
        msg.textContent = 'Podaj adres e-mail.';
        return;
    }

    try {
        msg.style.color = '#fff';
        msg.textContent = 'Przetwarzanie żądania...';

        const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        const data = await res.json();
        
        msg.style.color = data.success ? '#39ff14' : '#ff2a2a';
        msg.textContent = data.message;
    } catch (e) {
        msg.style.color = '#ff2a2a';
        msg.textContent = 'Błąd połączenia z serwerem.';
    }
}
