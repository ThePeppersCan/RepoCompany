var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// shared/knife-motion.js
var TAU = Math.PI * 2;
var KNIFE_MOTIONS = Object.freeze({
  "abyss-awakening": { duration: 4.8, label: "Abyss awakening" },
  "mawbound-awakening": { duration: 4.5, label: "Mawbound awakening" },
  "gallows-awakening": { duration: 4.8, label: "Gallows unbound" },
  "hellhound-awakening": { duration: 4.2, label: "Hellhound release" },
  "widow-awakening": { duration: 4.7, label: "Widow unfolding" },
  "leviathan-awakening": { duration: 5, label: "Leviathan rising" },
  "jester-awakening": { duration: 4.4, label: "Jester awakening" },
  "blade-study": { duration: 2.25, label: "Blade study" },
  "edge-roll": { duration: 1.85, label: "Finger roll" },
  "heel-turn": { duration: 1.78, label: "Heel turn" },
  "back-edge": { duration: 2.1, label: "Reverse edge check" },
  "ring-orbit": { duration: 1.75, label: "Ring orbit" },
  "butterfly-fan": { duration: 2.05, label: "Butterfly fan" },
  "fold-check": { duration: 2, label: "Folder check" },
  "latch-check": { duration: 1.65, label: "Bolster check" },
  "guard-roll": { duration: 1.95, label: "Guard roll" },
  "idle-glance": { duration: 1.3, label: "Quiet edge glance" },
  "grip-settle": { duration: 0.74, label: "Grip adjustment" },
  "pace-roll": { duration: 0.92, label: "Walking wrist roll" },
  "runner-settle": { duration: 0.68, label: "Running grip settle" },
  "running-edge-roll": { duration: 1.02, label: "Running finger roll" },
  "running-ring-orbit": { duration: 1.12, label: "Running ring spin" },
  "running-butterfly": { duration: 1.08, label: "Running butterfly catch" },
  "running-folder": { duration: 0.94, label: "Running pivot check" }
});

// shared/runner-emotes.js
var EMOTES = Object.freeze([
  ["wave", "Wave", 2.8],
  ["salute", "Salute", 2.4],
  ["clap", "Applause", 3.2],
  ["cheer", "Cheer", 3.2],
  ["thumbs-up", "Well played", 2.6],
  ["point", "Over there", 2.5],
  ["shrug", "Shrug", 2.6],
  ["bow", "Bow", 3],
  ["facepalm", "Facepalm", 2.8],
  ["laugh", "Laugh", 3.2],
  ["victory", "Victory", 3],
  ["dance", "Shuffle", 4.8]
].map(([id, label, duration]) => Object.freeze({ id, label, duration })));
var emoteById = /* @__PURE__ */ __name((id) => EMOTES.find((e) => e.id === id), "emoteById");

// shared/runner-presentation.js
var clamp = /* @__PURE__ */ __name((v, a, b) => Math.max(a, Math.min(b, v)), "clamp");
function normalizePresentation(v) {
  if (!v || typeof v !== "object") return null;
  const finite = /* @__PURE__ */ __name((n, a, b) => Number.isFinite(n) ? clamp(n, a, b) : 0, "finite");
  const progress = /* @__PURE__ */ __name((n) => Number.isFinite(n) && n >= 0 && n < 1, "progress");
  return {
    gliding: v.gliding === true,
    equipment: v.equipment === 2 ? 2 : 0,
    strafe: finite(v.strafe, -60, 60),
    forward: finite(v.forward, -60, 60),
    vy: finite(v.vy, -100, 100),
    motion: v.motion !== false,
    knife: Object.hasOwn(KNIFE_MOTIONS, v.knife?.name) && progress(v.knife.progress) ? { name: v.knife.name, progress: v.knife.progress } : null,
    emote: emoteById(v.emote?.id) && progress(v.emote.progress) ? { id: v.emote.id, progress: v.emote.progress } : null
  };
}
__name(normalizePresentation, "normalizePresentation");

// worker.mjs
import { DurableObject as DurableObject3, WorkerEntrypoint } from "cloudflare:workers";

// ../../lib/comp-run-cosmetic-catalog.mjs
var COMP_RUN_COSMETICS = Object.freeze({ "knives": [{ "id": "wake", "name": "Wake", "family": "Field knife" }, { "id": "needle", "name": "Needle", "family": "Stiletto" }, { "id": "crescent", "name": "Crescent", "family": "Ring blade" }, { "id": "sentry", "name": "Sentry", "family": "Bayonet" }, { "id": "rift", "name": "Rift", "family": "Tanto" }, { "id": "drift", "name": "Drift", "family": "Clip point" }, { "id": "latch", "name": "Latch", "family": "Folding knife" }, { "id": "vesper", "name": "Vesper", "family": "Butterfly" }, { "id": "abyss", "name": "Abyss Knife", "family": "Living relic" }], "finishes": [{ "id": "brushed", "name": "Brushed Alloy", "price": 0, "premium": false }, { "id": "violet", "name": "Night Violet", "price": 0, "premium": false }, { "id": "crimson", "name": "Crimson Vein", "price": 0, "premium": false }, { "id": "amber", "name": "Amber Stripe", "price": 0, "premium": false }, { "id": "prism", "name": "Prism Temper", "price": 0, "premium": false }, { "id": "copper", "name": "Weathered Copper", "price": 0, "premium": false }, { "id": "obsidian", "name": "Obsidian Damascus", "price": 0, "premium": false }, { "id": "glacier", "name": "Glacier Shard", "price": 0, "premium": false }, { "id": "jade", "name": "Jade Serpent", "price": 0, "premium": false }, { "id": "porcelain", "name": "Porcelain Bloom", "price": 0, "premium": false }, { "id": "ember", "name": "Emberglass", "price": 0, "premium": false }, { "id": "royal", "name": "Royal Filigree", "price": 0, "premium": false }, { "id": "carbon", "name": "Carbon Satin", "price": 0, "premium": false }, { "id": "aurora", "name": "Aurora Titanium", "price": 0, "premium": false }, { "id": "goldline", "name": "Goldline", "price": 0, "premium": false }, { "id": "pearl", "name": "Pearl Ceramic", "price": 0, "premium": false }, { "id": "viper", "name": "Viper Scale", "price": 0, "premium": false }, { "id": "signal", "name": "Signal Orange", "price": 0, "premium": false }, { "id": "tidal", "name": "Tidal Steel", "price": 0, "premium": false }, { "id": "rose", "name": "Rose Guilloche", "price": 0, "premium": false }, { "id": "meteor", "name": "Meteorite", "price": 0, "premium": false }, { "id": "dune", "name": "Dune Topography", "price": 0, "premium": false }, { "id": "marble", "name": "Marble Ink", "price": 0, "premium": false }, { "id": "petrol", "name": "Petrol Temper", "price": 0, "premium": false }, { "id": "blueprint", "name": "Blueprint", "price": 0, "premium": false }, { "id": "garnet", "name": "Garnet Mosaic", "price": 0, "premium": false }, { "id": "blackstone", "name": "Blackstone", "price": 0, "premium": false }, { "id": "scrimshaw", "name": "Scrimshaw", "price": 0, "premium": false }, { "id": "abyss", "name": "Abyss Relic", "price": 0, "premium": false }, { "id": "mawbound", "name": "Mawbound", "price": 3600, "premium": true }, { "id": "gallows", "name": "Gallows", "price": 3600, "premium": true }, { "id": "hellhound", "name": "Hellhound", "price": 3600, "premium": true }, { "id": "widow", "name": "Widow", "price": 3600, "premium": true }, { "id": "leviathan", "name": "Leviathan", "price": 3600, "premium": true }, { "id": "jester", "name": "The Jester", "price": 3600, "premium": true }, { "id": "sovereign", "name": "Sovereign", "price": 1200, "premium": true }, { "id": "argent", "name": "Argent Atelier", "price": 600, "premium": true }, { "id": "opaline", "name": "Opaline", "price": 1200, "premium": true }, { "id": "imperial", "name": "Imperial Sapphire", "price": 1200, "premium": true }, { "id": "kintsugi", "name": "Kintsugi Noir", "price": 600, "premium": true }, { "id": "verdigris", "name": "Verdigris Court", "price": 600, "premium": true }, { "id": "sanguine", "name": "Sanguine Lacquer", "price": 600, "premium": true }, { "id": "nocturne", "name": "Nocturne", "price": 600, "premium": true }, { "id": "wraith", "name": "Wraithglass", "price": 1200, "premium": true }, { "id": "bloodmoon", "name": "Blood Moon", "price": 2400, "premium": true }, { "id": "gravebloom", "name": "Gravebloom", "price": 1200, "premium": true }, { "id": "hexbound", "name": "Hexbound", "price": 2400, "premium": true }, { "id": "ectoplasm", "name": "Ectoplasm", "price": 1200, "premium": true }, { "id": "spectral", "name": "Spectral Mirror", "price": 2400, "premium": true }, { "id": "fallen", "name": "Fallen Halo", "price": 1200, "premium": true }, { "id": "void", "name": "Void Reliquary", "price": 2400, "premium": true }, { "id": "solstice", "name": "Solstice", "price": 1200, "premium": true }, { "id": "permafrost", "name": "Permafrost", "price": 1200, "premium": true }, { "id": "stormcall", "name": "Stormcall", "price": 2400, "premium": true }, { "id": "inferno", "name": "Inferno Core", "price": 2400, "premium": true }, { "id": "tideglass", "name": "Tideglass", "price": 600, "premium": true }, { "id": "tempest", "name": "Tempest Silk", "price": 600, "premium": true }, { "id": "fulgurite", "name": "Fulgurite", "price": 600, "premium": true }, { "id": "nebula", "name": "Nebula Atlas", "price": 2400, "premium": true }], "runners": [{ "id": "rowan", "name": "Isaiah Hale", "price": 0, "paid": false }, { "id": "elias", "name": "Nolan Ward", "price": 0, "paid": false }, { "id": "dax", "name": "Kit Mercer", "price": 0, "paid": false }, { "id": "mara", "name": "Emilia Voss", "price": 0, "paid": false }, { "id": "nadia", "name": "Evelyn Vale", "price": 0, "paid": false }, { "id": "sera", "name": "Alessia Cross", "price": 0, "paid": false }, { "id": "abyss", "name": "Abyss", "price": 0, "paid": false }, { "id": "cinder-saint", "name": "Cinder Saint", "price": 0, "paid": false }, { "id": "brass-diver", "name": "Brass Diver", "price": 0, "paid": false }, { "id": "null-seraph", "name": "Null Seraph", "price": 0, "paid": false }, { "id": "deadbolt", "name": "Deadbolt", "price": 0, "paid": false }, { "id": "night-porter", "name": "Night Porter", "price": 0, "paid": false }, { "id": "last-encore", "name": "Last Encore", "price": 0, "paid": false }, { "id": "mireglass", "name": "Mireglass", "price": 0, "paid": false }, { "id": "faultline", "name": "Faultline", "price": 0, "paid": false }, { "id": "crownless", "name": "Crownless", "price": 0, "paid": false }, { "id": "palimpsest", "name": "Palimpsest", "price": 0, "paid": false }, { "id": "tidemark", "name": "Tidemark", "price": 0, "paid": false }, { "id": "scullion", "name": "Scullion", "price": 0, "paid": false }, { "id": "wayfarer", "name": "Wayfarer", "price": 0, "paid": false }, { "id": "seamkeeper", "name": "Seamkeeper", "price": 0, "paid": false }, { "id": "umbra", "name": "Umbra", "price": 0, "paid": false }, { "id": "blackstitch", "name": "Blackstitch", "price": 1200, "paid": true }, { "id": "redactor", "name": "Redactor", "price": 1200, "paid": true }, { "id": "ferryman", "name": "Ferryman", "price": 1200, "paid": true }, { "id": "deadchannel", "name": "Dead Channel", "price": 1200, "paid": true }, { "id": "lamplighter", "name": "Lamplighter", "price": 1200, "paid": true }, { "id": "oathbreaker", "name": "Oathbreaker", "price": 1200, "paid": true }, { "id": "bonepicker", "name": "Bonepicker", "price": 1200, "paid": true }, { "id": "mothkeeper", "name": "Mothkeeper", "price": 1200, "paid": true }, { "id": "glasswake", "name": "Glasswake", "price": 1200, "paid": true }, { "id": "bellwether", "name": "Bellwether", "price": 1200, "paid": true }, { "id": "nightwatch", "name": "Nightwatch", "price": 1200, "paid": true }, { "id": "hush", "name": "Hush", "price": 1200, "paid": true }, { "id": "archfiend", "name": "Archfiend", "price": 2400, "paid": true }, { "id": "hollow-king", "name": "Hollow King", "price": 2400, "paid": true }, { "id": "red-widow", "name": "Red Widow", "price": 2400, "paid": true }, { "id": "dreadhound", "name": "Dreadhound", "price": 2400, "paid": true }, { "id": "drowned-oracle", "name": "Drowned Oracle", "price": 2400, "paid": true }, { "id": "chain-saint", "name": "Chain Saint", "price": 2400, "paid": true }, { "id": "grave-moth", "name": "Grave Moth", "price": 2400, "paid": true }, { "id": "ash-revenant", "name": "Ash Revenant", "price": 2400, "paid": true }] });
function cleanCompRunKnife(value) {
  return { knifeId: COMP_RUN_COSMETICS.knives.some((k) => k.id === value?.knifeId) ? value.knifeId : "wake", finishId: COMP_RUN_COSMETICS.finishes.some((f) => f.id === value?.finishId) ? value.finishId : "brushed" };
}
__name(cleanCompRunKnife, "cleanCompRunKnife");

// hand-grab.mjs
var HAND_WINDOW = 2e3;
function ropeFromPose(message) {
  const id = message.rope?.id;
  return message.pose?.[6] === 7 && message.rope?.type === "swing" && typeof id === "string" && /^(abyss-swing-[0-3]|roof-vine-\d{1,2})$/.test(id) ? { id, type: "swing" } : null;
}
__name(ropeFromPose, "ropeFromPose");
function handCandidate(a, b, now) {
  if (a.id === b.id || a.handLink || b.handLink || !a.handIntentAt || !b.handIntentAt || now - a.handIntentAt > HAND_WINDOW || now - b.handIntentAt > HAND_WINDOW) return null;
  if (now - a.poseAt > 600 || now - b.poseAt > 600 || ![0, 4, 7].includes(a.pose[6]) || ![0, 4, 7].includes(b.pose[6])) return null;
  if (Math.hypot(...a.pose.slice(0, 3).map((v, i) => v - b.pose[i])) > 3.2) return null;
  const riders = [a, b].filter((p) => p.rope).sort((x, y) => x.ropeAt - y.ropeAt || x.id.localeCompare(y.id));
  if (!riders.length) return null;
  return { host: riders[0].id, guest: riders[0] === a ? b.id : a.id };
}
__name(handCandidate, "handCandidate");

// airport-service.mjs
import { DurableObject } from "cloudflare:workers";

// airport-state.mjs
var AIRPORT_CAPACITY = 12;
var PARTY_CAPACITY = 8;
function createAirportState(code2, privateRoom = false) {
  return { code: code2, privateRoom, players: [], parties: [], invites: [], revision: 0 };
}
__name(createAirportState, "createAirportState");
var fail = /* @__PURE__ */ __name((message) => ({ ok: false, error: message }), "fail");
function airportCommand(state, id, m, now = Date.now()) {
  const me = state.players.find((p) => p.id === id);
  if (!me) return fail("Reconnect to the airport.");
  state.invites = state.invites.filter((i) => i.expires > now);
  let party = state.parties.find((p) => p.members.includes(id));
  const readyReset = /* @__PURE__ */ __name((p) => {
    p.ready = [];
    p.preparing = false;
  }, "readyReset");
  if (m.type === "invite") {
    const target = state.players.find((p) => p.id === m.target);
    if (!target || target.id === id) return fail("That player has left.");
    if (now - (me.lastInvite || 0) < 4e3) return fail("Please wait before sending another invitation.");
    if (target.connected === false || (target.phase && target.phase !== "lobby")) return fail("That runner is away from the lobby.");
    if (party?.preparing) return fail("Return to the lobby before inviting runners.");
    if (state.parties.some((p) => p.members.includes(target.id))) return fail("That player is already in a party.");
    if (party && party.leader !== id) return fail("Only the party leader can invite players.");
    if (party?.members.length >= PARTY_CAPACITY) return fail("Your party is full.");
    if (!party) {
      party = { id: crypto.randomUUID(), leader: id, members: [id], course: "higher-ground", mode: "normal", rules: "race", ready: [], preparing: false };
      state.parties.push(party);
    }
    me.lastInvite = now;
    state.invites = state.invites.filter((i) => i.target !== target.id || i.party !== party.id);
    const invite = { id: crypto.randomUUID(), party: party.id, from: id, target: target.id, expires: now + 3e4 };
    state.invites.push(invite);
    state.revision++;
    return { ok: true, invite };
  }
  if (m.type === "accept" || m.type === "decline") {
    const invite = state.invites.find((i) => i.id === m.invite && i.target === id);
    if (!invite) return fail("This invitation has expired.");
    state.invites = state.invites.filter((i) => i.id !== invite.id);
    if (m.type === "decline") {
      state.revision++;
      return { ok: true };
    }
    const next = state.parties.find((p) => p.id === invite.party);
    if (party || !next || next.members.length >= PARTY_CAPACITY || next.preparing) return fail("That party is no longer available.");
    next.members.push(id);
    readyReset(next);
    state.invites = state.invites.filter((i) => i.target !== id);
    state.revision++;
    return { ok: true };
  }
  if (m.type === "party-create") {
    if (party) return fail("You already have a party.");
    state.parties.push({ id: crypto.randomUUID(), leader: id, members: [id], course: "higher-ground", mode: "normal", rules: "race", ready: [], preparing: false });
    state.revision++;
    return { ok: true };
  }
  if (m.type === "party-leave") {
    if (!party) return { ok: true };
    party.members = party.members.filter((p) => p !== id);
    readyReset(party);
    state.invites = state.invites.filter((i) => i.party !== party.id || i.from !== id);
    if (!party.members.length) state.parties = state.parties.filter((p) => p !== party);
    else if (party.leader === id) party.leader = party.members[0];
    state.revision++;
    return { ok: true };
  }
  if (!party) return fail("Create or join a party first.");
  if (m.type === "party-return" || m.type === "party-restart") {
    if (party.leader !== id) return fail("Only the party leader can move the group.");
    if (party.launching) return fail("Boarding is still being arranged.");
    if (!party.activeFlight) return fail("Your party is already in the lobby.");
    if (m.type === "party-return") {
      party.activeFlight = null;
      readyReset(party);
      state.revision++;
      return { ok: true, returnParty: party.id };
    }
    if (party.members.some(pid => state.players.find(p => p.id === pid)?.connected === false)) return fail("Wait for your party to reconnect, or return to the lobby.");
    party.launching = true;
    state.revision++;
    return { ok: true, depart: { ...party, members: [...party.members] } };
  }
  if (m.type === "party-configure") {
    if (party.preparing) return fail("Return to the lobby before changing the race.");
    if (party.leader !== id) return fail("The party leader chooses the flight.");
    if (!["sanctuary", "hollow", "undertow", "playdate", "small-hours", "final-curtain", "last-bloom", "rupture", "uncrowned", "last-draft", "rep-orca", "on-the-menu", "higher-ground", "castaway", "unravel", "world-war-r", "reposcape", "no-such-place", "the-reverse", "crossing-abyss"].includes(m.course) || !["normal", "nightmare"].includes(m.mode) || !["race", "one-life"].includes(m.rules)) return fail("Choose a valid flight.");
    Object.assign(party, { course: m.course, mode: m.mode, rules: m.rules });
    readyReset(party);
    state.revision++;
    return { ok: true };
  }
  if (m.type === "party-ready") {
    if (party.preparing) return fail("The flight is preparing.");
    party.ready = party.ready.filter((p) => p !== id);
    if (m.ready === true) party.ready.push(id);
    state.revision++;
    return { ok: true };
  }
  if (m.type === "party-depart") {
    if (party.leader !== id) return fail("The party leader starts boarding.");
    if (party.preparing) return fail("This flight is already preparing.");
    if (party.members.some((p) => !party.ready.includes(p) || state.players.find(q => q.id === p)?.connected === false)) return fail("Everyone must be connected and ready.");
    party.launching = true;
    party.preparing = true;
    state.revision++;
    return { ok: true, depart: { ...party, members: [...party.members] } };
  }
  return fail("Unknown airport action.");
}
__name(airportCommand, "airportCommand");
function removeAirportPlayer(state, id) {
  const party = state.parties.find((p) => p.members.includes(id));
  if (party) {
    party.members = party.members.filter((p) => p !== id);
    party.ready = [];
    party.preparing = !!party.activeFlight;
    if (party.leader === id) party.leader = party.members[0];
    if (!party.members.length) state.parties = state.parties.filter((p) => p !== party);
  }
  state.players = state.players.filter((p) => p.id !== id);
  state.invites = state.invites.filter((i) => i.target !== id && i.from !== id);
  state.revision++;
}
__name(removeAirportPlayer, "removeAirportPlayer");
function airportPublicState(state, recipient) {
  return { type: "airport-state", code: state.code, privateRoom: state.privateRoom, revision: state.revision, capacity: AIRPORT_CAPACITY, players: state.players.map(({ id, name, runner, knife, phase, connected }) => ({ id, name, runner, knife, phase: phase || "lobby", connected: connected !== false })), party: state.parties.find((p) => p.members.includes(recipient)) || null, invites: state.invites.filter((i) => i.target === recipient) };
}
__name(airportPublicState, "airportPublicState");

// shared/airport-activities.js
var SPORTS_BOUNDS = { basketball: { minX: -44.5, maxX: -19.5, minZ: -69.5, maxZ: -40.5 }, football: { minX: 18.5, maxX: 45.5, minZ: -34, maxZ: -4 } };
var GOLF_LANES = [24, 32, 40].map((x, i) => ({ id: "golf-" + i, x, z: -51, holeX: x + (i === 1 ? 1.5 : 0), holeZ: -78, minX: x - 2.8, maxX: x + 2.8, minZ: -80.7, maxZ: -47.3 }));
var clamp2 = /* @__PURE__ */ __name((v, a, b) => Math.max(a, Math.min(b, v)), "clamp");
function createAirportActivities() {
  return { time: 0, basket: 0, goals: [0, 0], holes: [0, 0, 0], strokes: [0, 0, 0], balls: [{ id: "basketball", x: -32, y: 0.3, z: -53, r: 0.3 }, { id: "football", x: 32, y: 0.32, z: -19, r: 0.32 }, ...GOLF_LANES.map((g) => ({ id: g.id, x: g.x, y: 0.17, z: g.z, r: 0.11 }))].map((b) => ({ ...b, spawn: { x: b.x, y: b.y, z: b.z }, vx: 0, vy: 0, vz: 0, owner: null, resetAt: 0 })), event: null };
}
__name(createAirportActivities, "createAirportActivities");
function resetAirportBall(b) {
  Object.assign(b, b.spawn, { vx: 0, vy: 0, vz: 0, owner: null, resetAt: 0 });
}
__name(resetAirportBall, "resetAirportBall");
function airportSportAction(state, action, player, owner = "solo") {
  if (!action || !player || ![player.x, player.y, player.z, player.yaw, player.pitch || 0].every(Number.isFinite)) return false;
  const b = state.balls.find((b2) => b2.id === action.id);
  if (!b) return false;
  const close = Math.hypot(b.x - player.x, b.y - (player.y + 0.6), b.z - player.z) < 3;
  if (action.kind === "pickup" && b.id === "basketball" && !b.owner && close) {
    b.owner = owner;
    b.vx = b.vy = b.vz = 0;
    return true;
  }
  if (action.kind === "drop" && b.owner === owner) {
    b.owner = null;
    b.vx = b.vz = 0;
    b.vy = 0;
    return true;
  }
  if (action.kind === "reset" && !b.owner && Math.hypot(b.spawn.x - player.x, b.spawn.z - player.z) < 3) {
    resetAirportBall(b);
    return true;
  }
  if (action.kind !== "strike" || b.resetAt) return false;
  if (b.id === "basketball" && b.owner !== owner || b.id !== "basketball" && (b.owner || !close)) return false;
  const golf = b.id.startsWith("golf-");
  if (golf && Math.hypot(b.vx, b.vz) > 0.6) return false;
  const power = clamp2(Number(action.power) || 0.15, 0.05, 1), yaw = player.yaw, pitch = clamp2(player.pitch || 0, -1.3, 0.5);
  if (b.id === "basketball") {
    b.x = player.x - Math.sin(yaw) * 0.72;
    b.y = player.y + 1.45;
    b.z = player.z - Math.cos(yaw) * 0.72;
    const speed = 6 + power * 9, elevation = clamp2(-pitch + 0.12, 0.12, 1.25);
    b.vx = -Math.sin(yaw) * Math.cos(elevation) * speed;
    b.vz = -Math.cos(yaw) * Math.cos(elevation) * speed;
    b.vy = Math.sin(elevation) * speed;
  } else {
    const speed = golf ? 2 + power * 15 : 7 + power * 15;
    b.vx = -Math.sin(yaw) * speed;
    b.vz = -Math.cos(yaw) * speed;
    b.vy = golf ? 0 : Math.max(0, -pitch) * speed * 0.5;
    if (golf) state.strokes[Number(b.id.slice(-1))]++;
  }
  b.owner = null;
  return true;
}
__name(airportSportAction, "airportSportAction");
function stepAirportActivities(state, dt, players = []) {
  dt = clamp2(dt, 0, 0.1);
  state.time += dt;
  for (const b of state.balls) {
    if (b.resetAt) {
      if (state.time >= b.resetAt) resetAirportBall(b);
      else continue;
    }
    if (b.owner) {
      const p = players.find((p2) => p2.id === b.owner);
      if (!p) {
        resetAirportBall(b);
        continue;
      }
      b.x = p.x - Math.sin(p.yaw) * 0.75;
      b.y = p.y + 1.25;
      b.z = p.z - Math.cos(p.yaw) * 0.75;
      continue;
    }
    const golf = b.id.startsWith("golf-"), floor = golf ? 0.06 : 0, old = { x: b.x, y: b.y, z: b.z };
    b.vy -= 14 * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.z += b.vz * dt;
    if (b.y < floor + b.r) {
      b.y = floor + b.r;
      b.vy = Math.abs(b.vy) < 0.7 ? 0 : -b.vy * (golf ? 0.1 : 0.66);
      const drag = Math.exp(-(golf ? 1.65 : 1.1) * dt);
      b.vx *= drag;
      b.vz *= drag;
    }
    if (golf) {
      const i = Number(b.id.slice(-1)), g = GOLF_LANES[i];
      if (Math.hypot(b.x - g.holeX, b.z - g.holeZ) < 0.48 && Math.hypot(b.vx, b.vz) < 5) {
        state.holes[i]++;
        state.event = { kind: "golf", at: state.time, text: `HOLE ${i + 1} \xB7 ${state.strokes[i]} SHOTS` };
        state.strokes[i] = 0;
        b.resetAt = state.time + 1.5;
        b.y = -0.1;
        continue;
      }
      const obstacles = i === 1 ? [{ x: 32, z: -65, w: 3, d: 1 }] : i === 2 ? [{ x: 38.5, z: -67, w: 2.5, d: 1 }, { x: 41.5, z: -72, w: 2.5, d: 1 }] : [];
      for (const o of obstacles) if (Math.abs(b.x - o.x) < o.w / 2 + b.r && Math.abs(b.z - o.z) < o.d / 2 + b.r) {
        if (Math.abs(old.z - o.z) >= o.d / 2 + b.r) {
          b.z = old.z;
          b.vz *= -0.78;
        } else {
          b.x = old.x;
          b.vx *= -0.78;
        }
      }
    }
    if (b.id === "basketball") {
      for (const z of [-43, -67]) {
        if (old.y > 3.05 && b.y <= 3.05 && b.vy < 0 && Math.hypot(b.x + 32, b.z - z) < 0.58) {
          state.basket++;
          state.event = { kind: "basket", at: state.time, text: "BASKET \xB7 " + state.basket };
        }
        const back = z === -43 ? -41.9 : -68.1;
        if (b.y > 2.65 && b.y < 4.5 && Math.abs(b.x + 32) < 1.55 && (old.z - back) * (b.z - back) < 0) {
          b.z = old.z;
          b.vz *= -0.72;
        }
      }
    }
    if (b.id === "football" && b.y < 2.4 && Math.abs(b.x - 32) < 3.7) {
      const side = b.z < -34 ? 0 : b.z > -4 ? 1 : -1;
      if (side >= 0) {
        state.goals[side]++;
        state.event = { kind: "goal", at: state.time, text: `GOAL \xB7 ${state.goals[0]} : ${state.goals[1]}` };
        b.resetAt = state.time + 1.7;
        continue;
      }
    }
    const bounds = golf ? GOLF_LANES[Number(b.id.slice(-1))] : SPORTS_BOUNDS[b.id];
    for (const axis of ["x", "z"]) {
      if (b.id === "football" && axis === "z" && b.y < 2.4 && Math.abs(b.x - 32) < 3.7) continue;
      const lo = bounds[axis === "x" ? "minX" : "minZ"] + b.r, hi = bounds[axis === "x" ? "maxX" : "maxZ"] - b.r;
      if (b[axis] < lo || b[axis] > hi) {
        b[axis] = clamp2(b[axis], lo, hi);
        b["v" + axis] *= -0.76;
      }
    }
    if (b.y > 26 || ![b.x, b.y, b.z].every(Number.isFinite)) resetAirportBall(b);
  }
}
__name(stepAirportActivities, "stepAirportActivities");

// airport-service.mjs
var send = /* @__PURE__ */ __name((s, m) => {
  try {
    s.send(JSON.stringify(m));
  } catch {
  }
}, "send");
var code = /* @__PURE__ */ __name(() => Array.from(crypto.getRandomValues(new Uint8Array(8)), (n) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[n % 32]).join(""), "code");
var open = /* @__PURE__ */ __name((ctx) => ctx.getWebSockets().filter((s) => s.readyState === 1), "open");
var clean = /* @__PURE__ */ __name((v) => String(v || "Runner").replace(/[^\p{L}\p{N} _.-]/gu, "").slice(0, 20), "clean");
var AirportDirectory = class extends DurableObject {
  static {
    __name(this, "AirportDirectory");
  }
  async allocate(identity) {
    return this.ctx.blockConcurrencyWhile(async () => {
      if (identity.version !== "2.27.1") return { error: "Update COMP-RUN to enter the airport." };
      const now = Date.now(), key = "account:" + identity.userId, previous = await this.ctx.storage.get(key);
      if (previous && now - previous < 2e3) return { error: "Please wait a moment before joining again." };
      await this.ctx.storage.put(key, now);
      await this.ctx.storage.setAlarm(now + 72e5);
      let rooms = await this.ctx.storage.get("rooms") || [];
      if (identity.kind === "join") return this.env.AIRPORT_ROOMS.getByName(identity.code).reserve(identity);
      if (identity.kind === "public") for (const id2 of rooms) {
        const result2 = await this.env.AIRPORT_ROOMS.getByName(id2).reserve(identity);
        if (!result2.error) return result2;
      }
      const id = code(), room = this.env.AIRPORT_ROOMS.getByName(id);
      await room.create(id, identity.kind === "private", identity.lobby);
      const result = await room.reserve(identity);
      if (identity.kind === "public") {
        rooms = [...rooms, id].slice(-100);
        await this.ctx.storage.put("rooms", rooms);
      }
      return result;
    });
  }
  async alarm() {
    await this.ctx.storage.deleteAll();
  }
};
var AirportRoom = class extends DurableObject {
  static {
    __name(this, "AirportRoom");
  }
  constructor(ctx, env) {
    super(ctx, env);
    this.state = null;
    this.tickets = {};
    this.disconnected = {};
    this.activities = createAirportActivities();
    this.lastTick = Date.now();
    this.lastBroadcast = 0;
    ctx.blockConcurrencyWhile(async () => {
      this.state = await ctx.storage.get("airport") || null;
      this.tickets = await ctx.storage.get("tickets") || {};
      this.disconnected = await ctx.storage.get("disconnected") || {};
      this.activities = await ctx.storage.get("activities") || createAirportActivities();
    });
  }
  async create(id, privateRoom, lobby = "airport") {
    if (this.state) throw Error("Airport exists");
    this.state = { ...createAirportState(id, privateRoom), lobby };
    await this.save();
  }
  members() {
    return open(this.ctx).map((ws) => ({ ws, d: ws.deserializeAttachment() })).filter((p) => p.d?.joined);
  }
  sync() {
    if (this.state) this.state.players = [...this.members().map(({ d }) => ({...d, connected: true})), ...Object.values(this.disconnected).map(p => ({...p, connected: false}))];
  }
  expireDisconnected(now = Date.now()) {
    for (const [userId, d] of Object.entries(this.disconnected)) if (d.expires <= now) {
      delete this.disconnected[userId];
      removeAirportPlayer(this.state, d.id);
    }
  }
  async save() {
    if (!this.state) return;
    this.sync();
    await this.ctx.storage.put({ airport: { ...this.state, players: [] }, tickets: this.tickets, disconnected: this.disconnected, activities: this.activities });
    await this.ctx.storage.setAlarm(Date.now() + 6e4);
  }
  async reserve(identity) {
    return this.ctx.blockConcurrencyWhile(async () => {
      if (!this.state) return { error: "This lobby is no longer available." };
      if ((this.state.lobby || "airport") !== (identity.lobby || "airport")) return { error: "This code belongs to a different lobby. Both players need the same COMP-RUN update." };
      const now = Date.now();
      this.expireDisconnected(now);
      this.tickets = Object.fromEntries(Object.entries(this.tickets).filter(([, v]) => v.expires > now));
      if (this.members().some((p) => p.d.userId === identity.userId)) return { error: "Your account is already in this airport." };
      for (const [k, v] of Object.entries(this.tickets)) if (v.userId === identity.userId) delete this.tickets[k];
      if (!this.disconnected[identity.userId] && this.members().length + Object.keys(this.disconnected).length + Object.keys(this.tickets).length >= 12) return { error: "This airport is full." };
      const ticket = crypto.randomUUID();
      this.tickets[ticket] = { ...identity, name: clean(identity.name), expires: now + 6e4 };
      await this.save();
      return { code: this.state.code, ticket, expires: now + 6e4 };
    });
  }
  async fetch() {
    if (!this.state || open(this.ctx).length >= 24) return new Response("Airport unavailable", { status: 409 });
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({ created: Date.now(), window: Date.now(), count: 0, joined: false });
    await this.ctx.storage.setAlarm(Date.now() + 15e3);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }
  broadcast(m) {
    for (const { ws } of this.members()) send(ws, m);
  }
  stateToAll() {
    this.sync();
    for (const { ws, d } of this.members()) send(ws, airportPublicState(this.state, d.id));
  }
  advance(now) {
    this.sync();
    if (this.state?.lobby === "comp-crossing") return;
    let dt = Math.min(0.25, Math.max(0, (now - this.lastTick) / 1e3));
    this.lastTick = now;
    while (dt > 0) {
      const step = Math.min(1 / 120, dt);
      stepAirportActivities(this.activities, step, this.state.players.map((p) => ({ id: p.id, x: p.pose[0], y: p.pose[1], z: p.pose[2], yaw: p.pose[3], pitch: p.pitch || 0 })));
      dt -= step;
    }
  }
  breakHand(d, reason = "released") {
    const link = d.handLink;
    if (!link) return;
    for (const p of this.members()) if (p.d.handLink?.token === link.token) {
      p.d.handLink = null;
      p.d.handIntentAt = 0;
      p.ws.serializeAttachment(p.d);
    }
    this.broadcast({ type: "hand-link", ...link, active: false, reason });
  }
  checkHands(now) {
    let members = this.members();
    for (const { d } of members) if (d.handLink?.host === d.id) {
      const guest = members.find((p) => p.d.id === d.handLink.guest)?.d;
      if (!d.rope || !guest || now - d.poseAt > 650 || now - guest.poseAt > 650 || Math.hypot(...d.pose.slice(0, 3).map((v, i) => v - guest.pose[i])) > 6) this.breakHand(d, "released");
    }
    members = this.members();
    for (let i = 0; i < members.length; i++) for (let j = i + 1; j < members.length; j++) {
      const a = members[i], b = members[j], pair = handCandidate(a.d, b.d, now);
      if (!pair) continue;
      const link = { ...pair, token: crypto.randomUUID(), at: now };
      for (const p of [a, b]) {
        p.d.handLink = link;
        p.d.handIntentAt = 0;
        p.ws.serializeAttachment(p.d);
      }
      this.broadcast({ type: "hand-link", ...link, active: true });
    }
  }
  async webSocketMessage(ws, raw) {
    let d = ws.deserializeAttachment(), m;
    const now = Date.now();
    if (!d || !this.state) return ws.close(1008, "Airport expired");
    if (typeof raw !== "string" || raw.length > 2048) return ws.close(1009, "Message too large");
    try {
      m = JSON.parse(raw);
    } catch {
      return ws.close(1007, "Invalid message");
    }
    if (now - d.window >= 1e3) {
      d.window = now;
      d.count = 0;
    }
    if (++d.count > 45) return ws.close(1008, "Too many updates");
    ws.serializeAttachment(d);
    if (m.type === "hello" && !d.joined) {
      const ticket = this.tickets[m.ticket];
      if (!ticket || ticket.expires <= now || this.members().length >= 12) return ws.close(1008, "Join again from COMP-RUN");
      delete this.tickets[m.ticket];
      const resumed = this.disconnected[ticket.userId];
      delete this.disconnected[ticket.userId];
      const occupied = [...this.members().map(p => p.d), ...Object.values(this.disconnected)];
      d.slot = resumed?.slot ?? Array.from({length: AIRPORT_CAPACITY}, (_, i) => i).find(i => !occupied.some(p => p.slot === i)) ?? 0;
      Object.assign(d, resumed || {}, { joined: true, id: resumed?.id || crypto.randomUUID(), userId: ticket.userId, name: ticket.name, runner: ticket.runner, knife: ticket.knife, phase: resumed?.phase || "lobby", connected: true, pose: resumed?.pose || (this.state.lobby === "comp-crossing" ? [0, 3, 110, 0, 0, 0, 1] : [0, 0.05, 28, 0, 0, 0, 1]), pitch: 0, count: 0, window: now });
      ws.serializeAttachment(d);
      await this.save();
      send(ws, { type: "airport-welcome", id: d.id, resumed: !!resumed, slot: d.slot, serverTime: now });
      this.stateToAll();
      return;
    }
    if (!d.joined) return ws.close(1008, "Join first");
    if (m.type === "ping") {
      send(ws, { type: "pong", sent: m.sent, serverTime: now });
      return;
    }
    if (m.type === "airport-leave") {
      this.breakHand(d);
      d.joined = false;
      ws.serializeAttachment(d);
      delete this.disconnected[d.userId];
      removeAirportPlayer(this.state, d.id);
      await this.save();
      this.stateToAll();
      return ws.close(1000, "Left lobby");
    }
    if (m.type === "party-presence") {
      const party = this.state.parties.find(p => p.members.includes(d.id));
      if (!party?.activeFlight || party.activeFlight !== m.flight || !["joining", "loading", "ready", "racing", "results"].includes(m.phase) || d.phase === m.phase) return;
      d.phase = m.phase;
      ws.serializeAttachment(d);
      this.state.revision++;
      this.stateToAll();
      return;
    }
    if (d.phase && d.phase !== "lobby" && ["pose", "sport", "lift", "hand-grab", "hand-release"].includes(m.type)) return;
    if (this.state.lobby === "comp-crossing" && ["hand-grab", "hand-release"].includes(m.type)) {
      if (d.handLink) {
        this.breakHand(d);
        return;
      }
      d.handIntentAt = m.type === "hand-grab" ? now : 0;
      ws.serializeAttachment(d);
      this.checkHands(now);
      return;
    }
    if (m.type === "pose") {
      if (now - (d.poseAt || 0) < 45 || !Array.isArray(m.pose) || m.pose.length !== 7 || m.pose.some((v) => !Number.isFinite(v) || Math.abs(v) > 5e3)) return;
      d.pose = m.pose;
      d.pitch = Math.max(-1.45, Math.min(1.45, Number(m.pitch) || 0));
      d.poseAt = now;
      if (this.state.lobby === "comp-crossing") {
        const rope = ropeFromPose(m);
        if (rope?.id !== d.rope?.id) d.ropeAt = now;
        d.rope = rope;
        d.velocity = Array.isArray(m.velocity) && m.velocity.length === 3 ? m.velocity.map((v) => Number.isFinite(v) ? Math.max(-60, Math.min(60, v)) : 0) : [0, 0, 0];
      }
      ws.serializeAttachment(d);
      if (this.state.lobby === "comp-crossing") {
        this.checkHands(now);
        d = ws.deserializeAttachment();
      }
      this.advance(now);
      this.broadcast({ type: "airport-pose", id: d.id, pose: d.pose, at: now, rope: d.rope, velocity: d.velocity, handLink: d.handLink, visual: normalizePresentation(m.visual) });
      if (now - this.lastBroadcast > 100) {
        this.lastBroadcast = now;
        this.broadcast({ type: "airport-activities", state: this.activities, at: now });
      }
      return;
    }
    this.advance(now);
    if (this.state.lobby === "comp-crossing" && ["sport", "lift"].includes(m.type)) return;
    if (m.type === "sport") {
      airportSportAction(this.activities, m.action, { x: d.pose[0], y: d.pose[1], z: d.pose[2], yaw: d.pose[3], pitch: d.pitch }, d.id);
      this.broadcast({ type: "airport-activities", state: this.activities, at: now });
      await this.save();
      return;
    }
    if (m.type === "lift") {
      if (Math.hypot(d.pose[0] + 14, d.pose[2] + 27) > 9) return;
      if (now - (this.state.liftAt || 0) < 17e3) return;
      this.state.liftAt = now;
      this.broadcast({ type: "airport-lift", at: now });
      await this.save();
      return;
    }
    const result = airportCommand(this.state, d.id, m, now);
    const updated = this.state.players.find((p) => p.id === d.id);
    if (updated?.lastInvite) {
      d.lastInvite = updated.lastInvite;
      ws.serializeAttachment(d);
    }
    if (!result.ok) {
      send(ws, { type: "error", message: result.error });
      return;
    }
    if (result.returnParty) {
      const party = this.state.parties.find(p => p.id === result.returnParty);
      for (const p of this.members()) if (party.members.includes(p.d.id)) {
        p.d.phase = "lobby"; p.d.handLink = null; p.d.handIntentAt = 0;
        p.ws.serializeAttachment(p.d);
        send(p.ws, {type: "airport-return"});
      }
      for (const d of Object.values(this.disconnected)) if (party.members.includes(d.id)) d.phase = "lobby";
    }
    if (result.depart) {
      const flight = code(), party = result.depart, roster = this.members().filter((p) => party.members.includes(p.d.id)).map((p) => ({ ...p.d }));
      try {
        if (roster.length !== party.members.length) throw Error("Party is reconnecting");
        const admissions = await this.env.VERIFIED_RACES.getByName(flight).create({ code: flight, course: party.course, mode: party.mode, rules: party.rules, players: roster, leader: party.leader });
        const current = this.state.parties.find(p => p.id === party.id);
        if (current) { current.activeFlight = flight; current.launching = false; }
        for (const { ws: s, d: a } of this.members()) if (admissions[a.id]) {
          this.breakHand(a, "boarding"); a.handLink = null; a.handIntentAt = 0; a.phase = "joining";
          s.serializeAttachment(a);
          send(s, { type: "airport-flight", code: flight, ticket: admissions[a.id], course: party.course, mode: party.mode, rules: party.rules });
        }
      } catch {
        const current = this.state.parties.find((p) => p.id === party.id);
        if (current) { current.preparing = !!current.activeFlight; current.launching = false; }
        send(ws, { type: "error", message: "The flight could not start. Please try again." });
      }
    }
    await this.save();
    this.stateToAll();
  }
  async webSocketClose(ws) {
    const d = ws.deserializeAttachment();
    try {
      ws.close(1e3);
    } catch {
    }
    if (d?.joined && this.state) {
      this.breakHand(d, "disconnected");
      this.sync();
      this.disconnected[d.userId] = {...d, handLink: null, handIntentAt: 0, expires: Date.now() + 90000};
      this.state.revision++;
      for (const b of this.activities.balls) if (b.owner === d.id) b.owner = null;
      await this.save();
      this.stateToAll();
    }
  }
  async webSocketError(ws) {
    await this.webSocketClose(ws);
  }
  async alarm() {
    const now = Date.now();
    for (const ws of open(this.ctx)) {
      const d = ws.deserializeAttachment();
      if (!d?.joined && now - d.created > 1e4) ws.close(1008, "Join timed out");
    }
    this.tickets = Object.fromEntries(Object.entries(this.tickets).filter(([, v]) => v.expires > now));
    this.expireDisconnected(now);
    if (!this.members().length && !Object.keys(this.tickets).length && !Object.keys(this.disconnected).length) {
      await this.ctx.storage.deleteAll();
      this.state = null;
    } else await this.save();
  }
};

// verified-race.mjs
import { DurableObject as DurableObject2 } from "cloudflare:workers";

// shared/race-protocol.js
var TICK_RATE = 120;
var TICK_SECONDS = 1 / TICK_RATE;
var FRAME_BYTES = 11;
var MAX_RACE_TICKS = 4 * 60 * 60 * TICK_RATE;
var limitTicks = (course) => course === "crossing-abyss" ? MAX_RACE_TICKS : 30 * 60 * TICK_RATE;
function decodeRaceFrame(bytes, offset, sequences) {
  if (offset < 0 || offset + FRAME_BYTES > bytes.length) throw Error("Incomplete input frame");
  const v = new DataView(bytes.buffer, bytes.byteOffset + offset, FRAME_BYTES), yaw = v.getFloat32(0, true), pitch = v.getFloat32(4, true), moveX = v.getInt8(8), moveZ = v.getInt8(9), flags = v.getUint8(10);
  if (!Number.isFinite(yaw) || !Number.isFinite(pitch) || Math.abs(yaw) > Math.PI + 1e-6 || Math.abs(pitch) > 1.450001 || Math.abs(moveX) > 1 || Math.abs(moveZ) > 1) throw Error("Invalid input frame");
  for (const [k, bit] of [["jumpSeq", 4], ["slideSeq", 8], ["interactSeq", 16]]) if (flags & bit) sequences[k] = (sequences[k] || 0) + 1;
  return { yaw, pitch, moveX, moveZ, sprint: !!(flags & 1), crouch: !!(flags & 2), crouchOnly: false, ...sequences, jumpHeld: !!(flags & 32), interactHeld: !!(flags & 64), restart: !!(flags & 128) };
}
__name(decodeRaceFrame, "decodeRaceFrame");
function base64ToBytes(s) {
  if (typeof s !== "string" || !/^[A-Za-z0-9+/]*={0,2}$/.test(s)) throw Error("Invalid input encoding");
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
__name(base64ToBytes, "base64ToBytes");

// verified-race.mjs
var send2 = /* @__PURE__ */ __name((ws, m) => {
  try {
    ws.send(JSON.stringify(m));
  } catch {
  }
}, "send");
var VerifiedRaceRoom = class extends DurableObject2 {
  static {
    __name(this, "VerifiedRaceRoom");
  }
  constructor(ctx, env) {
    super(ctx, env);
    this.room = null;
    ctx.blockConcurrencyWhile(async () => {
      this.room = await ctx.storage.get("verified") || null;
    });
  }
  async create(config) {
    if (this.room) throw Error("Flight exists");
    const tickets = {};
    this.room = { ...config, players: config.players.map((p) => {
      const ticket = tickets[p.id] = crypto.randomUUID();
      return { id: p.id, userId: p.userId, name: p.name, runner: p.runner, knife: p.knife, ticket, joined: false, loaded: false, ticks: 0, finished: false };
    }), round: 1, state: "loading", startAt: 0, created: Date.now(), results: [] };
    await this.save();
    await this.ctx.storage.setAlarm(Date.now() + 6e4);
    return tickets;
  }
  async save() {
    await this.ctx.storage.put("verified", this.room);
  }
  members() {
    return this.ctx.getWebSockets().filter((s) => s.readyState === 1).map((ws) => ({ ws, d: ws.deserializeAttachment() })).filter((p) => p.d?.id);
  }
  broadcast(m) {
    for (const { ws } of this.members()) send2(ws, m);
  }
  state() {
    const r = this.room;
    return { type: "room", code: r.code, host: r.leader, course: r.course, mode: r.mode, rules: r.rules, round: r.round, state: r.state, startAt: r.startAt, serverTime: Date.now(), results: r.results, players: r.players.map(({ id, name, runner, knife, joined, loaded, finished }) => ({ id, name, runner, knife, joined, ready: loaded, finished })) };
  }
  async fetch() {
    if (!this.room || this.room.state !== "loading" || this.ctx.getWebSockets().length >= 16) return new Response("Flight unavailable", { status: 409 });
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({ created: Date.now(), window: Date.now(), count: 0 });
    return new Response(null, { status: 101, webSocket: pair[0] });
  }
  async webSocketMessage(ws, raw) {
    const now = Date.now(), d = ws.deserializeAttachment();
    if (!this.room || typeof raw !== "string" || raw.length > 6e3) return ws.close(1009, "Invalid message");
    let m;
    try {
      m = JSON.parse(raw);
    } catch {
      return ws.close(1007, "Invalid message");
    }
    if (now - d.window >= 1e3) {
      d.window = now;
      d.count = 0;
    }
    if (++d.count > 65) return ws.close(1008, "Too many updates");
    ws.serializeAttachment(d);
    if (m.type === "hello" && !d.id) {
      const p2 = this.room.players.find((p3) => p3.ticket === m.ticket && !p3.joined);
      if (!p2 || now - this.room.created > 6e4) return ws.close(1008, "Invalid boarding pass");
      p2.joined = true;
      delete p2.ticket;
      d.id = p2.id;
      ws.serializeAttachment(d);
      await this.save();
      send2(ws, { type: "welcome", id: p2.id });
      this.broadcast(this.state());
      return;
    }
    const p = this.room.players.find((p2) => p2.id === d.id);
    if (!p) return ws.close(1008, "Board first");
    if (m.type === "ping") {
      send2(ws, { type: "pong", sent: m.sent, serverTime: now });
      return;
    }
    if (m.type === "loaded" && this.room.state === "loading") {
      if (m.protocol !== 3 || m.version !== "2.27.1") return this.fail("Players have different game versions. Reopen COMP-RUN.");
      p.loaded = true;
      await this.save();
      if (this.room.players.every((p2) => p2.joined && p2.loaded)) {
        this.room.state = "racing";
        this.room.startAt = now + 5e3;
        await this.save();
        await this.ctx.storage.setAlarm(this.room.startAt + limitTicks(this.room.course) / TICK_RATE * 1000);
      }
      this.broadcast(this.state());
      return;
    }
    if (this.room.state !== "racing" || p.finished || m.round !== this.room.round) return;
    if (m.type === "inputs") {
      let bytes;
      try {
        bytes = base64ToBytes(m.data);
      } catch {
        return this.reject(p, "Invalid movement data");
      }
      const count = bytes.length / FRAME_BYTES, end = p.ticks + count;
      if (!Number.isSafeInteger(count) || count < 1 || count > 120 || m.from !== p.ticks || end > limitTicks(this.room.course) || end > Math.max(0, Math.floor((now - this.room.startAt + 300) * 0.12))) return this.reject(p, "Movement timing did not match the race clock");
      if (now - this.room.startAt - end / 120 * 1e3 > 5e3) return this.reject(p, "Connection was too far behind to verify this race");
      try {
        for (let i = 0; i < count; i++) decodeRaceFrame(bytes, i * FRAME_BYTES, {});
      } catch {
        return this.reject(p, "Invalid controls");
      }
      await this.ctx.storage.put("input:" + p.id + ":" + String(p.ticks).padStart(7, "0"), bytes);
      p.ticks = end;
      await this.save();
      return;
    }
    if (m.type === "pose") {
      if (now < this.room.startAt || now - (d.poseAt || 0) < 50 || !Array.isArray(m.pose) || m.pose.length !== 7 || m.pose.some((v) => !Number.isFinite(v) || Math.abs(v) > 1e6)) return;
      d.poseAt = now;
      ws.serializeAttachment(d);
      this.broadcast({ type: "pose", id: p.id, round: 1, at: now, pose: m.pose, equipment: m.equipment === 2 ? 2 : 0, visual: normalizePresentation(m.visual) });
      return;
    }
    if (m.type === "respawn") {
      this.broadcast({ type: "respawn", id: p.id, round: 1 });
      return;
    }
    if (m.type === "finish") {
      if (!m.finished) return this.reject(p, "Run ended");
      if (m.ticks !== p.ticks || p.ticks < 1) return this.reject(p, "Incomplete movement history");
      p.finished = true;
      p.verifying = true;
      await this.save();
      this.broadcast(this.state());
      this.ctx.waitUntil(this.verify(p.id));
      return;
    }
  }
  async verify(id) {
    const p = this.room.players.find((p2) => p2.id === id);
    let result;
    try {
      const chunks = await this.ctx.storage.list({ prefix: "input:" + id + ":" }), bytes = new Uint8Array(p.ticks * FRAME_BYTES);
      let offset = 0;
      for (const chunk of chunks.values()) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      if (offset !== bytes.length) throw Error("Incomplete replay");
      const response = await this.env.RACE_VERIFIER.fetch("https://verifier/verify", { method: "POST", headers: { "X-Course": this.room.course, "X-Mode": this.room.mode, "X-Rules": this.room.rules, "X-Ticks": String(p.ticks) }, body: bytes });
      if (!response.ok) throw Error("Verification unavailable");
      result = await response.json();
    } catch {
      result = { verified: false, reason: "Verification could not complete. This result was not ranked." };
    }
    p.verifying = false;
    const row = { id: p.id, name: p.name, finished: result.verified === true, verified: result.verified === true, time: result.verified ? result.time : null, deaths: result.deaths || 0, reason: result.reason || null };
    if (result.verified) {
      row.proof = crypto.randomUUID();
      await this.ctx.storage.put("proof:" + row.proof, { ...result, userId: p.userId, course: this.room.course, mode: this.room.mode, rules: this.room.rules, created: Date.now() });
    }
    this.room.results.push(row);
    if (this.room.players.every((p2) => p2.finished && !p2.verifying)) this.room.state = "results";
    await this.save();
    this.broadcast(this.state());
  }
  async verifiedResult(proof, userId) {
    const result = await this.ctx.storage.get("proof:" + proof);
    return result?.userId === userId ? result : null;
  }
  async reject(p, reason) {
    p.finished = true;
    p.verifying = false;
    this.room.results.push({ id: p.id, name: p.name, finished: false, time: null, reason });
    if (this.room.players.every((p2) => p2.finished && !p2.verifying)) this.room.state = "results";
    await this.save();
    this.broadcast(this.state());
  }
  async fail(reason) {
    this.room.state = "results";
    for (const p of this.room.players) if (!p.finished) {
      p.finished = true;
      this.room.results.push({ id: p.id, name: p.name, finished: false, time: null, reason });
    }
    await this.save();
    this.broadcast(this.state());
  }
  async webSocketClose(ws) {
    const d = ws.deserializeAttachment();
    try {
      ws.close(1e3);
    } catch {
    }
    const p = this.room?.players.find((p2) => p2.id === d?.id);
    if (p && !p.finished) {
      if (this.room.state === "loading") await this.fail("A player disconnected before boarding completed.");
      else await this.reject(p, "Disconnected");
    }
  }
  async webSocketError(ws) {
    await this.webSocketClose(ws);
  }
  async alarm() {
    if (!this.room) return;
    if (this.room.state === "loading") {
      await this.fail("Boarding timed out. Everyone must load the map.");
      await this.ctx.storage.setAlarm(Date.now() + 864e5);
    } else if (this.room.state === "racing") {
      await this.fail("Race time limit reached");
      await this.ctx.storage.setAlarm(Date.now() + 864e5);
    } else {
      for (const { ws } of this.members()) ws.close(1e3, "Flight ended");
      await this.ctx.storage.deleteAll();
      this.room = null;
    }
  }
};

// worker.mjs
var VERSION = "2.27.1";
var CLIENT_VERSIONS = /* @__PURE__ */ new Set(["2.9.0", "2.9.1", "2.9.2", "2.10.0", "2.11.0", "2.12.0", "2.12.1", "2.13.0", "2.14.0", "2.15.0", "2.15.1", "2.15.2", "2.16.0", "2.16.1", "2.17.0", "2.17.1", "2.18.0", "2.18.1", VERSION]);
var MAX_PLAYERS = 8;
var TTL = 2 * 60 * 60 * 1e3;
var COURSES = /* @__PURE__ */ new Set(["sanctuary", "hollow", "undertow", "playdate", "small-hours", "final-curtain", "last-bloom", "rupture", "uncrowned", "last-draft", "rep-orca", "on-the-menu", "higher-ground", "castaway", "unravel", "world-war-r", "reposcape", "no-such-place", "the-reverse", "crossing-abyss"]);
var supportsMap = /* @__PURE__ */ __name((course, version) => course === "unravel" || course === "world-war-r" ? version === VERSION : course === "castaway" ? ["2.16.1", "2.17.0", VERSION].includes(version) : course === "higher-ground" || course === "on-the-menu" ? ["2.14.0", "2.15.0", "2.15.1", "2.15.2", "2.16.0", "2.16.1", "2.17.0", VERSION].includes(version) : course === "rep-orca" ? ["2.10.0", "2.11.0", "2.12.0", "2.12.1", "2.13.0", "2.14.0", "2.15.0", "2.15.1", "2.15.2", "2.16.0", "2.16.1", "2.17.0", VERSION].includes(version) : CLIENT_VERSIONS.has(version), "supportsMap");
var MODES = /* @__PURE__ */ new Set(["normal", "nightmare"]);
var ORIGINS = /* @__PURE__ */ new Set(["https://comp-run.fluffy-star-4855.chatgpt.site", "https://repocompany.uk", "https://www.repocompany.uk", "http://127.0.0.1:4193"]);
var json = /* @__PURE__ */ __name((value, status = 200, origin) => Response.json(value, { status, headers: { "Cache-Control": "no-store", ...ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {} } }), "json");
var cleanName = /* @__PURE__ */ __name((value) => String(value || "Runner").normalize("NFKC").replace(/[^\p{L}\p{N} _.-]/gu, "").trim().slice(0, 20) || "Runner", "cleanName");
var sockets = /* @__PURE__ */ __name((ctx) => ctx.getWebSockets().filter((ws) => ws.readyState === 1), "sockets");
var send3 = /* @__PURE__ */ __name((ws, value) => {
  try {
    ws.send(JSON.stringify(value));
  } catch {
  }
}, "send");
var RaceService = class extends WorkerEntrypoint {
  static {
    __name(this, "RaceService");
  }
  async airportTicket(identity) {
    const crossing = identity.version === "2.27.1-crossing1", lobby = crossing ? "comp-crossing" : "airport";
    return this.env.AIRPORT_DIRECTORY.getByName(crossing ? "comp-crossing-v1" : "airports-v1").allocate({ ...identity, lobby, version: crossing ? VERSION : identity.version, knife: cleanCompRunKnife(identity.knife || {}), runner: typeof identity.runner === "string" && /^[a-z0-9-]{1,40}$/.test(identity.runner) ? identity.runner : "runner-01" });
  }
  async verifiedResult(code2, proof, userId) {
    if (!/^[A-HJ-NP-Z2-9]{8}$/.test(code2 || "") || !/^[-a-f0-9]{36}$/.test(proof || "")) return null;
    return this.env.VERIFIED_RACES.getByName(code2).verifiedResult(proof, userId);
  }
  async fetch(request) {
    const env = this.env;
    const origin = request.headers.get("Origin"), path = new URL(request.url).pathname.replace(/^.*\/races/, "");
    const launcherCreate = origin === null && path === "/new" && request.method === "POST" && request.headers.get("X-Comp-Run-Client") === "1";
    const secured = path.match(/^\/(airport|flight)\/([A-HJ-NP-Z2-9]{8})$/);
    if (secured && request.method === "GET" && request.headers.get("Upgrade")?.toLowerCase() === "websocket" && (ORIGINS.has(origin) || origin === "null" || origin === null)) return env[secured[1] === "airport" ? "AIRPORT_ROOMS" : "VERIFIED_RACES"].getByName(secured[2]).fetch(request);
    if (!ORIGINS.has(origin) && !launcherCreate) return json({ error: "Open multiplayer from COMP-RUN." }, 403);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-Comp-Run-Client", Vary: "Origin", "Access-Control-Max-Age": "600" } });
    if (env.ROOM_LIMIT && !(await env.ROOM_LIMIT.limit({ key: request.headers.get("CF-Connecting-IP") || "local" })).success) return json({ error: "Please wait a minute before opening another room." }, 429, origin);
    if (path === "/new" && request.method === "POST") {
      const bytes = crypto.getRandomValues(new Uint8Array(8)), alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const code2 = Array.from(bytes, (n) => alphabet[n % 32]).join("");
      const stub = env.RACE_ROOMS.getByName(code2), key = crypto.randomUUID();
      await stub.create(code2, key);
      return json({ code: code2, key, version: VERSION }, 201, origin);
    }
    const match = path.match(/^\/([A-HJ-NP-Z2-9]{8})$/);
    if (match && request.method === "GET" && request.headers.get("Upgrade")?.toLowerCase() === "websocket") return env.RACE_ROOMS.getByName(match[1]).fetch(request);
    return json({ error: "Race room not found." }, 404, origin);
  }
};
var RaceRoom = class extends DurableObject3 {
  static {
    __name(this, "RaceRoom");
  }
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.room = null;
    ctx.blockConcurrencyWhile(async () => {
      this.room = await ctx.storage.get("room") || null;
    });
  }
  async create(code2, key) {
    if (this.room) throw Error("Invitation collision. Try again.");
    this.room = { code: code2, key, host: null, course: "playdate", mode: "normal", rules: "one-life", state: "lobby", round: 0, startAt: 0, createdAt: Date.now(), expiresAt: Date.now() + TTL, results: [] };
    await this.persist();
    await this.ctx.storage.setAlarm(this.room.expiresAt);
  }
  async persist() {
    await this.ctx.storage.put("room", this.room);
  }
  async fetch() {
    if (!this.room || Date.now() > this.room.expiresAt) return json({ error: "This room has expired." }, 404);
    if (sockets(this.ctx).length >= MAX_PLAYERS) return json({ error: "This room is full." }, 409);
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({ id: crypto.randomUUID(), joined: false, createdAt: Date.now(), lastAt: 0, count: 0, window: Date.now(), poseAt: 0 });
    return new Response(null, { status: 101, webSocket: pair[0] });
  }
  members() {
    return sockets(this.ctx).map((ws) => ({ ws, data: ws.deserializeAttachment() })).filter((m) => m.data?.joined);
  }
  publicState() {
    const r = this.room;
    return { type: "room", code: r.code, host: r.host, course: r.course, mode: r.mode, rules: r.rules || "one-life", state: r.state, round: r.round, startAt: r.startAt, serverTime: Date.now(), version: VERSION, results: r.results, players: this.members().map(({ data: d }) => ({ id: d.id, name: d.name, runner: d.runner, knife: d.knife || null, ready: d.ready, finished: d.finished, deaths: d.deaths || 0 })) };
  }
  broadcast(value, except) {
    for (const ws of sockets(this.ctx)) if (ws !== except) send3(ws, value);
  }
  async webSocketMessage(ws, raw) {
    const d = ws.deserializeAttachment(), now = Date.now();
    if (!d || !this.room) return ws.close(1008, "Room expired.");
    if (typeof raw !== "string" || raw.length > 1024) return ws.close(1009, "Message too large.");
    if (now - d.window >= 1e3) {
      d.window = now;
      d.count = 0;
    }
    if (++d.count > 35) return ws.close(1008, "Too many updates.");
    ws.serializeAttachment(d);
    let m;
    try {
      m = JSON.parse(raw);
    } catch {
      return ws.close(1007, "Invalid message.");
    }
    if (!m || typeof m !== "object") return;
    const error = /* @__PURE__ */ __name((message) => send3(ws, { type: "error", message }), "error");
    if (m.type === "hello" && !d.joined) {
      if (!CLIENT_VERSIONS.has(m.version)) {
        error("Update COMP-RUN before joining this room.");
        return ws.close(1008, "Version mismatch.");
      }
      if (this.room.state !== "lobby") {
        error("This race has started. Join after the next round.");
        return ws.close(1008, "Race started.");
      }
      if (!supportsMap(this.room.course, m.version)) {
        error("Update COMP-RUN to race this map.");
        return ws.close(1008, "Map version mismatch.");
      }
      d.version = m.version;
      d.joined = true;
      d.name = cleanName(m.name);
      d.runner = typeof m.runner === "string" && /^[a-z0-9-]{1,40}$/.test(m.runner) ? m.runner : "runner-01";
      d.knife = m.knife ? cleanCompRunKnife(m.knife) : null;
      d.ready = false;
      d.finished = false;
      if (!this.room.host && m.key === this.room.key) this.room.host = d.id;
      ws.serializeAttachment(d);
      await this.persist();
      send3(ws, { type: "welcome", id: d.id });
      this.broadcast(this.publicState());
      return;
    }
    if (!d.joined) return ws.close(1008, "Join the room first.");
    if (m.type === "ping") {
      send3(ws, { type: "pong", sent: m.sent, serverTime: now });
      return;
    }
    const host = this.room.host === d.id;
    if (m.type === "configure" && host && this.room.state === "lobby") {
      if (!COURSES.has(m.course) || !MODES.has(m.mode) || !["one-life", "race"].includes(m.rules || "one-life")) return error("Choose a map and difficulty.");
      if (this.members().some((p) => !supportsMap(m.course, p.data.version))) return error("Every runner needs the update for this map.");
      this.room.course = m.course;
      this.room.mode = m.mode;
      this.room.rules = m.rules || "one-life";
      for (const { ws: s, data: a } of this.members()) {
        a.ready = false;
        s.serializeAttachment(a);
      }
      await this.persist();
      this.broadcast(this.publicState());
      return;
    }
    if (m.type === "ready" && this.room.state === "lobby") {
      if (m.knife) d.knife = cleanCompRunKnife(m.knife);
      if (typeof m.runner === "string" && /^[a-z0-9-]{1,40}$/.test(m.runner)) d.runner = m.runner;
      d.ready = m.ready === true;
      ws.serializeAttachment(d);
      this.broadcast(this.publicState());
      return;
    }
    if (m.type === "start" && host && this.room.state === "lobby") {
      const members = this.members();
      if (members.length < 2 || members.some((p) => !p.data.ready)) return error("At least two runners must be ready.");
      this.room.state = "racing";
      this.room.round++;
      this.room.startAt = now + 5e3;
      this.room.results = [];
      for (const { ws: s, data: a } of members) {
        a.finished = false;
        a.deaths = 0;
        a.poseAt = 0;
        s.serializeAttachment(a);
      }
      await this.persist();
      this.broadcast(this.publicState());
      return;
    }
    if (m.type === "pose" && this.room.state === "racing" && !d.finished && m.round === this.room.round) {
      if (now < this.room.startAt || now - d.poseAt < 55) return;
      if (!Array.isArray(m.pose) || m.pose.length !== 7 || m.pose.some((v) => !Number.isFinite(v) || Math.abs(v) > 1e6)) return;
      d.poseAt = now;
      ws.serializeAttachment(d);
      this.broadcast({ type: "pose", id: d.id, round: this.room.round, at: now, pose: m.pose, equipment: m.equipment === 2 ? 2 : 0, visual: normalizePresentation(m.visual) }, ws);
      return;
    }
    if (m.type === "respawn" && this.room.rules === "race" && this.room.state === "racing" && !d.finished && m.round === this.room.round) {
      if (now < this.room.startAt || now - (d.respawnAt || 0) < 300) return;
      d.respawnAt = now;
      d.deaths = (d.deaths || 0) + 1;
      d.poseAt = 0;
      ws.serializeAttachment(d);
      this.broadcast({ type: "respawn", id: d.id, round: this.room.round, deaths: d.deaths });
      return;
    }
    if (m.type === "finish" && this.room.state === "racing" && !d.finished && m.round === this.room.round) {
      const elapsed = now - this.room.startAt;
      if (elapsed < 0) return;
      const finished = m.finished === true && Number.isFinite(m.time) && m.time >= 10 && m.time * 1e3 <= elapsed + 1200;
      d.finished = true;
      ws.serializeAttachment(d);
      this.room.results.push({ id: d.id, name: d.name, finished, time: finished ? this.room.rules === "race" ? elapsed / 1e3 : m.time : null, deaths: d.deaths || 0 });
      if (this.members().every((p) => p.data.finished)) this.room.state = "results";
      await this.persist();
      this.broadcast(this.publicState());
      return;
    }
    if (m.type === "rematch" && host && this.room.state === "results") {
      this.room.state = "lobby";
      this.room.startAt = 0;
      this.room.results = [];
      for (const { ws: s, data: a } of this.members()) {
        a.ready = false;
        a.finished = false;
        s.serializeAttachment(a);
      }
      await this.persist();
      this.broadcast(this.publicState());
      return;
    }
    ws.serializeAttachment(d);
  }
  async webSocketClose(ws, code2, reason, wasClean) {
    try {
      ws.close(code2 === 1006 ? 1001 : code2, reason);
    } catch {
    }
    if (!this.room) return;
    const d = ws.deserializeAttachment(), others = this.members().filter((p) => p.ws !== ws);
    if (d?.joined && !others.length) {
      await this.ctx.storage.deleteAll();
      await this.ctx.storage.deleteAlarm();
      this.room = null;
      return;
    }
    if (d?.joined && this.room.state === "racing" && !d.finished) this.room.results.push({ id: d.id, name: d.name, finished: false, time: null });
    if (this.room.host === d?.id) this.room.host = others[0]?.data.id || null;
    if (this.room.state === "racing" && others.every((p) => p.data.finished)) this.room.state = "results";
    await this.persist();
    this.broadcast(this.publicState(), ws);
  }
  async webSocketError(ws) {
    try {
      ws.close(1011, "Connection lost.");
    } catch {
    }
  }
  async alarm() {
    for (const ws of sockets(this.ctx)) ws.close(1e3, "Room expired.");
    await this.ctx.storage.deleteAll();
    this.room = null;
  }
};
export {
  AirportDirectory,
  AirportRoom,
  RaceRoom,
  VerifiedRaceRoom,
  RaceService as default
};
//# sourceMappingURL=worker.js.map
