#!/usr/bin/env node
// "Filmar a tela": pega o vídeo plano da tela (render do HyperFrames) e devolve o mesmo vídeo com cara de tela de verdade filmada:
// bloom real em 2 passes (realces → desfoque estreito + desfoque largo, somados em modo tela), aberração cromática, grade de subpixels RGB
// (que vira moiré quando a composição projeta a tela em perspectiva), ruído temporal, leve cintilação e, opcional, curvatura de tubo.
// Também grava a "luz" da tela (vídeo minúsculo e borrado) para derramar na mesa e no teclado.
// Uso: node filmar.mjs tela.mp4 tela-filmada.mp4 [--luz tela-luz.mp4] [--bloom 1] [--subpixel 0.22] [--aberracao 2] [--ruido 5] [--curvatura 0]
import { execFileSync } from "node:child_process";

const a = process.argv.slice(2), flag = (n, d) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : d; };
const [ent, sai] = a;
if (!ent || !sai) { console.error("uso: node filmar.mjs tela.mp4 tela-filmada.mp4 [--luz luz.mp4]"); process.exit(1); }
const info = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", ent]).toString()).streams[0];
const W = info.width, H = info.height;
const bloom = +flag("--bloom", 1), sub = +flag("--subpixel", 0.22), ab = Math.round(+flag("--aberracao", 2)), ruido = +flag("--ruido", 5), curv = +flag("--curvatura", 0), luz = flag("--luz");
const q = (x) => Math.round(x / 4) * 4;
// tinta do bloom: o halo leva a cor de destaque (núcleo branco, halo colorido, como luz de neon de verdade)
const tinta = (flag("--tinta", "#38e1ff")).replace("#", ""), [tr, tg, tb] = [0, 2, 4].map((i) => (parseInt(tinta.slice(i, i + 2), 16) / 255) * 1.25);
const mix = `colorchannelmixer=rr=${tr.toFixed(2)}:rg=0:rb=0:gr=0:gg=${tg.toFixed(2)}:gb=0:br=0:bg=0:bb=${tb.toFixed(2)}`;
const f = [
  `[0:v]format=gbrp,split=3[base][h1][h2]`,
  `[h1]curves=all='0/0 0.45/0 1/1',gblur=sigma=${(9 * bloom).toFixed(1)},${mix}[b1]`,
  `[h2]scale=${q(W / 4)}:${q(H / 4)},curves=all='0/0 0.35/0 1/1',gblur=sigma=${(9 * bloom).toFixed(1)},${mix},scale=${W}:${H}:flags=bicubic[b2]`,
  `[base][b1]blend=all_mode=screen:all_opacity=${Math.min(1, 0.85 * bloom).toFixed(2)}[x1]`,
  `[x1][b2]blend=all_mode=screen:all_opacity=1,split=2[x2][xl]`,
  `color=c=black:s=${W}x${H}:r=30,format=gbrp,geq=r='if(eq(mod(X\\,3)\\,0)\\,255\\,70)':g='if(eq(mod(X\\,3)\\,1)\\,255\\,70)':b='if(eq(mod(X\\,3)\\,2)\\,255\\,70)'[m]`,
  `[x2][m]blend=all_mode=multiply:all_opacity=${sub}:shortest=1,rgbashift=rh=${-ab}:bh=${ab},noise=alls=${ruido}:allf=t,eq=brightness='0.006*sin(t*47)':eval=frame${curv ? `,lenscorrection=k1=${-curv}:k2=${-curv / 2}` : ""},format=yuv420p[v]`,
  `[xl]scale=64:48,gblur=sigma=3,scale=160:120,format=yuv420p[l]`,
];
const args = ["-v", "error", "-y", "-i", ent, "-filter_complex", f.join(";"), "-map", "[v]", "-c:v", "libx264", "-crf", "14", "-preset", "medium", "-r", "30", sai];
if (luz) args.push("-map", "[l]", "-c:v", "libx264", "-crf", "20", "-r", "30", luz);
else args.push("-map", "[l]", "-f", "null", "-");
execFileSync("ffmpeg", args, { stdio: "inherit" });
console.log("ok", sai, luz || "");
