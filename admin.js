// ═══════════════════════════════════════════════════════
// Mayim Admin Panel — admin.js
// Handles authentication, word CRUD, and UI management
// ═══════════════════════════════════════════════════════

'use strict';

// ── Supabase Config ──────────────────────────────────────
const SUPABASE_URL = 'https://rzcrdngpybrsjlbenqep.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Y3JkbmdweWJyc2psYmVucWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMDU4MDMsImV4cCI6MjA5MDg4MTgwM30.ILN4ZrvMX5sfbd8mCnnnal9-U4ojQ-SVYTUuS1QoqaE';

let supabase = null;
let currentUser = null;
let allWords = [];

// ── Init Supabase ────────────────────────────────────────
function initSupabase() {
  if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}

// ── Auth Functions ───────────────────────────────────────
async function checkAuth() {
  const { data } = await supabase.auth.getSession();
  currentUser = data.session?.user || null;

  if (currentUser) {
    showAdminScreen();
    updateUserInfo();
    loadAllWords();
  } else {
    showAuthScreen();
  }
}

async function loginUser(email) {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: window.location.origin + '/admin.html',
      },
    });

    if (error) throw error;

    showToast('✓ Check your email for login link!', 'success');
  } catch (err) {
    console.error('Login error:', err);
    showToast('❌ Login failed: ' + err.message, 'error');
  }
}

async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    currentUser = null;
    showAuthScreen();
    showToast('✓ Logged out', 'success');
  } catch (err) {
    console.error('Logout error:', err);
    showToast('❌ Logout failed: ' + err.message, 'error');
  }
}

// ── Word CRUD Functions ──────────────────────────────────
async function createWord(word, latin, english, category) {
  try {
    const { data, error } = await supabase
      .from('words')
      .insert([{ word, latin, english, category }]);

    if (error) throw error;

    showToast(`✓ Added: ${word}`, 'success');
    await loadAllWords();
    document.getElementById('form-add-word').reset();
  } catch (err) {
    console.error('Create error:', err);
    showToast('❌ Failed to add word: ' + err.message, 'error');
  }
}

async function updateWord(id, updates) {
  try {
    const { error } = await supabase
      .from('words')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    showToast(`✓ Updated word`, 'success');
    await loadAllWords();
    closeModal('edit-modal');
  } catch (err) {
    console.error('Update error:', err);
    showToast('❌ Failed to update: ' + err.message, 'error');
  }
}

async function deleteWord(id, word) {
  try {
    const { error } = await supabase
      .from('words')
      .delete()
      .eq('id', id);

    if (error) throw error;

    showToast(`✓ Deleted: ${word}`, 'success');
    await loadAllWords();
    closeModal('confirm-modal');
  } catch (err) {
    console.error('Delete error:', err);
    showToast('❌ Failed to delete: ' + err.message, 'error');
  }
}

async function loadAllWords() {
  try {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .order('category', { ascending: true })
      .order('word', { ascending: true });

    if (error) throw error;

    allWords = data || [];
    renderWordsTable(allWords);
    updateStats();
  } catch (err) {
    console.error('Load error:', err);
    showToast('❌ Failed to load words: ' + err.message, 'error');
  }
}

// ── UI Functions ─────────────────────────────────────────
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

function updateUserInfo() {
  const infoEl = document.getElementById('admin-user-info');
  if (currentUser) {
    infoEl.textContent = `📧 ${currentUser.email}`;
  }
}

function updateStats() {
  const total = allWords.length;
  const food = allWords.filter(w => w.category === 'Food').length;
  const culture = allWords.filter(w => w.category === 'Culture').length;
  const daily = allWords.filter(w => w.category === 'Daily Life').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-food').textContent = food;
  document.getElementById('stat-culture').textContent = culture;
  document.getElementById('stat-daily').textContent = daily;
}

function renderWordsTable(words) {
  const tbody = document.getElementById('words-tbody');
  tbody.innerHTML = '';

  if (words.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No words found</td></tr>';
    return;
  }

  words.forEach(word => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${word.word}</strong></td>
      <td>${word.latin}</td>
      <td>${word.english}</td>
      <td><span class="category-badge">${word.category}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn btn-primary btn-edit" data-id="${word.id}">Edit</button>
          <button class="btn btn-danger btn-delete" data-id="${word.id}" data-word="${word.word}">Delete</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });

  // Add event listeners
  tbody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });

  tbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, btn.dataset.word));
  });
}

function openEditModal(id) {
  const word = allWords.find(w => w.id === id);
  if (!word) return;

  document.getElementById('edit-id').value = word.id;
  document.getElementById('edit-word').value = word.word;
  document.getElementById('edit-latin').value = word.latin;
  document.getElementById('edit-english').value = word.english;
  document.getElementById('edit-category').value = word.category;

  openModal('edit-modal');
}

function openDeleteModal(id, word) {
  document.getElementById('confirm-message').textContent = `Are you sure you want to delete "${word}"? This cannot be undone.`;
  document.getElementById('btn-confirm-delete').dataset.deleteId = id;
  openModal('confirm-modal');
}

function openModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// ── Search & Filter ─────────────────────────────────────
function filterWords() {
  const searchTerm = document.getElementById('search-words').value.toLowerCase();
  const category = document.getElementById('filter-category').value;

  let filtered = allWords;

  if (searchTerm) {
    filtered = filtered.filter(w =>
      w.english.toLowerCase().includes(searchTerm) ||
      w.word.includes(searchTerm) ||
      w.latin.toLowerCase().includes(searchTerm)
    );
  }

  if (category) {
    filtered = filtered.filter(w => w.category === category);
  }

  renderWordsTable(filtered);
}

// ── Event Listeners ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initSupabase();

  // Auth
  document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    loginUser(email);
  });

  document.getElementById('btn-logout').addEventListener('click', logoutUser);

  // Add word
  document.getElementById('form-add-word').addEventListener('submit', (e) => {
    e.preventDefault();
    const word = document.getElementById('input-word').value;
    const latin = document.getElementById('input-latin').value;
    const english = document.getElementById('input-english').value;
    const category = document.getElementById('input-category').value;
    createWord(word, latin, english, category);
  });

  // Edit word
  document.getElementById('form-edit-word').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const word = document.getElementById('edit-word').value;
    const latin = document.getElementById('edit-latin').value;
    const english = document.getElementById('edit-english').value;
    const category = document.getElementById('edit-category').value;
    updateWord(id, { word, latin, english, category });
  });

  // Delete word
  document.getElementById('btn-confirm-delete').addEventListener('click', () => {
    const id = document.getElementById('btn-confirm-delete').dataset.deleteId;
    const word = allWords.find(w => w.id === id);
    if (word) {
      deleteWord(id, word.word);
    }
  });

  // Modal controls
  document.getElementById('btn-cancel-edit').addEventListener('click', () => closeModal('edit-modal'));
  document.getElementById('btn-cancel-confirm').addEventListener('click', () => closeModal('confirm-modal'));

  // Search & filter
  document.getElementById('search-words').addEventListener('input', filterWords);
  document.getElementById('filter-category').addEventListener('change', filterWords);

  // Check auth on load
  await checkAuth();

  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    currentUser = session?.user || null;
    if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
      showAdminScreen();
      updateUserInfo();
      await loadAllWords();
    }
  });
});
