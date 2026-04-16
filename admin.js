'use strict';
// ═══════════════════════════════════════════════════════════
//  Mayim Admin Panel  —  admin.js
//  Words + Proverbs CRUD with tier assignment
// ═══════════════════════════════════════════════════════════

const SUPABASE_URL     = 'https://rzcrdngpybrsjlbenqep.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Y3JkbmdweWJyc2psYmVucWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMDU4MDMsImV4cCI6MjA5MDg4MTgwM30.ILN4ZrvMX5sfbd8mCnnnal9-U4ojQ-SVYTUuS1QoqaE';

let _sb          = null;
let currentUser  = null;
let allWords     = [];
let allProverbs  = [];
let allPacks     = [];   // [{id, slug, tier_label, sequence_order, name_en}]
let pendingDeleteType = null; // 'word' | 'proverb'
let pendingDeleteId   = null;
let pendingDeleteName = null;

// ── Init ──────────────────────────────────────────────────
function initSupabase() {
  _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ── Auth ──────────────────────────────────────────────────
async function checkAuth() {
  const { data } = await _sb.auth.getSession();
  currentUser = data.session?.user || null;
  if (currentUser) { await onSignedIn(); } else { showAuthScreen(); }
}

async function onSignedIn() {
  showAdminScreen();
  document.getElementById('admin-user-info').textContent = `📧 ${currentUser.email}`;
  await loadPacks();
  await Promise.all([loadAllWords(), loadAllProverbs()]);
}

async function loginUser(email) {
  const { error } = await _sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + '/admin.html' },
  });
  if (error) { showToast('❌ ' + error.message, 'error'); return; }
  showToast('✓ Check your email for the login link!', 'success');
}

async function logoutUser() {
  await _sb.auth.signOut();
  currentUser = null;
  showAuthScreen();
  showToast('✓ Logged out', 'success');
}

// ── Packs (tier list) ─────────────────────────────────────
async function loadPacks() {
  const { data, error } = await _sb
    .from('packs')
    .select('id, slug, name_en, tier_label, sequence_order')
    .order('sequence_order');

  if (error) { showToast('❌ Could not load tiers: ' + error.message, 'error'); return; }
  allPacks = data || [];
  populatePackSelects();
}

function populatePackSelects() {
  const selects = [
    'input-pack', 'edit-word-pack',
    'input-proverb-pack', 'edit-proverb-pack',
    'filter-tier', 'filter-proverb-tier',
  ];

  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const isFilter = id.startsWith('filter-');
    // Keep blank/first option
    const blank = el.options[0];
    el.textContent = '';
    el.appendChild(blank);

    allPacks.forEach(p => {
      const opt = document.createElement('option');
      opt.value = isFilter ? p.slug : p.id;
      const icon = { starter:'🟢', intermediate:'🔵', advanced:'🟣', expert:'🟠' }[p.tier_label] || '⬜';
      opt.textContent = `${icon} ${p.name_en}`;
      el.appendChild(opt);
    });
  });
}

// Helper: pack id → display name
function packName(pack_id) {
  const p = allPacks.find(p => p.id === pack_id);
  if (!p) return '—';
  const icon = { starter:'🟢', intermediate:'🔵', advanced:'🟣', expert:'🟠' }[p.tier_label] || '⬜';
  return `${icon} ${p.name_en}`;
}

// ── WORDS CRUD ────────────────────────────────────────────
async function loadAllWords() {
  const { data, error } = await _sb
    .from('words')
    .select('*')
    .order('pack_id')
    .order('word');
  if (error) { showToast('❌ ' + error.message, 'error'); return; }
  allWords = data || [];
  renderWordsTable(allWords);
  updateWordStats();
}

async function createWord(word, latin, english, category, pack_id) {
  const { error } = await _sb.from('words').insert([{ word, latin, english, category, pack_id }]);
  if (error) { showToast('❌ ' + error.message, 'error'); return; }
  showToast(`✓ Added word: ${word}`, 'success');
  document.getElementById('form-add-word').reset();
  await loadAllWords();
}

async function updateWord(id, updates) {
  const { error } = await _sb.from('words').update(updates).eq('id', id);
  if (error) { showToast('❌ ' + error.message, 'error'); return; }
  showToast('✓ Word updated', 'success');
  closeModal('edit-word-modal');
  await loadAllWords();
}

async function deleteWord(id) {
  const { error } = await _sb.from('words').delete().eq('id', id);
  if (error) { showToast('❌ ' + error.message, 'error'); return; }
  showToast('✓ Word deleted', 'success');
  closeModal('confirm-modal');
  await loadAllWords();
}

function updateWordStats() {
  document.getElementById('stat-total').textContent = allWords.length;
  const counts = { starter: 0, intermediate: 0, advanced: 0, expert: 0 };
  allWords.forEach(w => {
    const pack = allPacks.find(p => p.id === w.pack_id);
    if (pack) counts[pack.tier_label] = (counts[pack.tier_label] || 0) + 1;
  });
  document.getElementById('stat-starter').textContent      = counts.starter;
  document.getElementById('stat-intermediate').textContent = counts.intermediate;
  document.getElementById('stat-advanced').textContent     = counts.advanced;
  document.getElementById('stat-expert').textContent       = counts.expert;
}

function renderWordsTable(words) {
  const tbody = document.getElementById('words-tbody');
  tbody.textContent = '';

  if (!words.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No words found</td></tr>';
    return;
  }

  words.forEach(w => {
    const tr = document.createElement('tr');

    const tierBadge = (() => {
      const pack = allPacks.find(p => p.id === w.pack_id);
      if (!pack) return '<span class="badge badge--grey">—</span>';
      const colors = { starter:'green', intermediate:'blue', advanced:'purple', expert:'orange' };
      return `<span class="badge badge--${colors[pack.tier_label] || 'grey'}">${packName(w.pack_id)}</span>`;
    })();

    tr.innerHTML = `
      <td><strong lang="ti">${escHtml(w.word)}</strong></td>
      <td>${escHtml(w.latin)}</td>
      <td>${escHtml(w.english)}</td>
      <td><span class="badge badge--grey">${escHtml(w.category)}</span></td>
      <td>${tierBadge}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-sm btn-primary"  data-id="${w.id}" data-action="edit-word">Edit</button>
          <button class="btn btn-sm btn-danger"   data-id="${w.id}" data-word="${escHtml(w.word)}" data-action="delete-word">Del</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-action="edit-word"]').forEach(btn =>
    btn.addEventListener('click', () => openEditWordModal(btn.dataset.id)));
  tbody.querySelectorAll('[data-action="delete-word"]').forEach(btn =>
    btn.addEventListener('click', () => openConfirmModal('word', btn.dataset.id, btn.dataset.word)));
}

function openEditWordModal(id) {
  const w = allWords.find(x => x.id === id);
  if (!w) return;
  document.getElementById('edit-word-id').value       = w.id;
  document.getElementById('edit-word-tigrinya').value = w.word;
  document.getElementById('edit-word-latin').value    = w.latin;
  document.getElementById('edit-word-english').value  = w.english;
  document.getElementById('edit-word-category').value = w.category;
  document.getElementById('edit-word-pack').value     = w.pack_id || '';
  openModal('edit-word-modal');
}

function filterWords() {
  const search   = document.getElementById('search-words').value.toLowerCase();
  const category = document.getElementById('filter-category').value;
  const tierSlug = document.getElementById('filter-tier').value;

  let list = allWords;
  if (search)   list = list.filter(w =>
    w.word.includes(search) || w.latin.toLowerCase().includes(search) || w.english.toLowerCase().includes(search));
  if (category) list = list.filter(w => w.category === category);
  if (tierSlug) {
    const pack = allPacks.find(p => p.slug === tierSlug);
    if (pack) list = list.filter(w => w.pack_id === pack.id);
  }
  renderWordsTable(list);
}

// ── PROVERBS CRUD ─────────────────────────────────────────
async function loadAllProverbs() {
  const { data, error } = await _sb
    .from('proverbs')
    .select('*')
    .order('pack_id')
    .order('difficulty');
  if (error) { showToast('❌ ' + error.message, 'error'); return; }
  allProverbs = data || [];
  renderProverbsTable(allProverbs);
  updateProverbStats();
}

async function createProverb(tigrinya, latin, english, difficulty, pack_id) {
  const { error } = await _sb.from('proverbs').insert([{ tigrinya, latin, english, difficulty, pack_id }]);
  if (error) { showToast('❌ ' + error.message, 'error'); return; }
  showToast(`✓ Added proverb`, 'success');
  document.getElementById('form-add-proverb').reset();
  await loadAllProverbs();
}

async function updateProverb(id, updates) {
  const { error } = await _sb.from('proverbs').update(updates).eq('id', id);
  if (error) { showToast('❌ ' + error.message, 'error'); return; }
  showToast('✓ Proverb updated', 'success');
  closeModal('edit-proverb-modal');
  await loadAllProverbs();
}

async function deleteProverb(id) {
  const { error } = await _sb.from('proverbs').delete().eq('id', id);
  if (error) { showToast('❌ ' + error.message, 'error'); return; }
  showToast('✓ Proverb deleted', 'success');
  closeModal('confirm-modal');
  await loadAllProverbs();
}

function updateProverbStats() {
  document.getElementById('stat-proverbs-total').textContent  = allProverbs.length;
  document.getElementById('stat-proverbs-easy').textContent   = allProverbs.filter(p => p.difficulty === 'easy').length;
  document.getElementById('stat-proverbs-medium').textContent = allProverbs.filter(p => p.difficulty === 'medium').length;
  document.getElementById('stat-proverbs-hard').textContent   = allProverbs.filter(p => p.difficulty === 'hard').length;
}

function renderProverbsTable(proverbs) {
  const tbody = document.getElementById('proverbs-tbody');
  tbody.textContent = '';

  if (!proverbs.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No proverbs found</td></tr>';
    return;
  }

  proverbs.forEach(p => {
    const tr = document.createElement('tr');
    const diffColor = { easy: 'green', medium: 'blue', hard: 'orange' }[p.difficulty] || 'grey';
    const pack = allPacks.find(pk => pk.id === p.pack_id);
    const tierColor = pack ? { starter:'green', intermediate:'blue', advanced:'purple', expert:'orange' }[pack.tier_label] : 'grey';

    tr.innerHTML = `
      <td lang="ti" class="proverb-cell">${escHtml(p.tigrinya)}</td>
      <td class="proverb-cell">${escHtml(p.latin)}</td>
      <td class="proverb-cell">${escHtml(p.english)}</td>
      <td><span class="badge badge--${diffColor}">${p.difficulty}</span></td>
      <td><span class="badge badge--${tierColor}">${packName(p.pack_id)}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn btn-sm btn-primary" data-id="${p.id}" data-action="edit-proverb">Edit</button>
          <button class="btn btn-sm btn-danger"  data-id="${p.id}" data-action="delete-proverb">Del</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-action="edit-proverb"]').forEach(btn =>
    btn.addEventListener('click', () => openEditProverbModal(btn.dataset.id)));
  tbody.querySelectorAll('[data-action="delete-proverb"]').forEach(btn =>
    btn.addEventListener('click', () => openConfirmModal('proverb', btn.dataset.id, 'this proverb')));
}

function openEditProverbModal(id) {
  const p = allProverbs.find(x => x.id === id);
  if (!p) return;
  document.getElementById('edit-proverb-id').value         = p.id;
  document.getElementById('edit-proverb-tigrinya').value   = p.tigrinya;
  document.getElementById('edit-proverb-latin').value      = p.latin;
  document.getElementById('edit-proverb-english').value    = p.english;
  document.getElementById('edit-proverb-difficulty').value = p.difficulty;
  document.getElementById('edit-proverb-pack').value       = p.pack_id || '';
  openModal('edit-proverb-modal');
}

function filterProverbs() {
  const search     = document.getElementById('search-proverbs').value.toLowerCase();
  const difficulty = document.getElementById('filter-proverb-difficulty').value;
  const tierSlug   = document.getElementById('filter-proverb-tier').value;

  let list = allProverbs;
  if (search)     list = list.filter(p =>
    p.tigrinya.toLowerCase().includes(search) || p.english.toLowerCase().includes(search));
  if (difficulty) list = list.filter(p => p.difficulty === difficulty);
  if (tierSlug) {
    const pack = allPacks.find(p => p.slug === tierSlug);
    if (pack) list = list.filter(p => p.pack_id === pack.id);
  }
  renderProverbsTable(list);
}

// ── Delete confirm (shared) ───────────────────────────────
function openConfirmModal(type, id, name) {
  pendingDeleteType = type;
  pendingDeleteId   = id;
  pendingDeleteName = name;
  document.getElementById('confirm-message').textContent =
    `Delete "${name}"? This cannot be undone.`;
  openModal('confirm-modal');
}

// ── Modal helpers ─────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// ── Screen helpers ────────────────────────────────────────
function showAuthScreen() {
  document.getElementById('screen-auth').classList.remove('hidden');
  document.getElementById('screen-admin').classList.add('hidden');
  document.getElementById('admin-header').style.display = 'none';
}

function showAdminScreen() {
  document.getElementById('screen-auth').classList.add('hidden');
  document.getElementById('screen-admin').classList.remove('hidden');
  document.getElementById('admin-header').style.display = 'block';
}

// ── Toast ─────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

// ── XSS-safe helper ───────────────────────────────────────
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── Event wiring ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initSupabase();

  // ── Login
  document.getElementById('form-login').addEventListener('submit', e => {
    e.preventDefault();
    loginUser(document.getElementById('login-email').value.trim());
  });
  document.getElementById('btn-logout').addEventListener('click', logoutUser);

  // ── Tabs
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');
    });
  });

  // ── Add word
  document.getElementById('form-add-word').addEventListener('submit', e => {
    e.preventDefault();
    createWord(
      document.getElementById('input-word').value.trim(),
      document.getElementById('input-latin').value.trim(),
      document.getElementById('input-english').value.trim(),
      document.getElementById('input-category').value,
      document.getElementById('input-pack').value,
    );
  });

  // ── Edit word submit
  document.getElementById('form-edit-word').addEventListener('submit', e => {
    e.preventDefault();
    updateWord(document.getElementById('edit-word-id').value, {
      word:     document.getElementById('edit-word-tigrinya').value.trim(),
      latin:    document.getElementById('edit-word-latin').value.trim(),
      english:  document.getElementById('edit-word-english').value.trim(),
      category: document.getElementById('edit-word-category').value,
      pack_id:  document.getElementById('edit-word-pack').value,
    });
  });
  document.getElementById('btn-cancel-edit-word').addEventListener('click', () => closeModal('edit-word-modal'));

  // ── Add proverb
  document.getElementById('form-add-proverb').addEventListener('submit', e => {
    e.preventDefault();
    createProverb(
      document.getElementById('input-proverb-tigrinya').value.trim(),
      document.getElementById('input-proverb-latin').value.trim(),
      document.getElementById('input-proverb-english').value.trim(),
      document.getElementById('input-proverb-difficulty').value,
      document.getElementById('input-proverb-pack').value,
    );
  });

  // ── Edit proverb submit
  document.getElementById('form-edit-proverb').addEventListener('submit', e => {
    e.preventDefault();
    updateProverb(document.getElementById('edit-proverb-id').value, {
      tigrinya:   document.getElementById('edit-proverb-tigrinya').value.trim(),
      latin:      document.getElementById('edit-proverb-latin').value.trim(),
      english:    document.getElementById('edit-proverb-english').value.trim(),
      difficulty: document.getElementById('edit-proverb-difficulty').value,
      pack_id:    document.getElementById('edit-proverb-pack').value,
    });
  });
  document.getElementById('btn-cancel-edit-proverb').addEventListener('click', () => closeModal('edit-proverb-modal'));

  // ── Delete confirmation
  document.getElementById('btn-confirm-delete').addEventListener('click', () => {
    if (pendingDeleteType === 'word')    deleteWord(pendingDeleteId);
    if (pendingDeleteType === 'proverb') deleteProverb(pendingDeleteId);
  });
  document.getElementById('btn-cancel-confirm').addEventListener('click', () => closeModal('confirm-modal'));

  // ── Word filters
  document.getElementById('search-words').addEventListener('input', filterWords);
  document.getElementById('filter-category').addEventListener('change', filterWords);
  document.getElementById('filter-tier').addEventListener('change', filterWords);

  // ── Proverb filters
  document.getElementById('search-proverbs').addEventListener('input', filterProverbs);
  document.getElementById('filter-proverb-difficulty').addEventListener('change', filterProverbs);
  document.getElementById('filter-proverb-tier').addEventListener('change', filterProverbs);

  // ── Auth
  await checkAuth();
  _sb.auth.onAuthStateChange(async (event, session) => {
    currentUser = session?.user || null;
    if (event === 'SIGNED_IN' || event === 'USER_UPDATED') await onSignedIn();
  });
});
