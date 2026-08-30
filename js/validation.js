/* ============================================================
   MEANINGFUL WORK VALIDATION SYSTEM
   Multi-signal heuristic; no hard word limit; supports AI plug-in
   ============================================================ */

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0;
  return Math.abs(h).toString(16);
}

function getWorkFingerprint(title, content) {
  const clean = (title || '').trim().toLowerCase() + '|' + (content || '').trim().toLowerCase();
  return hashString(clean);
}

function isSpamPattern(text) {
  const t = (text || '').trim();
  if (t.length < 10) return true;
  if (/^([a-zA-Z])\1+$/.test(t) || /^(.+)\1+$/.test(t)) return true; // repeated chars or repeats
  if (/\b(test|hello|hi|asdf|aaaa|lol)\b/i.test(t) && t.length < 30) return true;
  if (t.length < 20 && /\b(story|poem|hello|test)\b/i.test(t)) return true;
  return false;
}

function isDuplicateContent(content, fingerprintStore) {
  const fp = getWorkFingerprint('', content);
  if (fingerprintStore && fingerprintStore.fp === fp) return true;
  return false;
}

function calculateMeaningfulnessScore(title, content, workHistory) {
  let score = 0;
  const text = (content || '').trim();
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);

  // Structure (0-25)
  if (text.length >= 30) score += 10;
  if (lines.length >= 2) score += 10;
  if (text.length >= 100) score += 5;

  // Uniqueness / anti-spam (0-30)
  if (!isSpamPattern(text)) score += 15;
  if (lines.length >= 3 && new Set(text.toLowerCase().split(/\W+/)).size > 10) score += 15;

  // Diversity / vocabulary (0-20)
  const words = text.toLowerCase().match(/\b[a-z]{2,}\b/g) || [];
  const uniqueWords = new Set(words);
  if (uniqueWords.size >= 10) score += 10;
  if (uniqueWords.size >= 20) score += 10;

  // Session / editing evidence (0-15)
  if (workHistory && workHistory.editEvents >= 1) score += 8;
  if (workHistory && workHistory.draftSaved) score += 7;

  // Title-body relation (0-10)
  const t = (title || '').trim().toLowerCase();
  const bodyFirst = text.split(/\r?\n/)[0] || '';
  if (t.length > 2 && bodyFirst.length > 5 && !/\b(my story|poem|test|hello)\b/i.test(t + bodyFirst)) score += 10;

  return Math.min(100, score);
}

function validateWork(title, content, workHistory) {
  if (!title || !content) return { qualifies: false, confidence: 0, score: 0, reasons: ['Missing title or content'] };
  if (isSpamPattern(content)) return { qualifies: false, confidence: 0.1, score: 0, reasons: ['Spam/placeholder pattern detected'] };
  const fp = getWorkFingerprint(title, content);
  const score = calculateMeaningfulnessScore(title, content, workHistory);
  const qualifies = score >= 55; // configurable threshold
  const reasons = [];
  if (qualifies) reasons.push('Content appears original and structured');
  if (workHistory && workHistory.editEvents) reasons.push('Editing activity present');
  return { qualifies, confidence: score / 100, score, reasons, fingerprint: fp };
}
