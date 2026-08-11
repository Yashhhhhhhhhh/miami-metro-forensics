// --- Mobile Viewport Fix ---
function setVH() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', setVH);
setVH();

// --- Audio Engine (Mobile Unlocked) ---
class AudioEngine {
    constructor() { this.ctx = null; this.unlocked = false; }
    init() {
        if (!this.ctx) { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.unlocked = true;
    }
    play(freq, type, dur, vol) {
        if (!this.unlocked) return;
        try {
            const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
            osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(this.ctx.currentTime + dur);
        } catch (e) {}
    }
    pop() { this.play(600, 'sine', 0.1, 0.05); }
    success() { this.play(800, 'sine', 0.1, 0.05); setTimeout(()=>this.play(1200, 'sine', 0.2, 0.05), 100); }
    error() { this.play(200, 'sawtooth', 0.2, 0.05); }
    win() { [400, 500, 600, 800].forEach((f,i) => setTimeout(()=>this.play(f, 'sine', 0.3, 0.05), i*150)); }
}
const sfx = new AudioEngine();
document.body.addEventListener('touchstart', () => sfx.init(), { once: true });
document.body.addEventListener('click', () => sfx.init(), { once: true });

// --- Stardust Background ---
function initStardust() {
    const canvas = document.getElementById('stardustCanvas');
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth; let h = canvas.height = window.innerHeight;
    window.addEventListener('resize', () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; });
    
    const stars = Array.from({length: 60}, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.5 + 0.5,
        vy: -Math.random() * 0.5 - 0.2,
        alpha: Math.random() * 0.5 + 0.2
    }));

    function draw() {
        ctx.clearRect(0, 0, w, h);
        stars.forEach(s => {
            s.y += s.vy; if(s.y < 0) s.y = h;
            ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        });
        requestAnimationFrame(draw);
    }
    draw();
}
initStardust();

// --- UI & Toasts ---
const UI = {
    toast(msg, type = 'info') {
        const layer = document.getElementById('toastLayer');
        const t = document.createElement('div');
        t.className = `toast ${type}`; t.textContent = msg;
        layer.appendChild(t);
        if (type === 'error') sfx.error(); else sfx.pop();
        setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(-20px)'; setTimeout(()=>t.remove(), 400); }, 2500);
    },
    screen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        setTimeout(() => {
            document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
            document.getElementById(id).classList.remove('hidden');
            // Small delay to allow display:flex to apply before animating opacity
            setTimeout(() => document.getElementById(id).classList.add('active'), 50);
        }, 300); // Wait for fade out
    }
};

// --- Game Data ---
// A pool of letters guaranteed to form many words
const VOWELS = ['A','E','I','O','U'];
const CONSONANTS = ['R','S','T','L','N','C','M','P','D','H'];
const DICTIONARY = ["STAR", "ART", "RAT", "TAR", "REST", "EAR", "ARE", "ERA", "SEA", "TEA", "EAT", "ATE", "NET", "TEN", "ANT", "TAN", "MOON", "SUN", "PLANET", "SPACE", "HEART", "HEAR", "HAT", "CAT", "CAR", "ARC", "CARE", "RACE", "PACE", "CAPE", "LANE", "LEAN", "REAL", "TALE", "LATE", "MEAT", "TEAM", "MATE", "TAME", "SAME", "NAME", "MANE", "MEAN", "NEAR", "EARN", "RENT", "TEAR", "RATE", "SEAT", "EAST", "EAST", "NEST", "SENT", "TENT", "TEST"];

// --- Network & Game State ---
const APP_PREFIX = "starlight-gm-";

const State = {
    peer: null, conn: null, isHost: false,
    name: 'Player', p2Name: 'Partner',
    
    // Game
    letters: [], foundWords: [], score: 0, time: 90, timerId: null, active: false,
    
    init() {
        document.getElementById('btnHost').addEventListener('click', () => this.hostRoom());
        document.getElementById('btnJoin').addEventListener('click', () => this.joinRoom());
        document.getElementById('btnCancelHost').addEventListener('click', () => {
            if(this.peer) this.peer.destroy();
            UI.screen('screen-home');
        });
        document.getElementById('btnSubmitGuess').addEventListener('click', () => this.submitGuess());
        document.getElementById('wordGuess').addEventListener('keypress', (e) => { if(e.key === 'Enter') this.submitGuess(); });
        
        document.getElementById('btnPlayAgain').addEventListener('click', () => {
            if(this.isHost) this.startGame(); else UI.toast('Waiting for host to restart...', 'info');
        });
        document.getElementById('btnExit').addEventListener('click', () => window.location.reload());
    },

    getPeerConfig() {
        return {
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        };
    },

    hostRoom() {
        const nameInput = document.getElementById('playerName').value.trim();
        this.name = nameInput || 'Host';
        
        sfx.pop();
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        this.isHost = true;
        
        UI.screen('screen-lobby');
        document.getElementById('displayRoomCode').textContent = code;

        this.peer = new Peer(APP_PREFIX + code, this.getPeerConfig());
        this.peer.on('open', () => UI.toast('Room Active. Waiting for partner.', 'info'));
        this.peer.on('connection', (c) => this.handleConnection(c));
        this.peer.on('error', (e) => { UI.toast('Connection Error. Try again.', 'error'); UI.screen('screen-home'); });
    },

    joinRoom() {
        const nameInput = document.getElementById('playerName').value.trim();
        this.name = nameInput || 'Guest';
        
        const code = document.getElementById('joinCode').value.trim();
        if(code.length !== 4) return UI.toast('Enter 4-Digit Code', 'error');
        
        sfx.pop();
        this.isHost = false;
        
        UI.toast('Connecting...', 'info');
        this.peer = new Peer(this.getPeerConfig());
        this.peer.on('open', () => {
            const c = this.peer.connect(APP_PREFIX + code, { reliable: true });
            this.handleConnection(c);
        });
        this.peer.on('error', (e) => UI.toast('Room not found or network error.', 'error'));
    },

    handleConnection(c) {
        this.conn = c;
        c.on('open', () => {
            sfx.success(); UI.toast('Linked successfully!', 'success');
            c.send({ type: 'HANDSHAKE', name: this.name });
        });
        c.on('data', (data) => this.processData(data));
        c.on('close', () => { UI.toast('Partner disconnected.', 'error'); setTimeout(()=>window.location.reload(), 2000); });
    },

    processData(data) {
        if(data.type === 'HANDSHAKE') {
            this.p2Name = data.name;
            if(this.isHost) {
                this.conn.send({ type: 'HANDSHAKE', name: this.name });
                setTimeout(() => this.startGame(), 1000);
            }
        }
        if(data.type === 'SYNC') this.syncGame(data.payload);
        if(data.type === 'GUESS' && this.isHost) {
            this.evaluateGuess(data.word, data.player);
        }
    },

    sendSync(payload) { if(this.conn) this.conn.send({ type: 'SYNC', payload }); },

    // --- GAME LOGIC ---
    startGame() {
        this.active = true; this.score = 0; this.time = 90; this.foundWords = [];
        document.getElementById('overlay-result').classList.add('hidden');
        
        // Generate 7 letters (3 Vowels, 4 Consonants)
        this.letters = [];
        for(let i=0; i<3; i++) this.letters.push(VOWELS[Math.floor(Math.random() * VOWELS.length)]);
        for(let i=0; i<4; i++) this.letters.push(CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)]);
        this.letters.sort(() => 0.5 - Math.random());

        this.sendSync({ action: 'START', letters: this.letters, p1Name: this.name, p2Name: this.p2Name });
        this.syncGame({ action: 'START', letters: this.letters, p1Name: this.p2Name, p2Name: this.name }); // Self sync (names flipped)

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
        this.sendSync({ action: 'END', score: this.score, words: this.foundWords.length });
        this.syncGame({ action: 'END', score: this.score, words: this.foundWords.length });
    },

    syncGame(p) {
        if(p.action === 'START') {
            document.getElementById('hudP1Name').textContent = this.name;
            document.getElementById('hudP2Name').textContent = this.p2Name;
            
            const pool = document.getElementById('letterPool');
            pool.innerHTML = '';
            p.letters.forEach(l => {
                const tile = document.createElement('div'); tile.className = 'letter-tile'; tile.textContent = l;
                pool.appendChild(tile);
            });
            
            document.getElementById('foundWordsList').innerHTML = '';
            document.getElementById('teamScore').textContent = '0';
            document.getElementById('wordGuess').value = '';
            UI.screen('screen-arena');
        }
        if(p.action === 'TICK') {
            document.getElementById('timerText').textContent = p.time + 's';
            document.getElementById('timerBar').style.width = (p.time / 90 * 100) + '%';
            if(p.time < 15) document.getElementById('timerBar').style.background = 'var(--neon-pink)';
            else document.getElementById('timerBar').style.background = 'linear-gradient(90deg, var(--neon-blue), var(--neon-pink))';
        }
        if(p.action === 'WORD_FOUND') {
            sfx.success();
            this.score = p.score; this.foundWords = p.wordsList;
            document.getElementById('teamScore').textContent = this.score;
            
            const list = document.getElementById('foundWordsList');
            list.innerHTML = '';
            this.foundWords.forEach(w => {
                const pill = document.createElement('div'); pill.className = 'word-pill'; pill.textContent = w;
                list.appendChild(pill);
            });
            
            // Animate letters
            const tiles = document.querySelectorAll('.letter-tile');
            tiles.forEach(t => { t.classList.add('active'); setTimeout(()=>t.classList.remove('active'), 300); });
        }
        if(p.action === 'REJECT') {
            const input = document.getElementById('wordGuess');
            input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake');
            sfx.error();
        }
        if(p.action === 'END') {
            sfx.win();
            document.getElementById('finalScoreDisplay').textContent = p.score;
            document.getElementById('finalStatsDisplay').textContent = `Words Discovered: ${p.words}`;
            document.getElementById('overlay-result').classList.remove('hidden');
        }
    },

    submitGuess() {
        if(!this.active) return;
        const input = document.getElementById('wordGuess');
        const guess = input.value.trim().toUpperCase();
        if(!guess) return;
        
        // Simple client-side letter check before sending
        let tempLetters = [...this.letters];
        let validLetters = true;
        for(let char of guess) {
            const idx = tempLetters.indexOf(char);
            if(idx === -1) { validLetters = false; break; }
            tempLetters.splice(idx, 1);
        }

        if(!validLetters) {
            this.syncGame({ action: 'REJECT' });
        } else {
            if(this.isHost) this.evaluateGuess(guess, this.name);
            else this.conn.send({ type: 'GUESS', word: guess, player: this.name });
        }
        input.value = '';
    },

    evaluateGuess(guess, player) {
        if(!this.active) return;
        // Check if word exists and hasn't been found
        // *In a real app, you'd use a massive JSON dictionary. Using a curated array here to ensure lightweight execution.*
        if(DICTIONARY.includes(guess) && !this.foundWords.includes(guess)) {
            const points = guess.length * 10;
            this.score += points;
            this.foundWords.push(guess);
            
            const payload = { action: 'WORD_FOUND', score: this.score, wordsList: this.foundWords };
            this.sendSync(payload); this.syncGame(payload);
        } else {
            if(player === this.name) this.syncGame({ action: 'REJECT' });
            else this.sendSync({ action: 'REJECT' });
        }
    }
};

window.onload = () => State.init();