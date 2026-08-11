/**
 * LUMINA GAME ENGINE
 * Architecture: Model-View-Controller via ES6 Objects
 */

// --- Audio Engine (Web Audio API) ---
const AudioEngine = {
    ctx: null,
    unlocked: false,
    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.unlocked = true;
    },
    play(freq, type, dur, vol) {
        if (!this.unlocked) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(this.ctx.currentTime + dur);
        } catch (e) {}
    },
    pop() { this.play(600, 'sine', 0.1, 0.05); },
    success() { this.play(800, 'sine', 0.1, 0.05); setTimeout(()=>this.play(1200, 'sine', 0.2, 0.05), 100); },
    error() { this.play(200, 'sawtooth', 0.2, 0.05); },
    win() { [400, 500, 600, 800].forEach((f,i) => setTimeout(()=>this.play(f, 'sine', 0.3, 0.05), i*150)); }
};

// Unlock audio on first touch
document.body.addEventListener('touchstart', () => AudioEngine.init(), { once: true });
document.body.addEventListener('click', () => AudioEngine.init(), { once: true });

// --- Background Particles ---
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; });

    const particles = Array.from({length: 40}, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 2 + 0.5,
        vy: -Math.random() * 0.5 - 0.2,
        alpha: Math.random() * 0.5 + 0.2
    }));

    function draw() {
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => {
            p.y += p.vy; if(p.y < 0) p.y = h;
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        });
        requestAnimationFrame(draw);
    }
    draw();
}

// --- UI Controller ---
const UI = {
    toast(msg, type = 'info') {
        const container = document.getElementById('toastContainer');
        const t = document.createElement('div');
        t.className = `toast ${type}`; t.textContent = msg;
        container.appendChild(t);
        if(type==='error') AudioEngine.error(); else AudioEngine.pop();
        setTimeout(() => { t.style.opacity = '0'; setTimeout(()=>t.remove(), 300); }, 2500);
    },
    screen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    },
    getElement(id) { return document.getElementById(id); }
};

// --- Dictionary & Generators ---
// Robust pool of romantic/cozy/aesthetic words
const DICT = ["LOVE", "STAR", "MOON", "KISS", "HUG", "CUTE", "SOUL", "MATE", "DEAR", "SWEET", "HEART", "WARM", "COZY", "HOME", "SAFE", "BABY", "FIRE", "GLOW", "ROSE", "WINE", "DATE", "TIME", "FOREVER", "ALWAYS", "SMILE", "LAUGH", "HAND", "HOLD", "DREAM", "HOPE", "WISH", "NIGHT", "LIGHT", "DAWN", "DUSK", "SOFT", "SILK", "GOLD", "PURE", "TRUE", "REAL", "LIFE", "MIND", "CALM", "PEACE", "REST", "STAY"];
const VOWELS = ['A','E','I','O','U'];
const CONSONANTS = ['R','S','T','L','N','C','M','P','D','H','W','G','F','B'];

// --- Master App State & Network ---
const PREFIX = "lumina-app-";
const App = {
    peer: null, conn: null, isHost: false,
    localName: 'Player', remoteName: 'Partner',
    
    // Game State
    active: false, score: 0, time: 60, timerId: null,
    letters: [], foundWords: [],
    
    init() {
        initParticles();
        
        // Event Listeners
        UI.getElement('btnHost').addEventListener('click', () => this.hostRoom());
        UI.getElement('btnJoin').addEventListener('click', () => this.joinRoom());
        UI.getElement('btnLaunchAnagrams').addEventListener('click', () => {
            if(this.isHost) this.startGame();
            else UI.toast('Only the Host can start the game.', 'info');
        });
        UI.getElement('btnSubmitWord').addEventListener('click', () => this.submitGuess());
        UI.getElement('wordInput').addEventListener('keypress', (e) => { if(e.key === 'Enter') this.submitGuess(); });
        
        UI.getElement('btnPlayAgain').addEventListener('click', () => {
            UI.getElement('resultScreen').classList.remove('active');
            if(this.isHost) this.startGame(); else UI.toast('Waiting for host...', 'info');
        });
        UI.getElement('btnBackToHub').addEventListener('click', () => {
            UI.getElement('resultScreen').classList.remove('active');
            UI.screen('hubScreen');
        });
    },

    getPeerConfig() {
        return { config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] } };
    },

    hostRoom() {
        const name = UI.getElement('playerName').value.trim();
        this.localName = name || 'Host';
        
        AudioEngine.pop();
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        this.isHost = true;
        
        UI.getElement('btnHost').classList.add('hidden');
        document.querySelector('.divider').classList.add('hidden');
        document.querySelector('.join-box').classList.add('hidden');
        
        const statusBox = UI.getElement('lobbyStatus');
        statusBox.classList.remove('hidden');
        UI.getElement('statusText').textContent = "Establishing Secure Link...";

        this.peer = new Peer(PREFIX + code, this.getPeerConfig());
        this.peer.on('open', () => {
            UI.getElement('statusText').textContent = "Room created. Share this code:";
            const codeDisplay = UI.getElement('roomCodeDisplay');
            codeDisplay.textContent = code;
            codeDisplay.classList.remove('hidden');
            document.querySelector('.spinner').classList.add('hidden');
        });
        this.peer.on('connection', (c) => this.handleConnection(c));
        this.peer.on('error', (e) => { UI.toast('Network error. Try again.', 'error'); setTimeout(()=>window.location.reload(), 2000); });
    },

    joinRoom() {
        const name = UI.getElement('playerName').value.trim();
        this.localName = name || 'Guest';
        const code = UI.getElement('joinCode').value.trim();
        if(code.length !== 4) return UI.toast('Enter 4-Digit Code', 'error');
        
        AudioEngine.pop();
        this.isHost = false;
        
        UI.getElement('btnHost').classList.add('hidden');
        document.querySelector('.divider').classList.add('hidden');
        document.querySelector('.join-box').classList.add('hidden');
        
        const statusBox = UI.getElement('lobbyStatus');
        statusBox.classList.remove('hidden');
        UI.getElement('statusText').textContent = "Connecting to room...";

        this.peer = new Peer(this.getPeerConfig());
        this.peer.on('open', () => {
            const c = this.peer.connect(PREFIX + code, { reliable: true });
            this.handleConnection(c);
        });
        this.peer.on('error', () => { UI.toast('Room not found.', 'error'); setTimeout(()=>window.location.reload(), 2000); });
    },

    handleConnection(c) {
        this.conn = c;
        c.on('open', () => {
            AudioEngine.success();
            UI.toast('Linked successfully!', 'success');
            c.send({ type: 'HANDSHAKE', name: this.localName });
        });
        c.on('data', (data) => this.processData(data));
        c.on('close', () => { UI.toast('Partner disconnected.', 'error'); setTimeout(()=>window.location.reload(), 2000); });
    },

    processData(data) {
        if(data.type === 'HANDSHAKE') {
            this.remoteName = data.name;
            UI.getElement('hubPartnerName').textContent = this.remoteName;
            UI.getElement('p1Name').textContent = this.localName;
            UI.getElement('p2Name').textContent = this.remoteName;
            if(this.isHost) {
                this.conn.send({ type: 'HANDSHAKE', name: this.localName });
                setTimeout(() => UI.screen('hubScreen'), 1000);
            } else {
                UI.screen('hubScreen');
            }
        }
        if(data.type === 'SYNC') this.syncGame(data.payload);
        if(data.type === 'GUESS' && this.isHost) this.evaluateGuess(data.word, 'P2');
    },

    sendSync(payload) { if(this.conn) this.conn.send({ type: 'SYNC', payload }); },

    // --- GAME LOGIC ---
    startGame() {
        this.active = true; this.score = 0; this.time = 60; this.foundWords = [];
        
        // Generate a valid pool of 10 letters (4 vowels, 6 consonants)
        this.letters = [];
        for(let i=0; i<4; i++) this.letters.push(VOWELS[Math.floor(Math.random() * VOWELS.length)]);
        for(let i=0; i<6; i++) this.letters.push(CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)]);
        this.letters.sort(() => 0.5 - Math.random());

        const payload = { action: 'START', letters: this.letters };
        this.sendSync(payload); this.syncGame(payload);

        clearInterval(this.timerId);
        this.timerId = setInterval(() => {
            this.time--;
            this.sendSync({ action: 'TICK', time: this.time });
            this.syncGame({ action: 'TICK', time: this.time });
            if(this.time <= 0) this.endGame();
        }, 1000);
    },

    endGame() {
        clearInterval(this.timerId); this.active = false;
        const payload = { action: 'END', score: this.score };
        this.sendSync(payload); this.syncGame(payload);
    },

    syncGame(p) {
        if(p.action === 'START') {
            this.letters = p.letters;
            UI.getElement('scrambledLetters').textContent = this.letters.join(' ');
            UI.getElement('foundWordsList').innerHTML = '';
            UI.getElement('teamScore').textContent = '0';
            UI.getElement('wordInput').value = '';
            UI.screen('arenaScreen');
        }
        if(p.action === 'TICK') {
            const pct = (p.time / 60) * 100;
            UI.getElement('timerFill').style.width = `${pct}%`;
        }
        if(p.action === 'WORD_FOUND') {
            AudioEngine.success();
            this.score = p.score; this.foundWords = p.wordsList;
            UI.getElement('teamScore').textContent = this.score;
            
            const list = UI.getElement('foundWordsList');
            list.innerHTML = '';
            this.foundWords.forEach(obj => {
                const pill = document.createElement('div');
                pill.className = `word-pill ${obj.owner === 'P1' ? (this.isHost ? 'p1' : 'p2') : (this.isHost ? 'p2' : 'p1')}`;
                pill.textContent = obj.word;
                list.appendChild(pill);
            });
        }
        if(p.action === 'REJECT') {
            const input = UI.getElement('wordInput');
            input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake');
            AudioEngine.error();
        }
        if(p.action === 'END') {
            AudioEngine.win();
            UI.getElement('finalScore').textContent = p.score;
            UI.getElement('resultScreen').classList.add('active');
        }
    },

    submitGuess() {
        if(!this.active) return;
        const input = UI.getElement('wordInput');
        const guess = input.value.trim().toUpperCase();
        if(!guess) return;
        
        // Client-side validation to see if letters are available
        let tempLetters = [...this.letters];
        let valid = true;
        for(let char of guess) {
            const idx = tempLetters.indexOf(char);
            if(idx === -1) { valid = false; break; }
            tempLetters.splice(idx, 1);
        }

        if(!valid) {
            this.syncGame({ action: 'REJECT' });
        } else {
            if(this.isHost) this.evaluateGuess(guess, 'P1');
            else this.conn.send({ type: 'GUESS', word: guess, player: 'P2' });
        }
        input.value = ''; input.focus();
    },

    evaluateGuess(guess, player) {
        if(!this.active) return;
        
        // Check if word is at least 3 letters and hasn't been found
        const alreadyFound = this.foundWords.find(w => w.word === guess);
        
        // In a full app, check against a real dictionary. Here we use a simplified check:
        // If it's 3+ letters and uses the pool, we accept it for smooth gameplay.
        // Or strictly check against DICT array if you want it hard. Let's make it fun and accept any 3+ letters.
        if(guess.length >= 3 && !alreadyFound) {
            const points = guess.length * 10;
            this.score += points;
            this.foundWords.push({ word: guess, owner: player });
            
            const payload = { action: 'WORD_FOUND', score: this.score, wordsList: this.foundWords };
            this.sendSync(payload); this.syncGame(payload);
        } else {
            if(player === 'P1') this.syncGame({ action: 'REJECT' });
            else this.sendSync({ action: 'REJECT' });
        }
    }
};

window.onload = () => App.init();