/* ============================================================
   THE ARCHIVE — Application Logic
   ============================================================ */

(function () {
  'use strict';

  // ——— State ———
  let currentPage = 'home';
  let currentFilter = 'all';
  let currentAuthorFilter = 'all';
  let currentSort = 'newest';
  let currentSearch = '';
  let activeTagFilters = [];
  let lastScrollY = 0;
  let currentReadingId = null; // Track currently reading writing

  // ——— Data Management (localStorage) ———
  const STORAGE_KEY = 'archive-writings';

  function getWritings() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored writings:', e);
      }
    }
    // Fallback to initial data from writings.js
    return typeof WRITINGS !== 'undefined' ? WRITINGS : [];
  }

  function saveWritings(writings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(writings));
  }

  function addWriting(writing) {
    const writings = getWritings();
    writings.push(writing);
    saveWritings(writings);
    return writing;
  }

  function updateWriting(id, updatedData) {
    const writings = getWritings();
    const index = writings.findIndex(w => w.id === id);
    if (index !== -1) {
      writings[index] = { ...writings[index], ...updatedData };
      saveWritings(writings);
      return writings[index];
    }
    return null;
  }

  function deleteWriting(id) {
    const writings = getWritings();
    const filtered = writings.filter(w => w.id !== id);
    saveWritings(filtered);
    return filtered.length < writings.length;
  }

  function exportData() {
    const writings = getWritings();
    const dataStr = JSON.stringify(writings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `writings-backup-${new Date().toISOString().split('T')[0]}.json`;
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
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    }).toUpperCase();
  }

  function formatDateLong(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ——— Particles ———
  function initParticles() {
    const ctx = particlesCanvas.getContext('2d');
    let particles = [];
    const count = Math.min(40, Math.floor(window.innerWidth / 30));

    function resize() {
      particlesCanvas.width = window.innerWidth;
      particlesCanvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

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
      requestAnimationFrame(draw);
    }
    draw();
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
    // Scroll behavior — show/hide nav
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 50);
      if (y > lastScrollY && y > 200) {
        nav.classList.add('hidden');
      } else {
        nav.classList.remove('hidden');
      }
      lastScrollY = y;

      // Reading progress
      if (currentPage === 'reading') {
        const article = readingContent;
        const rect = article.getBoundingClientRect();
        const total = article.scrollHeight - window.innerHeight;
        const progress = Math.min(100, Math.max(0,
          ((window.scrollY - article.offsetTop) / total) * 100
        ));
        readingProgressBar.style.width = progress + '%';
      }
    }, { passive: true });

    // Mobile toggle
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded',
        navToggle.classList.contains('open'));
    });

    // Nav links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-nav]');
      if (!link) return;
      e.preventDefault();
      const page = link.dataset.nav;
      navigateTo(page);
      // Close mobile menu
      navToggle.classList.remove('open');
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  }

  function navigateTo(page, data) {
    // Remove active from all pages
    $$('.page').forEach(p => p.classList.remove('active'));

    // Update nav
    $$('.nav-link').forEach(l => {
      l.classList.toggle('active', l.dataset.nav === page);
    });

    // Show/hide reading progress
    readingProgress.classList.toggle('visible', page === 'reading');

    // Show/hide admin tools
    const adminTools = $('#adminTools');
    if (adminTools) {
      adminTools.hidden = page !== 'reading';
    }

    currentPage = page;
    window.scrollTo({ top: 0, behavior: 'instant' });

    switch (page) {
      case 'home':
        $(`#page-home`).classList.add('active');
        break;
      case 'archive':
        $(`#page-archive`).classList.add('active');
        renderArchive();
        break;
      case 'reading':
        $(`#page-reading`).classList.add('active');
        renderReading(data);
        break;
      case 'collections':
        $(`#page-collections`).classList.add('active');
        renderCollections();
        break;
      case 'collection-detail':
        $(`#page-collection-detail`).classList.add('active');
        renderCollectionDetail(data);
        break;
      case 'tag':
        $(`#page-tag`).classList.add('active');
        renderTagPage(data);
        break;
      case 'timeline':
        $(`#page-timeline`).classList.add('active');
        renderTimeline();
        break;
      case 'desk':
        $(`#page-desk`).classList.add('active');
        renderDesk();
        break;
      case 'about':
        $(`#page-about`).classList.add('active');
        break;
    }

    // Trigger reveal animations after a tick
    requestAnimationFrame(() => {
      requestAnimationFrame(() => observeReveals());
    });
  }

  // ——— Writing Cards ———
  function createWritingCard(writing, delay = 0) {
    const card = document.createElement('article');
    card.className = 'writing-card visible'; // Add 'visible' immediately
    card.style.transitionDelay = delay + 'ms';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Read: ${writing.title}`);

    const tagsHtml = writing.tags.map(t =>
      `<span class="card-tag" data-tag="${escapeHTML(t)}" title="Filter by #${escapeHTML(t)}">#${escapeHTML(t)}</span>`
    ).join(' ');

    const authorName = (writing.author === 'friend') ? 'Friend' : 'Neerav';
    const authorBadge = `<span class="card-author">By ${authorName}</span>`;

    card.innerHTML = `
      <div class="card-meta">
        <span class="card-type">${escapeHTML(writing.type)}</span>
        <span class="card-dot" aria-hidden="true">·</span>
        <span class="card-date">${formatDate(writing.date)}</span>
        <span class="card-dot" aria-hidden="true">·</span>
        ${authorBadge}
      </div>
      <h3 class="card-title">${escapeHTML(writing.title)}</h3>
      <p class="card-excerpt">${escapeHTML(writing.excerpt)}</p>
      <div class="card-footer">
        <div class="card-tags">${tagsHtml}</div>
        <span class="card-reading-time">${escapeHTML(writing.readingTime)}</span>
      </div>
    `;

    // Click to open
    card.addEventListener('click', (e) => {
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
      .slice(0, 5);

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

    // Type filter
    if (currentFilter !== 'all') {
      results = results.filter(w => w.type === currentFilter);
    }

    // Search
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      results = results.filter(w =>
        w.title.toLowerCase().includes(q) ||
        w.excerpt.toLowerCase().includes(q) ||
        w.content.toLowerCase().includes(q) ||
        w.tags.some(t => t.includes(q))
      );
    }

    // Tag filters
    if (activeTagFilters.length > 0) {
      results = results.filter(w =>
        activeTagFilters.every(tag => w.tags.includes(tag))
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
        archiveGrid.appendChild(createWritingCard(w, i * 60));
      });
    }

    // Stats at bottom
    archiveStats.innerHTML = `Showing ${filtered.length} of ${getWritings().length} works`;

    // Active tag pills
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
    // Author filter buttons
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

    // Type filter buttons
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

    // Search
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.trim();
      renderArchive();
    });

    // Sort
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderArchive();
    });

    // Clear filters
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
  function renderReading(writingId) {
    currentReadingId = writingId;
    const writing = getWritings().find(w => w.id === writingId);
    if (!writing) {
      navigateTo('archive');
      return;
    }

    // Show admin tools on reading page
    const adminTools = $('#adminTools');
    if (adminTools) adminTools.hidden = false;

    const isPoem = writing.type === 'poem';
    const sortedWritings = [...getWritings()].sort((a, b) => new Date(b.date) - new Date(a.date));
    const currentIndex = sortedWritings.findIndex(w => w.id === writingId);
    const prevWork = currentIndex < sortedWritings.length - 1 ? sortedWritings[currentIndex + 1] : null;
    const nextWork = currentIndex > 0 ? sortedWritings[currentIndex - 1] : null;

    // Format content
    let bodyHtml;
    if (isPoem) {
      const stanzas = writing.content.trim().split(/\n\n+/);
      bodyHtml = stanzas.map(s =>
        `<div class="poem-stanza">${escapeHTML(s)}</div>`
      ).join('');
    } else {
      const paragraphs = writing.content.trim().split(/\n\n+/);
      bodyHtml = paragraphs.map(p =>
        `<p>${escapeHTML(p)}</p>`
      ).join('');
    }

    // Tags
    const tagsHtml = writing.tags.map(t =>
      `<span class="reading-tag" data-tag="${escapeHTML(t)}">#${escapeHTML(t)}</span>`
    ).join('');

    // Related works (same tags, different writing)
    const related = getWritings()
      .filter(w => w.id !== writing.id && w.tags.some(t => writing.tags.includes(t)))
      .sort(() => Math.random() - 0.5)
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

    const authorName = (writing.author === 'friend') ? 'Friend' : 'Neerav';

    readingContent.innerHTML = `
      <div class="reading-header reveal-up">
        <span class="reading-type">${escapeHTML(writing.type)}</span>
        <span class="reading-date">${formatDateLong(writing.date)} · Written by ${escapeHTML(authorName)}</span>
        <h1 class="reading-title">${escapeHTML(writing.title)}</h1>
        <p class="reading-excerpt">${escapeHTML(writing.excerpt)}</p>
      </div>

      <div class="reading-divider" aria-hidden="true">
        <span>✦</span>
      </div>

      <div class="reading-body ${isPoem ? 'reading-body--poem' : ''} reveal-up">
        ${bodyHtml}
      </div>

      <div class="reading-footer">
        <div class="reading-tags">${tagsHtml}</div>
        ${navHtml}
        <div class="reading-related">
          <h2 class="reading-related-title">More from the Archive</h2>
          <div class="reading-related-grid">${relatedHtml}</div>
        </div>
        <div class="reading-back">
          <a href="#" class="link-subtle" data-nav="archive">
            ← Back to the Archive
          </a>
        </div>
      </div>
    `;

    // Event listeners for reading page elements
    readingContent.querySelectorAll('.reading-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        navigateTo('tag', tag.dataset.tag);
      });
    });

    readingContent.querySelectorAll('.reading-nav-item').forEach(item => {
      const handler = () => navigateTo('reading', item.dataset.writingId);
      item.addEventListener('click', handler);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
      });
    });

    // Re-attach card clicks in related section
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

    // Reset reading progress
    readingProgressBar.style.width = '0%';
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
      .filter(w => w.tags.includes(tag))
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

    // Group by year
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
          <span class="timeline-entry-type">${escapeHTML(w.type)}</span>
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

  // ——— Writer's Desk ———
  function renderDesk() {
    const writings = getWritings();
    const totalWorks = writings.length;
    const totalWords = writings.reduce((sum, w) => sum + countWords(w.content), 0);
    const poems = writings.filter(w => w.type === 'poem').length;
    const stories = writings.filter(w => w.type === 'story').length;
    const articles = writings.filter(w => w.type === 'article').length;
    const essays = writings.filter(w => w.type === 'essay').length;
    const notes = writings.filter(w => w.type === 'note').length;

    // Unique tags
    const allTags = new Set();
    writings.forEach(w => w.tags.forEach(t => allTags.add(t)));

    const stats = [
      { number: totalWorks, label: 'works archived' },
      { number: totalWords.toLocaleString(), label: 'words written' },
      { number: allTags.size, label: 'unique tags' },
      { number: COLLECTIONS.length, label: 'collections' }
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

    const neeravWorks = writings.filter(w => (w.author || 'neerav') === 'neerav').length;
    const friendWorks = writings.filter(w => w.author === 'friend').length;

    const breakdown = [
      { count: neeravWorks, label: 'By Neerav' },
      { count: friendWorks, label: 'By Friend' },
      { count: poems, label: 'Poems' },
      { count: stories, label: 'Stories' },
      { count: articles, label: 'Articles' },
      { count: essays, label: 'Essays' },
      { count: notes, label: 'Notes' }
    ].filter(b => b.count > 0);

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

    $$('.reveal-up, .reveal-text, .writing-card, .collection-card, .timeline-entry, .desk-stat').forEach(el => {
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
  const formReadingTime = $('#formReadingTime');
  const formCollection = $('#formCollection');
  const formFeatured = $('#formFeatured');

  function openModal(writing = null) {
    const lastAuthor = localStorage.getItem('last-author') || 'neerav';
    if (writing) {
      modalTitle.textContent = 'Edit Writing';
      editingIdInput.value = writing.id;
      formTitle.value = writing.title;
      formAuthor.value = writing.author || 'neerav';
      formType.value = writing.type;
      formDate.value = writing.date;
      formExcerpt.value = writing.excerpt;
      formContent.value = writing.content;
      formTags.value = writing.tags.join(', ');
      formReadingTime.value = writing.readingTime || '2 min read';
      formCollection.value = writing.collection || '';
      formFeatured.checked = writing.featured || false;
    } else {
      modalTitle.textContent = 'Add New Writing';
      writingForm.reset();
      editingIdInput.value = '';
      formAuthor.value = lastAuthor;
      formDate.value = new Date().toISOString().split('T')[0];
      formReadingTime.value = '2 min read';
      formFeatured.checked = false;
    }
    adminModal.hidden = false;
  }

  function closeModal() {
    adminModal.hidden = true;
  }

  function initAdmin() {
    // Add button
    $('#btnAddWriting').addEventListener('click', () => {
      openModal();
    });

    // Close button & overlay
    $('#modalClose').addEventListener('click', closeModal);
    $('#modalOverlay').addEventListener('click', closeModal);
    $('#btnCancel').addEventListener('click', closeModal);

    // Form submit
    writingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const isEditing = Boolean(editingIdInput.value);
      const title = formTitle.value.trim();
      const author = formAuthor.value || 'neerav';
      localStorage.setItem('last-author', author); // Remember for next time
      const type = formType.value;
      const date = formDate.value;
      const excerpt = formExcerpt.value.trim();
      const content = formContent.value;
      const tags = formTags.value
        .split(',')
        .map(t => slugify(t.trim()))
        .filter(Boolean);
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
        readingTime,
        featured,
        collection
      };

      if (isEditing) {
        updateWriting(editingIdInput.value, writingData);
      } else {
        addWriting(writingData);
      }

      closeModal();

      // Refresh current page view
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

    // Share button on reading page
    $('#btnShare').addEventListener('click', () => {
      if (!currentReadingId) return;
      const writing = getWritings().find(w => w.id === currentReadingId);
      if (!writing) return;

      // Generate JavaScript code snippet for the writing
      const snippet = `  {
    id: '${writing.id}',
    title: '${writing.title.replace(/'/g, "\\'")}',
    type: '${writing.type}',
    date: '${writing.date}',
    author: '${writing.author || 'neerav'}',
    excerpt: '${writing.excerpt.replace(/'/g, "\\'")}',
    content: \`${writing.content.replace(/`/g, '\\`')}\`,
    tags: [${writing.tags.map(t => `'${t}'`).join(', ')}],
    readingTime: '${writing.readingTime}',
    featured: ${writing.featured || false},
    collection: ${writing.collection ? `'${writing.collection}'` : 'null'}
  }`;

      // Copy to clipboard
      navigator.clipboard.writeText(snippet).then(() => {
        alert('✨ Code snippet copied!\n\nYou can now:\n1. Paste it into data/writings.js on GitHub\n2. Or share it via WhatsApp/Email');
      }).catch(() => {
        // Fallback: show in a prompt for manual copy
        prompt('Copy this code snippet:', snippet);
      });
    });

    // Edit button on reading page
    $('#btnEdit').addEventListener('click', () => {
      if (!currentReadingId) return;
      const writing = getWritings().find(w => w.id === currentReadingId);
      if (writing) {
        openModal(writing);
      }
    });

    // Delete button on reading page
    $('#btnDelete').addEventListener('click', () => {
      if (!currentReadingId) return;
      if (confirm('Are you sure you want to delete this writing? This cannot be undone.')) {
        deleteWriting(currentReadingId);
        navigateTo('archive');
      }
    });

    // Export/Import
    const btnExport = $('#btnExport');
    const btnImport = $('#btnImport');
    const importFile = $('#importFile');

    if (btnExport) btnExport.addEventListener('click', exportData);
    if (btnImport) btnImport.addEventListener('click', () => importFile.click());
    if (importFile) {
      importFile.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          importData(e.target.files[0]);
        }
      });
    }

    // Auto-update hint based on type
    formType.addEventListener('change', (e) => {
      const hint = $('#contentHint');
      if (e.target.value === 'poem') {
        hint.textContent = 'Line breaks will be preserved for poems';
      } else {
        hint.textContent = 'Use double line breaks for paragraph breaks';
      }
    });
  }

  // ——— Keyboard Navigation ———
  function initKeyboard() {
    document.addEventListener('keydown', (e) => {
      // ESC closes modal or mobile menu
      if (e.key === 'Escape') {
        if (!adminModal.hidden) {
          closeModal();
        } else {
          navToggle.classList.remove('open');
          navLinks.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  // ——— Initialize ———
  function init() {
    initTheme();
    initNav();
    initArchiveControls();
    initAdmin();
    initKeyboard();
    initParticles();
    setFooterYear();

    // Hide admin tools on initial load
    const adminTools = $('#adminTools');
    if (adminTools) {
      adminTools.hidden = true;
    }

    // Render home page content
    renderFeatured();

    // Initial reveal
    requestAnimationFrame(() => {
      observeReveals();
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
