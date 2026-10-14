/* Installed game entry point only: load synchronously before every game script.
 * Keep local characters/settings/progression and unsent results separate for each
 * launcher account. The account-service iframes retain their own native storage.
 * Games retain their ordinary local saves; Morogue never saves a resumable run.
 * This imports no other player's browser progress. */
(function scopeLauncherStorage(root) {
  'use strict';
  if (root.REPO_LAUNCHER_STORAGE) return;
  const accountId = root.REPO_LAUNCHER_CONTEXT?.accountId;
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(accountId || '')) return;
  const storage = root.localStorage;
  const prefix = 'repo-launcher-account-v1:' + accountId.toLowerCase() + ':';
  const read = storage.getItem.bind(storage);
  const write = storage.setItem.bind(storage);
  const remove = storage.removeItem.bind(storage);
  const nativeKey = storage.key.bind(storage);
  function keys() {
    const result = [];
    for (let index = 0; index < storage.length; index++) {
      const key = nativeKey(index);
      if (key?.startsWith(prefix)) result.push(key.slice(prefix.length));
    }
    return result;
  }
  const scoped = Object.create(null);
  Object.defineProperties(scoped, {
    getItem: { value(key) { return read(prefix + String(key)); } },
    setItem: { value(key, value) { write(prefix + String(key), String(value)); } },
    removeItem: { value(key) { remove(prefix + String(key)); } },
    clear: { value() { for (const key of keys()) remove(prefix + key); } },
    key: { value(index) { return keys()[Number(index) >>> 0] ?? null; } },
    length: { get() { return keys().length; } },
    [Symbol.toStringTag]: { value: 'Storage' }
  });
  Object.freeze(scoped);
  Object.defineProperty(root, 'localStorage', { configurable: false, get: () => scoped });
  Object.defineProperty(root, 'REPO_LAUNCHER_STORAGE', {
    value: Object.freeze({ version: 1, accountId }), configurable: false
  });
})(globalThis);
