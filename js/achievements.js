const ACHIEVEMENT_STORE_KEY = 'archive-achievements-v1';
const ACHIEVEMENTS = [
  { id: 'first-visit', name: 'First Visit', desc: 'Enter The Archive.', easy: true, unlocks: [] },
  { id: 'first-read', name: 'First Read', desc: 'Read one writing.', easy: true, unlocks: ['theme-paper'] },
  { id: 'read-three', name: 'Three Tales', desc: 'Read three writings.', easy: true, unlocks: [] },
  { id: 'favorite-one', name: 'First Favorite', desc: 'Favorite a writing.', easy: true, unlocks: ['theme-midnight'] },
  { id: 'write-draft', name: 'Draft Maker', desc: 'Save a draft.', easy: true, unlocks: [] },
  { id: 'zen-time', name: 'Zen Time', desc: 'Enter Zen mode.', easy: true, unlocks: ['theme-minimalist'] },
  { id: 'collection-reader', name: 'Collection Reader', desc: 'Visit a collection.', medium: true, unlocks: [] },
  { id: 'comment-left', name: 'First Voice', desc: 'Leave a comment.', medium: true, unlocks: [] },
  { id: 'ten-reads', name: 'Ten Reads', desc: 'Read ten writings.', medium: true, unlocks: ['theme-midnight'] },
  { id: 'favorite-five', name: 'Five Favorites', desc: 'Favorite five writings.', medium: true, unlocks: [] },
  { id: 'collaborative-read', name: 'Collaboration', desc: 'Read a collaborative writing.', medium: true, unlocks: [] },
  { id: 'tag-explorer', name: 'Tag Explorer', desc: 'Browse by tag.', medium: true, unlocks: [] },
  { id: 'timeline-visitor', name: 'Time Traveler', desc: 'Visit the timeline.', hard: true, unlocks: [] },
  { id: 'all-poems', name: 'Archivist', desc: 'Read every writing.', hard: true, unlocks: ['theme-paper','theme-midnight','theme-minimalist'] },
  { id: 'ten-favorites', name: 'Curator', desc: 'Favorite ten writings.', hard: true, unlocks: [] }
];
function updateAchievementUI() {
  const container = document.getElementById('achievementList');
  if (!container) return;
  const a = getAchievements();
  container.innerHTML = ACHIEVEMENTS.map(ac => {
    const unlocked = !!a[ac.id]?.unlocked;
    const progress = unlocked ? 'Unlocked' : (ac.easy ? 'Easy' : ac.medium ? 'Medium' : 'Hard');
    return `<div class="achievement-card ${unlocked ? 'unlocked' : ''}" data-id="${ac.id}">
      <span class="achievement-icon">${unlocked ? '✦' : '◈'}</span>
      <h4>${ac.name}</h4><p>${ac.desc}</p>
      <div class="achievement-progress"><span>${progress}</span></div>
    </div>`;
  }).join('');
}
function showAchievementPopup(id) {
  const ac = ACHIEVEMENTS.find(a => a.id === id);
  if (!ac) return;
  const el = document.getElementById('achievementPopup');
  if (!el) return;
  el.querySelector('.popup-title').textContent = ac.name;
  el.querySelector('.popup-desc').textContent = ac.desc;
  el.hidden = false;
  el.classList.add('show');
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.hidden = true, 300); }, 2500);
}
function getAchievements() { try { return JSON.parse(localStorage.getItem(ACHIEVEMENT_STORE_KEY)) || {}; } catch { return {}; } }
function saveAchievements(data) { localStorage.setItem(ACHIEVEMENT_STORE_KEY, JSON.stringify(data)); }
function isValidWriting(text) { if (!text || typeof text !== 'string') return false; const trimmed = text.trim(); const lines = trimmed.split(/\r?\n/).filter(l => l.trim().length > 0); return trimmed.length >= 30 && lines.length >= 2; }
function awardAchievement(id) { const a = getAchievements(); if (!a[id]) { a[id] = { unlocked: true, date: new Date().toISOString() }; saveAchievements(a); updateAchievementUI(); showAchievementPopup(id); return true; } return false; }
function isAchievementUnlocked(id) { return !!(getAchievements()[id]?.unlocked); }
function getUnlockedThemes() { const u = new Set(['light','dark']); ACHIEVEMENTS.forEach(a => { if (a.unlocks && isAchievementUnlocked(a.id)) a.unlocks.forEach(t => u.add(t)); }); return Array.from(u); }
