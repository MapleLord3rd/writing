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
  { id: 'secret-archive', name: '???', desc: 'Some stories are found. Others are discovered.', category: 'secret', rarity: 'secret', hidden: true, unlocks: [] },
  { id: 'all-poems', name: 'Archivist', desc: 'Read every writing.', category: 'milestones', rarity: 'epic', unlocks: ['theme-paper','theme-midnight','theme-minimalist'] },
  { id: 'ten-favorites', name: 'Curator', desc: 'Favorite ten writings.', hard: true, unlocks: [] }
];
  const stats = getAchievementStats();
  switch (ac.requirementType) {
    case 'WORK_COUNT': return def("worksWritten",0);
    case 'WRITE_DAYS': return def("streakDays",0);
    case 'READ_COUNT': return def("readCount",0);
    case 'COMMENT_COUNT': return def("commentCount",0);
    default: { if(ac.metric==="works"||ac.metric==="writes") return def("worksWritten",0); if(ac.metric==="faves"||ac.metric==="favorites") return def("favoriteCount",0); if(ac.metric==="reads") return def("readCount",0); return 0; }
  }
}
function getMetricsValue(metric, stats) {
  const m = (stat, def) => (stats && typeof stats[stat] !== 'undefined') ? stats[stat] : def;
  switch (metric) { case 'works': return m('worksWritten'); case 'faves': return m('favoriteCount'); case 'reads': return m('readCount'); default: return 0; }
}
function getAchievementStats() {
  try { return JSON.parse(localStorage.getItem('archive-stats-v1')) || {}; } catch { return {}; }
}
function updateAchievementUI() {
  const container = document.getElementById('achievementList');
  if (!container) return;
  const a = getAchievements();
  const stats = getAchievementStats();
  container.innerHTML = ACHIEVEMENTS.map(ac => {
    const unlocked = !!a[ac.id]?.unlocked;
    const rarity = ac.rarity || (ac.easy ? 'common' : ac.medium ? 'uncommon' : 'rare');
    const category = ac.category || (ac.easy ? 'writing' : 'exploration');
    const progress = unlocked ? 1 : Math.min(1, ((getAchievementProgressValue(ac) || 0) / (ac.target || 1)));
    const pct = Math.round(progress * 100);
    const target = ac.target || 5; const current = Math.min(getAchievementProgressValue(ac) || 0, target); const acTarget = target;
    const name = (ac.hidden && !unlocked) ? '???' : ac.name;
    return `<div style="display:block!important;visibility:visible!important;opacity:1!important;border:2px solid #FFE066!important;background:#4a3060!important;padding:14px!important;margin:10px!important;border-radius:12px!important;color:#FAF5FF!important;font-family:sans-serif!important;min-height:120px!important;" class="achievement-card ${unlocked ? 'unlocked' : ''} rarity-${rarity}" data-id="${ac.id}" aria-label="${name}" role="button" tabindex="0" style="display:block!important;background:linear-gradient(135deg,#1e1450,#3d2879)!important;border:2px solid #D4B87A!important;border-radius:16px!important;padding:18px 16px!important;margin:10px!important;font-family:var(--font-sans),sans-serif!important;color:#FAF5FF!important;min-height:140px!important;overflow:hidden!important;">
      <div class="achievement-icon">${unlocked ? '✦' : ac.hidden ? '❓' : '◈'}</div>
      <h4 class="achievement-name">${name}</h4>
      <p class="achievement-desc">${(ac.hidden && !unlocked) ? 'Continue exploring the website...' : ac.desc}</p>
      <div class="achievement-bar-wrap"><div class="achievement-bar" style="width:${pct}%"></div></div>
      <div class="achievement-count">${unlocked ? '100%' : (current||0)+"/"+(acTarget||1)}</div>
      <div class="achievement-meta"><span class="achievement-category">${category} • ${rarity}</span></div>
      ${unlocked ? `<div class="achievement-date">UNLOCKED · ${new Date(a[ac.id].date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>` : `<div class="achievement-date">LOCKED</div>`}
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
function fillAchievements() { const c = document.getElementById('achievementList'); if (c) { if (typeof ACHIEVEMENTS === 'undefined') return; updateAchievementUI(); } }
document.addEventListener('DOMContentLoaded', fillAchievements);
function awardAchievement(id) { const a = getAchievements(); if (!a[id]) { a[id] = { unlocked: true, date: new Date().toISOString() }; saveAchievements(a); updateAchievementUI(); showAchievementPopup(id); return true; } return false; }
function isAchievementUnlocked(id) { return !!(getAchievements()[id]?.unlocked); }
function getUnlockedThemes() { const u = new Set(['light','dark']); ACHIEVEMENTS.forEach(a => { if (a.unlocks && isAchievementUnlocked(a.id)) a.unlocks.forEach(t => u.add(t)); }); return Array.from(u); }
