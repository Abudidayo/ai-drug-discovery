from PIL import Image, ImageDraw, ImageFont
W,H=980,560; BG=(255,255,255)
def font(s):
    for f in ["/System/Library/Fonts/Supplemental/Arial Bold.ttf","/System/Library/Fonts/Helvetica.ttc"]:
        try: return ImageFont.truetype(f,s)
        except: pass
    return ImageFont.load_default()
FT,F,FS,FB=font(22),font(16),font(14),font(18)
jurors=[("GPT-5.4",["C2","C1","C3","C4"],None),("GLM-5.3",["C2","C4","C1","C3"],None),("Kimi K3",["C1","C2","C4","C3"],2)]
checks=["Valid JSON","Each Candidate ranked once","Cited evidence IDs exist","Quoted numbers match"]
GREEN,RED,GREY,INK=(46,160,90),(210,60,50),(170,170,170),(30,30,30)
def frame(revealed, failed_shown, borda_step, caption):
    im=Image.new("RGB",(W,H),BG); d=ImageDraw.Draw(im)
    d.text((24,16),"The Model jury's checks",font=FT,fill=INK)
    d.text((24,46),caption,font=FS,fill=(80,80,80))
    for j,(name,ballot,fail) in enumerate(jurors):
        y=95+j*150
        bad = failed_shown and fail is not None
        box=(24,y,250,y+128); d.rounded_rectangle(box,10,outline=GREY if bad else (90,110,160),width=2,fill=(245,245,245) if bad else (236,242,252))
        d.text((38,y+8),name,font=FB,fill=GREY if bad else INK)
        d.text((38,y+36),"Ranking: "+" > ".join(ballot),font=FS,fill=GREY if bad else INK)
        cite = "Cites: E3, E7, E99" if fail is not None else "Cites: E3, E7, E12"
        d.text((38,y+60),cite,font=FS,fill=GREY if bad else INK)
        if bad: d.text((38,y+88),"Recorded, not counted",font=FB,fill=RED)
        for c,label in enumerate(checks):
            cx=280; cy=y+8+c*30
            n=revealed.get(j,0)
            if c<n:
                ok = not (fail is not None and c==fail)
                col = GREEN if ok else RED
                d.ellipse([cx,cy,cx+22,cy+22],fill=col)
                if ok: d.line([(cx+5,cy+12),(cx+10,cy+17),(cx+18,cy+6)],fill=(255,255,255),width=3)
                else:
                    d.line([(cx+6,cy+6),(cx+16,cy+16)],fill=(255,255,255),width=3); d.line([(cx+16,cy+6),(cx+6,cy+16)],fill=(255,255,255),width=3)
                txt=label + ("" if ok else "  (E99 does not exist)")
                d.text((cx+32,cy+3),txt,font=FS,fill=col if not ok else INK)
            else:
                d.ellipse([cx,cy,cx+22,cy+22],outline=GREY,width=2)
                d.text((cx+32,cy+3),label,font=FS,fill=GREY)
    # Borda panel
    bx=660; d.rounded_rectangle((bx,95,W-24,H-30),10,outline=(90,110,160),width=2)
    d.text((bx+16,105),"Borda count",font=FB,fill=INK)
    d.text((bx+16,132),"Rank 1 = 3 pts, 2 = 2, 3 = 1, 4 = 0",font=FS,fill=(90,90,90))
    d.text((bx+16,152),"Valid jurors only (needs at least 2)",font=FS,fill=(90,90,90))
    if borda_step>=1:
        pts={"C1":0,"C2":0,"C3":0,"C4":0}
        rows=[]
        for name,ballot,fail in jurors[:2]:
            for r,c in enumerate(ballot): pts[c]+=3-r
        y0=190
        for k,c in enumerate(["C1","C2","C3","C4"]):
            a=3-jurors[0][1].index(c); b=3-jurors[1][1].index(c)
            d.text((bx+16,y0+k*30),f"{c}:  {a} + {b} = {a+b}",font=F,fill=INK)
        if borda_step>=2:
            order=sorted(pts,key=lambda c:-pts[c])
            d.text((bx+16,y0+140),"Consensus",font=FB,fill=GREEN)
            for k,c in enumerate(order):
                d.text((bx+16,y0+170+k*28),f"{k+1}. {c}  ({pts[c]} pts)",font=F,fill=INK)
    return im
frames=[]
def add(im,ms): frames.append((im,ms))
rev={}
add(frame(rev,False,0,"Three jurors send ranked ballots for the same blinded Candidates."),1600)
for j in range(3):
    for c in range(4):
        rev[j]=c+1
        cap=f"Checking {jurors[j][0]}..."
        add(frame(dict(rev),False,0,cap),450)
        if jurors[j][2] is not None and c==jurors[j][2]:
            add(frame(dict(rev),True,0,"Kimi cited evidence that doesn't exist: the ballot is recorded but never counted or fixed."),2400)
            break
add(frame(rev,True,1,"Only valid ballots are combined."),1800)
add(frame(rev,True,2,"Final ranking from the two valid jurors."),3800)
imgs=[f[0] for f in frames]; durs=[f[1] for f in frames]
imgs[0].save("docs/images/jury-checks.gif",save_all=True,append_images=imgs[1:],duration=durs,loop=0,optimize=True)
print(len(imgs))
