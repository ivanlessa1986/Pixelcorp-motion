#!/usr/bin/env node
// Mosaico de quadros em instantes exatos (validação visual do kit e comparação lado a lado).
// Uso: node mosaico.mjs <video.mp4> --tempos 1.3,3.5,5.7 [--colunas 3] [--largura 480] [--rotulos "a|b|c"] --saida mosaico.jpg
//      Para comparar com uma referência, gere dois mosaicos com os mesmos rótulos e junte com --juntar a.jpg,b.jpg --saida ab.jpg
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const a = process.argv.slice(2), flag = (n, d) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : d; };
const saida = flag("--saida", "mosaico.jpg");
const py = (code, args) => execFileSync("python3", ["-c", code, ...args], { stdio: "inherit" });
if (flag("--juntar")) {
  py(`import sys
from PIL import Image
ims=[Image.open(f) for f in sys.argv[2].split(',')]
h=max(i.height for i in ims); w=sum(i.width for i in ims)+12*(len(ims)-1)
c=Image.new('RGB',(w,h),(255,40,90)); x=0
for i in ims: c.paste(i,(x,0)); x+=i.width+12
c.save(sys.argv[1],quality=88)`, [saida, flag("--juntar")]);
  process.exit(0);
}
const video = a[0], tempos = flag("--tempos", "").split(",").filter(Boolean).map(Number);
const col = +flag("--colunas", 3), larg = +flag("--largura", 480), rot = (flag("--rotulos", "") || "").split("|");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mos-"));
tempos.forEach((t, i) => execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(t), "-i", video, "-frames:v", "1", "-vf", `scale=${larg}:-2`, path.join(tmp, `${String(i).padStart(3, "0")}.png`)]));
py(`import sys,glob
from PIL import Image, ImageDraw, ImageFont
fs_=sorted(glob.glob(sys.argv[2]+'/*.png')); col=int(sys.argv[3]); rot=sys.argv[4].split('|'); tem=sys.argv[5].split(',')
ims=[Image.open(f).convert('RGB') for f in fs_]; w,h=ims[0].size; L=(len(ims)+col-1)//col
c=Image.new('RGB',(col*w+(col-1)*6,L*(h+34)),(14,14,16)); d=ImageDraw.Draw(c)
try: fo=ImageFont.truetype('/usr/share/fonts/noto/NotoSans-Bold.ttf',18)
except Exception: fo=ImageFont.load_default()
for k,im in enumerate(ims):
  x=(k%col)*(w+6); y=(k//col)*(h+34); c.paste(im,(x,y))
  d.text((x+6,y+h+7),(tem[k]+'s  '+(rot[k] if k<len(rot) else '')).strip(),fill=(235,235,235),font=fo)
c.save(sys.argv[1],quality=86)`, [saida, tmp, String(col), rot.join("|"), tempos.join(",")]);
fs.rmSync(tmp, { recursive: true });
console.log("ok", saida);
