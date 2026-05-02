'use strict';
// ═══════════════════════════════════════════════════════════
//  Mayim Admin Panel  —  admin.js
//  Words + Proverbs CRUD with tier assignment
// ═══════════════════════════════════════════════════════════

const SUPABASE_URL     = 'https://rzcrdngpybrsjlbenqep.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Y3JkbmdweWJyc2psYmVucWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMDU4MDMsImV4cCI6MjA5MDg4MTgwM30.ILN4ZrvMX5sfbd8mCnnnal9-U4ojQ-SVYTUuS1QoqaE';

// ── Admin whitelist — only these emails can access the panel ──
const ADMIN_EMAILS = ['mnahom23@gmail.com', 'nahom.developer@gmail.com'];

let _sb          = null;
let currentUser  = null;
let allWords     = [];
let allProverbs  = [];
let allHeto      = [];   // Heto questions
let allRiddles   = [];   // Riddles (ፍልጠለይ)
let allPacks     = [];   // [{id, slug, tier_label, sequence_order, name_en}]
let pendingDeleteType = null; // 'word' | 'proverb' | 'heto' | 'riddle'
let pendingDeleteId   = null;
let pendingDeleteName = null;

// ── Init ──────────────────────────────────────────────────
function initSupabase() {
  _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, detectSessionInUrl: false }
  });

  // React to sign-out (e.g. session expired)
  _sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      currentUser = null;
      showAuthScreen();
    }
  });
}

// ── Auth ─────────────────────────────────────────────────
// Admin reuses the session created by the game on the same domain.
// No separate login — just open the game, sign in there, then come here.
async function checkAuth() {
  const { data } = await _sb.auth.getSession();
  currentUser = data.session?.user || null;
  if (currentUser) { await onSignedIn(); } else { showAuthScreen(); }
}

async function onSignedIn() {
  // ── Admin whitelist check ──────────────────────────────
  if (!ADMIN_EMAILS.includes(currentUser.email?.toLowerCase())) {
    await _sb.auth.signOut();
    showAuthScreen();
    const errEl = document.getElementById('login-error');
    if (errEl) { errEl.textContent = '⛔ Access denied — not an admin account.'; errEl.classList.remove('hidden'); }
    return;
  }

  // Show shell immediately — don't block on data
  showAdminScreen();
  document.getElementById('admin-user-info').textContent = `📧 ${currentUser.email}`;

  // Load data in background with individual error handling
  try { await loadPacks(); } catch(e) { console.error('loadPacks failed:', e); }
  await Promise.allSettled([
    loadAllWords().catch(e => console.error('loadAllWords failed:', e)),
    loadAllProverbs().catch(e => console.error('loadAllProverbs failed:', e)),
    loadAllHeto().catch(e => console.error('loadAllHeto failed:', e)),
    loadAllRiddles().catch(e => console.error('loadAllRiddles failed:', e)),
    loadAllGrants().catch(e => console.error('loadAllGrants failed:', e)),
  ]);
}


async function logoutUser() {
  await _sb.auth.signOut();
  currentUser = null;
  showAuthScreen();
  showToast('✓ Logged out', 'success');
}

// ── Packs (tier list) ─────────────────────────────────────
// Fallback pack list — used if DB query fails or returns empty
const FALLBACK_PACKS = [
  { id: 'ebaec11f-dbb3-4625-b810-6c0f85624d25', slug: 'gasha',     name_en: 'Gasha — The Guest',           tier_label: 'starter',      sequence_order: 1 },
  { id: 'c57b5398-f954-4801-8413-36198b728317', slug: 'qola',      name_en: "Qol'a — The Baby",            tier_label: 'intermediate', sequence_order: 2 },
  { id: '6301d663-0989-4473-b2ab-f40a050e1e38', slug: 'gobez',     name_en: 'Gobez — The Cool Youth',      tier_label: 'advanced',     sequence_order: 3 },
  { id: '081261fa-5174-47de-9c3f-40723690372a', slug: 'shimagile', name_en: 'Shimagile — The Village Elder', tier_label: 'expert',     sequence_order: 4 },
];

// Fallback game passes — used when packs.js isn't loaded or GAME_PASS_CATALOGUE is missing
const FALLBACK_GAME_PASSES = [
  { slug: 'mayim-pass',  icon: '🔴', nameEn: 'MAYIM & MISLA Pass',      priceGbp: 2.99 },
  { slug: 'hito-pass',   icon: '🟠', nameEn: 'HITO Pass',               priceGbp: 1.99 },
  { slug: 'hinqle-pass', icon: '🟢', nameEn: 'Hinqle Hinqilitey Pass',  priceGbp: 1.99 },
  { slug: 'all-games',   icon: '⭐', nameEn: 'All Games',               priceGbp: 4.99 },
];

async function loadPacks() {
  const { data, error } = await _sb
    .from('packs')
    .select('id, slug, name_en, tier_label, sequence_order')
    .order('sequence_order');

  if (error) {
    showToast('⚠️ Could not load tiers from DB — using defaults', 'error');
    allPacks = FALLBACK_PACKS;
    populatePackSelects();
    return;
  }
  allPacks = (data && data.length > 0) ? data : FALLBACK_PACKS;
  populatePackSelects();
}

function populatePackSelects() {
  // Tier selects (words, proverbs, filters)
  const tierSelects = [
    'input-pack', 'edit-word-pack',
    'input-proverb-pack', 'edit-proverb-pack',
    'filter-tier', 'filter-proverb-tier',
  ];

  const TIER_ICONS = { starter:'🟢', intermediate:'🔵', advanced:'🟣', expert:'🟠' };

  tierSelects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const useSlug = id.startsWith('filter-');
    const blank = (el.options[0]?.value === '') ? el.options[0] : null;
    el.textContent = '';
    if (blank) el.appendChild(blank);

    const packsToShow = allPacks.filter(p => TIER_ICONS[p.tier_label]);
    packsToShow.forEach(p => {
      const opt = document.createElement('option');
      opt.value = useSlug ? p.slug : p.id;
      opt.textContent = `${TIER_ICONS[p.tier_label]} ${p.name_en}`;
      el.appendChild(opt);
    });
  });

  // Grant select — game passes only
  const grantEl = document.getElementById('grant-pack');
  if (grantEl) {
    const blank = (grantEl.options[0]?.value === '') ? grantEl.options[0] : null;
    grantEl.textContent = '';
    if (blank) grantEl.appendChild(blank);

    const passes = (typeof GAME_PASS_CATALOGUE !== 'undefined') ? GAME_PASS_CATALOGUE : FALLBACK_GAME_PASSES;
    passes.forEach(gp => {
      const opt = document.createElement('option');
      opt.value = gp.slug;
      opt.textContent = `${gp.icon} ${gp.nameEn} — £${gp.priceGbp}/mo`;
      grantEl.appendChild(opt);
    });
  }
}

// Helper: pack id → display name (word-tier packs only)
const TIER_ICONS_MAP = { starter:'🟢', intermediate:'🔵', advanced:'🟣', expert:'🟠' };
function packName(pack_id) {
  const p = allPacks.find(p => p.id === pack_id);
  if (!p) return '—';
  return `${TIER_ICONS_MAP[p.tier_label] ?? '⬜'} ${p.name_en}`;
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
  // Prevent duplicates — check in-memory list before hitting DB
  const isDup = allWords.some(w =>
    w.word.trim().toLowerCase() === word.trim().toLowerCase() && w.pack_id === pack_id
  );
  if (isDup) {
    showToast(`❌ "${word}" already exists in this pack`, 'error');
    return;
  }
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
  // Prevent duplicates — check in-memory list before hitting DB
  const isDup = allProverbs.some(p =>
    p.tigrinya.trim().toLowerCase() === tigrinya.trim().toLowerCase() && p.pack_id === pack_id
  );
  if (isDup) {
    showToast('❌ This proverb already exists in this pack', 'error');
    return;
  }
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
    const diffColor = { easy: 'green', medium: 'blue', hard: 'orange', expert: 'red' }[p.difficulty] || 'grey';
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

// ── GRANTS (manual pack access) ───────────────────────────
let allGrants = [];

async function loadAllGrants() {
  const { data, error } = await _sb
    .from('user_pack_unlocks')
    .select('id, user_id, pack_id, payment_method, unlocked_at')
    .eq('payment_method', 'manual')
    .order('unlocked_at', { ascending: false });
  if (error) { console.warn('Could not load grants:', error.message); return; }
  allGrants = data || [];
  renderGrantsTable();
}

async function grantPackAccess(email, packSlug) {
  const errEl  = document.getElementById('grant-error');
  const succEl = document.getElementById('grant-success');
  errEl.classList.add('hidden');
  succEl.classList.add('hidden');

  try {
    // Refresh session to avoid stale token 401s
    await _sb.auth.refreshSession();
    const { data: { session } } = await _sb.auth.getSession();
    if (!session) throw new Error('Session expired — please refresh the page and log in again');
    const res = await fetch(
      'https://rzcrdngpybrsjlbenqep.functions.supabase.co/admin-grant-pack',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ target_email: email, pack_slug: packSlug }),
      }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Grant failed');

    succEl.textContent = `✓ ${json.message}`;
    succEl.classList.remove('hidden');
    document.getElementById('form-grant').reset();
    await loadAllGrants();
  } catch (err) {
    errEl.textContent = '❌ ' + err.message;
    errEl.classList.remove('hidden');
  }
}

async function revokeGrant(id) {
  const { error } = await _sb.from('user_pack_unlocks').delete().eq('id', id);
  if (error) { showToast('❌ ' + error.message, 'error'); return; }
  showToast('✓ Access revoked', 'success');
  await loadAllGrants();
}

function grantPassName(pack_id) {
  // Check if the granted pack matches a game pass
  const pack = allPacks.find(p => p.id === pack_id);
  if (!pack) return { icon: '⬜', name: '—' };
  const passes = (typeof GAME_PASS_CATALOGUE !== 'undefined') ? GAME_PASS_CATALOGUE : FALLBACK_GAME_PASSES;
  const gp = passes.find(g => g.slug === pack.slug);
  if (gp) return { icon: gp.icon, name: gp.nameEn };
  // Fallback to tier display
  const icon = TIER_ICONS_MAP[pack.tier_label] || '⬜';
  return { icon, name: pack.name_en };
}

function renderGrantsTable() {
  const tbody = document.getElementById('grants-tbody');
  if (!tbody) return;
  tbody.textContent = '';
  if (!allGrants.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No manual grants yet</td></tr>';
    return;
  }
  allGrants.forEach(g => {
    const { icon, name } = grantPassName(g.pack_id);
    const date = new Date(g.unlocked_at).toLocaleDateString();
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escHtml(g.user_id)}</td>
      <td><span class="badge badge--grey">${icon} ${escHtml(name)}</span></td>
      <td>${date}</td>
      <td><button class="btn btn-sm btn-danger" data-id="${g.id}" data-action="revoke">Revoke</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('[data-action="revoke"]').forEach(btn =>
    btn.addEventListener('click', () => revokeGrant(btn.dataset.id)));
}

// ── HETO QUESTIONS CRUD ──────────────────────────────────
async function loadAllHeto() {
  const { data, error } = await _sb
    .from('heto_questions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { showToast('❌ ' + error.message, 'error'); return; }
  allHeto = data || [];
  renderHetoTable(allHeto);
  updateHetoStats();
}

async function createHeto() {
  const question = document.getElementById('input-heto-question').value.trim();
  const question_latin = document.getElementById('input-heto-question-latin').value.trim();
  const explanation = document.getElementById('input-heto-explanation').value.trim();
  const category = document.getElementById('input-heto-category').value;
  const difficulty = document.getElementById('input-heto-difficulty').value;
  // Get selected correct answer
  const correct = document.querySelector('input[name="heto-correct"]:checked')?.value;

  // Build options array
  const optionA = document.getElementById('input-heto-option-a').value.trim();
  const optionA_latin = document.getElementById('input-heto-option-a-latin').value.trim();
  const optionB = document.getElementById('input-heto-option-b').value.trim();
  const optionB_latin = document.getElementById('input-heto-option-b-latin').value.trim();
  const optionC = document.getElementById('input-heto-option-c').value.trim();
  const optionC_latin = document.getElementById('input-heto-option-c-latin').value.trim();
  const optionD = document.getElementById('input-heto-option-d').value.trim();
  const optionD_latin = document.getElementById('input-heto-option-d-latin').value.trim();

  // Validate
  if (!question || !question_latin || !optionA || !optionB || !optionC || !optionD || !correct || !category) {
    showToast('❌ Please fill in all required fields', 'error');
    return;
  }

  // Prevent duplicates — check in-memory list before hitting DB
  const isDup = allHeto.some(q =>
    q.question.trim().toLowerCase() === question.trim().toLowerCase()
  );
  if (isDup) {
    showToast('❌ This question already exists', 'error');
    return;
  }

  const options = [
    { label: 'A', text: optionA, latin: optionA_latin },
    { label: 'B', text: optionB, latin: optionB_latin },
    { label: 'C', text: optionC, latin: optionC_latin },
    { label: 'D', text: optionD, latin: optionD_latin },
  ];

  const { error } = await _sb.from('heto_questions').insert([{
    question,
    question_latin,
    options,
    correct_option: correct,
    explanation: explanation || null,
    category,
    difficulty,
  }]);

  if (error) { showToast('❌ ' + error.message, 'error'); return; }
  showToast('✓ Question added', 'success');
  document.getElementById('form-add-heto').reset();
  await loadAllHeto();
}

async function updateHeto(id) {
  const question = document.getElementById('edit-heto-question').value.trim();
  const question_latin = document.getElementById('edit-heto-question-latin').value.trim();
  const explanation = document.getElementById('edit-heto-explanation').value.trim();
  const category = document.getElementById('edit-heto-category').value;
  const difficulty = document.getElementById('edit-heto-difficulty').value;
  const correct = document.querySelector('input[name="edit-heto-correct"]:checked')?.value;

  const optionA = document.getElementById('edit-heto-option-a').value.trim();
  const optionA_latin = document.getElementById('edit-heto-option-a-latin').value.trim();
  const optionB = document.getElementById('edit-heto-option-b').value.trim();
  const optionB_latin = document.getElementById('edit-heto-option-b-latin').value.trim();
  const optionC = document.getElementById('edit-heto-option-c').value.trim();
  const optionC_latin = document.getElementById('edit-heto-option-c-latin').value.trim();
  const optionD = document.getElementById('edit-heto-option-d').value.trim();
  const optionD_latin = document.getElementById('edit-heto-option-d-latin').value.trim();

  if (!question || !question_latin || !optionA || !optionB || !optionC || !optionD || !correct || !category) {
    showToast('❌ Please fill in all required fields', 'error');
    return;
  }

  const options = [
    { label: 'A', text: optionA, latin: optionA_latin },
    { label: 'B', text: optionB, latin: optionB_latin },
    { label: 'C', text: optionC, latin: optionC_latin },
    { label: 'D', text: optionD, latin: optionD_latin },
  ];

  const { error } = await _sb.from('heto_questions').update({
    question,
    question_latin,
    options,
    correct_option: correct,
    explanation: explanation || null,
    category,
    difficulty,
    updated_at: new Date().toISOString(),
  }).eq('id', id);

  if (error) { showToast('❌ ' + error.message, 'error'); return; }
  showToast('✓ Question updated', 'success');
  closeModal('edit-heto-modal');
  await loadAllHeto();
}

async function deleteHeto(id) {
  const { error } = await _sb.from('heto_questions').delete().eq('id', id);
  if (error) { showToast('❌ ' + error.message, 'error'); return; }
  showToast('✓ Question deleted', 'success');
  closeModal('confirm-modal');
  await loadAllHeto();
}

function updateHetoStats() {
  document.getElementById('stat-heto-total').textContent  = allHeto.length;
  document.getElementById('stat-heto-easy').textContent   = allHeto.filter(q => q.difficulty === 'easy').length;
  document.getElementById('stat-heto-medium').textContent = allHeto.filter(q => q.difficulty === 'medium').length;
  document.getElementById('stat-heto-hard').textContent   = allHeto.filter(q => q.difficulty === 'hard').length;
}

function renderHetoTable(questions) {
  const tbody = document.getElementById('heto-tbody');
  tbody.textContent = '';

  if (!questions.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No questions found</td></tr>';
    return;
  }

  questions.forEach(q => {
    const tr = document.createElement('tr');
    const diffColor = { easy: 'green', medium: 'blue', hard: 'orange' }[q.difficulty] || 'grey';

    tr.innerHTML = `
      <td lang="ti" class="question-cell">${escHtml(q.question.substring(0, 50))}</td>
      <td><strong>${q.correct_option}</strong></td>
      <td><span class="badge badge--grey">${escHtml(q.category)}</span></td>
      <td><span class="badge badge--${diffColor}">${q.difficulty}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn btn-sm btn-primary" data-id="${q.id}" data-action="edit-heto">Edit</button>
          <button class="btn btn-sm btn-danger"  data-id="${q.id}" data-action="delete-heto">Del</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-action="edit-heto"]').forEach(btn =>
    btn.addEventListener('click', () => openEditHetoModal(btn.dataset.id)));
  tbody.querySelectorAll('[data-action="delete-heto"]').forEach(btn =>
    btn.addEventListener('click', () => openConfirmModal('heto', btn.dataset.id, 'this question')));
}

function openEditHetoModal(id) {
  const q = allHeto.find(x => x.id === id);
  if (!q) return;

  document.getElementById('edit-heto-id').value = q.id;
  document.getElementById('edit-heto-question').value = q.question;
  document.getElementById('edit-heto-question-latin').value = q.question_latin;

  // Populate options
  if (q.options && Array.isArray(q.options)) {
    ['A', 'B', 'C', 'D'].forEach((label, idx) => {
      const opt = q.options[idx];
      if (opt) {
        document.getElementById(`edit-heto-option-${label}`).value = opt.text || '';
        document.getElementById(`edit-heto-option-${label}-latin`).value = opt.latin || '';
      }
    });
  }

  // Set correct answer
  document.querySelector(`input[name="edit-heto-correct"][value="${q.correct_option}"]`).checked = true;

  document.getElementById('edit-heto-explanation').value = q.explanation || '';
  document.getElementById('edit-heto-category').value = q.category;
  document.getElementById('edit-heto-difficulty').value = q.difficulty;
  document.getElementById('edit-heto-pack').value = q.pack_id || '';

  openModal('edit-heto-modal');
}

function filterHeto() {
  const search = document.getElementById('search-heto').value.toLowerCase();
  const category = document.getElementById('filter-heto-category').value;
  const difficulty = document.getElementById('filter-heto-difficulty').value;

  let list = allHeto;
  if (search) {
    list = list.filter(q =>
      q.question.toLowerCase().includes(search) ||
      q.question_latin.toLowerCase().includes(search) ||
      (q.options && q.options.some(o => o.text.toLowerCase().includes(search)))
    );
  }
  if (category) list = list.filter(q => q.category === category);
  if (difficulty) list = list.filter(q => q.difficulty === difficulty);

  renderHetoTable(list);
}

// ── RIDDLES CRUD (ፍልጠለይ) ────────────────────────────────────
async function loadAllRiddles() {
  const { data, error } = await _sb.from('riddles').select('*').order('created_at', { ascending: true });
  if (error) { console.error('loadAllRiddles:', error); return; }
  allRiddles = data || [];
  renderRiddlesTable(allRiddles);
  updateRiddlesStats();
}

async function createRiddle() {
  const question       = document.getElementById('input-riddle-question').value.trim();
  const question_latin = document.getElementById('input-riddle-question-latin').value.trim();
  const answer         = document.getElementById('input-riddle-answer').value.trim();
  const answer_latin   = document.getElementById('input-riddle-answer-latin').value.trim();
  const hint           = document.getElementById('input-riddle-hint').value.trim() || null;
  const category       = document.getElementById('input-riddle-category').value;
  const difficulty     = document.getElementById('input-riddle-difficulty').value;

  if (!question || !question_latin || !answer || !answer_latin || !category || !difficulty) {
    showToast('Fill in all required fields', 'error'); return;
  }

  const { error } = await _sb.from('riddles').insert([{
    question, question_latin, answer, answer_latin, hint, category, difficulty
  }]);

  if (error) { showToast('Error adding riddle: ' + error.message, 'error'); return; }
  showToast('Riddle added ✓', 'success');
  document.getElementById('form-add-riddle').reset();
  await loadAllRiddles();
}

async function updateRiddle(id) {
  const question       = document.getElementById('edit-riddle-question').value.trim();
  const question_latin = document.getElementById('edit-riddle-question-latin').value.trim();
  const answer         = document.getElementById('edit-riddle-answer').value.trim();
  const answer_latin   = document.getElementById('edit-riddle-answer-latin').value.trim();
  const hint           = document.getElementById('edit-riddle-hint').value.trim() || null;
  const category       = document.getElementById('edit-riddle-category').value;
  const difficulty     = document.getElementById('edit-riddle-difficulty').value;

  const { error } = await _sb.from('riddles').update({
    question, question_latin, answer, answer_latin, hint, category, difficulty
  }).eq('id', id);

  if (error) { showToast('Error updating riddle: ' + error.message, 'error'); return; }
  showToast('Riddle updated ✓', 'success');
  closeModal('edit-riddle-modal');
  await loadAllRiddles();
}

async function deleteRiddle(id) {
  const { error } = await _sb.from('riddles').delete().eq('id', id);
  if (error) { showToast('Error deleting riddle: ' + error.message, 'error'); return; }
  showToast('Riddle deleted', 'info');
  await loadAllRiddles();
}

function updateRiddlesStats() {
  document.getElementById('stat-riddles-total').textContent  = allRiddles.length;
  document.getElementById('stat-riddles-easy').textContent   = allRiddles.filter(r => r.difficulty === 'easy').length;
  document.getElementById('stat-riddles-medium').textContent = allRiddles.filter(r => r.difficulty === 'medium').length;
  document.getElementById('stat-riddles-hard').textContent   = allRiddles.filter(r => r.difficulty === 'hard').length;
}

function renderRiddlesTable(riddles) {
  const tbody = document.getElementById('riddles-tbody');
  tbody.innerHTML = '';

  if (riddles.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted)">No riddles found</td></tr>';
    return;
  }

  riddles.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span lang="ti">${escHtml(r.question)}</span><br><small style="color:var(--muted)">${escHtml(r.question_latin)}</small></td>
      <td><span lang="ti">${escHtml(r.answer)}</span><br><small style="color:var(--muted)">${escHtml(r.answer_latin)}</small></td>
      <td>${escHtml(r.category)}</td>
      <td><span class="badge badge-${r.difficulty}">${r.difficulty}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn btn-sm btn-primary" data-id="${r.id}" data-action="edit-riddle">Edit</button>
          <button class="btn btn-sm btn-danger"  data-id="${r.id}" data-action="delete-riddle">Del</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-action="edit-riddle"]').forEach(btn =>
    btn.addEventListener('click', () => openEditRiddleModal(btn.dataset.id)));
  tbody.querySelectorAll('[data-action="delete-riddle"]').forEach(btn =>
    btn.addEventListener('click', () => openConfirmModal('riddle', btn.dataset.id, 'this riddle')));
}

function openEditRiddleModal(id) {
  const r = allRiddles.find(x => x.id === id);
  if (!r) return;
  document.getElementById('edit-riddle-id').value             = r.id;
  document.getElementById('edit-riddle-question').value       = r.question;
  document.getElementById('edit-riddle-question-latin').value = r.question_latin;
  document.getElementById('edit-riddle-answer').value         = r.answer;
  document.getElementById('edit-riddle-answer-latin').value   = r.answer_latin;
  document.getElementById('edit-riddle-hint').value           = r.hint || '';
  document.getElementById('edit-riddle-category').value       = r.category;
  document.getElementById('edit-riddle-difficulty').value     = r.difficulty;
  openModal('edit-riddle-modal');
}

function filterRiddles() {
  const search     = document.getElementById('search-riddles').value.toLowerCase();
  const category   = document.getElementById('filter-riddle-category').value;
  const difficulty = document.getElementById('filter-riddle-difficulty').value;

  let list = allRiddles;
  if (search)     list = list.filter(r =>
    r.question.toLowerCase().includes(search) ||
    r.question_latin.toLowerCase().includes(search) ||
    r.answer.toLowerCase().includes(search));
  if (category)   list = list.filter(r => r.category   === category);
  if (difficulty) list = list.filter(r => r.difficulty === difficulty);

  renderRiddlesTable(list);
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

  document.getElementById('btn-logout').addEventListener('click', logoutUser);

  // ── Tabs
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');
      // Re-populate selects on every tab switch in case packs loaded after initial render
      if (allPacks.length > 0) populatePackSelects();
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
    if (pendingDeleteType === 'heto')    deleteHeto(pendingDeleteId);
    if (pendingDeleteType === 'riddle')  deleteRiddle(pendingDeleteId);
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

  // ── Add heto question
  document.getElementById('form-add-heto').addEventListener('submit', e => {
    e.preventDefault();
    createHeto();
  });

  // ── Edit heto question submit
  document.getElementById('form-edit-heto').addEventListener('submit', e => {
    e.preventDefault();
    updateHeto(document.getElementById('edit-heto-id').value);
  });
  document.getElementById('btn-cancel-edit-heto').addEventListener('click', () => closeModal('edit-heto-modal'));

  // ── Heto filters
  document.getElementById('search-heto').addEventListener('input', filterHeto);
  document.getElementById('filter-heto-category').addEventListener('change', filterHeto);
  document.getElementById('filter-heto-difficulty').addEventListener('change', filterHeto);

  // ── Add riddle
  document.getElementById('form-add-riddle').addEventListener('submit', e => {
    e.preventDefault();
    createRiddle();
  });

  // ── Edit riddle submit
  document.getElementById('form-edit-riddle').addEventListener('submit', e => {
    e.preventDefault();
    updateRiddle(document.getElementById('edit-riddle-id').value);
  });
  document.getElementById('btn-cancel-edit-riddle').addEventListener('click', () => closeModal('edit-riddle-modal'));

  // ── Riddle filters
  document.getElementById('search-riddles').addEventListener('input', filterRiddles);
  document.getElementById('filter-riddle-category').addEventListener('change', filterRiddles);
  document.getElementById('filter-riddle-difficulty').addEventListener('change', filterRiddles);

  // ── Grant access form
  document.getElementById('form-grant')?.addEventListener('submit', e => {
    e.preventDefault();
    grantPackAccess(
      document.getElementById('grant-email').value.trim().toLowerCase(),
      document.getElementById('grant-pack').value,
    );
  });

  // ── Auth
  await checkAuth();
  _sb.auth.onAuthStateChange(async (event, session) => {
    currentUser = session?.user || null;
    if (event === 'SIGNED_IN' || event === 'USER_UPDATED') await onSignedIn();
  });
});
