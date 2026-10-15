'use strict';
// Real website presentation and native preload; only account services are fake.
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const fixture = require('./network.cjs'), original = fixture.fetch;
const { serveFile } = require('../../lib/protocol.cjs');
const scripts = new Set(['dashboard-layout.js', 'dashboard-audio.js', 'dashboard-motion.js', 'game-scenes.js', 'homepage.js']);
fixture.fetch = async (input, options) => {
  const request = input instanceof Request ? input : new Request(input, options);
  const url = new URL(request.url);
  if (url.origin === 'https://repocompany.uk' && url.pathname === '/') {
    const account = await (await original(request, options)).text();
    const auth = account.match(/<script>([\s\S]*?)<\/script>/)[1];
    let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, tag => { const source=tag.match(/^<script\b[^>]*\bsrc="([^"]+)"/);return !source||scripts.has(source[1])?tag:''; });
    html = html.replace(/<link\b[^>]*href="https:[^>]*>/g, '');
    html = html.replace(/<script/, `<div hidden><button id="sign-in"></button><button id="sign-out"></button><p id="status"></p></div>
      <dialog id="account-menu"><nav class="account-tabs"><button data-tab="profile" role="tab">Profile</button></nav><footer class="account-footer"></footer></dialog>
      <script>${auth}
      document.documentElement.dataset.repoAuth='ready';
      Object.defineProperty(document,'hidden',{get:()=>false});
      window.accountMenu={open(){document.getElementById('account-menu').showModal()},close(){document.getElementById('account-menu').close()}};
      window.demoLibrary={open(){},close(){}};
      window.__sounds=[];const play=HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play=function(){__sounds.push({at:performance.now(),sound:this.dataset.sound,audio:this});return play.call(this)};
      window.__launchTimeline=[];for(const type of ['repo-launch-presentation','repo-launch-presentation-ready'])addEventListener(type,()=>__launchTimeline.push({type,at:performance.now(),curtain:getComputedStyle(document.getElementById('launch-curtain')).opacity}));
      </script><script`);
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  }
  if (url.origin === 'https://repocompany.uk' && !url.pathname.startsWith('/api/')) return serveFile(request, root, url.pathname);
  return original(request, options);
};
require('../../main.cjs');
