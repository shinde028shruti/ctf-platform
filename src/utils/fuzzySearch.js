export function fuzzScore(query, text) {
  const q = (query || '').toLowerCase().trim();
  const t = (text || '').toLowerCase();
  if (!q || !t) return 0;

  if (t === q) return 1000;
  if (t.startsWith(q)) return 800 + q.length;
  if (t.includes(q)) return 600 + q.length;

  for (const w of t.split(/[\s\-_./:]+/)) {
    if (w.startsWith(q)) return 720 + q.length;
  }

  const { score } = subsequenceScore(q, t);
  return score > 40 ? score : 0;
}

export function fuzzSearch(query, items, keyFn, limit = 8) {
  const scored = items
    .map(item => ({ item, score: fuzzScore(query, keyFn(item)) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(r => r.item);
}

function subsequenceScore(q, t) {
  let qi = 0;
  let score = 0;
  let gap = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += 100 - Math.min(90, gap);
      gap = 0;
      qi++;
    } else {
      gap++;
    }
  }
  return { score, full: qi === q.length, q, t };
}