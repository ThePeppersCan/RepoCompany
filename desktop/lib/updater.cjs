'use strict';
const { EventEmitter } = require('node:events');
const { execFile } = require('node:child_process');
const path = require('node:path');

function publishers(value) {
  const result = Array.isArray(value) ? value : [value];
  if (!result.length || result.some(name => typeof name !== 'string' || !name.trim() || name.length > 2048)) throw new Error('A signed publisher identity is required.');
  return [...new Set(result)].sort();
}

// Fail closed if Windows cannot verify Authenticode. electron-updater's default
// verifier can skip verification when PowerShell is unavailable, so use a
// bounded native check with no shell and explicitly compare the signed identity.
function verifyWindowsSignature(publisherNames, file, { execFileImpl = execFile } = {}) {
  const allowed = publishers(publisherNames);
  if (!path.isAbsolute(file) || /[\x00-\x1f]/.test(file)) return Promise.resolve('Invalid installer path.');
  const literal = file.replace(/'/g, "''");
  const script = "$ErrorActionPreference='Stop'; [Console]::OutputEncoding=[System.Text.UTF8Encoding]::new($false); $s=Get-AuthenticodeSignature -LiteralPath '" + literal + "'; if(!$s.SignerCertificate){throw 'Missing signing certificate'}; [pscustomobject]@{Status=[int]$s.Status;Subject=$s.SignerCertificate.Subject;Name=$s.SignerCertificate.GetNameInfo([System.Security.Cryptography.X509Certificates.X509NameType]::SimpleName,$false);Path=$s.Path}|ConvertTo-Json -Compress";
  const powershell = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  return new Promise(resolve => {
    execFileImpl(powershell, ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { windowsHide: true, timeout: 20000, maxBuffer: 64 * 1024, shell: false }, (error, stdout, stderr) => {
      if (error || stderr?.trim()) { resolve('Windows could not verify the installer signature.'); return; }
      try {
        const signature = JSON.parse(stdout.replace(/^\uFEFF/, '').trim());
        if (signature.Status !== 0 || typeof signature.Path !== 'string' || path.resolve(signature.Path).toLowerCase() !== path.resolve(file).toLowerCase()) { resolve('The installer has an invalid signature.'); return; }
        const matches = allowed.some(name => name.includes('=') ? name === signature.Subject : name === signature.Name);
        resolve(matches ? null : 'The installer signing identity does not match Repo Company.');
      } catch { resolve('Windows returned an unreadable installer signature.'); }
    });
  });
}

class LauncherUpdater extends EventEmitter {
  constructor({ config, packaged, canRestart, engineFactory = () => require('electron-updater').autoUpdater }) {
    super(); this.config = config || {}; this.packaged = packaged; this.canRestart = canRestart; this.engineFactory = engineFactory; this.pending = null;
    this.state = { status: 'unconfigured', message: 'Automatic launcher updates are not available in this preview yet.' }; this.engine = null;
  }
  snapshot() { return { ...this.state }; }
  set(state) { this.state = state; this.emit('change', this.snapshot()); }
  async configure() {
    if (!this.packaged || !this.config.url || !this.config.publisherName) return false;
    const url = new URL(this.config.url);
    if (url.protocol !== 'https:' || url.origin !== 'https://repocompany.uk' || url.username || url.password || url.hash) throw new Error('The launcher update feed is not trusted.');
    const autoUpdater = this.engineFactory();
    // NsisUpdater reads publisherName from app-update.yml, NOT setFeedURL().
    // A missing file/name makes its signature gate return success, so require
    // the shipped signing metadata and verify that it matches our pinned config.
    const diskConfig = await autoUpdater.configOnDisk?.value;
    if (!diskConfig || JSON.stringify(publishers(diskConfig.publisherName)) !== JSON.stringify(publishers(this.config.publisherName))) throw new Error('Launcher release signing metadata is missing or inconsistent.');
    if (typeof autoUpdater.verifyUpdateCodeSignature !== 'function') throw new Error('This installer does not support Windows signature verification.');
    autoUpdater.verifyUpdateCodeSignature = verifyWindowsSignature;
    this.engine = autoUpdater; autoUpdater.autoDownload = true; autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowDowngrade = false; autoUpdater.allowPrerelease = false; autoUpdater.disableWebInstaller = true;
    autoUpdater.setFeedURL({ provider: 'generic', url: url.href });
    autoUpdater.on('checking-for-update', () => this.set({ status: 'checking', message: 'Checking for launcher updates…' }));
    autoUpdater.on('update-not-available', () => this.set({ status: 'current', message: 'Your launcher is up to date.' }));
    autoUpdater.on('update-available', info => this.set({ status: 'downloading', version: info.version, message: 'Downloading the next launcher update…' }));
    autoUpdater.on('download-progress', info => this.set({ ...this.state, progress: info.percent / 100 }));
    autoUpdater.on('update-downloaded', info => this.set({ status: 'ready', version: info.version, message: 'Ready to install when you close the launcher.' }));
    autoUpdater.on('error', () => this.set({ status: 'error', message: 'Could not check for updates. Please try again later.' }));
    return true;
  }
  async check() {
    if (this.pending) return this.pending;
    this.pending = this._check().finally(() => { this.pending = null; });
    return this.pending;
  }
  async _check() {
    try {
      if (!this.engine && !await this.configure()) { this.emit('change', this.snapshot()); return this.snapshot(); }
      await this.engine.checkForUpdates();
    } catch { this.set({ status: 'error', message: 'Could not verify the launcher update channel. Please try again later.' }); }
    return this.snapshot();
  }
}
module.exports = { LauncherUpdater, verifyWindowsSignature };
