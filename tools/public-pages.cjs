'use strict';

// Public descriptions use the same names and game details as the collection.
const origin = 'https://repocompany.uk';
const description = 'Repo Company is your home for games and good company. Keep your games in one place and connect with friends on Wibs, our chat and community platform.';
const pages = [
  {
    path: '/games/moratales/', name: 'Moratales', type: 'VideoGame', genre: 'Story & life simulation',
    title: 'Moratales — Story & Life Sim | Repo Company',
    description: 'Discover Moratales, a story and life simulation game set in Velmora. Run your café, grow ingredients and explore with friends and animal companions.',
    lead: 'Make a life in Velmora.',
    copy: 'Run your café, grow ingredients and explore new places, with friends and animal companions along the way. Moratales brings story and everyday life together in the world of Velmora.',
    details: ['Story & life sim', 'Solo / 2-player co-op'], action: '/Moratales', actionLabel: 'Open Moratales',
    image: '/assets/discover/moratales-town.webp', imageAlt: 'Copper Kettle Square in Moratales',
    shots: [['moratales-explore.webp', 'Explore Velmora'], ['moratales-cafe.webp', 'Café life']],
    features: [['Your café', 'Grow ingredients and make the café part of your life in Velmora.'], ['A world to explore', 'Visit new places and spend time with friends and animal companions.'], ['Play together', 'Make your way through Moratales solo or in two-player co-op.']]
  },
  {
    path: '/games/velmora-manager/', name: 'Velmora Manager', type: 'VideoGame', genre: 'Sports management',
    title: 'Velmora Manager — Fantasy Sports Management | Repo Company',
    description: 'Build your club in Velmora Manager. Sign players, train your squad and set your tactics in Repo Company’s fantasy sports management game.',
    lead: 'Build your club. Shape its future.',
    copy: 'Take charge of a club in Velmora. Sign players, train your squad and set the tactics as you chase glory through the season.',
    details: ['Fantasy sports management', 'Career mode'], action: '/VelmoraManager', actionLabel: 'Open Velmora Manager',
    image: '/assets/discover/manager-central.webp', imageAlt: 'The club management screen in Velmora Manager',
    shots: [['manager-squad.webp', 'Build your squad'], ['manager-matchday.webp', 'Prepare for matchday']],
    features: [['Build your squad', 'Sign players and shape the team you want to manage.'], ['Prepare for matchday', 'Train your squad and choose the tactics for the next match.'], ['Follow your career', 'Take your club through the season in career mode.']]
  },
  {
    path: '/games/morogue/', name: 'Morogue', type: 'VideoGame', genre: 'Action roguelite',
    title: 'Morogue — Action Roguelite | Repo Company',
    description: 'Morogue is a solo action roguelite in the Moratales universe. Forge your build, master your weapons and face twelve bosses before challenging the Uncrowned.',
    lead: 'Survive the night. Face the Uncrowned.',
    copy: 'Survive the night in the Moratales universe. Forge your build, master your weapons and face twelve bosses before challenging the Uncrowned.',
    details: ['Action roguelite', 'Solo'], action: '/Morogue', actionLabel: 'Open Morogue',
    image: '/assets/discover/morogue-uncrowned.webp', imageAlt: 'Facing the Uncrowned in Morogue',
    shots: [['morogue-kiln.webp', 'Into the Kiln'], ['morogue-upgrades.webp', 'Forge your build']],
    features: [['Forge your build', 'Choose upgrades and develop your build as you play.'], ['Master your weapons', 'Find your approach to surviving the night.'], ['Face the Uncrowned', 'Take on twelve bosses before the final challenge.']]
  },
  {
    path: '/wibs/', name: 'Wibs', type: 'WebApplication',
    title: 'Wibs — Chat, Calls & Community | Repo Company',
    description: 'Wibs is Repo Company’s chat and community platform. Send direct messages, join group chats and voice calls, and keep up with what friends are playing.',
    lead: 'Your friends, in good company.',
    copy: 'Wibs is the chat and community platform inside Repo Company. Catch up in community channels, send direct messages and join voice calls while you play.',
    details: ['Chat & community', 'Web & launcher'], action: '/Wibs', actionLabel: 'Open Wibs',
    icon: '/assets/wibs-icon.svg',
    features: [['Keep in touch', 'Use community channels, direct messages and group chats to stay connected.'], ['Talk while you play', 'Join a Wibs voice call from the website or Repo Company launcher.'], ['Make it yours', 'Use your Repo Company avatar, send Wibs emotes and GIFs, and see your friends’ game activity.']],
    note: 'Log in with your Repo Company account to open your community and messages.'
  },
  {
    path: '/about/reparty/', name: 'Reparty', type: 'WebApplication',
    title: 'Reparty — Listen & Watch Together | Repo Company',
    description: 'Reparty brings shared playlists, YouTube videos and Suno songs to Repo Company. Join a room with friends and keep listening while you play or talk on Wibs.',
    lead: 'Listen and watch together.',
    copy: 'Bring your music and videos into a shared room. Add YouTube videos or Suno songs to the playlist, chat with friends and keep listening while you play or spend time in Wibs.',
    details: ['Shared playlists', 'Web & launcher'], action: '/Reparty', actionLabel: 'Open Reparty',
    icon: '/assets/reparty/reparty-icon.png',
    features: [['A room for everyone', 'Open Reparty to join the main room, or use Rooms to choose another.'], ['Build the playlist', 'Paste a YouTube or Suno link and add it to the room’s queue.'], ['Stay connected', 'Keep listening alongside your games and Wibs calls.']],
    note: 'Log in with your Repo Company account to join Reparty.'
  }
];

module.exports = {origin, description, pages};
