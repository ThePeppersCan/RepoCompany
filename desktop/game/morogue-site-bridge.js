/* Installed Morogue only. The website bridge remains unchanged. Character data
 * comes from the signed-in account service, never another origin's raw saves. */
(function launcherSiteBridge(root) {
  'use strict';
  const origin = 'https://repocompany.uk', channel = 'morogue-account-v1';
  const expectedAccount = root.REPO_LAUNCHER_CONTEXT?.accountId;
  const saves = root.MORATALES_SURVIVOR_SAVES;
  let connectionPromise = null, connection = null, closeConnection = null, disposed = false;
  let pendingCharacters = null, characterState = 'loading', attemptVersion = 0;
  let resolveCharacters;
  const characters = new Promise(resolve => { resolveCharacters = resolve; });
  const failure = (message, gateReason = 'characters') => Object.assign(new Error(message), { gateReason });

  function connect() {
    return new Promise((resolve, reject) => {
      const nonce = root.crypto.randomUUID(), frame = document.createElement('iframe');
      const pending = new Map(), listeners = new Set();
      let closed = false, ready = false;
      frame.hidden = true; frame.title = 'Repo Company account connection'; frame.referrerPolicy = 'no-referrer';
      function close() {
        if (closed) return;
        closed = true; root.clearTimeout(startup); root.removeEventListener('message', receive); frame.remove();
        for (const item of pending.values()) { root.clearTimeout(item.timer); item.reject(failure('The account connection is unavailable.')); }
        pending.clear(); if (!ready) reject(failure('The account connection is unavailable.'));
      }
      function request(action, payload) {
        return new Promise((resolveRequest, rejectRequest) => {
          if (closed || disposed) { rejectRequest(failure('The account connection is unavailable.')); return; }
          const id = root.crypto.randomUUID();
          const timer = root.setTimeout(() => { pending.delete(id); rejectRequest(failure('The account connection timed out.')); }, 12000);
          pending.set(id, { resolve: resolveRequest, reject: rejectRequest, timer });
          try { frame.contentWindow.postMessage({ channel, nonce, id, action, payload }, origin); }
          catch { root.clearTimeout(timer); pending.delete(id); rejectRequest(failure('The account connection is unavailable.')); }
        });
      }
      function receive(event) {
        const message = event.data;
        if (event.origin !== origin || event.source !== frame.contentWindow || message?.channel !== channel || message.nonce !== nonce) return;
        if (message.event === 'changed') { for (const listener of listeners) listener(); return; }
        const item = pending.get(message.id); if (!item) return;
        root.clearTimeout(item.timer); pending.delete(message.id);
        if (message.error) item.reject(failure('Your shared characters could not be reached.', message.status === 401 || message.status === 403 ? 'account' : 'characters'));
        else item.resolve(message.result);
      }
      closeConnection = close;
      const startup = root.setTimeout(close, 6000);
      root.addEventListener('message', receive);
      frame.onload = async () => {
        try {
          await request('hello'); if (closed || disposed) return;
          ready = true; root.clearTimeout(startup);
          resolve({ request, close, onChange: listener => { listeners.add(listener); return () => listeners.delete(listener); } });
        } catch { close(); }
      };
      frame.src = origin + '/morogue-account-bridge.html'; document.body.append(frame);
    });
  }
  function remote() {
    if (!connectionPromise) {
      const loading = connect().then(value => { connection = value; return value; });
      connectionPromise = loading;
      loading.catch(() => { if (connectionPromise === loading) connectionPromise = null; });
    }
    return connectionPromise;
  }
  function sameAccount(session) {
    if (!expectedAccount || session?.user?.id !== expectedAccount || !session.access_token) throw failure('Reconnect with the account that opened Morogue.', 'account');
  }
  async function account(local) {
    try {
      const service = await remote();
      const current = await service.request('session');
      if (!current) {
        const previous = await local.auth.getSession();
        if (previous.data?.session) await service.request('adopt', previous.data.session);
      }
      await local.auth.stopAutoRefresh();
      try { root.localStorage.removeItem('morogue-repo-account-v1'); } catch { /* Optional legacy auth cleanup. */ }
      return { auth: {
        getSession: async () => ({ data: { session: await service.request('session') } }),
        onAuthStateChange(callback) { const unsubscribe = service.onChange(() => callback('ACCOUNT_CHANGED')); return { data: { subscription: { unsubscribe } } }; },
        signInWithPassword: async credentials => { try { await service.request('signin', credentials); return {}; } catch (error) { return { error }; } },
        signOut: async () => { await service.request('signout'); }
      } };
    } catch { return local; }
  }
  function retryCharacters() {
    if (pendingCharacters) return pendingCharacters;
    if (characterState === 'ready') return Promise.resolve();
    const attempt = ++attemptVersion; characterState = 'loading';
    let timer;
    const current = () => { if (disposed || attempt !== attemptVersion) throw failure('This character connection has closed.'); };
    const operation = (async () => {
      const service = await remote(); current();
      sameAccount(await service.request('session')); current();
      const value = await service.request('characters', { userId: expectedAccount }); current();
      if (value?.userId !== expectedAccount) throw failure('Your character belongs to another account.', 'account');
      if (!Array.isArray(value.characters) || value.characters.length > 4) throw failure('Your shared character list could not be read.');
      if (value.characters.some(character => !/^(?:slot-[0-2]|current)$/.test(character?.id || ''))) throw failure('Your shared character list could not be read.');
      sameAccount(await service.request('session')); current();
      if (!value.characters.length) throw failure('Connect your Moratales character from the browser where you play.', 'characters-empty');
      if (!saves?.importCharacters || !saves?.read || !saves?.write) throw failure('The installed game needs updating.', 'incompatible');
      // The game's existing parser validates and projects name/look. Its write
      // touches only the account-scoped Morogue record, never Moratales saves.
      const selected = saves.read(root.localStorage).data.selectedCharacter;
      const imported = saves.importCharacters(root.localStorage, value.characters);
      const ids = imported.map(character => 'cafe-' + character.id);
      saves.write(root.localStorage, { selectedCharacter: ids.includes(selected) ? selected : ids[0] });
      characterState = 'ready'; resolveCharacters();
      root.dispatchEvent(new Event('morogue-characters-changed'));
    })();
    const timeout = new Promise((_resolve, reject) => { timer = root.setTimeout(() => { if (attempt === attemptVersion) attemptVersion++; reject(failure('Your shared characters could not be reached.')); }, 20000); });
    pendingCharacters = Promise.race([operation, timeout]).catch(error => {
      if (!error.gateReason) error.gateReason = 'characters';
      if (!disposed) characterState = error.gateReason === 'characters-empty' ? 'empty' : 'error';
      throw error;
    }).finally(() => { root.clearTimeout(timer); pendingCharacters = null; });
    return pendingCharacters;
  }
  root.MOROGUE_SITE_BRIDGE = { account, characters, retryCharacters, get characterState() { return characterState; } };
  root.addEventListener('pagehide', () => { disposed = true; attemptVersion++; closeConnection?.(); }, { once: true });
  // The app waits on characters, while the launcher gate owns actionable errors
  // and retries. This promise never rejects into the original game's startup.
  void retryCharacters().catch(() => {});
})(globalThis);
