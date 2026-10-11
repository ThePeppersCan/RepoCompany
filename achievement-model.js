(function (root) {
  'use strict';
  const visible = (achievement, revealAll, revealed) => !achievement.secret || revealAll || revealed.has(achievement.id);
  function select(achievements, {query = '', category = 'all', sort = 'default', revealAll = false, revealed = new Set()} = {}) {
    const needle = query.trim().toLocaleLowerCase('en-GB');
    return achievements.filter(a => {
      const shown = visible(a, revealAll, revealed);
      const categoryMatches = category === 'all' || (shown && a.category === category) || (!shown && category === 'secret');
      const text = shown ? `${a.name} ${a.description} ${a.category}` : 'Secret achievement Reveal to see the name and requirement';
      return categoryMatches && text.toLocaleLowerCase('en-GB').includes(needle);
    }).sort((a, b) => {
      if (sort === 'score-desc') return b.repoScore - a.repoScore || a.number - b.number;
      if (sort === 'score-asc') return a.repoScore - b.repoScore || a.number - b.number;
      if (sort === 'name') return (visible(a, revealAll, revealed) ? a.name : 'Secret achievement').localeCompare(visible(b, revealAll, revealed) ? b.name : 'Secret achievement') || a.number - b.number;
      return a.number - b.number;
    });
  }
  const model = Object.freeze({visible, select});
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
  else root.achievementModel = model;
})(typeof window !== 'undefined' ? window : globalThis);
