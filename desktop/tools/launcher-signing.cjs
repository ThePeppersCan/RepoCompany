'use strict';
// Release keys never enter the application, a Git checkout, argv or a plaintext file.
const fs = require('node:fs/promises'), path = require('node:path'), crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const KEY_ID = 'repo-launcher-2026-01';
const SIGNING_CONTEXT = Buffer.from('Repo Company Launcher Update v1\n');
const REPO = path.resolve(__dirname, '../..');
function check(value, message) { if (!value) throw Error(message); }
function defaultKeyPath() {
  check(process.env.LOCALAPPDATA, 'Windows LocalAppData is required for release signing.');
  return path.join(process.env.LOCALAPPDATA, 'RepoCompanyReleaseSigning', 'launcher-update-v1.dpapi');
}
function powershell(script, input) {
  check(process.platform === 'win32', 'DPAPI release signing requires Windows.');
  const executable = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe');
  try { return execFileSync(executable, ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], {input, windowsHide:true, shell:false, timeout:20000, maxBuffer:65536, stdio:['pipe','pipe','pipe']}); }
  catch { throw Error('Windows could not access the protected release key. Use its original Windows user profile.'); }
}
function dpapi(bytes, decrypt = false) {
  const script = "$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.Security; $m=New-Object System.IO.MemoryStream; [Console]::OpenStandardInput().CopyTo($m); $b=$m.ToArray(); try { $r=[System.Security.Cryptography.ProtectedData]::" + (decrypt ? 'Unprotect' : 'Protect') + "($b,$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::OpenStandardOutput().Write($r,0,$r.Length) } finally { [Array]::Clear($b,0,$b.Length); if($r){[Array]::Clear($r,0,$r.Length)}; $m.Dispose() }";
  return powershell(script, bytes);
}
async function plainPath(filename) {
  let target = path.resolve(filename);
  while (true) {
    try { const stat = await fs.lstat(target); check(!stat.isSymbolicLink(), 'Release key paths must not use symbolic links or junctions.'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const parent = path.dirname(target); if (parent === target) break; target = parent;
  }
}
async function keyPath(value = process.env.REPO_LAUNCHER_SIGNING_KEY || defaultKeyPath()) {
  const filename = path.resolve(value), relative = path.relative(REPO, filename);
  check(relative.startsWith('..' + path.sep) || path.isAbsolute(relative), 'The private release key must be outside the repository.');
  check(path.extname(filename).toLowerCase() === '.dpapi', 'Use a DPAPI-protected key file.');
  await plainPath(filename);
  let existing = path.dirname(filename);
  while (true) { try { await fs.access(existing); break; } catch { const parent = path.dirname(existing); check(parent !== existing, 'Release key directory is unavailable.'); existing = parent; } }
  let inGit = false;
  try { execFileSync('git', ['-C', existing, 'rev-parse', '--show-toplevel'], {windowsHide:true, stdio:'pipe'}); inGit = true; } catch (_) {}
  check(!inGit, 'The private release key must not be stored inside any Git checkout.');
  return filename;
}
function protectDirectory(directory) {
  const literal = directory.replace(/'/g, "''");
  // Use the .NET API directly: a parent PowerShell 7 session can leave PSModulePath
  // pointing at incompatible modules when Windows PowerShell handles DPAPI.
  const script = "$ErrorActionPreference='Stop'; $p='" + literal + "'; $sid=[System.Security.Principal.WindowsIdentity]::GetCurrent().User; $acl=New-Object System.Security.AccessControl.DirectorySecurity; $acl.SetOwner($sid); $acl.SetAccessRuleProtection($true,$false); foreach($identity in @($sid,[System.Security.Principal.SecurityIdentifier]::new('S-1-5-18'))) { $rule=[System.Security.AccessControl.FileSystemAccessRule]::new($identity,'FullControl','ContainerInherit,ObjectInherit','None','Allow'); $acl.AddAccessRule($rule) }; [System.IO.Directory]::SetAccessControl($p,$acl)";
  powershell(script);
}
async function loadPrivateKey(filename) {
  filename = await keyPath(filename);
  const stat = await fs.stat(filename); check(stat.isFile() && stat.size > 32 && stat.size < 16384, 'Invalid protected release key file.');
  const encrypted = await fs.readFile(filename), plaintext = dpapi(encrypted, true);
  try { const key = crypto.createPrivateKey({key:plaintext,format:'der',type:'pkcs8'}); check(key.asymmetricKeyType === 'ed25519', 'The release key must be Ed25519.'); return key; }
  finally { plaintext.fill(0); encrypted.fill(0); }
}
async function exportPublic(filename, output) {
  check(output, 'Provide --public-output for the public key.');
  const key = await loadPrivateKey(filename), publicKey = crypto.createPublicKey(key).export({format:'pem',type:'spki'});
  await plainPath(output); await fs.writeFile(path.resolve(output), publicKey, {flag:'wx'});
  return {keyId:KEY_ID, publicKeyFile:path.resolve(output)};
}
async function initializeKey({file, publicOutput} = {}) {
  check(publicOutput, 'Provide --public-output for the public key.');
  const filename = await keyPath(file), directory = path.dirname(filename);
  check(path.basename(directory) === 'RepoCompanyReleaseSigning', 'Create release keys only in a dedicated RepoCompanyReleaseSigning directory.');
  await fs.mkdir(directory, {recursive:true}); protectDirectory(directory);
  const {privateKey, publicKey} = crypto.generateKeyPairSync('ed25519');
  const plaintext = privateKey.export({format:'der',type:'pkcs8'}); let encrypted;
  try { encrypted = dpapi(plaintext); await fs.writeFile(filename, encrypted, {flag:'wx',mode:0o600}); }
  finally { plaintext.fill(0); encrypted?.fill(0); }
  await plainPath(publicOutput); await fs.writeFile(path.resolve(publicOutput), publicKey.export({format:'pem',type:'spki'}), {flag:'wx'});
  return {keyId:KEY_ID, protectedKeyFile:filename, publicKeyFile:path.resolve(publicOutput)};
}
function signPayload(payload, privateKey, keyId = KEY_ID) {
  check(privateKey?.asymmetricKeyType === 'ed25519', 'The release key must be Ed25519.');
  const bytes = Buffer.from(JSON.stringify(payload));
  return {schemaVersion:1,keyId,payload:bytes.toString('base64'),signature:crypto.sign(null,Buffer.concat([SIGNING_CONTEXT,bytes]),privateKey).toString('base64')};
}
if (require.main === module) {
  const [command,...args] = process.argv.slice(2), options = {};
  for (let i=0;i<args.length;i++) { check(['--key-file','--public-output'].includes(args[i]) && args[i+1], 'Expected init-key/export-public --public-output FILE [--key-file FILE].'); const key=args[i].slice(2); check(!options[key], 'Duplicate option.'); options[key]=args[++i]; }
  const task = command === 'init-key' ? initializeKey({file:options['key-file'],publicOutput:options['public-output']}) : command === 'export-public' ? exportPublic(options['key-file'],options['public-output']) : Promise.reject(Error('Expected init-key or export-public.'));
  task.then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error.message);process.exitCode=1;});
}
module.exports = {KEY_ID,SIGNING_CONTEXT,defaultKeyPath,keyPath,loadPrivateKey,initializeKey,exportPublic,signPayload,plainPath};
