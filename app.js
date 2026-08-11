/* ==========================================================================
   SPELLBOUND | CO-OP WORD SANCTUARY ENGINE
   ========================================================================== */

// --- 1. CURATED DICTIONARIES ---
const DICTIONARY = [
  "LOVE", "ROSE", "MOON", "STAR", "GLOW", "FLAME", "SWEET", "HEART", "DREAM", "SHINE",
  "LIGHT", "MAGIC", "SPARK", "ANGEL", "PEACE", "CHARM", "HONEY", "SMILE", "GRACE", "BLISS",
  "FAITH", "TRUST", "CANDLE", "SERENE", "VELVET", "SILK", "COZY", "WARMTH", "FOREVER", "ALWAYS",
  "SHELTER", "FLOWER", "BLOSSOM", "SUNSET", "AURORA", "CELESTIAL", "ETERNAL", "PASSION", "DEVOTION",
  "WHISPER", "HARMONY", "RADIANT", "DELIGHT", "EMBRACE", "BELOVED", "TREASURE", "BEAUTY", "MELODY"
];

const FIVE_LETTER_WORDS = [
  "ANGEL", "BEACH", "BLISS", "BLOOM", "CHARM", "CHALL", "CLOUD", "CANDY", "DREAM", "FLAME",
  "GRACE", "HEART", "LIGHT", "MAGIC", "PEACE", "QUEEN", "ROSE", "SMILE", "SPARK", "SWEET",
  "TRUST", "VALOR", "YOUTH", "SHINE", "SHINE", "HONEY", "LOVER", "FAITH", "HAPPY", "PEACH"
];

// --- 2. WEB AUDIO ENGINE ---
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playTone(freq, type, duration, gainVal = 0.1) {
    if (this.muted) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playCorrect() {
    this.playTone(523.25, 'sine', 0.15, 0.1); // C5
    setTimeout(() => this.playTone(659.25, 'sine', 0.2, 0.1), 100); // E5
  }

  playWrong() {
    this.playTone(220, 'sawtooth', 0.25, 0.08);
  }

  playWin() {
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.3, 0.12), idx * 120);
    });
  }
}

const audio = new SoundEngine();

// --- 3. STATE MANAGEMENT ---
const state = {
  playerName: 'Player 1',
  avatar: '🌙',
  mode: 'local', // 'local' or 'online'
  peer: null,
  conn: null,
  isHost: false,
  roomCode: null,
  
  // Game Session
  activeGame: null,
  currentTurn: 1, // 1 or 2
  scores: { p1: 0, p2: 0 },
  p2Name: 'Partner',
  p2Avatar: '🌹',
  timer: null,
  timeLeft: 60,
  
  // Stats
  stats: {
    gamesPlayed: 0,
    wordsFound: 0,
    highestScore: 0,
    coopVictories: 0
  }
};

// --- 4. DOM ELEMENTS ---
const els = {
  lobbyScreen: document.getElementById('lobbyScreen'),
  arenaScreen: document.getElementById('arenaScreen'),
  trophyModal: document.getElementById('trophyModal'),
  playerNameInput: document.getElementById('playerNameInput'),
  avatarSelect: document.getElementById('avatarSelect'),
  modeLocalBtn: document.getElementById('modeLocalBtn'),
  modeOnlineBtn: document.getElementById('modeOnlineBtn'),
  onlinePanel: document.getElementById('onlinePanel'),
  createRoomBtn: document.getElementById('createRoomBtn'),
  createdRoomCode: document.getElementById('createdRoomCode'),
  joinRoomInput: document.getElementById('joinRoomInput'),
  joinRoomBtn: document.getElementById('joinRoomBtn'),
  networkStatus: document.getElementById('networkStatus'),
  soundToggleBtn: document.getElementById('soundToggleBtn'),
  trophyRoomBtn: document.getElementById('trophyRoomBtn'),
  closeTrophyBtn: document.getElementById('closeTrophyBtn'),
  
  // Arena HUD
  p1AvatarDisplay: document.getElementById('p1AvatarDisplay'),
  p1NameDisplay: document.getElementById('p1NameDisplay'),
  p1ScoreDisplay: document.getElementById('p1ScoreDisplay'),
  p2AvatarDisplay: document.getElementById('p2AvatarDisplay'),
  p2NameDisplay: document.getElementById('p2NameDisplay'),
  p2ScoreDisplay: document.getElementById('p2ScoreDisplay'),
  activeModeTitle: document.getElementById('activeModeTitle'),
  timerBadge: document.getElementById('timerBadge'),
  turnIndicator: document.getElementById('turnIndicator'),
  arenaBoard: document.getElementById('arenaBoard'),
  leaveGameBtn: document.getElementById('leaveGameBtn'),
  
  // Stats
  statGamesPlayed: document.getElementById('statGamesPlayed'),
  statWordsFound: document.getElementById('statWordsFound'),
  statHighestScore: document.getElementById('statHighestScore'),
  statCoopVictories: document.getElementById('statCoopVictories')
};

// --- 5. INITIALIZATION & EVENT LISTENERS ---
function init() {
  loadStats();
  setupEventListeners();
  initAmbientCanvas();
}

function setupEventListeners() {
  els.playerNameInput.addEventListener('input', (e) => {
    state.playerName = e.target.value.trim() || 'Player 1';
  });

  els.avatarSelect.addEventListener('change', (e) => {
    state.avatar = e.target.value;
  });

  els.modeLocalBtn.addEventListener('click', () => {
    state.mode = 'local';
    els.modeLocalBtn.classList.add('active');
    els.modeOnlineBtn.classList.remove('active');
    els.onlinePanel.classList.add('hidden');
  });

  els.modeOnlineBtn.addEventListener('click', () => {
    state.mode = 'online';
    els.modeOnlineBtn.classList.add('active');
    els.modeLocalBtn.classList.remove('active');
    els.onlinePanel.classList.remove('hidden');
    initPeerJS();
  });

  els.createRoomBtn.addEventListener('click', createOnlineRoom);
  els.joinRoomBtn.addEventListener('click', joinOnlineRoom);

  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
      const selectedMode = card.dataset.mode;
      launchGame(selectedMode);
    });
  });

  els.leaveGameBtn.addEventListener('click', returnToLobby);
  els.soundToggleBtn.addEventListener('click', toggleSound);
  els.trophyRoomBtn.addEventListener('click', () => els.trophyModal.classList.remove('hidden'));
  els.closeTrophyBtn.addEventListener('click', () => els.trophyModal.classList.add('hidden'));
}

function toggleSound() {
  audio.muted = !audio.muted;
  els.soundToggleBtn.textContent = audio.muted ? '🔇' : '🔊';
}

// --- 6. PEERJS MULTIPLAYER SYSTEM ---
function initPeerJS() {
  if (state.peer) return;
  state.peer = new Peer();
  
  state.peer.on('open', (id) => {
    els.networkStatus.textContent = `Status: Network Ready (Peer ID Active)`;
  });

  state.peer.on('connection', (conn) => {
    state.conn = conn;
    setupPeerHandlers();
    els.networkStatus.textContent = `Status: Partner Connected!`;
    audio.playWin();
  });
}

function createOnlineRoom() {
  if (!state.peer) return;
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  state.roomCode = code;
  state.isHost = true;
  
  els.createdRoomCode.textContent = `ROOM: ${code}`;
  els.createdRoomCode.classList.remove('hidden');
  els.networkStatus.textContent = `Waiting for partner to join code ${code}...`;
}

function joinOnlineRoom() {
  const code = els.joinRoomInput.value.trim();
  if (!code || !state.peer) return;
  
  els.networkStatus.textContent = `Connecting to room ${code}...`;
  
  // Note: For production simplicity, peer connects directly via room alias or generated ID
  const conn = state.peer.connect(code);
  if (conn) {
    state.conn = conn;
    setupPeerHandlers();
  }
}

function setupPeerHandlers() {
  state.conn.on('open', () => {
    els.networkStatus.textContent = `Status: Live Connection Established!`;
    syncNetworkData({ type: 'HANDSHAKE', name: state.playerName, avatar: state.avatar });
  });

  state.conn.on('data', (data) => {
    handleNetworkMessage(data);
  });
}

function syncNetworkData(msg) {
  if (state.conn && state.conn.open) {
    state.conn.send(msg);
  }
}

function handleNetworkMessage(msg) {
  switch (msg.type) {
    case 'HANDSHAKE':
      state.p2Name = msg.name;
      state.p2Avatar = msg.avatar;
      updateHud();
      break;
    case 'LAUNCH_GAME':
      startLocalGameEngine(msg.gameMode);
      break;
    case 'GAME_ACTION':
      processGameAction(msg.action);
      break;
  }
}

// --- 7. GAME ENGINE & MODES ---
function launchGame(gameMode) {
  if (state.mode === 'online' && state.conn) {
    syncNetworkData({ type: 'LAUNCH_GAME', gameMode });
  }
  startLocalGameEngine(gameMode);
}

function startLocalGameEngine(gameMode) {
  state.activeGame = gameMode;
  state.scores = { p1: 0, p2: 0 };
  state.currentTurn = 1;
  
  els.lobbyScreen.classList.remove('active');
  els.arenaScreen.classList.add('active');
  
  updateHud();
  
  switch (gameMode) {
    case 'anagram': initAnagramMode(); break;
    case 'chain': initChainMode(); break;
    case 'wordle': initWordleMode(); break;
    case 'grid': initGridMode(); break;
  }
  
  state.stats.gamesPlayed++;
  saveStats();
}

function updateHud() {
  els.p1AvatarDisplay.textContent = state.avatar;
  els.p1NameDisplay.textContent = state.playerName;
  els.p1ScoreDisplay.textContent = `${state.scores.p1} pts`;
  
  els.p2AvatarDisplay.textContent = state.p2Avatar;
  els.p2NameDisplay.textContent = state.p2Name;
  els.p2ScoreDisplay.textContent = `${state.scores.p2} pts`;
  
  els.turnIndicator.textContent = state.currentTurn === 1 ? `${state.playerName}'s Turn` : `${state.p2Name}'s Turn`;
}

function startTimer(duration, onComplete) {
  clearInterval(state.timer);
  state.timeLeft = duration;
  els.timerBadge.textContent = `${state.timeLeft}s`;
  
  state.timer = setInterval(() => {
    state.timeLeft--;
    els.timerBadge.textContent = `${state.timeLeft}s`;
    if (state.timeLeft <= 0) {
      clearInterval(state.timer);
      onComplete();
    }
  }, 1000);
}

// --- MODE 1: ANAGRAM BLITZ ---
let currentTargetWord = '';

function initAnagramMode() {
  els.activeModeTitle.textContent = "Anagram Blitz";
  nextAnagramRound();
  startTimer(60, endAnagramGame);
}

function nextAnagramRound() {
  currentTargetWord = DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)];
  const jumbled = currentTargetWord.split('').sort(() => 0.5 - Math.random()).join('');
  
  els.arenaBoard.innerHTML = `
    <div class="anagram-container">
      <div class="jumble-display">${jumbled}</div>
      <div class="word-input-box">
        <input type="text" id="anagramInput" placeholder="Type unscrambled word..." autofocus />
        <button id="submitAnagramBtn" class="btn btn-primary">Submit</button>
      </div>
      <p style="color: var(--text-muted);">Unscramble as many words as possible together!</p>
    </div>
  `;

  document.getElementById('submitAnagramBtn').addEventListener('click', checkAnagram);
  document.getElementById('anagramInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') checkAnagram();
  });
}

function checkAnagram() {
  const inputEl = document.getElementById('anagramInput');
  const guess = inputEl.value.trim().toUpperCase();
  
  if (guess === currentTargetWord) {
    audio.playCorrect();
    if (state.currentTurn === 1) state.scores.p1 += 10;
    else state.scores.p2 += 10;
    
    state.stats.wordsFound++;
    updateHud();
    nextAnagramRound();
  } else {
    audio.playWrong();
    inputEl.style.borderColor = 'var(--rose-gold)';
  }
}

function endAnagramGame() {
  audio.playWin();
  els.arenaBoard.innerHTML = `
    <div style="text-align: center;">
      <h2 style="font-family: var(--font-serif); font-size: 2rem; margin-bottom: 12px;">Round Complete!</h2>
      <p style="margin-bottom: 24px; color: var(--text-muted);">Final Combined Score: ${state.scores.p1 + state.scores.p2} points</p>
      <button class="btn btn-primary" onclick="launchGame('anagram')">Play Again</button>
    </div>
  `;
}

// --- MODE 2: WORD CHAIN ---
let chainHistory = [];

function initChainMode() {
  els.activeModeTitle.textContent = "Word Chain";
  chainHistory = ["LOVE"];
  renderChainBoard();
}

function renderChainBoard() {
  const lastWord = chainHistory[chainHistory.length - 1];
  const requiredLetter = lastWord.slice(-1);
  
  els.arenaBoard.innerHTML = `
    <div class="chain-container">
      <div class="chain-history">
        ${chainHistory.map(w => `<span class="chain-chip">${w.slice(0,-1)}<span class="last-letter">${w.slice(-1)}</span></span>`).join('')}
      </div>
      <p style="text-align: center; margin-bottom: 16px;">Next word must start with: <strong style="color: var(--rose-gold); font-size: 1.4rem;">${requiredLetter}</strong></p>
      <div class="word-input-box">
        <input type="text" id="chainInput" placeholder="Word starting with ${requiredLetter}..." autofocus />
        <button id="submitChainBtn" class="btn btn-primary">Add Word</button>
      </div>
    </div>
  `;

  document.getElementById('submitChainBtn').addEventListener('click', () => submitChainWord(requiredLetter));
  document.getElementById('chainInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') submitChainWord(requiredLetter);
  });
}

function submitChainWord(requiredLetter) {
  const inputEl = document.getElementById('chainInput');
  const word = inputEl.value.trim().toUpperCase();
  
  if (word.startsWith(requiredLetter) && word.length >= 3 && !chainHistory.includes(word)) {
    audio.playCorrect();
    chainHistory.push(word);
    state.stats.wordsFound++;
    state.currentTurn = state.currentTurn === 1 ? 2 : 1;
    updateHud();
    renderChainBoard();
  } else {
    audio.playWrong();
  }
}

// --- MODE 3: CO-OP WORDLE ---
let secretWordle = "";
let wordleAttempts = 0;

function initWordleMode() {
  els.activeModeTitle.textContent = "Co-Op Wordle";
  secretWordle = FIVE_LETTER_WORDS[Math.floor(Math.random() * FIVE_LETTER_WORDS.length)];
  wordleAttempts = 0;
  renderWordleBoard();
}

function renderWordleBoard() {
  els.arenaBoard.innerHTML = `
    <div class="chain-container" style="text-align: center;">
      <div class="wordle-board" id="wordleGrid">
        ${Array(6).fill().map(() => `
          <div class="wordle-row">
            ${Array(5).fill().map(() => `<div class="wordle-tile"></div>`).join('')}
          </div>
        `).join('')}
      </div>
      <div class="word-input-box">
        <input type="text" id="wordleInput" maxlength="5" placeholder="5-letter guess..." autofocus />
        <button id="submitWordleBtn" class="btn btn-primary">Guess</button>
      </div>
    </div>
  `;

  document.getElementById('submitWordleBtn').addEventListener('click', submitWordleGuess);
  document.getElementById('wordleInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') submitWordleGuess();
  });
}

function submitWordleGuess() {
  const inputEl = document.getElementById('wordleInput');
  const guess = inputEl.value.trim().toUpperCase();
  
  if (guess.length !== 5) {
    audio.playWrong();
    return;
  }

  const row = document.querySelectorAll('.wordle-row')[wordleAttempts];
  const tiles = row.querySelectorAll('.wordle-tile');
  
  for (let i = 0; i < 5; i++) {
    tiles[i].textContent = guess[i];
    if (guess[i] === secretWordle[i]) {
      tiles[i].classList.add('correct');
    } else if (secretWordle.includes(guess[i])) {
      tiles[i].classList.add('present');
    } else {
      tiles[i].classList.add('absent');
    }
  }

  wordleAttempts++;
  inputEl.value = '';

  if (guess === secretWordle) {
    audio.playWin();
    state.stats.coopVictories++;
    saveStats();
    alert("✨ Spectacular! You cracked the word together!");
  } else if (wordleAttempts >= 6) {
    audio.playWrong();
    alert(`Word was ${secretWordle}! Better luck next time.`);
  }
}

// --- MODE 4: LETTER GRID (BOGGLE) ---
let gridLetters = [];
let selectedWord = "";

function initGridMode() {
  els.activeModeTitle.textContent = "Letter Grid";
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  gridLetters = Array(16).fill().map(() => alphabet[Math.floor(Math.random() * alphabet.length)]);
  
  els.arenaBoard.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center;">
      <div class="boggle-grid">
        ${gridLetters.map((char, i) => `<div class="boggle-tile" data-idx="${i}">${char}</div>`).join('')}
      </div>
      <p style="margin-bottom: 12px; font-weight: 700;">Word: <span id="gridWordDisplay" style="color: var(--rose-gold); font-size: 1.2rem;">---</span></p>
      <button id="clearGridBtn" class="btn btn-outline btn-sm">Clear Selection</button>
    </div>
  `;

  document.querySelectorAll('.boggle-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      tile.classList.toggle('selected');
      selectedWord += tile.textContent;
      document.getElementById('gridWordDisplay').textContent = selectedWord;
      audio.playTone(400 + selectedWord.length * 50, 'sine', 0.1);
    });
  });

  document.getElementById('clearGridBtn').addEventListener('click', () => {
    selectedWord = "";
    document.getElementById('gridWordDisplay').textContent = "---";
    document.querySelectorAll('.boggle-tile').forEach(t => t.classList.remove('selected'));
  });
}

// --- 8. STATS & LOBBY LOGIC ---
function returnToLobby() {
  clearInterval(state.timer);
  els.arenaScreen.classList.remove('active');
  els.lobbyScreen.classList.add('active');
}

function saveStats() {
  localStorage.setItem('spellbound-stats', JSON.stringify(state.stats));
  updateStatsDisplay();
}

function loadStats() {
  const raw = localStorage.getItem('spellbound-stats');
  if (raw) {
    try { state.stats = JSON.parse(raw); } catch(e){}
  }
  updateStatsDisplay();
}

function updateStatsDisplay() {
  els.statGamesPlayed.textContent = state.stats.gamesPlayed;
  els.statWordsFound.textContent = state.stats.wordsFound;
  els.statHighestScore.textContent = state.stats.highestScore;
  els.statCoopVictories.textContent = state.stats.coopVictories;
}

// --- 9. ATMOSPHERIC CANVAS (PARTICLES) ---
function initAmbientCanvas() {
  const canvas = document.getElementById('ambientCanvas');
  const ctx = canvas.getContext('2d');
  
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  
  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = Array(45).fill().map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 2 + 1,
    alpha: Math.random() * 0.5 + 0.2,
    speedY: -Math.random() * 0.4 - 0.1
  }));

  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    particles.forEach(p => {
      p.y += p.speedY;
      if (p.y < 0) p.y = height;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 117, 151, ${p.alpha})`;
      ctx.fill();
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
}

// Start application
init();