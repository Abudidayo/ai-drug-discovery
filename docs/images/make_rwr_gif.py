import random, math
from PIL import Image, ImageDraw, ImageFont
W,H=900,540; BG=(255,255,255)
pos={"D1":(120,210),"D2":(120,390),"X":(310,260),"A":(510,180),"B":(310,440),"Y":(510,330),"Z":(680,330),"C":(810,330)}
label={"D1":"Disease\nprotein","D2":"Disease\nprotein","X":"protein","Y":"protein","Z":"protein","A":"Drug A\ntarget","B":"Drug B\ntarget","C":"Drug C\ntarget"}
edges=[("D1","X"),("D2","X"),("X","A"),("D2","B"),("X","Y"),("Y","Z"),("Z","C")]
nb={n:[] for n in pos}
for a,b in edges: nb[a].append(b); nb[b].append(a)
seeds=["D1","D2"]
# exact RWR for final scores
p={n:(0.5 if n in seeds else 0.0) for n in pos}
p0=dict(p)
for _ in range(500):
    q={n:0.0 for n in pos}
    for n in pos:
        for m in nb[n]: q[m]+=0.7*p[n]/len(nb[n])
    p={n:q[n]+0.3*p0[n] for n in pos}
def font(s):
    for f in ["/System/Library/Fonts/Supplemental/Arial Bold.ttf","/System/Library/Fonts/Helvetica.ttc"]:
        try: return ImageFont.truetype(f,s)
        except: pass
    return ImageFont.load_default()
F=font(17); FT=font(22); FS=font(15)
base_col={"D":(246,193,193),"T":(193,216,246),"P":(232,232,240)}
def kind(n): return "D" if n.startswith("D") else ("T" if n in "ABC" else "P")
rng=random.Random(4)
visits={n:0 for n in pos}
frames=[]; cur=rng.choice(seeds)
def draw(walker=None, caption="", jump=False, final=False):
    im=Image.new("RGB",(W,H),BG); d=ImageDraw.Draw(im)
    d.text((24,16),"Random walk with restart",font=FT,fill=(30,30,30))
    d.text((24,46),caption,font=FS,fill=(80,80,80))
    for a,b in edges: d.line([pos[a],pos[b]],fill=(150,150,150),width=3)
    mx=max(visits.values()) or 1
    for n,(x,y) in pos.items():
        r=46; c=base_col[kind(n)]
        heat=(visits[n]/mx) if not final else p[n]/max(p.values())
        glow=int(6+heat*16)
        if heat>0: d.ellipse([x-r-glow,y-r-glow,x+r+glow,y+r+glow],fill=(255,236,170) if not final else (255,225,140))
        d.ellipse([x-r,y-r,x+r,y+r],fill=c,outline=(90,90,90),width=2)
        d.multiline_text((x,y),label[n],font=F,fill=(25,25,25),anchor="mm",align="center")
        if n in "ABC":
            val = f"visits {visits[n]}" if not final else f"score {p[n]:.3f}"
            d.text((x,y+r+16),val,font=FS,fill=(40,40,40),anchor="mm")
    if walker:
        x,y=walker; d.ellipse([x-11,y-11,x+11,y+11],fill=(220,60,40),outline=(120,20,10),width=2)
    return im
for step in range(26):
    if rng.random()<0.3 and step>0:
        nxt=rng.choice(seeds); cap="30%: jump back to a disease protein (restart)"
    else:
        nxt=rng.choice(nb[cur]); cap="70%: step to a random neighbour"
    a,b=pos[cur],pos[nxt]
    for t in (0.0,0.33,0.66):
        frames.append((draw((a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t),cap),90))
    cur=nxt; visits[cur]+=1
    frames.append((draw(pos[cur],cap),220))
fin="After many steps: proteins near the disease are visited most. Drug B > Drug A > Drug C."
frames.append((draw(None,fin,final=True),3500))
imgs=[f[0] for f in frames]; durs=[f[1] for f in frames]
imgs[0].save("docs/images/rwr-walk.gif",save_all=True,append_images=imgs[1:],duration=durs,loop=0,optimize=True)
print({k:round(v,3) for k,v in p.items() if k in "ABC"}, len(imgs))
