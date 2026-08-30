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
    'terrible judgement': 'avigna'
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
      badge.title = `Current Author: ${getAuthorDisplayName(user)} (Click to switch)`;
    }
  }

  function initUserBadge() {
    const badge = document.getElementById('navUserBadge');
    if (!badge) return;

    badge.addEventListener('click', () => {
      const current = getCurrentUser();
      const nextUser = current === 'neerav' ? 'avigna' : 'neerav';
      setCurrentUser(nextUser);

      // Update edit/delete buttons on reading view without destroying DOM or scroll position
      if (currentPage === 'reading' && currentReadingId) {
        updateReadingAuthorTools();
      }
    });

    badge.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        badge.click();
      }
    });
  }

  // ——— Data Management (Reconciles Code Base + Local Storage + Deletions) ———
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

  // ——— Cached writings (invalidated by any write through addWriting/updateWriting/deleteWriting/saveCustomWritings) ———
  let _writingsCache = null;

  function invalidateWritingsCache() {
    _writingsCache = null;
  }

  function getWritings() {
    if (_writingsCache) return _writingsCache;

    const baseWritings = (typeof WRITINGS !== 'undefined' && Array.isArray(WRITINGS)) ? WRITINGS : [];
    const deletedIds = getDeletedIds();

    // Migrate any truly custom items from legacy storage key if needed
    if (!localStorage.getItem(CUSTOM_STORAGE_KEY) && localStorage.getItem(STORAGE_KEY)) {
      try {
        const legacy = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (Array.isArray(legacy)) {
          const baseIds = new Set(baseWritings.map(w => w.id));
          const trulyCustom = legacy.filter(w => !baseIds.has(w.id));
          localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(trulyCustom));
        }
      } catch (e) {}
    }

    const customWritings = getCustomWritings();
    const map = new Map();

    // 1. Add base writings from data/writings.js (unless marked deleted)
    baseWritings.forEach(w => {
      if (!deletedIds.includes(w.id)) {
        map.set(w.id, { ...w });
      }
    });

    // 2. Overlay custom writings added or edited locally (unless marked deleted)
    customWritings.forEach(w => {
      if (!deletedIds.includes(w.id)) {
        map.set(w.id, { ...w });
      }
    });

    _writingsCache = Array.from(map.values());
    return _writingsCache;
  }

  function saveCustomWritings(writings) {
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(writings));
    // Also sync to legacy for compatibility
    localStorage.setItem(STORAGE_KEY, JSON.stringify(writings));
    invalidateWritingsCache();
  }

  // IMPORTANT SECURITY NOTE: A browser cannot safely hold a GitHub token.
  // The only safe way for '+ button → git push → visible everywhere' is a server/backend
  // (Netlify Function / Vercel Edge / GitHub Actions). Token in browser = stolen by anyone.
  // This function is left here for reference only; do NOT call with a real token in public HTML.
  function commitToGitHub(fileContent, token) {
    alert('SECURITY BLOCK: Do not enter your GitHub token in a public browser page. Use a server endpoint (e.g., Netlify Function) instead, or commit manually via git.');
  }

  function generateGitPatch(updatedContentString) {
    // Creates a downloadable file with the updated data/writings.js + git commands
    const commands = `# After saving, run these in your repo folder:
# git add data/writings.js
# git commit -m "Add new story via + button"
# git push origin main
# Then redeploy (GitHub Pages / Netlify) so everyone sees it.`;
    const blob = new Blob([updatedContentString + "\n\n" + commands], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "writings-update-patch.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert("Patch downloaded. Copy content to data/writings.js, then run git add/commit/push.");
  }

  function addWriting(writing) {
    const custom = getCustomWritings();
    custom.push(writing);
    saveCustomWritings(custom);

    // Save locally + generate manual patch + offer GitHub token publish
    try {
      const patchText = `/* Copy the following into data/writings.js after your existing WRITINGS array */\n/* Saved via + button at ${new Date().toISOString()} */\n// New writing: ${writing.title || 'untitled'} (id: ${writing.id || 'none'})\n// To make visible to everyone: paste above into WRITINGS = [ ... ]; then git commit/push.\n`;
      generateGitPatch(patchText);
    } catch (e) { /* silent fail */ }

    // Safe path only: download patch + instructions (token never enters browser source)
    try {
      const patchText = `/* Copy into data/writings.js after WRITINGS array */\n/* Saved via + button at ${new Date().toISOString()} */\n// Title: ${writing.title || 'untitled'} | ID: ${writing.id || 'none'}\n// To publish to everyone: paste into data/writings.js, then run:\n// git add data/writings.js && git commit -m "add story" && git push origin main\n`;
      generateGitPatch(patchText);
    } catch (e) { /* silent fail */ }

    // Remove from deletedIds if it was previously marked deleted
    const deletedIds = getDeletedIds().filter(id => id !== writing.id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(deletedIds));
    invalidateWritingsCache();

    return writing;
  }

  function updateWriting(id, updatedData) {
    const custom = getCustomWritings();
    const index = custom.findIndex(w => w.id === id);
    if (index !== -1) {
      custom[index] = { ...custom[index], ...updatedData };
      saveCustomWritings(custom);
      invalidateWritingsCache();
      return custom[index];
    } else {
      // It might be in base writings; copy to custom with updates
      const baseWriting = (typeof WRITINGS !== 'undefined' && Array.isArray(WRITINGS)) ? WRITINGS.find(w => w.id === id) : null;
      if (baseWriting) {
        const newCustom = { ...baseWriting, ...updatedData };
        custom.push(newCustom);
        saveCustomWritings(custom);
        return newCustom;
      }
    }
    return null;
  }

  function deleteWriting(id) {
    const writings = getWritings();
    const writing = writings.find(w => w.id === id);

    if (writing && !canUserEdit(writing.author)) {
      const authorDisplayName = getAuthorDisplayName(writing.author);
      alert(`🔒 Permission denied:\n\nOnly the author (${authorDisplayName}) can delete this piece.`);
      return false;
    }

    // 1. Mark in deleted list
    const deletedIds = getDeletedIds();
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem(DELETED_KEY, JSON.stringify(deletedIds));
    }

    // 2. Remove from custom local storage
    const custom = getCustomWritings().filter(w => w.id !== id);
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(custom));
    invalidateWritingsCache();

    // 3. Remove from legacy storage
    const legacy = (localStorage.getItem(STORAGE_KEY) ? JSON.parse(localStorage.getItem(STORAGE_KEY)) : []).filter(w => w.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
    invalidateWritingsCache();

    return true;
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
    } else {
      favs.push(id);
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return !isFav;
  }

  // ——— DOM Cache ———
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const nav = $('#nav');
  const navToggle = $('#navToggle');
  const navLinks = $('#navLinks');
  const themeToggle = $('#themeToggle');
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
  const particlesCanvas = $('#particles');

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

  // ——— Web Audio API Ambient Soundscapes ———
  let audioCtx = null;
  let ambientGainNode = null;
  let currentAmbientType = 'off';
  let ambientSourceNodes = [];
  let ambientInterval = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function stopAmbientSound() {
    ambientSourceNodes.forEach(node => {
      try { node.stop(); } catch (e) {}
      try { node.disconnect(); } catch (e) {}
    });
    ambientSourceNodes = [];
    if (ambientInterval) {
      clearInterval(ambientInterval);
      ambientInterval = null;
    }
    currentAmbientType = 'off';
    const dot = $('#ambientStatusDot');
    const toggleBtn = $('#ambientToggleBtn');
    if (toggleBtn) toggleBtn.classList.remove('playing');
    if (dot) dot.style.opacity = '0';
    $$('.ambient-opt').forEach(opt => opt.classList.toggle('active', opt.dataset.sound === 'off'));
  }

  function createNoiseBuffer(ctx, duration = 4, type = 'pink') {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else {
        // Brown noise
        b0 = (b0 + (0.02 * white)) / 1.02;
        data[i] = b0 * 3.5;
      }
    }
    return buffer;
  }

  function playAmbientSound(type) {
    const ctx = getAudioContext();
    if (!ctx) return;
    stopAmbientSound();

    if (type === 'off') return;

    if (!ambientGainNode) {
      ambientGainNode = ctx.createGain();
      const volInput = $('#ambientVolume');
      ambientGainNode.gain.setValueAtTime(volInput ? parseFloat(volInput.value) : 0.4, ctx.currentTime);
      ambientGainNode.connect(ctx.destination);
    }

    if (type === 'rain') {
      // Gentle rainfall soundscape
      const rainBuffer = createNoiseBuffer(ctx, 5, 'pink');
      const rainSource = ctx.createBufferSource();
      rainSource.buffer = rainBuffer;
      rainSource.loop = true;

      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.setValueAtTime(460, ctx.currentTime);
      rainFilter.Q.setValueAtTime(1.4, ctx.currentTime);

      rainSource.connect(rainFilter);
      rainFilter.connect(ambientGainNode);
      rainSource.start();
      ambientSourceNodes.push(rainSource);

    } else if (type === 'fire') {
      // Cozy fireplace soundscape
      const rumbleBuffer = createNoiseBuffer(ctx, 4, 'brown');
      const rumbleSource = ctx.createBufferSource();
      rumbleSource.buffer = rumbleBuffer;
      rumbleSource.loop = true;

      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(220, ctx.currentTime);

      rumbleSource.connect(rumbleFilter);
      rumbleFilter.connect(ambientGainNode);
      rumbleSource.start();
      ambientSourceNodes.push(rumbleSource);

      // Random snapping crackle impulses
      ambientInterval = setInterval(() => {
        if (Math.random() > 0.45 && audioCtx && audioCtx.state === 'running') {
          const crackleBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate);
          const crackleData = crackleBuffer.getChannelData(0);
          for (let j = 0; j < crackleData.length; j++) {
            crackleData[j] = (Math.random() * 2 - 1) * Math.exp(-j / (crackleData.length * 0.25));
          }
          const crackleSource = ctx.createBufferSource();
          crackleSource.buffer = crackleBuffer;

          const crackleFilter = ctx.createBiquadFilter();
          crackleFilter.type = 'bandpass';
          crackleFilter.frequency.setValueAtTime(1200 + Math.random() * 2400, ctx.currentTime);
          crackleFilter.Q.setValueAtTime(2.5, ctx.currentTime);

          const crackleGain = ctx.createGain();
          crackleGain.gain.setValueAtTime(0.3 + Math.random() * 0.4, ctx.currentTime);

          crackleSource.connect(crackleFilter);
          crackleFilter.connect(crackleGain);
          crackleGain.connect(ambientGainNode);
          crackleSource.start();
        }
      }, 160);

    } else if (type === 'waves') {
      // Rhythmic ocean waves / tidal swell
      const waveBuffer = createNoiseBuffer(ctx, 6, 'pink');
      const waveSource = ctx.createBufferSource();
      waveSource.buffer = waveBuffer;
      waveSource.loop = true;

      const waveFilter = ctx.createBiquadFilter();
      waveFilter.type = 'lowpass';
      waveFilter.frequency.setValueAtTime(360, ctx.currentTime);
      waveFilter.Q.setValueAtTime(1.8, ctx.currentTime);

      // LFO for filter cutoff oscillation
      const waveLfo = ctx.createOscillator();
      waveLfo.type = 'sine';
      waveLfo.frequency.setValueAtTime(0.11, ctx.currentTime); // ~9 second wave cycle

      const waveLfoGain = ctx.createGain();
      waveLfoGain.gain.setValueAtTime(240, ctx.currentTime);

      waveLfo.connect(waveLfoGain);
      waveLfoGain.connect(waveFilter.frequency);

      // Swell gain oscillation
      const waveGain = ctx.createGain();
      waveGain.gain.setValueAtTime(0.55, ctx.currentTime);

      const swellLfo = ctx.createOscillator();
      swellLfo.type = 'sine';
      swellLfo.frequency.setValueAtTime(0.11, ctx.currentTime);

      const swellGain = ctx.createGain();
      swellGain.gain.setValueAtTime(0.38, ctx.currentTime);

      swellLfo.connect(swellGain);
      swellGain.connect(waveGain.gain);

      waveSource.connect(waveFilter);
      waveFilter.connect(waveGain);
      waveGain.connect(ambientGainNode);

      waveSource.start();
      waveLfo.start();
      swellLfo.start();

      ambientSourceNodes.push(waveSource, waveLfo, swellLfo);

    } else if (type === 'breeze') {
      // Calming forest breeze / swaying treetops
      const breezeBuffer = createNoiseBuffer(ctx, 6, 'pink');
      const breezeSource = ctx.createBufferSource();
      breezeSource.buffer = breezeBuffer;
      breezeSource.loop = true;

      const breezeFilter1 = ctx.createBiquadFilter();
      breezeFilter1.type = 'bandpass';
      breezeFilter1.frequency.setValueAtTime(320, ctx.currentTime);
      breezeFilter1.Q.setValueAtTime(1.8, ctx.currentTime);

      const breezeFilter2 = ctx.createBiquadFilter();
      breezeFilter2.type = 'bandpass';
      breezeFilter2.frequency.setValueAtTime(680, ctx.currentTime);
      breezeFilter2.Q.setValueAtTime(2.2, ctx.currentTime);

      // Gentle LFO modulating wind sweep
      const breezeLfo1 = ctx.createOscillator();
      breezeLfo1.type = 'sine';
      breezeLfo1.frequency.setValueAtTime(0.08, ctx.currentTime);

      const breezeLfoGain1 = ctx.createGain();
      breezeLfoGain1.gain.setValueAtTime(140, ctx.currentTime);

      breezeLfo1.connect(breezeLfoGain1);
      breezeLfoGain1.connect(breezeFilter1.frequency);

      const breezeGainNode = ctx.createGain();
      breezeGainNode.gain.setValueAtTime(0.9, ctx.currentTime);

      breezeSource.connect(breezeFilter1);
      breezeFilter1.connect(breezeGainNode);

      breezeSource.connect(breezeFilter2);
      breezeFilter2.connect(breezeGainNode);

      breezeGainNode.connect(ambientGainNode);

      breezeSource.start();
      breezeLfo1.start();

      ambientSourceNodes.push(breezeSource, breezeLfo1);

    } else if (type === 'stream') {
      // Gentle mountain stream / flowing water
      const streamBuffer = createNoiseBuffer(ctx, 5, 'pink');
      const streamSource = ctx.createBufferSource();
      streamSource.buffer = streamBuffer;
      streamSource.loop = true;

      const streamFilter1 = ctx.createBiquadFilter();
      streamFilter1.type = 'bandpass';
      streamFilter1.frequency.setValueAtTime(480, ctx.currentTime);
      streamFilter1.Q.setValueAtTime(3.2, ctx.currentTime);

      const streamFilter2 = ctx.createBiquadFilter();
      streamFilter2.type = 'bandpass';
      streamFilter2.frequency.setValueAtTime(1100, ctx.currentTime);
      streamFilter2.Q.setValueAtTime(3.6, ctx.currentTime);

      // Micro ripple modulation
      const rippleLfo = ctx.createOscillator();
      rippleLfo.type = 'sine';
      rippleLfo.frequency.setValueAtTime(1.4, ctx.currentTime);

      const rippleGain = ctx.createGain();
      rippleGain.gain.setValueAtTime(60, ctx.currentTime);

      rippleLfo.connect(rippleGain);
      rippleGain.connect(streamFilter2.frequency);

      const streamGain = ctx.createGain();
      streamGain.gain.setValueAtTime(0.85, ctx.currentTime);

      streamSource.connect(streamFilter1);
      streamFilter1.connect(streamGain);

      streamSource.connect(streamFilter2);
      streamFilter2.connect(streamGain);

      streamGain.connect(ambientGainNode);

      streamSource.start();
      rippleLfo.start();

      ambientSourceNodes.push(streamSource, rippleLfo);
    }

    currentAmbientType = type;
    const toggleBtn = $('#ambientToggleBtn');
    const dot = $('#ambientStatusDot');
    if (toggleBtn) toggleBtn.classList.add('playing');
    if (dot) dot.style.opacity = '1';
    $$('.ambient-opt').forEach(opt => opt.classList.toggle('active', opt.dataset.sound === type));
  }

  function initAmbientSound() {
    // Skip ambient sound init on mobile to conserve battery/CPU
    if (window.innerWidth <= 768) return;

    const toggleBtn = $('#ambientToggleBtn');
    const popover = $('#ambientPopover');
    const volumeSlider = $('#ambientVolume');
    const volumeLabel = $('#ambientVolLabel');

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

    $$('.ambient-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const sound = btn.dataset.sound;
        playAmbientSound(sound);
      });
    });

    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (ambientGainNode && audioCtx) {
          ambientGainNode.gain.setValueAtTime(val, audioCtx.currentTime);
        }
        if (volumeLabel) {
          volumeLabel.textContent = Math.round(val * 100) + '%';
        }
      });
    }
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

  // ——— Particles ———
  function initParticles() {
    if (!particlesCanvas) return;

    // Skip canvas animation on mobile screens or when reduced motion is preferred to conserve CPU/battery
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || window.innerWidth <= 768) {
      particlesCanvas.style.display = 'none';
      return;
    }

    const ctx = particlesCanvas.getContext('2d');
    if (!ctx) return;
    let particles = [];
    const count = Math.min(30, Math.floor(window.innerWidth / 40));
    let animationFrameId = null;
    let isPaused = false;

    function resize() {
      if (window.innerWidth <= 768) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        particlesCanvas.style.display = 'none';
        return;
      }
      particlesCanvas.style.display = 'block';
      particlesCanvas.width = window.innerWidth;
      particlesCanvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', debounce(resize, 200), { passive: true });

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * particlesCanvas.width,
        y: Math.random() * particlesCanvas.height,
        r: Math.random() * 1.5 + 0.3,
        dx: (Math.random() - 0.5) * 0.2,
        dy: (Math.random() - 0.5) * 0.15,
        opacity: Math.random() * 0.3 + 0.05
      });
    }

    function draw() {
      if (isPaused) return;
      ctx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
      const isDark = document.documentElement.dataset.theme === 'dark';
      const color = isDark ? '232, 226, 214' : '44, 44, 44';

      for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = particlesCanvas.width;
        if (p.x > particlesCanvas.width) p.x = 0;
        if (p.y < 0) p.y = particlesCanvas.height;
        if (p.y > particlesCanvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
        ctx.fill();
      }
      animationFrameId = requestAnimationFrame(draw);
    }
    draw();

    // Pause particle animation loop when tab is backgrounded
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isPaused = true;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      } else if (isPaused && window.innerWidth > 768) {
        isPaused = false;
        draw();
      }
    });
  }

  // ——— Theme ———
  function initTheme() {
    const saved = localStorage.getItem('archive-theme');
    if (saved) {
      document.documentElement.dataset.theme = saved;
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.dataset.theme = 'dark';
    }
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme;
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('archive-theme', next);
    });
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

  function navigateTo(page, data) {
    $$('.page').forEach(p => p.classList.remove('active'));

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

    currentPage = page;
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
    const bookmarkBtnHtml = `
      <button class="card-bookmark-btn ${isFav ? 'favorited' : ''}" data-favorite-id="${writing.id}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}" aria-label="Favorite">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </button>
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

    // Type filter / Favorites filter
    if (currentFilter === 'favorites') {
      const favs = getFavorites();
      results = results.filter(w => favs.includes(w.id));
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

    const isPoem = writing.type === 'poem';
    const sortedWritings = allWritings.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const currentIndex = sortedWritings.findIndex(w => w.id === writingId);
    const prevWork = currentIndex < sortedWritings.length - 1 ? sortedWritings[currentIndex + 1] : null;
    const nextWork = currentIndex > 0 ? sortedWritings[currentIndex - 1] : null;

    // Format content
    let bodyHtml;
    if (isPoem) {
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
    const sealSignature = isAvigna(writing.author)
      ? 'Written with heart by Avigna'
      : 'Written with care by Neerav';
    const sealSubtitle = isAvigna(writing.author)
      ? 'The Muse · The Archive'
      : 'The Archivist · The Archive';

    const authorSealHtml = `
      <div class="author-seal-wrapper">
        <div class="wax-seal ${sealClass}">
          <span class="wax-emblem">${sealEmblem}</span>
        </div>
        <span class="author-seal-signature">${sealSignature}</span>
        <span class="author-seal-subtitle">${sealSubtitle}</span>
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

      ${marginaliaHtml}
      ${authorSealHtml}
      ${responsesHtml}

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
      formContent.focus();
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

    writingForm.addEventListener('submit', (e) => {
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

      if (isEditing) {
        updateWriting(editingIdInput.value, writingData);
      } else {
        addWriting(writingData);
        localStorage.removeItem(DRAFT_KEY);
      }

      closeModal();

      if (currentPage === 'reading' && currentReadingId) {
        renderReading(currentReadingId);
      } else if (currentPage === 'archive') {
        renderArchive();
      } else if (currentPage === 'home') {
        renderFeatured();
      } else {
        navigateTo(currentPage);
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
    $('#btnDelete')?.addEventListener('click', () => {
      if (!currentReadingId) return;
      if (confirm('Are you sure you want to delete this writing? This cannot be undone.')) {
        deleteWriting(currentReadingId);
        navigateTo('archive');
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
        if (!adminModal.hidden) {
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

  // ——— Password Lock Screen ———
  function initLockScreen() {
    const lockScreen = $('#lockScreen');
    const mainContent = $('#mainContent');
    const lockForm = $('#lockForm');
    const lockPassword = $('#lockPassword');
    const lockError = $('#lockError');
    const lockScreenContent = lockScreen.querySelector('.lock-screen-content');

    const CORRECT_PASSWORDS = ['terrible judgement', 'friendship'];

    if (sessionStorage.getItem('archive-unlocked') === 'true') {
      lockScreen.hidden = true;
      mainContent.hidden = false;
      return;
    }

    lockScreen.hidden = false;
    mainContent.hidden = true;

    lockForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPassword = lockPassword.value.trim().toLowerCase();

      if (CORRECT_PASSWORDS.includes(enteredPassword)) {
        const authorUser = PASSWORD_USERS[enteredPassword] || 'neerav';
        setCurrentUser(authorUser);
        sessionStorage.setItem('archive-unlocked', 'true');
        lockError.hidden = true;

        lockScreen.style.opacity = '0';
        setTimeout(() => {
          lockScreen.hidden = true;
          mainContent.hidden = false;
          lockScreen.style.opacity = '1';
        }, 500);
      } else {
        lockError.hidden = false;
        lockScreenContent.classList.add('shake');
        lockPassword.value = '';
        lockPassword.focus();

        setTimeout(() => {
          lockScreenContent.classList.remove('shake');
        }, 400);
      }
    });
  }

  // ——— Lock Archive Button ———
  function initLockButton() {
    const lockBtn = $('#lockArchiveBtn');
    if (!lockBtn) return;

    lockBtn.addEventListener('click', () => {
      if (confirm('Lock the archive? You will need to re-enter the password.')) {
        sessionStorage.removeItem('archive-unlocked');
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
      playAmbientSound('rain');
      const popover = $('#ambientPopover');
      if (popover) popover.hidden = false;
    });

    // Try Fire button
    $('#btnGuideTryFire')?.addEventListener('click', () => {
      playAmbientSound('fire');
      const popover = $('#ambientPopover');
      if (popover) popover.hidden = false;
    });

    // Try Ocean Waves button
    $('#btnGuideTryWaves')?.addEventListener('click', () => {
      playAmbientSound('waves');
      const popover = $('#ambientPopover');
      if (popover) popover.hidden = false;
    });

    // Try Forest Breeze button
    $('#btnGuideTryBreeze')?.addEventListener('click', () => {
      playAmbientSound('breeze');
      const popover = $('#ambientPopover');
      if (popover) popover.hidden = false;
    });

    // Try Gentle Stream button
    $('#btnGuideTryStream')?.addEventListener('click', () => {
      playAmbientSound('stream');
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
  function init() {
    initLockScreen();
    initLockButton();
    initUserBadge();
    updateUserBadge();
    initTheme();
    initNav();
    initArchiveControls();
    initAdmin();
    initKeyboard();
    initParticles();
    initAmbientSound();
    initReaderCustomizer();
    initPostcardModal();
    initZenMode();
    initDraftEngine();
    initGuidePage();
    setFooterYear();

    const adminTools = $('#adminTools');
    if (adminTools) adminTools.hidden = true;

    renderFeatured();
    initQuoteOfDay();

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
