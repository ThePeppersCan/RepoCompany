# Rebuild the supplied Wibs pack from its original vector animation rig.
# Requires Pillow and resvg-py. Captions are deliberately excluded.
from pathlib import Path
import math, io, re, json, zipfile
import resvg_py
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'wibs-gifs'; OUT.mkdir(parents=True,exist_ok=True)
paths=re.findall(r'<path d="([^"]+)"', (ROOT/'assets/wibs-icon.svg').read_text())
BODY,LEFT,RIGHT,FOOTL,FOOTR=paths[1:]
C='#f4ecd6'; DARK='#101713'; ACC='#bbdc96'
N=60; SIZE=480
def s(x): return math.sin(x)
def c(x): return math.cos(x)
def path(d,fill=C,extra=''): return f'<path d="{d}" fill="{fill}" {extra}/>'
def line(d,color=DARK,w=13): return path(d,'none',f'stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"')
def ellipse(x,y,rx,ry,fill=C,extra=''): return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{fill}" {extra}/>'
def trans(shape,t): return f'<g transform="{t}">{shape}</g>'
def text(txt,x,y,size,fill=C,weight=800,spacing=0): return f'<text x="{x}" y="{y}" fill="{fill}" font-family="Arial" font-weight="{weight}" font-size="{size}" text-anchor="middle" letter-spacing="{spacing}">{txt}</text>'
def sparkle(x,y,r,opacity=1): return f'<path d="M{x-r} {y}Q{x} {y-2} {x} {y-r}Q{x+2} {y} {x+r} {y}Q{x} {y+2} {x} {y+r}Q{x-2} {y} {x-r} {y}" fill="{ACC}" opacity="{opacity}"/>'

SPECS=[('01-griddy','GRIDDY','dance'),('02-breakdance','BREAK IT DOWN','dance'),('03-little-jig','LITTLE JIG','dance'),('04-disgusted','Disgusted','reaction'),('05-moonwalk','MOONWALK','dance'),('06-disco','DISCO MODE','dance'),('07-happy-bounce',"LETÃ¢â‚¬â„¢S GO!",'reaction'),('08-facepalm','BRUH.','reaction')]

def frame(k,i):
    t=2*math.pi*i/N; beat=3*t
    x=240; y=247; rot=0; sx=1; sy=1; la=0; ra=0; lx=0; ly=0; rx=0; ry=0; mood='smile'; extras=''; front=''; deco=''
    if k==0:
        # Repeating alternating heel steps, forward lean, arm pumps, then goggles.
        x+=12*s(t); y+=9*abs(s(beat)); rot=-7+3*s(beat)
        la=30+30*s(beat); ra=-30+30*s(beat)
        ly=-90*max(0,s(beat)); ry=-90*max(0,-s(beat)); lx=35*s(beat); rx=-35*s(beat)
        if .30<i/N<.61:
            front=ellipse(517,658,64,64,'none',f'stroke="{DARK}" stroke-width="33"')+ellipse(734,658,64,64,'none',f'stroke="{DARK}" stroke-width="33"')+ellipse(517,658,64,64,'none',f'stroke="{C}" stroke-width="22"')+ellipse(734,658,64,64,'none',f'stroke="{C}" stroke-width="22"')
            front+=line('M450 675Q410 710 425 770',C,35)+line('M800 675Q840 710 826 770',C,35)
        deco=line(f'M85 {324+5*s(beat)}l30 -3 M359 {324-5*s(beat)}l30 3',ACC,3)
    elif k==1:
        # Continuous windmill with a moving contact shadow.
        rot=-360*i/N*2; y=243; sx=.88; sy=.88; la=-38; ra=38
        lx=-50; rx=50; ly=-35+30*s(2*t); ry=-35-30*s(2*t)
        deco=line('M100 285Q75 230 112 182 M368 182Q408 235 379 291',ACC,3)
        deco+=sparkle(370,146,9,.7)
    elif k==2:
        x+=19*s(beat); y-=15*abs(s(beat)); rot=8*s(beat); la=-18+12*s(beat); ra=18+12*s(beat)
        lx=65*s(beat); rx=-65*s(beat); ly=-75*max(0,s(beat)); ry=-75*max(0,-s(beat))
        deco=sparkle(90,220+10*s(beat),10)+sparkle(386,192-10*s(beat),7)
    elif k==3:
        # Recoil, scrunch the face, and let both ears droop before recovering.
        p=min(1,((1-c(t))/2)*1.45); x-=15*p; y+=9*p; rot=-9*p
        sx=1-.035*p; sy=1+.025*p; la=-4*p; ra=4*p; mood='disgusted'
        ly=-8*p; ry=-8*p
    elif k==4:
        x+=45*c(t); y+=4*s(beat); rot=8; la=-20+12*s(beat); ra=15+12*s(beat)
        lx=55*s(beat); rx=-55*s(beat); ly=-38*max(0,s(beat)); ry=-38*max(0,-s(beat)); mood='cool'
        deco=line(f'M83 321h{36+12*s(t)} M349 330h44',ACC,3)
    elif k==5:
        x+=10*s(beat); y+=6*abs(s(beat)); rot=9*s(beat); la=70+15*s(beat); ra=15+12*s(beat)
        lx=20*s(beat); rx=-20*s(beat); ly=-25*max(0,s(beat)); ry=-25*max(0,-s(beat))
        deco=''.join(sparkle(90+300*j/4,130+25*s(t+j),5+3*(1+s(beat+j))/2,.8) for j in range(5))
        deco+=line('M240 62v23',ACC,2)+ellipse(240,102,17,17,'none',f'stroke="{ACC}" stroke-width="2"')+line('M223 102h34 M240 85v34 M228 91l24 22',ACC,1)
    elif k==6:
        jump=max(0,s(beat)); y-=45*jump; sx=1+.08*c(2*beat); sy=1-.08*c(2*beat); la=-(20+40*jump); ra=20+40*jump
        ly=-20*jump; ry=-20*jump; mood='happy'
        for j in range(10):
            a=2*math.pi*j/10; r=115+25*jump
            deco+=trans(f'<rect x="-3" y="-6" width="6" height="12" rx="2" fill="{ACC if j%2 else C}"/>',f'translate({240+r*c(a)} {225+r*s(a)}) rotate({j*37+i*3})')
    else:
        p=(1-c(t))/2; y+=9*p; rot=-7*p; mood='bruh'; la=20; ra=-15
        # Hand sweeps onto forehead and holds through the middle of the loop.
        reach=min(1,p*2.4)
        hx=910-255*reach; hy=740-170*reach
        arm=f'M832 692Q{900-40*reach} {580-55*reach} {hx} {hy}'
        front=line(arm,DARK,69)+line(arm,C,59)+ellipse(hx,hy,55,43,C,f'stroke="{DARK}" stroke-width="6"')
        front+=line(f'M{hx-30} {hy-15}l24 -4 M{hx-27} {hy+4}l25 -3',DARK,5)


    blink=1
    if k==3: blink=1-.75*p
    elif k==7: blink=.16
    else:
        if i in (47,48,49): blink=.14
    face=ellipse(517,663,30,47*blink,DARK)+ellipse(734,663,30,47*blink,DARK)
    if mood=='disgusted':
        if p>.15:
            face=line('M491 648L531 666L495 677 M757 646L719 667L752 679',DARK,12)
            face+=line('M483 620Q517 612 548 634 M704 633Q736 610 768 618',DARK,9)
            face+=line('M611 682Q625 668 640 683',DARK,7)
            face+=path('M593 721Q608 699 629 713Q649 730 668 711L670 736Q648 748 626 728Q606 738 593 734Z',DARK)
            face+=path('M647 733Q659 727 668 730L669 739Q658 745 647 733Z','#c58d82')
        else: face+=line('M605 707Q627 701 647 707',DARK,11)
    elif mood=='bruh': face+=line('M602 711Q625 698 650 711',DARK,11)
    elif mood=='happy':
        face=line('M487 660Q517 625 547 660 M704 660Q734 625 764 660',DARK,13)+path('M594 691Q626 710 657 691Q652 746 626 746Q600 743 594 691',DARK)
    else: face+=line('M608 688Q626 709 643 688',DARK,13)
    if mood=='cool': face=path('M473 620h90l-8 77q-38 30 -73 -3Z',DARK)+path('M688 620h90l-8 77q-38 30 -73 -3Z',DARK)+line('M560 640h130',DARK,12)+line('M608 713Q630 725 652 703',DARK,11)
    # Keep the floppy ears outside the body as they articulate.
    if k!=3: la=abs(la); ra=-abs(ra)
    limbs=trans(path(LEFT),f'rotate({la} 455 495)')+trans(path(RIGHT),f'rotate({ra} 798 495)')
    if k==3: limbs=trans(path(LEFT),f'translate({-45*p} {20*p}) rotate({la} 455 495)')+trans(path(RIGHT),f'translate({45*p} {20*p}) rotate({ra} 798 495)')
    feet=trans(path(FOOTL),f'translate({lx} {ly}) rotate({-12*s(beat) if k!=3 else 0} 517 837)')+trans(path(FOOTR),f'translate({rx} {ry}) rotate({12*s(beat) if k!=3 else 0} 730 837)')
    char=limbs+path(BODY)+feet+face+front
    char=trans(char,f'translate({x} {y}) rotate({rot}) scale({.40*sx} {.40*sy}) translate(-626 -640)')
    base=f'<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480"><defs><radialGradient id="bg"><stop stop-color="#293b2d"/><stop offset="1" stop-color="#101713"/></radialGradient></defs><rect width="480" height="480" fill="url(#bg)"/><rect x="16" y="16" width="448" height="448" rx="25" fill="none" stroke="#41513d" stroke-opacity=".5"/>'
    shadow=ellipse(240,345,106+(y-247)*.3,9,'#0c120e')
    return base+shadow+deco+char+'</svg>'

allframes=[]; stats=[]
for k,(name,title,kind) in enumerate(SPECS):
    frames=[]
    for i in range(N):
        svg=frame(k,i)
        raw=resvg_py.svg_to_bytes(svg_string=svg,width=SIZE,height=SIZE,skip_system_fonts=True)
        frames.append(Image.open(io.BytesIO(raw)).convert('RGB'))
    # One palette per animation prevents colour shimmer in the background.
    sample=Image.new('RGB',(SIZE*6,SIZE))
    for j in range(6): sample.paste(frames[j*10],(j*SIZE,0))
    pal=sample.quantize(colors=128,method=Image.Quantize.MEDIANCUT)
    indexed=[f.quantize(palette=pal,dither=Image.Dither.NONE) for f in frames]
    target=OUT/(name[3:]+'.gif')
    frames[20].save(OUT/(name[3:]+'.png'),optimize=True)
    indexed[0].save(target,save_all=True,append_images=indexed[1:],duration=50,loop=0,optimize=True,disposal=1)
    allframes.append(frames)
    with Image.open(target) as im:
        assert im.n_frames>1 and im.info['loop']==0 and im.size==(SIZE,SIZE)
        duration=sum((im.seek(j) or im.info['duration']) for j in range(im.n_frames))
        assert duration==N*50
    stats.append({'file':target.name,'frames':N,'duration_ms':duration,'bytes':target.stat().st_size})
    print(target.name, target.stat().st_size,flush=True)

print('Verified all eight text-free GIFs.')
