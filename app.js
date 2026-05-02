// ═══════════════════════════════════════════════════════
// Mayim — Tigrinya Party Game  |  app.js
// ═══════════════════════════════════════════════════════

'use strict';

// ── HTML escape utility ─────────────────────────────────
// Prevents XSS when interpolating user-supplied strings into innerHTML
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

// ── Slug migration: all historical slug names → current names ─────────────────
// Maps: hadar/adi/weledo (v1) → intermediate/advanced/expert (v2)
//       classic/intermediate/advanced/expert (v2) → gasha/qola/gobez/shimagile (v3)
// Runs once on load so existing users don't lose their unlocked packs.
(function migratePackSlugs() {
  const SLUG_MAP = {
    hadar:        'qola',
    adi:          'gobez',
    weledo:       'shimagile',
    classic:      'gasha',
    intermediate: 'qola',
    advanced:     'gobez',
    expert:       'shimagile',
  };
  try {
    const raw = localStorage.getItem('mayim_unlocked_packs');
    if (!raw) return;
    const packs = JSON.parse(raw);
    let changed = false;
    for (const [oldSlug, newSlug] of Object.entries(SLUG_MAP)) {
      if (packs[oldSlug] !== undefined) {
        packs[newSlug] = packs[oldSlug];
        delete packs[oldSlug];
        changed = true;
      }
    }
    if (changed) localStorage.setItem('mayim_unlocked_packs', JSON.stringify(packs));
  } catch { /* ignore */ }
})();

// ── Defaults ───────────────────────────────────────────
const STORAGE_KEY  = 'mayim_state';
const NAMES_KEY    = 'mayim_team_names';
const WORDS_CACHE_KEY    = 'mayim_words_cache';
const WORDS_CACHE_TTL    = 86400000; // 24 hours in ms
const PROVERBS_CACHE_KEY = 'mayim_proverbs_cache';
const PROVERBS_CACHE_TTL = 300000;   // 5 minutes — short so admin changes reflect quickly

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
let gameWords    = [];
let gameProverbs = []; // classic proverbs loaded from Supabase (keeps in sync with admin)

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

// ── Fetch Proverbs from Supabase (classic pack only) ───
// Short 5-min cache so admin panel edits appear in-game quickly.
async function fetchProverbsFromSupabase() {
  const CLASSIC_PACK_ID = 'ebaec11f-dbb3-4625-b810-6c0f85624d25';
  try {
    const cached    = localStorage.getItem(PROVERBS_CACHE_KEY);
    const cacheTime = localStorage.getItem(PROVERBS_CACHE_KEY + '_time');
    if (cached && cacheTime && Date.now() - parseInt(cacheTime) < PROVERBS_CACHE_TTL) {
      debugLog('✓ Using cached proverbs (5-min TTL)');
      return JSON.parse(cached);
    }
    if (!_supabase) throw new Error('Supabase not initialized');
    const { data, error } = await _supabase
      .from('proverbs')
      .select('tigrinya, latin, english, difficulty')
      .eq('pack_id', CLASSIC_PACK_ID);
    if (error) throw error;
    localStorage.setItem(PROVERBS_CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(PROVERBS_CACHE_KEY + '_time', Date.now().toString());
    debugLog(`✓ Fetched ${data.length} proverbs from Supabase`);
    return data;
  } catch (err) {
    console.warn('⚠ Failed to fetch proverbs from Supabase:', err);
    const cached = localStorage.getItem(PROVERBS_CACHE_KEY);
    if (cached) { debugLog('✓ Using offline cached proverbs'); return JSON.parse(cached); }
    debugLog('✓ Falling back to proverbs.js');
    return typeof PROVERBS !== 'undefined' ? [...PROVERBS] : [];
  }
}

async function initializeProverbs() {
  gameProverbs = await fetchProverbsFromSupabase();
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

let _toastTimer = null;
function showNotification(message, type = 'info') {
  // Console logging
  if (type === 'warning') console.warn(message);
  if (type === 'error')   console.error(message);
  else debugLog(message);

  // Visual toast (#app-toast in game.html)
  const toast = document.getElementById('app-toast');
  if (!toast) return;

  if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }

  toast.textContent = message;
  toast.className   = `app-toast app-toast--${type}`;

  // Auto-hide after 4 s (errors linger 6 s)
  const delay = type === 'error' ? 6000 : 4000;
  _toastTimer = setTimeout(() => {
    toast.classList.add('app-toast--hide');
    setTimeout(() => toast.classList.add('hidden'), 400);
  }, delay);
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
  // Enable Correct btn now that the timer is running
  const correctBtn = document.getElementById('btn-correct');
  if (correctBtn) correctBtn.disabled = false;
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

function fmtSecs(s) {
  if (s < 60) return String(s);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

function updateTimerUI() {
  const el   = document.getElementById('timer-display');
  const prog = document.getElementById('timer-progress');
  if (!el || !prog) return;
  const t   = Math.max(0, gameState.wordTimeLeft ?? gameState.secondsPerWord);
  const dur = gameState.secondsPerWord;
  el.textContent   = fmtSecs(t);
  prog.style.width = ((t / dur) * 100) + '%';
  const danger = t <= 5;
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
      // Show time-up message, then auto-reveal the answer after a short pause
      const timeUpEl = document.getElementById('proverb-time-up');
      if (timeUpEl) timeUpEl.classList.remove('hidden');
      setTimeout(() => {
        if (timeUpEl) timeUpEl.classList.add('hidden');
        revealProverb();
      }, 1800);
    }
  }, 1000);
}

function updateProverbTimerUI() {
  const el   = document.getElementById('proverb-timer-display');
  const fill = document.getElementById('proverb-timer-progress');
  if (!el) return;
  const t   = Math.max(0, gameState.proverbTimeLeft);
  const dur = gameState.secondsPerWord;
  el.textContent = fmtSecs(t);
  el.classList.toggle('danger', t <= 5);
  if (fill) {
    fill.style.width = ((t / dur) * 100) + '%';
    fill.classList.toggle('danger', t <= 5);
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

// prePickedTeam: 0 or 1 — pass from the countdown call so the same team
// that was shown during the 3-2-1 is used to start the game.
function startGame(prePickedTeam) {
  if (!validateGameStart()) return;

  const turnDuration = computeTurnDuration();
  const startTeam    = (prePickedTeam === 0 || prePickedTeam === 1)
    ? prePickedTeam
    : (Math.random() < 0.5 ? 0 : 1);
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
  // Reset timer display to full time for the new word
  gameState.wordTimeLeft = gameState.secondsPerWord;
  updateTimerUI();

  // Disable Correct btn until judge starts the timer
  const correctBtn = document.getElementById('btn-correct');
  if (correctBtn) correctBtn.disabled = true;

  // Re-show "Start Timer" button for the next word (it hides when timer runs)
  const startTimerBtn = document.getElementById('btn-skip');
  if (startTimerBtn) startTimerBtn.classList.remove('hidden');

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

  // Timer does NOT auto-start — judge clicks "Start Timer" button to begin
  updateTimerUI();  // reset display to full time
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
    timerEl.textContent = fmtSecs(gameState.secondsPerWord);
    timerEl.classList.remove('danger');
  }
  const fillEl = document.getElementById('proverb-timer-progress');
  if (fillEl) { fillEl.style.width = '100%'; fillEl.classList.remove('danger'); }
  document.getElementById('btn-proverb-start-timer')?.classList.remove('hidden');

  // Reset time-up message and judge peek overlay
  document.getElementById('proverb-time-up')?.classList.add('hidden');
  // Reset inline judge peek
  closeJudgePeek();

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

// ── Judge peek — read-only answer preview, no game state change ────────
function openJudgePeek() {
  const p = gameState.currentProverb;
  if (!p) return;
  const inline = document.getElementById('judge-peek-inline');
  if (!inline) return;
  const isVisible = !inline.classList.contains('hidden');
  if (isVisible) {
    // Toggle off
    inline.classList.add('hidden');
    const btn = document.getElementById('btn-judge-peek');
    if (btn) btn.textContent = '👁 See Answer (Judge)';
    return;
  }
  document.getElementById('judge-peek-tigrinya').textContent = p.tigrinya;
  document.getElementById('judge-peek-latin').textContent    = p.latin;
  document.getElementById('judge-peek-english').textContent  = p.english;
  inline.classList.remove('hidden');
  const btn = document.getElementById('btn-judge-peek');
  if (btn) btn.textContent = '🙈 Hide Answer';
}
function closeJudgePeek() {
  const inline = document.getElementById('judge-peek-inline');
  if (inline) inline.classList.add('hidden');
  const btn = document.getElementById('btn-judge-peek');
  if (btn) btn.textContent = '👁 See Answer (Judge)';
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
    showTurnTransition();
  }
}

// ── Between-turn pause overlay (Misla) ───────────────────────────────────────
// Shows the next team's name + current scores. Judge taps "Ready" to continue.
// This gives the judge a natural moment to hand the phone and let the new team
// look away while the proverb loads.
function showTurnTransition() {
  const overlay   = document.getElementById('turn-transition-overlay');
  const nameEl    = document.getElementById('turn-transition-team-name');
  const scoresEl  = document.getElementById('turn-transition-scores');
  if (!overlay) { showNextProverb(); return; } // Graceful fallback

  const nextTeam = gameState.teams[gameState.wordTeamIndex];

  nameEl.textContent = nextTeam.name;

  // Render scores for both teams
  scoresEl.innerHTML = '';
  gameState.teams.forEach((t, i) => {
    const div = document.createElement('div');
    div.className = 'turn-score-item' + (i === gameState.wordTeamIndex ? ' turn-score-item--active' : '');
    div.innerHTML = `<span class="turn-score-name">${escHtml(t.name)}</span><span class="turn-score-val">${t.score}</span>`;
    scoresEl.appendChild(div);
  });

  overlay.classList.remove('hidden');
  // Focus the ready button for keyboard/accessibility
  document.getElementById('btn-turn-transition-ready')?.focus();
}

function hideTurnTransition() {
  document.getElementById('turn-transition-overlay')?.classList.add('hidden');
  showNextProverb();
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
  document.getElementById('secs-display').textContent = fmtSecs(gameState.secondsPerWord);
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
  renderTierSelector();
  updateTeamsTierBadge();
  checkResumeBanner();
}

function updateSetupComputed() {
  const deckSize = Math.floor(gameState.wordsPerRound / 2) * 2;
  const perTeam  = deckSize / 2;
  const el = document.getElementById('computed-turn-time');
  if (el) el.textContent = `${deckSize} cards · ${perTeam} per team · ${fmtSecs(gameState.secondsPerWord)} each`;
}

function updateProverbSetupComputed() {
  const total  = Math.floor(gameState.proverbsPerRound / 2) * 2;
  const perTeam = total / 2;
  const el = document.getElementById('computed-proverb-time');
  if (el) el.textContent = `${total} proverbs · ${perTeam} per team · ${fmtSecs(gameState.secondsPerWord)} each`;
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
      btn.textContent = `▶ Start · ${deckSize} cards · ${fmtSecs(gameState.secondsPerWord)} each`;
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
function makeStepper(minusId, plusId, displayId, key, min, max, onChange, fmt) {
  const minusEl = document.getElementById(minusId);
  const plusEl  = document.getElementById(plusId);
  // Elements only exist on game.html — silently skip on other pages
  if (!minusEl || !plusEl) return;
  const format = fmt || (v => v);
  minusEl.addEventListener('click', () => {
    if (gameState[key] > min) {
      gameState[key]--;
      document.getElementById(displayId).textContent = format(gameState[key]);
      onChange?.();
    }
  });
  plusEl.addEventListener('click', () => {
    if (gameState[key] < max) {
      gameState[key]++;
      document.getElementById(displayId).textContent = format(gameState[key]);
      onChange?.();
    }
  });
}

// ── Ready countdown ────────────────────────────────────
// teamName: string to display as "X goes first!" during countdown
function showCountdown(teamName, callback) {
  const overlay = document.getElementById('countdown-overlay');
  const el      = document.getElementById('countdown-number');
  const teamEl  = document.getElementById('countdown-team-reveal');

  // Graceful fallback: stale cached HTML won't have the overlay element
  if (!overlay || !el) { callback(); return; }

  // Show which team goes first
  if (teamEl && teamName) {
    teamEl.textContent = `${teamName} goes first!`;
  }

  const steps = ['3', '2', '1', 'GO!'];
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
        if (teamEl) teamEl.textContent = '';
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
              'secs-display',   'secondsPerWord',    1, 120, () => { updateSetupComputed(); updateProverbSetupComputed(); }, fmtSecs);

  makeStepper('btn-proverbs-minus', 'btn-proverbs-plus',
              'proverbs-display', 'proverbsPerRound', 2, 25, updateProverbSetupComputed);

  // ── Start game ──────────────────────────────────────
  document.getElementById('btn-start-game').addEventListener('click', () => {
    // Sanitise: strip HTML chars and cap length to prevent display injection
    const sanitiseName = (raw, fallback) => {
      const clean = raw.trim().replace(/[<>&"']/g, '').slice(0, 24);
      return clean || fallback;
    };
    const n0 = sanitiseName(document.getElementById('team1-name').value, DEFAULTS.teamNames[0]);
    const n1 = sanitiseName(document.getElementById('team2-name').value, DEFAULTS.teamNames[1]);
    saveTeamNames(n0, n1);   // remember for next game
    gameState.teams[0] = { name: n0, score: 0, correctWords: [], skippedWords: [] };
    gameState.teams[1] = { name: n1, score: 0, correctWords: [], skippedWords: [] };
    gameState.turnDuration = computeTurnDuration();

    // Pick random starting team BEFORE countdown so it can be shown during 3-2-1
    const startTeam     = Math.random() < 0.5 ? 0 : 1;
    const startTeamName = gameState.teams[startTeam].name;
    showCountdown(startTeamName, () => startGame(startTeam));
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
  // "Start Timer" button (formerly Skip) — hides itself, starts the word timer
  document.getElementById('btn-skip').addEventListener('click', () => {
    document.getElementById('btn-skip')?.classList.add('hidden');
    startWordTimer();
  });
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
  document.getElementById('btn-judge-peek')?.addEventListener('click', openJudgePeek);
  document.getElementById('btn-proverb-start-timer')?.addEventListener('click', startProverbTimer);
  document.getElementById('btn-show-answer')?.addEventListener('click', revealProverb);
  document.getElementById('btn-proverb-correct')?.addEventListener('click', () => judgeProverb('correct'));
  document.getElementById('btn-proverb-wrong')?.addEventListener('click',   () => judgeProverb('wrong'));
  document.getElementById('btn-quit-proverb')?.addEventListener('click', showQuitModal);
  document.getElementById('btn-turn-transition-ready')?.addEventListener('click', hideTurnTransition);

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
// Auto-reloads silently when the user is on the home or setup screen.
// Shows the banner only if they're mid-game so they can choose to reload.
function listenForSWUpdates() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type !== 'SW_UPDATED') return;
    const screen = window.gameState?.screen;
    const safe   = !screen || screen === 'home' || screen === 'setup';
    if (safe) { window.location.reload(); return; }
    document.getElementById('update-banner')?.classList.add('visible');
  });
}

// ── Boot ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();             // apply theme before first paint
  initNetworkMonitoring(); // set up offline/online detection
  initSupabase();             // initialize Supabase client
  await initializeWords();    // fetch words from Supabase (or fallback)
  await initializeProverbs(); // fetch classic proverbs from Supabase (keeps in sync with admin)
  await initAuth();           // initialize authentication (must complete before payment return check)
  await handlePaymentReturn(); // handle ?payment=success|cancelled from Stripe redirect

  // Read mode from URL param (?mode=words | ?mode=proverbs)
  const urlMode = new URLSearchParams(window.location.search).get('mode');
  if (urlMode === 'proverbs' || urlMode === 'words') {
    gameState.mode = urlMode;
  }

  wireEvents();
  listenForSWUpdates();

  const saved = loadSavedState();

  // Always start fresh on new visits — only restore state if the user explicitly
  // navigated within the game (e.g. browser back from a mid-game interstitial).
  // A navigation from index.html or any external page is detected by checking
  // whether the referrer is from the same page or if ?resume=1 is in the URL.
  // This prevents "stuck on old game" until the user manually refreshes.
  const params       = new URLSearchParams(window.location.search);
  const forceResume  = params.get('resume') === '1';
  const sameOrigin   = document.referrer &&
                       document.referrer.startsWith(window.location.origin) &&
                       document.referrer.includes('game.html');
  const canResume    = forceResume || sameOrigin;

  if (canResume && isResumable(saved) && saved.mode === gameState.mode) {
    Object.assign(gameState, saved);
    gameState.phase = 'setup';
  } else {
    if (saved) clearSavedState();
    resetToDefaults();
    gameState.mode = new URLSearchParams(window.location.search).get('mode') === 'proverbs'
      ? 'proverbs' : 'words';
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
  if (slug === 'gasha') return true;
  return !!getUnlockedPacks()[slug];
}

// ── Tier selection ─────────────────────────────────────────
// Returns the slug of the currently selected tier radio button.
// Falls back to 'gasha' (Level 1) if nothing is selected.
function getActiveTierSlug() {
  const radio = document.querySelector('.tier-radio-input:checked');
  return radio ? radio.dataset.slug : 'gasha';
}

// Returns the PACK_CATALOGUE entries for the active tier and all tiers below it.
// e.g. selecting "shimagile" → [gasha, shimagile]
function getActiveTierPacks() {
  if (typeof PACK_CATALOGUE === 'undefined') return [];
  const slug = getActiveTierSlug();
  const target = PACK_CATALOGUE.find(p => p.slug === slug);
  if (!target) return PACK_CATALOGUE.filter(p => p.slug === 'gasha');
  return PACK_CATALOGUE.filter(p => p.sequenceOrder <= target.sequenceOrder);
}

function getMergedWords() {
  const unlocked   = getUnlockedPacks();
  const activeTier = getActiveTierSlug();

  // Shimagile is exclusive — only its own words, no cumulative bleed from lower tiers.
  // Mirrors the same logic in getMergedProverbs() for a consistent tier experience.
  if (activeTier === 'shimagile') {
    const data = unlocked['shimagile'];
    if (data && Array.isArray(data.words) && data.words.length > 0) return deduplicateWords(data.words);
    // Fallback: shimagile not unlocked — show gasha words so the game still runs
    return [...gameWords];
  }

  // For all other tiers: cumulative pool (gasha + every unlocked tier up to selected)
  const tierPacks = getActiveTierPacks();
  let all = [...gameWords]; // gasha words always included

  for (const pack of tierPacks) {
    if (pack.slug === 'gasha') continue; // already in gameWords
    const data = unlocked[pack.slug];
    if (data && Array.isArray(data.words)) {
      all = all.concat(data.words);
    }
  }
  return deduplicateWords(all);
}

// Remove duplicate words (same word text, case-insensitive) — keeps first occurrence.
// Prevents the same word appearing twice in one game when packs overlap.
function deduplicateWords(arr) {
  const seen = new Set();
  return arr.filter(w => {
    const key = (w.word || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Which difficulty labels are allowed per tier.
// Gasha (starter) → easy only; Shimagile (expert, full unlock) → all difficulties.
const TIER_DIFFICULTIES = {
  gasha:     ['easy'],
  shimagile: ['easy', 'medium', 'hard'],
};

function getMergedProverbs() {
  const unlocked     = getUnlockedPacks();
  const activeTier   = getActiveTierSlug();
  const allowedDiffs = TIER_DIFFICULTIES[activeTier] || ['easy', 'medium', 'hard'];

  // Shimagile is exclusive — only its own proverbs, no lower-tier bleed.
  // This gives the feel of a genuinely different/harder experience at the top tier.
  if (activeTier === 'shimagile') {
    const data = unlocked['shimagile'];
    if (data && Array.isArray(data.proverbs) && data.proverbs.length > 0) {
      return deduplicateProverbs(data.proverbs);
    }
    // Fallback: shimagile not unlocked yet — return hard gasha proverbs
    const source = gameProverbs.length > 0 ? gameProverbs
      : (typeof PROVERBS !== 'undefined' ? PROVERBS : []);
    return source.filter(p => p.difficulty === 'hard');
  }

  const tierPacks = getActiveTierPacks();
  let all = [];

  for (const pack of tierPacks) {
    if (pack.slug === 'gasha') {
      // Gasha pack: filter by difficulty matching the selected tier
      const source = gameProverbs.length > 0 ? gameProverbs
        : (typeof PROVERBS !== 'undefined' ? PROVERBS : []);
      all = all.concat(source.filter(p => allowedDiffs.includes(p.difficulty)));
    } else {
      // Premium packs: include all proverbs (they're already tier-appropriate by assignment)
      const data = unlocked[pack.slug];
      if (data && Array.isArray(data.proverbs)) {
        all = all.concat(data.proverbs);
      }
    }
  }
  return deduplicateProverbs(all);
}

// Remove duplicate proverbs (same tigrinya text, case-insensitive) — keeps first occurrence.
function deduplicateProverbs(arr) {
  const seen = new Set();
  return arr.filter(p => {
    const key = (p.tigrinya || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

// ── Edge Function URLs ─────────────────────────────────────
const CHECKOUT_FN_URL   = 'https://rzcrdngpybrsjlbenqep.functions.supabase.co/create-checkout-session';
const FETCH_PACK_FN_URL = 'https://rzcrdngpybrsjlbenqep.functions.supabase.co/fetch-pack-content';

// ── Stripe: fetch pack content after purchase ─────────────
async function fetchPackContent(slug) {
  if (!_supabase) throw new Error('Supabase not initialized');
  const { data: { session } } = await _supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(FETCH_PACK_FN_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body:   JSON.stringify({ pack_slug: slug }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Failed to fetch pack content');

    storePack(slug, json.words, json.proverbs);
    return json;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('Request timed out — please try again.');
    throw err;
  }
}

// ── Stripe: start checkout flow for a locked tier ─────────
async function startPaymentFlow(slug) {
  if (!_currentUser) {
    _pendingPaymentSlug = slug;   // resume after login
    openAuthModal('login');       // send to login (not signup) for returning buyers
    return;
  }

  try {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // ── Guard 1: localStorage (instant — covers this device) ──────────────
    if (isPackUnlocked(slug)) {
      showNotification('✓ You already own this pass — enjoy all content!', 'success');
      renderPackCards();
      return;
    }

    // ── Guard 2: DB check (catches cross-device purchases) ─────────────────
    const { data: ownedRows } = await _supabase
      .from('user_pack_unlocks')
      .select('packs(slug)')
      .eq('user_id', session.user.id);
    const ownedSlugs = (ownedRows || []).map(r => r.packs?.slug).filter(Boolean);
    // Already owns this exact pass, or owns all-games (which unlocks everything)
    const alreadyOwned = ownedSlugs.includes(slug) ||
      (slug !== 'all-games' && ownedSlugs.includes('all-games'));

    if (alreadyOwned) {
      showNotification('✓ You already own this pass — enjoy all content!', 'success');
      // Sync localStorage so this device catches up for future checks
      fetchAndSyncUnlockedPacks();
      return;
    }

    // Show brief loading state on the button
    const btn = document.querySelector(`[data-pay-slug="${slug}"]`);
    if (btn) { btn.textContent = '…'; btn.disabled = true; }

    const res = await fetch(CHECKOUT_FN_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ pack_slug: slug }),
    });

    const json = await res.json();
    if (!res.ok || !json.url) throw new Error(json.error || 'Could not start checkout');

    // Navigate to Stripe Checkout (hosted page)
    window.location.href = json.url;
  } catch (err) {
    reportError(err, { action: 'startPaymentFlow', slug });
    showNotification(`Payment error: ${err.message}`, 'error');
    // Re-enable button on error
    const btn = document.querySelector(`[data-pay-slug="${slug}"]`);
    if (btn) { btn.textContent = `Get Pass — £${btn.dataset.price || ''}`.trim(); btn.disabled = false; }
  }
}

// ── Stripe: sync all DB-unlocked packs into localStorage ──
// Runs on login and on every page load when a session exists.
// Uses a 5-min TTL so admin edits to pack content propagate quickly.
const PACK_CONTENT_TTL = 300000; // 5 minutes

async function fetchAndSyncUnlockedPacks() {
  if (!_supabase || !_currentUser) return;
  if (typeof PACK_CATALOGUE === 'undefined') return;

  const premiumPacks = PACK_CATALOGUE.filter(p => !p.isFree);
  const unlocked     = getUnlockedPacks();
  const now          = Date.now();

  for (const pack of premiumPacks) {
    const cached = unlocked[pack.slug];

    // Skip only if content was synced recently (within TTL).
    // If not in cache at all, or cache is stale → re-fetch from DB.
    if (cached && cached.unlockedAt && (now - cached.unlockedAt) < PACK_CONTENT_TTL) {
      debugLog(`Pack content fresh (${Math.round((now - cached.unlockedAt) / 1000)}s old): ${pack.slug}`);
      continue;
    }

    try {
      await fetchPackContent(pack.slug);
      debugLog(`✓ Synced pack from DB: ${pack.slug}`);
    } catch (err) {
      if (err.message.includes('Subscription cancelled') || err.message.includes('402')) {
        // Subscription was cancelled — remove from localStorage so the lock icon reappears
        const all = getUnlockedPacks();
        delete all[pack.slug];
        try { localStorage.setItem(PACK_STORE_KEY, JSON.stringify(all)); } catch(_) {}
        showNotification(`Your ${pack.nameEn} subscription has ended. Renew to keep access.`, 'error');
        debugLog(`Evicted cancelled pack from cache: ${pack.slug}`);
      } else if (!err.message.includes('Not unlocked') && !err.message.includes('403')) {
        console.warn(`[sync] Pack ${pack.slug}:`, err.message);
      }
    }
  }

  // Refresh UI after sync
  renderTierSelector();
  updateTeamsTierBadge();
  if (typeof renderPackCards === 'function') renderPackCards();
}

// ── Stripe: handle return from Stripe Checkout ────────────
// ── Stripe return handler ─────────────────────────────────
// Persists slug to sessionStorage before cleaning the URL so a manual refresh
// still picks up the pending unlock (fixes the "slug lost on reload" bug).
// Uses exponential backoff (3 s → 7 s → 15 s) to survive Stripe webhook cold
// starts. Detects 401 explicitly so we can prompt login instead of silently
// failing.

const PENDING_UNLOCK_KEY = 'mayim_pending_unlock';

async function handlePaymentReturn() {
  const params  = new URLSearchParams(window.location.search);
  const payment = params.get('payment');
  const slug    = params.get('slug');
  const sessionId = params.get('session_id');

  // Also check sessionStorage for a pending unlock from a previous load
  // (handles the case where the user refreshed after the URL was cleaned)
  const stored  = (() => {
    try { return JSON.parse(sessionStorage.getItem(PENDING_UNLOCK_KEY) || 'null'); }
    catch { return null; }
  })();

  const effectiveSlug    = slug    || stored?.slug;
  const effectivePayment = payment || stored?.payment;

  if (!effectivePayment) return; // normal page load — nothing to do

  // ── Persist before cleaning URL so refresh still works ──
  if (payment === 'success' && slug) {
    try {
      sessionStorage.setItem(PENDING_UNLOCK_KEY, JSON.stringify({
        payment: 'success',
        slug,
        sessionId: sessionId ?? null,
        storedAt: Date.now(),
      }));
    } catch { /* private browsing — continue without persistence */ }
  }

  // Clean the payment params from the URL immediately
  const clean = window.location.pathname + (params.get('mode') ? `?mode=${params.get('mode')}` : '');
  window.history.replaceState({}, '', clean);

  if (effectivePayment === 'cancelled') {
    showNotification('Payment cancelled — no charge was made.', 'info');
    try { sessionStorage.removeItem(PENDING_UNLOCK_KEY); } catch { /* ignore */ }
    return;
  }

  if (effectivePayment === 'success' && effectiveSlug) {
    // Stale stored record (>5 min) — user probably already got their pack
    if (stored && Date.now() - stored.storedAt > 300_000) {
      try { sessionStorage.removeItem(PENDING_UNLOCK_KEY); } catch { /* ignore */ }
      return;
    }

    showNotification('Payment confirmed! Loading your pack…', 'info');

    const packName = (typeof PACK_CATALOGUE !== 'undefined')
      ? PACK_CATALOGUE.find(p => p.slug === effectiveSlug)?.nameEn ?? effectiveSlug
      : effectiveSlug;

    const tryFetch = async () => {
      try {
        await fetchPackContent(effectiveSlug);
        return { ok: true };
      } catch (err) {
        // Surface auth failures immediately — retrying won't help
        if (err.message === 'Not authenticated') return { ok: false, auth: true };
        return { ok: false, auth: false };
      }
    };

    const onSuccess = () => {
      showNotification(`✓ ${packName} tier unlocked — enjoy!`, 'success');
      try { sessionStorage.removeItem(PENDING_UNLOCK_KEY); } catch { /* ignore */ }
      renderTierSelector();
      if (typeof renderPackCards === 'function') renderPackCards();
    };

    // Exponential back-off: attempt 0 (immediate) → 3 s → 7 s → 15 s
    const DELAYS = [0, 3000, 7000, 15000];
    let attempt = 0;

    const poll = async () => {
      const { ok, auth } = await tryFetch();
      if (ok) { onSuccess(); return; }

      if (auth) {
        // Webhook may have fired but session expired — prompt re-login
        showNotification('Please log in again to finish unlocking your pack.', 'info');
        _pendingPaymentSlug = effectiveSlug;
        openAuthModal('login');
        return;
      }

      attempt++;
      if (attempt < DELAYS.length) {
        debugLog(`[payment] webhook not ready, retrying in ${DELAYS[attempt]}ms (attempt ${attempt})`);
        setTimeout(poll, DELAYS[attempt]);
      } else {
        // All retries exhausted — pack will appear automatically once the
        // webhook fires; user can refresh at any time.
        showNotification(
          `${packName} purchased! If it doesn't appear, refresh the page in a moment.`,
          'info',
        );
      }
    };

    poll();
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
    openAuthModal('signup');
    return;
  }

  _unlockTargetSlug = slug;
  const catalogue   = (typeof PACK_CATALOGUE !== 'undefined') ? PACK_CATALOGUE : [];
  const pack        = catalogue.find(p => p.slug === slug);
  const modal       = document.getElementById('unlock-modal');
  if (!modal) return;

  const nameEl    = document.getElementById('unlock-pack-name');
  const priceEl   = document.getElementById('unlock-pack-price');
  const profileEl = document.getElementById('unlock-pack-profile');
  const errEl     = document.getElementById('unlock-error');

  if (nameEl)    nameEl.textContent    = pack ? `${pack.nameGeez} · ${pack.nameEn}` : slug;
  if (priceEl)   priceEl.textContent   = pack ? `£${pack.priceGbp.toFixed(2)} · one-time` : '';
  if (profileEl) profileEl.textContent = pack ? pack.wordProfile : '';
  if (errEl)     errEl.classList.add('hidden');

  modal.classList.remove('hidden');
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

  document.getElementById('btn-unlock-submit')?.addEventListener('click', () => {
    if (!_unlockTargetSlug) return;
    closeUnlockModal();
    startPaymentFlow(_unlockTargetSlug);
  });
}

function showUnlockError(msg) {
  const el = document.getElementById('unlock-error');
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}

// ── Pack cards on landing page ─────────────────────────────
function renderPackCards() {
  const container = document.getElementById('pack-cards');
  if (!container || typeof GAME_PASS_CATALOGUE === 'undefined') return;

  container.textContent = '';

  GAME_PASS_CATALOGUE.forEach(pass => {
    const unlocked = !!getUnlockedPacks()[pass.slug];
    const isAllGames = pass.slug === 'all-games';

    const card = document.createElement('div');
    card.className = 'pass-card' + (isAllGames ? ' pass-card--featured' : '');
    card.style.setProperty('--pass-accent', pass.accentColor);

    // Top accent bar handled by CSS ::before

    // Header row: icon + name + price/badge
    const header = document.createElement('div');
    header.className = 'pass-card-header';

    const icon = document.createElement('span');
    icon.className = 'pass-card-icon';
    icon.textContent = pass.icon || '🎮';
    header.appendChild(icon);

    const nameWrap = document.createElement('div');
    nameWrap.className = 'pass-card-names';

    const nameEl = document.createElement('p');
    nameEl.className = 'pass-card-name';
    nameEl.textContent = pass.nameEn;
    nameWrap.appendChild(nameEl);

    if (isAllGames) {
      const badge = document.createElement('span');
      badge.className = 'pass-badge-best';
      badge.textContent = 'BEST VALUE';
      nameWrap.appendChild(badge);
    }
    header.appendChild(nameWrap);

    const priceEl = document.createElement('p');
    priceEl.className = 'pass-card-price';
    priceEl.textContent = unlocked ? '' : `£${pass.priceGbp.toFixed(2)}`;
    if (unlocked) {
      priceEl.classList.add('pass-price--unlocked');
      const badge = document.createElement('span');
      badge.className = 'pass-owned-badge';
      badge.textContent = '✓ Purchased';
      priceEl.appendChild(badge);
    }
    header.appendChild(priceEl);

    card.appendChild(header);

    // Description
    const desc = document.createElement('p');
    desc.className = 'pass-card-desc';
    desc.textContent = pass.description;
    card.appendChild(desc);

    // Meta chips
    const chips = document.createElement('div');
    chips.className = 'pass-card-chips';
    const chipData = isAllGames
      ? ['All 4 games', 'Every tier', 'One-time payment']
      : ['One game', 'All tiers', 'One-time payment'];
    chipData.forEach(label => {
      const chip = document.createElement('span');
      chip.className = 'pass-chip';
      chip.textContent = label;
      chips.appendChild(chip);
    });
    card.appendChild(chips);

    // CTA button or purchased row
    if (!unlocked) {
      const btn = document.createElement('button');
      btn.className = 'pass-card-btn' + (isAllGames ? ' pass-card-btn--featured' : '');
      btn.textContent = `Get Pass — £${pass.priceGbp.toFixed(2)}`;
      btn.dataset.paySlug = pass.slug;           // enables loading state + guard lookup
      btn.dataset.price   = pass.priceGbp.toFixed(2); // used to restore label on error
      btn.addEventListener('click', () => startPaymentFlow(pass.slug));
      card.appendChild(btn);
    } else {
      const unlockedBadge = document.createElement('div');
      unlockedBadge.className = 'pass-unlocked-row';
      const icon = document.createElement('span');
      icon.className = 'pass-unlocked-icon';
      icon.textContent = '✓';
      const label = document.createElement('span');
      label.textContent = 'Purchased — enjoy all content';
      unlockedBadge.appendChild(icon);
      unlockedBadge.appendChild(label);
      card.appendChild(unlockedBadge);
    }

    container.appendChild(card);
  });
}

// ── Tier selector in game setup ───────────────────────────
// gamePassSlug: the game pass to use for all premium tiers (e.g., 'mayim-pass')
function renderTierSelector(gamePassSlug = 'mayim-pass') {
  const container = document.getElementById('tier-selector');
  if (!container || typeof PACK_CATALOGUE === 'undefined') return;

  container.textContent = ''; // Clear safely

  // Look up the game pass to get the price
  const gamePass = GAME_PASS_CATALOGUE?.find(p => p.slug === gamePassSlug);
  const gamePassPrice = gamePass ? `£${gamePass.priceGbp.toFixed(2)}/mo` : '£4.99/mo';

  PACK_CATALOGUE.forEach((pack, idx) => {
    const unlocked = isPackUnlocked(pack.slug);
    const locked   = !unlocked;

    const option = document.createElement('label');
    option.className = 'tier-option' + (locked ? ' tier-option--locked' : '');
    option.htmlFor   = `tier-radio-${pack.slug}`;
    option.style.setProperty('--tier-color', pack.accentColor);

    // Radio input (hidden, driven by the label click)
    const radio = document.createElement('input');
    radio.type      = 'radio';
    radio.name      = 'active-tier';
    radio.id        = `tier-radio-${pack.slug}`;
    radio.className = 'tier-radio-input';
    radio.dataset.slug = pack.slug;
    radio.disabled  = locked;
    if (idx === 0) radio.checked = true; // Starter selected by default

    radio.addEventListener('change', () => {
      if (gameState.mode === 'words') {
        gameState.wordDeck = buildDeck();
      } else {
        gameState.proverbDeck = buildProverbDeck();
      }
      updateSetupComputed();
      updateProverbSetupComputed();
      updateTeamsTierBadge();
    });

    option.appendChild(radio);

    // Left: icon + tier name
    const left = document.createElement('div');
    left.className = 'tier-option-left';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'tier-icon';
    iconSpan.textContent = pack.icon;
    left.appendChild(iconSpan);

    const nameWrap = document.createElement('div');

    const nameP = document.createElement('p');
    nameP.className = 'tier-name';
    nameP.textContent = pack.nameEn;
    nameWrap.appendChild(nameP);

    const profileP = document.createElement('p');
    profileP.className = 'tier-profile';
    profileP.textContent = pack.wordProfile;
    nameWrap.appendChild(profileP);

    left.appendChild(nameWrap);
    option.appendChild(left);

    // Right: badge or lock
    const right = document.createElement('div');
    right.className = 'tier-option-right';

    if (pack.isFree) {
      const badge = document.createElement('span');
      badge.className = 'tier-badge tier-badge--free';
      badge.textContent = 'FREE';
      right.appendChild(badge);
    } else if (unlocked) {
      const badge = document.createElement('span');
      badge.className = 'tier-badge tier-badge--unlocked';
      badge.textContent = '✓ Unlocked';
      right.appendChild(badge);
    } else {
      // Locked tier: show game pass unlock button with price
      const unlockBtn = document.createElement('button');
      unlockBtn.className = 'tier-unlock-btn';
      unlockBtn.textContent = `🔒 ${gamePassPrice}`;
      unlockBtn.dataset.paySlug = gamePassSlug;
      unlockBtn.addEventListener('click', (e) => {
        e.preventDefault(); // don't trigger the label/radio
        e.stopPropagation();
        startPaymentFlow(gamePassSlug); // Use game pass slug, not tier slug
      });
      right.appendChild(unlockBtn);
    }

    option.appendChild(right);
    container.appendChild(option);
  });
}

// Keep old name as alias so any lingering calls don't crash
const renderPackToggles = renderTierSelector;

// Update the Teams section badge to reflect the active tier difficulty.
function updateTeamsTierBadge() {
  const badge = document.getElementById('teams-tier-badge');
  if (!badge) return;
  const slug = getActiveTierSlug();
  if (slug === 'shimagile') {
    badge.textContent = '🟠 Expert';
    badge.dataset.tier = 'expert';
  } else {
    badge.textContent = '🟢 Starter';
    badge.dataset.tier = 'starter';
  }
}

// ── Winner screen upsell ───────────────────────────────────
function renderWinnerUpsell() {
  const upsell = document.getElementById('winner-upsell');
  if (!upsell || typeof PACK_CATALOGUE === 'undefined') return;

  const nextLocked = PACK_CATALOGUE.find(p => !p.isFree && !isPackUnlocked(p.slug));
  if (!nextLocked) { upsell.classList.add('hidden'); return; }

  const iconEl    = document.getElementById('upsell-pack-icon');
  const nameEl    = document.getElementById('upsell-pack-name');
  const profileEl = document.getElementById('upsell-pack-profile');
  const priceEl   = document.getElementById('upsell-pack-price');
  const btn       = document.getElementById('btn-winner-unlock');
  const card      = document.getElementById('upsell-pack-card');

  if (iconEl)    iconEl.textContent    = nextLocked.icon;
  if (nameEl)    nameEl.textContent    = nextLocked.nameEn;
  if (profileEl) profileEl.textContent = nextLocked.wordProfile;
  if (priceEl)   priceEl.textContent   = `£${nextLocked.priceGbp.toFixed(2)}`;
  if (card)      card.style.setProperty('--tier-color', nextLocked.accentColor);

  upsell.classList.remove('hidden');

  // Remove any previous listener clone to avoid stacking
  const freshBtn = btn?.cloneNode(true);
  if (btn && freshBtn) {
    btn.parentNode.replaceChild(freshBtn, btn);
    // Go to pack showcase on landing page so user can unlock
    freshBtn.addEventListener('click', () => {
      window.location.href = 'index.html#pack-showcase';
    });
  }
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ── AUTHENTICATION SYSTEM ────────────────────────────────────────────────────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

let _currentUser          = null;
let _pendingUnlockPackSlug = null; // code-based unlock pending after auth
let _pendingPaymentSlug    = null; // Stripe payment pending after auth

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
      // Sync any DB-unlocked packs that may have been purchased on another device
      fetchAndSyncUnlockedPacks();
    } else {
      updateAuthUI(false);
    }

    // Listen for auth state changes
    _supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        _currentUser = session.user;
        updateAuthUI(true);

        // Sync any DB-unlocked packs into localStorage
        fetchAndSyncUnlockedPacks();

        // Resume pending Stripe payment flow
        if (_pendingPaymentSlug) {
          const slug = _pendingPaymentSlug;
          _pendingPaymentSlug = null;
          setTimeout(() => startPaymentFlow(slug), 300);
        }
        // Resume pending code-based unlock
        else if (_pendingUnlockPackSlug) {
          const slug = _pendingUnlockPackSlug;
          _pendingUnlockPackSlug = null;
          setTimeout(() => openUnlockModal(slug), 300);
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

// ── Google OAuth sign-in ───────────────────────────────────
async function handleGoogleSignIn() {
  if (!_supabase) return;
  try {
    const { error } = await _supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    });
    if (error) throw error;
    // Page will redirect to Google — no further action needed
  } catch (err) {
    showNotification('Google sign-in failed: ' + err.message, 'error');
  }
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

// ── Global ErrorBoundary ──────────────────────────────────────────────
// Catches uncaught errors + unhandled rejections so the user gets a
// human-readable toast instead of a silently broken page. Pipes
// everything through reportError() so logging stays consistent.
// Throttled to one notification per 5 seconds to avoid noise loops.
(function installErrorBoundary() {
  if (typeof window === 'undefined' || window.__errBoundaryInstalled) return;
  window.__errBoundaryInstalled = true;

  let _lastNotifiedAt = 0;
  function notifyOnce(message) {
    const now = Date.now();
    if (now - _lastNotifiedAt < 5000) return;
    _lastNotifiedAt = now;
    if (typeof showNotification === 'function') {
      showNotification(message, 'error');
    }
  }

  // Map low-level errors to user-friendly messages.
  function friendlyMessage(err) {
    const msg = String(err?.message || err || '').toLowerCase();
    if (!navigator.onLine || msg.includes('failed to fetch') || msg.includes('networkerror')) {
      return 'You appear to be offline. Some features may not work.';
    }
    if (msg.includes('quotaexceeded')) {
      return 'Storage is full — try clearing site data.';
    }
    if (msg.includes('unauthorized') || msg.includes('jwt')) {
      return 'Your session expired. Please log in again.';
    }
    return null;  // unknown — silent (still logged)
  }

  window.addEventListener('error', e => {
    // Ignore resource load errors (images, scripts) — only handle JS runtime errors
    if (e.error) {
      reportError(e.error, { kind: 'window.error', src: e.filename, line: e.lineno });
      const m = friendlyMessage(e.error);
      if (m) notifyOnce(m);
    }
  });

  window.addEventListener('unhandledrejection', e => {
    reportError(e.reason || e, { kind: 'unhandledrejection' });
    const m = friendlyMessage(e.reason);
    if (m) notifyOnce(m);
  });

  // Network status: announce restoration so users know retries will work
  window.addEventListener('online', () => {
    if (typeof showNotification === 'function') showNotification('✓ Back online', 'success');
  });
  window.addEventListener('offline', () => {
    if (typeof showNotification === 'function') showNotification('You are offline.', 'info');
  });
})();

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

  // Remove existing dropdown if present
  document.getElementById('profile-dropdown')?.remove();

  if (isLoggedIn && _currentUser) {
    // ── Avatar button that toggles a dropdown ──────────────────
    // Use textContent/DOM methods throughout — never interpolate user data into innerHTML
    const email    = _currentUser.email || '?';
    const initials = email.slice(0, 2).toUpperCase();

    indicator.innerHTML = `
      <button class="profile-avatar-btn" id="profile-avatar-btn" aria-label="Account menu" aria-expanded="false">
        <span class="profile-avatar-initials">${escHtml(initials)}</span>
        <svg class="profile-avatar-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><polyline points="6 9 12 15 18 9"/></svg>
      </button>`;

    const dropdown = document.createElement('div');
    dropdown.id = 'profile-dropdown';
    dropdown.className = 'profile-dropdown hidden';
    dropdown.setAttribute('role', 'menu');
    // Build with DOM — no user data in innerHTML
    const emailDiv = document.createElement('div');
    emailDiv.className = 'profile-dropdown-email';
    emailDiv.textContent = email;
    dropdown.appendChild(emailDiv);
    dropdown.insertAdjacentHTML('beforeend', `
      <a href="profile.html" class="profile-dropdown-item" role="menuitem">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        My Profile
      </a>
      <button class="profile-dropdown-item profile-dropdown-logout" role="menuitem">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Log Out
      </button>`);
    document.body.appendChild(dropdown);

    // Position dropdown under the indicator
    function positionDropdown() {
      const rect = indicator.getBoundingClientRect();
      dropdown.style.top  = (rect.bottom + 8) + 'px';
      dropdown.style.right = (window.innerWidth - rect.right) + 'px';
    }

    // Toggle on avatar click
    document.getElementById('profile-avatar-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !dropdown.classList.contains('hidden');
      dropdown.classList.toggle('hidden', open);
      document.getElementById('profile-avatar-btn')?.setAttribute('aria-expanded', String(!open));
      if (!open) positionDropdown();
    });

    // Logout
    dropdown.querySelector('.profile-dropdown-logout').addEventListener('click', () => {
      dropdown.classList.add('hidden');
      handleLogout();
    });

    // Close on outside click
    document.addEventListener('click', function closeDropdown(e) {
      if (!indicator.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
        document.getElementById('profile-avatar-btn')?.setAttribute('aria-expanded', 'false');
        document.removeEventListener('click', closeDropdown);
      }
    });

  } else {
    indicator.innerHTML = '';
    const loginBtn = document.createElement('button');
    loginBtn.className = 'auth-login-prompt-btn';
    loginBtn.textContent = 'Log in to unlock packs';
    loginBtn.addEventListener('click', () => openAuthModal('signup'));
    indicator.appendChild(loginBtn);
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

// ── Heto Questions Fetching ────────────────────────────────────────────
const HETO_CACHE_KEY = 'heto_questions_cache';
const HETO_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchHetoQuestions(filters = {}) {
  try {
    // Check cache
    const cached = localStorage.getItem(HETO_CACHE_KEY);
    const cacheTime = localStorage.getItem(HETO_CACHE_KEY + '_time');
    if (cached && cacheTime && Date.now() - parseInt(cacheTime) < HETO_CACHE_TTL) {
      let data = JSON.parse(cached);
      if (filters.difficulty) data = data.filter(q => q.difficulty === filters.difficulty);
      if (filters.category) data = data.filter(q => q.category === filters.category);
      return data;
    }

    // Fetch from Supabase with filters
    let query = _supabase.from('heto_questions').select('*');
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
    if (filters.category) query = query.eq('category', filters.category);

    const { data, error } = await query.limit(100);
    if (error) throw error;

    // Cache result
    localStorage.setItem(HETO_CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(HETO_CACHE_KEY + '_time', Date.now().toString());

    return data || [];
  } catch (err) {
    console.warn('Failed to fetch Heto questions:', err);
    return [];
  }
}

// Expose to global scope for heto.html
window.fetchHetoQuestions = fetchHetoQuestions;
