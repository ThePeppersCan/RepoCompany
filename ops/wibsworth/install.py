import hashlib, json, os, pathlib, secrets, subprocess, urllib.request
ROOT=pathlib.Path('/home/repo-audit/wibsworth-trial/site-bridge')
ROOT.mkdir(mode=0o700,exist_ok=True)
secret=ROOT/'bridge-secret.txt'
if not secret.exists(): secret.write_text(secrets.token_urlsafe(48)); secret.chmod(0o600)
# Official release asset digest is checked before executing the isolated binary.
request=urllib.request.Request('https://api.github.com/repos/cloudflare/cloudflared/releases/latest',headers={'User-Agent':'Wibsworth-trial'})
with urllib.request.urlopen(request,timeout=30) as response: release=json.load(response)
asset=next(a for a in release['assets'] if a['name']=='cloudflared-linux-amd64')
digest=asset.get('digest','')
if not digest.startswith('sha256:'): raise RuntimeError('Release digest unavailable')
with urllib.request.urlopen(asset['browser_download_url'],timeout=120) as response: binary=response.read(100_000_000)
if 'sha256:'+hashlib.sha256(binary).hexdigest()!=digest: raise RuntimeError('Release checksum mismatch')
(ROOT/'cloudflared').write_bytes(binary); (ROOT/'cloudflared').chmod(0o700)
(ROOT/'release.json').write_text(json.dumps({'tag':release['tag_name'],'asset':asset['name'],'digest':digest}))
units=pathlib.Path.home()/'.config/systemd/user'; units.mkdir(parents=True,exist_ok=True)
(units/'wibsworth-site-bridge.service').write_text('''[Unit]
Description=Wibsworth temporary website model connection
After=network-online.target
[Service]
Type=simple
WorkingDirectory=/home/repo-audit/wibsworth-trial/site-bridge
ExecStart=/usr/bin/python3 /home/repo-audit/wibsworth-trial/site-bridge/bridge.py
Restart=always
RestartSec=5
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
CPUQuota=30%
MemoryMax=256M
TasksMax=32
[Install]
WantedBy=default.target
''')
subprocess.run(['systemctl','--user','daemon-reload'],check=True)
subprocess.run(['systemctl','--user','enable','--now','wibsworth-site-bridge.service'],check=True)
print(json.dumps({'service':'wibsworth-site-bridge','release':release['tag_name'],'checksum_verified':True,'bind':'127.0.0.1:3008'}))
