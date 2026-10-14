'use strict';
const path = require('node:path');
module.exports = function configuration(resourceRoot) {
  const releaseOrigin = 'https://repo-company-games.pages.dev';
  return {
    portalOrigin: 'https://repocompany.uk',
    authOrigin: 'https://hvdrwmjieguurxvrgzfu.supabase.co',
    // This is the existing public browser key. No service-role credential belongs in the launcher.
    authKey: 'sb_publishable_bln84LaJ8iYmnkYK9mh0Pg_XxP7O1OZ',
    approvedOrigins: [
      'https://repocompany.uk', 'https://www.repocompany.uk',
      'https://morogue.repocompany.uk', 'https://moratales.repocompany.uk',
      'https://manager.repocompany.uk', 'https://dragonbound.repocompany.uk',
      'https://hvdrwmjieguurxvrgzfu.supabase.co', 'https://cdn.jsdelivr.net',
      'https://fonts.googleapis.com', 'https://fonts.gstatic.com', releaseOrigin
    ],
    // Releases are authenticated by the pinned public key; private signing keys never ship.
    launcherUpdates: {
      url: 'https://repocompany.uk/releases/launcher/latest.json',
      keyId: 'repo-launcher-2026-01',
      publicKey: '-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEApVjnXw0h1vgA/hCRlRYTC1S/t/XxakuplZnsA8rqKRA=\n-----END PUBLIC KEY-----\n',
      minSequence: 6,
      publisherName: 'Repo Company Update Key'
    },
    discordApplications: {
      moratales: { clientId: '1557490171614863390', name: 'MoraTales' },
      morogue: { clientId: '1559743063382036522', name: 'Morogue' },
      manager: { clientId: '1559743304856510494', name: 'Velmora Manager' }
    },
    games: [
      {
        id: 'morogue', name: 'Morogue', genre: 'Action roguelite',
        tagline: 'Survive the night. Face the Uncrowned.',
        description: 'Forge your build, master your weapons and face the night in Copper Kettle Square.',
        origin: 'https://morogue.repocompany.uk', entry: 'interface/vampire-survivor/index.html',
        delivery: 'download', installable: true, manifestUrl: releaseOrigin + '/morogue/manifest.json',
        approvedOrigins: [releaseOrigin],
        art: 'assets/morogue-cover-art.png', logo: 'assets/morogue-logo.png'
      },
      { id: 'moratales', name: 'Moratales', genre: 'Story & life sim', tagline: 'Your next chapter in Velmora.', description: 'A café, a town and stories to bring home.', origin: 'https://moratales.repocompany.uk', entry: 'preview.html', delivery: 'download', installable: true, manifestUrl: releaseOrigin + '/moratales/manifest.json', approvedOrigins: [releaseOrigin], art: 'assets/moratales-cover-source.png', logo: 'assets/moratales-logo.png' },
      { id: 'manager', name: 'Velmora Manager', genre: 'Fantasy sports management', tagline: 'Build your club. Shape its future.', description: 'Lead your club through a season in Velmora.', origin: 'https://manager.repocompany.uk', entry: 'index.html', delivery: 'download', installable: true, manifestUrl: releaseOrigin + '/manager/manifest.json', approvedOrigins: [releaseOrigin], art: 'assets/manager-menu.png', logo: 'assets/manager-logo-clean.png' },
      { id: 'dragonbound', name: 'Dragonbound', genre: 'Fantasy adventure', tagline: 'A new journey awaits.', description: 'Discover another adventure from the world of Velmora.', origin: 'https://dragonbound.repocompany.uk', delivery: 'web', installable: false, art: 'assets/dragonbound-menu.png' }
    ],
    // These are the website's existing demo routes. Embedded titles retain the
    // account bridge and runtime inside its original dashboard overlay.
    demos: [
      { id: 'dragonbound', name: 'Dragonbound', origin: 'https://dragonbound.repocompany.uk', webEntry: 'https://dragonbound.repocompany.uk/', embedded: true, runtime: 'dragonbound' },
      ...[
        ['diver', 'Repo Diver'], ['goblin', 'Goblin Bomb Party'],
        ['rooftops', 'Repo Rooftops'], ['seas', 'High Seas'], ['sports', 'Repo Sports']
      ].map(([id, name]) => ({ id, name, origin: 'https://repocompany.uk', webEntry: 'https://repocompany.uk/legacy-runtime.html?dashboard=' + id, embedded: true }))
    ]
  };
};
