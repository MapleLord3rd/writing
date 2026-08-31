/* ============================================================
   THE ARCHIVE — Application Logic
   A collaborative literary journal & digital archive
   ============================================================ */

(function () {
  'use strict';

  // ——— State ———
  let currentPage = 'home';
  let currentFilter = 'all';
  let currentAuthorFilter = 'all';
  let currentSort = 'newest';
  let currentSearch = '';
  let _lastSearchRendered = '';
  let activeTagFilters = [];
  let lastScrollY = 0;
  let currentReadingId = null;

  // ——— Storage Keys ———
  const STORAGE_KEY = 'archive-writings';
  const CUSTOM_STORAGE_KEY = 'archive-writings-custom';
  const DELETED_KEY = 'archive-deleted';
  const FAVORITES_KEY = 'archive-favorites';
  const DRAFT_KEY = 'archive-draft';
  const READER_PREFS_KEY = 'archive-reader-prefs';
  const USER_KEY = 'archive-user';

  // ——— Current Authenticated Author Management ———
  const PASSWORD_USERS = {
    'friendship': 'neerav',
    'neerav': 'neerav',
    'terrible judgement': 'avigna',
    'avigna': 'avigna'
  };

  function isAvigna(user) {
    return user === 'avigna' || user === 'friend';
  }

  function getAuthorDisplayName(author) {
    return isAvigna(author) ? 'Avigna' : 'Neerav';
  }

  function canUserEdit(writingAuthor) {
    const current = getCurrentUser();
    const author = writingAuthor || 'neerav';
    if (isAvigna(author)) {
      return isAvigna(current);
    }
    return current === 'neerav';
  }

  function getCurrentUser() {
    const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY) || localStorage.getItem('last-author') || 'neerav';
    return isAvigna(raw) ? 'avigna' : 'neerav';
  }

  function setCurrentUser(user) {
    const normalized = isAvigna(user) ? 'avigna' : 'neerav';
    sessionStorage.setItem(USER_KEY, normalized);
    localStorage.setItem(USER_KEY, normalized);
    localStorage.setItem('last-author', normalized);
    updateUserBadge();
  }

  function updateUserBadge() {
    const user = getCurrentUser();
    const badge = document.getElementById('navUserBadge');
    const nameEl = document.getElementById('userProfileName');
    if (badge && nameEl) {
      nameEl.textContent = getAuthorDisplayName(user);
      badge.classList.toggle('user--avigna', isAvigna(user));
      badge.classList.toggle('user--friend', isAvigna(user));
      badge.title = `Profile: ${getAuthorDisplayName(user)} (Click to view profile)`;
    }
  }

  function initUserBadge() {
    const badge = document.getElementById('navUserBadge');
    if (!badge) return;

    badge.addEventListener('click', () => {
      openProfileModal(getCurrentUser());
    });

    badge.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openProfileModal(getCurrentUser());
      }
    });
  }

  // ——— Supabase Online Publishing Backend ———
  const SUPABASE_URL = 'https://llulyiaxnmrrdjprqeec.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsdWx5aWF4bm1ycmRqcHJxZWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwODUwNjYsImV4cCI6MjEwMzY2MTA2Nn0.X0CS_w-BWvGLX4IxjX_CByMlimMFkquhsAPTxbotonA';

  let supabase = null;
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  let currentAuthUid = null;
  let _databaseWritings = null;
  let _writingsCache = null;

  function invalidateWritingsCache() {
    _writingsCache = null;
  }

  // Maps database row to application object
  function mapWorkFromDb(w) {
    if (!w) return null;
    return {
      id: w.id,
      title: w.title,
      author: w.author || 'neerav',
      type: w.type || 'story',
      date: w.date || new Date().toISOString().split('T')[0],
      excerpt: w.excerpt || '',
      content: w.content || '',
      tags: Array.isArray(w.tags) ? w.tags : [],
      marginalia: w.marginalia || '',
      inResponseTo: w.in_response_to || w.inResponseTo || null,
      readingTime: w.reading_time || w.readingTime || '2 min read',
      featured: Boolean(w.featured),
      collection: w.collection || null,
      is_published: w.is_published !== false,
      author_id: w.author_id,
      created_at: w.created_at,
      updated_at: w.updated_at
    };
  }

  // Maps application object to database row
  function mapWorkToDb(w, authUid) {
    return {
      id: w.id,
      title: w.title,
      author: w.author || 'neerav',
      type: w.type || 'story',
      date: w.date || new Date().toISOString().split('T')[0],
      excerpt: w.excerpt || '',
      content: w.content || '',
      tags: Array.isArray(w.tags) ? w.tags : [],
      marginalia: w.marginalia || '',
      in_response_to: w.inResponseTo || null,
      reading_time: w.readingTime || '2 min read',
      featured: Boolean(w.featured),
      collection: w.collection || null,
      is_published: true,
      updated_at: new Date().toISOString(),
      author_id: authUid || null
    };
  }

  async function initSupabaseAuth() {
    if (!supabase) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        currentAuthUid = session.user.id;
        return currentAuthUid;
      }
      const { data, error } = await supabase.auth.signInAnonymously();
      if (data && data.user) {
        currentAuthUid = data.user.id;
      } else if (error) {
        console.warn('Anonymous sign-in notice:', error.message);
      }
    } catch (e) {
      console.warn('Supabase auth init error:', e);
    }
    return currentAuthUid;
  }

  async function loadSharedWorks() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('works')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error:', error.message);
        return;
      }

      if (Array.isArray(data)) {
        _databaseWritings = data.map(mapWorkFromDb);
        invalidateWritingsCache();
      }
    } catch (e) {
      console.warn('loadSharedWorks error:', e);
    }
  }

  // ——— Data Management (Reconciles Online DB + Code Base + Local Storage) ———
  function getDeletedIds() {
    try {
      const stored = localStorage.getItem(DELETED_KEY);
      const local = stored ? JSON.parse(stored) : [];
      const base = (typeof DELETED_WRITINGS !== 'undefined' && Array.isArray(DELETED_WRITINGS)) ? DELETED_WRITINGS : [];
      return [...new Set([...local, ...base])];
    } catch (e) {
      return [];
    }
  }

  function getCustomWritings() {
    try {
      const stored = localStorage.getItem(CUSTOM_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function getWritings() {
    if (_writingsCache) return _writingsCache;

    const baseWritings = (typeof WRITINGS !== 'undefined' && Array.isArray(WRITINGS)) ? WRITINGS : [];
    const deletedIds = getDeletedIds();
    const map = new Map();

    // 1. Add base static writings from writings.js (unless deleted)
    baseWritings.forEach(w => {
      if (!deletedIds.includes(w.id)) {
        map.set(w.id, { ...w });
      }
    });

    // 2. Add local custom writings (fallback or offline)
    const customWritings = getCustomWritings();
    customWritings.forEach(w => {
      if (!deletedIds.includes(w.id)) {
        map.set(w.id, { ...w });
      }
    });

    // 3. Overlay online published writings from Supabase
    if (Array.isArray(_databaseWritings)) {
      _databaseWritings.forEach(w => {
        if (!deletedIds.includes(w.id)) {
          map.set(w.id, { ...w });
        }
      });
    }

    _writingsCache = Array.from(map.values());
    return _writingsCache;
  }

  function saveCustomWritings(writings) {
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(writings));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(writings));
    invalidateWritingsCache();
  }

  async function addWriting(writing) {
    if (!writing.id) {
      writing.id = slugify(writing.title || 'untitled') + '-' + Date.now();
    }

    // 1. Always save locally as a responsive fallback
    const custom = getCustomWritings();
    const existingIdx = custom.findIndex(w => w.id === writing.id);
    if (existingIdx !== -1) {
      custom[existingIdx] = { ...custom[existingIdx], ...writing };
    } else {
      custom.push(writing);
    }
    saveCustomWritings(custom);

    // Remove from deleted list if re-adding
    const deletedIds = getDeletedIds().filter(id => id !== writing.id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(deletedIds));
    invalidateWritingsCache();

    // 2. Upload to Supabase
    if (supabase) {
      try {
        if (!currentAuthUid) {
          await initSupabaseAuth();
        }
        const row = mapWorkToDb(writing, currentAuthUid);
        const { error } = await supabase
          .from('works')
          .upsert([row]);

        if (error) {
          console.warn('Supabase publish notice:', error.message);
        } else {
          await loadSharedWorks();
        }
      } catch (err) {
        console.warn('Supabase publish error:', err);
      }
    }

    return writing;
  }

  async function updateWriting(id, updatedData) {
    // 1. Update local cache/storage
    const custom = getCustomWritings();
    const index = custom.findIndex(w => w.id === id);
    if (index !== -1) {
      custom[index] = { ...custom[index], ...updatedData };
      saveCustomWritings(custom);
    } else {
      const baseWriting = (typeof WRITINGS !== 'undefined' && Array.isArray(WRITINGS)) ? WRITINGS.find(w => w.id === id) : null;
      if (baseWriting) {
        custom.push({ ...baseWriting, ...updatedData });
        saveCustomWritings(custom);
      }
    }
    invalidateWritingsCache();

    // 2. Update Supabase
    if (supabase) {
      try {
        const dbPayload = {};
        if (updatedData.title !== undefined) dbPayload.title = updatedData.title;
        if (updatedData.author !== undefined) dbPayload.author = updatedData.author;
        if (updatedData.type !== undefined) dbPayload.type = updatedData.type;
        if (updatedData.date !== undefined) dbPayload.date = updatedData.date;
        if (updatedData.excerpt !== undefined) dbPayload.excerpt = updatedData.excerpt;
        if (updatedData.content !== undefined) dbPayload.content = updatedData.content;
        if (updatedData.tags !== undefined) dbPayload.tags = updatedData.tags;
        if (updatedData.marginalia !== undefined) dbPayload.marginalia = updatedData.marginalia;
        if (updatedData.inResponseTo !== undefined) dbPayload.in_response_to = updatedData.inResponseTo;
        if (updatedData.readingTime !== undefined) dbPayload.reading_time = updatedData.readingTime;
        if (updatedData.featured !== undefined) dbPayload.featured = updatedData.featured;
        if (updatedData.collection !== undefined) dbPayload.collection = updatedData.collection;
        dbPayload.updated_at = new Date().toISOString();

        const { error } = await supabase
          .from('works')
          .update(dbPayload)
          .eq('id', id);

        if (error) {
          console.warn('Supabase update notice:', error.message);
        } else {
          await loadSharedWorks();
        }
      } catch (err) {
        console.warn('Supabase update error:', err);
      }
    }

    return updatedData;
  }

  async function deleteWriting(id) {
    const writings = getWritings();
    const writing = writings.find(w => w.id === id);

    if (writing && !canUserEdit(writing.author)) {
      const authorDisplayName = getAuthorDisplayName(writing.author);
      alert(`🔒 Permission denied:\n\nOnly the author (${authorDisplayName}) can delete this piece.`);
      return false;
    }

    // 1. Mark in local deleted list & purge from local custom storage
    const deletedIds = getDeletedIds();
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem(DELETED_KEY, JSON.stringify(deletedIds));
    }
    const custom = getCustomWritings().filter(w => w.id !== id);
    saveCustomWritings(custom);

    // Also remove from in-memory database cache
    if (Array.isArray(_databaseWritings)) {
      _databaseWritings = _databaseWritings.filter(w => w.id !== id);
    }
    invalidateWritingsCache();

    // 2. Delete from Supabase
    if (supabase) {
      try {
        const { error } = await supabase
          .from('works')
          .delete()
          .eq('id', id);

        if (error) {
          console.warn('Supabase delete notice:', error.message);
        } else {
          await loadSharedWorks();
        }
      } catch (err) {
        console.warn('Supabase delete error:', err);
      }
    }

    return true;
  }

  function setupRealtimeListener() {
    if (!supabase) return;
    try {
      supabase
        .channel('public:works')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'works' }, async () => {
          await loadSharedWorks();
          if (currentPage === 'archive') {
            renderArchive();
          } else if (currentPage === 'home') {
            renderFeatured();
          } else if (currentPage === 'reading' && currentReadingId) {
            renderReading(currentReadingId);
          } else if (currentPage === 'timeline') {
            renderTimeline();
          } else if (currentPage === 'stats') {
            renderStats();
          }
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription error:', e);
    }
  }

  function exportData() {
    const writings = getWritings();
    const dataStr = JSON.stringify(writings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `archive-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          saveWritings(imported);
          alert(`Successfully imported ${imported.length} writings!`);
          location.reload();
        } else {
          alert('Invalid file format');
        }
      } catch (err) {
        alert('Failed to import: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // ——— Bookmarks (Read Later) & Comments & Profiles Storage Keys ———
  const BOOKMARKS_KEY = 'archive-bookmarks-v1';
  const COMMENTS_KEY = 'archive-comments-v1';
  const PROFILES_KEY = 'archive-profiles-v1';

  // ——— Toast Notification System ———
  function showToast(message, icon = '✦') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<span>${icon}</span><span>${escapeHTML(message)}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => toast.remove(), 320);
    }, 2800);
  }

  // ——— Bookmarks & Favorites Shelf ———
  function getFavorites() {
    try {
      const favs = localStorage.getItem(FAVORITES_KEY);
      return favs ? JSON.parse(favs) : [];
    } catch (e) {
      return [];
    }
  }

  function isFavorite(id) {
    return getFavorites().includes(id);
  }

  function toggleFavorite(id) {
    let favs = getFavorites();
    const isFav = favs.includes(id);
    if (isFav) {
      favs = favs.filter(f => f !== id);
      showToast('Removed from favorites');
    } else {
      favs.push(id);
      showToast('Added to favorites ⭐');
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return !isFav;
  }

  // ——— Bookmarks (Read Later) ———
  function getBookmarks() {
    try {
      const b = localStorage.getItem(BOOKMARKS_KEY);
      return b ? JSON.parse(b) : [];
    } catch (e) {
      return [];
    }
  }

  function isBookmarked(id) {
    return getBookmarks().includes(id);
  }

  function toggleBookmark(id) {
    let list = getBookmarks();
    const isSaved = list.includes(id);
    if (isSaved) {
      list = list.filter(b => b !== id);
      showToast('Removed from Bookmarks');
    } else {
      list.push(id);
      showToast('Saved to Bookmarks (Read Later) 🔖');
    }
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
    updateBookmarksCount();
    return !isSaved;
  }

  function updateBookmarksCount() {
    const countEl = document.getElementById('bookmarksCount');
    if (countEl) {
      countEl.textContent = getBookmarks().length;
    }
  }

  // ——— Personal Profiles ———
  const DEFAULT_BIOS = {
    neerav: 'Just writing random stuff.',
    avigna: 'In pursuit of words and quiet magic.'
  };

  function getProfile(author) {
    const norm = isAvigna(author) ? 'avigna' : 'neerav';
    try {
      const saved = localStorage.getItem(PROFILES_KEY);
      const data = saved ? JSON.parse(saved) : {};
      return {
        bio: data[norm]?.bio || DEFAULT_BIOS[norm]
      };
    } catch (e) {
      return { bio: DEFAULT_BIOS[norm] };
    }
  }

  function saveProfile(author, bioText) {
    const norm = isAvigna(author) ? 'avigna' : 'neerav';
    try {
      const saved = localStorage.getItem(PROFILES_KEY);
      const data = saved ? JSON.parse(saved) : {};
      data[norm] = { bio: bioText };
      localStorage.setItem(PROFILES_KEY, JSON.stringify(data));
      showToast('Profile bio updated! ✨');
    } catch (e) {
      console.error('Error saving profile:', e);
    }
  }

  function openProfileModal(author) {
    const norm = isAvigna(author) ? 'avigna' : 'neerav';
    const profile = getProfile(norm);
    const modal = document.getElementById('profileModal');
    if (!modal) return;

    const isCurrent = getCurrentUser() === norm;
    const authorDisplayName = getAuthorDisplayName(norm);

    const nameEl = document.getElementById('profileAuthorName');
    const roleEl = document.getElementById('profileAuthorRole');
    const letterEl = document.getElementById('profileAvatarLetter');
    const quoteEl = document.getElementById('profileQuoteText');
    const editBtn = document.getElementById('btnEditProfileBio');

    if (nameEl) nameEl.textContent = authorDisplayName.toUpperCase();
    if (roleEl) roleEl.textContent = isAvigna(norm) ? 'The Muse' : 'The Archivist';
    if (letterEl) letterEl.textContent = isAvigna(norm) ? '✦' : 'N';
    if (quoteEl) quoteEl.textContent = `“${profile.bio}”`;

    if (editBtn) editBtn.style.display = isCurrent ? 'inline-flex' : 'none';

    // Reset bio editing display
    const bioDisplay = document.getElementById('profileBioDisplay');
    const bioEditForm = document.getElementById('profileBioEditForm');
    if (bioDisplay) bioDisplay.hidden = false;
    if (bioEditForm) bioEditForm.hidden = true;

    // Calculate dynamic stats
    const writings = getWritings().filter(w => (isAvigna(norm) ? isAvigna(w.author) : !isAvigna(w.author)));
    const totalWorks = writings.length;
    const totalStories = writings.filter(w => w.type === 'story' || w.type === 'collaborative').length;
    const totalPoems = writings.filter(w => w.type === 'poem').length;

    const favorites = getFavorites();
    const totalLikes = writings.reduce((acc, w) => acc + (favorites.includes(w.id) ? 1 : 0), 0);

    const statWorks = document.getElementById('profileStatWorks');
    const statStories = document.getElementById('profileStatStories');
    const statPoems = document.getElementById('profileStatPoems');
    const statLikes = document.getElementById('profileStatLikes');

    if (statWorks) statWorks.textContent = totalWorks;
    if (statStories) statStories.textContent = totalStories;
    if (statPoems) statPoems.textContent = totalPoems;
    if (statLikes) statLikes.textContent = totalLikes;

    // Latest Works list
    const latestContainer = document.getElementById('profileLatestWorks');
    if (latestContainer) {
      if (writings.length === 0) {
        latestContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; font-family: var(--font-mono); padding: 12px 0;">No writings published yet.</p>';
      } else {
        const sorted = writings.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
        latestContainer.innerHTML = sorted.slice(0, 4).map(w => `
          <a href="#" class="profile-work-link" data-work-id="${w.id}">
            <span class="profile-work-title">“${escapeHTML(w.title)}”</span>
            <span class="profile-work-meta">${formatDate(w.date)} · ${escapeHTML(w.type)}</span>
          </a>
        `).join('');

        latestContainer.querySelectorAll('.profile-work-link').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            modal.hidden = true;
            navigateTo('reading', link.dataset.workId);
          });
        });
      }
    }

    modal.hidden = false;
  }

  function initProfileModal() {
    const modal = document.getElementById('profileModal');
    const closeBtn = document.getElementById('profileModalClose');
    const backdrop = document.getElementById('profileModalBackdrop');
    const editBtn = document.getElementById('btnEditProfileBio');
    const saveBtn = document.getElementById('btnSaveProfileBio');
    const cancelBtn = document.getElementById('btnCancelProfileBio');
    const bioInput = document.getElementById('profileBioInput');
    const bioDisplay = document.getElementById('profileBioDisplay');
    const bioEditForm = document.getElementById('profileBioEditForm');

    if (!modal) return;

    closeBtn?.addEventListener('click', () => modal.hidden = true);
    backdrop?.addEventListener('click', () => modal.hidden = true);

    editBtn?.addEventListener('click', () => {
      const currentBio = getProfile(getCurrentUser()).bio;
      if (bioInput) bioInput.value = currentBio;
      if (bioDisplay) bioDisplay.hidden = true;
      if (bioEditForm) bioEditForm.hidden = false;
      setTimeout(() => bioInput?.focus(), 50);
    });

    cancelBtn?.addEventListener('click', () => {
      if (bioDisplay) bioDisplay.hidden = false;
      if (bioEditForm) bioEditForm.hidden = true;
    });

    saveBtn?.addEventListener('click', () => {
      const newBio = bioInput ? bioInput.value.trim() : '';
      if (newBio) {
        saveProfile(getCurrentUser(), newBio);
        const quoteEl = document.getElementById('profileQuoteText');
        if (quoteEl) quoteEl.textContent = `“${newBio}”`;
      }
      if (bioDisplay) bioDisplay.hidden = false;
      if (bioEditForm) bioEditForm.hidden = true;
    });
  }

  // ——— Comments & Threaded Discussions ———
  function getCommentsStore() {
    try {
      const saved = localStorage.getItem(COMMENTS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  function getWritingComments(writingId) {
    const store = getCommentsStore();
    return store[writingId] || [];
  }

  function addComment(writingId, text, parentId = null) {
    if (!text || !text.trim()) return null;
    const store = getCommentsStore();
    if (!store[writingId]) store[writingId] = [];

    const newComment = {
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      author: getCurrentUser(),
      text: text.trim(),
      timestamp: new Date().toISOString(),
      parentId: parentId || null
    };

    store[writingId].push(newComment);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(store));
    showToast('Comment posted! 💬');
    return newComment;
  }

  function deleteComment(writingId, commentId) {
    const store = getCommentsStore();
    if (!store[writingId]) return;

    // Filter out target comment and all its nested children
    const toDelete = new Set([commentId]);
    let added = true;
    while (added) {
      added = false;
      store[writingId].forEach(c => {
        if (c.parentId && toDelete.has(c.parentId) && !toDelete.has(c.id)) {
          toDelete.add(c.id);
          added = true;
        }
      });
    }

    store[writingId] = store[writingId].filter(c => !toDelete.has(c.id));
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(store));
    showToast('Comment deleted');
  }

  function formatRelativeTime(isoString) {
    try {
      const d = new Date(isoString);
      const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diffSec < 45) return 'Just now';
      if (diffSec < 3600) return `${Math.max(1, Math.floor(diffSec / 60))}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return 'Recently';
    }
  }

  // ——— Surprise Me Random Selector ———
  function triggerSurpriseMe() {
    const all = getWritings();
    if (!all.length) {
      showToast('No writings found in the archive.', '⚠️');
      return;
    }
    const candidates = all.filter(w => w.id !== currentReadingId);
    const pool = candidates.length ? candidates : all;
    const picked = pool[Math.floor(Math.random() * pool.length)];

    showToast(`Opening: “${picked.title}” ✨`, '🎲');
    navigateTo('reading', picked.id);
  }

  // ——— DOM Cache ———
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const nav = $('#nav');
  const navToggle = $('#navToggle');
  const navLinks = $('#navLinks');
  const readingProgress = $('#readingProgress');
  const readingProgressBar = $('#readingProgressBar');
  const searchInput = $('#searchInput');
  const sortSelect = $('#sortSelect');
  const featuredGrid = $('#featuredGrid');
  const archiveGrid = $('#archiveGrid');
  const archiveEmpty = $('#archiveEmpty');
  const archiveStats = $('#archiveStats');
  const activeTags = $('#activeTags');
  const collectionsGrid = $('#collectionsGrid');
  const collectionDetailHeader = $('#collectionDetailHeader');
  const collectionDetailGrid = $('#collectionDetailGrid');
  const tagHeader = $('#tagHeader');
  const tagGrid = $('#tagGrid');
  const timeline = $('#timeline');
  const deskStats = $('#deskStats');
  const deskBreakdown = $('#deskBreakdown');
  const readingContent = $('#readingContent');

  // ——— Helpers ———
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    }).toUpperCase();
  }

  function formatDateLong(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function countWords(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // ——— Excerpt / Quote of the Day ———
  function initQuoteOfDay() {
    const quoteText = $('#quoteText');
    const quoteAuthor = $('#quoteAuthor');
    const quoteTitleLink = $('#quoteTitleLink');
    const btnShuffle = $('#btnShuffleQuote');
    const quoteCard = $('#quoteCard');

    if (!quoteText) return;

    function renderRandomQuote() {
      const writings = getWritings();
      if (!writings.length) return;

      const randomWriting = writings[Math.floor(Math.random() * writings.length)];
      let quote = randomWriting.excerpt || '';
      if (!quote && randomWriting.content) {
        const lines = randomWriting.content.split('\n').filter(l => l.trim().length > 0);
        quote = lines.slice(0, 3).join(' ');
      }
      // Clean quote marks if double wrapped
      quote = quote.replace(/^["']|["']$/g, '');

      if (quoteCard) {
        quoteCard.style.opacity = '0';
        quoteCard.style.transform = 'translateY(8px)';
      }

      setTimeout(() => {
        quoteText.innerHTML = `&ldquo;${escapeHTML(quote)}&rdquo;`;
        quoteAuthor.textContent = `By ${getAuthorDisplayName(randomWriting.author)}`;
        quoteTitleLink.textContent = `From \u201C${randomWriting.title}\u201D \u2192`;
        quoteTitleLink.dataset.quoteId = randomWriting.id;

        if (quoteCard) {
          quoteCard.style.opacity = '1';
          quoteCard.style.transform = 'translateY(0)';
        }
      }, 200);
    }

    renderRandomQuote();

    if (btnShuffle) {
      btnShuffle.addEventListener('click', (e) => {
        e.preventDefault();
        renderRandomQuote();
      });
    }

    if (quoteTitleLink) {
      quoteTitleLink.addEventListener('click', (e) => {
        e.preventDefault();
        const id = quoteTitleLink.dataset.quoteId;
        if (id) navigateTo('reading', id);
      });
    }
  }

  // ——— Navigation ———
  function initNav() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          nav.classList.toggle('scrolled', y > 50);
          if (y > lastScrollY && y > 200) {
            nav.classList.add('hidden');
          } else {
            nav.classList.remove('hidden');
          }
          lastScrollY = y;

          if (currentPage === 'reading' && readingProgressBar) {
            const article = readingContent;
            if (article) {
              const total = article.scrollHeight - window.innerHeight;
              const progress = Math.min(100, Math.max(0,
                ((y - article.offsetTop) / (total || 1)) * 100
              ));
              readingProgressBar.style.width = progress + '%';
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', navToggle.classList.contains('open'));
    });

    $('#btnNavSurprise')?.addEventListener('click', () => {
      triggerSurpriseMe();
    });

    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-nav]');
      if (!link) return;
      e.preventDefault();
      const page = link.dataset.nav;
      navigateTo(page);
      navToggle.classList.remove('open');
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  }

  let previousPage = 'archive';

  function navigateTo(page, data) {
    const cameFrom = currentPage || 'archive';
    $$('.page').forEach(p => p.classList.remove('active'));
    currentPage = page;
    previousPage = (page === 'reading') ? cameFrom : page;

    $$('.nav-link').forEach(l => {
      l.classList.toggle('active', l.dataset.nav === page);
    });

    readingProgress.classList.toggle('visible', page === 'reading');

    const adminTools = $('#adminTools');
    if (adminTools) {
      adminTools.hidden = page !== 'reading';
    }

    const readerPanel = $('#readerPanel');
    if (readerPanel) {
      readerPanel.hidden = page !== 'reading';
    }

    window.scrollTo({ top: 0, behavior: 'instant' });

    switch (page) {
      case 'home':
        $('#page-home').classList.add('active');
        renderFeatured();
        initQuoteOfDay();
        break;
      case 'archive':
        $('#page-archive').classList.add('active');
        renderArchive();
        break;
      case 'reading':
        $('#page-reading').classList.add('active');
        renderReading(data);
        break;
      case 'collections':
        $('#page-collections').classList.add('active');
        renderCollections();
        break;
      case 'collection-detail':
        $('#page-collection-detail').classList.add('active');
        renderCollectionDetail(data);
        break;
      case 'tag':
        $('#page-tag').classList.add('active');
        renderTagPage(data);
        break;
      case 'timeline':
        $('#page-timeline').classList.add('active');
        renderTimeline();
        break;
      case 'desk':
        $('#page-desk').classList.add('active');
        renderDesk();
        break;
      case 'features':
        $('#page-features').classList.add('active');
        break;
      case 'about':
        $('#page-about').classList.add('active');
        break;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => observeReveals());
    });
  }

  // ——— Writing Cards ———
  function createWritingCard(writing, delay = 0) {
    const card = document.createElement('article');
    card.className = 'writing-card visible';
    card.style.transitionDelay = delay + 'ms';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Read: ${writing.title}`);
    card.style.position = 'relative';

    const tagsHtml = (writing.tags || []).map(t =>
      `<span class="card-tag" data-tag="${escapeHTML(t)}" title="Filter by #${escapeHTML(t)}">#${escapeHTML(t)}</span>`
    ).join(' ');

    const authorName = getAuthorDisplayName(writing.author);
    const authorBadge = `<span class="card-author">By ${authorName}</span>`;

    const dialogueBadge = writing.inResponseTo
      ? `<span class="card-type" style="background: var(--gold-faint); color: var(--gold); border-color: var(--gold);">💬 Dialogue</span>`
      : '';

    const isFav = isFavorite(writing.id);
    const isSaved = isBookmarked(writing.id);
    const bookmarkBtnHtml = `
      <div class="card-action-btns">
        <button class="card-bookmark-later-btn ${isSaved ? 'bookmarked' : ''}" data-bookmark-id="${writing.id}" title="${isSaved ? 'Remove from Bookmarks (Read Later)' : 'Save to Bookmarks (Read Later)'}" aria-label="Bookmark for later">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </div>
    `;

    card.innerHTML = `
      ${bookmarkBtnHtml}
      <div class="card-meta">
        <span class="card-type">${escapeHTML(writing.type)}</span>
        ${dialogueBadge}
        <span class="card-dot" aria-hidden="true">·</span>
        <span class="card-date">${formatDate(writing.date)}</span>
        <span class="card-dot" aria-hidden="true">·</span>
        ${authorBadge}
      </div>
      <h3 class="card-title">${escapeHTML(writing.title)}</h3>
      <p class="card-excerpt">${escapeHTML(writing.excerpt)}</p>
      <div class="card-footer">
        <div class="card-tags">${tagsHtml}</div>
        <span class="card-reading-time">${escapeHTML(writing.readingTime || '2 min read')}</span>
      </div>
    `;

    card.addEventListener('click', (e) => {
      // Bookmark Read Later click
      const bkmkBtn = e.target.closest('.card-bookmark-later-btn');
      if (bkmkBtn) {
        e.stopPropagation();
        const id = bkmkBtn.dataset.bookmarkId;
        const nowSaved = toggleBookmark(id);
        bkmkBtn.classList.toggle('bookmarked', nowSaved);
        bkmkBtn.querySelector('svg').setAttribute('fill', nowSaved ? 'currentColor' : 'none');
        bkmkBtn.title = nowSaved ? 'Remove from Bookmarks (Read Later)' : 'Save to Bookmarks (Read Later)';
        if (currentFilter === 'bookmarks') {
          renderArchive();
        }
        return;
      }

      // Favorite click
      const favBtn = e.target.closest('.card-bookmark-btn');
      if (favBtn) {
        e.stopPropagation();
        const id = favBtn.dataset.favoriteId;
        const nowFav = toggleFavorite(id);
        favBtn.classList.toggle('favorited', nowFav);
        favBtn.querySelector('svg').setAttribute('fill', nowFav ? 'currentColor' : 'none');
        if (currentFilter === 'favorites') {
          renderArchive();
        }
        return;
      }

      // Tag click
      if (e.target.closest('.card-tag')) {
        const tag = e.target.dataset.tag;
        navigateTo('tag', tag);
        return;
      }
      navigateTo('reading', writing.id);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateTo('reading', writing.id);
      }
    });

    return card;
  }

  // ——— Featured / Home ———
  function renderFeatured() {
    const featured = getWritings()
      .filter(w => w.featured)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);

    featuredGrid.innerHTML = '';
    featured.forEach((w, i) => {
      featuredGrid.appendChild(createWritingCard(w, i * 80));
    });
  }

  // ——— Archive ———
  function getFilteredWritings() {
    let results = [...getWritings()];

    // Author filter
    if (currentAuthorFilter !== 'all') {
      results = results.filter(w => (w.author || 'neerav') === currentAuthorFilter);
    }

    // Type filter / Favorites filter / Bookmarks / Collaborative
    if (currentFilter === 'favorites') {
      const favs = getFavorites();
      results = results.filter(w => favs.includes(w.id));
    } else if (currentFilter === 'bookmarks') {
      const bkmks = getBookmarks();
      results = results.filter(w => bkmks.includes(w.id));
    } else if (currentFilter === 'collaborative') {
      results = results.filter(w => w.type === 'collaborative' || w.inCollaboration);
    } else if (currentFilter !== 'all') {
      results = results.filter(w => w.type === currentFilter);
    }

    // Search
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      results = results.filter(w =>
        (w.title && w.title.toLowerCase().includes(q)) ||
        (w.excerpt && w.excerpt.toLowerCase().includes(q)) ||
        (w.content && w.content.toLowerCase().includes(q)) ||
        (w.tags && w.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Tag filters
    if (activeTagFilters.length > 0) {
      results = results.filter(w =>
        activeTagFilters.every(tag => (w.tags || []).includes(tag))
      );
    }

    // Sort
    switch (currentSort) {
      case 'newest':
        results.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'oldest':
        results.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'title':
        results.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return results;
  }

  function renderArchive() {
    const filtered = getFilteredWritings();

    archiveGrid.innerHTML = '';
    if (filtered.length === 0) {
      archiveEmpty.hidden = false;
    } else {
      archiveEmpty.hidden = true;
      filtered.forEach((w, i) => {
        archiveGrid.appendChild(createWritingCard(w, i * 50));
      });
    }

    archiveStats.innerHTML = `Showing ${filtered.length} of ${getWritings().length} works`;
    renderActiveTagPills();
  }

  function renderActiveTagPills() {
    activeTags.innerHTML = '';
    activeTagFilters.forEach(tag => {
      const pill = document.createElement('span');
      pill.className = 'active-tag';
      pill.textContent = `#${tag} ×`;
      pill.addEventListener('click', () => {
        activeTagFilters = activeTagFilters.filter(t => t !== tag);
        renderArchive();
      });
      activeTags.appendChild(pill);
    });
  }

  function initArchiveControls() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.author-filter-btn');
      if (!btn) return;
      $$('.author-filter-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      currentAuthorFilter = btn.dataset.authorFilter;
      renderArchive();
    });

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      $$('.filter-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      currentFilter = btn.dataset.filter;
      renderArchive();
    });

    $('#btnArchiveSurprise')?.addEventListener('click', triggerSurpriseMe);

    let _searchDebounce;
    searchInput.addEventListener('input', (e) => {
      const value = e.target.value.trim();
      currentSearch = value;
      clearTimeout(_searchDebounce);
      _searchDebounce = setTimeout(() => {
        // Only re-render if the search term actually changed
        if (value !== _lastSearchRendered) {
          _lastSearchRendered = value;
          renderArchive();
        }
      }, 120);
    });

    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderArchive();
    });

    $('#clearFilters').addEventListener('click', () => {
      currentFilter = 'all';
      currentAuthorFilter = 'all';
      currentSearch = '';
      activeTagFilters = [];
      searchInput.value = '';
      $$('.filter-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      $('[data-filter="all"]').classList.add('active');
      $('[data-filter="all"]').setAttribute('aria-selected', 'true');
      $$('.author-filter-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      $('[data-author-filter="all"]').classList.add('active');
      $('[data-author-filter="all"]').setAttribute('aria-selected', 'true');
      renderArchive();
    });
  }

  // ——— Reading Page ———
  function updateReadingAuthorTools() {
    if (currentPage !== 'reading' || !currentReadingId) return;
    const writing = getWritings().find(w => w.id === currentReadingId);
    if (!writing) return;
    if (!writing) return;

    const isAuthor = canUserEdit(writing.author);
    const btnEdit = $('#btnEdit');
    const btnDelete = $('#btnDelete');
    if (btnEdit) {
      btnEdit.style.display = isAuthor ? 'flex' : 'none';
      btnEdit.title = isAuthor ? 'Edit this writing' : 'Only the author can edit';
    }
    if (btnDelete) {
      btnDelete.style.display = isAuthor ? 'flex' : 'none';
      btnDelete.title = isAuthor ? 'Delete this writing' : 'Only the author can delete';
    }
  }

  function renderReading(writingId) {
    currentReadingId = writingId;
    const allWritings = getWritings();
    const writing = allWritings.find(w => w.id === writingId);
    if (!writing) {
      navigateTo('archive');
      return;
    }

    const adminTools = $('#adminTools');
    if (adminTools) adminTools.hidden = false;

    // Show Edit and Delete buttons only if the current user is the author
    updateReadingAuthorTools();

    // Update favorite button state
    const btnBookmark = $('#btnBookmarkReading');
    if (btnBookmark) {
      const isFav = isFavorite(writing.id);
      btnBookmark.classList.toggle('favorited', isFav);
      const textSpan = btnBookmark.querySelector('.admin-btn-text');
      if (textSpan) textSpan.textContent = isFav ? 'Favorited' : 'Favorite';
    }

    // Update read later button state
    const btnReadLater = $('#btnReadLaterReading');
    if (btnReadLater) {
      const isSaved = isBookmarked(writing.id);
      btnReadLater.classList.toggle('bookmarked', isSaved);
      const textSpan = btnReadLater.querySelector('.admin-btn-text');
      if (textSpan) textSpan.textContent = isSaved ? 'Bookmarked' : 'Bookmark';
    }

    const isPoem = writing.type === 'poem';
    const isCollab = writing.type === 'collaborative';
    const sortedWritings = allWritings.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const currentIndex = sortedWritings.findIndex(w => w.id === writingId);
    const prevWork = currentIndex < sortedWritings.length - 1 ? sortedWritings[currentIndex + 1] : null;
    const nextWork = currentIndex > 0 ? sortedWritings[currentIndex - 1] : null;

    // Format content
    let bodyHtml;
    let collabPassThePenHtml = '';

    if (isCollab) {
      const rawBlocks = (writing.content || '').trim().split(/\n\n+/);
      const turns = [];

      rawBlocks.forEach(block => {
        const trimmed = block.trim();
        const match = trimmed.match(/^(neerav|avigna|the archivist|the muse):\s*([\s\S]*)$/i);
        if (match) {
          const authorKey = match[1].toLowerCase();
          const author = isAvigna(authorKey) ? 'avigna' : 'neerav';
          turns.push({ author, text: match[2].trim() });
        } else {
          turns.push({ author: writing.author || 'neerav', text: trimmed });
        }
      });

      const turnsRendered = turns.map(t => {
        const isAv = isAvigna(t.author);
        const name = getAuthorDisplayName(t.author);
        const letter = isAv ? '✦' : 'N';
        const modifierClass = isAv ? 'collab-turn-block--avigna' : 'collab-turn-block--neerav';
        return `
          <div class="collab-turn-block ${modifierClass}">
            <div class="collab-turn-header">
              <div class="collab-turn-avatar">${letter}</div>
              <span class="collab-turn-author">${name}</span>
            </div>
            <div class="collab-turn-text">${escapeHTML(t.text)}</div>
          </div>
        `;
      }).join('');

      bodyHtml = `
        <div class="collab-story-container">
          <div class="collab-story-turns">${turnsRendered}</div>
        </div>
      `;

      const currentAuthorName = getAuthorDisplayName(getCurrentUser());
      collabPassThePenHtml = `
        <div class="pass-the-pen-box" id="passThePenBox">
          <div class="pass-the-pen-header">
            <span class="pass-the-pen-icon">✒</span>
            <h3 class="pass-the-pen-title">Pass the Pen — Add Next Turn</h3>
          </div>
          <p class="pass-the-pen-subtitle">You are writing as <strong>${escapeHTML(currentAuthorName)}</strong></p>
          <textarea id="passThePenInput" class="comment-input" style="min-height: 85px;" placeholder="Write what happens next in the story..."></textarea>
          <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
            <button type="button" class="btn-primary" id="btnSubmitTurn" style="font-size: 0.85rem; padding: 8px 18px;">
              <span>Append Turn</span> <span>&rarr;</span>
            </button>
          </div>
        </div>
      `;
    } else if (isPoem) {
      const stanzas = (writing.content || '').trim().split(/\n\n+/);
      bodyHtml = stanzas.map(s =>
        `<div class="poem-stanza">${escapeHTML(s)}</div>`
      ).join('');
    } else {
      const paragraphs = (writing.content || '').trim().split(/\n\n+/);
      bodyHtml = paragraphs.map(p =>
        `<p>${escapeHTML(p)}</p>`
      ).join('');
    }

    // Connected Poems / Literary Dialogues
    let dialogueBannerHtml = '';
    if (writing.inResponseTo) {
      const parent = getWritings().find(w => w.id === writing.inResponseTo);
      if (parent) {
        dialogueBannerHtml = `
          <div class="literary-dialogue-banner">
            <div class="dialogue-meta">
              <span class="dialogue-badge">Literary Dialogue</span>
              <span class="dialogue-text">Written in response to <strong>&ldquo;${escapeHTML(parent.title)}&rdquo;</strong> by ${getAuthorDisplayName(parent.author)}</span>
            </div>
            <a href="#" class="dialogue-link" data-dialogue-target="${parent.id}">Read original piece &rarr;</a>
          </div>
        `;
      }
    }

    // Check for responses to this piece
    const responses = getWritings().filter(w => w.inResponseTo === writing.id);
    let responsesHtml = '';
    if (responses.length > 0) {
      responsesHtml = `
        <div class="dialogue-responses-section">
          <h3 class="dialogue-responses-title">✦ Responses to this piece (${responses.length})</h3>
          <div class="dialogue-responses-grid">
            ${responses.map(r => `
              <div class="dialogue-response-card" data-dialogue-target="${r.id}" role="button" tabindex="0">
                <span class="dialogue-response-author">By ${getAuthorDisplayName(r.author)}</span>
                <h4 class="dialogue-response-title">&ldquo;${escapeHTML(r.title)}&rdquo;</h4>
                <span class="dialogue-link" style="margin-top: 6px; display: inline-flex;">Read response &rarr;</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Marginalia / Behind the Lines Note
    let marginaliaHtml = '';
    if (writing.marginalia && writing.marginalia.trim()) {
      marginaliaHtml = `
        <div class="marginalia-container">
          <button type="button" class="marginalia-toggle-btn" id="btnToggleMarginalia">
            <span>✒</span>
            <span>Behind the Lines / Marginalia</span>
          </button>
          <div class="marginalia-drawer" id="marginaliaDrawer" hidden>
            <div class="marginalia-drawer-title">
              <span>✦</span> Author's Backstory & Reflections
            </div>
            <div class="marginalia-drawer-content">${escapeHTML(writing.marginalia)}</div>
          </div>
        </div>
      `;
    }

    // Author Signature Wax Seal
    const authorName = getAuthorDisplayName(writing.author);
    const sealClass = isAvigna(writing.author) ? 'wax-seal--avigna' : 'wax-seal--neerav';
    const sealEmblem = isAvigna(writing.author) ? '✦' : 'N';
    const sealSignature = isCollab
      ? 'Written together by Neerav & Avigna'
      : (isAvigna(writing.author) ? 'Written with heart by Avigna' : 'Written with care by Neerav');
    const sealSubtitle = isCollab
      ? 'A Collaborative Creation · The Archive'
      : (isAvigna(writing.author) ? 'The Muse · The Archive' : 'The Archivist · The Archive');

    const authorSealHtml = `
      <div class="author-seal-wrapper">
        <div class="wax-seal ${sealClass}">
          <span class="wax-emblem">${sealEmblem}</span>
        </div>
        <span class="author-seal-signature">${sealSignature}</span>
        <span class="author-seal-subtitle">${sealSubtitle}</span>
      </div>
    `;

    // Comments Section Builder
    const comments = getWritingComments(writingId);
    const topLevelComments = comments.filter(c => !c.parentId);

    function renderCommentThread(c, isReply = false) {
      const isAv = isAvigna(c.author);
      const authorDisplayName = getAuthorDisplayName(c.author);
      const avatarLetter = isAv ? '✦' : 'N';
      const authorBadgeClass = isAv ? 'comment-author-badge--avigna' : 'comment-author-badge--neerav';
      const timeStr = formatRelativeTime(c.timestamp);
      const isOwnComment = getCurrentUser() === (isAv ? 'avigna' : 'neerav');
      const childReplies = comments.filter(r => r.parentId === c.id);

      return `
        <div class="comment-item ${isReply ? 'comment-item--reply' : ''}" id="comment-${c.id}" data-comment-id="${c.id}">
          <div class="comment-item-header">
            <div class="comment-author-info">
              <span class="comment-author-avatar ${isAv ? 'user--avigna' : ''}">${avatarLetter}</span>
              <span class="comment-author-badge ${authorBadgeClass}">${escapeHTML(authorDisplayName)}</span>
              <span class="comment-timestamp">${escapeHTML(timeStr)}</span>
            </div>
            <div class="comment-actions">
              ${!isReply ? `<button type="button" class="comment-action-btn btn-reply" data-reply-id="${c.id}">↩ Reply</button>` : ''}
              ${isOwnComment ? `<button type="button" class="comment-action-btn btn-delete-comment" data-delete-comment-id="${c.id}" title="Delete comment">✕ Delete</button>` : ''}
            </div>
          </div>
          <div class="comment-text">${escapeHTML(c.text)}</div>

          ${!isReply ? `
            <div class="comment-reply-form" id="replyForm-${c.id}" hidden>
              <textarea class="comment-input reply-input" rows="2" placeholder="Reply to ${escapeHTML(authorDisplayName)}..."></textarea>
              <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">
                <button type="button" class="btn-secondary btn-cancel-reply" data-cancel-reply-id="${c.id}" style="font-size: 0.8rem; padding: 5px 12px;">Cancel</button>
                <button type="button" class="btn-primary btn-submit-reply" data-submit-reply-id="${c.id}" style="font-size: 0.8rem; padding: 5px 14px;">Post Reply</button>
              </div>
            </div>
          ` : ''}

          ${childReplies.length > 0 ? `
            <div class="comment-replies-list">
              ${childReplies.map(r => renderCommentThread(r, true)).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }

    const commentsListHtml = topLevelComments.length > 0
      ? topLevelComments.map(c => renderCommentThread(c)).join('')
      : `<p class="comments-empty-text" id="commentsEmpty">No reflections yet. Be the first to leave a thought.</p>`;

    const currentLoggedInAuthorName = getAuthorDisplayName(getCurrentUser());
    const commentsSectionHtml = `
      <div class="reading-comments-section" id="readingCommentsSection">
        <div class="comments-header">
          <h2 class="comments-title"><span>💬</span> Comments (${comments.length})</h2>
        </div>

        <div class="comment-form-wrapper">
          <div class="comment-form-author">
            <span>Writing comment as <strong>${escapeHTML(currentLoggedInAuthorName)}</strong></span>
          </div>
          <textarea id="newCommentInput" class="comment-input" rows="2" placeholder="Leave a reflection, note, or reaction..."></textarea>
          <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
            <button type="button" class="btn-primary" id="btnPostComment" style="font-size: 0.85rem; padding: 8px 18px;">Post Comment</button>
          </div>
        </div>

        <div class="comments-list" id="commentsList">
          ${commentsListHtml}
        </div>
      </div>
    `;

    // Tags
    const tagsHtml = (writing.tags || []).map(t =>
      `<span class="reading-tag" data-tag="${escapeHTML(t)}">#${escapeHTML(t)}</span>`
    ).join('');

    // Related works — stable sort by shared tag count desc, then date desc (no random shuffle)
    const related = allWritings
      .filter(w => w.id !== writing.id && (w.tags || []).some(t => (writing.tags || []).includes(t)))
      .sort((a, b) => {
        const commonA = (a.tags || []).filter(t => (writing.tags || []).includes(t)).length;
        const commonB = (b.tags || []).filter(t => (writing.tags || []).includes(t)).length;
        if (commonB !== commonA) return commonB - commonA;
        return new Date(b.date) - new Date(a.date);
      })
      .slice(0, 3);

    const relatedHtml = related.map((w, i) =>
      createWritingCard(w, i * 80).outerHTML
    ).join('');

    // Prev/Next nav
    let navHtml = '<div class="reading-nav">';
    if (prevWork) {
      navHtml += `
        <div class="reading-nav-item" data-writing-id="${prevWork.id}" role="button" tabindex="0">
          <span class="reading-nav-label">← Previous</span>
          <span class="reading-nav-title">${escapeHTML(prevWork.title)}</span>
        </div>`;
    } else {
      navHtml += '<div></div>';
    }
    if (nextWork) {
      navHtml += `
        <div class="reading-nav-item reading-nav-item--next" data-writing-id="${nextWork.id}" role="button" tabindex="0">
          <span class="reading-nav-label">Next →</span>
          <span class="reading-nav-title">${escapeHTML(nextWork.title)}</span>
        </div>`;
    } else {
      navHtml += '<div></div>';
    }
    navHtml += '</div>';

    readingContent.innerHTML = `
      <div class="reading-header">
        <span class="reading-type">${escapeHTML(writing.type)}</span>
        <span class="reading-date">${formatDateLong(writing.date)} · Written by ${escapeHTML(authorName)}</span>
        <h1 class="reading-title">${escapeHTML(writing.title)}</h1>
        <p class="reading-excerpt">${escapeHTML(writing.excerpt)}</p>
      </div>

      ${dialogueBannerHtml}

      <div class="reading-divider" aria-hidden="true">
        <span>✦</span>
      </div>

      <div class="reading-body ${isPoem ? 'reading-body--poem' : ''}" id="readingBodyContainer">
        ${bodyHtml}
      </div>

      ${collabPassThePenHtml}
      ${marginaliaHtml}
      ${authorSealHtml}
      ${responsesHtml}

      ${commentsSectionHtml}

      <div class="reading-footer">
        <div class="reading-tags">${tagsHtml}</div>
        ${navHtml}
        ${related.length > 0 ? `
          <div class="reading-related">
            <h2 class="reading-related-title">More from the Archive</h2>
            <div class="reading-related-grid">${relatedHtml}</div>
          </div>
        ` : ''}
        <div class="reading-back">
          <a href="#" class="link-subtle" data-nav="archive">
            ← Back to the Archive
          </a>
        </div>
      </div>
    `;

    // Apply active reader preferences
    applyReaderPrefs();

    // Pass the Pen submit handler
    const btnSubmitTurn = $('#btnSubmitTurn');
    const passThePenInput = $('#passThePenInput');
    if (btnSubmitTurn && passThePenInput) {
      btnSubmitTurn.addEventListener('click', async () => {
        const turnText = passThePenInput.value.trim();
        if (!turnText) {
          passThePenInput.focus();
          return;
        }
        const activeWriting = getWritings().find(w => w.id === writingId);
        if (!activeWriting) return;

        const turnAuthorName = getAuthorDisplayName(getCurrentUser());
        const updatedContent = `${(activeWriting.content || '').trim()}\n\n${turnAuthorName}:\n${turnText}`;

        btnSubmitTurn.disabled = true;
        try {
          await updateWriting(writingId, { ...activeWriting, content: updatedContent });
          showToast('Added your turn to the story! ✒️');
          renderReading(writingId);
        } catch (e) {
          console.error('Error submitting collaborative turn:', e);
        }
      });
    }

    // Comment submit handler
    const btnPostComment = $('#btnPostComment');
    const newCommentInput = $('#newCommentInput');
    if (btnPostComment && newCommentInput) {
      btnPostComment.addEventListener('click', () => {
        const text = newCommentInput.value.trim();
        if (!text) {
          newCommentInput.focus();
          return;
        }
        addComment(writingId, text);
        renderReading(writingId);
      });
    }

    // Reply and Delete button handlers
    readingContent.querySelectorAll('.btn-reply').forEach(btn => {
      btn.addEventListener('click', () => {
        const commentId = btn.dataset.replyId;
        const form = readingContent.querySelector(`#replyForm-${commentId}`);
        if (form) {
          form.hidden = !form.hidden;
          if (!form.hidden) {
            form.querySelector('.reply-input')?.focus();
          }
        }
      });
    });

    readingContent.querySelectorAll('.btn-cancel-reply').forEach(btn => {
      btn.addEventListener('click', () => {
        const commentId = btn.dataset.cancelReplyId;
        const form = readingContent.querySelector(`#replyForm-${commentId}`);
        if (form) form.hidden = true;
      });
    });

    readingContent.querySelectorAll('.btn-submit-reply').forEach(btn => {
      btn.addEventListener('click', () => {
        const commentId = btn.dataset.submitReplyId;
        const form = readingContent.querySelector(`#replyForm-${commentId}`);
        const input = form?.querySelector('.reply-input');
        const text = input ? input.value.trim() : '';
        if (!text) {
          input?.focus();
          return;
        }
        addComment(writingId, text, commentId);
        renderReading(writingId);
      });
    });

    readingContent.querySelectorAll('.btn-delete-comment').forEach(btn => {
      btn.addEventListener('click', () => {
        const commentId = btn.dataset.deleteCommentId;
        if (confirm('Delete this comment?')) {
          deleteComment(writingId, commentId);
          renderReading(writingId);
        }
      });
    });

    // Marginalia toggle handler
    const btnMarginalia = $('#btnToggleMarginalia');
    const drawerMarginalia = $('#marginaliaDrawer');
    if (btnMarginalia && drawerMarginalia) {
      btnMarginalia.addEventListener('click', () => {
        drawerMarginalia.hidden = !drawerMarginalia.hidden;
      });
    }

    // Dialogue link handlers
    readingContent.querySelectorAll('[data-dialogue-target]').forEach(link => {
      const handler = (e) => {
        e.preventDefault();
        navigateTo('reading', link.dataset.dialogueTarget);
      };
      link.addEventListener('click', handler);
      link.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(e); }
      });
    });

    // Tag clicks
    readingContent.querySelectorAll('.reading-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        navigateTo('tag', tag.dataset.tag);
      });
    });

    // Prev/Next clicks
    readingContent.querySelectorAll('.reading-nav-item').forEach(item => {
      const handler = () => navigateTo('reading', item.dataset.writingId);
      item.addEventListener('click', handler);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
      });
    });

    // Related cards clicks
    readingContent.querySelectorAll('.writing-card').forEach(card => {
      const title = card.querySelector('.card-title')?.textContent;
      const w = getWritings().find(w => w.title === title);
      if (w) {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.card-tag')) {
            navigateTo('tag', e.target.dataset.tag);
            return;
          }
          navigateTo('reading', w.id);
        });
      }
    });

    readingProgressBar.style.width = '0%';
    requestAnimationFrame(() => observeReveals());
  }

  // ——— Reader Customizer (Aa Panel) ———
  function getReaderPrefs() {
    try {
      const saved = localStorage.getItem(READER_PREFS_KEY);
      return saved ? JSON.parse(saved) : { font: 'serif', size: 100, width: 'medium', stanzaFocus: false };
    } catch (e) {
      return { font: 'serif', size: 100, width: 'medium', stanzaFocus: false };
    }
  }

  function saveReaderPrefs(prefs) {
    localStorage.setItem(READER_PREFS_KEY, JSON.stringify(prefs));
  }

  function applyReaderPrefs() {
    const prefs = getReaderPrefs();
    const readingArticle = $('#readingContent');
    const readingBody = $('#readingBodyContainer');
    if (!readingArticle || !readingBody) return;

    // Font family
    readingBody.classList.remove('reading-body--sans', 'reading-body--mono');
    if (prefs.font === 'sans') readingBody.classList.add('reading-body--sans');
    if (prefs.font === 'mono') readingBody.classList.add('reading-body--mono');

    // Font size
    readingBody.style.fontSize = `${prefs.size}%`;

    // Width
    readingArticle.classList.remove('reading--width-narrow', 'reading--width-medium', 'reading--width-wide');
    readingArticle.classList.add(`reading--width-${prefs.width || 'medium'}`);

    // Stanza focus mode
    readingArticle.classList.toggle('stanza-focus-mode', Boolean(prefs.stanzaFocus));

    // Update buttons in popover
    $$('#readerFontGroup .reader-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.font === prefs.font);
    });
    $$('#readerWidthGroup .reader-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.width === prefs.width);
    });
    const sizeResetBtn = $('#btnFontReset');
    if (sizeResetBtn) sizeResetBtn.textContent = `${prefs.size}%`;
    const focusCheck = $('#stanzaFocusCheck');
    if (focusCheck) focusCheck.checked = Boolean(prefs.stanzaFocus);
  }

  function initReaderCustomizer() {
    const toggleBtn = $('#btnReaderToggle');
    const popover = $('#readerPopover');

    if (!toggleBtn || !popover) return;

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      popover.hidden = !popover.hidden;
    });

    document.addEventListener('click', (e) => {
      if (!popover.contains(e.target) && e.target !== toggleBtn) {
        popover.hidden = true;
      }
    });

    // Font switcher
    $$('#readerFontGroup .reader-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prefs = getReaderPrefs();
        prefs.font = btn.dataset.font;
        saveReaderPrefs(prefs);
        applyReaderPrefs();
      });
    });

    // Size controls
    $('#btnFontSmaller')?.addEventListener('click', () => {
      const prefs = getReaderPrefs();
      prefs.size = Math.max(75, (prefs.size || 100) - 10);
      saveReaderPrefs(prefs);
      applyReaderPrefs();
    });

    $('#btnFontReset')?.addEventListener('click', () => {
      const prefs = getReaderPrefs();
      prefs.size = 100;
      saveReaderPrefs(prefs);
      applyReaderPrefs();
    });

    $('#btnFontLarger')?.addEventListener('click', () => {
      const prefs = getReaderPrefs();
      prefs.size = Math.min(150, (prefs.size || 100) + 10);
      saveReaderPrefs(prefs);
      applyReaderPrefs();
    });

    // Column width
    $$('#readerWidthGroup .reader-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prefs = getReaderPrefs();
        prefs.width = btn.dataset.width;
        saveReaderPrefs(prefs);
        applyReaderPrefs();
      });
    });

    // Stanza focus checkbox
    $('#stanzaFocusCheck')?.addEventListener('change', (e) => {
      const prefs = getReaderPrefs();
      prefs.stanzaFocus = e.target.checked;
      saveReaderPrefs(prefs);
      applyReaderPrefs();
    });
  }

  // ——— Aesthetic Postcard Generator (Canvas) ———
  let currentPostcardTheme = 'parchment';

  const POSTCARD_PALETTES = {
    parchment: {
      bg: '#F5F0E6',
      cardBg: '#EDE8DF',
      text: '#242321',
      textSecondary: '#5C5750',
      accent: '#7A2E33',
      gold: '#A8824B',
      border: 'rgba(36, 35, 33, 0.18)'
    },
    midnight: {
      bg: '#141312',
      cardBg: '#211F1C',
      text: '#F0EAE1',
      textSecondary: '#B3ACA0',
      accent: '#D48588',
      gold: '#D6B475',
      border: 'rgba(240, 234, 225, 0.16)'
    },
    crimson: {
      bg: '#250E10',
      cardBg: '#341517',
      text: '#FBEBEB',
      textSecondary: '#D8B2B4',
      accent: '#D6B475',
      gold: '#F4DEB3',
      border: 'rgba(214, 180, 117, 0.25)'
    },
    sage: {
      bg: '#1B241E',
      cardBg: '#253129',
      text: '#EEF3EF',
      textSecondary: '#A9BEAF',
      accent: '#E2DCD0',
      gold: '#C5D8CB',
      border: 'rgba(200, 225, 210, 0.2)'
    }
  };

  function renderPostcard(writing, themeKey, excerptText) {
    const canvas = $('#postcardCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const p = POSTCARD_PALETTES[themeKey] || POSTCARD_PALETTES.parchment;

    // Skip expensive 1080x1080 render on mobile to save GPU/CPU
    if (window.innerWidth <= 768) return;

    const width = 1080;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, width, height);

    // Inner card background
    ctx.fillStyle = p.cardBg;
    ctx.fillRect(60, 60, width - 120, height - 120);

    // Double Border
    ctx.strokeStyle = p.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, width - 120, height - 120);
    ctx.strokeRect(76, 76, width - 152, height - 152);

    // Corner Ornaments
    ctx.fillStyle = p.gold;
    ctx.font = '24px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', 76, 76);
    ctx.fillText('✦', width - 76, 76);
    ctx.fillText('✦', 76, height - 76);
    ctx.fillText('✦', width - 76, height - 76);

    // Top Header Badge
    ctx.font = '500 18px "JetBrains Mono", Consolas, monospace';
    ctx.fillStyle = p.accent;
    ctx.letterSpacing = '3px';
    ctx.fillText(`THE ARCHIVE · ${(writing.type || 'LITERARY WORK').toUpperCase()}`, width / 2, 140);

    // Title
    ctx.font = '600 48px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = p.text;
    ctx.fillText(writing.title, width / 2, 210);

    // Divider
    ctx.strokeStyle = p.border;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 120, 250);
    ctx.lineTo(width / 2 + 120, 250);
    ctx.stroke();

    // Central Excerpt / Stanza Text
    ctx.font = 'italic 34px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = p.text;
    const maxWidth = 760;
    const lineHeight = 50;

    const words = (excerptText || writing.excerpt || '').replace(/^["']|["']$/g, '').split(' ');
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    // Center vertical lines
    const startY = 480 - ((lines.length * lineHeight) / 2);
    for (let k = 0; k < lines.length; k++) {
      ctx.fillText(lines[k], width / 2, startY + (k * lineHeight));
    }

    // Author Seal & Signature
    const authorName = getAuthorDisplayName(writing.author);
    const authorTitle = isAvigna(writing.author) ? 'The Muse' : 'The Archivist';

    // Wax Seal circle
    ctx.beginPath();
    ctx.arc(width / 2, height - 250, 36, 0, Math.PI * 2);
    ctx.fillStyle = isAvigna(writing.author) ? '#5A46A0' : '#7A2E33';
    ctx.fill();
    ctx.strokeStyle = p.gold;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFF';
    ctx.font = '700 28px "Cormorant Garamond", serif';
    ctx.fillText(isAvigna(writing.author) ? '✦' : 'N', width / 2, height - 250);

    // Signature line
    ctx.font = '500 24px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = p.text;
    ctx.fillText(`Penned by ${authorName} · ${authorTitle}`, width / 2, height - 180);

    // Date & Footer watermark
    ctx.font = '16px "JetBrains Mono", Consolas, monospace';
    ctx.fillStyle = p.textSecondary;
    ctx.fillText(`${formatDateLong(writing.date)} · The Archive`, width / 2, height - 120);
  }

  function initPostcardModal() {
    const postcardModal = $('#postcardModal');
    const postcardClose = $('#postcardClose');
    const postcardOverlay = $('#postcardOverlay');
    const excerptSelect = $('#postcardExcerptSelect');
    const btnDownload = $('#btnDownloadPostcard');
    const btnCopy = $('#btnCopyPostcard');

    if (!postcardModal) return;

    function openPostcard() {
      if (!currentReadingId) return;
      const writing = getWritings().find(w => w.id === currentReadingId);
      if (!writing) return;

      // Populate excerpts/stanzas in dropdown
      excerptSelect.innerHTML = '';
      const optDefault = document.createElement('option');
      optDefault.value = writing.excerpt;
      optDefault.textContent = `Card Excerpt: "${writing.excerpt.slice(0, 50)}..."`;
      excerptSelect.appendChild(optDefault);

      const stanzas = (writing.content || '').split(/\n\n+/).filter(s => s.trim());
      stanzas.forEach((s, idx) => {
        const opt = document.createElement('option');
        opt.value = s.replace(/\n/g, ' ');
        opt.textContent = `Stanza ${idx + 1}: "${s.slice(0, 45).replace(/\n/g, ' ')}..."`;
        excerptSelect.appendChild(opt);
      });

      renderPostcard(writing, currentPostcardTheme, excerptSelect.value);
      postcardModal.hidden = false;
    }

    function closePostcard() {
      postcardModal.hidden = true;
    }

    $('#btnPostcard')?.addEventListener('click', openPostcard);
    postcardClose?.addEventListener('click', closePostcard);
    postcardOverlay?.addEventListener('click', closePostcard);

    $$('.postcard-theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.postcard-theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPostcardTheme = btn.dataset.theme;
        const writing = getWritings().find(w => w.id === currentReadingId);
        if (writing) renderPostcard(writing, currentPostcardTheme, excerptSelect.value);
      });
    });

    excerptSelect?.addEventListener('change', () => {
      const writing = getWritings().find(w => w.id === currentReadingId);
      if (writing) renderPostcard(writing, currentPostcardTheme, excerptSelect.value);
    });

    btnDownload?.addEventListener('click', () => {
      const canvas = $('#postcardCanvas');
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `the-archive-postcard-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });

    btnCopy?.addEventListener('click', () => {
      const canvas = $('#postcardCanvas');
      if (!canvas || !navigator.clipboard) return;
      canvas.toBlob((blob) => {
        if (blob) {
          navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
            .then(() => alert('✨ Postcard copied to clipboard!'))
            .catch(() => alert('Could not copy image automatically. Use Download button instead.'));
        }
      });
    });
  }

  // ——— Distraction-Free Zen Mode ———
  function initZenMode() {
    const zenOverlay = $('#zenOverlay');
    const zenTextarea = $('#zenTextarea');
    const formContent = $('#formContent');
    const btnZenToggle = $('#btnZenToggle');
    const btnExitZen = $('#btnExitZen');
    const zenStats = $('#zenStats');
    const formWordCounter = $('#formWordCounter');

    if (!zenOverlay || !zenTextarea || !formContent) return;

    function updateCounters(text) {
      const words = countWords(text);
      const lines = text.split('\n').length;
      const statsStr = `${words} words · ${lines} lines`;
      if (zenStats) zenStats.textContent = statsStr;
      if (formWordCounter) formWordCounter.textContent = `${words} words`;
    }

    formContent.addEventListener('input', () => {
      updateCounters(formContent.value);
    });

    btnZenToggle?.addEventListener('click', () => {
      zenTextarea.value = formContent.value;
      updateCounters(zenTextarea.value);
      zenOverlay.hidden = false;
      setTimeout(() => zenTextarea.focus(), 100);
    });

    function exitZen() {
      formContent.value = zenTextarea.value;
      updateCounters(formContent.value);
      zenOverlay.hidden = true;
      // Open the Add New Writing modal directly (small form with publishing options)
      const addModal = $('#adminModal');
      if (addModal) addModal.hidden = false;
      navigateTo('home');
    }

    btnExitZen?.addEventListener('click', exitZen);

    zenTextarea.addEventListener('input', () => {
      formContent.value = zenTextarea.value;
      updateCounters(zenTextarea.value);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !zenOverlay.hidden) {
        exitZen();
      }
    });
  }

  // ——— Draft Auto-Saving Engine ———
  function initDraftEngine() {
    const formTitle = $('#formTitle');
    const formAuthor = $('#formAuthor');
    const formType = $('#formType');
    const formDate = $('#formDate');
    const formExcerpt = $('#formExcerpt');
    const formContent = $('#formContent');
    const formTags = $('#formTags');
    const formMarginalia = $('#formMarginalia');
    const formInResponseTo = $('#formInResponseTo');
    const formReadingTime = $('#formReadingTime');
    const formCollection = $('#formCollection');
    const formFeatured = $('#formFeatured');

    function saveCurrentDraft() {
      if (editingIdInput && editingIdInput.value) return; // Don't overwrite draft when editing existing
      if (!formTitle.value && !formContent.value) return;

      const draft = {
        title: formTitle.value,
        author: formAuthor.value,
        type: formType.value,
        date: formDate.value,
        excerpt: formExcerpt.value,
        content: formContent.value,
        tags: formTags.value,
        marginalia: formMarginalia ? formMarginalia.value : '',
        inResponseTo: formInResponseTo ? formInResponseTo.value : '',
        readingTime: formReadingTime.value,
        collection: formCollection.value,
        featured: formFeatured.checked,
        timestamp: Date.now()
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }

    [formTitle, formAuthor, formType, formDate, formExcerpt, formContent, formTags, formMarginalia, formInResponseTo, formReadingTime, formCollection].forEach(el => {
      if (el) el.addEventListener('input', saveCurrentDraft);
    });
    if (formFeatured) formFeatured.addEventListener('change', saveCurrentDraft);
  }

  // ——— Collections ———
  function renderCollections() {
    collectionsGrid.innerHTML = '';
    COLLECTIONS.forEach((col, i) => {
      const count = getWritings().filter(w => w.collection === col.id).length;
      const card = document.createElement('div');
      card.className = 'collection-card';
      card.style.transitionDelay = (i * 100) + 'ms';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.innerHTML = `
        <div class="collection-icon" aria-hidden="true">${col.icon}</div>
        <h3 class="collection-name">${escapeHTML(col.name)}</h3>
        <p class="collection-desc">${escapeHTML(col.description)}</p>
        <span class="collection-count">${count} ${count === 1 ? 'work' : 'works'}</span>
      `;
      const handler = () => navigateTo('collection-detail', col.id);
      card.addEventListener('click', handler);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
      });
      collectionsGrid.appendChild(card);
    });
  }

  function renderCollectionDetail(collectionId) {
    const col = COLLECTIONS.find(c => c.id === collectionId);
    if (!col) { navigateTo('collections'); return; }

    const writings = getWritings()
      .filter(w => w.collection === collectionId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    collectionDetailHeader.innerHTML = `
      <span class="section-label">Collection</span>
      <h2 class="page-title">${escapeHTML(col.name)}</h2>
      <p class="page-desc">${escapeHTML(col.description)}</p>
    `;

    collectionDetailGrid.innerHTML = '';
    writings.forEach((w, i) => {
      collectionDetailGrid.appendChild(createWritingCard(w, i * 80));
    });
  }

  // ——— Tag Page ———
  function renderTagPage(tag) {
    const writings = getWritings()
      .filter(w => (w.tags || []).includes(tag))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    tagHeader.innerHTML = `
      <span class="section-label">Tag</span>
      <h2 class="page-title">#${escapeHTML(tag)}</h2>
      <p class="page-desc">${writings.length} ${writings.length === 1 ? 'work' : 'works'} tagged with #${escapeHTML(tag)}</p>
    `;

    tagGrid.innerHTML = '';
    writings.forEach((w, i) => {
      tagGrid.appendChild(createWritingCard(w, i * 80));
    });
  }

  // ——— Timeline ———
  function renderTimeline() {
    const sorted = [...getWritings()].sort((a, b) => new Date(b.date) - new Date(a.date));

    const byYear = {};
    sorted.forEach(w => {
      const year = new Date(w.date + 'T00:00:00').getFullYear();
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(w);
    });

    timeline.innerHTML = '';
    const years = Object.keys(byYear).sort((a, b) => b - a);

    years.forEach(year => {
      const yearDiv = document.createElement('div');
      yearDiv.className = 'timeline-year';

      const label = document.createElement('h3');
      label.className = 'timeline-year-label';
      label.textContent = year;
      yearDiv.appendChild(label);

      byYear[year].forEach((w, i) => {
        const entry = document.createElement('div');
        entry.className = 'timeline-entry';
        entry.style.transitionDelay = (i * 80) + 'ms';
        entry.setAttribute('role', 'button');
        entry.setAttribute('tabindex', '0');
        entry.innerHTML = `
          <span class="timeline-entry-date">${formatDate(w.date)}</span>
          <h4 class="timeline-entry-title">${escapeHTML(w.title)}</h4>
          <span class="timeline-entry-type">${escapeHTML(w.type)} · By ${getAuthorDisplayName(w.author)}</span>
        `;
        const handler = () => navigateTo('reading', w.id);
        entry.addEventListener('click', handler);
        entry.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
        });
        yearDiv.appendChild(entry);
      });

      timeline.appendChild(yearDiv);
    });
  }

  // ——— Writer's Desk (Collaborative Milestones) ———
  function renderDesk() {
    const writings = getWritings();
    const totalWorks = writings.length;
    const totalWords = writings.reduce((sum, w) => sum + countWords(w.content), 0);
    const dialoguesCount = writings.filter(w => w.inResponseTo).length;

    const allTags = new Set();
    writings.forEach(w => (w.tags || []).forEach(t => allTags.add(t)));

    const stats = [
      { number: totalWorks, label: 'works preserved' },
      { number: totalWords.toLocaleString(), label: 'words written' },
      { number: dialoguesCount, label: 'literary dialogues' },
      { number: allTags.size, label: 'shared themes' }
    ];

    deskStats.innerHTML = '';
    stats.forEach((s, i) => {
      const div = document.createElement('div');
      div.className = 'desk-stat';
      div.style.transitionDelay = (i * 100) + 'ms';
      div.innerHTML = `
        <div class="desk-stat-number">${s.number}</div>
        <div class="desk-stat-label">${s.label}</div>
      `;
      deskStats.appendChild(div);
    });

    const neeravWritings = writings.filter(w => !isAvigna(w.author));
    const avignaWritings = writings.filter(w => isAvigna(w.author));
    const neeravWords = neeravWritings.reduce((sum, w) => sum + countWords(w.content), 0);
    const avignaWords = avignaWritings.reduce((sum, w) => sum + countWords(w.content), 0);

    const breakdown = [
      { count: `${neeravWritings.length} (${neeravWords.toLocaleString()} w)`, label: 'Neerav (The Archivist)' },
      { count: `${avignaWritings.length} (${avignaWords.toLocaleString()} w)`, label: 'Avigna (The Muse)' },
      { count: writings.filter(w => w.type === 'poem').length, label: 'Poems' },
      { count: writings.filter(w => w.type === 'story').length, label: 'Stories' },
      { count: writings.filter(w => w.type === 'article').length, label: 'Articles' },
      { count: writings.filter(w => w.type === 'essay').length, label: 'Essays' },
      { count: writings.filter(w => w.type === 'note').length, label: 'Notes' }
    ].filter(b => parseInt(b.count) > 0 || String(b.count).startsWith('0') === false);

    deskBreakdown.innerHTML = '';
    breakdown.forEach(b => {
      const div = document.createElement('div');
      div.className = 'desk-breakdown-item';
      div.innerHTML = `
        <span class="desk-breakdown-count">${b.count}</span>
        <span class="desk-breakdown-label">${b.label}</span>
      `;
      deskBreakdown.appendChild(div);
    });
  }

  // ——— Intersection Observer for Reveals ———
  let observer;
  function observeReveals() {
    if (observer) observer.disconnect();

    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '0px 0px -40px 0px'
    });

    $$('.reveal-up, .reveal-text, .writing-card, .collection-card, .timeline-entry, .desk-stat, .quote-card').forEach(el => {
      if (!el.classList.contains('visible')) {
        observer.observe(el);
      }
    });
  }

  // ——— Footer Year ———
  function setFooterYear() {
    const el = $('#footerYear');
    if (el) el.textContent = new Date().getFullYear();
  }

  // ——— Admin / Modal Management ———
  const adminModal = $('#adminModal');
  const modalTitle = $('#modalTitle');
  const writingForm = $('#writingForm');
  const editingIdInput = $('#editingId');
  const formTitle = $('#formTitle');
  const formAuthor = $('#formAuthor');
  const formType = $('#formType');
  const formDate = $('#formDate');
  const formExcerpt = $('#formExcerpt');
  const formContent = $('#formContent');
  const formTags = $('#formTags');
  const formMarginalia = $('#formMarginalia');
  const formInResponseTo = $('#formInResponseTo');
  const formReadingTime = $('#formReadingTime');
  const formCollection = $('#formCollection');
  const formFeatured = $('#formFeatured');
  const draftBanner = $('#draftBanner');
  const draftTime = $('#draftTime');

  let currentStep = 1;

  function showStep(step) {
    currentStep = step;
    $$('.form-step').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.step) === step);
    });
  }

  function populateInResponseToOptions(excludeId = null) {
    if (!formInResponseTo) return;
    formInResponseTo.innerHTML = '<option value="">None (Standalone Piece)</option>';
    getWritings()
      .filter(w => w.id !== excludeId)
      .forEach(w => {
        const opt = document.createElement('option');
        opt.value = w.id;
        opt.textContent = `"${w.title}" — by ${getAuthorDisplayName(w.author)}`;
        formInResponseTo.appendChild(opt);
      });
  }

  function openModal(writing = null) {
    showStep(1);
    populateInResponseToOptions(writing ? writing.id : null);

    if (writing) {
      if (!canUserEdit(writing.author)) {
        const authorDisplayName = getAuthorDisplayName(writing.author);
        alert(`🔒 Permission denied:\n\nOnly the author (${authorDisplayName}) can edit this piece.`);
        return;
      }

      modalTitle.textContent = 'Edit Writing';
      editingIdInput.value = writing.id;
      formTitle.value = writing.title || '';
      formAuthor.value = isAvigna(writing.author) ? 'avigna' : 'neerav';
      formType.value = writing.type || 'poem';
      formDate.value = writing.date || new Date().toISOString().split('T')[0];
      formExcerpt.value = writing.excerpt || '';
      formContent.value = writing.content || '';
      formTags.value = (writing.tags || []).join(', ');
      if (formMarginalia) formMarginalia.value = writing.marginalia || '';
      if (formInResponseTo) formInResponseTo.value = writing.inResponseTo || '';
      formReadingTime.value = writing.readingTime || '2 min read';
      formCollection.value = writing.collection || '';
      formFeatured.checked = writing.featured || false;
      if (draftBanner) draftBanner.hidden = true;
    } else {
      modalTitle.textContent = 'Add New Writing';
      writingForm.reset();
      editingIdInput.value = '';
      formAuthor.value = getCurrentUser();
      formDate.value = new Date().toISOString().split('T')[0];
      formReadingTime.value = '2 min read';
      formFeatured.checked = false;

      // Check draft
      const savedDraftStr = localStorage.getItem(DRAFT_KEY);
      if (savedDraftStr && draftBanner) {
        try {
          const draft = JSON.parse(savedDraftStr);
          if (draft.title || draft.content) {
            draftBanner.hidden = false;
            if (draftTime && draft.timestamp) {
              const d = new Date(draft.timestamp);
              draftTime.textContent = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            }
          } else {
            draftBanner.hidden = true;
          }
        } catch (e) {
          draftBanner.hidden = true;
        }
      } else if (draftBanner) {
        draftBanner.hidden = true;
      }
    }
    adminModal.hidden = false;
  }

  function closeModal() {
    adminModal.hidden = true;
    showStep(1);
  }

  function initAdmin() {
    $('#btnAddWriting')?.addEventListener('click', () => openModal());

    $('#btnRestoreDraft')?.addEventListener('click', () => {
      try {
        const draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
        if (draft) {
          formTitle.value = draft.title || '';
          formAuthor.value = draft.author || 'neerav';
          formType.value = draft.type || 'poem';
          formDate.value = draft.date || new Date().toISOString().split('T')[0];
          formExcerpt.value = draft.excerpt || '';
          formContent.value = draft.content || '';
          formTags.value = draft.tags || '';
          if (formMarginalia) formMarginalia.value = draft.marginalia || '';
          if (formInResponseTo) formInResponseTo.value = draft.inResponseTo || '';
          formReadingTime.value = draft.readingTime || '2 min read';
          formCollection.value = draft.collection || '';
          formFeatured.checked = Boolean(draft.featured);
          if (draftBanner) draftBanner.hidden = true;
        }
      } catch (e) {}
    });

    $('#btnDiscardDraft')?.addEventListener('click', () => {
      localStorage.removeItem(DRAFT_KEY);
      if (draftBanner) draftBanner.hidden = true;
    });

    $('#btnNextStep1')?.addEventListener('click', () => {
      if (!formTitle.value.trim()) { formTitle.reportValidity(); return; }
      if (!formAuthor.value) { formAuthor.reportValidity(); return; }
      if (!formDate.value) { formDate.reportValidity(); return; }
      if (!formExcerpt.value.trim()) { formExcerpt.reportValidity(); return; }
      showStep(2);
      setTimeout(() => formContent.focus(), 100);
    });

    $('#btnPrevStep2')?.addEventListener('click', () => showStep(1));

    $('#btnNextStep2')?.addEventListener('click', () => {
      if (!formContent.value.trim()) { formContent.reportValidity(); return; }
      showStep(3);
    });

    $('#btnPrevStep3')?.addEventListener('click', () => showStep(2));

    $('#modalClose')?.addEventListener('click', closeModal);
    $('#modalOverlay')?.addEventListener('click', closeModal);
    $('#btnCancel')?.addEventListener('click', closeModal);

    writingForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const isEditing = Boolean(editingIdInput.value);

      if (isEditing) {
        const existing = getWritings().find(w => w.id === editingIdInput.value);
        if (existing && !canUserEdit(existing.author)) {
          const authorDisplayName = getAuthorDisplayName(existing.author);
          alert(`🔒 Permission denied:\n\nOnly the author (${authorDisplayName}) can edit this piece.`);
          return;
        }
      }

      const title = formTitle.value.trim();
      const rawAuthor = formAuthor.value || getCurrentUser();
      const author = isAvigna(rawAuthor) ? 'avigna' : 'neerav';
      localStorage.setItem('last-author', author);
      const type = formType.value;
      const date = formDate.value;
      const excerpt = formExcerpt.value.trim();
      const content = formContent.value;
      const tags = formTags.value
        .split(',')
        .map(t => slugify(t.trim()))
        .filter(Boolean);
      const marginalia = formMarginalia ? formMarginalia.value.trim() : '';
      const inResponseTo = formInResponseTo ? formInResponseTo.value : null;
      const readingTime = formReadingTime.value.trim() || '2 min read';
      const collection = formCollection.value || null;
      const featured = formFeatured.checked;

      const writingData = {
        id: isEditing ? editingIdInput.value : slugify(title) + '-' + Date.now(),
        title,
        author,
        type,
        date,
        excerpt,
        content,
        tags,
        marginalia,
        inResponseTo: inResponseTo || null,
        readingTime,
        featured,
        collection
      };

      const btnSave = $('#btnSave');
      if (btnSave) {
        btnSave.disabled = true;
        btnSave.textContent = isEditing ? 'Updating...' : 'Publishing to Cloud...';
      }

      try {
        if (isEditing) {
          await updateWriting(editingIdInput.value, writingData);
        } else {
          await addWriting(writingData);
          localStorage.removeItem(DRAFT_KEY);
        }
      } finally {
        if (btnSave) {
          btnSave.disabled = false;
          btnSave.textContent = 'Save Writing';
        }
      }

      closeModal();

      if (writingData && writingData.id) {
        navigateTo('reading', writingData.id);
      } else {
        navigateTo('archive');
      }
    });

    // Read later / Bookmark button on reading view
    $('#btnReadLaterReading')?.addEventListener('click', () => {
      if (!currentReadingId) return;
      const nowSaved = toggleBookmark(currentReadingId);
      const btn = $('#btnReadLaterReading');
      if (btn) {
        btn.classList.toggle('bookmarked', nowSaved);
        const textSpan = btn.querySelector('.admin-btn-text');
        if (textSpan) textSpan.textContent = nowSaved ? 'Bookmarked' : 'Bookmark';
      }
    });

    // Favorite button on reading view
    $('#btnBookmarkReading')?.addEventListener('click', () => {
      if (!currentReadingId) return;
      const nowFav = toggleFavorite(currentReadingId);
      const btn = $('#btnBookmarkReading');
      if (btn) {
        btn.classList.toggle('favorited', nowFav);
        const textSpan = btn.querySelector('.admin-btn-text');
        if (textSpan) textSpan.textContent = nowFav ? 'Favorited' : 'Favorite';
      }
    });

    // Share snippet button
    $('#btnShare')?.addEventListener('click', () => {
      if (!currentReadingId) return;
      const writing = getWritings().find(w => w.id === currentReadingId);
      if (!writing) return;

      const snippet = `  {
    id: '${writing.id}',
    title: '${writing.title.replace(/'/g, "\\'")}',
    type: '${writing.type}',
    date: '${writing.date}',
    author: '${writing.author || 'neerav'}',
    excerpt: '${writing.excerpt.replace(/'/g, "\\'")}',
    content: \`${writing.content.replace(/`/g, '\\`')}\`,
    tags: [${(writing.tags || []).map(t => `'${t}'`).join(', ')}],
    readingTime: '${writing.readingTime || '2 min read'}',
    featured: ${writing.featured || false},
    collection: ${writing.collection ? `'${writing.collection}'` : 'null'},
    inResponseTo: ${writing.inResponseTo ? `'${writing.inResponseTo}'` : 'null'},
    marginalia: \`${(writing.marginalia || '').replace(/`/g, '\\`')}\`
  }`;

      navigator.clipboard.writeText(snippet).then(() => {
        alert('✨ Code snippet copied!\n\nYou can now:\n1. Paste it into data/writings.js\n2. Or share it with Avigna');
      }).catch(() => {
        prompt('Copy this code snippet:', snippet);
      });
    });

    // Edit button on reading page
    $('#btnEdit')?.addEventListener('click', () => {
      if (!currentReadingId) return;
      const writing = getWritings().find(w => w.id === currentReadingId);
      if (writing) openModal(writing);
    });

    // Delete button on reading page
    $('#btnDelete')?.addEventListener('click', async () => {
      if (!currentReadingId) return;
      if (confirm('Are you sure you want to delete this writing? This cannot be undone.')) {
        const deleted = await deleteWriting(currentReadingId);
        if (deleted) {
          navigateTo('archive');
        }
      }
    });

    // Backup Export/Import
    $('#btnExport')?.addEventListener('click', exportData);
    $('#btnImport')?.addEventListener('click', () => $('#importFile')?.click());
    $('#importFile')?.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        importData(e.target.files[0]);
      }
    });

    formType.addEventListener('change', (e) => {
      const hint = $('#contentHint');
      const subHint = $('#contentSubHint');
      if (e.target.value === 'poem') {
        if (hint) hint.textContent = 'Poem Mode: Preserves line breaks';
        if (subHint) subHint.textContent = 'Tip: Press Enter for new lines, or Enter twice between stanzas.';
      } else {
        if (hint) hint.textContent = 'Prose Mode: Natural paragraph flow';
        if (subHint) subHint.textContent = 'Tip: Write freely. Press Enter twice to start a new paragraph.';
      }
    });
  }

  // ——— Keyboard Navigation ———
  function initKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if ($('#page-reading') && !$('#page-reading').hidden) {
          navigateTo(previousPage || 'archive');
        } else if (!adminModal.hidden) {
          closeModal();
        } else if (!$('#postcardModal')?.hidden) {
          $('#postcardModal').hidden = true;
        } else {
          navToggle.classList.remove('open');
          navLinks.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  // ——— User-Set Password Lock (one per identity, saved in localStorage) ———
  const AUTH_STORE_KEY = 'archive-auth-v1';

  function getAuthStore() {
    try {
      const s = localStorage.getItem(AUTH_STORE_KEY);
      return s ? JSON.parse(s) : {};
    } catch (e) {
      return {};
    }
  }

  function saveAuthStore(data) {
    localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(data));
  }

  function getIdentityForUser(user) {
    const norm = isAvigna(user) ? 'avigna' : 'neerav';
    const store = getAuthStore();
    return store[norm] || null;
  }

  function hasPasswordFor(user) {
    return Boolean(getIdentityForUser(user));
  }

  function verifyPassword(user, password) {
    const norm = isAvigna(user) ? 'avigna' : 'neerav';
    const trimmed = (password || '').trim();
    if (!trimmed) return false;

    // Built-in master / default passwords for easy access & recovery
    if (PASSWORD_USERS[trimmed] === norm || PASSWORD_USERS[trimmed.toLowerCase()] === norm) {
      return true;
    }

    const stored = getIdentityForUser(user);
    if (!stored) return false;
    return stored.password === trimmed;
  }

  function setPassword(user, password) {
    const norm = isAvigna(user) ? 'avigna' : 'neerav';
    const store = getAuthStore();
    store[norm] = { password: password.trim(), setAt: new Date().toISOString() };
    saveAuthStore(store);
  }

  function initLockScreen() {
    const lockScreen = $('#lockScreen');
    const mainContent = $('#mainContent');
    const lockForm = $('#lockForm');
    const lockPassword = $('#lockPassword');
    const lockError = $('#lockError');
    const lockScreenContent = lockScreen.querySelector('.lock-screen-content');

    // First-time setup: show identity picker + set password
    const lockSetup = $('#lockSetup');
    const btnPickNeerav = $('#btnPickNeerav');
    const btnPickAvigna = $('#btnPickAvigna');
    const btnSetPass = $('#btnSetPass');
    const lockNewPass = $('#lockNewPass');
    const btnForgotPass = $('#btnForgotPass');
    const btnBackToUnlock = $('#btnBackToUnlock');

    let chosenIdentity = null;

    function showSetup() {
      lockForm.hidden = true;
      if (lockSetup) lockSetup.style.display = 'flex';
    }

    function showUnlock() {
      lockForm.hidden = false;
      if (lockSetup) lockSetup.style.display = 'none';
    }

    function doUnlock(user) {
      setCurrentUser(user);
      sessionStorage.setItem('archive-unlocked', 'true');
      lockError.hidden = true;
      lockScreen.style.opacity = '0';
      setTimeout(() => {
        lockScreen.hidden = true;
        mainContent.hidden = false;
        lockScreen.style.opacity = '1';
      }, 500);
      updateUserBadge();
    }

    function tryUnlock(user) {
      const entered = (lockPassword ? lockPassword.value : '').trim();
      if (verifyPassword(user, entered)) {
        doUnlock(user);
      } else {
        lockError.hidden = false;
        if (lockScreenContent) lockScreenContent.classList.add('shake');
        if (lockPassword) lockPassword.value = '';
        if (lockPassword) lockPassword.focus();
        setTimeout(() => {
          if (lockScreenContent) lockScreenContent.classList.remove('shake');
        }, 400);
      }
    }

    // Check if any identity has a password set
    const hasNeerav = hasPasswordFor('neerav');
    const hasAvigna = hasPasswordFor('avigna');

    if (sessionStorage.getItem('archive-unlocked') === 'true') {
      lockScreen.hidden = true;
      mainContent.hidden = false;
      // If already unlocked, just restore current user from last session or default
      let last = sessionStorage.getItem('last-author');
      if (last) setCurrentUser(last);
      return;
    }

    lockScreen.hidden = false;
    mainContent.hidden = true;

    // If neither has password => first-time setup
    if (!hasNeerav && !hasAvigna) {
      showSetup();
      chosenIdentity = 'neerav';
      btnPickNeerav?.classList.add('active');
      btnPickAvigna?.classList.remove('active');
    } else {
      showUnlock();
      // Default to whichever has password; if both, unlock form still works for either by checking both
    }

    btnForgotPass?.addEventListener('click', () => {
      showSetup();
      lockError.hidden = true;
      if (btnBackToUnlock) btnBackToUnlock.hidden = false;
      if (!chosenIdentity) {
        chosenIdentity = 'neerav';
        btnPickNeerav?.classList.add('active');
        btnPickAvigna?.classList.remove('active');
      }
      if (lockNewPass) {
        lockNewPass.value = '';
        lockNewPass.focus();
      }
    });

    btnBackToUnlock?.addEventListener('click', () => {
      showUnlock();
      lockError.hidden = true;
      if (btnBackToUnlock) btnBackToUnlock.hidden = true;
      if (lockPassword) lockPassword.focus();
    });

    btnPickNeerav?.addEventListener('click', () => {
      chosenIdentity = 'neerav';
      btnPickNeerav.classList.add('active');
      btnPickAvigna.classList.remove('active');
    });

    btnPickAvigna?.addEventListener('click', () => {
      chosenIdentity = 'avigna';
      btnPickAvigna.classList.add('active');
      btnPickNeerav.classList.remove('active');
    });

    btnSetPass?.addEventListener('click', () => {
      const pass = lockNewPass ? lockNewPass.value.trim() : '';
      if (!chosenIdentity) chosenIdentity = 'neerav';
      if (!pass) {
        lockError.hidden = false;
        lockError.textContent = 'Enter a password to continue.';
        return;
      }
      setPassword(chosenIdentity, pass);
      sessionStorage.setItem('archive-unlocked', 'true');
      sessionStorage.setItem('last-author', chosenIdentity);
      doUnlock(chosenIdentity);
    });

    lockForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      lockError.hidden = true;
      lockError.textContent = 'Incorrect password. Try again.';
      const entered = lockPassword ? lockPassword.value.trim() : '';

      // Try both identities
      if (verifyPassword('neerav', entered)) {
        sessionStorage.setItem('archive-unlocked', 'true');
        sessionStorage.setItem('last-author', 'neerav');
        doUnlock('neerav');
      } else if (verifyPassword('avigna', entered)) {
        sessionStorage.setItem('archive-unlocked', 'true');
        sessionStorage.setItem('last-author', 'avigna');
        doUnlock('avigna');
      } else {
        lockError.hidden = false;
        if (lockScreenContent) lockScreenContent.classList.add('shake');
        if (lockPassword) lockPassword.value = '';
        if (lockPassword) lockPassword.focus();
        setTimeout(() => {
          if (lockScreenContent) lockScreenContent.classList.remove('shake');
        }, 400);
      }
    });
  }

  // ——— Lock Archive Button -> Change Password ———
  function initLockButton() {
    const lockBtn = $('#lockArchiveBtn');
    if (!lockBtn) return;

    lockBtn.title = 'Change Password';
    lockBtn.setAttribute('aria-label', 'Change your password');

    lockBtn.addEventListener('click', () => {
      const currentUser = getCurrentUser();
      const newPass = prompt('Enter new password for ' + getAuthorDisplayName(currentUser) + ':');
      if (newPass !== null && newPass.trim()) {
        setPassword(currentUser, newPass.trim());
        sessionStorage.removeItem('archive-unlocked');
        sessionStorage.removeItem('last-author');
        location.reload();
      }
    });
  }

  // ——— Guide & Special Features Page ———
  function initGuidePage() {
    // Category tabs filtering
    $$('.feature-category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.feature-category-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        const cat = btn.dataset.featureCat;
        $$('.feature-card').forEach(card => {
          if (cat === 'all' || card.dataset.category === cat) {
            card.hidden = false;
          } else {
            card.hidden = true;
          }
        });
      });
    });

    // Try Rain button
    $('#btnGuideTryRain')?.addEventListener('click', () => {
      window.AtmosphereEngine?.applyWebsiteMode?.('rain');
      window.AmbientAudioManager?.toggle(true);
      const popover = $('#ambientPopover');
      if (popover) popover.hidden = false;
    });

    // Try Forest button
    $('#btnGuideTryBreeze')?.addEventListener('click', () => {
      window.AtmosphereEngine?.applyWebsiteMode?.('forest');
      window.AmbientAudioManager?.toggle(true);
      const popover = $('#ambientPopover');
      if (popover) popover.hidden = false;
    });

    // Try Ocean Waves button
    $('#btnGuideTryWaves')?.addEventListener('click', () => {
      window.AtmosphereEngine?.applyWebsiteMode?.('ocean');
      window.AmbientAudioManager?.toggle(true);
      const popover = $('#ambientPopover');
      if (popover) popover.hidden = false;
    });

    // Open Write Canvas
    $('#btnGuideOpenWrite')?.addEventListener('click', () => {
      openModal();
    });

    // Open Write with Marginalia (take to step 3)
    $('#btnGuideOpenMarginaliaWrite')?.addEventListener('click', () => {
      openModal();
      showStep(3);
      $('#formMarginalia')?.focus();
    });

    // Try Zen Mode
    $('#btnGuideTryZen')?.addEventListener('click', () => {
      openModal();
      showStep(2);
      const zenOverlay = $('#zenOverlay');
      const zenTextarea = $('#zenTextarea');
      const formContent = $('#formContent');
      if (zenOverlay && zenTextarea && formContent) {
        zenTextarea.value = formContent.value || 'Write in peace...\n\nEvery line is preserved here in full-screen clarity.';
        zenOverlay.hidden = false;
        setTimeout(() => zenTextarea.focus(), 100);
      }
    });

    // Open draft modal
    $('#btnGuideOpenDraftModal')?.addEventListener('click', () => {
      openModal();
    });

    // Guide links with custom navigation targets
    document.addEventListener('click', (e) => {
      const readingLink = e.target.closest('[data-guide-reading]');
      if (readingLink) {
        e.preventDefault();
        navigateTo('reading', readingLink.dataset.guideReading);
        return;
      }

      const filterLink = e.target.closest('[data-guide-filter]');
      if (filterLink) {
        e.preventDefault();
        currentFilter = filterLink.dataset.guideFilter;
        navigateTo('archive');
        $$('.filter-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.filter === currentFilter);
          b.setAttribute('aria-selected', b.dataset.filter === currentFilter ? 'true' : 'false');
        });
        renderArchive();
      }
    });
  }

  // ——— Initialize Application ———
  async function init() {
    initLockScreen();
    initLockButton();
    initUserBadge();
    updateUserBadge();
    initProfileModal();
    updateBookmarksCount();
    initNav();
    initArchiveControls();
    initAdmin();
    initKeyboard();
    initReaderCustomizer();
    initPostcardModal();
    initZenMode();
    initDraftEngine();
    initGuidePage();
    setFooterYear();

    const adminTools = $('#adminTools');
    if (adminTools) adminTools.hidden = true;

    // Render immediately from base + local data so UI is instant
    renderFeatured();
    initQuoteOfDay();

    // Connect to Supabase Auth & Cloud Database
    try {
      await initSupabaseAuth();
      await loadSharedWorks();
      setupRealtimeListener();

      // Refresh active page with latest cloud works
      if (currentPage === 'home') renderFeatured();
      else if (currentPage === 'archive') renderArchive();
      else if (currentPage === 'timeline') renderTimeline();
      else if (currentPage === 'collections') renderCollections();
      else if (currentPage === 'desk') renderDesk();
    } catch (err) {
      console.warn('Cloud sync init notice:', err);
    }

    requestAnimationFrame(() => {
      observeReveals();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
