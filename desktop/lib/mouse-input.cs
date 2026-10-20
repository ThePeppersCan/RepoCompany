using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Collections.Generic;

// Fixed input-only pipe protocol. No commands, paths, clipboard or code are accepted.
public static class WibsMouse {
 [StructLayout(LayoutKind.Sequential)] struct Mouse { public int dx,dy; public uint data,flags,time; public UIntPtr extra; }
 [StructLayout(LayoutKind.Sequential)] struct Keyboard { public ushort vk,scan; public uint flags,time; public UIntPtr extra; }
 [StructLayout(LayoutKind.Explicit,Size=40)] struct Input { [FieldOffset(0)] public uint type; [FieldOffset(8)] public Mouse mouse; [FieldOffset(8)] public Keyboard key; }
 [DllImport("user32.dll",SetLastError=true)] static extern uint SendInput(uint n,Input[] inputs,int size);
 [DllImport("user32.dll")] static extern int GetSystemMetrics(int index);
 [DllImport("user32.dll")] static extern bool SetProcessDpiAwarenessContext(IntPtr context);
 [StructLayout(LayoutKind.Sequential)] struct Rect {public int left,top,right,bottom;}
 [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr window,out Rect rect);
 static readonly object Gate=new object();
 static readonly HashSet<int> heldKeys=new HashSet<int>();
 static int buttons,x,y,w,h;
 static long deadline;
 static bool stopped=false,initialized=false;
 static void Send(uint flags,int dx=0,int dy=0,uint data=0){
  var input=new Input{type=0,mouse=new Mouse{dx=dx,dy=dy,data=data,flags=flags}};
  if(SendInput(1,new[]{input},40)!=1)throw new Exception("Windows did not accept mouse input.");
 }
 static void Buttons(int next){
  uint[] down={2,8,32},up={4,16,64};
  for(int i=0;i<3;i++)if((buttons&(1<<i))!=(next&(1<<i)))Send((next&(1<<i))!=0?down[i]:up[i]);
  buttons=next;
 }
 static bool AllowedKey(int k){return k==8||k==9||k==13||k==20||k==27||(k>=32&&k<=40)||k==45||k==46||(k>=48&&k<=57)||(k>=65&&k<=93)||(k>=96&&k<=123)||k==144||k==145||(k>=160&&k<=165)||(k>=186&&k<=192)||(k>=219&&k<=222);}
 static void Key(int vk,int scan,uint flags){
  var input=new Input{type=1,key=new Keyboard{vk=(ushort)vk,scan=(ushort)scan,flags=flags}};
  if(SendInput(1,new[]{input},40)!=1)throw new Exception("Windows did not accept keyboard input.");
 }
 static uint Extended(int k){return (k>=33&&k<=46)||k==91||k==92||k==93||k==111||k==144||k==163||k==165?1u:0u;}
 static bool SharedFocus(){
  Rect r;if(!GetWindowRect(GetForegroundWindow(),out r))return false;
  int cx=r.left+(r.right-r.left)/2,cy=r.top+(r.bottom-r.top)/2;
  return cx>=x&&cx<x+w&&cy>=y&&cy<y+h;
 }
 static void Release(){
  for(int i=0;i<3;i++)if((buttons&(1<<i))!=0){try{Send(new uint[]{4,16,64}[i]);}catch{}}buttons=0;
  foreach(int k in heldKeys){try{Key(k,0,Extended(k)|2u);}catch{}}heldKeys.Clear();
 }
 static void Stop(){if(stopped)return;stopped=true;Release();}
 public static void Run(){
  SetProcessDpiAwarenessContext(new IntPtr(-4));
  deadline=Environment.TickCount+10000L;
  using(var timer=new Timer(_=>{lock(Gate){if(DateTime.UtcNow.Ticks>deadline&&initialized){Stop();Environment.Exit(0);}}},null,100,100)){
   Console.WriteLine("ready");Console.Out.Flush();
   try{
    string line;
    while((line=Console.ReadLine())!=null){
     if(line.Length>256)break;
     var p=line.Split(' ');lock(Gate){
      if(stopped)break;
      if(!initialized){
       if(p.Length!=5||p[0]!="start")break;
       x=int.Parse(p[1]);y=int.Parse(p[2]);w=int.Parse(p[3]);h=int.Parse(p[4]);
       if(w<1||h<1||w>32768||h>32768||Math.Abs((long)x)>65536||Math.Abs((long)y)>65536)break;
       initialized=true;deadline=DateTime.UtcNow.AddMilliseconds(1800).Ticks;continue;
      }
      if(p[0]=="stop")break;
      if(p.Length==1&&p[0]=="alive"){deadline=DateTime.UtcNow.AddMilliseconds(1800).Ticks;continue;}
      if(p.Length==1&&p[0]=="release"){Release();continue;}
      if(p.Length==3&&p[0]=="key"){
       int k=int.Parse(p[1]),down=int.Parse(p[2]);if(!AllowedKey(k)||(down!=0&&down!=1))break;
       if(down==1&&!SharedFocus()){Release();continue;}
       // Secure-attention combinations are never synthesized.
       if(down==1&&k==46&&(heldKeys.Contains(162)||heldKeys.Contains(163))&&(heldKeys.Contains(164)||heldKeys.Contains(165)))continue;
       if(down==1){heldKeys.Add(k);Key(k,0,Extended(k));}
       else if(heldKeys.Remove(k))Key(k,0,Extended(k)|2u);
       continue;
      }
      if(p.Length>=2&&p.Length<=33&&p[0]=="text"){
       if(!SharedFocus()){Release();continue;}
       for(int i=1;i<p.Length;i++){int unit=int.Parse(p[i]);if(unit<32||unit>65535||unit==127)throw new Exception("Invalid text.");Key(0,unit,4);Key(0,unit,6);}
       continue;
      }
      if(p.Length!=5||p[0]!="mouse")break;
      int nx=int.Parse(p[1]),ny=int.Parse(p[2]),next=int.Parse(p[3]),wheel=int.Parse(p[4]);
      if(nx<0||nx>65535||ny<0||ny>65535||next<0||next>7||Math.Abs(wheel)>1200)break;
      int px=x+(int)Math.Round(nx/65535.0*(w-1)),py=y+(int)Math.Round(ny/65535.0*(h-1));
      int vx=GetSystemMetrics(76),vy=GetSystemMetrics(77),vw=GetSystemMetrics(78),vh=GetSystemMetrics(79);
      if(vw<2||vh<2||px<vx||py<vy||px>=vx+vw||py>=vy+vh)break;
      Send(0xC001,(int)Math.Round((px-vx)*65535.0/(vw-1)),(int)Math.Round((py-vy)*65535.0/(vh-1)));
      Buttons(next);if(wheel!=0)Send(0x0800,0,0,unchecked((uint)wheel));
     }
    }
   }catch{Console.WriteLine("error");Console.Out.Flush();}
   finally{lock(Gate){Stop();}}
  }
 }
}
