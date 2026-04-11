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

// ── Debug Mode ────────────────────────────────────────
const DEBUG = new URLSearchParams(window.location.search).has('debug');
function debugLog(...args) {
  if (DEBUG) console.log('[DEBUG]', ...args);
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
  debugLog('initSupabase called, window.supabase:', window.supabase);

  try {
    // The UMD build of @supabase/supabase-js exports createClient directly on the supabase object
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      debugLog('Creating Supabase client with createClient method');
      _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      debugLog('Supabase client created:', !!_supabase);
    } else {
      console.warn('supabase.createClient not found. Available methods:', Object.getOwnPropertyNames(window.supabase || {}));
    }
  } catch (err) {
    console.error('Failed to initialize Supabase:', err);
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
      debugLog('✓ Using cached words (24h TTL)');
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

    debugLog(`✓ Fetched ${data.length} words from Supabase`);
    return data;
  } catch (err) {
    console.warn('⚠ Failed to fetch from Supabase:', err);

    // Fallback: use cached words if available
    const cached = localStorage.getItem(WORDS_CACHE_KEY);
    if (cached) {
      debugLog('✓ Using offline cached words');
      return JSON.parse(cached);
    }

    // Last resort: use hardcoded WORDS array from words.js
    debugLog('✓ Using fallback words.js array');
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
  try {
    localStorage.setItem(NAMES_KEY, JSON.stringify([n0, n1]));
  } catch (err) {
    console.warn('⚠️ localStorage unavailable (private browsing?). Team names won\'t persist.', err.message);
    // Data still works in-session but won't persist across page reloads
  }
}

function loadTeamNames() {
  try {
    const raw = localStorage.getItem(NAMES_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    if (Array.isArray(arr) && arr.length === 2 &&
        typeof arr[0] === 'string' && typeof arr[1] === 'string') {
      return arr;
    }
  } catch (err) {
    console.warn('⚠️ localStorage unavailable. Using default team names.', err.message);
    // Fall through to defaults
  }
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

// True when we're on game.html (all game screens exist)
const IS_GAME_PAGE = !!document.getElementById('screen-setup');

function render() {
  // Nothing to render on index.html — all screens live in game.html
  if (!IS_GAME_PAGE) return;

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
  if (id) document.getElementById(id)?.classList.add('active');
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
  } catch (err) {
    // Silently handle: private browsing, storage quota exceeded, etc.
    if (err.name === 'QuotaExceededError') {
      console.warn('⚠️ Storage quota exceeded. Game won\'t be saved.');
    } else {
      console.warn('⚠️ localStorage unavailable. Game state won\'t persist.', err.message);
    }
  }
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('⚠️ Failed to load saved game state.', err.message);
    return null;
  }
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

// ── Network Status Detection ───────────────────────────
function initNetworkMonitoring() {
  // Detect when user goes offline
  window.addEventListener('offline', () => {
    console.warn('⚠️ Network connection lost');
    showNotification('You are offline. Some features may be limited.', 'warning');
  });

  // Detect when user comes back online
  window.addEventListener('online', () => {
    debugLog('✓ Network connection restored');
    showNotification('You are back online!', 'success');
  });
}

function showNotification(message, type = 'info') {
  // Log to console for debugging
  if (type === 'warning') console.warn(message);
  if (type === 'error') console.error(message);
  if (type === 'success') debugLog(message);

  // Could be extended to show toast notification UI
  // For now, just log to console
}

// ── Input Validation & Sanitization ────────────────────
function validateEmail(email) {
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validateTeamName(name) {
  // Allow letters, numbers, spaces, and Tigrinya characters
  // No special HTML/script characters
  const nameRegex = /^[a-zA-Z0-9\s\u1200-\u137F]{1,24}$/;
  return nameRegex.test(name);
}

function validateUnlockCode(code) {
  // Alphanumeric and hyphens only, 20-40 chars
  const codeRegex = /^[A-Za-z0-9\-]{20,40}$/;
  return codeRegex.test(code.trim());
}

function sanitizeTeamName(name) {
  // Remove any potentially dangerous characters
  // Keep only safe characters
  return name
    .replace(/[^a-zA-Z0-9\s\u1200-\u137F]/g, '')
    .slice(0, 24)
    .trim();
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

  const pool    = getMergedWords();
  const usedSet = new Set(gameState.usedWords.map(w => w.word));
  let available = pool.filter(w => !usedSet.has(w.word));

  // Recycle pool when too few words remain
  if (available.length < deckSize) {
    gameState.usedWords = [];
    available = [...pool];
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
  const pool      = getMergedProverbs();
  const usedSet   = new Set((gameState.usedProverbs || []).map(p => p.tigrinya));
  let available   = pool.filter(p => !usedSet.has(p.tigrinya));
  if (available.length < deckSize) {
    gameState.usedProverbs = [];
    available = [...pool];
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
function validateGameStart() {
  const words = getMergedWords();
  const proverbs = getMergedProverbs();

  if (words.length === 0) {
    showNotification('No words available. Please unlock a pack first.', 'error');
    return false;
  }
  if (gameState.mode === 'proverbs' && proverbs.length === 0) {
    showNotification('No proverbs available. Please unlock a pack first.', 'error');
    return false;
  }
  return true;
}

function startGame() {
  if (!validateGameStart()) return;

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

  const displayEl = document.getElementById('proverb-display');
  if (displayEl) {
    displayEl.textContent = ''; // Clear safely

    // Render visible words
    visible.forEach((word, idx) => {
      if (idx > 0) {
        displayEl.appendChild(document.createTextNode(' '));
      }
      const span = document.createElement('span');
      span.className = 'proverb-word';
      span.textContent = word;
      displayEl.appendChild(span);
    });

    // Render hidden blanks
    hidden.forEach(() => {
      displayEl.appendChild(document.createTextNode(' '));
      const span = document.createElement('span');
      span.className = 'proverb-blank';
      span.textContent = '___';
      displayEl.appendChild(span);
    });
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
    displayEl.textContent = ''; // Clear safely

    words.forEach((word, idx) => {
      if (idx > 0) {
        displayEl.appendChild(document.createTextNode(' '));
      }
      const span = document.createElement('span');
      span.className = 'proverb-word';
      span.textContent = word;
      displayEl.appendChild(span);
    });
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
    if (!el) return;

    el.textContent = ''; // Clear safely

    if (words.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'word-entry empty';
      emptyDiv.textContent = '—';
      el.appendChild(emptyDiv);
    } else {
      words.forEach(w => {
        const div = document.createElement('div');
        div.className = 'word-entry';
        div.textContent = w.tigrinya || w.word;
        el.appendChild(div);
      });
    }
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
  validateScores();

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

  // Show upsell for the first locked pack
  renderWinnerUpsell();

  clearSavedState();
}

// ── Stepper factory ────────────────────────────────────
// DRY helper that wires +/− buttons to a gameState key.
function makeStepper(minusId, plusId, displayId, key, min, max, onChange) {
  const minusEl = document.getElementById(minusId);
  const plusEl  = document.getElementById(plusId);
  // Elements only exist on game.html — silently skip on other pages
  if (!minusEl || !plusEl) return;
  minusEl.addEventListener('click', () => {
    if (gameState[key] > min) {
      gameState[key]--;
      document.getElementById(displayId).textContent = gameState[key];
      onChange?.();
    }
  });
  plusEl.addEventListener('click', () => {
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
  // Only wire game events when on game.html (elements don't exist on index.html)
  if (!document.getElementById('btn-start-game')) return;

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
  // btn-quit-winner replaced by ← Home anchor in winner screen
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
  initTheme();             // apply theme before first paint
  initNetworkMonitoring(); // set up offline/online detection
  initSupabase();          // initialize Supabase client
  await initializeWords(); // fetch words from Supabase (or fallback)
  initAuth();              // initialize authentication

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

// ══════════════════════════════════════════════════════════
// PACK SYSTEM
// ══════════════════════════════════════════════════════════

// ── Storage helpers ────────────────────────────────────────
const PACK_STORE_KEY = 'mayim_unlocked_packs';

function getUnlockedPacks() {
  try { return JSON.parse(localStorage.getItem(PACK_STORE_KEY) || '{}'); }
  catch { return {}; }
}

function storePack(slug, words, proverbs) {
  const all = getUnlockedPacks();
  all[slug] = { words, proverbs, unlockedAt: Date.now() };
  localStorage.setItem(PACK_STORE_KEY, JSON.stringify(all));
}

function isPackUnlocked(slug) {
  if (slug === 'classic') return true;
  return !!getUnlockedPacks()[slug];
}

// ── Merged deck pools ──────────────────────────────────────
function getSelectedPacks() {
  // Get packs selected in the current setup screen
  const checkboxes = document.querySelectorAll('.pack-toggle-input:checked');
  const selected = new Set();
  checkboxes.forEach(cb => {
    const slug = cb.dataset.slug;
    if (slug) selected.add(slug);
  });
  return selected;
}

function getMergedWords() {
  const unlocked = getUnlockedPacks();
  const selected = getSelectedPacks();
  let all = [...gameWords]; // Always include classic

  // Add words from selected unlocked packs
  for (const [slug, data] of Object.entries(unlocked)) {
    if (selected.has(slug) && slug !== 'classic' && Array.isArray(data.words)) {
      all = all.concat(data.words);
    }
  }
  return all;
}

function getMergedProverbs() {
  const unlocked = getUnlockedPacks();
  const selected = getSelectedPacks();
  let all = [...PROVERBS]; // Always include classic

  // Add proverbs from selected unlocked packs
  for (const [slug, data] of Object.entries(unlocked)) {
    if (selected.has(slug) && slug !== 'classic' && Array.isArray(data.proverbs)) {
      all = all.concat(data.proverbs);
    }
  }
  return all;
}

// ── Score validation (anti-tamper) ────────────────────────
function validateScores() {
  const maxPossible = gameState.totalRounds * gameState.wordsPerRound;
  for (const team of gameState.teams) {
    if (typeof team.score !== 'number' || team.score < 0 || team.score > maxPossible) {
      console.warn('[security] Score anomaly detected — clamping');
      team.score = Math.max(0, Math.min(Number(team.score) || 0, maxPossible));
    }
  }
}

// ── Edge Function code validation ─────────────────────────
const EDGE_FN_URL = 'https://rzcrdngpybrsjlbenqep.functions.supabase.co/validate-code';

async function validateAndUnlockCode(code, packSlug) {
  // Input validation
  const trimmedCode = code.trim();

  if (!trimmedCode) {
    throw new Error('Please enter a code');
  }

  if (!validateUnlockCode(trimmedCode)) {
    throw new Error('Invalid code format. Codes should be 20-40 characters.');
  }

  // Get the current session to include auth token
  if (!_supabase) throw new Error('Supabase not initialized');
  const { data: { session } } = await _supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  // Set up request timeout (10 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(EDGE_FN_URL, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body:    JSON.stringify({ code: trimmedCode.toUpperCase(), pack_slug: packSlug }),
      signal:  controller.signal,
    });

    clearTimeout(timeoutId);

    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Invalid code');
    storePack(packSlug, json.words, json.proverbs);
    return json;
  } catch (err) {
    clearTimeout(timeoutId);

    // Report to Sentry
    reportError(err, { action: 'unlock_code', pack: packSlug });

    // Handle timeout error
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    }

    // Handle network errors
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }

    // Re-throw other errors
    throw err;
  }
}

// ── Auth Error Messages ────────────────────────────────────
function mapAuthErrorToMessage(err) {
  // Map Supabase auth errors to user-friendly messages
  const message = err.message?.toLowerCase() || '';

  if (message.includes('invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  if (message.includes('email not confirmed')) {
    return 'Please check your email to verify your account.';
  }
  if (message.includes('user already registered')) {
    return 'This email is already registered. Try logging in instead.';
  }
  if (message.includes('password should be at least')) {
    return 'Password must be at least 8 characters long.';
  }
  if (message.includes('network')) {
    return 'Network error. Please check your internet connection.';
  }
  if (message.includes('rate limit') || message.includes('email rate limit') || message.includes('too many')) {
    return 'Too many attempts. Please wait a few minutes before trying again.';
  }
  if (message.includes('signup disabled') || message.includes('signups not allowed')) {
    return 'Account registration is temporarily disabled. Please try again later.';
  }

  // Return original message if not matched
  return err.message || 'An error occurred. Please try again.';
}

// ── Unlock modal ───────────────────────────────────────────
let _unlockTargetSlug = null;

function openUnlockModal(slug) {
  // Check if user is authenticated before showing code input modal
  if (!_currentUser) {
    _pendingUnlockPackSlug = slug;
    openAuthModal('login');
    return;
  }

  _unlockTargetSlug = slug;
  const catalogue   = (typeof PACK_CATALOGUE !== 'undefined') ? PACK_CATALOGUE : [];
  const pack        = catalogue.find(p => p.slug === slug);
  const modal       = document.getElementById('unlock-modal');
  const nameEl      = document.getElementById('unlock-pack-name');
  const input       = document.getElementById('unlock-code-input');
  const errEl       = document.getElementById('unlock-error');
  const successEl   = document.getElementById('unlock-success');
  const buyLink     = document.getElementById('unlock-buy-link');
  if (!modal) return;
  if (nameEl)    nameEl.textContent  = pack ? `${pack.nameGeez} — ${pack.nameEn}` : slug;
  if (input)     input.value         = '';
  if (errEl)     errEl.classList.add('hidden');
  if (successEl) successEl.classList.add('hidden');
  // Point "Buy on Gumroad" link to the specific pack product
  if (buyLink && pack?.gumroadUrl) buyLink.href = pack.gumroadUrl;
  modal.classList.remove('hidden');
  input?.focus();
}

function closeUnlockModal() {
  document.getElementById('unlock-modal')?.classList.add('hidden');
  _unlockTargetSlug = null;
}

function wireUnlockModal() {
  document.getElementById('btn-unlock-close')?.addEventListener('click', closeUnlockModal);
  document.getElementById('unlock-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeUnlockModal();
  });

  document.getElementById('btn-unlock-submit')?.addEventListener('click', async () => {
    const code      = document.getElementById('unlock-code-input')?.value?.trim();
    const errEl     = document.getElementById('unlock-error');
    const successEl = document.getElementById('unlock-success');
    const btn       = document.getElementById('btn-unlock-submit');

    if (!code) { showUnlockError('Please enter your unlock code.'); return; }
    if (!_unlockTargetSlug) return;

    btn.disabled     = true;
    btn.textContent  = 'Checking…';
    errEl?.classList.add('hidden');

    try {
      await validateAndUnlockCode(code, _unlockTargetSlug);
      successEl?.classList.remove('hidden');
      btn.textContent = 'Unlocked ✓';
      // Refresh pack cards on landing page if present
      if (typeof renderPackCards === 'function') renderPackCards();
      // Refresh setup pack toggles if on game page
      if (typeof renderSetup === 'function') renderSetup();

      // After success, close modal and scroll to pack showcase
      setTimeout(() => {
        closeUnlockModal();
        const packShowcase = document.getElementById('pack-showcase');
        if (packShowcase) {
          packShowcase.removeAttribute('hidden');
          packShowcase.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 1500);
    } catch (err) {
      btn.disabled    = false;
      btn.textContent = 'Unlock';
      showUnlockError(err.message || 'Code not valid. Please try again.');
    }
  });

  // Allow Enter key in code input
  document.getElementById('unlock-code-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-unlock-submit')?.click();
  });
}

function showUnlockError(msg) {
  const el = document.getElementById('unlock-error');
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}

// ── Pack cards on landing page ─────────────────────────────
function renderPackCards() {
  const container = document.getElementById('pack-cards');
  if (!container || typeof PACK_CATALOGUE === 'undefined') return;

  container.textContent = ''; // Clear safely

  PACK_CATALOGUE.forEach(pack => {
    const unlocked = isPackUnlocked(pack.slug);

    // Create card element
    const card = document.createElement('div');
    card.className = 'pack-card';
    card.style.setProperty('--pack-accent', pack.accentColor);

    // Ge'ez name
    const geezSpan = document.createElement('span');
    geezSpan.className = 'pack-card-geez';
    geezSpan.lang = 'ti';
    geezSpan.textContent = pack.nameGeez;
    card.appendChild(geezSpan);

    // Info section
    const info = document.createElement('div');
    info.className = 'pack-card-info';

    const nameP = document.createElement('p');
    nameP.className = 'pack-card-name';
    nameP.textContent = pack.nameEn;
    info.appendChild(nameP);

    const descP = document.createElement('p');
    descP.className = 'pack-card-desc';
    descP.textContent = pack.description;
    info.appendChild(descP);

    const metaP = document.createElement('p');
    metaP.className = 'pack-card-meta';
    metaP.textContent = `${pack.wordCount} words · ${pack.proverbCount} proverbs`;
    info.appendChild(metaP);

    card.appendChild(info);

    // Action section
    const action = document.createElement('div');
    action.className = 'pack-card-action';

    if (pack.isFree) {
      const badge = document.createElement('span');
      badge.className = 'pack-badge-free';
      badge.textContent = 'FREE';
      action.appendChild(badge);
    } else if (unlocked) {
      const badge = document.createElement('span');
      badge.className = 'pack-badge-unlocked';
      badge.textContent = '✓ Unlocked';
      action.appendChild(badge);
    } else {
      const btn = document.createElement('button');
      btn.className = 'pack-unlock-btn';
      btn.dataset.slug = pack.slug;
      btn.textContent = `£${pack.priceGbp.toFixed(2)} — Unlock`;
      btn.addEventListener('click', () => openUnlockModal(pack.slug));
      action.appendChild(btn);
    }

    card.appendChild(action);
    container.appendChild(card);
  });
}

// ── Pack toggles in game setup ────────────────────────────
function renderPackToggles() {
  const container = document.getElementById('pack-checkboxes');
  const label     = document.getElementById('pack-selector-label');
  if (!container || typeof PACK_CATALOGUE === 'undefined') return;

  const unlocked = PACK_CATALOGUE.filter(p => isPackUnlocked(p.slug));

  // Only show section if there's more than the classic pack unlocked
  if (unlocked.length <= 1) {
    container.textContent = ''; // Clear safely
    if (label) label.classList.add('hidden');
    return;
  }
  if (label) label.classList.remove('hidden');

  container.textContent = ''; // Clear safely

  unlocked.forEach(pack => {
    const row = document.createElement('div');
    row.className = 'pack-toggle-row';

    const info = document.createElement('div');

    const nameP = document.createElement('p');
    nameP.className = 'pack-toggle-name';
    nameP.textContent = `${pack.nameGeez} — ${pack.nameEn}`;
    info.appendChild(nameP);

    const metaP = document.createElement('p');
    metaP.className = 'pack-toggle-meta';
    metaP.textContent = `${pack.wordCount} words · ${pack.proverbCount} proverbs`;
    info.appendChild(metaP);

    row.appendChild(info);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'pack-toggle-input';
    checkbox.id = `pack-toggle-${pack.slug}`;
    checkbox.dataset.slug = pack.slug;
    checkbox.checked = true;
    if (pack.isFree) checkbox.disabled = true;

    checkbox.addEventListener('change', () => {
      // Rebuild deck with newly selected packs (applies to both modes)
      if (gameState.mode === 'words') {
        gameState.wordDeck = buildDeck();
      } else {
        gameState.proverbDeck = buildProverbDeck();
      }
      // Update the computed display (cards per team, etc)
      updateSetupComputed();
      updateProverbSetupComputed();
    });

    row.appendChild(checkbox);
    container.appendChild(row);
  });
}

// ── Winner screen upsell ───────────────────────────────────
function renderWinnerUpsell() {
  const upsell  = document.getElementById('winner-upsell');
  const nameEl  = document.getElementById('upsell-pack-name');
  const btn     = document.getElementById('btn-winner-unlock');
  if (!upsell || typeof PACK_CATALOGUE === 'undefined') return;

  const nextLocked = PACK_CATALOGUE.find(p => !p.isFree && !isPackUnlocked(p.slug));
  if (!nextLocked) { upsell.classList.add('hidden'); return; }

  if (nameEl) nameEl.textContent = `${nextLocked.nameGeez} — ${nextLocked.nameEn}`;
  upsell.classList.remove('hidden');

  btn?.addEventListener('click', () => openUnlockModal(nextLocked.slug), { once: true });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ── AUTHENTICATION SYSTEM ────────────────────────────────────────────────────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

let _currentUser = null;
let _pendingUnlockPackSlug = null;

// ── Initialize Supabase Auth ───────────────────────────────────────────
async function initAuth() {
  try {
    if (!_supabase) {
      console.warn('Supabase client not initialized');
      return;
    }

    const { data: { session } } = await _supabase.auth.getSession();

    if (session) {
      _currentUser = session.user;
      updateAuthUI(true);
    } else {
      updateAuthUI(false);
    }

    // Listen for auth state changes
    _supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        _currentUser = session.user;
        updateAuthUI(true);

        // If there's a pending pack unlock after login, open the unlock modal
        if (_pendingUnlockPackSlug) {
          setTimeout(() => {
            openUnlockModal(_pendingUnlockPackSlug);
            _pendingUnlockPackSlug = null;
          }, 300);
        }
      } else {
        _currentUser = null;
        updateAuthUI(false);
      }
    });
  } catch (err) {
    console.warn('Auth initialization error:', err);
  }
}

// ── Modal Focus Trapping ──────────────────────────────────────────────
// Trap focus within a modal using Tab key for better accessibility
function trapFocus(modal) {
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleKeyDown(e) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  modal.addEventListener('keydown', handleKeyDown);
  if (firstElement) firstElement.focus();
  return () => modal.removeEventListener('keydown', handleKeyDown);
}

// ── Auth Modal Management ──────────────────────────────────────────────
function openAuthModal(mode = 'login') {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;

  modal.classList.remove('hidden');
  trapFocus(modal);

  // Update active tab
  document.querySelectorAll('.auth-tab').forEach(tab => {
    if (tab.dataset.tab === mode) {
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
    } else {
      tab.classList.remove('active');
      tab.setAttribute('aria-selected', 'false');
    }
  });

  // Show/hide forms
  if (mode === 'signup') {
    document.getElementById('auth-login-form')?.classList.add('hidden');
    document.getElementById('auth-login-form')?.classList.remove('auth-form-active');
    document.getElementById('auth-signup-form')?.classList.remove('hidden');
    document.getElementById('auth-signup-form')?.classList.add('auth-form-active');
  } else {
    document.getElementById('auth-login-form')?.classList.remove('hidden');
    document.getElementById('auth-login-form')?.classList.add('auth-form-active');
    document.getElementById('auth-signup-form')?.classList.add('hidden');
    document.getElementById('auth-signup-form')?.classList.remove('auth-form-active');
  }
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;

  modal.classList.add('hidden');

  // Reset forms
  document.getElementById('auth-login-form')?.reset();
  document.getElementById('auth-signup-form')?.reset();

  // Hide error messages
  document.getElementById('auth-error')?.classList.add('hidden');
  document.getElementById('auth-error-signup')?.classList.add('hidden');
  document.getElementById('auth-success')?.classList.add('hidden');

  // Reset password input types to password (hide text)
  document.querySelectorAll('input[type="text"][data-original-type="password"]').forEach(input => {
    input.type = 'password';
  });

  // Reset toggle button states
  document.querySelectorAll('.toggle-password-btn').forEach(btn => {
    btn.textContent = '👁️';
  });

  // Reset strength meter
  const strengthBar = document.getElementById('strength-bar');
  const strengthText = document.getElementById('strength-text');
  if (strengthBar) {
    strengthBar.className = 'strength-bar';
    strengthBar.style.width = '0%';
  }
  if (strengthText) strengthText.textContent = 'Weak';
}

// ── Handle Login ───────────────────────────────────────────────────────
async function handleLogin(email, password) {
  const btn = document.getElementById('btn-auth-login');
  if (!btn) return;

  btn.disabled = true;
  const textEl = btn.querySelector('.btn-text');
  const spinnerEl = btn.querySelector('.btn-spinner');
  const originalText = textEl?.textContent || 'Log In';

  if (textEl) textEl.textContent = 'Logging in...';
  if (spinnerEl) spinnerEl.classList.remove('hidden');

  try {
    if (!_supabase) initSupabase();  // retry init in case DOMContentLoaded raced
    if (!_supabase) throw new Error('Could not connect to auth service. Please refresh the page.');
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;

    closeAuthModal();
    // Redirect to profile page after successful login
    window.location.href = 'profile.html';
  } catch (err) {
    reportError(err, { action: 'login' });
    const friendlyMessage = mapAuthErrorToMessage(err);
    showAuthError(friendlyMessage, 'auth-error');
  } finally {
    btn.disabled = false;
    if (textEl) textEl.textContent = originalText;
    if (spinnerEl) spinnerEl.classList.add('hidden');
  }
}

// ── Handle Signup ──────────────────────────────────────────────────────
async function handleSignup(email, password, confirmPassword) {
  const btn = document.getElementById('btn-auth-signup');
  if (!btn) return;

  if (password !== confirmPassword) {
    showAuthError('Passwords do not match', 'auth-error-signup');
    return;
  }

  if (password.length < 6) {
    showAuthError('Password must be at least 6 characters', 'auth-error-signup');
    return;
  }

  btn.disabled = true;
  const textEl = btn.querySelector('.btn-text');
  const spinnerEl = btn.querySelector('.btn-spinner');
  const originalText = textEl?.textContent || 'Create Account';

  if (textEl) textEl.textContent = 'Creating account...';
  if (spinnerEl) spinnerEl.classList.remove('hidden');

  try {
    if (!_supabase) initSupabase();  // retry init in case DOMContentLoaded raced
    if (!_supabase) throw new Error('Could not connect to auth service. Please refresh the page.');
    const { data, error } = await _supabase.auth.signUp({ email, password });

    if (error) throw error;

    // Hide the form fields, show success message inside the still-open modal
    document.getElementById('auth-signup-form')?.classList.add('hidden');

    const emailConfirmRequired = !data.session;
    if (emailConfirmRequired) {
      showAuthSuccess('Account created! Check your email to confirm, then log in.');
    } else {
      showAuthSuccess('Account created! You are now logged in.');
      updateAuthUI(true);
      // Close modal after a short delay so user sees the success message
      setTimeout(() => closeAuthModal(), 2000);
    }
  } catch (err) {
    reportError(err, { action: 'signup' });
    const friendlyMessage = mapAuthErrorToMessage(err);
    showAuthError(friendlyMessage, 'auth-error-signup');
  } finally {
    btn.disabled = false;
    if (textEl) textEl.textContent = originalText;
    if (spinnerEl) spinnerEl.classList.add('hidden');
  }
}

// ── Sentry Error Reporting ────────────────────────────────────────────
function reportError(err, context = {}) {
  console.error('[Error]', err);
  if (typeof Sentry !== 'undefined' && Sentry.captureException) {
    Sentry.captureException(err, { contexts: { ...context } });
  }
}

// ── Handle Logout ──────────────────────────────────────────────────────
async function handleLogout() {
  try {
    if (_supabase) {
      await _supabase.auth.signOut();
    }
    _currentUser = null;
    updateAuthUI(false);
  } catch (err) {
    reportError(err, { action: 'logout' });
  }
}

// ── Update Auth UI ─────────────────────────────────────────────────────
function updateAuthUI(isLoggedIn) {
  const indicator = document.getElementById('auth-indicator');
  if (!indicator) return;

  if (isLoggedIn && _currentUser) {
    // Show email as profile link + logout button
    const profileLink = document.createElement('a');
    profileLink.href = 'profile.html';
    profileLink.className = 'auth-profile-link';
    profileLink.textContent = _currentUser.email;

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'logout-btn';
    logoutBtn.textContent = 'Log Out';
    logoutBtn.addEventListener('click', handleLogout);

    indicator.textContent = '';
    indicator.appendChild(profileLink);
    indicator.appendChild(document.createTextNode(' · '));
    indicator.appendChild(logoutBtn);
  } else {
    indicator.textContent = 'Log in to unlock packs';
  }
}

// ── Show Auth Error ────────────────────────────────────────────────────
function showAuthError(msg, elementId = 'auth-error') {
  const errorEl = document.getElementById(elementId);
  if (!errorEl) return;

  errorEl.textContent = msg;
  errorEl.classList.remove('hidden');
}

// ── Show Auth Success Message ──────────────────────────────────────────
function showAuthSuccess(msg) {
  const successEl = document.getElementById('auth-success');
  if (!successEl) return;

  successEl.textContent = msg;
  successEl.classList.remove('hidden');
  setTimeout(() => successEl.classList.add('hidden'), 6000);
}

// ── Updated openUnlockModal with Auth Check ────────────────────────────
// (This function modifies the existing openUnlockModal, see below)

// ── Updated validateAndUnlockCode with Auth Token ─────────────────────
// (This function modifies the existing validateAndUnlockCode, see below)
