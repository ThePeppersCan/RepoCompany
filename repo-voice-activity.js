(() => {
  'use strict';
  // Read levels from the existing WebRTC connection. No extra capture, audio
  // playback, network messages or recordings are needed for the indicator.
  window.createRepoVoiceActivity = function (onChange) {
    const sources = new Map();
    let timer = null, revision = 0, reading = false, signature = '';
    function publish() {
      const now = performance.now();
      const names = [...new Set([...sources.values()].filter(s => s.lastLoud !== null && now - s.lastLoud < 300 && s.enabled()).map(s => s.name))].sort();
      const next = JSON.stringify(names);
      if (next !== signature) { signature = next; onChange(names); }
    }
    async function sample() {
      if (reading) return;
      reading = true; const generation = revision;
      try {
        await Promise.all([...sources.entries()].map(async ([key, source]) => {
          if (!source.enabled()) { source.lastLoud = null; source.previous = null; return; }
          try {
            const stats = await source.read();
            if (generation !== revision || sources.get(key) !== source || !source.enabled()) return;
            let level = 0, previous = null;
            stats.forEach(report => {
              if (report.type !== source.type || (report.kind || report.mediaType) !== 'audio') return;
              let value = Number.isFinite(report.audioLevel) ? report.audioLevel : 0;
              if (Number.isFinite(report.totalAudioEnergy) && Number.isFinite(report.totalSamplesDuration)) {
                const old = source.previous;
                if (old?.id === report.id) {
                  const duration = report.totalSamplesDuration - old.duration, energy = report.totalAudioEnergy - old.energy;
                  value = duration > 0 && energy >= 0 ? Math.sqrt(energy / duration) : 0;
                }
                previous = {id: report.id, energy: report.totalAudioEnergy, duration: report.totalSamplesDuration};
              }
              level = Math.max(level, value);
            });
            source.previous = previous;
            // A short release keeps syllable gaps from flickering. The lower
            // continuation threshold keeps quiet speech readable.
            if (level >= (source.lastLoud !== null && performance.now() - source.lastLoud < 300 ? .012 : .02)) source.lastLoud = performance.now();
          } catch { source.lastLoud = null; source.previous = null; }
        }));
        if (generation === revision) publish();
      } finally { reading = false; }
    }
    return Object.freeze({
      watch(key, source) { sources.set(key, {...source, lastLoud: null, previous: null}); if (!timer) timer = setInterval(sample, 100); sample(); },
      silence(key) { const source = sources.get(key); if (source) { source.lastLoud = null; source.previous = null; } publish(); },
      remove(key) { sources.delete(key); if (!sources.size) { clearInterval(timer); timer = null; } publish(); },
      clear() { revision++; sources.clear(); clearInterval(timer); timer = null; publish(); }
    });
  };
})();
