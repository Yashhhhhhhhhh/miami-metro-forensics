// --- 1. Master Audio Engine ---
class AudioCore {
    constructor() { this.ctx = null; this.unlocked = false; }
    init() { 
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)(); 
            this.unlocked = true;
        }
        if(this.ctx.state === 'suspended') this.ctx.resume();
    }
    play(freq, type, duration, vol) {
        if (!this.unlocked) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    }
    click() { this.play(800, 'square', 0.05, 0.02); }
    success() { this.play(880, 'sine', 0.1, 0.05); setTimeout(() => this.play(1318.51, 'sine', 0.2, 0.05), 100); }
    error() { this.play(150, 'sawtooth', 0.3, 0.05); }
    powerup() { this.play(440, 'triangle', 0.5, 0.05); setTimeout(() => this.play(880, 'sine', 0.5, 0.05), 100); }
    freeze() { this.play(1200, 'sine', 0.8, 0.03); }
}
const sfx = new AudioCore();
document.body.addEventListener('pointerdown', () => sfx.init(), { once: true });

// --- 2. Constellation Graphics Engine ---
function initGraphicsEngine() {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; });

    class Particle {
        constructor() {
            this.x = Math.random() * w; this.y = Math.random() * h;
            this.vx = (Math.random() - 0.5) * 0.8; this.vy = (Math.random() - 0.5) * 0.8;
            this.size = Math.random() * 1.5; 
            this.color = Math.random() > 0.8 ? '#ff003c' : '#00f0ff';
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            if(this.x < 0 || this.x > w) this.vx *= -1;
            if(this.y < 0 || this.y > h) this.vy *= -1;
        }
        draw() {
            ctx.fillStyle = this.color; ctx.globalAlpha = 0.5;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        }
    }
    const particles = Array.from({length: 80}, () => new Particle());
    
    function animate() {
        ctx.fillStyle = 'rgba(2, 2, 4, 1)';
        ctx.fillRect(0, 0, w, h);
        
        for(let i=0; i<particles.length; i++) {
            particles[i].update(); particles[i].draw();
            for(let j=i+1; j<particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if(dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = particles[i].color;
                    ctx.globalAlpha = 1 - (dist/120);
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}

// --- 3. UI & Progression System ---
const UI = {
    toast(msg, type = 'info') {
        const sys = document.getElementById('toastSystem');
        const t = document.createElement('div');
        t.className = `toast ${type}`; t.textContent = msg;
        sys.appendChild(t);
        if(type === 'error') sfx.error(); else if (type === 'success') sfx.success(); else sfx.click();
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
    },
    switchScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
    },
    visualFeedback(targetId, type) {
        const el = document.getElementById(targetId);
        el.classList.remove('shake-error', 'glow-success');
        void el.offsetWidth; // trigger reflow
        el.classList.add(type === 'error' ? 'shake-error' : 'glow-success');
    }
};

const Profile = {
    data: { level: 1, exp: 0, wins: 0, name: '' },
    init() {
        const saved = localStorage.getItem('aetherV3');
        if(saved) this.data = JSON.parse(saved);
        this.updateDOM();
    },
    addExp(amount) {
        this.data.exp += amount;
        const required = this.data.level * 150;
        if(this.data.exp >= required) {
            this.data.level++; this.data.exp -= required;
            UI.toast(`LEVEL UP! REACHED LEVEL ${this.data.level}`, 'success'); sfx.powerup();
        }
        this.save();
    },
    deductExp(amount) {
        if(this.data.exp >= amount) { this.data.exp -= amount; this.save(); return true; }
        UI.toast('INSUFFICIENT EXP FOR PROTOCOL', 'error'); return false;
    },
    save() { localStorage.setItem('aetherV3', JSON.stringify(this.data)); this.updateDOM(); },
    updateDOM() {
        document.getElementById('dispLvl').textContent = this.data.level;
        document.getElementById('dispExp').textContent = `${this.data.exp}/${this.data.level * 150}`;
        document.getElementById('dispWins').textContent = this.data.wins;
        if(this.data.name && !document.getElementById('playerName').value) document.getElementById('playerName').value = this.data.name;
    }
};

// --- 4. The Dictionary ---
const DICT = [
    "QUANTUM", "NEBULA", "CYBERNETIC", "PARADOX", "SYNTHESIS", "AETHER", "ECLIPSE", "GRAVITY", "SINGULARITY", "VOID", 
    "FRACTAL", "CHRONOS", "NEXUS", "HORIZON", "PULSAR", "QUASAR", "SPECTRE", "PHANTOM", "MATRIX", "CORTEX", "APEX", 
    "VORTEX", "ZENITH", "ENIGMA", "OBLIVION", "ETHEREAL", "NEURAL", "KINETIC", "DYNAMIC", "STATIC", "ISOTOPE", "PLASMA", 
    "FUSION", "FISSION", "COSMOS", "GALAXY", "STELLAR", "ASTRAL", "CELESTIAL", "ORBITAL", "METEOR", "COMET", "ASTEROID", 
    "INFINITY", "ETERNITY", "DESTINY", "FATE", "DIMENSION", "REALM", "PORTAL"
];

// --- 5. Game Server Logic (Host Authority) ---
const GameServer = {
    state: { active: false, secretWord: '', scramble: '', time: 60, isFrozen: false, p1Score: 0, p2Score: 0, timerId: null },
    
    startRound() {
        this.state.secretWord = DICT[Math.floor(Math.random() * DICT.length)];
        this.state.scramble = this.state.secretWord.split('').sort(() => 0.5 - Math.random()).join('');
        Network.send({ type: 'SYNC', payload: { action: 'NEW_ROUND', scramble: this.state.scramble } });
    },
    
    startMatch() {
        this.state.active = true; this.state.p1Score = 0; this.state.p2Score = 0; this.state.time = 60;
        Network.send({ type: 'SYNC', payload: { action: 'MATCH_START' } });
        this.startRound();
        
        clearInterval(this.state.timerId);
        this.state.timerId = setInterval(() => {
            if(!this.state.isFrozen) {
                this.state.time--;
                Network.send({ type: 'SYNC', payload: { action: 'TICK', time: this.state.time } });
                if(this.state.time <= 0) this.endMatch();
            }
        }, 1000);
    },

    endMatch() {
        clearInterval(this.state.timerId); this.state.active = false;
        let winner = 'DRAW';
        if(this.state.p1Score > this.state.p2Score) winner = 'P1';
        if(this.state.p2Score > this.state.p1Score) winner = 'P2';
        Network.send({ type: 'SYNC', payload: { action: 'MATCH_END', winner, p1: this.state.p1Score, p2: this.state.p2Score } });
    },

    evaluateGuess(guess, player) {
        if(!this.state.active) return;
        if(guess === this.state.secretWord) {
            if(player === 'P1') this.state.p1Score += 100; else this.state.p2Score += 100;
            Network.send({ type: 'SYNC', payload: { action: 'SCORE_UPDATE', p1: this.state.p1Score, p2: this.state.p2Score, solver: player } });
            this.startRound();
        } else {
            Network.sendTo(player, { type: 'SYNC', payload: { action: 'GUESS_REJECTED' } });
        }
    },

    triggerPowerup(type, player) {
        if(type === 'FREEZE') {
            this.state.isFrozen = true;
            Network.send({ type: 'SYNC', payload: { action: 'FREEZE_STATE', state: true } });
            setTimeout(() => {
                this.state.isFrozen = false;
                Network.send({ type: 'SYNC', payload: { action: 'FREEZE_STATE', state: false } });
            }, 3000);
        }
        if(type === 'HINT') {
            // Give them the first 2 letters
            const hint = this.state.secretWord.substring(0, 2) + "...";
            Network.sendTo(player, { type: 'SYNC', payload: { action: 'HINT_DELIVERED', text: hint } });
        }
    }
};

// --- 6. Client Logic (Network & View) ---
const Network = {
    peer: null, conn: null, isHost: false,
    init() {
        document.getElementById('btnHost').addEventListener('click', () => { sfx.click(); this.hostRoom(); });
        document.getElementById('btnJoin').addEventListener('click', () => { sfx.click(); this.joinRoom(); });
        document.getElementById('btnSubmitWord').addEventListener('click', () => this.submitGuess());
        document.getElementById('wordInput').addEventListener('keypress', (e) => { if(e.key === 'Enter') this.submitGuess(); });
        
        // Powerups
        document.getElementById('btnPowerFreeze').addEventListener('click', () => {
            sfx.click(); if(Profile.deductExp(50)) this.send({ type: 'POWERUP', kind: 'FREEZE' });
        });
        document.getElementById('btnPowerHint').addEventListener('click', () => {
            sfx.click(); if(Profile.deductExp(25)) this.send({ type: 'POWERUP', kind: 'HINT' });
        });
    },
    hostRoom() {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        this.isHost = true;
        this.peer = new Peer(code);
        this.peer.on('open', (id) => {
            document.getElementById('roomCodeDisplay').classList.remove('hidden');
            document.getElementById('hostCode').textContent = id;
            UI.toast('SERVER ESTABLISHED. WAITING FOR LINK.', 'success');
        });
        this.peer.on('connection', (c) => this.handleConnection(c));
    },
    joinRoom() {
        const code = document.getElementById('joinCode').value.trim();
        if(code.length !== 6) return UI.toast('INVALID 6-DIGIT FREQUENCY', 'error');
        this.isHost = false;
        this.peer = new Peer();
        this.peer.on('open', () => {
            UI.toast('ATTEMPTING LINK...', 'info');
            const c = this.peer.connect(code, { reliable: true });
            this.handleConnection(c);
        });
    },
    handleConnection(c) {
        this.conn = c;
        c.on('open', () => {
            UI.toast('UPLINK SECURED', 'success'); sfx.success();
            Profile.data.name = document.getElementById('playerName').value || 'GUEST'; Profile.save();
            c.send({ type: 'HANDSHAKE', name: Profile.data.name });
            if(this.isHost) setTimeout(() => GameServer.startMatch(), 1500);
        });
        c.on('data', (data) => this.processData(data));
        c.on('close', () => { UI.toast('PARTNER DISCONNECTED', 'error'); UI.switchScreen('lobby'); window.location.reload(); });
    },
    send(payload) { 
        if(this.conn) this.conn.send(payload); 
        // If host triggers an action, loop it directly to Server logic
        if(this.isHost && payload.type === 'GUESS') GameServer.evaluateGuess(payload.word, 'P1');
        if(this.isHost && payload.type === 'POWERUP') GameServer.triggerPowerup(payload.kind, 'P1');
    },
    sendTo(player, payload) {
        if(player === 'P1' && this.isHost) this.processData(payload); // Loopback to self
        if(player === 'P2' && this.conn) this.conn.send(payload);
    },
    processData(data) {
        // --- SERVER INBOUND ---
        if(this.isHost) {
            if(data.type === 'HANDSHAKE') {
                document.getElementById('p2Name').textContent = data.name;
                document.getElementById('p1Name').textContent = Profile.data.name;
                this.conn.send({ type: 'HANDSHAKE', name: Profile.data.name });
            }
            if(data.type === 'GUESS') GameServer.evaluateGuess(data.word, 'P2');
            if(data.type === 'POWERUP') GameServer.triggerPowerup(data.kind, 'P2');
        } 
        // --- CLIENT INBOUND ---
        else {
            if(data.type === 'HANDSHAKE') {
                document.getElementById('p2Name').textContent = data.name;
                document.getElementById('p1Name').textContent = Profile.data.name;
            }
        }

        // --- GLOBAL SYNC (BOTH) ---
        if(data.type === 'SYNC') {
            const p = data.payload;
            if(p.action === 'MATCH_START') {
                UI.switchScreen('arena');
                document.getElementById('btnSubmitWord').disabled = false;
                document.getElementById('arenaStatus').textContent = "QUANTUM ANAGRAMS";
            }
            if(p.action === 'NEW_ROUND') {
                document.getElementById('anagramDisplay').textContent = p.scramble;
                UI.visualFeedback('anagramDisplay', 'success');
                document.getElementById('wordInput').value = '';
                document.getElementById('hintDisplay').textContent = '';
            }
            if(p.action === 'TICK') {
                document.getElementById('arenaTimer').textContent = p.time;
            }
            if(p.action === 'SCORE_UPDATE') {
                if(this.isHost) { document.getElementById('p1Score').textContent = p.p1; document.getElementById('p2Score').textContent = p.p2; }
                else { document.getElementById('p1Score').textContent = p.p2; document.getElementById('p2Score').textContent = p.p1; }
                
                if((this.isHost && p.solver === 'P1') || (!this.isHost && p.solver === 'P2')) {
                    sfx.success(); UI.toast('SEQUENCE EXTRACTED', 'success'); Profile.addExp(50);
                } else {
                    UI.toast('PARTNER EXTRACTED SEQUENCE', 'error'); sfx.error();
                }
            }
            if(p.action === 'GUESS_REJECTED') {
                sfx.error(); UI.visualFeedback('inputWrapper', 'error');
            }
            if(p.action === 'FREEZE_STATE') {
                if(p.state) {
                    sfx.freeze(); document.getElementById('freezeOverlay').classList.remove('hidden');
                    document.getElementById('timerRing').classList.add('frozen');
                    UI.toast('CHRONOS FROZEN', 'info');
                } else {
                    document.getElementById('freezeOverlay').classList.add('hidden');
                    document.getElementById('timerRing').classList.remove('frozen');
                }
            }
            if(p.action === 'HINT_DELIVERED') {
                document.getElementById('hintDisplay').textContent = `CLUE: ${p.text}`;
                sfx.powerup();
            }
            if(p.action === 'MATCH_END') {
                document.getElementById('btnSubmitWord').disabled = true;
                let amIWinner = false;
                if(p.winner === 'DRAW') UI.toast('MATCH DRAWN', 'info');
                else if((this.isHost && p.winner === 'P1') || (!this.isHost && p.winner === 'P2')) {
                    UI.toast('VICTORY ACHIEVED', 'success'); Profile.data.wins++; Profile.addExp(100); amIWinner = true;
                } else {
                    UI.toast('DEFEAT DETECTED', 'error');
                }
                document.getElementById('arenaStatus').textContent = amIWinner ? "VICTORY" : (p.winner === 'DRAW' ? "DRAW" : "DEFEAT");
                
                if(this.isHost) {
                    setTimeout(() => { GameServer.startMatch(); }, 5000);
                    UI.toast('INITIATING REMATCH IN 5s...', 'info');
                }
            }
        }
    },
    submitGuess() {
        const input = document.getElementById('wordInput');
        const guess = input.value.trim().toUpperCase();
        if(!guess) return;
        this.send({ type: 'GUESS', word: guess });
        input.value = ''; input.focus();
    }
};

window.onload = () => { initGraphicsEngine(); Profile.init(); Network.init(); };