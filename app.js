// ═══════════════════════════════════════════════════════
// Mayim — Tigrinya Party Game  |  app.js
// ═══════════════════════════════════════════════════════

'use strict';

// ── Audio stubs ────────────────────────────────────────
// Replace empty bodies with your own Audio() calls.
function playTickSound()    { /* const a = new Audio('assets/tick.mp3');    a.play(); */ }
function playBuzzerSound()  { /* const a = new Audio('assets/buzzer.mp3'); a.play(); */ }
function playCorrectSound() { /* const a = new Audio('assets/ding.mp3');   a.play(); */ }

// ── Haptic helper ──────────────────────────────────────
function vibrate(pattern) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

// ── Defaults ───────────────────────────────────────────
const STORAGE_KEY  = 'mayim_state';
const NAMES_KEY    = 'mayim_team_names';
const WORDS_CACHE_KEY = 'mayim_words_cache';
const WORDS_CACHE_TTL = 86400000; // 24 hours in ms

const DEFAULTS = {
  totalRounds:    3,
  wordsPerRound:    10,
  proverbsPerRound: 10,
  secondsPerWord: 6,
  teamNames:     ['Team Asmara', 'Team Massawa'],
};

// ── Supabase Configuration ──────────────────────────────
// These are public credentials (anon key) — safe for frontend
// Get from: https://supabase.com/dashboard → Settings → API
const SUPABASE_URL = 'https://rzcrdngpybrsjlbenqep.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Y3JkbmdweWJyc2psYmVucWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMDU4MDMsImV4cCI6MjA5MDg4MTgwM30.ILN4ZrvMX5sfbd8mCnnnal9-U4ojQ-SVYTUuS1QoqaE';

// Use _supabase (not 'supabase') to avoid collision with window.supabase global from CDN
let _supabase = null;

// Initialize Supabase client (after window.supabase is loaded via CDN)
function initSupabase() {
  if (window.supabase) {
    _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}

// ── Fetch Words from Supabase ───────────────────────────
let gameWords = [];

async function fetchWordsFromSupabase() {
  try {
    // Check local cache first
    const cached = localStorage.getItem(WORDS_CACHE_KEY);
    const cacheTime = localStorage.getItem(WORDS_CACHE_KEY + '_time');

    if (cached && cacheTime && Date.now() - parseInt(cacheTime) < WORDS_CACHE_TTL) {
      console.log('✓ Using cached words (24h TTL)');
      return JSON.parse(cached);
    }

    // Fetch from Supabase
    if (!_supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await _supabase
      .from('words')
      .select('*');

    if (error) throw error;

    // Cache locally
    localStorage.setItem(WORDS_CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(WORDS_CACHE_KEY + '_time', Date.now().toString());

    console.log(`✓ Fetched ${data.length} words from Supabase`);
    return data;
  } catch (err) {
    console.warn('⚠ Failed to fetch from Supabase:', err);

    // Fallback: use cached words if available
    const cached = localStorage.getItem(WORDS_CACHE_KEY);
    if (cached) {
      console.log('✓ Using offline cached words');
      return JSON.parse(cached);
    }

    // Last resort: use hardcoded WORDS array from words.js
    console.log('✓ Using fallback words.js array');
    return WORDS;
  }
}

// Initialize words on app load
async function initializeWords() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.remove('hidden');

  gameWords = await fetchWordsFromSupabase();

  if (overlay) overlay.classList.add('hidden');
}

// ── Team name persistence ──────────────────────────────
function saveTeamNames(n0, n1) {
  try { localStorage.setItem(NAMES_KEY, JSON.stringify([n0, n1])); } catch (_) {}
}
function loadTeamNames() {
  try {
    const raw = localStorage.getItem(NAMES_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    if (Array.isArray(arr) && arr.length === 2 &&
        typeof arr[0] === 'string' && typeof arr[1] === 'string') {
      return arr;
    }
  } catch (_) {}
  return DEFAULTS.teamNames;
}

// ── Central game state ─────────────────────────────────
// Teams alternate every word; each team has their own word log.
const _savedNames = loadTeamNames();
let gameState = {
  phase:           'setup',
  mode:            'words',        // 'words' | 'proverbs'
  teams: [
    { name: _savedNames[0], score: 0, correctWords: [], skippedWords: [] },
    { name: _savedNames[1], score: 0, correctWords: [], skippedWords: [] },
  ],
  totalRounds:    DEFAULTS.totalRounds,
  wordsPerRound:    DEFAULTS.wordsPerRound,
  proverbsPerRound: DEFAULTS.proverbsPerRound,
  secondsPerWord: DEFAULTS.secondsPerWord,
  turnDuration:     DEFAULTS.wordsPerRound * DEFAULTS.secondsPerWord,
  currentRound:   1,
  wordTeamIndex:  0,
  deck:           [],
  usedWords:      [],
  currentWord:    null,
  wordTimeLeft:   DEFAULTS.secondsPerWord,
  // ── Proverb mode state ──────────────────
  proverbDeck:     [],
  usedProverbs:    [],
  currentProverb:  null,
  proverbRevealed: false,
  proverbTimeLeft: 0,
};

// ── setState / render ──────────────────────────────────
function setState(newPhase, payload = {}) {
  if (newPhase !== 'playing') stopWordTimer();
  if (newPhase !== 'proverb') stopProverbTimer();
  Object.assign(gameState, { phase: newPhase }, payload);
  saveState();
  render();
}

function render() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screenMap = {
    setup:        'screen-setup',
    interstitial: 'screen-interstitial',
    playing:      'screen-playing',
    proverb:      'screen-proverb',
    roundSummary: 'screen-summary',
    winner:       'screen-winner',
  };
  const id = screenMap[gameState.phase];
  if (id) document.getElementById(id).classList.add('active');
  renderers[gameState.phase]?.();
}

const renderers = {
  setup:        renderSetup,
  interstitial: renderInterstitial,
  playing:      renderPlaying,
  proverb:      renderProverb,
  roundSummary: renderSummary,
  winner:       renderWinner,
};

// ── Persistence ────────────────────────────────────────
function saveState() {
  try {
    const serialisable = { ...gameState };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialisable));
  } catch (_) {}
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function clearSavedState() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Strict resumability check ──────────────────────────
// Returns true ONLY when the saved object represents a real
// in-progress game that makes sense to resume.
function isResumable(saved) {
  if (!saved || typeof saved !== 'object')          return false;
  // These phases have nothing to resume
  if (['setup', 'winner'].includes(saved.phase))    return false;
  if (!saved.phase)                                  return false;
  // Must have two named teams
  if (!Array.isArray(saved.teams) || saved.teams.length !== 2) return false;
  if (!saved.teams.every(t => t && typeof t.name === 'string')) return false;
  // Must have coherent round numbers
  if (typeof saved.totalRounds  !== 'number' || saved.totalRounds  < 1) return false;
  if (typeof saved.currentRound !== 'number' || saved.currentRound < 1) return false;
  if (saved.currentRound > saved.totalRounds) return false;
  return true;
}

// ── Full state reset to defaults ───────────────────────
function resetToDefaults() {
  stopWordTimer();
  clearSavedState();
  // Preserve team names across games
  const names = loadTeamNames();
  Object.assign(gameState, {
    phase:           'setup',
    mode:            'words',
    teams: [
      { name: names[0], score: 0, correctWords: [], skippedWords: [] },
      { name: names[1], score: 0, correctWords: [], skippedWords: [] },
    ],
    totalRounds:    DEFAULTS.totalRounds,
    wordsPerRound:    DEFAULTS.wordsPerRound,
    proverbsPerRound: DEFAULTS.proverbsPerRound,
    secondsPerWord: DEFAULTS.secondsPerWord,
    turnDuration:     DEFAULTS.wordsPerRound * DEFAULTS.secondsPerWord,
    currentRound:   1,
    wordTeamIndex:  0,
    deck:            [],
    usedWords:       [],
    currentWord:     null,
    wordTimeLeft:    DEFAULTS.secondsPerWord,
    proverbDeck:     [],
    usedProverbs:    [],
    currentProverb:  null,
    proverbRevealed: false,
  });
}

// ── Word deck helpers ──────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck() {
  // Always use an even count so both teams get equal cards
  const deckSize = Math.floor(gameState.wordsPerRound / 2) * 2;

  const usedSet = new Set(gameState.usedWords.map(w => w.word));
  let available = gameWords.filter(w => !usedSet.has(w.word));

  // Recycle pool when too few words remain
  if (available.length < deckSize) {
    gameState.usedWords = [];
    available = [...gameWords];
  }

  return shuffle(available).slice(0, deckSize);
}

// ── Proverb deck helpers ───────────────────────────────
// Masking algorithm — spec:
//   wordCount == 3 → show first 2, mask last 1
//   wordCount >  3 → show first 50% (floor), mask rest
//   wordCount <= 2 → show first 1, mask last 1 (fallback)
function getMaskedProverb(proverbString) {
  const words = proverbString.trim().split(/\s+/);
  const count = words.length;
  let visibleCount;
  if      (count <= 2) visibleCount = 1;
  else if (count === 3) visibleCount = 2;
  else                  visibleCount = Math.floor(count / 2);
  return {
    visible: words.slice(0, visibleCount),
    hidden:  words.slice(visibleCount),
  };
}

function buildProverbDeck() {
  const deckSize  = Math.floor(gameState.proverbsPerRound / 2) * 2;
  const usedSet   = new Set((gameState.usedProverbs || []).map(p => p.tigrinya));
  let available   = PROVERBS.filter(p => !usedSet.has(p.tigrinya));
  if (available.length < deckSize) {
    gameState.usedProverbs = [];
    available = [...PROVERBS];
  }
  return shuffle(available).slice(0, deckSize);
}

// ── Per-word Timer ─────────────────────────────────────
// Each word gets exactly secondsPerWord seconds.
// If time runs out, the word is auto-skipped.

let _wordTimer = null;

function computeTurnDuration() {
  return gameState.wordsPerRound * gameState.secondsPerWord;
}

function stopWordTimer() {
  if (_wordTimer) { clearInterval(_wordTimer); _wordTimer = null; }
}

function startWordTimer() {
  gameState.wordTimeLeft = gameState.secondsPerWord;
  updateTimerUI();
  _wordTimer = setInterval(() => {
    gameState.wordTimeLeft -= 1;
    updateTimerUI();
    if (gameState.wordTimeLeft <= 3 && gameState.wordTimeLeft > 0) playTickSound();
    if (gameState.wordTimeLeft <= 0) {
      stopWordTimer();
      // Auto-skip — time ran out for this word
      if (gameState.currentWord) {
        gameState.teams[gameState.wordTeamIndex].skippedWords.push(gameState.currentWord);
        gameState.usedWords.push(gameState.currentWord);
        vibrate(50);
        saveState();
      }
      pauseForNextWord('skip');
    }
  }, 1000);
}

// ── Pause between words ────────────────────────────────
// Called after every word result (correct / skip / timeout).
// Shows the result badge + "Next Word" button.
// The next word only starts when the user taps "Next Word".
function pauseForNextWord(result) {
  stopWordTimer();

  // Show result badge
  const badge = document.getElementById('word-result-badge');
  if (badge) {
    badge.textContent = result === 'correct' ? '✓ Correct!' : '✕ Time up — Skipped';
    badge.className   = result === 'correct' ? 'result-correct' : 'result-skip';
  }

  // Swap button areas
  const screen = document.getElementById('screen-playing');
  if (screen) screen.classList.add('word-paused');

  // Check if this was the last word in the deck
  const nwBtn = document.getElementById('btn-next-word');
  if (gameState.deck.length === 0) {
    if (nwBtn) nwBtn.textContent = 'End Round →';
  } else {
    // Show which team plays next
    const nextTeam = gameState.teams[1 - gameState.wordTeamIndex].name;
    if (nwBtn) nwBtn.textContent = `→ ${nextTeam}'s Turn`;
  }
}

function updateTimerUI() {
  const el   = document.getElementById('timer-display');
  const prog = document.getElementById('timer-progress');
  if (!el || !prog) return;
  const t   = Math.max(0, gameState.wordTimeLeft ?? gameState.secondsPerWord);
  const dur = gameState.secondsPerWord;
  el.textContent   = t;
  prog.style.width = ((t / dur) * 100) + '%';
  const danger = t <= 3;
  el.classList.toggle('danger', danger);
  prog.classList.toggle('danger', danger);
}

// ── Per-proverb Timer ──────────────────────────────────
let _proverbTimer = null;

function stopProverbTimer() {
  if (_proverbTimer) { clearInterval(_proverbTimer); _proverbTimer = null; }
}

function startProverbTimer() {
  stopProverbTimer();
  gameState.proverbTimeLeft = gameState.secondsPerWord;
  updateProverbTimerUI();
  // Hide start button once running
  document.getElementById('btn-proverb-start-timer')?.classList.add('hidden');
  _proverbTimer = setInterval(() => {
    gameState.proverbTimeLeft -= 1;
    updateProverbTimerUI();
    if (gameState.proverbTimeLeft <= 3 && gameState.proverbTimeLeft > 0) playTickSound();
    if (gameState.proverbTimeLeft <= 0) {
      stopProverbTimer();
      playBuzzerSound();
      vibrate([200, 100, 200]);
    }
  }, 1000);
}

function updateProverbTimerUI() {
  const el   = document.getElementById('proverb-timer-display');
  const fill = document.getElementById('proverb-timer-progress');
  if (!el) return;
  const t   = Math.max(0, gameState.proverbTimeLeft);
  const dur = gameState.secondsPerWord;
  el.textContent = t;
  el.classList.toggle('danger', t <= 3);
  if (fill) {
    fill.style.width = ((t / dur) * 100) + '%';
    fill.classList.toggle('danger', t <= 3);
  }
}

// ── Game flow ──────────────────────────────────────────
function startGame() {
  const turnDuration = computeTurnDuration();
  const startTeam    = Math.random() < 0.5 ? 0 : 1;
  const basePayload  = {
    currentRound:    1,
    wordTeamIndex:   startTeam,
    turnDuration,
    teams:           gameState.teams.map(t => ({ ...t, score: 0, correctWords: [], skippedWords: [] })),
    usedWords:       [],
    usedProverbs:    [],
    currentWord:     null,
    currentProverb:  null,
    proverbRevealed: false,
    wordTimeLeft:    gameState.secondsPerWord,
  };
  if (gameState.mode === 'proverbs') {
    setState('interstitial', { ...basePayload, proverbDeck: buildProverbDeck() });
  } else {
    setState('interstitial', { ...basePayload, deck: buildDeck() });
  }
}

function beginPlaying() {
  setState('playing', {});
  showNextWord();   // showNextWord calls startWordTimer internally
}

function showNextWord() {
  // Clear paused state
  const screen = document.getElementById('screen-playing');
  if (screen) screen.classList.remove('word-paused');
  const badge = document.getElementById('word-result-badge');
  if (badge) { badge.textContent = ''; badge.className = ''; }

  stopWordTimer();

  if (gameState.deck.length === 0) {
    endRound();
    return;
  }

  const word = gameState.deck.pop();
  gameState.currentWord = word;

  // Update active team display (changes every word)
  const activeTeamEl = document.getElementById('playing-active-team');
  if (activeTeamEl) activeTeamEl.textContent = gameState.teams[gameState.wordTeamIndex].name;
  const stripTeamEl  = document.getElementById('playing-team-label');
  if (stripTeamEl)  stripTeamEl.textContent  = gameState.teams[gameState.wordTeamIndex].name;

  const el      = document.getElementById('current-word');
  const hint    = document.getElementById('current-word-hint');
  const counter = document.getElementById('word-counter');

  el.classList.remove('word-pop');
  void el.offsetWidth;
  el.classList.add('word-pop');

  el.textContent   = word.word;
  hint.textContent = word.latin + ' — ' + word.english;

  // Total cards used across both teams
  const done = gameState.teams[0].correctWords.length + gameState.teams[0].skippedWords.length
             + gameState.teams[1].correctWords.length + gameState.teams[1].skippedWords.length;
  const total = Math.floor(gameState.wordsPerRound / 2) * 2;
  if (counter) counter.textContent = `${done + 1} / ${total}`;

  startWordTimer();
}

function markCorrect() {
  if (!gameState.currentWord) return;
  stopWordTimer();
  vibrate(100);
  playCorrectSound();
  gameState.teams[gameState.wordTeamIndex].correctWords.push(gameState.currentWord);
  gameState.usedWords.push(gameState.currentWord);
  flashFeedback('correct');
  saveState();
  pauseForNextWord('correct');
}

function markSkip() {
  if (!gameState.currentWord) return;
  stopWordTimer();
  gameState.teams[gameState.wordTeamIndex].skippedWords.push(gameState.currentWord);
  gameState.usedWords.push(gameState.currentWord);
  flashFeedback('skip');
  saveState();
  pauseForNextWord('skip');
}

function flashFeedback(type) {
  document.body.classList.remove('flash-correct', 'flash-skip');
  void document.body.offsetWidth;
  document.body.classList.add('flash-' + type);
  setTimeout(() => document.body.classList.remove('flash-' + type), 350);
}

// ── Proverb mode game flow ─────────────────────────────
function showNextProverb() {
  if (gameState.proverbDeck.length === 0) {
    endRound();
    return;
  }
  const proverb = gameState.proverbDeck.pop();
  gameState.currentProverb  = proverb;
  gameState.proverbRevealed = false;
  saveState();

  const team    = gameState.teams[gameState.wordTeamIndex];
  const counter = gameState.usedProverbs.length + 1;
  const total   = gameState.usedProverbs.length + gameState.proverbDeck.length + 1;

  const teamEl = document.getElementById('proverb-active-team');
  if (teamEl) teamEl.textContent = team.name;

  const counterEl = document.getElementById('proverb-counter');
  if (counterEl) counterEl.textContent = `${counter} / ${total}`;

  // Masked display
  _renderMaskedProverb(proverb);

  // Reset timer to idle (show configured seconds, not running)
  stopProverbTimer();
  gameState.proverbTimeLeft = gameState.secondsPerWord;
  const timerEl = document.getElementById('proverb-timer-display');
  if (timerEl) {
    timerEl.textContent = gameState.secondsPerWord;
    timerEl.classList.remove('danger');
  }
  const fillEl = document.getElementById('proverb-timer-progress');
  if (fillEl) { fillEl.style.width = '100%'; fillEl.classList.remove('danger'); }
  document.getElementById('btn-proverb-start-timer')?.classList.remove('hidden');

  // State A (Start Timer + Show Answer), hide State B (judge) and answer
  document.getElementById('proverb-actions-show')?.classList.remove('hidden');
  document.getElementById('proverb-actions-judge')?.classList.add('hidden');
  document.getElementById('proverb-answer')?.classList.add('hidden');
  document.getElementById('proverb-translation')?.classList.add('hidden');
}

function _renderMaskedProverb(proverb) {
  const { visible, hidden } = getMaskedProverb(proverb.tigrinya);

  const visibleHtml = visible.map(w => `<span class="proverb-word">${w}</span>`).join(' ');
  const hiddenHtml  = hidden.map(() => `<span class="proverb-blank">___</span>`).join(' ');

  const displayEl = document.getElementById('proverb-display');
  if (displayEl) {
    displayEl.innerHTML = visibleHtml + (hidden.length ? ' ' + hiddenHtml : '');
  }
}

function revealProverb() {
  if (!gameState.currentProverb) return;
  stopProverbTimer();
  gameState.proverbRevealed = true;
  saveState();

  const p = gameState.currentProverb;

  // Full Ge'ez text
  const displayEl = document.getElementById('proverb-display');
  if (displayEl) {
    const words = p.tigrinya.trim().split(/\s+/);
    displayEl.innerHTML = words.map(w => `<span class="proverb-word">${w}</span>`).join(' ');
  }

  // Show latin romanization + english meaning
  const answerEl = document.getElementById('proverb-answer');
  if (answerEl) {
    answerEl.textContent = p.latin;
    answerEl.classList.remove('hidden');
  }
  const translationEl = document.getElementById('proverb-translation');
  if (translationEl) {
    translationEl.textContent = p.english;
    translationEl.classList.remove('hidden');
  }

  // State A → State B
  document.getElementById('proverb-actions-show')?.classList.add('hidden');
  document.getElementById('proverb-actions-judge')?.classList.remove('hidden');
}

function judgeProverb(result) {
  if (!gameState.currentProverb) return;

  gameState.usedProverbs.push(gameState.currentProverb);

  if (result === 'correct') {
    vibrate(100);
    playCorrectSound();
    gameState.teams[gameState.wordTeamIndex].score++;
    gameState.teams[gameState.wordTeamIndex].correctWords.push(gameState.currentProverb);
    flashFeedback('correct');
  } else {
    gameState.teams[gameState.wordTeamIndex].skippedWords.push(gameState.currentProverb);
    flashFeedback('skip');
  }

  gameState.currentProverb  = null;
  gameState.proverbRevealed = false;
  // Alternate teams between proverbs
  gameState.wordTeamIndex = 1 - gameState.wordTeamIndex;

  saveState();

  if (gameState.proverbDeck.length === 0) {
    endRound();
  } else {
    showNextProverb();
  }
}

function renderProverb() {
  if (!gameState.currentProverb) return;
  const team = gameState.teams[gameState.wordTeamIndex];

  const teamEl = document.getElementById('proverb-active-team');
  if (teamEl) teamEl.textContent = team.name;

  const counter = gameState.usedProverbs.length + 1;
  const total   = gameState.usedProverbs.length + gameState.proverbDeck.length + 1;
  const counterEl = document.getElementById('proverb-counter');
  if (counterEl) counterEl.textContent = `${counter} / ${total}`;

  if (gameState.proverbRevealed) {
    revealProverb();
  } else {
    _renderMaskedProverb(gameState.currentProverb);
    document.getElementById('proverb-actions-show')?.classList.remove('hidden');
    document.getElementById('proverb-actions-judge')?.classList.add('hidden');
    document.getElementById('proverb-answer')?.classList.add('hidden');
    document.getElementById('proverb-translation')?.classList.add('hidden');
  }
}

function endRound() {
  stopWordTimer();
  vibrate([200, 100, 200]);
  playBuzzerSound();
  // Word mode: tally scores from correctWords (proverb mode increments scores live)
  if (gameState.mode !== 'proverbs') {
    gameState.teams[0].score += gameState.teams[0].correctWords.length;
    gameState.teams[1].score += gameState.teams[1].correctWords.length;
  }
  setState('roundSummary', {});
}

// ── Round progression ──────────────────────────────────
// One summary per round (both teams played alternating words).
// Random team starts each new round.
function nextRound() {
  const nextRoundNum = gameState.currentRound + 1;
  if (nextRoundNum > gameState.totalRounds) {
    setState('winner', {});
  } else {
    const startTeam   = Math.random() < 0.5 ? 0 : 1;
    const basePayload = {
      currentRound:    nextRoundNum,
      wordTeamIndex:   startTeam,
      teams:           gameState.teams.map(t => ({ ...t, correctWords: [], skippedWords: [] })),
      currentWord:     null,
      currentProverb:  null,
      proverbRevealed: false,
      wordTimeLeft:    gameState.secondsPerWord,
    };
    if (gameState.mode === 'proverbs') {
      setState('interstitial', { ...basePayload, proverbDeck: buildProverbDeck() });
    } else {
      setState('interstitial', { ...basePayload, deck: buildDeck() });
    }
  }
}

function playAgain() {
  clearSavedState();
  window.location.href = 'index.html';
}

// ── Renderers ──────────────────────────────────────────
function renderSetup() {
  document.getElementById('team1-name').value           = gameState.teams[0].name;
  document.getElementById('team2-name').value           = gameState.teams[1].name;
  document.getElementById('rounds-display').textContent = gameState.totalRounds;

  const isProverbs = gameState.mode === 'proverbs';

  // Mode-specific header branding
  const titleEl    = document.getElementById('setup-game-title');
  const geezEl     = document.getElementById('setup-geez-title');
  const subtitleEl = document.getElementById('setup-game-subtitle');
  if (titleEl)    titleEl.textContent    = isProverbs ? 'MISLA'            : 'MAYIM';
  if (geezEl)     geezEl.textContent     = isProverbs ? 'ምስላ'              : 'ማይም';
  if (subtitleEl) subtitleEl.textContent = isProverbs ? 'Tigrinya · Proverbs · Game' : 'Tigrinya · Party · Game';

  // Hide word-mode-only config rows in proverb mode
  const wordConfigRows = document.getElementById('word-config-rows');
  if (wordConfigRows) wordConfigRows.classList.toggle('hidden', isProverbs);

  // Show proverb-mode-only config rows in proverb mode
  const proverbConfigRows = document.getElementById('proverb-config-rows');
  if (proverbConfigRows) proverbConfigRows.classList.toggle('hidden', !isProverbs);

  // Update stepper displays
  document.getElementById('secs-display').textContent = gameState.secondsPerWord;
  if (!isProverbs) {
    document.getElementById('words-display').textContent    = gameState.wordsPerRound;
  } else {
    document.getElementById('proverbs-display').textContent = gameState.proverbsPerRound;
  }

  // Rename secs label for proverb mode
  const secsLabelEl = document.getElementById('secs-label');
  if (secsLabelEl) secsLabelEl.textContent = isProverbs ? 'Secs / Proverb' : 'Secs / Word';

  updateSetupComputed();
  updateProverbSetupComputed();
  checkResumeBanner();
}

function updateSetupComputed() {
  const deckSize = Math.floor(gameState.wordsPerRound / 2) * 2;
  const perTeam  = deckSize / 2;
  const el = document.getElementById('computed-turn-time');
  if (el) el.textContent = `${deckSize} cards · ${perTeam} per team · ${gameState.secondsPerWord}s each`;
}

function updateProverbSetupComputed() {
  const total  = Math.floor(gameState.proverbsPerRound / 2) * 2;
  const perTeam = total / 2;
  const el = document.getElementById('computed-proverb-time');
  if (el) el.textContent = `${total} proverbs · ${perTeam} per team · ${gameState.secondsPerWord}s each`;
}

function checkResumeBanner() {
  const saved  = loadSavedState();
  const banner = document.getElementById('resume-banner');
  if (!banner) return;

  if (isResumable(saved)) {
    // Show team names from the saved game for context
    const t0 = saved.teams?.[0]?.name || '';
    const t1 = saved.teams?.[1]?.name || '';
    const label = document.getElementById('resume-game-info');
    if (label && t0 && t1) {
      label.textContent = `${t0} vs ${t1}  ·  Round ${saved.currentRound}/${saved.totalRounds}`;
    }
    banner.classList.add('visible');
  } else {
    banner.classList.remove('visible');
    if (saved) clearSavedState();   // silently nuke any stale/corrupt save
  }
}

function renderInterstitial() {
  const startTeam = gameState.teams[gameState.wordTeamIndex];
  document.getElementById('interstitial-round-label').textContent =
    `Round ${gameState.currentRound} of ${gameState.totalRounds}`;
  document.getElementById('interstitial-team-name').textContent = startTeam.name;

  const teamLabel = document.getElementById('interstitial-team-label');
  if (teamLabel) teamLabel.textContent = 'Goes First — Teams Alternate';

  // CTA button — mode-specific label
  const btn = document.getElementById('btn-start-timer');
  if (btn) {
    if (gameState.mode === 'proverbs') {
      const count = gameState.proverbDeck.length;
      btn.textContent = `▶ Start · ${count} proverbs`;
    } else {
      const deckSize = Math.floor(gameState.wordsPerRound / 2) * 2;
      btn.textContent = `▶ Start · ${deckSize} cards · ${gameState.secondsPerWord}s each`;
    }
  }

  // Score bar — highlight the starting team
  const s0 = document.getElementById('inter-score-0');
  const s1 = document.getElementById('inter-score-1');
  if (s0 && s1) {
    s0.querySelector('.spec-dim-name').textContent = gameState.teams[0].name;
    s0.querySelector('.spec-dim-val').textContent  = gameState.teams[0].score;
    s1.querySelector('.spec-dim-name').textContent = gameState.teams[1].name;
    s1.querySelector('.spec-dim-val').textContent  = gameState.teams[1].score;
    s0.classList.toggle('active', gameState.wordTeamIndex === 0);
    s1.classList.toggle('active', gameState.wordTeamIndex === 1);
  }
}

function renderPlaying() {
  const team = gameState.teams[gameState.wordTeamIndex];
  const el   = document.getElementById('playing-team-label');
  if (el) el.textContent = team.name;
  const activeEl = document.getElementById('playing-active-team');
  if (activeEl) activeEl.textContent = team.name;
  updateTimerUI();
}

function renderSummary() {
  const [t0, t1] = gameState.teams;
  const pts0 = t0.correctWords.length;
  const pts1 = t1.correctWords.length;

  document.getElementById('summary-round-label').textContent =
    `Round ${gameState.currentRound} of ${gameState.totalRounds}`;

  document.getElementById('summary-pts-0').textContent   = t0.score;
  document.getElementById('summary-pts-1').textContent   = t1.score;
  document.getElementById('summary-name-0').textContent  = t0.name;
  document.getElementById('summary-name-1').textContent  = t1.name;
  document.getElementById('summary-delta-0').textContent = `+${pts0} this round`;
  document.getElementById('summary-delta-1').textContent = `+${pts1} this round`;
  document.getElementById('summary-t0-heading').textContent = t0.name;
  document.getElementById('summary-t1-heading').textContent = t1.name;

  const renderList = (id, words) => {
    const el = document.getElementById(id);
    el.innerHTML = words.length
      ? words.map(w => `<div class="word-entry">${w.tigrinya || w.word}</div>`).join('')
      : '<div class="word-entry empty">—</div>';
  };
  renderList('correct-word-list-0', t0.correctWords);
  renderList('skipped-word-list-0', t0.skippedWords);
  renderList('correct-word-list-1', t1.correctWords);
  renderList('skipped-word-list-1', t1.skippedWords);

  const isFinalRound = gameState.currentRound >= gameState.totalRounds;
  const nextBtn = document.getElementById('btn-next-round');
  if (nextBtn) nextBtn.textContent = isFinalRound ? 'See Final Results' : 'Next Round →';
}

function renderWinner() {
  const [t0, t1] = gameState.teams;
  let winner = null;
  if      (t0.score > t1.score) winner = t0;
  else if (t1.score > t0.score) winner = t1;

  const nameEl = document.getElementById('winner-team-name');
  const trophy = document.querySelector('.winner-trophy-inline');

  nameEl.textContent       = winner ? `${winner.name} Wins` : "It's a Tie";
  if (trophy) trophy.textContent = winner ? '🏆' : '🤝';

  const f0 = document.getElementById('final-score-0');
  const f1 = document.getElementById('final-score-1');
  if (f0 && f1) {
    f0.querySelector('.f-name').textContent = t0.name;
    f0.querySelector('.f-val').textContent  = t0.score;
    f1.querySelector('.f-name').textContent = t1.name;
    f1.querySelector('.f-val').textContent  = t1.score;
    f0.classList.toggle('winner', t0.score > t1.score);
    f1.classList.toggle('winner', t1.score > t0.score);
  }

  clearSavedState();
}

// ── Stepper factory ────────────────────────────────────
// DRY helper that wires +/− buttons to a gameState key.
function makeStepper(minusId, plusId, displayId, key, min, max, onChange) {
  document.getElementById(minusId).addEventListener('click', () => {
    if (gameState[key] > min) {
      gameState[key]--;
      document.getElementById(displayId).textContent = gameState[key];
      onChange?.();
    }
  });
  document.getElementById(plusId).addEventListener('click', () => {
    if (gameState[key] < max) {
      gameState[key]++;
      document.getElementById(displayId).textContent = gameState[key];
      onChange?.();
    }
  });
}

// ── Ready countdown ────────────────────────────────────
function showCountdown(callback) {
  const overlay = document.getElementById('countdown-overlay');
  const el      = document.getElementById('countdown-number');

  // Graceful fallback: stale cached HTML won't have the overlay element
  if (!overlay || !el) { callback(); return; }

  const steps   = ['3', '2', '1', 'GO!'];
  let i = 0;

  overlay.classList.add('active');

  function tick() {
    const isGo = steps[i] === 'GO!';
    el.textContent = steps[i];
    el.classList.remove('animating', 'countdown-go');
    void el.offsetWidth;                    // force reflow → restart animation
    el.classList.add('animating');
    if (isGo) el.classList.add('countdown-go');

    i++;
    if (i < steps.length) {
      setTimeout(tick, 950);
    } else {
      setTimeout(() => {
        overlay.classList.remove('active');
        callback();
      }, 800);
    }
  }
  tick();
}

// ── Event wiring ───────────────────────────────────────
function wireEvents() {
  // ── Setup steppers ──────────────────────────────────
  makeStepper('btn-rounds-minus', 'btn-rounds-plus',
              'rounds-display', 'totalRounds', 1, 10, null);

  makeStepper('btn-words-minus',  'btn-words-plus',
              'words-display',  'wordsPerRound', 3, 20, updateSetupComputed);

  makeStepper('btn-secs-minus',   'btn-secs-plus',
              'secs-display',   'secondsPerWord',    3, 30, () => { updateSetupComputed(); updateProverbSetupComputed(); });

  makeStepper('btn-proverbs-minus', 'btn-proverbs-plus',
              'proverbs-display', 'proverbsPerRound', 2, 25, updateProverbSetupComputed);

  // ── Start game ──────────────────────────────────────
  document.getElementById('btn-start-game').addEventListener('click', () => {
    const n0 = document.getElementById('team1-name').value.trim() || DEFAULTS.teamNames[0];
    const n1 = document.getElementById('team2-name').value.trim() || DEFAULTS.teamNames[1];
    saveTeamNames(n0, n1);   // remember for next game
    gameState.teams[0] = { name: n0, score: 0, correctWords: [], skippedWords: [] };
    gameState.teams[1] = { name: n1, score: 0, correctWords: [], skippedWords: [] };
    gameState.turnDuration = computeTurnDuration();
    showCountdown(() => startGame());
  });

  // ── Resume ──────────────────────────────────────────
  document.getElementById('btn-resume').addEventListener('click', () => {
    const saved = loadSavedState();
    if (!isResumable(saved)) return;
    Object.assign(gameState, saved);
    render();
    // If resuming mid-word, restart from the beginning of the current word/proverb
    if (gameState.phase === 'playing') {
      showNextWord();
    } else if (gameState.phase === 'proverb') {
      showNextProverb();
    }
  });

  // ── New game from resume banner ─────────────────────
  // BUG FIX: previously only hid the banner; now fully resets state
  document.getElementById('btn-new-from-resume').addEventListener('click', () => {
    resetToDefaults();
    render();   // re-renders setup with fresh default form values
  });

  // ── Mode toggle ─────────────────────────────────────
  document.getElementById('btn-mode-words')?.addEventListener('click', () => {
    gameState.mode = 'words';
    renderSetup();
  });
  document.getElementById('btn-mode-proverbs')?.addEventListener('click', () => {
    gameState.mode = 'proverbs';
    renderSetup();
  });

  // ── Interstitial ────────────────────────────────────
  document.getElementById('btn-back-to-setup').addEventListener('click', () => {
    stopWordTimer();
    setState('setup', {});
  });
  document.getElementById('btn-start-timer').addEventListener('click', () => {
    if (gameState.mode === 'proverbs') {
      // Switch to proverb screen first, then load the first proverb
      gameState.phase = 'proverb';
      saveState();
      render();
      showNextProverb();
    } else {
      beginPlaying();
    }
  });

  // ── Playing ─────────────────────────────────────────
  document.getElementById('btn-correct').addEventListener('click', markCorrect);
  document.getElementById('btn-skip').addEventListener('click', markSkip);
  document.getElementById('btn-next-word').addEventListener('click', () => {
    if (gameState.deck.length === 0) {
      endRound();
    } else {
      // Flip to the other team before showing next word
      gameState.wordTeamIndex = 1 - gameState.wordTeamIndex;
      showNextWord();
    }
  });

  // ── Proverb screen ──────────────────────────────────
  document.getElementById('btn-proverb-start-timer')?.addEventListener('click', startProverbTimer);
  document.getElementById('btn-show-answer')?.addEventListener('click', revealProverb);
  document.getElementById('btn-proverb-correct')?.addEventListener('click', () => judgeProverb('correct'));
  document.getElementById('btn-proverb-wrong')?.addEventListener('click',   () => judgeProverb('wrong'));
  document.getElementById('btn-quit-proverb')?.addEventListener('click', showQuitModal);

  // ── Summary ─────────────────────────────────────────
  document.getElementById('btn-next-round').addEventListener('click', nextRound);

  // ── Winner ──────────────────────────────────────────
  document.getElementById('btn-play-again').addEventListener('click', playAgain);

  // ── Quit modal ──────────────────────────────────────
  document.getElementById('btn-quit-playing').addEventListener('click', showQuitModal);
  document.getElementById('btn-quit-summary').addEventListener('click', showQuitModal);
  document.getElementById('btn-quit-winner').addEventListener('click', showQuitModal);
  document.getElementById('btn-quit-cancel').addEventListener('click', hideQuitModal);
  document.getElementById('btn-quit-confirm').addEventListener('click', confirmQuit);
  // Tap backdrop to cancel
  document.getElementById('quit-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('quit-modal')) hideQuitModal();
  });

  // ── Theme toggle ────────────────────────────────────
  document.getElementById('btn-theme-toggle').addEventListener('click', toggleTheme);

  // ── SW update banner ────────────────────────────────
  document.getElementById('btn-update-reload').addEventListener('click', () => {
    window.location.reload();
  });
}

// ── Quit modal ─────────────────────────────────────────
function showQuitModal() {
  // Pause word timer while modal is open so time doesn't drain
  stopWordTimer();
  document.getElementById('quit-modal').classList.add('visible');
}

function hideQuitModal() {
  document.getElementById('quit-modal').classList.remove('visible');
  // If mid-round, resume the word timer for the current word
  if (gameState.phase === 'playing') {
    const screen = document.getElementById('screen-playing');
    const isPaused = screen?.classList.contains('word-paused');
    if (!isPaused && gameState.currentWord) startWordTimer();
  }
}

function confirmQuit() {
  document.getElementById('quit-modal').classList.remove('visible');
  clearSavedState();
  window.location.href = 'index.html';
}

// ── Theme ──────────────────────────────────────────────
const THEME_KEY = 'mayim_theme';

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  // Honour saved preference; fall back to OS preference
  if (saved === 'light' || saved === 'dark') {
    applyTheme(saved);
  } else if (window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    applyTheme('light');
  } else {
    applyTheme('dark');
  }
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  applyTheme(current === 'light' ? 'dark' : 'light');
}

// ── Service Worker update listener ────────────────────
function listenForSWUpdates() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'SW_UPDATED') {
      document.getElementById('update-banner')?.classList.add('visible');
    }
  });
}

// ── Boot ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();          // apply theme before first paint
  initSupabase();       // initialize Supabase client
  await initializeWords(); // fetch words from Supabase (or fallback)

  // Read mode from URL param (?mode=words | ?mode=proverbs)
  const urlMode = new URLSearchParams(window.location.search).get('mode');
  if (urlMode === 'proverbs' || urlMode === 'words') {
    gameState.mode = urlMode;
  }

  wireEvents();
  listenForSWUpdates();

  const saved = loadSavedState();

  // Only resume if saved mode matches current URL mode
  if (isResumable(saved) && saved.mode === gameState.mode) {
    Object.assign(gameState, saved);
    gameState.phase = 'setup';
  } else {
    if (saved) clearSavedState();
  }

  render();
});
