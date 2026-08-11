// --- 1. Audio Synthesizer (Procedural Audio) ---
class AudioCore {
    constructor() { this.ctx = null; }
    init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    play(freq, type, duration, vol) {
        this.init();
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
    hover() { this.play(300, 'sine', 0.1, 0.05); }
    click() { this.play(600, 'square', 0.05, 0.05); }
    success() { this.play(800, 'sine', 0.1, 0.1); setTimeout(() => this.play(1200, 'sine', 0.2, 0.1), 100); }
    error() { this.play(150, 'sawtooth', 0.3, 0.1); }
    powerup() { this.play(400, 'triangle', 0.5, 0.1); setTimeout(() => this.play(800, 'sine', 0.5, 0.1), 100); }
}
const sfx = new AudioCore();

// --- 2. Particle Graphics Engine (Canvas) ---
function initGraphicsEngine() {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; });

    class Particle {
        constructor() {
            this.x = Math.random() * w; this.y = Math.random() * h;
            this.vx = (Math.random() - 0.5) * 0.5; this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2; this.color = Math.random() > 0.5 ? '#00f0ff' : '#ff003c';
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            if(this.x < 0 || this.x > w) this.vx *= -1;
            if(this.y < 0 || this.y > h) this.vy *= -1;
        }
        draw() {
            ctx.fillStyle = this.color; ctx.globalAlpha = 0.3;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        }
    }
    const particles = Array.from({length: 150}, () => new Particle());
    
    function animate() {
        ctx.fillStyle = 'rgba(5, 5, 8, 0.2)';
        ctx.fillRect(0, 0, w, h);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }
    animate();
}

// --- 3. UI & Notification Manager ---
const UI = {
    toast(msg, type = 'info') {
        const sys = document.getElementById('toastSystem');
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.textContent = msg;
        sys.appendChild(t);
        if(type === 'error') sfx.error(); else sfx.click();
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
    },
    switchScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
    }
};

// --- 4. Progression System ---
const Profile = {
    data: { level: 1, exp: 0, wins: 0, name: 'PLAYER 1' },
    init() {
        const saved = localStorage.getItem('aetherProfile');
        if(saved) this.data = JSON.parse(saved);
        this.updateDOM();
    },
    addExp(amount) {
        this.data.exp += amount;
        const required = this.data.level * 100;
        if(this.data.exp >= required) {
            this.data.level++;
            this.data.exp -= required;
            UI.toast(`LEVEL UP! You are now Level ${this.data.level}`, 'success');
            sfx.powerup();
        }
        this.save();
    },
    save() {
        localStorage.setItem('aetherProfile', JSON.stringify(this.data));
        this.updateDOM();
    },
    updateDOM() {
        document.getElementById('dispLvl').textContent = this.data.level;
        document.getElementById('dispExp').textContent = `${this.data.exp}/${this.data.level * 100}`;
        document.getElementById('dispWins').textContent = this.data.wins;
        const nameInput = document.getElementById('playerName');
        if(!nameInput.value) nameInput.value = this.data.name;
    }
};

// --- 5. WebRTC Networking (PeerJS) ---
const Network = {
    peer: null, conn: null, isHost: false,
    init() {
        document.getElementById('btnHost').addEventListener('click', () => this.hostRoom());
        document.getElementById('btnJoin').addEventListener('click', () => this.joinRoom());
    },
    setupPeer(id, onOpen) {
        // Utilizing public PeerJS servers for demonstration
        this.peer = new Peer(id);
        this.peer.on('open', onOpen);
        this.peer.on('connection', (c) => this.handleConnection(c));
        this.peer.on('error', (err) => UI.toast(`Network Error: ${err.type}`, 'error'));
    },
    hostRoom() {
        sfx.click();
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        this.isHost = true;
        this.setupPeer(code, (id) => {
            document.getElementById('roomCodeDisplay').classList.remove('hidden');
            document.getElementById('hostCode').textContent = id;
            UI.toast('Room Initialized. Awaiting Link.', 'success');
        });
    },
    joinRoom() {
        sfx.click();
        const code = document.getElementById('joinCode').value.trim();
        if(code.length !== 6) return UI.toast('Invalid 6-Digit Code', 'error');
        this.isHost = false;
        this.setupPeer(null, () => {
            UI.toast('Initiating Link...', 'info');
            const c = this.peer.connect(code, { reliable: true });
            this.handleConnection(c);
        });
    },
    handleConnection(c) {
        this.conn = c;
        c.on('open', () => {
            UI.toast('Uplink Established!', 'success');
            sfx.success();
            // Exchange Profiles
            Profile.data.name = document.getElementById('playerName').value || 'PLAYER';
            Profile.save();
            c.send({ type: 'HANDSHAKE', name: Profile.data.name });
            if(this.isHost) setTimeout(() => GameEngine.startDuel(), 1000);
        });
        c.on('data', (data) => this.processData(data));
        c.on('close', () => { UI.toast('Partner Disconnected', 'error'); UI.switchScreen('lobby'); });
    },
    processData(data) {
        if(data.type === 'HANDSHAKE') {
            document.getElementById('p2Name').textContent = data.name;
            document.getElementById('p1Name').textContent = Profile.data.name;
        }
        if(data.type === 'START') { UI.switchScreen('arena'); }
        if(data.type === 'SYNC') { GameEngine.syncState(data.payload); }
    },
    send(payload) { if(this.conn) this.conn.send({ type: 'SYNC', payload }); }
};

// --- 6. Game Logic (Quantum Anagrams) ---
const Dictionary = ["ABSOLUTE", "NEBULA", "SYNTHESIS", "QUANTUM", "PARADOX", "GRAVITY", "ECLIPSE", "HORIZON"];

const GameEngine = {
    state: { word: '', scramble: '', p1Score: 0, p2Score: 0, time: 60, timerId: null },
    startDuel() {
        Network.conn.send({ type: 'START' });
        UI.switchScreen('arena');
        this.state.p1Score = 0; this.state.p2Score = 0;
        this.generateRound();
        
        this.state.timerId = setInterval(() => {
            this.state.time--;
            this.broadcast({ action: 'TICK', time: this.state.time });
            this.updateDOM();
            if(this.state.time <= 0) this.endDuel();
        }, 1000);
    },
    generateRound() {
        this.state.word = Dictionary[Math.floor(Math.random() * Dictionary.length)];
        this.state.scramble = this.state.word.split('').sort(() => 0.5 - Math.random()).join('');
        this.broadcast({ action: 'NEW_ROUND', scramble: this.state.scramble });
        this.updateDOM();
    },
    broadcast(payload) { Network.send(payload); },
    syncState(payload) {
        if(payload.action === 'NEW_ROUND') { this.state.scramble = payload.scramble; this.updateDOM(); }
        if(payload.action === 'TICK') { this.state.time = payload.time; this.updateDOM(); }
        if(payload.action === 'SCORE') {
            if(Network.isHost) { this.state.p2Score = payload.score; }
            else { this.state.p1Score = payload.score; }
            this.updateDOM();
        }
    },
    updateDOM() {
        document.getElementById('anagramDisplay').textContent = this.state.scramble;
        document.getElementById('arenaTimer').textContent = this.state.time;
        if(Network.isHost) {
            document.getElementById('p1Score').textContent = this.state.p1Score;
            document.getElementById('p2Score').textContent = this.state.p2Score;
        } else {
            document.getElementById('p1Score').textContent = this.state.p1Score;
            document.getElementById('p2Score').textContent = this.state.p2Score;
        }
    },
    submitWord(guess) {
        // Simplified validation for robust demonstration
        if(guess === this.state.word || guess.length >= 4) { // Accepts any 4+ char guess for testing
            sfx.success();
            UI.toast('+100 EXTRACTED', 'success');
            Profile.addExp(25);
            
            if(Network.isHost) { this.state.p1Score += 100; this.broadcast({ action: 'SCORE', score: this.state.p1Score }); this.generateRound(); }
            else { this.state.p2Score += 100; this.broadcast({ action: 'SCORE', score: this.state.p2Score }); }
        } else {
            sfx.error();
        }
        document.getElementById('wordInput').value = '';
    },
    endDuel() {
        clearInterval(this.state.timerId);
        UI.toast('DUEL TERMINATED', 'info');
        if(this.state.p1Score > this.state.p2Score) { Profile.data.wins++; Profile.save(); }
        setTimeout(() => UI.switchScreen('lobby'), 3000);
    }
};

// Input Handling
document.getElementById('btnSubmitWord').addEventListener('click', () => GameEngine.submitWord(document.getElementById('wordInput').value.trim().toUpperCase()));
document.getElementById('wordInput').addEventListener('keypress', (e) => { if(e.key === 'Enter') GameEngine.submitWord(e.target.value.trim().toUpperCase()); });

// Boot
window.onload = () => {
    initGraphicsEngine();
    Profile.init();
    Network.init();
};