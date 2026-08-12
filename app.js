const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const storeKey = "playroom-for-two-state-v1";

const wordBank = [
  "spark", "dream", "laugh", "heart", "magic", "cozy", "dance", "flame",
  "brave", "sweet", "orbit", "novel", "glow", "riddle", "toast", "paper",
  "mango", "pixel", "charm", "velvet", "garden", "secret", "puzzle", "castle"
];

const prompts = [
  "A secret handshake only we would invent",
  "A vacation where everything goes delightfully wrong",
  "A tiny restaurant on the moon",
  "The funniest pet name for a superhero",
  "A message hidden inside breakfast",
  "A two-person band with a ridiculous name",
  "A date night during a city-wide power cut",
  "An inside joke as a movie trailer",
  "A magic shop that only sells useless powers",
  "A love letter written by a haunted toaster"
];

const quizQuestions = [
  { q: "Which plan sounds more fun?", a: ["Street food crawl", "Blanket fort movie night", "Arcade battle", "Long night drive"] },
  { q: "Pick the emergency snack.", a: ["Fries", "Chocolate", "Momos", "Ice cream"] },
  { q: "What should your couple team be famous for?", a: ["Laughing too much", "Solving mysteries", "Cooking chaos", "Winning games"] },
  { q: "Choose a fictional home.", a: ["Treehouse", "Beach loft", "City studio", "Mountain cabin"] },
  { q: "What is the ideal silly trophy?", a: ["Golden spoon", "Tiny crown", "Glitter mug", "Champion sock"] },
  { q: "Choose a theme song vibe.", a: ["Disco", "Soft acoustic", "Bollywood drama", "Synth arcade"] }
];

const games = [
  { id: "quiz", title: "Same Brain", tag: "Compatibility", icon: "?", color: "#ff6b8a", desc: "Answer secretly, reveal together, and score when your choices match.", time: false },
  { id: "word", title: "Word Rush", tag: "Fast typing", icon: "W", color: "#3bb4ff", desc: "Build real-feeling words from the letter pile before time runs out.", time: true },
  { id: "memory", title: "Memory Match", tag: "Classic duel", icon: "M", color: "#8a5cf6", desc: "Flip cards, find pairs, and steal the lead with sharp memory.", time: false },
  { id: "reaction", title: "Reflex Duel", tag: "Arcade", icon: "!", color: "#ff9f1c", desc: "Wait for green, tap first, and avoid false starts.", time: false },
  { id: "palette", title: "Color Snap", tag: "Pattern race", icon: "C", color: "#38d9a9", desc: "Find the target color in a shifting grid before your partner does.", time: true },
  { id: "story", title: "Story Sparks", tag: "Creative", icon: "S", color: "#cf5c36", desc: "Take turns adding lines to weird prompts and vote on the funniest one.", time: false },
  { id: "doodle", title: "Doodle Pass", tag: "Drawing", icon: "D", color: "#111318", desc: "Draw together on a shared canvas with colorful brushes and challenge prompts.", time: false }
];

const state = {
  names: ["You", "Partner"],
  theme: "sunset",
  roundLength: 45,
  score: [0, 0],
  stats: {
    games: 0,
    wins: [0, 0],
    bestStreak: 0,
    currentStreak: 0,
    achievements: []
  },
  activeGame: null,
  timer: null,
  timeLeft: 0,
  sound: true,
  net: {
    peer: null,
    conn: null,
    host: false,
    connected: false,
    code: "",
    suppress: false
  }
};

const sound = {
  ctx: null,
  unlock() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === "suspended") this.ctx.resume();
  },
  note(freq, duration = 0.1, type = "sine", gainValue = 0.04) {
    if (!state.sound) return;
    this.unlock();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainValue, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },
  pop() { this.note(520, 0.09); },
  win() { [420, 560, 720, 920].forEach((freq, i) => setTimeout(() => this.note(freq, 0.14), i * 80)); },
  bad() { this.note(130, 0.16, "sawtooth", 0.035); }
};

function save() {
  localStorage.setItem(storeKey, JSON.stringify({
    names: state.names,
    theme: state.theme,
    roundLength: state.roundLength,
    score: state.score,
    stats: state.stats,
    sound: state.sound
  }));
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(storeKey) || "{}");
    Object.assign(state, {
      names: saved.names || state.names,
      theme: saved.theme || state.theme,
      roundLength: saved.roundLength || state.roundLength,
      score: saved.score || state.score,
      stats: saved.stats || state.stats,
      sound: saved.sound ?? state.sound
    });
  } catch {
    save();
  }
}

function toast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  $("#toastHost").appendChild(node);
  setTimeout(() => node.remove(), 2600);
}

function setTheme(theme) {
  state.theme = theme;
  document.body.dataset.theme = theme;
  save();
}

function refreshChrome() {
  const [a, b] = state.names;
  $("#playerOneInput").value = a;
  $("#playerTwoInput").value = b;
  $("#themeSelect").value = state.theme;
  $("#roundLengthSelect").value = String(state.roundLength);
  $("#lobbyP1").textContent = a;
  $("#lobbyP2").textContent = b;
  $("#lobbyScore").textContent = `${state.score[0]} - ${state.score[1]}`;
  $("#p1Name").textContent = a;
  $("#p2Name").textContent = b;
  $("#p1Score").textContent = state.score[0];
  $("#p2Score").textContent = state.score[1];
  $(".avatar-chip.p1").textContent = initials(a);
  $(".avatar-chip.p2").textContent = initials(b);
  $("#soundIcon").textContent = state.sound ? "ON" : "OFF";
  $("#statP1Label").textContent = `${a}'s wins`;
  $("#statP2Label").textContent = `${b}'s wins`;
  updateConnectionStatus();
}

function updateConnectionStatus(text) {
  const status = $("#connectionStatus");
  if (!status) return;
  if (text) {
    status.textContent = text;
    return;
  }
  if (state.net.connected) {
    status.textContent = state.net.host
      ? `Live room ${state.net.code} connected`
      : `Connected to room ${state.net.code}`;
  } else if (state.net.code) {
    status.textContent = `Room ${state.net.code} waiting for your partner`;
  } else {
    status.textContent = "Same-screen mode is ready";
  }
}

function initials(name) {
  return (name || "?").trim().slice(0, 1).toUpperCase();
}

function showScreen(id) {
  $$(".screen").forEach((screen) => screen.classList.remove("active"));
  $(`#${id}`).classList.add("active");
}

function renderGameGrid() {
  $("#gameGrid").innerHTML = games.map((game) => `
    <article class="game-card" style="--card-color:${game.color}" data-game="${game.id}" tabindex="0" role="button" aria-label="Start ${game.title}">
      <div class="card-icon">${game.icon}</div>
      <h3>${game.title}</h3>
      <p>${game.desc}</p>
      <footer><span>${game.tag}</span><span>Play</span></footer>
    </article>
  `).join("");

  $$(".game-card").forEach((card) => {
    const start = () => startGame(card.dataset.game);
    card.addEventListener("click", start);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") start();
    });
  });
}

function startGame(id) {
  if (state.net.connected && !state.net.host && !state.net.suppress) {
    toast("The room host starts live games.");
    return;
  }
  clearTimer();
  state.activeGame = id;
  const game = games.find((entry) => entry.id === id);
  $("#gameTag").textContent = game.tag;
  $("#gameTitle").textContent = game.title;
  $("#timerText").textContent = game.time ? state.roundLength : "--";
  $("#timerFill").style.width = "100%";
  showScreen("arenaScreen");
  sound.pop();
  gameModules[id].start();
  syncState();
}

function addPoints(playerIndex, points) {
  state.score[playerIndex] += points;
  refreshChrome();
  save();
  syncState();
}

function setScore(score) {
  state.score = [...score];
  refreshChrome();
  save();
}

function finishRound(winnerIndex, message) {
  clearTimer();
  state.stats.games += 1;
  if (winnerIndex !== null) {
    state.stats.wins[winnerIndex] += 1;
    state.stats.currentStreak = winnerIndex === 0 ? state.stats.currentStreak + 1 : 0;
    state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.currentStreak);
  }
  if (state.stats.games === 1) unlock("First round in the books");
  if (state.stats.games >= 10) unlock("Ten-game regulars");
  if (state.stats.bestStreak >= 3) unlock(`${state.names[0]} streak legend`);
  save();
  refreshChrome();
  sound.win();
  $("#gameMount").insertAdjacentHTML("afterbegin", `<div class="round-result">${message}</div>`);
  syncState({ finishedMessage: message });
}

function unlock(label) {
  if (!state.stats.achievements.includes(label)) {
    state.stats.achievements.push(label);
    toast(`Achievement unlocked: ${label}`);
  }
}

function startTimer(onEnd) {
  clearTimer();
  state.timeLeft = state.roundLength;
  $("#timerText").textContent = state.timeLeft;
  $("#timerFill").style.width = "100%";
  state.timer = setInterval(() => {
    state.timeLeft -= 1;
    $("#timerText").textContent = state.timeLeft;
    $("#timerFill").style.width = `${Math.max(0, (state.timeLeft / state.roundLength) * 100)}%`;
    if (state.timeLeft <= 0) {
      clearTimer();
      onEnd();
    } else if (state.net.host) {
      syncState();
    }
  }, 1000);
}

function clearTimer() {
  if (state.timer) clearInterval(state.timer);
  state.timer = null;
}

function canUseNetwork() {
  return typeof Peer !== "undefined";
}

function sendNet(type, payload = {}) {
  if (!state.net.connected || !state.net.conn || state.net.suppress) return;
  state.net.conn.send({ type, payload });
}

function syncState(extra = {}) {
  sendNet("SYNC", {
    names: state.names,
    score: state.score,
    activeGame: state.activeGame,
    timeLeft: state.timeLeft,
    module: state.activeGame && gameModules[state.activeGame].snapshot ? gameModules[state.activeGame].snapshot() : null,
    ...extra
  });
}

function createRoom() {
  if (!canUseNetwork()) {
    toast("Live rooms need internet access for PeerJS. Same-screen play still works.");
    return;
  }
  closeNetwork();
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  state.net.host = true;
  state.net.code = code;
  updateConnectionStatus(`Room ${code} opening...`);
  const peer = new Peer(`playroom-two-${code}`, {
    config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] }
  });
  state.net.peer = peer;
  peer.on("open", () => {
    $("#roomCodeInput").value = code;
    updateConnectionStatus(`Room ${code} waiting for your partner`);
    toast(`Room code: ${code}`);
  });
  peer.on("connection", attachConnection);
  peer.on("error", () => {
    updateConnectionStatus("Room error. Try creating a new code.");
    toast("Could not create the room.");
  });
}

function joinRoom() {
  if (!canUseNetwork()) {
    toast("Live rooms need internet access for PeerJS. Same-screen play still works.");
    return;
  }
  const code = $("#roomCodeInput").value.trim();
  if (!/^\d{4}$/.test(code)) {
    toast("Enter the 4 digit room code.");
    return;
  }
  closeNetwork();
  state.net.host = false;
  state.net.code = code;
  updateConnectionStatus(`Joining room ${code}...`);
  const peer = new Peer({
    config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] }
  });
  state.net.peer = peer;
  peer.on("open", () => attachConnection(peer.connect(`playroom-two-${code}`, { reliable: true })));
  peer.on("error", () => {
    updateConnectionStatus("Could not join. Check the code and try again.");
    toast("Room not found.");
  });
}

function attachConnection(conn) {
  state.net.conn = conn;
  conn.on("open", () => {
    state.net.connected = true;
    updateConnectionStatus();
    toast("Live room connected.");
    sendNet("HELLO", { names: state.names, score: state.score });
    syncState();
  });
  conn.on("data", handleNetMessage);
  conn.on("close", () => {
    state.net.connected = false;
    updateConnectionStatus("Partner disconnected. Same-screen play still works.");
  });
}

function handleNetMessage(message) {
  if (!message || typeof message !== "object") return;
  if (message.type === "HELLO") {
    if (message.payload.names) {
      if (state.net.host) state.names[1] = message.payload.names[0] || state.names[1];
      else state.names[1] = message.payload.names[0] || state.names[1];
      refreshChrome();
      save();
    }
    if (!state.net.host) {
      if (message.payload.score) setScore(message.payload.score);
    }
    if (state.net.host) syncState();
    return;
  }
  if (message.type === "ACTION") {
    const module = gameModules[state.activeGame];
    if (state.net.host && module && module.remoteAction) module.remoteAction(message.payload);
    return;
  }
  if (message.type === "DOODLE") {
    if (state.activeGame === "doodle" && gameModules.doodle.remoteDoodle) gameModules.doodle.remoteDoodle(message.payload);
    return;
  }
  if (message.type === "SYNC") applyRemoteSync(message.payload);
}

function applyRemoteSync(payload) {
  if (!payload) return;
  state.net.suppress = true;
  if (payload.names) {
    state.names = state.net.host ? state.names : [state.names[0], payload.names[0] || state.names[1]];
  }
  if (payload.score) setScore(payload.score);
  if (payload.activeGame && payload.activeGame !== state.activeGame) {
    state.activeGame = payload.activeGame;
    const game = games.find((entry) => entry.id === payload.activeGame);
    $("#gameTag").textContent = game.tag;
    $("#gameTitle").textContent = game.title;
    showScreen("arenaScreen");
  }
  state.timeLeft = payload.timeLeft ?? state.timeLeft;
  if (payload.timeLeft !== undefined) {
    $("#timerText").textContent = payload.timeLeft;
    $("#timerFill").style.width = `${Math.max(0, (payload.timeLeft / state.roundLength) * 100)}%`;
  }
  if (state.activeGame && payload.module && gameModules[state.activeGame].restore) {
    gameModules[state.activeGame].restore(payload.module);
  }
  if (payload.finishedMessage && !$(".round-result")) {
    $("#gameMount").insertAdjacentHTML("afterbegin", `<div class="round-result">${payload.finishedMessage}</div>`);
  }
  if (!payload.activeGame) showScreen("lobbyScreen");
  state.net.suppress = false;
  refreshChrome();
}

function sendAction(action) {
  sendNet("ACTION", { game: state.activeGame, ...action });
}

function sendDoodle(payload) {
  sendNet("DOODLE", payload);
}

function isGuestLive() {
  return state.net.connected && !state.net.host && !state.net.suppress;
}

function closeNetwork() {
  if (state.net.conn) state.net.conn.close();
  if (state.net.peer) state.net.peer.destroy();
  state.net.peer = null;
  state.net.conn = null;
  state.net.connected = false;
  state.net.code = "";
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function sample(items) {
  return items[Math.floor(Math.random() * items.length)];
}

const gameModules = {
  quiz: {
    index: 0,
    picks: [null, null],
    start() {
      this.index = 0;
      this.picks = [null, null];
      this.render();
    },
    render() {
      const item = quizQuestions[this.index % quizQuestions.length];
      $("#gameMount").innerHTML = `
        <div class="game-panel">
          <div class="turn-banner"><span>Round ${this.index + 1} of 6</span><span>Match = both score</span></div>
          <div class="big-prompt"><strong>${item.q}</strong></div>
          <div class="choice-grid">
            ${item.a.map((answer, i) => `<button class="choice-button" data-choice="${i}" type="button">${answer}</button>`).join("")}
          </div>
          <p class="instruction" id="quizStatus">${state.names[0]} picks first, then ${state.names[1]} picks. No peeking unless you like chaos.</p>
        </div>
      `;
      $$(".choice-button").forEach((button) => button.addEventListener("click", () => this.pick(Number(button.dataset.choice), button)));
    },
    pick(choice, button) {
      if (isGuestLive()) {
        sendAction({ name: "quizPick", choice });
        button.classList.add("selected");
        $("#quizStatus").textContent = "Sent. Waiting for reveal...";
        sound.pop();
        return;
      }
      const player = this.picks[0] === null ? 0 : 1;
      this.picks[player] = choice;
      button.classList.add("selected");
      $("#quizStatus").textContent = player === 0 ? `${state.names[1]}'s pick now.` : "Revealing...";
      sound.pop();
      if (this.picks[0] !== null && this.picks[1] !== null) {
        setTimeout(() => {
          if (this.picks[0] === this.picks[1]) {
            addPoints(0, 2);
            addPoints(1, 2);
            toast("Same brain. Both get 2.");
          } else {
            toast("Different answers. Excellent evidence of personality.");
          }
          this.index += 1;
          this.picks = [null, null];
          if (this.index >= 6) finishRound(null, "Same Brain complete. The real win is the new teasing material.");
          else this.render();
          syncState();
        }, 550);
      }
    },
    remoteAction(action) {
      if (action.name === "quizPick") this.pick(action.choice, document.createElement("button"));
    },
    snapshot() {
      return { index: this.index, picks: this.picks };
    },
    restore(data) {
      this.index = data.index;
      this.picks = data.picks;
      this.render();
    }
  },

  word: {
    letters: [],
    found: [],
    turn: 0,
    start() {
      const seed = sample(wordBank).toUpperCase();
      const extra = shuffle("AEIOULNRSTCPMD".split("")).slice(0, 5);
      this.letters = shuffle([...seed, ...extra]).slice(0, 10);
      this.found = [];
      this.turn = 0;
      this.render();
      startTimer(() => finishRound(null, `Time. You found ${this.found.length} words together.`));
    },
    render() {
      $("#gameMount").innerHTML = `
        <div class="game-panel">
          <div class="turn-banner"><span>${state.names[this.turn]}'s turn</span><span>3+ letters</span></div>
          <div class="tile-grid">${this.letters.map((letter) => `<button class="letter-tile" type="button">${letter}</button>`).join("")}</div>
          <div class="answer-row">
            <input id="wordInput" autocomplete="off" placeholder="Type a word from these letters" />
            <button id="wordSubmit" class="primary-button" type="button">Score</button>
          </div>
          <div class="word-log">${this.found.map((entry) => `<span class="pill ${entry.player ? "p2" : ""}">${entry.word}</span>`).join("")}</div>
        </div>
      `;
      $("#wordSubmit").addEventListener("click", () => this.submit());
      $("#wordInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") this.submit();
      });
      $("#wordInput").focus();
    },
    submit() {
      if (isGuestLive()) {
        const guess = $("#wordInput").value.trim().toUpperCase();
        sendAction({ name: "wordSubmit", guess });
        $("#wordInput").value = "";
        return;
      }
      const input = $("#wordInput");
      const guess = input.value.trim().toUpperCase();
      if (!this.valid(guess) || this.found.some((entry) => entry.word === guess)) {
        sound.bad();
        toast("Use the shown letters, 3+ characters, no repeats.");
        input.value = "";
        return;
      }
      this.found.push({ word: guess, player: this.turn });
      addPoints(this.turn, guess.length);
      this.turn = this.turn ? 0 : 1;
      sound.pop();
      this.render();
      syncState();
    },
    valid(word) {
      if (word.length < 3) return false;
      const pool = [...this.letters];
      return [...word].every((letter) => {
        const index = pool.indexOf(letter);
        if (index < 0) return false;
        pool.splice(index, 1);
        return true;
      });
    },
    remoteAction(action) {
      if (action.name !== "wordSubmit") return;
      const savedTurn = this.turn;
      this.turn = 1;
      const guess = action.guess;
      if (this.valid(guess) && !this.found.some((entry) => entry.word === guess)) {
        this.found.push({ word: guess, player: 1 });
        addPoints(1, guess.length);
        this.turn = 0;
        this.render();
      } else {
        this.turn = savedTurn;
        syncState();
      }
    },
    snapshot() {
      return { letters: this.letters, found: this.found, turn: this.turn };
    },
    restore(data) {
      this.letters = data.letters || [];
      this.found = data.found || [];
      this.turn = data.turn || 0;
      this.render();
    }
  },

  memory: {
    deck: [],
    flipped: [],
    turn: 0,
    matches: 0,
    symbols: ["HE", "ST", "DI", "SU", "MO", "FL", "MU", "IN"],
    start() {
      this.deck = shuffle([...this.symbols, ...this.symbols]).map((symbol, index) => ({ id: index, symbol, open: false, done: false }));
      this.flipped = [];
      this.turn = 0;
      this.matches = 0;
      this.render();
    },
    render() {
      $("#gameMount").innerHTML = `
        <div class="game-panel">
          <div class="turn-banner"><span>${state.names[this.turn]}'s turn</span><span>${this.matches}/8 pairs</span></div>
          <div class="memory-grid">
            ${this.deck.map((card, i) => `
              <button class="memory-card ${card.open || card.done ? "flipped" : ""} ${card.done ? "matched" : ""}" data-card="${i}" type="button">
                <span class="front">?</span><span class="back">${card.symbol}</span>
              </button>
            `).join("")}
          </div>
        </div>
      `;
      $$(".memory-card").forEach((card) => card.addEventListener("click", () => this.flip(Number(card.dataset.card))));
    },
    flip(index) {
      if (isGuestLive()) {
        sendAction({ name: "memoryFlip", index });
        return;
      }
      const card = this.deck[index];
      if (card.done || card.open || this.flipped.length >= 2) return;
      card.open = true;
      this.flipped.push(index);
      sound.pop();
      this.render();
      syncState();
      if (this.flipped.length === 2) {
        setTimeout(() => this.resolve(), 650);
      }
    },
    resolve() {
      const [a, b] = this.flipped.map((index) => this.deck[index]);
      if (a.symbol === b.symbol) {
        a.done = true;
        b.done = true;
        this.matches += 1;
        addPoints(this.turn, 3);
        if (this.matches === 8) {
          const winner = state.score[0] === state.score[1] ? null : state.score[0] > state.score[1] ? 0 : 1;
          finishRound(winner, "Memory board cleared.");
        }
      } else {
        a.open = false;
        b.open = false;
        this.turn = this.turn ? 0 : 1;
      }
      this.flipped = [];
      this.render();
      syncState();
    },
    remoteAction(action) {
      if (action.name === "memoryFlip") this.flip(action.index);
    },
    snapshot() {
      return { deck: this.deck, flipped: this.flipped, turn: this.turn, matches: this.matches };
    },
    restore(data) {
      this.deck = data.deck || [];
      this.flipped = data.flipped || [];
      this.turn = data.turn || 0;
      this.matches = data.matches || 0;
      this.render();
    }
  },

  reaction: {
    armed: false,
    timeout: null,
    rounds: 0,
    start() {
      this.rounds = 0;
      this.next();
    },
    render() {
      $("#gameMount").innerHTML = `
        <div class="game-panel">
          <div class="turn-banner"><span>Round ${this.rounds + 1} of 7</span><span>${this.armed ? "Tap now" : "Wait for GO"}</span></div>
          <div class="reaction-grid">
            <button class="reaction-pad ${this.armed ? "go" : ""}" data-player="0" type="button">${state.names[0]}<br><small>${this.armed ? "GO" : "Hold..."}</small></button>
            <button class="reaction-pad p2 ${this.armed ? "go" : ""}" data-player="1" type="button">${state.names[1]}<br><small>${this.armed ? "GO" : "Hold..."}</small></button>
          </div>
        </div>
      `;
      $$(".reaction-pad").forEach((pad) => pad.addEventListener("click", () => this.tap(Number(pad.dataset.player))));
    },
    next() {
      clearTimeout(this.timeout);
      this.armed = false;
      this.render();
      syncState();
      this.timeout = setTimeout(() => {
        this.armed = true;
        this.render();
        sound.note(880, 0.1);
        syncState();
      }, 900 + Math.random() * 2400);
    },
    tap(player) {
      if (isGuestLive()) {
        sendAction({ name: "reactionTap", player: 1 });
        return;
      }
      clearTimeout(this.timeout);
      if (!this.armed) {
        addPoints(player ? 0 : 1, 2);
        toast(`${state.names[player]} jumped early.`);
        sound.bad();
      } else {
        addPoints(player, 2);
        toast(`${state.names[player]} snapped first.`);
        sound.pop();
      }
      this.rounds += 1;
      if (this.rounds >= 7) {
        const winner = state.score[0] === state.score[1] ? null : state.score[0] > state.score[1] ? 0 : 1;
        finishRound(winner, "Reflex Duel finished.");
      } else {
        setTimeout(() => this.next(), 900);
      }
      syncState();
    },
    remoteAction(action) {
      if (action.name === "reactionTap") this.tap(action.player);
    },
    snapshot() {
      return { armed: this.armed, rounds: this.rounds };
    },
    restore(data) {
      this.armed = data.armed;
      this.rounds = data.rounds || 0;
      this.render();
    }
  },

  palette: {
    target: "",
    round: 0,
    start() {
      this.round = 0;
      this.render();
      startTimer(() => finishRound(null, "Color Snap timer ended."));
    },
    render(generate = true) {
      const colors = shuffle(["#ff6b8a", "#3bb4ff", "#ff9f1c", "#38d9a9", "#8a5cf6", "#f72585", "#4cc9f0", "#2ec4b6", "#fb5607", "#111318"]);
      if (generate || !this.target) this.target = sample(colors);
      $("#gameMount").innerHTML = `
        <div class="game-panel">
          <div class="turn-banner"><span>Tap the outlined target color</span><span>Fast eyes win</span></div>
          <div class="palette-grid">
            ${shuffle(colors).map((color) => `<button class="palette-tile ${color === this.target ? "target" : ""}" style="background:${color}" data-color="${color}" type="button"></button>`).join("")}
          </div>
          <p class="instruction">Alternate who taps each round. If you miss, the other player gets the point.</p>
        </div>
      `;
      $$(".palette-tile").forEach((tile) => tile.addEventListener("click", () => this.pick(tile.dataset.color)));
    },
    pick(color) {
      if (isGuestLive()) {
        sendAction({ name: "palettePick", color });
        return;
      }
      const player = this.round % 2;
      if (color === this.target) {
        addPoints(player, 2);
        sound.pop();
      } else {
        addPoints(player ? 0 : 1, 1);
        sound.bad();
      }
      this.round += 1;
      this.render();
      syncState();
    },
    remoteAction(action) {
      if (action.name === "palettePick") this.pick(action.color);
    },
    snapshot() {
      return { target: this.target, round: this.round };
    },
    restore(data) {
      this.target = data.target;
      this.round = data.round || 0;
      this.render(false);
    }
  },

  story: {
    turn: 0,
    lines: [],
    prompt: "",
    start() {
      this.turn = 0;
      this.lines = [];
      this.prompt = sample(prompts);
      this.render();
    },
    render() {
      $("#gameMount").innerHTML = `
        <div class="game-panel">
          <div class="turn-banner"><span>${state.names[this.turn]}'s line</span><span>${this.lines.length}/8 lines</span></div>
          <div class="big-prompt"><strong>${this.prompt}</strong></div>
          <div class="answer-row">
            <input id="storyInput" maxlength="90" autocomplete="off" placeholder="Add one dramatic, cute, or absurd line" />
            <button id="storySubmit" class="primary-button" type="button">Add</button>
          </div>
          <div class="story-log">${this.lines.map((line) => `<span class="pill ${line.player ? "p2" : ""}">${line.text}</span>`).join("")}</div>
        </div>
      `;
      $("#storySubmit").addEventListener("click", () => this.add());
      $("#storyInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") this.add();
      });
      $("#storyInput").focus();
    },
    add() {
      if (isGuestLive()) {
        const text = $("#storyInput").value.trim();
        if (text) sendAction({ name: "storyAdd", text });
        $("#storyInput").value = "";
        return;
      }
      const text = $("#storyInput").value.trim();
      if (text.length < 2) return;
      this.lines.push({ text, player: this.turn });
      addPoints(this.turn, 1);
      this.turn = this.turn ? 0 : 1;
      if (this.lines.length >= 8) {
        finishRound(null, "Story complete. Screenshot-worthy nonsense achieved.");
      } else {
        this.render();
      }
      syncState();
    },
    remoteAction(action) {
      if (action.name !== "storyAdd") return;
      this.lines.push({ text: action.text, player: 1 });
      addPoints(1, 1);
      this.turn = 0;
      if (this.lines.length >= 8) finishRound(null, "Story complete. Screenshot-worthy nonsense achieved.");
      else this.render();
      syncState();
    },
    snapshot() {
      return { turn: this.turn, lines: this.lines, prompt: this.prompt };
    },
    restore(data) {
      this.turn = data.turn || 0;
      this.lines = data.lines || [];
      this.prompt = data.prompt || this.prompt || sample(prompts);
      this.render();
    }
  },

  doodle: {
    drawing: false,
    color: "#ff6b8a",
    size: 8,
    canvas: null,
    ctx: null,
    prompt: "",
    start() {
      if (!this.prompt) this.prompt = sample(prompts);
      $("#gameMount").innerHTML = `
        <div class="game-panel">
          <div class="turn-banner"><span>Doodle prompt</span><span>${this.prompt}</span></div>
          <div class="draw-wrap">
            <canvas id="drawCanvas" class="draw-board" width="1000" height="650"></canvas>
            <div class="draw-tools">
              <div class="color-row">
                ${["#111318", "#ff6b8a", "#3bb4ff", "#ff9f1c", "#38d9a9"].map((color) => `<button class="swatch" style="background:${color}" data-color="${color}" type="button"></button>`).join("")}
              </div>
              <label class="range-field">Brush size <input id="brushSize" type="range" min="2" max="32" value="${this.size}" /></label>
              <button id="clearCanvas" class="plain-button" type="button">Clear board</button>
              <button id="doodlePointA" class="primary-button" type="button">${state.names[0]} gets applause</button>
              <button id="doodlePointB" class="primary-button" type="button">${state.names[1]} gets applause</button>
              <p class="instruction">Draw, guess, award points manually, then restart for a new prompt.</p>
            </div>
          </div>
        </div>
      `;
      this.canvas = $("#drawCanvas");
      this.ctx = this.canvas.getContext("2d");
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";
      this.ctx.fillStyle = "#fffdf5";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.bindDrawing();
      $(".swatch").classList.add("active");
      $$(".swatch").forEach((button) => button.addEventListener("click", () => {
        this.color = button.dataset.color;
        $$(".swatch").forEach((swatch) => swatch.classList.remove("active"));
        button.classList.add("active");
      }));
      $("#brushSize").addEventListener("input", (event) => this.size = Number(event.target.value));
      $("#clearCanvas").addEventListener("click", () => {
        this.clear();
        sendDoodle({ name: "clear" });
      });
      $("#doodlePointA").addEventListener("click", () => addPoints(0, 3));
      $("#doodlePointB").addEventListener("click", () => addPoints(1, 3));
    },
    bindDrawing() {
      const pos = (event) => {
        const rect = this.canvas.getBoundingClientRect();
        const point = event.touches ? event.touches[0] : event;
        return {
          x: ((point.clientX - rect.left) / rect.width) * this.canvas.width,
          y: ((point.clientY - rect.top) / rect.height) * this.canvas.height
        };
      };
      const down = (event) => {
        event.preventDefault();
        this.drawing = true;
        const p = pos(event);
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        sendDoodle({ name: "start", x: p.x, y: p.y, color: this.color, size: this.size });
      };
      const move = (event) => {
        if (!this.drawing) return;
        event.preventDefault();
        const p = pos(event);
        this.drawTo(p.x, p.y, this.color, this.size);
        sendDoodle({ name: "draw", x: p.x, y: p.y, color: this.color, size: this.size });
      };
      const up = () => this.drawing = false;
      this.canvas.addEventListener("mousedown", down);
      this.canvas.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
      this.canvas.addEventListener("touchstart", down, { passive: false });
      this.canvas.addEventListener("touchmove", move, { passive: false });
      this.canvas.addEventListener("touchend", up);
    },
    drawTo(x, y, color, size) {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = size;
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    },
    clear() {
      this.ctx.fillStyle = "#fffdf5";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },
    remoteDoodle(payload) {
      if (!this.ctx || !payload) return;
      if (payload.name === "clear") this.clear();
      if (payload.name === "start") {
        this.ctx.beginPath();
        this.ctx.moveTo(payload.x, payload.y);
      }
      if (payload.name === "draw") this.drawTo(payload.x, payload.y, payload.color, payload.size);
    },
    snapshot() {
      return { prompt: this.prompt };
    },
    restore(data) {
      this.prompt = data.prompt || this.prompt || sample(prompts);
      if (!this.canvas) this.start();
      const banner = $(".turn-banner span:last-child");
      if (banner) banner.textContent = this.prompt;
    }
  }
};

function renderStats() {
  $("#statGames").textContent = state.stats.games;
  $("#statWinsP1").textContent = state.stats.wins[0];
  $("#statWinsP2").textContent = state.stats.wins[1];
  $("#statStreak").textContent = state.stats.bestStreak;
  $("#achievementList").innerHTML = (state.stats.achievements.length ? state.stats.achievements : ["No trophies yet. Go make some trouble."])
    .map((item) => `<div><strong>${item}</strong><br><small>Unlocked locally on this browser</small></div>`)
    .join("");
}

function celebrate(amount = 28) {
  const canvas = $("#worldCanvas");
  const event = new CustomEvent("burst", { detail: { amount, x: canvas.width / 2, y: canvas.height * 0.22 } });
  canvas.dispatchEvent(event);
  sound.win();
}

function initBackground() {
  const canvas = $("#worldCanvas");
  const ctx = canvas.getContext("2d");
  let dots = [];
  let bursts = [];

  const resize = () => {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    dots = Array.from({ length: Math.min(90, Math.floor(window.innerWidth / 14)) }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: (Math.random() * 2.6 + 0.8) * devicePixelRatio,
      vx: (Math.random() - 0.5) * 0.24 * devicePixelRatio,
      vy: (Math.random() - 0.5) * 0.24 * devicePixelRatio,
      c: sample(["#ff6b8a", "#3bb4ff", "#ff9f1c", "#38d9a9", "#ffffff"])
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dots.forEach((dot) => {
      dot.x += dot.vx;
      dot.y += dot.vy;
      if (dot.x < 0 || dot.x > canvas.width) dot.vx *= -1;
      if (dot.y < 0 || dot.y > canvas.height) dot.vy *= -1;
      ctx.globalAlpha = 0.56;
      ctx.fillStyle = dot.c;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fill();
    });
    bursts.forEach((piece) => {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.vy += 0.06 * devicePixelRatio;
      piece.life -= 1;
      ctx.globalAlpha = Math.max(0, piece.life / 80);
      ctx.fillStyle = piece.c;
      ctx.fillRect(piece.x, piece.y, piece.s, piece.s);
    });
    bursts = bursts.filter((piece) => piece.life > 0);
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  };

  canvas.addEventListener("burst", (event) => {
    for (let i = 0; i < event.detail.amount; i += 1) {
      bursts.push({
        x: event.detail.x,
        y: event.detail.y,
        vx: (Math.random() - 0.5) * 10 * devicePixelRatio,
        vy: (Math.random() - 0.9) * 10 * devicePixelRatio,
        s: (Math.random() * 8 + 4) * devicePixelRatio,
        life: 80,
        c: sample(["#ff6b8a", "#3bb4ff", "#ff9f1c", "#38d9a9", "#fffaf0"])
      });
    }
  });

  window.addEventListener("resize", resize);
  resize();
  draw();
}

function bindApp() {
  $("#playerOneInput").addEventListener("input", (event) => {
    state.names[0] = event.target.value.trim() || "You";
    refreshChrome();
    save();
  });
  $("#playerTwoInput").addEventListener("input", (event) => {
    state.names[1] = event.target.value.trim() || "Partner";
    refreshChrome();
    save();
  });
  $("#themeSelect").addEventListener("change", (event) => setTheme(event.target.value));
  $("#roundLengthSelect").addEventListener("change", (event) => {
    state.roundLength = Number(event.target.value);
    save();
  });
  $("#backBtn").addEventListener("click", () => {
    clearTimer();
    state.activeGame = null;
    showScreen("lobbyScreen");
    syncState();
  });
  $("#homeBtn").addEventListener("click", () => {
    clearTimer();
    state.activeGame = null;
    showScreen("lobbyScreen");
    syncState();
  });
  $("#resetGameBtn").addEventListener("click", () => startGame(state.activeGame));
  $("#createRoomBtn").addEventListener("click", createRoom);
  $("#joinRoomBtn").addEventListener("click", joinRoom);
  $("#roomCodeInput").addEventListener("input", (event) => {
    event.target.value = event.target.value.replace(/\D/g, "").slice(0, 4);
  });
  $("#soundBtn").addEventListener("click", () => {
    state.sound = !state.sound;
    refreshChrome();
    save();
  });
  $("#sparkBtn").addEventListener("click", () => celebrate());
  $("#statsBtn").addEventListener("click", () => {
    renderStats();
    $("#statsDialog").showModal();
  });
  $("#closeStatsBtn").addEventListener("click", () => $("#statsDialog").close());
  $("#clearStatsBtn").addEventListener("click", () => {
    state.score = [0, 0];
    state.stats = { games: 0, wins: [0, 0], bestStreak: 0, currentStreak: 0, achievements: [] };
    save();
    refreshChrome();
    renderStats();
    toast("Stats cleared.");
  });
  document.body.addEventListener("click", () => sound.unlock(), { once: true });
}

load();
setTheme(state.theme);
renderGameGrid();
refreshChrome();
bindApp();
initBackground();
