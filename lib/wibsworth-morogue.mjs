/* Reviewed, server-side Morogue evidence. No model calls, game execution or repository ingestion.
 * Review the published entry/dependency graph before changing these facts. Local art filenames
 * and a file's presence in the checkout do not establish that a mechanic is available to players.
 */
export const MOROGUE_REVIEWED_AT = '2026-10-18';
export const MOROGUE_WEB_VERSION = 'web-2026-10-18-25e3844eff7f-c3cd74169ab2';
export const MOROGUE_DOWNLOAD_VERSION = '0.1.0-preview.5';
export const MOROGUE_DOWNLOAD_MANIFEST_SHA256 = 'a0fdf5f6a67dbcba33beaa79c85f2cf4beef0a9fafe252895f251cfa06452812';
// These are immutable published download blobs, not paths in the local checkout.
// The entry was inspected to establish which files are actually loaded. Alternative
// filenames in the download inventory are not themselves proof of runtime use.
export const MOROGUE_DOWNLOAD_SOURCE_MANIFEST = Object.freeze([
  ['entry', 'interface/vampire-survivor/index.html', '3313a35db0b85168972ea2d0cb79503f3e355d90e8a68f59b0fd60a54bff9ff7'],
  ['builds', 'game-integrations/morogue/builds.js', 'b635e0ffc1183e7ce2c308c0f5596d51cb0d4dbf71b2cff9d03149d2643590c8'],
  ['game', 'game-integrations/morogue/game.js', '3b5e357c3b291be84268345d9c4e7fc77ad3a08da47dfc7bc9ae8109f4e0eeca'],
  ['relics', 'interface/vampire-survivor/relics.js', 'e8b5876a9460cfdf60d1bbb7e3c9b81c94dc7f916caa0d7ce5b5c69547968a78'],
  ['names', 'game-integrations/morogue/food-cards.js', '13c061a0920efbecfcc532f7c11f38d1c7eb3110b174dfd3c18eae897f38bab3']
].map(([id, path, sha256]) => Object.freeze({id, path, sha256, version: MOROGUE_DOWNLOAD_VERSION, url: 'https://repo-company-games.pages.dev/blobs/' + sha256 + '.bin'})));
const origin = 'https://repocompany.uk/';
const snapshot = 'game-integrations/morogue/relics-20261015/';
export const MOROGUE_SOURCE_MANIFEST = Object.freeze([
  ['builds.js', '25e3844eff7fbe31dc200ad20dd0d3474222717d5c0853ede8d9d90699339e1c'],
  ['game.js', 'c3cd74169ab2ab332e9a8ea8d56dc6f1be6c3e467bfb8e48fed2bb3a123d956f'],
  ['relics.js', 'fbb8e2dd48483c75adbb40dbf0b6f0668185741e25099bbe9b8e2d185aa21f77'],
  ['food-cards.js', 'b5af54ac7dcbc1a58a3713927fe7c565968ece989e8447a00d33e0de1e4b31fe'],
  ['relic-expansion.js', '74fa23761fefbe63dbc5f2dbe178dead57d7e48943d6de84c834bf0f86535602']
].map(([name, sha256]) => Object.freeze({path: snapshot + name, sha256, url: origin + snapshot + name})));

const source = (id, title, name, lines) => Object.freeze({
  id: 'morogue-' + id, title, url: 'https://repocompany.uk/Morogue',
  version: MOROGUE_WEB_VERSION, status: 'current', reviewedAt: MOROGUE_REVIEWED_AT,
  sha256: MOROGUE_SOURCE_MANIFEST.find(item => item.path === snapshot + name).sha256,
  lines
});
const SOURCES = Object.freeze({
  builds: source('builds', 'Morogue — released combat builds and special abilities', 'builds.js', [4, 407, 417, 425, 432, 440, 454, 493, 497]),
  game: source('game', 'Morogue — released combat and damage rules', 'game.js', [175, 195, 324, 346, 347]),
  relics: source('relics', 'Morogue — merchant relic effects, prices and trade-offs', 'relics.js', [4, 14, 16, 18, 19, 25, 35, 85, 123, 125, 128, 132, 133, 143]),
  names: source('names', 'Morogue — names shown on upgrade cards', 'food-cards.js', [7, 32, 62, 82, 211])
});
const uniqueSources = (keys, version) => [...new Set(keys)].map(key => {
  if (version?.platform !== 'launcher') return SOURCES[key];
  const pin = MOROGUE_DOWNLOAD_SOURCE_MANIFEST.find(item => item.id === key);
  return Object.freeze({id: 'morogue-launcher-' + key, title: SOURCES[key].title.replace('released', 'downloadable'), url: 'https://repocompany.uk/Morogue', version: MOROGUE_DOWNLOAD_VERSION, status: 'current', reviewedAt: MOROGUE_REVIEWED_AT, sha256: pin.sha256});
});

/** The five combinations below are independently verified in both reviewed builds.
 * This does not imply full game parity: their other relics/formulas differ.
 */
export function morogueVersionSupport({platform = 'web', gameVersion} = {}) {
  const selected = String(platform).toLowerCase();
  if (['launcher', 'desktop'].includes(selected) && gameVersion === MOROGUE_DOWNLOAD_VERSION) return {
    supported: true, platform: 'launcher', version: MOROGUE_DOWNLOAD_VERSION, reviewedAt: MOROGUE_REVIEWED_AT,
    qualifier: 'These five combinations were checked against this downloadable release. Its broader relic rules differ from the current web build; do not infer other web mechanics or content are available.'
  };
  if (!['web', 'browser'].includes(selected)) return {
    supported: false,
    reason: 'That installed Morogue version has not been verified. These calculations support the reviewed web build and downloadable Morogue 0.1.0-preview.5 only. Check the installed game version before giving version-specific numbers; do not assume web and launcher releases are interchangeable.',
    platform: selected,
    requestedVersion: typeof gameVersion === 'string' ? gameVersion.slice(0, 100) : null
  };
  if (gameVersion != null && gameVersion !== '' && gameVersion !== 'current' && gameVersion !== MOROGUE_WEB_VERSION) return {
    supported: false,
    reason: 'That Morogue version has not been verified. These calculations apply only to the reviewed web build; ask which published version the player is using before giving version-specific numbers.',
    platform: selected,
    requestedVersion: String(gameVersion).slice(0, 100)
  };
  return {supported: true, platform: 'web', version: MOROGUE_WEB_VERSION, reviewedAt: MOROGUE_REVIEWED_AT};
}

const round = value => Math.round((value + Number.EPSILON) * 1e6) / 1e6;
const numeric = (value, fallback, min, max, name, integer = false) => {
  const result = value === undefined ? fallback : value;
  if (typeof result !== 'number' || !Number.isFinite(result) || result < min || result > max || integer && !Number.isInteger(result)) throw new RangeError('Invalid ' + name);
  return result;
};
const boolean = (value, fallback, name) => {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') throw new TypeError('Invalid ' + name);
  return value;
};
const freezeResult = result => Object.freeze(result);
const knownAbilities = Object.freeze({
  steam: {name: 'Scalding Chai', seconds: 8}, bell: {name: 'Copper Cocoa', seconds: 11},
  garden: {name: 'Briar Tea', seconds: 12}, comet: {name: 'Falling-star Cordial', seconds: 10},
  tide: {name: 'Undertow Tonic', seconds: 11}, clock: {name: 'Midnight Cold Brew', seconds: 14}
});

export const MOROGUE_COMBO_IDS = Object.freeze(['finisher', 'crowds', 'echo', 'special', 'survival']);

/** Small, auditable comparisons, not a simulator or an unsupported global build ranking.
 * Inputs describe a hypothetical scenario. They are never read as player inventory or telemetry.
 */
export function calculateMorogueCombo(id, options = {}) {
  if (!MOROGUE_COMBO_IDS.includes(id)) throw new RangeError('Unknown reviewed Morogue combination');
  const version = morogueVersionSupport(options);
  if (!version.supported) return freezeResult({id, supported: false, eligible: false, version, caveat: version.reason, sources: []});
  const baseDamage = numeric(options.baseDamage, 100, 0, 1000000000, 'base damage');
  const failures = [];
  const weapon = options.weapon === undefined ? 'espresso' : options.weapon;
  const result = {id, supported: true, eligible: true, version, hypothetical: true, failures, stats: {}, requirements: [], tradeoffs: [], assumptions: ['Comparison holds all unlisted effects equal. These are component calculations, not measured DPS or a claim of a universally best build.']};
  if (['finisher', 'crowds', 'echo'].includes(id)) {
    result.comparisonBasis = {hypotheticalBaseDamage: baseDamage, meaning: 'Damage examples use this assumed unmodified hit/volley, not actual in-game damage. Prefer the multipliers or percentages; state the assumed base whenever quoting damage amounts.'};
  }
  const sourcesFor = keys => uniqueSources(keys, version);
  const budget = options.brass === undefined ? null : numeric(options.brass, 0, 0, 1000000000, 'brass');
  function slots(combat, relic) {
    result.slots = {combat, combatLimit: 6, relic, relicLimit: 3};
    if (options.availableCombatSlots !== undefined && numeric(options.availableCombatSlots, 6, 0, 6, 'available combat slots', true) < combat) failures.push('Not enough free combat slots for the full combination.');
    if (options.availableRelicSlots !== undefined && numeric(options.availableRelicSlots, 3, 0, 3, 'available relic slots', true) < relic) failures.push('Not enough free relic slots without replacing an existing relic.');
  }
  function merchant(items) {
    result.items = items.map(([id, name, brass]) => ({id, name, brass}));
    result.cost = {brass: items.reduce((sum, item) => sum + item[2], 0), basis: 'Full listed purchase prices; excludes previous ownership, refunds and discounts.'};
    result.requirements.push('Each relic must actually be offered by the merchant and affordable when purchased; appearances are not guaranteed.');
    if (budget !== null && budget < result.cost.brass) failures.push('Not enough brass to buy the complete combination at listed prices.');
  }
  function coffee() {
    result.requirements.push('Espresso must be the main weapon; these transformations cannot be used with the Sourdough Sabre main weapon.');
    if (weapon !== 'espresso') failures.push('Requires Espresso as the main weapon.');
    result.requirements.push('Own the rare parent transformation before its refinements are offered. At most two refinements per parent; they use its existing combat slot. Offers are not guaranteed.');
  }
  if (id === 'finisher') {
    result.name = 'Glass Pepper + Lead Apricot';
    result.role = 'Main-finisher damage';
    slots(0, 2);
    merchant([['glasspepper', 'Glass Pepper', 75], ['leadapricot', 'Lead Apricot', 65]]);
    result.stats = {mainFinisherMultiplier: 1.25 * 1.3, mainFinisherIncreasePercent: 62.5, mainFinisherDamage: round(baseDamage * 1.25 * 1.3), otherMainMultiplier: 1.25, otherMainDamage: round(baseDamage * 1.25), incomingDamageMultiplier: 1.2, walkingSpeedMultiplier: 0.9};
    result.tradeoffs.push('All incoming damage increases by 20%. Walking speed is reduced by 10%; dash distance is unchanged.', 'The damage bonuses apply to active main-weapon hits, not specials or relic damage.');
    result.assumptions.push('The finisher has landed. Both relics are owned, and no other conditional damage modifiers are included.');
    result.sources = sourcesFor(['relics', 'game']);
  } else if (id === 'crowds') {
    result.name = 'Carom Coffee + Skillet Capers + Third Cup + Long Table';
    result.role = 'Distributed crowd damage';
    slots(2, 0); coffee();
    const rank = numeric(options.rank, 2, 1, 3, 'Skillet Capers rank', true);
    const runSeconds = numeric(options.runSeconds, rank === 3 ? 600 : rank === 2 ? 300 : 0, 0, 1000000000, 'run time');
    const redirects = numeric(options.freshTargets, 3, 0, 3, 'fresh redirect targets', true);
    const requiredSeconds = rank === 3 ? 600 : rank === 2 ? 300 : 0;
    if (runSeconds < requiredSeconds) failures.push('Skillet Capers rank ' + rank + ' is not available this early in the run.');
    const retention = 0.65 + 0.05 * rank;
    const firstHit = baseDamage * 0.9;
    const bounceDamage = Array.from({length: redirects}, (_, i) => round(firstHit * retention ** (i + 1)));
    result.stats = {rank, requiredRunSeconds: requiredSeconds, firstHitMultiplier: 0.9, firstHit: round(firstHit), retention: round(retention), redirectLimit: 3, redirectRange: 360, bounceDamage, distributedHitMultiplier: round(0.9 * (1 + Array.from({length: redirects}, (_, i) => retention ** (i + 1)).reduce((a, b) => a + b, 0))), exampleSum: round(firstHit + bounceDamage.reduce((a, b) => a + b, 0))};
    result.requirements.push('Ranks II and III of Skillet Capers unlock at 5:00 and 10:00 respectively.', 'Each redirected leg needs an eligible fresh target in range. Only one bolt per attack can perform this chain, after its last pierce.');
    result.tradeoffs.push('Forward coffee shot damage is 10% lower.', 'No fresh targets means no ricochet benefit. A bolt cannot use ricochets to hit the same foe repeatedly.');
    result.assumptions.push('One hit is counted on the initial leg and one on each of ' + redirects + ' redirected legs. The sum is spread across distinct targets, is not single-target damage or DPS, and is not a claim about the total number of pierce hits. No critical, enemy-defence or on-hit bonuses included.');
    result.sources = sourcesFor(['builds', 'game', 'names']);
  } else if (id === 'echo') {
    result.name = 'Echo Espresso + Double Extraction + Iced Echo';
    result.role = 'Repeat-hit damage with ordinary-enemy control';
    slots(1, 0); coffee();
    const first = baseDamage * 0.85, echo = first * 0.55;
    result.stats = {firstVolleyMultiplier: 0.85, echoMultiplierOfFirstVolley: 0.55, firstVolleyDamage: round(first), echoDamage: round(echo), combinedDamage: round(first + echo), combinedMultiplier: round(0.85 * 1.55), combinedIncreasePercent: 31.75, echoDelaySeconds: 0.35, ordinaryEnemySpeedMultiplier: 0.7, slowDurationSeconds: 2};
    result.tradeoffs.push('The first volley loses 15% damage; the extra hit is delayed and can miss.', 'Echoes cannot trigger other weapon effects. Bosses resist the slow; repeated slows refresh rather than stack.');
    result.assumptions.push('The original volley and its echo both hit for the illustrated total. The slow is for ordinary enemies only.');
    result.sources = sourcesFor(['builds', 'game', 'names']);
  } else if (id === 'special') {
    result.name = 'Sour Starter + Bitter Coffee';
    result.role = 'Banked special burst';
    slots(0, 2);
    merchant([['starter', 'Sour Starter', 85], ['bittercoffee', 'Bitter Coffee', 80]]);
    const ability = options.ability === undefined ? 'comet' : options.ability;
    const spec = Object.hasOwn(knownAbilities, ability) ? knownAbilities[ability] : null;
    if (!spec) failures.push('Requires an owned, reviewed special ability.');
    result.requirements.push('Already own a special ability; both merchant relics require one.');
    result.stats = {ability: spec?.name || null, baseRechargeSeconds: spec?.seconds ?? null, charges: 2, rechargeDurationMultiplier: 1.3, rechargeProgressMultiplier: 1.25, effectiveRechargeMultiplier: 1.04, perChargeSeconds: spec ? round(spec.seconds * 1.3 / 1.25) : null, mainAttackMultiplier: 0.85};
    result.tradeoffs.push('Main attacks deal 15% less damage.', 'The extra charge starts empty and charges recharge one at a time. This banks burst; it does not double sustained casting throughput.');
    result.assumptions.push('No other recharge modifiers, automatic-casting relics, keystones or refunds. ' + (options.ability === undefined ? 'Falling-star Cordial is an example, not an assumption about the player\'s inventory.' : 'The selected ability is a hypothetical input, not inspected player inventory.'));
    result.sources = sourcesFor(['builds', 'relics', 'names']);
  } else if (id === 'survival') {
    result.name = 'Copper Thimble + Porcelain Teacup';
    result.role = 'Timed damage protection';
    slots(0, 2);
    merchant([['thimble', 'Copper Thimble', 65], ['teacup', 'Porcelain Teacup', 60]]);
    const incoming = numeric(options.incomingDamage, 20, 0, 1000000000, 'incoming damage');
    const teacupActive = boolean(options.teacupActive, true, 'teacup activity');
    const thimbleReady = boolean(options.thimbleReady, true, 'thimble readiness');
    const received = Math.max(0, incoming * (teacupActive ? 0.85 : 1) - (thimbleReady ? 6 : 0));
    result.comparisonBasis = {hypotheticalIncomingDamage: incoming, meaning: 'Received damage and damage avoided are one conditional example, not fixed damage or a fixed block. The actual Teacup reduction is 15%; only Thimble has a flat block of up to 6.'};
    result.stats = {incomingDamage: incoming, teacupActive, thimbleReady, receivedDamage: round(received), damageAvoided: round(incoming - received), teacupReductionPercent: 15, teacupIncomingMultiplier: 0.85, teacupDurationSeconds: 2, teacupTriggerGateSeconds: 6, thimbleBlock: 6, initialHitFreeSeconds: 10, thimbleRearmSeconds: 12};
    result.formula = 'When Teacup is active AND Thimble is armed: received = max(0, incoming damage × 0.85 − 6). Otherwise omit the inactive effect. The conditional amount avoided varies with the incoming hit.';
    result.requirements.push('Land a finisher to activate Teacup; the six-second gate only permits another landed finisher to trigger it, not automatic reactivation.', 'Thimble arms only when BOTH conditions hold: ten seconds without a hit and twelve seconds elapsed since its last block. These timers overlap; they are not added together.');
    result.tradeoffs.push('Protection is conditional, not permanent: Teacup lasts two seconds with six seconds between triggers; Thimble is consumed by a hit.', 'Uses two relic slots that could otherwise contribute damage.');
    result.assumptions.push('Illustration excludes shields, other damage modifiers, invulnerability and special-case encounter damage. The game applies Teacup\'s multiplier before Thimble\'s flat block.');
    result.sources = sourcesFor(['relics', 'game']);
  }
  result.eligible = failures.length === 0;
  return freezeResult(result);
}

const num = value => Number(value.toFixed(4)).toString();
function evidenceText(evidence) {
  const s = evidence.stats;
  let details;
  if (evidence.id === 'finisher') details = 'Glass Pepper × Lead Apricot gives 1.25 × 1.30 = 1.625, or +62.5% main-finisher damage: a hypothetical 100-damage finisher becomes 162.5. Other main attacks gain 25%. It costs 140 brass and uses 2 of 3 relic slots.';
  if (evidence.id === 'crowds') details = 'At Skillet Capers rank II (available from 5:00), Carom Coffee retains 75% damage on each ricochet. Third Cup allows three redirects; Long Table increases search range to 360 steps. A hypothetical 100-damage bolt becomes 90 initially, then ' + s.bounceDamage.map(num).join(', ') + ' on one hit per redirected leg (' + num(s.exampleSum) + ' distributed across these four distinct hits). This uses 2 of 6 combat slots and both refinements of Carom Coffee, with no extra refinement slots. This is a distributed-hit illustration, NOT boss damage or DPS.';
  if (evidence.id === 'echo') details = 'Echo Espresso with Double Extraction changes a hypothetical 100-damage volley into 85 initially plus a 46.75-damage echo after 0.35 seconds: 131.75 total (+31.75%) IF both volleys land. Iced Echo slows ordinary enemies by 30% for 2 seconds. Uses 1 of 6 combat slots and both parent refinements, with no extra refinement slots.';
  if (evidence.id === 'special') details = 'Sour Starter × Bitter Coffee stores 2 special charges with sequential recharge. Duration 1.30 ÷ recharge rate 1.25 = 1.04 times base recharge: the example Falling-star Cordial goes from 10 to 10.4 seconds per charge. Costs 165 brass and 2 of 3 relic slots. Requires an owned special. The spare charge starts empty; the combination is for banked burst, not faster sustained casting than the unmodified baseline.';
  if (evidence.id === 'survival') details = 'Copper Thimble + Porcelain Teacup costs 125 brass and uses 2 of 3 relic slots. A landed finisher activates Teacup: 15% less incoming damage for 2 seconds, with a 6-second gate before another finisher can trigger it. Armed Thimble then blocks up to 6 damage from one hit. Only as an example, with BOTH active, an assumed 20-damage hit becomes max(0, 20 × 0.85 − 6) = 11. The 9 avoided in that example is not a fixed block. Thimble needs both 10 hit-free seconds and 12 elapsed seconds since its last block; the timers overlap. These are conditional effects, not permanent or average damage reductions.';
  return evidence.name + ' — ' + evidence.role + '. ' + details + ' Requirements: ' + evidence.requirements.join(' ') + ' Trade-offs: ' + evidence.tradeoffs.join(' ') + ' Assumptions: ' + evidence.assumptions.join(' ');
}

const related = /\bmorogue\b|\b(carom coffee|skillet capers|third cup|long table|echo espresso|double extraction|iced echo|glass pepper|lead apricot|sour starter|bitter coffee|copper thimble|porcelain teacup)\b/i;
const mechanics = /\b(combos?|combinations?|builds?|best|stats?|damage|dps|relics?|perks?|upgrades?|weapons?|finishers?|surviv\w*|brass|cooldowns?|recharge|synerg\w*|ranks?|strong\w*|power|coffee|espresso|thimble|teacup|starter|apricot|pepper|capers)\b/i;

/** Only return reviewed, relevant combat evidence. Story content is not in this module. */
export function retrieveMorogueFacts({message = '', platform = 'web', gameVersion, spoilers = false} = {}) {
  const question = String(message).slice(0, 12000);
  if (!related.test(question) || !mechanics.test(question)) return {facts: [], evidence: [], needsSpoilerConsent: false};
  const version = morogueVersionSupport({platform, gameVersion});
  if (!version.supported) return {
    facts: [], evidence: [], caveat: version.reason, version, needsSpoilerConsent: false
  };
  const explicit = [
    ['finisher', /glass pepper|lead apricot/i], ['crowds', /carom|skillet capers|third cup|long table/i],
    ['echo', /echo espresso|double extraction|iced echo/i], ['special', /sour starter|bitter coffee/i],
    ['survival', /copper thimble|porcelain teacup/i]
  ].filter(([, pattern]) => pattern.test(question)).map(([id]) => id);
  const ids = explicit.length ? explicit : /\b(surviv\w*|defen[cs]\w*|safe\w*|tank\w*)\b/i.test(question) ? ['survival', 'echo'] :
    /\b(crowds?|groups?|mobs?|aoe)\b/i.test(question) ? ['crowds', 'echo'] :
      /\b(specials?|spells?|cooldowns?|recharge)\b/i.test(question) ? ['special'] :
        /\b(damage|dps|boss|bosses|single.target)\b/i.test(question) ? ['finisher','echo'] : MOROGUE_COMBO_IDS;
  const evidence = ids.map(id => calculateMorogueCombo(id, {platform, gameVersion}));
  const facts = [{
    id: 'morogue-reviewed-rules', product: 'morogue', status: 'current', spoiler: false,
    text: 'These are checked Morogue component comparisons, not simulation rankings. ' + 'Six combat-perk slots, three merchant-relic slots; at most two refinements per owned parent using the same combat slot. Ranks II/III open at 5:00/10:00. Eligibility, mutually exclusive perks, weapon restrictions and actual offers still apply. Choose according to the player\'s weapon, run progress, available items and goal: single-target damage, crowds, burst or survival. There is no measured universal best build in this evidence. No player inventory, unlocked content or personal statistics have been inspected. State calculation conditions and use displayed card names; never invent stats, a DPS benchmark, interactions, rankings or unavailable items.',
    sources: uniqueSources(['builds', 'relics', 'names'], version)
  }, ...evidence.map(item => ({id: 'morogue-combo-' + item.id, product: 'morogue', text: evidenceText(item), status: 'current', sources: item.sources, spoiler: false}))];
  // These mechanical facts contain no story endings, boss identities or unrevealed plot events.
  return {facts, evidence, version, needsSpoilerConsent: false};
}

export function retrieveMorogueKnowledge(question, options = {}) {
  const result = retrieveMorogueFacts({message: question, ...options});
  return {...result, context: result.facts.map(fact => fact.text).join('\n\n'), sources: [...new Map(result.facts.flatMap(fact => fact.sources).map(source => [source.id, source])).values()]};
}
