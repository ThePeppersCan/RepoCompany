"""Private, bounded Ollama adapter. No chat logging or storage; no admin proxy."""
import hashlib, hmac, json, os, pathlib, re, subprocess, threading, time, urllib.request, urllib.error
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = pathlib.Path(__file__).resolve().parent
SECRET = (ROOT / 'bridge-secret.txt').read_text().strip()
ADMISSION = threading.BoundedSemaphore(1)
ENDPOINT = 'https://repocompany.uk/api/wibsworth/bridge-heartbeat'
URL = None

def post(url, body, token=None, timeout=15):
    headers={'Content-Type':'application/json','User-Agent':'Mozilla/5.0 (compatible; Wibsworth/1.0; +https://repocompany.uk)'}
    if token: headers['Authorization']='Bearer '+token
    request=urllib.request.Request(url,data=json.dumps(body).encode(),headers=headers,method='POST')
    return urllib.request.urlopen(request,timeout=timeout)

class Handler(BaseHTTPRequestHandler):
    server_version = 'Wibsworth'
    sys_version = ''
    def log_message(self,*args): pass
    def setup(self):
        super().setup()
        self.connection.settimeout(15)
    def reply(self,status,data):
        encoded=json.dumps(data).encode()
        try:
            self.send_response(status)
            self.send_header('Content-Type','application/json')
            self.send_header('Cache-Control','no-store')
            self.send_header('Content-Length',str(len(encoded)))
            self.send_header('Connection','close')
            self.end_headers(); self.wfile.write(encoded)
        except (BrokenPipeError,ConnectionResetError,TimeoutError): pass
        self.close_connection=True
    def authenticated(self):
        actual=self.headers.get('Authorization','')
        return len(actual)<256 and hmac.compare_digest(actual,'Bearer '+SECRET)
    def do_GET(self):
        if not self.authenticated(): return self.reply(403,{'error':'Forbidden'})
        if self.path!='/health': return self.reply(404,{'error':'Not found'})
        self.reply(200,{'ok':True,'model':'Qwen3 1.7B','parallel':1})
    def do_POST(self):
        if not self.authenticated(): return self.reply(403,{'error':'Forbidden'})
        if self.path!='/infer': return self.reply(404,{'error':'Not found'})
        try: length=int(self.headers.get('Content-Length','0'))
        except ValueError: return self.reply(400,{'error':'Invalid length'})
        if not 1<=length<=12000: return self.reply(413,{'error':'Request too long'})
        if self.headers.get('Transfer-Encoding'): return self.reply(400,{'error':'Invalid encoding'})
        try:
            payload=json.loads(self.rfile.read(length))
            messages=payload['messages']
            assert isinstance(messages,list) and 1<=len(messages)<=6
            assert all(isinstance(m,dict) and m.get('role') in ('system','user','assistant') and isinstance(m.get('content'),str) for m in messages)
            assert len(json.dumps(messages,ensure_ascii=False).encode())<=10000
        except (ValueError,KeyError,AssertionError,TypeError): return self.reply(400,{'error':'Invalid messages'})
        if not ADMISSION.acquire(blocking=False): return self.reply(429,{'error':'Busy'})
        try:
            # Model and compute limits are fixed here, never accepted from callers.
            body={'model':'wibsworth-trial:latest','messages':messages,'stream':True,'think':False,'keep_alive':'5m',
                  'options':{'num_ctx':4096,'num_thread':2,'num_predict':640,'temperature':0.2,'top_p':0.8,'top_k':20}}
            answer=[]; started=time.monotonic(); finished=False
            with post('http://127.0.0.1:11437/api/chat',body,timeout=85) as response:
                for line in response:
                    if time.monotonic()-started>85: raise TimeoutError()
                    part=json.loads(line)
                    if part.get('error'): raise ValueError('Inference failed')
                    answer.append(part.get('message',{}).get('content',''))
                    if sum(map(len,answer))>12000: raise ValueError('Output too long')
                    if part.get('done'): finished=True; break
            if not finished or not ''.join(answer).strip(): raise ValueError('Incomplete answer')
            self.reply(200,{'answer':''.join(answer)})
        except Exception:
            self.reply(503,{'error':'Inference unavailable'})
        finally: ADMISSION.release()

class Server(ThreadingHTTPServer):
    daemon_threads=True
    # Bound socket-handler work as well as model work.
    slots=threading.BoundedSemaphore(12)
    def process_request(self,request,client_address):
        if not self.slots.acquire(blocking=False): self.shutdown_request(request); return
        try: super().process_request(request,client_address)
        except Exception: self.slots.release(); raise
    def process_request_thread(self,request,client_address):
        try: super().process_request_thread(request,client_address)
        finally: self.slots.release()

def tunnel():
    global URL
    while True:
        URL=None
        child=subprocess.Popen([str(ROOT/'cloudflared'),'tunnel','--no-autoupdate','--protocol','http2','--url','http://127.0.0.1:3008'],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
        for line in child.stdout:
            match=re.search(r'https://[a-z0-9]+(?:-[a-z0-9]+)*\.trycloudflare\.com',line)
            if match:
                URL=match.group(0)
                # Non-secret endpoint is saved for authenticated operator checks.
                (ROOT/'endpoint.txt').write_text(URL)
        child.wait(); URL=None; time.sleep(5)

def announce():
    while True:
        if URL:
            try:
                with post(ENDPOINT,{'url':URL},SECRET) as response:
                    if response.status==200: (ROOT/'heartbeat-status.json').write_text(json.dumps({'ok':True,'at':int(time.time())}))
            except Exception: pass
        time.sleep(30)

if __name__=='__main__':
    threading.Thread(target=tunnel,daemon=True).start()
    threading.Thread(target=announce,daemon=True).start()
    Server(('127.0.0.1',3008),Handler).serve_forever()
