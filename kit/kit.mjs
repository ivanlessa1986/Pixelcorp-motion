// Motion Kit PixelCorp (18/10/2026) — biblioteca de movimento para composições HyperFrames (HTML + CSS + GSAP, uma timeline pausada).
// Escrito pelo Claude Opus 5.5 para o canal @oivandigital. Valores: referencias.json; guia: REFERENCIAS.md; pedidos: PEDIDOS.md.
// Tudo é seek-safe e determinístico: nada de Math.random/Date.now; aleatório = rnd(i, semente); só transform/opacity/filter/clip-path animados.
//
// Uso (num gerar.mjs):
//   import * as K from "../../templates/hyperframes/motion-kit/kit.mjs";
//   const p = K.palco({ W: 1600, H: 1200, tema: "neon" });          // u = 1% do menor lado
//   const pecas = [K.efeitos.hud(p, {...}), K.cenas.heroi(p, {...}), K.transicoes.chicote(p, {...}), ...];
//   const { html, css, js } = K.juntar(pecas);
//   K.copiarFontes(montagemDir); K.copiarAssets(montagemDir);
//   página: <style>${K.cssBase(p)}${css}</style> ... <div id="root" ...><div id="k-palco">${html}</div></div>
//   <script> const tl = gsap.timeline({ paused: true }); ${K.JS_BASE} ${js} window.__timelines["id"] = tl; </script>
// Cada peça devolve { html, css, js }. Cenas moram em <div class="k-cena" id="S.."> e são ligadas/desligadas em ini/fim (corte seco);
// as transições só acrescentam movimento em volta do instante da troca (saída em [t-d, t], entrada em [t, t+d]) ou revelam a cena nova por cima.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const KIT_DIR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(KIT_DIR, "../../..");
export const REF = JSON.parse(fs.readFileSync(path.join(KIT_DIR, "referencias.json"), "utf8"));

// ---------- utilidades ----------
export const rnd = (i, s = 1) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const f2 = (n) => +(+n).toFixed(3);
const hexA = (hex, a) => { const h = hex.replace("#", ""); const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
export const juntar = (pecas) => ({ html: pecas.map((x) => x?.html || "").join("\n"), css: pecas.map((x) => x?.css || "").join("\n"), js: pecas.map((x) => x?.js || "").join("\n") });

const FONTES = [
  ["archivoblack.woff2", "videos/2026-10-14-codex-no-claude/fontes/archivoblack.woff2"],
  ["spacegrotesk-var-latin.woff2", "site/assets/fonts/spacegrotesk-var-latin.woff2"],
  ["manrope-var-latin.woff2", "site/assets/fonts/manrope-var-latin.woff2"],
  ["jbmono-800.woff2", "videos/2026-10-14-codex-no-claude/fontes/jbmono-800.woff2"],
  ["jbmono-500.woff2", "videos/2026-10-14-codex-no-claude/fontes/jbmono-500.woff2"],
];
export function copiarFontes(destDir) {
  const d = path.join(destDir, "fontes"); fs.mkdirSync(d, { recursive: true });
  for (const [nome, rel] of FONTES) { const local = path.join(KIT_DIR, "fontes", nome); fs.copyFileSync(fs.existsSync(local) ? local : path.join(RAIZ, rel), path.join(d, nome)); }
}
// gsap + textura de grão (vêm do próprio kit)
export function copiarAssets(destDir) {
  const d = path.join(destDir, "assets"); fs.mkdirSync(d, { recursive: true });
  for (const f of ["gsap.min.js", "grain.png"]) fs.copyFileSync(path.join(KIT_DIR, "assets", f), path.join(d, f));
}

// ---------- palco e tema ----------
export function palco({ W, H, tema = "neon", brilho = "padrao" } = {}) {
  const T = REF.temas[tema]; if (!T) throw new Error("tema desconhecido: " + tema);
  const u = Math.min(W, H) / 100;
  const claro = tema === "claro";
  return { W, H, u, tema, T, claro, k: REF.brilho.niveis[brilho] ?? 1, px: (n) => Math.round(n * u) };
}
// sombra de brilho em camadas (em em, escala com o tamanho da letra)
export function brilho(p, cor = p.T.destaque, forca = 1) {
  const k = forca * p.k;
  if (p.claro) return `0 0 .06em ${hexA(cor, 0.35 * k)}, 0 .02em .2em ${hexA(cor, 0.3 * k)}`;
  return REF.brilho.camadas_em.map(([em, c, a]) => `0 0 ${em}em ${hexA(c === "destaque" ? cor : "#ffffff", Math.min(1, a * k))}`).join(", ");
}
const nucleo = (p, cor) => (p.claro ? cor : mistura("#ffffff", cor, 0.3));
function mistura(a, b, t) { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const c = (s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t); return "#" + [16, 8, 0].map((s) => c(s).toString(16).padStart(2, "0")).join(""); }

export function cssBase(p) {
  const { T, px } = p, F = REF.escala_tipografica_u;
  return `
      @font-face { font-family: "Archivo Black"; src: url("fontes/archivoblack.woff2") format("woff2"); font-weight: 400; }
      @font-face { font-family: "Space Grotesk"; src: url("fontes/spacegrotesk-var-latin.woff2") format("woff2"); font-weight: 300 700; }
      @font-face { font-family: "Manrope"; src: url("fontes/manrope-var-latin.woff2") format("woff2"); font-weight: 200 800; }
      @font-face { font-family: "JetBrains Mono"; src: url("fontes/jbmono-500.woff2") format("woff2"); font-weight: 500; }
      @font-face { font-family: "JetBrains Mono"; src: url("fontes/jbmono-800.woff2") format("woff2"); font-weight: 800; }
      :root { --fundo:${T.fundo}; --fundo2:${T.fundo2}; --sup:${T.superficie}; --txt:${T.texto}; --mudo:${T.mudo}; --acc:${T.destaque}; --alerta:${T.alerta}; --ok:${T.ok};
              --impacto:"Archivo Black",sans-serif; --disp:"Space Grotesk",sans-serif; --texto:"Manrope",sans-serif; --mono:"JetBrains Mono",monospace; }
      #k-palco { position: absolute; left: 0; top: 0; width: ${p.W}px; height: ${p.H}px; overflow: hidden; color: var(--txt); font-family: var(--texto);
                 background: radial-gradient(ellipse at 50% 42%, ${T.fundo2} 0, ${T.fundo} 70%); perspective: ${px(160)}px; }
      .k-cena { position: absolute; inset: 0; opacity: 0; transform-style: preserve-3d; }
      .k-abs { position: absolute; }
      .k-gig { font: 400 ${px(F.gigante.tam)}px/${F.gigante.entrelinha} var(--impacto); letter-spacing: ${F.gigante.espaco}; white-space: nowrap; }
      .k-num { font: 400 ${px(F.numero.tam)}px/${F.numero.entrelinha} var(--impacto); letter-spacing: ${F.numero.espaco}; font-variant-numeric: tabular-nums; white-space: nowrap; }
      .k-tit { font: 700 ${px(F.titulo.tam)}px/${F.titulo.entrelinha} var(--disp); letter-spacing: ${F.titulo.espaco}; }
      .k-apoio { font: 600 ${px(F.apoio.tam)}px/${F.apoio.entrelinha} var(--texto); color: var(--txt); }
      .k-rot { font: 800 ${px(F.rotulo.tam)}px/1 var(--mono); letter-spacing: ${F.rotulo.espaco}; text-transform: uppercase; color: var(--mudo); white-space: nowrap; }
      .k-micro { font: 500 ${px(F.micro.tam)}px/1 var(--mono); letter-spacing: ${F.micro.espaco}; text-transform: uppercase; color: var(--mudo); white-space: nowrap; }
      .k-neon { color: ${nucleo(p, T.destaque)}; text-shadow: ${brilho(p)}; }
      .k-neon-txt { color: ${p.claro ? T.texto : "#ffffff"}; text-shadow: ${brilho(p, T.destaque, 0.7)}; }
      .k-chip { position: absolute; padding: ${px(1.4)}px ${px(2.8)}px; border-radius: 999px; font: 700 ${px(F.chip.tam)}px/1 var(--texto); white-space: nowrap; color: var(--txt);
                background: ${hexA(T.destaque, p.claro ? 0.1 : 0.14)}; border: ${px(0.3)}px solid ${hexA(T.destaque, 0.85)}; box-shadow: 0 0 ${px(2.5)}px ${hexA(T.destaque, p.claro ? 0.15 : 0.35)}; }
      .k-chip.alerta { border-color: var(--alerta); background: ${hexA(T.alerta, 0.16)}; box-shadow: 0 0 ${px(2.5)}px ${hexA(T.alerta, 0.4)}; }
      .k-chip.cheio { background: var(--acc); color: ${p.claro ? "#fff" : T.fundo}; }
      .k-painel { position: absolute; border-radius: ${px(2.2)}px; background: ${hexA(T.superficie, p.claro ? 0.95 : 0.82)}; border: ${px(0.25)}px solid ${hexA(T.destaque, 0.45)};
                  box-shadow: 0 0 ${px(4)}px ${hexA(T.destaque, p.claro ? 0.12 : 0.22)}, inset 0 0 ${px(3)}px ${hexA(T.destaque, 0.08)}; }
      .k-leg { position: absolute; left: ${px(REF.grade.margem_u)}px; right: ${px(REF.grade.margem_u)}px; z-index: 20; font: 700 ${px(F.legenda.tam)}px/${F.legenda.entrelinha} var(--disp); letter-spacing: ${F.legenda.espaco}; color: ${p.claro ? T.texto : "#fff"}; text-shadow: ${p.claro ? "none" : `0 0 ${px(2)}px ${hexA(T.destaque, 0.35)}`}; }
      .k-leg .w { display: inline-block; opacity: 0; margin-right: .22em; transform-origin: 0% 80%; }
      .k-leg .w.kw { color: ${nucleo(p, T.destaque)}; text-shadow: ${brilho(p, T.destaque, 0.8)}; }
      #k-flash { position: absolute; inset: 0; background: ${p.claro ? "#fff" : mistura("#ffffff", T.destaque, 0.15)}; opacity: 0; z-index: 90; pointer-events: none; }`;
}

// ---------- helpers que rodam no navegador (precisam de `tl` e `gsap`) ----------
export const JS_BASE = `
      var E = { slam: "expo.out", ui: "power3.out", pop: "back.out(1.7)", mola: "elastic.out(1, 0.55)", sai: "power2.in", cam: "power3.inOut" };
      var rnd = function (i, s) { s = s || 1; var x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
      var shake = function (sel, t, a, n) { a = a || 10; n = n || 5; for (var i = 0; i < n; i++) tl.to(sel, { x: (i % 2 ? -1 : 1) * a * (1 - i / n), y: (rnd(i, 7) - .5) * a * .6 * (1 - i / n), duration: .045, ease: "none" }, t + i * .045); tl.to(sel, { x: 0, y: 0, duration: .05, ease: "none" }, t + n * .045); };
      var flash = function (t, a, d) { tl.fromTo("#k-flash", { opacity: 0 }, { opacity: a || .5, duration: d || .06, yoyo: true, repeat: 1, ease: "power1.out", immediateRender: false }, t); };
      var pop = function (sel, t, d) { tl.fromTo(sel, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: d || .36, ease: E.pop }, t); };
      var rise = function (sel, t, d, y) { tl.fromTo(sel, { y: y == null ? 40 : y, opacity: 0 }, { y: 0, opacity: 1, duration: d || .35, ease: E.ui }, t); };
      var sai = function (sel, t, d) { tl.to(sel, { opacity: 0, duration: d || .18, ease: E.sai }, t); };
      var slam = function (sel, t, a) { tl.fromTo(sel, { opacity: 0, scale: 1.7, filter: "blur(18px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: .45, ease: E.slam }, t); shake(sel, t + .22, a || 9); };
      var typer = function (id, text, t, d) { var o = { n: 0 }, el = document.getElementById(id); tl.fromTo(o, { n: 0 }, { n: text.length, duration: d, ease: "none", onUpdate: function () { el.textContent = text.slice(0, Math.round(o.n)); } }, t); };
      var blink = function (sel, t, n) { tl.fromTo(sel, { opacity: 1 }, { opacity: 0, duration: .26, yoyo: true, repeat: n, ease: "steps(1)", immediateRender: false }, t); };
      var draw = function (sel, len, t, d, ease) { tl.fromTo(sel, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: d, ease: ease || "power2.inOut" }, t); };
      var contar = function (id, de, ate, t, d, fmt, ease) { var o = { n: de }, el = document.getElementById(id); fmt = fmt || function (n) { return String(Math.round(n)); }; tl.fromTo(o, { n: de }, { n: ate, duration: d, ease: ease || "power2.out", onUpdate: function () { el.textContent = fmt(o.n); } }, t); };
      /* glitch RGB em qualquer elemento: tremor em degraus + canais vermelho/ciano separados + fatias (clip-path) */
      var glitch = function (sel, t, d, f, seed) { f = f || 12; seed = seed || 3; var n = Math.max(2, Math.round(d / .04));
        for (var i = 0; i < n; i++) { var k = 1 - i / n, a = f * k, y1 = Math.round(rnd(i, seed) * 70), y2 = Math.round(rnd(i, seed + 1) * (90 - y1));
          tl.set(sel, { x: (rnd(i, seed + 2) - .5) * 2 * a, filter: "drop-shadow(" + (a * .9).toFixed(1) + "px 0 0 rgba(255,40,90,.85)) drop-shadow(" + (-a * .9).toFixed(1) + "px 0 0 rgba(40,230,255,.85))", clipPath: i % 3 === 1 ? "inset(" + y1 + "% 0% " + y2 + "% 0%)" : "inset(0% 0% 0% 0%)" }, t + i * .04); }
        tl.set(sel, { x: 0, filter: "drop-shadow(0px 0 0 rgba(0,0,0,0))", clipPath: "inset(0% 0% 0% 0%)" }, t + n * .04); };
      /* rastro: cópias que seguem o mesmo movimento com atraso (eco) */
      var rastro = function (sels, de, para, t, passo) { sels.forEach(function (s, i) { var v = Object.assign({}, para, { delay: 0, duration: para.duration }); tl.fromTo(s, de, v, t + (i + 1) * (passo || .03)); }); };
      var pulsoBrilho = function (sel, t, d, n) { tl.fromTo(sel, { filter: "brightness(1)" }, { filter: "brightness(1.7)", duration: d || .12, yoyo: true, repeat: (n || 1) * 2 - 1, ease: "sine.inOut", immediateRender: false }, t); };`;

// ---------- tempo das palavras ----------
// frases: [{ id, f: "texto com *destaque*", hold, ini? }]; tempos: { C03: 7.1 } ou { palavras: { C03: [t0, t1, ...] } } (vindo do transcript da voz)
export function tempoPalavras(frases, { tempos = {}, porPalavra = REF.ritmo.palavra_s.padrao, inicio = 0 } = {}) {
  let cur = inicio;
  for (const c of frases) {
    c.palavras = c.f.split(/\s+/).filter(Boolean);
    let dentro = false;
    c.kw = c.palavras.map((w) => { const abre = w.startsWith("*"), fecha = /\*[.,:;?]?$/.test(w); const k = dentro || abre; if (abre) dentro = true; if (fecha) dentro = false; return k; });
    c.limpas = c.palavras.map((w) => w.replace(/\*/g, ""));
    if (c.ini === undefined) c.ini = tempos[c.id] ?? cur;
    const real = tempos.palavras?.[c.id];
    c.tw = c.palavras.map((_, i) => f2(real?.[i] ?? c.ini + 0.05 + i * porPalavra));
    c.falaFim = f2(c.tw[c.tw.length - 1] + porPalavra);
    if (c.fim === undefined) c.fim = f2(Math.max(c.falaFim + (c.hold ?? REF.ritmo.hold_final_cena_s), c.ini + REF.ritmo.cena_min_s));
    cur = c.fim;
  }
  return frases;
}

// legenda cinética: a palavra aparece quando é dita, destaque com brilho e soco de escala
export function legenda(p, c, { topo = 0.085, alinhar = "left", z = 20, ate } = {}) {
  const html = `<div class="k-leg" id="L${c.id}" style="top:${Math.round(p.H * topo)}px;text-align:${alinhar};z-index:${z}">${c.limpas.map((w, i) => `<span class="w${c.kw[i] ? " kw" : ""}" id="${c.id}w${i}">${esc(w)}</span>`).join("")}</div>`;
  const js = c.tw.map((t, i) => `tl.fromTo("#${c.id}w${i}", { opacity: 0, y: ${p.px(1.6)}, filter: "blur(${p.px(0.8)}px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: ${REF.ritmo.palavra_entra_s}, ease: E.ui }, ${f2(t - REF.ritmo.antecipa_palavra_s)});` + (c.kw[i] ? `tl.fromTo("#${c.id}w${i}", { scale: 1.25 }, { scale: 1, duration: .3, ease: E.slam, immediateRender: false }, ${f2(t - 0.03)});` : "")).join("\n      ") + `\n      tl.to("#L${c.id}", { opacity: 0, duration: .15, ease: E.sai }, ${f2((ate ?? c.fim) - 0.15)});`;
  return { html, js };
}

// liga/desliga a cena (corte seco); as transições mexem em volta disso
export function cenaVis(id, ini, fim) { return `tl.set("#${id}", { opacity: 1 }, ${f2(ini)}); tl.set("#${id}", { opacity: 0 }, ${f2(fim)});`; }

// =====================================================================
// EFEITOS
// =====================================================================
export const efeitos = {
  // HUD de estúdio: cantos em L, cena NN/TT, gravando + tempo, rótulo técnico por cena e régua com cabeça de leitura
  hud(p, { cenas, titulo = "MOTION KIT", tempoFim, rodape = "PIXELCORP · 30 QPS" }) {
    const { px } = p, m = px(4), tam = px(3.2), esp = px(0.35);
    const canto = (pos) => { const [v, h] = pos; return `<i class="k-canto" style="${v}:${m}px;${h}:${m}px;border-${v}:${esp}px solid;border-${h}:${esp}px solid"></i>`; };
    const css = `.k-hud { position: absolute; z-index: 60; } .k-canto { position: absolute; width: ${tam}px; height: ${tam}px; border-color: ${hexA(p.T.destaque, 0.75)} !important; z-index: 60; filter: drop-shadow(0 0 ${px(0.6)}px ${hexA(p.T.destaque, 0.6)}); }
      .k-rec { display: inline-block; width: ${px(1.4)}px; height: ${px(1.4)}px; border-radius: 50%; background: var(--alerta); box-shadow: 0 0 ${px(1)}px var(--alerta); margin-right: ${px(1)}px; vertical-align: ${px(0.1)}px; }
      .k-regua { position: absolute; left: ${px(9)}px; right: ${px(9)}px; bottom: ${px(9.5)}px; height: ${px(1.2)}px; z-index: 60; background: repeating-linear-gradient(90deg, ${hexA(p.T.texto, 0.35)} 0 ${px(0.15)}px, transparent ${px(0.15)}px ${px(2)}px) bottom/100% ${px(0.6)}px no-repeat, repeating-linear-gradient(90deg, ${hexA(p.T.texto, 0.55)} 0 ${px(0.18)}px, transparent ${px(0.18)}px ${px(10)}px) bottom/100% ${px(1.2)}px no-repeat; }
      .k-cabeca { position: absolute; left: 0; bottom: -${px(0.6)}px; width: ${px(0.3)}px; height: ${px(2.6)}px; background: var(--acc); box-shadow: 0 0 ${px(1.2)}px var(--acc); }`;
    const n = cenas.length;
    const html = `${canto(["top", "left"])}${canto(["top", "right"])}${canto(["bottom", "left"])}${canto(["bottom", "right"])}
      <div class="k-hud k-rot" style="left:${px(9)}px;top:${px(5)}px">${esc(titulo)} · CENA <span style="position:relative;display:inline-block;width:2.2em;height:1em;vertical-align:top">${cenas.map((c, k) => `<span id="hudn${k}" style="position:absolute;left:0;top:0;opacity:0;color:var(--txt)">${String(k + 1).padStart(2, "0")}</span>`).join("")}</span>/ ${String(n).padStart(2, "0")}</div>
      <div class="k-hud k-rot" style="right:${px(9)}px;top:${px(5)}px"><span class="k-rec" id="hudrec"></span>GRAVANDO <span id="hudtc" style="color:var(--txt)">00:00:00</span></div>
      ${cenas.map((c, k) => `<div class="k-hud k-micro" id="hudr${k}" style="left:${px(9)}px;bottom:${px(5)}px;opacity:0;color:${hexA(p.T.destaque, 0.9)}">◆ ${esc(c.rot || "")}</div>`).join("")}
      <div class="k-hud k-micro" style="right:${px(9)}px;bottom:${px(5)}px">${esc(rodape)}</div>
      <div class="k-regua"><i class="k-cabeca" id="hudcab"></i></div>`;
    const W = p.W - 2 * px(9);
    const js = `{ let o = { s: 0 }, el = document.getElementById("hudtc"); tl.fromTo(o, { s: 0 }, { s: ${tempoFim}, duration: ${tempoFim}, ease: "none", onUpdate: function () { var s = Math.floor(o.s), f = Math.floor(o.s * 30) % 30; el.textContent = "00:" + String(s).padStart(2, "0") + ":" + String(f).padStart(2, "0"); } }, 0); }
      blink("#hudrec", .3, ${Math.max(1, Math.floor(tempoFim / 0.26) - 3)});
      ${cenas.map((c, k) => `tl.set(["#hudn${k}", "#hudr${k}"], { opacity: 1 }, ${f2(c.ini)}); tl.set(["#hudn${k}", "#hudr${k}"], { opacity: 0 }, ${f2(c.fim)}); tl.fromTo("#hudcab", { x: 0 }, { x: ${W}, duration: ${f2(Math.max(0.2, c.fim - c.ini))}, ease: "none", immediateRender: ${k === 0} }, ${f2(c.ini)});`).join("\n      ")}`;
    return { html, css, js };
  },

  // faísca de luz (flare anamórfico): núcleo + traço horizontal + raios + fantasmas; viaja de x0 a x1
  flare(p, { id, x, y, t, dur = 0.9, x1, escala = 1, cor = p.T.destaque, z = 50 }) {
    const { px } = p, s = escala;
    const css = `#${id} { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: ${z}; mix-blend-mode: ${p.claro ? "multiply" : "screen"}; opacity: 0; }
      #${id} i { position: absolute; display: block; }
      #${id} .nu { left: -${px(9 * s)}px; top: -${px(9 * s)}px; width: ${px(18 * s)}px; height: ${px(18 * s)}px; border-radius: 50%; background: radial-gradient(circle, #fff 0, #fff 7%, ${hexA(cor, 0.95)} 18%, ${hexA(cor, 0.35)} 40%, ${hexA(cor, 0)} 70%); }
      #${id} .tr { left: -${px(70 * s)}px; top: -${px(0.35 * s)}px; width: ${px(140 * s)}px; height: ${px(0.7 * s)}px; border-radius: 50%; background: linear-gradient(90deg, ${hexA(cor, 0)}, ${hexA(cor, 0.55)} 30%, #fff 50%, ${hexA(cor, 0.55)} 70%, ${hexA(cor, 0)}); box-shadow: 0 0 ${px(1.5 * s)}px ${hexA(cor, 0.9)}; }
      #${id} .r1, #${id} .r2 { left: -${px(14 * s)}px; top: -${px(0.15 * s)}px; width: ${px(28 * s)}px; height: ${px(0.3 * s)}px; background: linear-gradient(90deg, ${hexA(cor, 0)}, #fff, ${hexA(cor, 0)}); }
      #${id} .r1 { transform: rotate(62deg); } #${id} .r2 { transform: rotate(-62deg); }
      #${id} .g { border-radius: 50%; border: ${px(0.25)}px solid ${hexA(cor, 0.35)}; background: ${hexA(cor, 0.06)}; }`;
    const fant = [[-0.35, 6], [-0.6, 3], [0.4, 9], [0.75, 4]].map(([d, r], i) => `<i class="g" id="${id}g${i}" style="left:${px(-r * s / 2 + d * 30)}px;top:${px(-r * s / 2)}px;width:${px(r * s)}px;height:${px(r * s)}px"></i>`).join("");
    const html = `<div id="${id}"><i class="tr"></i><i class="r1"></i><i class="r2"></i><i class="nu" id="${id}n"></i>${fant}</div>`;
    const xa = x, xb = x1 ?? x;
    const js = `tl.fromTo("#${id}", { x: ${xa}, y: ${y}, opacity: 0, scale: .4 }, { x: ${f2(xa + (xb - xa) * 0.3)}, opacity: 1, scale: 1, duration: ${f2(dur * 0.3)}, ease: E.ui }, ${f2(t)});
      tl.to("#${id}", { x: ${xb}, duration: ${f2(dur * 0.7)}, ease: "power1.inOut" }, ${f2(t + dur * 0.3)});
      tl.to("#${id}", { opacity: 0, scale: .7, duration: ${f2(Math.min(0.3, dur * 0.3))}, ease: E.sai }, ${f2(t + dur * 0.75)});
      tl.fromTo("#${id}n", { scale: 1 }, { scale: 1.25, duration: .07, yoyo: true, repeat: ${Math.max(1, Math.round(dur / 0.14) * 2 - 1)}, ease: "sine.inOut", immediateRender: false }, ${f2(t)});`;
    return { html, css, js };
  },

  // mira (crosshair): linhas da tela inteira, anel tracejado girando, leitura de coordenadas, trava no alvo
  mira(p, { id, de, para, t, dur = 1.0, trava = true, rotulo = "ALVO", cor = p.T.destaque, z = 45, ate }) {
    const { px } = p, R = px(7);
    const css = `#${id} { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: ${z}; opacity: 0; }
      #${id} .h { position: absolute; left: -${p.W * 2}px; width: ${p.W * 4}px; top: 0; height: ${Math.max(1, px(0.15))}px; background: ${hexA(cor, 0.55)}; }
      #${id} .v { position: absolute; top: -${p.H * 2}px; height: ${p.H * 4}px; left: 0; width: ${Math.max(1, px(0.15))}px; background: ${hexA(cor, 0.55)}; }
      #${id} .an { position: absolute; left: -${R}px; top: -${R}px; width: ${2 * R}px; height: ${2 * R}px; border-radius: 50%; border: ${px(0.3)}px dashed ${hexA(cor, 0.9)}; }
      #${id} .an2 { position: absolute; left: -${R * 1.6}px; top: -${R * 1.6}px; width: ${3.2 * R}px; height: ${3.2 * R}px; border-radius: 50%; border: ${px(0.15)}px solid ${hexA(cor, 0.35)}; }
      #${id} .pt { position: absolute; left: -${px(0.8)}px; top: -${px(0.8)}px; width: ${px(1.6)}px; height: ${px(1.6)}px; border-radius: 50%; background: #fff; box-shadow: 0 0 ${px(1)}px #fff, 0 0 ${px(3)}px ${cor}, 0 0 ${px(7)}px ${cor}; }
      #${id} .lb { position: absolute; left: ${R + px(1.5)}px; top: ${R * 0.4}px; color: ${cor}; padding: ${px(0.6)}px ${px(1)}px; border-radius: ${px(0.6)}px; background: ${hexA(p.T.fundo, 0.85)}; }
      #${id} .cl { position: absolute; width: ${px(2.2)}px; height: ${px(2.2)}px; border-color: #fff; border-style: solid; border-width: 0; }`;
    const cl = [["top", "left"], ["top", "right"], ["bottom", "left"], ["bottom", "right"]].map(([v, h], i) => `<i class="cl" id="${id}c${i}" style="${v}:-${R + px(1)}px;${h}:-${R + px(1)}px;border-${v}-width:${px(0.35)}px;border-${h}-width:${px(0.35)}px"></i>`).join("");
    const html = `<div id="${id}"><i class="h"></i><i class="v"></i><i class="an2"></i><i class="an" id="${id}a"></i><i class="pt"></i>${cl}<div class="lb k-micro" id="${id}l" data-layout-allow-overlap style="color:${cor}">${esc(rotulo)} · <span id="${id}x">0000</span> · <span id="${id}y">0000</span></div></div>`;
    const js = `tl.fromTo("#${id}", { x: ${de[0]}, y: ${de[1]}, opacity: 0 }, { opacity: 1, duration: .15, ease: "none" }, ${f2(t)});
      { let o${id} = { x: ${de[0]}, y: ${de[1]} }, ex = document.getElementById("${id}x"), ey = document.getElementById("${id}y"), el = document.getElementById("${id}");
        tl.fromTo(o${id}, { x: ${de[0]}, y: ${de[1]} }, { x: ${para[0]}, y: ${para[1]}, duration: ${dur}, ease: E.cam, onUpdate: function () { gsap.set(el, { x: o${id}.x, y: o${id}.y }); ex.textContent = String(Math.round(o${id}.x)).padStart(4, "0"); ey.textContent = String(Math.round(o${id}.y)).padStart(4, "0"); } }, ${f2(t)}); }
      tl.fromTo("#${id}a", { rotation: 0 }, { rotation: 220, duration: ${f2(dur + 1.2)}, ease: "power1.out" }, ${f2(t)});
      ${trava ? `tl.fromTo(["#${id}c0", "#${id}c1", "#${id}c2", "#${id}c3"], { scale: 2.2, opacity: 0 }, { scale: 1, opacity: 1, duration: .22, ease: E.slam }, ${f2(t + dur)}); tl.fromTo("#${id}a", { scale: 1.5 }, { scale: 1, duration: .25, ease: E.slam, immediateRender: false }, ${f2(t + dur)}); flash(${f2(t + dur)}, .25);` : ""}${ate ? `tl.to("#${id}", { opacity: 0, duration: .15, ease: E.sai }, ${f2(ate)});` : ""}`;
    return { html, css, js, fim: t + dur };
  },

  // grade em perspectiva (piso) rolando para a frente, com linha de horizonte acesa
  grade(p, { id = "kgrade", horizonte = 0.62, t0 = 0, t1 = 10, vel = 1, cor = p.T.destaque, alfa = 0.32, z = 1 }) {
    const { px } = p, passo = px(9);
    const css = `#${id} { position: absolute; left: -${p.W}px; right: -${p.W}px; top: ${Math.round(p.H * horizonte)}px; height: ${p.H * 1.6}px; z-index: ${z}; transform-origin: 50% 0; transform: perspective(${px(60)}px) rotateX(64deg);
        background: linear-gradient(${hexA(cor, alfa)} ${px(0.25)}px, transparent ${px(0.25)}px) 0 0 / 100% ${passo}px, linear-gradient(90deg, ${hexA(cor, alfa)} ${px(0.25)}px, transparent ${px(0.25)}px) 0 0 / ${passo}px 100%;
        -webkit-mask-image: linear-gradient(180deg, rgba(0,0,0,0), #000 22%, #000 70%, rgba(0,0,0,0)); mask-image: linear-gradient(180deg, rgba(0,0,0,0), #000 22%, #000 70%, rgba(0,0,0,0)); }
      #${id}h { position: absolute; left: 0; right: 0; top: ${Math.round(p.H * horizonte) - px(0.2)}px; height: ${px(0.4)}px; z-index: ${z}; background: linear-gradient(90deg, ${hexA(cor, 0)}, ${hexA(cor, 0.9)} 50%, ${hexA(cor, 0)}); box-shadow: 0 0 ${px(3)}px ${hexA(cor, 0.8)}; }`;
    const html = `<div id="${id}"></div><div id="${id}h"></div>`;
    const dist = Math.round((t1 - t0) * vel * passo * 1.5);
    const js = `tl.fromTo("#${id}", { backgroundPosition: "0px 0px, 0px 0px" }, { backgroundPosition: "0px ${dist}px, 0px 0px", duration: ${f2(t1 - t0)}, ease: "none" }, ${f2(t0)});`;
    return { html, css, js };
  },

  // partículas num canvas: 'poeira' (sobe devagar, pisca) ou 'explosao' (balística a partir de um ponto); função pura do tempo
  particulas(p, { id, n = 60, t0, t1, modo = "poeira", origem = [p.W / 2, p.H / 2], semente = 5, cor = p.T.destaque, z = 4, forca = 1 }) {
    const css = `#${id} { position: absolute; left: 0; top: 0; width: ${p.W}px; height: ${p.H}px; z-index: ${z}; pointer-events: none; ${p.claro ? "" : "mix-blend-mode: screen;"} }`;
    const html = `<canvas id="${id}" width="${p.W}" height="${p.H}"></canvas>`;
    const js = `{ let cv = document.getElementById("${id}"), cx = cv.getContext("2d"), W = ${p.W}, H = ${p.H}, N = ${n}, U = ${p.u}, P = [];
        for (let i = 0; i < N; i++) P.push({ x: rnd(i, ${semente}) * W, y: rnd(i, ${semente + 1}) * H, v: (.4 + rnd(i, ${semente + 2})) * U * 2.2, r: (.3 + rnd(i, ${semente + 3}) * .6) * U, f: rnd(i, ${semente + 4}) * 6.28, a: (rnd(i, ${semente + 5}) - .5) * 2, sp: (.5 + rnd(i, ${semente + 6})) * U * 26 * ${forca} });
        let desenha = function (tau) { cx.clearRect(0, 0, W, H); for (var i = 0; i < N; i++) { var q = P[i], x, y, al;
            if ("${modo}" === "poeira") { y = ((q.y - q.v * tau) % H + H) % H; x = q.x + Math.sin(tau * 1.3 + q.f) * U * 1.5; al = .55 + .4 * Math.sin(tau * 3 + q.f); }
            else { var ang = q.f, d = q.sp * (1 - Math.exp(-tau * 3)) / 3; x = ${origem[0]} + Math.cos(ang) * d * (1 + q.a * .3); y = ${origem[1]} + Math.sin(ang) * d + 40 * U * tau * tau * .4; al = Math.max(0, 1 - tau / 1.4); }
            var g = cx.createRadialGradient(x, y, 0, x, y, q.r * 4); g.addColorStop(0, "rgba(255,255,255," + al + ")"); g.addColorStop(.25, "${hexA(cor, 1)}".replace(",1)", "," + al + ")")); g.addColorStop(1, "${hexA(cor, 0)}");
            cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, q.r * 4, 0, 6.2832); cx.fill(); } };
        let o = { t: 0 }; tl.fromTo(o, { t: 0 }, { t: ${f2(t1 - t0)}, duration: ${f2(t1 - t0)}, ease: "none", onUpdate: function () { desenha(o.t); } }, ${f2(t0)});
        tl.set("#${id}", { opacity: 0 }, 0); tl.set("#${id}", { opacity: 1 }, ${f2(t0)}); tl.set("#${id}", { opacity: 0 }, ${f2(t1)}); }`;
    return { html, css, js };
  },

  // camadas de tela: linhas de varredura, grão animado, vinheta e (opcional) borda de tubo; vão por cima de tudo no palco
  tela(p, { varredura = true, grao = true, vinheta = true, tubo = false, t1 = 60 } = {}) {
    const { px } = p;
    const css = `.k-ov { position: absolute; inset: 0; pointer-events: none; z-index: 80; }
      #k-scan { background: repeating-linear-gradient(0deg, rgba(0,0,0,${p.claro ? 0.04 : 0.16}) 0 ${Math.max(1, px(0.17))}px, rgba(0,0,0,0) ${Math.max(1, px(0.17))}px ${Math.max(3, px(0.45))}px); }
      #k-grao { inset: -${px(4)}px; background: url("assets/grain.png"); background-size: ${px(40)}px ${px(71)}px; mix-blend-mode: ${p.claro ? "multiply" : "screen"}; opacity: ${p.claro ? 0.08 : 0.13}; }
      #k-vin { background: radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 46%, rgba(0,0,0,${p.claro ? 0.22 : 0.55}) 100%); }
      #k-tubo { border-radius: ${px(5)}px; box-shadow: inset 0 0 ${px(6)}px rgba(0,0,0,.8), inset 0 0 0 ${px(1)}px rgba(0,0,0,.6); }`;
    const html = `${varredura ? '<div class="k-ov" id="k-scan"></div>' : ""}${grao ? '<div class="k-ov" id="k-grao"></div>' : ""}${vinheta ? '<div class="k-ov" id="k-vin"></div>' : ""}${tubo ? '<div class="k-ov" id="k-tubo"></div>' : ""}`;
    const js = grao ? `for (var gi = 0; gi < ${Math.ceil(t1 * 8)}; gi++) tl.set("#k-grao", { backgroundPosition: Math.round(rnd(gi, 9) * ${px(40)}) + "px " + Math.round(rnd(gi, 10) * ${px(71)}) + "px" }, gi / 8);` : "";
    return { html, css, js };
  },

  // orbe de luz ambiente que passeia (bloom de fundo)
  orbe(p, { id = "korbe", pontos, t0 = 0, passo = 6, cor = p.T.destaque, tam = 75, alfa = 0.3 }) {
    const { px } = p, r = px(tam);
    const css = `#${id} { position: absolute; left: -${r / 2}px; top: -${r / 2}px; width: ${r}px; height: ${r}px; border-radius: 50%; z-index: 0; background: radial-gradient(circle, ${hexA(cor, alfa)} 0, ${hexA(cor, alfa * 0.35)} 35%, ${hexA(cor, 0)} 70%); }`;
    const js = pontos.map(([x, y], i) => { const nx = pontos[i + 1] || pontos[0]; return `tl.fromTo("#${id}", { x: ${x}, y: ${y} }, { x: ${nx[0]}, y: ${nx[1]}, duration: ${passo}, ease: "sine.inOut", immediateRender: ${i === 0} }, ${f2(t0 + i * passo)});`; }).join("\n      ");
    return { html: `<div id="${id}"></div>`, css, js };
  },

  // texto 3D extrudado: N camadas deslocadas, mais escuras para trás (devolve só HTML; animar o contêiner)
  extrudado(p, { id, texto, classe = "k-gig", camadas = 9, dx = 0.006, dy = 0.011, cor = p.T.destaque, neon = true, rastro = 0 }) {
    // a extrusão é feita com sombras de texto empilhadas (uma por camada), atrás das camadas de brilho: um só elemento, leve e legível
    const fundo = p.claro ? mistura(cor, "#000000", 0.35) : mistura(cor, p.T.fundo, 0.7);
    const ext = Array.from({ length: camadas }, (_, i) => { const k = i + 1; return `${f2(k * dx)}em ${f2(k * dy)}em 0 ${mistura(fundo, "#000000", (k / camadas) * 0.55)}`; }).join(", ");
    const sombra = `${neon ? brilho(p) : brilho(p, cor, 0.7)}, ${ext}, ${f2((camadas + 2) * dx)}em ${f2((camadas + 4) * dy)}em .12em rgba(0,0,0,.6)`;
    const R = Array.from({ length: rastro }, (_, i) => `<span class="k-rastro" id="${id}r${i}" aria-hidden="true" style="position:absolute;left:0;top:0;opacity:0;color:${hexA(cor, 0.5 - i * 0.1)}">${texto}</span>`).join("");
    return `<div class="${classe}" id="${id}" data-layout-allow-overlap style="position:relative;display:inline-block">${R}<span style="position:relative;color:${neon ? nucleo(p, cor) : (p.claro ? p.T.texto : "#fff")};text-shadow:${sombra}">${texto}</span></div>`;
  },
};

// =====================================================================
// CENAS MODELO (cada uma: { html, css, js }; posição em frações do palco)
// =====================================================================
const cena = (id, inner, z) => `<div class="k-cena" id="${id}"${z ? ` style="z-index:${z}"` : ""}>${inner}</div>`;
export const cenas = {
  // 01 palavra gigante 3D com brilho, rastro, faísca e tremor
  heroi(p, { id, ini, fim, texto, t, topo = 0.42, flare = true, glitchar = false, tam = 22, cor = p.T.destaque, neon = true }) {
    const fs_ = p.px(tam);
    const ex = efeitos.extrudado(p, { id: id + "x", texto, cor, neon, rastro: 4 });
    const fl = flare ? efeitos.flare(p, { id: id + "f", x: p.W * 0.18, x1: p.W * 0.82, y: Math.round(p.H * topo + fs_ * 0.45), t: t + 0.04, dur: 0.95, cor }) : null;
    const html = cena(id, `<div id="${id}s" style="position:absolute;left:0;right:0;top:${Math.round(p.H * topo)}px;display:flex;justify-content:center"><div id="${id}w" style="position:relative;font-size:${fs_}px">${ex.replace('class="k-gig"', `class="k-gig" style="font-size:${fs_}px"`)}</div></div>${fl ? fl.html : ""}`);
    const js = `${cenaVis(id, ini, fim)}
      tl.fromTo("#${id}w", { opacity: 0, scale: 1.75, y: ${p.px(4)}, filter: "blur(${p.px(1.6)}px)" }, { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: .45, ease: E.slam }, ${f2(t)});
      rastro(${JSON.stringify([0, 1, 2, 3].map((i) => `#${id}xr${i}`))}, { opacity: .6, scale: 1.75, y: ${p.px(4)} }, { opacity: 0, scale: 1, y: 0, duration: .45, ease: E.slam }, ${f2(t)}, .03);
      shake("#${id}s", ${f2(t + 0.24)}, ${p.px(0.9)});
      tl.fromTo("#${id}w", { scale: 1 }, { scale: 1.04, duration: ${f2(Math.max(0.5, fim - t - 0.5))}, ease: "none", immediateRender: false }, ${f2(t + 0.5)});
      ${glitchar ? `glitch("#${id}s", ${f2(t + 0.55)}, .22, ${p.px(1.2)});` : ""}${fl ? fl.js : ""}`;
    return { html, css: fl ? fl.css : "", js };
  },

  // 02 número gigante contando, com escala que cresce com o valor
  numero(p, { id, ini, fim, de = 0, ate, t, dur = 1.3, fmt = "n", prefixo = "", sufixo = "", rotulo = "", topo = 0.36 }) {
    const fmts = { n: "function(n){return String(Math.round(n))}", tempo: "function(n){n=Math.round(n);return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')}", moeda: "function(n){return Math.round(n).toLocaleString('pt-BR')}" };
    const html = cena(id, `<div id="${id}b" style="position:absolute;left:0;right:0;top:${Math.round(p.H * topo)}px;text-align:center"><span class="k-num k-neon">${esc(prefixo)}<span id="${id}n">${de}</span>${esc(sufixo)}</span></div>
      ${rotulo ? `<div style="position:absolute;left:0;right:0;top:${Math.round(p.H * (topo + 0.33))}px;display:flex;justify-content:center"><div class="k-chip" id="${id}r" style="position:relative"><span>${esc(rotulo)}</span></div></div>` : ""}`);
    const js = `${cenaVis(id, ini, fim)}
      tl.fromTo("#${id}b", { opacity: 0, scale: .55 }, { opacity: 1, scale: 1.06, duration: ${dur}, ease: "power2.out" }, ${f2(t)}); tl.to("#${id}b", { scale: 1, duration: .25, ease: E.pop }, ${f2(t + dur)});
      contar("${id}n", ${de}, ${ate}, ${f2(t)}, ${dur}, ${fmts[fmt] || fmt});
      shake("#${id}b", ${f2(t + dur)}, ${p.px(0.8)}); flash(${f2(t + dur)}, .22);
      ${rotulo ? `tl.fromTo("#${id}r", { opacity: 0, y: ${p.px(3)} }, { opacity: 1, y: 0, duration: .35, ease: E.ui }, ${f2(t + dur + 0.1)});` : ""}`;
    return { html, js };
  },

  // 03 pedido digitado numa barra, com sugestões que aparecem embaixo (autocomplete) e botão de enviar que afunda
  pedido(p, { id, ini, fim, texto, t, dur, sugestoes = [], chip = "", topo = 0.27, altura = 0.42, fonte = 4.6, margem = 8 }) {
    const { px } = p, L = px(margem);
    const html = cena(id, `<div class="k-painel" id="${id}p" style="left:${L}px;right:${L}px;top:${Math.round(p.H * topo)}px;height:${Math.round(p.H * altura)}px">
        <div class="k-micro" style="position:absolute;left:${px(3)}px;top:${px(2.4)}px;color:var(--acc)">› PEDIDO PARA A SUA IA</div>
        <div style="position:absolute;left:${px(3)}px;right:${px(3)}px;top:${px(6)}px;font:600 ${px(fonte)}px/1.3 var(--texto);color:var(--txt)"><span id="${id}t"></span><i id="${id}c" style="display:inline-block;width:${px(0.45)}px;height:${px(fonte * 1.05)}px;margin-left:${px(0.3)}px;vertical-align:-${px(0.8)}px;background:var(--acc);box-shadow:0 0 ${px(1)}px var(--acc)"></i></div>
        <i id="${id}e" style="position:absolute;right:${px(2.4)}px;bottom:${px(2.2)}px;width:${px(6)}px;height:${px(6)}px;border-radius:50%;background:var(--acc);box-shadow:0 0 ${px(2.5)}px var(--acc)"><svg viewBox="0 0 24 24" style="position:absolute;left:22%;top:22%;width:56%;height:56%"><path d="M5 12h12M12 6l6 6-6 6" stroke="${p.T.fundo}" stroke-width="3" fill="none" stroke-linecap="round"/></svg></i></div>
      ${sugestoes.map((s, i) => `<div class="k-chip" id="${id}s${i}" style="left:${L + i * 0}px;top:${Math.round(p.H * (topo + altura) + px(2.5) + i * px(7.2))}px;opacity:0">${esc(s)}</div>`).join("")}
      ${chip ? `<div class="k-chip cheio" id="${id}k" style="right:${L}px;top:${Math.round(p.H * (topo + altura) + px(2.5))}px;opacity:0">${esc(chip)}</div>` : ""}`);
    const js = `${cenaVis(id, ini, fim)}
      tl.fromTo("#${id}p", { opacity: 0, y: ${px(5)}, rotationX: 18 }, { opacity: 1, y: 0, rotationX: 0, duration: .42, ease: E.ui }, ${f2(ini)});
      blink("#${id}c", ${f2(ini)}, ${Math.max(1, Math.floor((fim - ini) / 0.26) - 1)});
      typer("${id}t", ${JSON.stringify(texto)}, ${f2(t)}, ${f2(dur)});
      ${sugestoes.map((s, i) => `tl.fromTo("#${id}s${i}", { opacity: 0, x: -${px(3)} }, { opacity: 1, x: 0, duration: .3, ease: E.ui }, ${f2(t + dur * (0.25 + i * 0.25))});`).join("\n      ")}
      tl.to("#${id}e", { scale: .82, duration: .08, ease: "none" }, ${f2(t + dur + 0.15)}); tl.to("#${id}e", { scale: 1, duration: .35, ease: E.pop }, ${f2(t + dur + 0.23)}); flash(${f2(t + dur + 0.2)}, .15);
      ${chip ? `pop("#${id}k", ${f2(t + dur + 0.3)});` : ""}`;
    return { html, js };
  },

  // 04 cartões que entram girando e acendem quando a palavra é dita
  cartoes(p, { id, ini, fim, itens, ts, topo = 0.33, altura = 0.42, entrada }) {
    const { px } = p, n = itens.length, M = px(7), g = px(3), w = Math.floor((p.W - 2 * M - (n - 1) * g) / n);
    const html = cena(id, itens.map((it, i) => `<div class="k-painel" id="${id}k${i}" style="left:${M + i * (w + g)}px;top:${Math.round(p.H * topo)}px;width:${w}px;height:${Math.round(p.H * altura)}px">
        <div class="k-micro" style="position:absolute;left:${px(2.4)}px;top:${px(2.4)}px">${String(i + 1).padStart(2, "0")} · ${esc(it.rot || "")}</div>
        <div style="position:absolute;left:0;right:0;top:${Math.round(p.H * altura * 0.2)}px;height:${Math.round(p.H * altura * 0.45)}px;display:flex;align-items:center;justify-content:center;font-size:${px(13)}px" class="k-neon">${it.icone || ""}</div>
        <div class="k-apoio" style="position:absolute;left:${px(2.4)}px;right:${px(2.4)}px;bottom:${px(2.6)}px;font-size:${px(it.tam || 4.6)}px;line-height:1.1">${esc(it.titulo)}</div></div>`).join(""));
    const js = `${cenaVis(id, ini, fim)}
      ${itens.map((_, i) => `tl.fromTo("#${id}k${i}", { opacity: 0, y: ${px(8)}, rotationY: -55, scale: .9 }, { opacity: ${entrada != null ? 0.45 : 1}, y: 0, rotationY: 0, scale: 1, duration: .5, ease: E.pop }, ${f2(entrada != null ? entrada + i * 0.14 : ts[i] - 0.12)});${entrada != null ? ` tl.to("#${id}k${i}", { opacity: 1, scale: 1.04, duration: .2, ease: E.ui }, ${f2(ts[i] - 0.05)}); tl.to("#${id}k${i}", { scale: 1, duration: .3, ease: E.pop }, ${f2(ts[i] + 0.15)});` : ""} tl.fromTo("#${id}k${i}", { borderColor: "${hexA(p.T.destaque, 0.25)}" }, { borderColor: "${p.T.destaque}", duration: .2, ease: "none" }, ${f2(ts[i])}); pulsoBrilho("#${id}k${i}", ${f2(ts[i])}, .12, 1);`).join("\n      ")}`;
    return { html, js };
  },

  // 05 antes × depois com cortina que varre
  antesDepois(p, { id, ini, fim, antes, depois, t, tVarre, topo = 0.25, altura = 0.55 }) {
    const { px } = p, M = px(7), w = p.W - 2 * M, h = Math.round(p.H * altura);
    const lado = (o, cls, extra) => `<div class="k-painel" id="${id}${cls}" style="left:${M}px;top:${Math.round(p.H * topo)}px;width:${w}px;height:${h}px;overflow:hidden;${extra || ""}">
        <div class="k-rot" style="position:absolute;left:${px(3)}px;top:${px(2.6)}px;color:${cls === "a" ? "var(--alerta)" : "var(--ok)"}">${esc(o.rot)}</div>${o.html}</div>`;
    const html = cena(id, `${lado(antes, "a")}${lado(depois, "d", `background:${p.T.superficie};`)}<i id="${id}l" style="position:absolute;top:${Math.round(p.H * topo) - px(2)}px;height:${h + px(4)}px;width:${px(0.5)}px;left:${M}px;background:#fff;box-shadow:0 0 ${px(2)}px var(--acc),0 0 ${px(6)}px var(--acc);opacity:0"></i>`);
    const js = `${cenaVis(id, ini, fim)}
      rise("#${id}a", ${f2(t)}, .4, ${px(5)});
      tl.fromTo("#${id}d", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: .7, ease: E.cam }, ${f2(tVarre)});
      tl.set("#${id}l", { opacity: 1 }, ${f2(tVarre)}); tl.fromTo("#${id}l", { x: 0 }, { x: ${w}, duration: .7, ease: E.cam }, ${f2(tVarre)}); tl.set("#${id}l", { opacity: 0 }, ${f2(tVarre + 0.72)});`;
    return { html, js };
  },

  // 06 linha do tempo: passos que acendem em sequência com um fio de luz
  linhaTempo(p, { id, ini, fim, passos, ts, topo = 0.5 }) {
    const { px } = p, M = px(10), n = passos.length, step = (p.W - 2 * M) / (n - 1), y = Math.round(p.H * topo);
    const html = cena(id, `<i style="position:absolute;left:${M}px;right:${M}px;top:${y}px;height:${px(0.3)}px;background:${hexA(p.T.texto, 0.15)}"></i>
      <i id="${id}f" style="position:absolute;left:${M}px;width:${p.W - 2 * M}px;top:${y}px;height:${px(0.3)}px;background:var(--acc);box-shadow:0 0 ${px(1.5)}px var(--acc);transform-origin:0 50%"></i>
      ${passos.map((s, i) => `<div id="${id}p${i}" style="position:absolute;left:${Math.round(M + i * step) - px(2.2)}px;top:${y - px(2.2)}px;width:${px(4.4)}px;height:${px(4.4)}px;border-radius:50%;background:var(--fundo);border:${px(0.4)}px solid var(--acc);box-shadow:0 0 ${px(2)}px var(--acc)"></div>
        <div class="k-apoio" id="${id}t${i}" style="position:absolute;left:${Math.round(M + i * step) - px(14)}px;width:${px(28)}px;text-align:center;top:${i % 2 ? y + px(5) : y - px(13)}px;font-size:${px(4.4)}px">${esc(s)}</div>`).join("")}`);
    const js = `${cenaVis(id, ini, fim)}
      tl.fromTo("#${id}f", { scaleX: 0 }, { scaleX: 1, duration: ${f2(ts[n - 1] - ts[0] + 0.3)}, ease: "power1.inOut" }, ${f2(ts[0])});
      ${passos.map((_, i) => `pop("#${id}p${i}", ${f2(ts[i])}); rise("#${id}t${i}", ${f2(ts[i] + 0.05)}, .3, ${i % 2 ? -px(2) : px(2)});`).join("\n      ")}`;
    return { html, js };
  },

  // 07 código rolando num editor (linhas reais), com linha atual acesa
  codigo(p, { id, ini, fim, linhas, titulo = "index.html", t, dur, topo = 0.2, altura = 0.62, primeiraLinha = 1 }) {
    const { px } = p, M = px(8), lh = px(3.6);
    const sp = (c, x) => `<b style="color:${c};font-weight:500">${x}</b>`;
    const cor = (l) => esc(l).replace(/("[^"]*"|'[^']*')|\b(const|var|let|function|return|tl|gsap)\b|(\b\d+(?:\.\d+)?\b)/g, (m, str, kw, num) => (str ? sp(p.T.ok, str) : kw ? sp(p.T.destaque, kw) : sp("#ffd27a", num)));
    const html = cena(id, `<div class="k-painel" id="${id}p" style="left:${M}px;right:${M}px;top:${Math.round(p.H * topo)}px;height:${Math.round(p.H * altura)}px;overflow:hidden">
        <div class="k-micro" style="position:absolute;left:0;right:0;top:0;height:${px(5)}px;line-height:${px(5)}px;padding-left:${px(10)}px;background:${hexA(p.T.destaque, 0.12)};color:var(--txt)">${esc(titulo)}</div>
        <i style="position:absolute;left:${px(2.4)}px;top:${px(1.8)}px;width:${px(1.4)}px;height:${px(1.4)}px;border-radius:50%;background:var(--alerta);box-shadow:${px(2.2)}px 0 0 #ffd27a,${px(4.4)}px 0 0 var(--ok)"></i>
        <i style="position:absolute;left:0;right:0;top:${Math.round(p.H * altura * 0.45)}px;height:${lh}px;background:${hexA(p.T.destaque, 0.14)};border-left:${px(0.4)}px solid var(--acc)"></i>
        <div id="${id}l" style="position:absolute;left:${px(2.5)}px;right:${px(2)}px;top:${px(7)}px;font:500 ${px(2.4)}px/${lh}px var(--mono);white-space:pre;color:${hexA(p.T.texto, 0.82)}">${linhas.map((l, i) => `<div><i style="font-style:normal;color:${hexA(p.T.texto, 0.3)};margin-right:${px(2)}px">${String(primeiraLinha + i).padStart(3, " ")}</i>${cor(l) || "&nbsp;"}</div>`).join("")}</div></div>`);
    const rolar = Math.max(0, linhas.length * lh - p.H * altura * 0.5);
    const js = `${cenaVis(id, ini, fim)}
      tl.fromTo("#${id}p", { opacity: 0, y: ${px(6)}, rotationX: 22 }, { opacity: 1, y: 0, rotationX: 0, duration: .45, ease: E.ui }, ${f2(ini)});
      tl.fromTo("#${id}l", { y: 0 }, { y: ${-Math.round(rolar)}, duration: ${f2(dur)}, ease: "none" }, ${f2(t)});`;
    return { html, js };
  },

  // 08 gráfico de barras (ou linha) que cresce, com valor no topo
  grafico(p, { id, ini, fim, valores, rotulos = [], t, unidade = "", topo = 0.3, altura = 0.45, destaqueIdx = -1 }) {
    const { px } = p, M = px(12), n = valores.length, g = px(3), w = Math.floor((p.W - 2 * M - (n - 1) * g) / n), max = Math.max(...valores), base = Math.round(p.H * (topo + altura));
    const html = cena(id, `<i style="position:absolute;left:${M}px;right:${M}px;top:${base}px;height:${px(0.25)}px;background:${hexA(p.T.texto, 0.35)}"></i>
      ${valores.map((v, i) => { const h = Math.round((v / max) * p.H * altura), d = i === destaqueIdx; return `<div id="${id}b${i}" style="position:absolute;left:${M + i * (w + g)}px;top:${base - h}px;width:${w}px;height:${h}px;transform-origin:50% 100%;border-radius:${px(1)}px ${px(1)}px 0 0;background:linear-gradient(180deg, ${d ? p.T.destaque : hexA(p.T.destaque, 0.55)}, ${hexA(p.T.destaque, 0.12)});box-shadow:0 0 ${px(d ? 4 : 1.5)}px ${hexA(p.T.destaque, d ? 0.7 : 0.3)}"></div>
        <div class="k-rot" id="${id}v${i}" style="position:absolute;left:${M + i * (w + g)}px;width:${w}px;text-align:center;top:${base - h - px(5)}px;color:var(--txt);font-size:${px(3.2)}px">${v}${esc(unidade)}</div>
        <div class="k-micro" style="position:absolute;left:${M + i * (w + g)}px;width:${w}px;text-align:center;top:${base + px(2)}px">${esc(rotulos[i] || "")}</div>`; }).join("")}`);
    const js = `${cenaVis(id, ini, fim)}
      ${valores.map((_, i) => `tl.fromTo("#${id}b${i}", { scaleY: 0 }, { scaleY: 1, duration: .55, ease: E.slam }, ${f2(t + i * 0.08)}); rise("#${id}v${i}", ${f2(t + i * 0.08 + 0.3)}, .25, ${px(2)});`).join("\n      ")}
      ${destaqueIdx >= 0 ? `pulsoBrilho("#${id}b${destaqueIdx}", ${f2(t + n * 0.08 + 0.5)}, .14, 2);` : ""}`;
    return { html, js };
  },

  // 09 medidor (arco + ponteiro) que sobe até um valor
  medidor(p, { id, ini, fim, valor, rotulo, t, dur = 1.1, topo = 0.3, sufixo = "%" }) {
    const { px } = p, R = px(26), cx = p.W / 2, cy = Math.round(p.H * topo) + R, L = Math.PI * R;
    const html = cena(id, `<svg style="position:absolute;left:${cx - R - px(3)}px;top:${cy - R - px(3)}px;width:${2 * R + px(6)}px;height:${R + px(6)}px;overflow:visible" viewBox="${-R - px(3)} ${-R - px(3)} ${2 * R + px(6)} ${R + px(6)}">
        <path d="M ${-R} 0 A ${R} ${R} 0 0 1 ${R} 0" fill="none" stroke="${hexA(p.T.texto, 0.12)}" stroke-width="${px(2.4)}" stroke-linecap="round"/>
        <path id="${id}a" d="M ${-R} 0 A ${R} ${R} 0 0 1 ${R} 0" fill="none" stroke="${p.T.destaque}" stroke-width="${px(2.4)}" stroke-linecap="round" style="filter:drop-shadow(0 0 ${px(1.4)}px ${p.T.destaque})"/>
        <g id="${id}g"><line x1="0" y1="0" x2="${-R + px(5)}" y2="0" stroke="#fff" stroke-width="${px(0.6)}" stroke-linecap="round"/></g><circle r="${px(1.6)}" fill="#fff"/></svg>
      <div style="position:absolute;left:0;right:0;top:${cy + px(4)}px;text-align:center"><span class="k-num k-neon" style="font-size:${px(16)}px"><span id="${id}n">0</span>${esc(sufixo)}</span></div>
      <div class="k-rot" style="position:absolute;left:0;right:0;top:${cy + px(22)}px;text-align:center;color:var(--txt)">${esc(rotulo)}</div>`);
    const js = `${cenaVis(id, ini, fim)}
      tl.fromTo("#${id}a", { strokeDasharray: ${f2(L)}, strokeDashoffset: ${f2(L)} }, { strokeDashoffset: ${f2(L * (1 - valor / 100))}, duration: ${dur}, ease: "power2.out" }, ${f2(t)});
      tl.fromTo("#${id}g", { rotation: 0, svgOrigin: "0 0" }, { rotation: ${f2(180 * valor / 100)}, svgOrigin: "0 0", duration: ${dur}, ease: "back.out(1.3)" }, ${f2(t)});
      contar("${id}n", 0, ${valor}, ${f2(t)}, ${dur});`;
    return { html, js };
  },

  // 10 selo de prova (carimbo que cai e treme)
  selo(p, { id, ini, fim, l1, l2 = "", t, topo = 0.36, cor = p.T.ok }) {
    const { px } = p;
    const html = cena(id, `<div style="position:absolute;left:0;right:0;top:${Math.round(p.H * topo)}px;display:flex;justify-content:center"><div id="${id}s" style="padding:${px(2.6)}px ${px(5)}px;border:${px(0.8)}px solid ${cor};border-radius:${px(2.4)}px;text-align:center;color:${cor};box-shadow:0 0 ${px(4)}px ${hexA(cor, 0.5)}, inset 0 0 ${px(3)}px ${hexA(cor, 0.3)};background:${hexA(p.T.fundo, 0.7)}">
        <div style="font:400 ${px(9)}px/1 var(--impacto);white-space:nowrap;text-shadow:0 0 ${px(2)}px ${hexA(cor, 0.8)}">${esc(l1)}</div>${l2 ? `<div class="k-rot" style="margin-top:${px(1.6)}px;color:${cor}">${esc(l2)}</div>` : ""}</div></div>`);
    const js = `${cenaVis(id, ini, fim)}
      tl.fromTo("#${id}s", { opacity: 0, scale: 2.6, rotation: -18 }, { opacity: 1, scale: 1, rotation: -6, duration: .32, ease: "power4.out" }, ${f2(t)}); shake("#${id}s", ${f2(t + 0.3)}, ${px(1)}); flash(${f2(t + 0.3)}, .3);`;
    return { html, js };
  },

  // 11 lista que vai sendo marcada
  checklist(p, { id, ini, fim, itens, ts, topo = 0.3 }) {
    const { px } = p, M = px(14), lh = px(10);
    const html = cena(id, itens.map((it, i) => `<div id="${id}i${i}" style="position:absolute;left:${M}px;right:${M}px;top:${Math.round(p.H * topo) + i * lh}px;height:${px(8)}px">
        <svg viewBox="0 0 24 24" style="position:absolute;left:0;top:${px(1)}px;width:${px(6)}px;height:${px(6)}px"><rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="${hexA(p.T.destaque, 0.6)}" stroke-width="2"/><path id="${id}v${i}" d="M6 12.5l4 4 8-9" fill="none" stroke="${p.T.ok}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 2px ${p.T.ok})"/></svg>
        <div class="k-apoio" style="position:absolute;left:${px(9)}px;top:${px(0.8)}px;font-size:${px(5.4)}px;white-space:nowrap">${esc(it)}</div></div>`).join(""));
    const js = `${cenaVis(id, ini, fim)}
      ${itens.map((_, i) => `rise("#${id}i${i}", ${f2(ts[i] - 0.1)}, .3, ${px(3)}); draw("#${id}v${i}", 24, ${f2(ts[i] + 0.12)}, .25, "power2.out");`).join("\n      ")}`;
    return { html, js };
  },

  // 12 etiqueta de preço que a mira trava e o laser corta: some o preço, nasce "GRÁTIS"
  precoCortado(p, { id, ini, fim, rotulo = "À VENDA", preco = "R$ ••,••", novo = "GRÁTIS", tMira, tCorte, topo = 0.34, semEntrada = false }) {
    const { px } = p, w = px(72), h = px(30), x = Math.round((p.W - w) / 2), y = Math.round(p.H * topo);
    const mira = efeitos.mira(p, { id: id + "m", de: [p.W * 0.15, p.H * 0.85], para: [x + w / 2, y + h / 2], t: tMira, dur: Math.max(0.5, tCorte - tMira - 0.25), rotulo: "PREÇO" });
    const novoTam = px(18);
    const metade = (cls, clip) => `<div id="${id}${cls}" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;clip-path:${clip}">
        <div style="position:absolute;inset:0;border-radius:${px(3)}px;background:${p.claro ? "#fff" : "#f4efe4"};box-shadow:0 0 ${px(5)}px ${hexA(p.T.destaque, 0.25)}"></div>
        <i style="position:absolute;left:${px(4)}px;top:${h / 2 - px(2)}px;width:${px(4)}px;height:${px(4)}px;border-radius:50%;background:var(--fundo)"></i>
        <div class="k-rot" style="position:absolute;left:${px(12)}px;top:${px(4)}px;color:#5a4a36;font-size:${px(3)}px">${esc(rotulo)}</div>
        <div style="position:absolute;left:${px(12)}px;top:${px(10)}px;font:400 ${px(12)}px/1 var(--impacto);color:#1a1410;letter-spacing:-.02em;white-space:nowrap">${esc(preco)}</div></div>`;
    const html = cena(id, `${metade("a", `polygon(0 0, 100% 0, 100% 46%, 0 54%)`)}${metade("b", `polygon(0 54%, 100% 46%, 100% 100%, 0 100%)`)}
      <i id="${id}l" style="position:absolute;left:${x - px(10)}px;width:${w + px(20)}px;top:${y + h / 2 - px(0.25)}px;height:${px(0.5)}px;transform:rotate(-2.6deg);transform-origin:0 50%;background:#fff;box-shadow:0 0 ${px(1)}px #fff,0 0 ${px(3)}px var(--acc),0 0 ${px(8)}px var(--acc);opacity:0"></i>
      <div id="${id}n" style="position:absolute;left:0;right:0;top:${y + h / 2 - novoTam * 0.5}px;display:flex;justify-content:center;opacity:0">${efeitos.extrudado(p, { id: id + "nx", texto: esc(novo), rastro: 0 }).replace('class="k-gig"', `class="k-gig" style="font-size:${novoTam}px"`)}</div>
      ${mira.html}`);
    const js = `${cenaVis(id, ini, fim)}
      ${semEntrada ? `tl.set(["#${id}a", "#${id}b"], { opacity: 1 }, 0);` : `tl.fromTo(["#${id}a", "#${id}b"], { opacity: 0, y: ${px(6)}, rotation: -4 }, { opacity: 1, y: 0, rotation: 0, duration: .4, ease: E.ui }, ${f2(ini)});`}
      tl.fromTo(["#${id}a", "#${id}b"], { rotation: 0 }, { rotation: 1.2, duration: .9, yoyo: true, repeat: 3, ease: "sine.inOut", immediateRender: false }, ${f2(ini + 0.4)});
      ${mira.js}
      tl.set("#${id}l", { opacity: 1 }, ${f2(tCorte)}); tl.fromTo("#${id}l", { scaleX: 0 }, { scaleX: 1, duration: .16, ease: "power2.in" }, ${f2(tCorte)}); tl.to("#${id}l", { opacity: 0, duration: .2 }, ${f2(tCorte + 0.2)});
      tl.to("#${id}a", { y: -${px(9)}, x: -${px(5)}, rotation: -9, opacity: 0, duration: .55, ease: "power2.out" }, ${f2(tCorte + 0.16)});
      tl.to("#${id}b", { y: ${px(14)}, x: ${px(4)}, rotation: 7, opacity: 0, duration: .55, ease: "power2.in" }, ${f2(tCorte + 0.16)});
      tl.to("#${id}m", { opacity: 0, duration: .15 }, ${f2(tCorte + 0.1)});
      flash(${f2(tCorte + 0.16)}, .55);
      tl.fromTo("#${id}n", { opacity: 0, scale: 1.8, filter: "blur(${px(1.5)}px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: .45, ease: E.slam }, ${f2(tCorte + 0.22)}); shake("#${id}n", ${f2(tCorte + 0.45)}, ${px(1)});`;
    return { html, css: mira.css, js };
  },

  // 13 alvo na palavra: a mira passeia e trava numa palavra-chave com leitura técnica
  alvo(p, { id, ini, fim, texto, t, topo = 0.42, rotulo = "TRAVADO" }) {
    const { px } = p, y = Math.round(p.H * topo), tam = px(16);
    const mira = efeitos.mira(p, { id: id + "m", de: [p.W * 0.82, p.H * 0.2], para: [p.W / 2, y + tam * 0.5], t, dur: 0.8, rotulo });
    const html = cena(id, `<div id="${id}w" style="position:absolute;left:0;right:0;top:${y}px;text-align:center"><span class="k-gig k-neon-txt" style="font-size:${tam}px">${esc(texto)}</span></div>${mira.html}`);
    const js = `${cenaVis(id, ini, fim)} rise("#${id}w", ${f2(t)}, .35, ${px(2)}); ${mira.js} tl.to("#${id}w span", { color: "${p.T.destaque}", duration: .15 }, ${f2(t + 0.8)}); pulsoBrilho("#${id}w", ${f2(t + 0.8)}, .1, 2);`;
    return { html, css: mira.css, js };
  },

  // 14 fluxo de nós ligados por linhas que se desenham (pedido → IA → vídeo)
  fluxo(p, { id, ini, fim, nos, ts, topo = 0.42 }) {
    const { px } = p, n = nos.length, M = px(6), w = px(36), g = (p.W - 2 * M - n * w) / (n - 1), y = Math.round(p.H * topo), h = px(20);
    const xs = nos.map((_, i) => Math.round(M + i * (w + g)));
    const html = cena(id, `<svg style="position:absolute;left:0;top:0;width:${p.W}px;height:${p.H}px" viewBox="0 0 ${p.W} ${p.H}">${nos.slice(1).map((_, i) => `<path id="${id}c${i}" d="M${xs[i] + w},${y + h / 2} L${xs[i + 1]},${y + h / 2}" stroke="${p.T.destaque}" stroke-width="${px(0.5)}" fill="none" stroke-dasharray="${px(2)} ${px(1.4)}" style="filter:drop-shadow(0 0 ${px(1)}px ${p.T.destaque})"/>`).join("")}</svg>
      ${nos.map((no, i) => `<div class="k-painel" id="${id}n${i}" style="left:${xs[i]}px;top:${y}px;width:${w}px;height:${h}px;text-align:center"><div class="k-micro" style="margin-top:${px(2.6)}px">${String(i + 1).padStart(2, "0")}</div><div class="k-tit" style="font-size:${px(6.2)}px;margin-top:${px(2.2)}px;white-space:nowrap">${esc(no)}</div></div>`).join("")}`);
    const js = `${cenaVis(id, ini, fim)}
      ${nos.map((_, i) => `tl.fromTo("#${id}n${i}", { opacity: 0, scale: .6 }, { opacity: 1, scale: 1, duration: .4, ease: E.pop }, ${f2(ts[i])});${i > 0 ? ` tl.fromTo("#${id}c${i - 1}", { opacity: 0, x: -${px(4)} }, { opacity: 1, x: 0, duration: .3, ease: E.ui }, ${f2(ts[i] - 0.2)}); tl.fromTo("#${id}c${i - 1}", { strokeDashoffset: 0 }, { strokeDashoffset: -${px(34)}, duration: ${f2(Math.max(0.5, fim - ts[i]))}, ease: "none", immediateRender: false }, ${f2(ts[i] - 0.2)});` : ""}`).join("\n      ")}`;
    return { html, js };
  },

  // 15 celular mostrando um vídeo (resultado real)
  celular(p, { id, ini, fim, src, t, dur, inicioMidia = 0, x = 0.5, topo = 0.1, alt = 0.8, chips = [], tChips = [] }) {
    const { px } = p, h = Math.round(p.H * alt), w = Math.round(h * 9 / 16), l = Math.round(p.W * x - w / 2), b = px(1.2);
    const html = cena(id, `<div id="${id}f" style="position:absolute;left:${l}px;top:${Math.round(p.H * topo)}px;width:${w}px;height:${h}px;border-radius:${px(4.5)}px;background:#06080c;border:${b}px solid #1a1f29;box-shadow:0 0 0 ${px(0.3)}px ${hexA(p.T.destaque, 0.6)},0 0 ${px(9)}px ${hexA(p.T.destaque, 0.35)};overflow:hidden">
        <video id="${id}v" src="${src}" muted playsinline data-start="${f2(t)}" data-duration="${f2(dur)}" data-media-start="${inicioMidia}" data-track-index="3" style="width:100%;height:100%;object-fit:cover;display:block"></video></div>
      ${chips.map((c, i) => `<div class="k-chip${i % 2 ? " cheio" : ""}" id="${id}c${i}" style="${x > 0.5 ? "left" : "right"}:${px(6)}px;top:${Math.round(p.H * (0.3 + i * 0.13))}px;opacity:0">${esc(c)}</div>`).join("")}`);
    const js = `${cenaVis(id, ini, fim)}
      tl.fromTo("#${id}f", { opacity: 0, y: ${px(10)}, rotationY: ${x > 0.5 ? -28 : 28} }, { opacity: 1, y: 0, rotationY: 0, duration: .55, ease: E.ui }, ${f2(ini + 0.05)});
      ${chips.map((_, i) => `pop("#${id}c${i}", ${f2(tChips[i] ?? t + 0.6 + i * 0.7)});`).join(" ")}`;
    return { html, js };
  },

  // 16 grade de cartões pequenos que viram (vitrine: "tem tudo isso")
  vitrine(p, { id, ini, fim, itens, t, colunas = 4, topo = 0.27, altura = 0.5 }) {
    const { px } = p, M = px(7), g = px(2), linhas = Math.ceil(itens.length / colunas), w = Math.floor((p.W - 2 * M - (colunas - 1) * g) / colunas), h = Math.floor((p.H * altura - (linhas - 1) * g) / linhas);
    const html = cena(id, itens.map((it, i) => `<div class="k-painel" id="${id}k${i}" style="left:${M + (i % colunas) * (w + g)}px;top:${Math.round(p.H * topo) + Math.floor(i / colunas) * (h + g)}px;width:${w}px;height:${h}px;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 ${px(1.5)}px">
        <div class="k-micro" style="position:absolute;left:${px(1.6)}px;top:${px(1.4)}px">${String(i + 1).padStart(2, "0")}</div><div style="font:700 ${px(3.6)}px/1.1 var(--disp);color:var(--txt)">${esc(it)}</div></div>`).join(""));
    const js = `${cenaVis(id, ini, fim)}
      ${itens.map((_, i) => `tl.fromTo("#${id}k${i}", { opacity: 0, rotationX: -80, y: ${px(3)} }, { opacity: 1, rotationX: 0, y: 0, duration: .38, ease: E.ui }, ${f2(t + Math.min(0.5, i * 0.045))});`).join("\n      ")}`;
    return { html, js };
  },

  // 17 frase de apoio grande (quando não há ilustração literal): bloco tipográfico com sublinhado de luz
  frase(p, { id, ini, fim, texto, t, topo = 0.4, tam = 11 }) {
    const { px } = p;
    const html = cena(id, `<div id="${id}b" style="position:absolute;left:${px(8)}px;right:${px(8)}px;top:${Math.round(p.H * topo)}px;text-align:center"><div class="k-tit k-neon-txt" style="font-size:${px(tam)}px">${texto}</div>
      <i id="${id}u" style="display:block;margin:${px(2.5)}px auto 0;width:${px(40)}px;height:${px(0.5)}px;background:var(--acc);box-shadow:0 0 ${px(2)}px var(--acc);transform-origin:50% 50%"></i></div>`);
    const js = `${cenaVis(id, ini, fim)} rise("#${id}b", ${f2(t)}, .4, ${px(4)}); tl.fromTo("#${id}u", { scaleX: 0 }, { scaleX: 1, duration: .5, ease: E.slam }, ${f2(t + 0.15)});`;
    return { html, js };
  },
};

// =====================================================================
// CENAS DE FECHO (vídeo 9:16 inteiro, fora da tela): iceberg e chamada da Imersão. Usam o molde aprovado (chat-x-agente).
// =====================================================================
export const fecho = {
  // "Isso é só a ponta do iceberg": acima da água o que se viu, abaixo o que a empresa real precisa
  iceberg(p, { id = "ice", t, dur = 4.8, acima = ["o que você viu"], abaixo = ["segurança", "LGPD", "processo"], cartao = 'Modelos mais avançados que <b style="color:var(--alerta)">não treinam</b> com os seus dados' }) {
    const { T } = p;
    const css = `#${id} { position: absolute; inset: 0; z-index: 30; background: radial-gradient(ellipse at 50% 30%, ${T.fundo2} 0, ${T.fundo} 75%); }
      #${id} .t { position: absolute; left: 70px; right: 60px; top: 340px; font: 400 84px/1.0 var(--impacto); color: #fff; letter-spacing: -.02em; }
      #${id} .t b { font-weight: 400; color: ${nucleo(p, T.destaque)}; text-shadow: ${brilho(p, T.destaque, 0.8)}; }
      #${id} .ac { position: absolute; left: 0; right: 0; text-align: center; font: 800 30px/1 var(--mono); color: ${T.fundo}; letter-spacing: .06em; text-transform: uppercase; }
      #${id} .cd { position: absolute; left: 110px; right: 110px; top: 1210px; padding: 30px 34px; border-radius: 30px; background: ${hexA(T.superficie, 0.92)}; border: 3px solid ${hexA(T.destaque, 0.6)}; font: 600 44px/1.18 var(--texto); color: #fff; box-shadow: 0 0 40px ${hexA(T.destaque, 0.3)}; }
      #${id} .ch { position: absolute; top: 1460px; padding: 16px 32px; border-radius: 999px; font: 700 42px/1 var(--texto); color: ${T.fundo}; background: var(--acc); box-shadow: 0 0 30px ${hexA(T.destaque, 0.5)}; }
      #${id} .lg { position: absolute; left: 70px; font: 800 26px/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; color: ${hexA(T.texto, 0.75)}; }`;
    const html = `<section id="${id}" class="clip" data-start="${f2(t)}" data-duration="${dur}" data-track-index="6">
        <div class="t" id="${id}T">ISSO É SÓ A <b>PONTA DO ICEBERG</b></div>
        <svg id="${id}g" viewBox="0 0 1080 1100" style="position:absolute;left:0;top:690px;width:1080px;height:1100px">
          <defs><linearGradient id="${id}ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.destaque}" stop-opacity=".55"/><stop offset="1" stop-color="${T.fundo}" stop-opacity=".95"/></linearGradient></defs>
          <rect x="0" y="300" width="1080" height="800" fill="url(#${id}ag)"/>
          <polygon points="110,320 320,300 540,322 780,300 980,320 920,640 790,900 560,1060 320,980 180,760" fill="${hexA(T.texto, 0.18)}" stroke="${hexA(T.destaque, 0.7)}" stroke-width="4"/>
          <polygon points="250,300 380,120 470,40 560,100 650,10 790,170 880,300" fill="#f4fbff" stroke="#fff" stroke-width="4" style="filter:drop-shadow(0 0 18px ${T.destaque})"/>
          <path id="${id}w" d="M0,300 Q90,276 180,300 T360,300 T540,300 T720,300 T900,300 T1080,300" fill="none" stroke="${T.destaque}" stroke-width="7" style="filter:drop-shadow(0 0 10px ${T.destaque})"/>
        </svg>
        ${acima.map((a, i) => `<div class="ac" id="${id}A${i}" style="top:${820 + i * 48}px">${esc(a)}</div>`).join("")}
        <div class="lg" id="${id}L1" style="top:612px">▲ acima da água: o que você viu</div>
        <div class="cd" id="${id}C">${cartao}</div>
        ${abaixo.map((a, i) => `<div class="ch" id="${id}B${i}" style="left:${110 + i * 300}px">${esc(a)}</div>`).join("")}
        <div class="lg" id="${id}L2" style="top:1600px">▼ abaixo da água: o que a empresa real precisa</div></section>`;
    const js = `tl.fromTo("#${id}T", { y: 70, opacity: 0, scale: 1.12 }, { y: 0, opacity: 1, scale: 1, duration: .5, ease: E.slam }, ${f2(t + 0.1)}); shake("#${id}T", ${f2(t + 0.62)}, 8);
      tl.fromTo("#${id}g", { y: 140, opacity: 0 }, { y: 0, opacity: 1, duration: .55, ease: E.pop }, ${f2(t + 0.45)});
      tl.fromTo("#${id}w", { x: 0 }, { x: -60, duration: ${f2(dur)}, ease: "sine.inOut" }, ${f2(t)});
      rise("#${id}L1", ${f2(t + 0.8)}, .3, 12); ${acima.map((_, i) => `rise("#${id}A${i}", ${f2(t + 0.9 + i * 0.2)}, .3, 12);`).join(" ")}
      tl.fromTo("#${id}C", { y: 120, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: E.pop }, ${f2(t + 1.5)});
      ${abaixo.map((_, i) => `pop("#${id}B${i}", ${f2(t + 2.1 + i * 0.2)});`).join(" ")} rise("#${id}L2", ${f2(t + 2.8)}, .3, 12);`;
    return { html, css, js };
  },

  // fecho: "Imersão de IA para o seu negócio" + "Comenta PALAVRA", por cima do corte do Ivan (convite e joinha)
  imersao(p, { id = "cta", t, dur = 6.2, palavra, entrega = "e eu te mando o kit", clipe1 = "assets/clip/convite-e-joinha.mp4", clipe2 = "assets/clip/neutro-sorrindo.mp4", final = "assets/img/neutro-final.png" }) {
    const { T } = p;
    const css = `#${id} { position: absolute; inset: 0; z-index: 31; }
      #${id} .sh1 { position: absolute; left: 0; right: 0; top: 0; height: 780px; background: linear-gradient(180deg, rgba(3,6,12,.9), rgba(3,6,12,.55) 55%, rgba(3,6,12,0)); }
      #${id} .sh2 { position: absolute; left: 0; right: 0; bottom: 0; height: 680px; background: linear-gradient(180deg, rgba(3,6,12,0), rgba(3,6,12,.92)); }
      #${id} .t { position: absolute; left: 70px; right: 60px; top: 360px; font: 400 88px/1.02 var(--impacto); color: #fff; letter-spacing: -.02em; }
      #${id} .t b { font-weight: 400; color: ${nucleo(p, T.destaque)}; text-shadow: ${brilho(p, T.destaque, 0.8)}; }
      #${id} .pill { display: inline-block; padding: 22px 56px; border-radius: 40px; background: var(--acc); color: ${T.fundo}; font: 400 124px/1 var(--impacto); box-shadow: 0 0 50px ${hexA(T.destaque, 0.65)}, 0 14px 0 rgba(0,0,0,.35); }
      #${id} .s { position: absolute; left: 70px; right: 70px; top: 1480px; font: 700 50px/1.18 var(--texto); color: #fff; text-shadow: 0 3px 14px rgba(0,0,0,.8); }
      #${id} .s b { color: ${nucleo(p, T.destaque)}; font-weight: 800; }
      .k-vid { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; object-fit: cover; }`;
    const html = `<video id="${id}v1" class="k-vid" src="${clipe1}" muted playsinline data-start="${f2(t)}" data-duration="2.3333" data-track-index="7" style="z-index:30"></video>
      <video id="${id}v2" class="k-vid" src="${clipe2}" muted playsinline data-start="${f2(t + 2.3333)}" data-duration="0.9" data-track-index="8" style="z-index:30"></video>
      <section id="${id}" class="clip" data-start="${f2(t)}" data-duration="${dur}" data-track-index="9">
        <img id="${id}f" src="${final}" alt="" style="position:absolute;left:0;top:0;width:1080px;height:1920px;object-fit:cover;opacity:0" />
        <div class="sh1"></div><div class="sh2"></div>
        <div class="t" id="${id}a">IMERSÃO DE IA PARA O SEU <b>NEGÓCIO</b></div>
        <div class="s" id="${id}q">Dados reais, segurança e LGPD: <b>converse comigo</b>.</div>
        <div class="t" id="${id}b" style="opacity:0">COMENTA</div>
        <div style="position:absolute;left:70px;top:470px;opacity:0" id="${id}p"><span class="pill">${esc(palavra)}</span></div>
        <div class="s" id="${id}e" style="opacity:0">${entrega}</div></section>`;
    const js = `flash(${f2(t)}, .8);
      tl.fromTo("#${id}v1", { scale: 1 }, { scale: 1.04, duration: 2.33, ease: "none" }, ${f2(t)});
      tl.set("#${id}f", { opacity: 1 }, ${f2(t + 3.233)}); tl.fromTo("#${id}f", { scale: 1 }, { scale: 1.06, duration: 3, ease: "none" }, ${f2(t + 3.233)});
      tl.fromTo("#${id}a", { y: 60, opacity: 0, scale: 1.12 }, { y: 0, opacity: 1, scale: 1, duration: .5, ease: E.slam }, ${f2(t + 0.1)}); shake("#${id}a", ${f2(t + 0.62)}, 8);
      rise("#${id}q", ${f2(t + 0.7)}, .45, 30); sai(["#${id}a", "#${id}q"], ${f2(t + 2.75)}, .12);
      tl.fromTo("#${id}b", { y: 60, opacity: 0, scale: 1.15 }, { y: 0, opacity: 1, scale: 1, duration: .5, ease: E.slam }, ${f2(t + 2.9)});
      tl.fromTo("#${id}p", { scale: 0, opacity: 0, transformOrigin: "0% 50%" }, { scale: 1, opacity: 1, duration: .5, ease: "back.out(2.2)" }, ${f2(t + 3.1)});
      tl.fromTo("#${id}p", { scale: 1 }, { scale: 1.06, duration: .45, yoyo: true, repeat: 3, ease: "sine.inOut", immediateRender: false }, ${f2(t + 3.7)});
      rise("#${id}e", ${f2(t + 3.4)}, .45, 30);`;
    return { html, css, js };
  },
};

// =====================================================================
// TRANSIÇÕES (entre cenas do palco). de/para = ids das cenas; t = instante da troca (fim da cena "de" = início da "para").
// Tipo "movimento": saída em [t-d1, t] e entrada em [t, t+d2]. Tipo "revela": a cena nova aparece por cima em [t-d, t].
// =====================================================================
const ov = (id, css, inner = "") => ({ html: `<div id="${id}" style="position:absolute;inset:0;z-index:85;pointer-events:none;opacity:0;${css}">${inner}</div>` });
export const transicoes = {
  corte(p, { t }) { return { js: `flash(${f2(t)}, .35, .05);` }; },

  chicote(p, { de, para, t, dir = "esq", n = 0 }) {
    const ax = dir === "esq" || dir === "dir" ? "x" : "y", s = dir === "esq" || dir === "cima" ? -1 : 1, D = ax === "x" ? p.W : p.H, sk = ax === "x" ? "skewX" : "skewY";
    const id = `trw${n}`;
    const o = ov(id, `background:linear-gradient(${ax === "x" ? 90 : 0}deg, transparent, ${hexA(p.T.destaque, 0.25)} 45%, rgba(255,255,255,.6) 50%, ${hexA(p.T.destaque, 0.25)} 55%, transparent);`);
    return { html: o.html, js: `tl.fromTo("#${de}", { ${ax}: 0, ${sk}: 0, filter: "blur(0px)" }, { ${ax}: ${f2(s * D * 0.55)}, ${sk}: ${s * 14}, filter: "blur(${p.px(1.6)}px)", duration: .16, ease: "power4.in", immediateRender: false }, ${f2(t - 0.16)});
      tl.fromTo("#${para}", { ${ax}: ${f2(-s * D * 0.55)}, ${sk}: ${-s * 14}, filter: "blur(${p.px(1.6)}px)" }, { ${ax}: 0, ${sk}: 0, filter: "blur(0px)", duration: .32, ease: "expo.out", immediateRender: false }, ${f2(t)});
      tl.fromTo("#${id}", { opacity: 0, ${ax}: ${f2(-s * D)} }, { opacity: 1, ${ax}: ${f2(s * D)}, duration: .3, ease: "power2.inOut", immediateRender: false }, ${f2(t - 0.14)}); tl.set("#${id}", { opacity: 0 }, ${f2(t + 0.17)});` };
  },

  zoomAtraves(p, { de, para, t }) {
    return { js: `tl.fromTo("#${de}", { scale: 1, filter: "blur(0px)" }, { scale: 3.4, filter: "blur(${p.px(1.2)}px)", duration: .2, ease: "power3.in", immediateRender: false }, ${f2(t - 0.2)});
      tl.fromTo("#${para}", { scale: .45, filter: "blur(${p.px(1.2)}px)" }, { scale: 1, filter: "blur(0px)", duration: .42, ease: "expo.out", immediateRender: false }, ${f2(t)}); flash(${f2(t - 0.03)}, .5);` };
  },

  zoomFora(p, { de, para, t }) {
    return { js: `tl.fromTo("#${de}", { scale: 1, rotation: 0 }, { scale: .35, rotation: -8, duration: .2, ease: "power3.in", immediateRender: false }, ${f2(t - 0.2)});
      tl.fromTo("#${para}", { scale: 1.7, rotation: 6 }, { scale: 1, rotation: 0, duration: .4, ease: "expo.out", immediateRender: false }, ${f2(t)});` };
  },

  tunel(p, { de, para, t, n = 0 }) {
    const id = `trt${n}`, R = Math.hypot(p.W, p.H) * 0.08;
    const aneis = Array.from({ length: 7 }, (_, i) => `<i id="${id}r${i}" style="position:absolute;left:${p.W / 2 - R}px;top:${p.H / 2 - R}px;width:${2 * R}px;height:${2 * R}px;border-radius:50%;border:${p.px(0.6)}px solid ${hexA(p.T.destaque, 0.9)};box-shadow:0 0 ${p.px(2)}px ${p.T.destaque}, inset 0 0 ${p.px(2)}px ${p.T.destaque}"></i>`).join("");
    return { html: ov(id, "", aneis).html, js: `tl.set("#${id}", { opacity: 1 }, ${f2(t - 0.3)}); tl.set("#${id}", { opacity: 0 }, ${f2(t + 0.45)});
      ${Array.from({ length: 7 }, (_, i) => `tl.fromTo("#${id}r${i}", { scale: .05, opacity: 1 }, { scale: 7, opacity: 0, duration: .55, ease: "power2.in", immediateRender: false }, ${f2(t - 0.3 + i * 0.06)});`).join(" ")}
      tl.fromTo("#${de}", { scale: 1, rotation: 0, opacity: 1 }, { scale: 2.6, rotation: 25, opacity: .2, duration: .3, ease: "power2.in", immediateRender: false }, ${f2(t - 0.3)});
      tl.fromTo("#${para}", { scale: .15, rotation: -30 }, { scale: 1, rotation: 0, duration: .5, ease: "expo.out", immediateRender: false }, ${f2(t)});` };
  },

  glitchRGB(p, { de, para, t, n = 0 }) {
    const id = `trg${n}`;
    const faixas = Array.from({ length: 7 }, (_, i) => `<i id="${id}f${i}" style="position:absolute;left:0;right:0;top:${Math.round(rnd(i, 21) * p.H * 0.92)}px;height:${p.px(1 + rnd(i, 22) * 4)}px;background:${i % 2 ? "rgba(255,40,90,.55)" : hexA(p.T.destaque, 0.55)};mix-blend-mode:screen"></i>`).join("");
    return { html: ov(id, "", faixas).html, js: `glitch("#${de}", ${f2(t - 0.24)}, .24, ${p.px(2)}, ${n + 3}); glitch("#${para}", ${f2(t)}, .2, ${p.px(1.4)}, ${n + 5});
      tl.set("#${id}", { opacity: 1 }, ${f2(t - 0.16)}); ${Array.from({ length: 4 }, (_, k) => `tl.set("#${id}", { y: ${p.px((rnd(k, n + 30) - 0.5) * 12)} }, ${f2(t - 0.16 + k * 0.06)});`).join(" ")} tl.set("#${id}", { opacity: 0, y: 0 }, ${f2(t + 0.1)});` };
  },

  estilhaco(p, { de, para, t, n = 0 }) {
    // estilhaços triangulares: grade 4x3 com vértices deslocados de forma determinística
    const id = `trs${n}`, C = 5, L = 4, pt = [];
    for (let j = 0; j <= L; j++) for (let i = 0; i <= C; i++) { const interno = i > 0 && i < C && j > 0 && j < L; pt.push([Math.round((i / C) * p.W + (interno ? (rnd(i * 7 + j, 41) - 0.5) * p.W * 0.12 : 0)), Math.round((j / L) * p.H + (interno ? (rnd(i * 7 + j, 42) - 0.5) * p.H * 0.14 : 0))]); }
    const P = (i, j) => pt[j * (C + 1) + i], tri = [];
    for (let j = 0; j < L; j++) for (let i = 0; i < C; i++) { const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1); if ((i + j) % 2) { tri.push([a, b, c], [a, c, d]); } else { tri.push([a, b, d], [b, c, d]); } }
    const cx = p.W / 2, cy = p.H / 2;
    const svg = `<svg width="${p.W}" height="${p.H}" viewBox="0 0 ${p.W} ${p.H}" style="position:absolute;left:0;top:0;overflow:visible">${tri.map((q, k) => `<polygon id="${id}p${k}" points="${q.map((v) => v.join(",")).join(" ")}" fill="${p.T.fundo2}" stroke="${hexA(p.T.destaque, 0.85)}" stroke-width="${p.px(0.25)}" style="transform-box:fill-box;transform-origin:50% 50%"/>`).join("")}</svg>`;
    const js = tri.map((q, k) => { const mx = (q[0][0] + q[1][0] + q[2][0]) / 3, my = (q[0][1] + q[1][1] + q[2][1]) / 3, dx = (mx - cx) * (1.1 + rnd(k, 51)), dy = (my - cy) * (1.1 + rnd(k, 52)) + p.H * 0.25; return `tl.fromTo("#${id}p${k}", { x: 0, y: 0, rotation: 0, opacity: 1 }, { x: ${Math.round(dx)}, y: ${Math.round(dy)}, rotation: ${Math.round((rnd(k, 53) - 0.5) * 160)}, opacity: 0, duration: .6, ease: "power2.out", immediateRender: false }, ${f2(t + rnd(k, 54) * 0.08)});`; }).join(" ");
    return { html: ov(id, "", svg).html, js: `tl.set("#${id}", { opacity: 1 }, ${f2(t - 0.05)}); tl.set("#${id}", { opacity: 0 }, ${f2(t + 0.75)}); flash(${f2(t - 0.05)}, .7, .05); ${js} tl.fromTo("#${para}", { scale: 1.08 }, { scale: 1, duration: .5, ease: E.ui, immediateRender: false }, ${f2(t)});` };
  },

  pelicula(p, { de, para, t, n = 0 }) {
    const id = `trp${n}`, fw = Math.round(p.W * 0.9), fh = Math.round(p.H * 0.62), furo = p.px(2.4);
    const quadros = Array.from({ length: 4 }, (_, i) => `<div style="position:absolute;left:${(p.W - fw) / 2}px;top:${i * (fh + p.px(3))}px;width:${fw}px;height:${fh}px;border-radius:${p.px(1)}px;background:${i % 2 ? hexA(p.T.destaque, 0.18) : "rgba(255,255,255,.08)"};border:${p.px(0.3)}px solid rgba(255,255,255,.25)"></div>`).join("");
    const furos = `repeating-linear-gradient(180deg, rgba(255,255,255,.75) 0 ${furo}px, transparent ${furo}px ${furo * 2.2}px)`;
    const fita = `<div id="${id}fi" style="position:absolute;left:0;right:0;top:0;height:${4 * (fh + p.px(3))}px;background:#0b0b0d">${quadros}<i style="position:absolute;left:${p.px(1.5)}px;top:0;bottom:0;width:${furo}px;background:${furos}"></i><i style="position:absolute;right:${p.px(1.5)}px;top:0;bottom:0;width:${furo}px;background:${furos}"></i></div>`;
    return { html: ov(id, "overflow:hidden;", fita).html, js: `tl.set("#${id}", { opacity: 1 }, ${f2(t - 0.22)}); tl.fromTo("#${id}fi", { y: ${p.H} }, { y: ${-4 * (fh + p.px(3))}, duration: .5, ease: "power2.inOut", immediateRender: false }, ${f2(t - 0.22)}); tl.set("#${id}", { opacity: 0 }, ${f2(t + 0.28)});
      tl.fromTo("#${para}", { filter: "brightness(2.2)" }, { filter: "brightness(1)", duration: .3, ease: E.ui, immediateRender: false }, ${f2(t + 0.1)});` };
  },

  inundar(p, { de, para, t, origem = [0.5, 0.5], n = 0 }) {
    const id = `trf${n}`, R = Math.hypot(p.W, p.H);
    const bola = `<i id="${id}b" style="position:absolute;left:${p.W * origem[0] - R}px;top:${p.H * origem[1] - R}px;width:${2 * R}px;height:${2 * R}px;border-radius:50%;background:radial-gradient(circle, ${p.T.destaque} 0, ${p.T.destaque} 60%, ${hexA(p.T.destaque, 0)} 71%)"></i>`;
    return { html: ov(id, "", bola).html, js: `tl.set("#${id}", { opacity: 1 }, ${f2(t - 0.3)}); tl.fromTo("#${id}b", { scale: 0 }, { scale: 1, duration: .3, ease: "power2.in", immediateRender: false }, ${f2(t - 0.3)});
      tl.fromTo("#${id}", { opacity: 1 }, { opacity: 0, duration: .32, ease: E.ui, immediateRender: false }, ${f2(t)}); tl.fromTo("#${para}", { scale: 1.15 }, { scale: 1, duration: .45, ease: E.slam, immediateRender: false }, ${f2(t)});` };
  },

  iris(p, { de, para, t, d = 0.45 }) {
    return { js: `tl.set("#${para}", { opacity: 1 }, ${f2(t - d)}); tl.fromTo("#${para}", { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)", duration: ${d}, ease: E.cam, immediateRender: false }, ${f2(t - d)}); tl.set("#${para}", { clipPath: "none" }, ${f2(t)});` };
  },

  persiana(p, { de, para, t, n = 0, faixas = 8 }) {
    const id = `trb${n}`, h = Math.ceil(p.H / faixas);
    const bs = Array.from({ length: faixas }, (_, i) => `<i id="${id}f${i}" style="position:absolute;left:0;right:0;top:${i * h}px;height:${h + 1}px;background:${i % 2 ? p.T.fundo2 : p.T.fundo};border-bottom:${p.px(0.2)}px solid ${hexA(p.T.destaque, 0.5)};transform-origin:50% 0"></i>`).join("");
    return { html: ov(id, "", bs).html, js: `tl.set("#${id}", { opacity: 1 }, ${f2(t - 0.28)}); tl.set("#${id}", { opacity: 0 }, ${f2(t + 0.35)});
      ${Array.from({ length: faixas }, (_, i) => `tl.fromTo("#${id}f${i}", { scaleY: 0 }, { scaleY: 1, duration: .2, ease: "power2.in", immediateRender: false }, ${f2(t - 0.28 + i * 0.01)}); tl.to("#${id}f${i}", { scaleY: 0, transformOrigin: "50% 100%", duration: .25, ease: E.ui }, ${f2(t + 0.05 + i * 0.012)});`).join(" ")}` };
  },

  blocos(p, { de, para, t, n = 0, C = 6, L = 4 }) {
    const id = `trq${n}`, w = Math.ceil(p.W / C), h = Math.ceil(p.H / L), bs = [];
    for (let j = 0; j < L; j++) for (let i = 0; i < C; i++) bs.push(`<i id="${id}q${j * C + i}" style="position:absolute;left:${i * w}px;top:${j * h}px;width:${w + 1}px;height:${h + 1}px;background:${(i + j) % 2 ? p.T.destaque : p.T.fundo2}"></i>`);
    return { html: ov(id, "", bs.join("")).html, js: `tl.set("#${id}", { opacity: 1 }, ${f2(t - 0.3)}); tl.set("#${id}", { opacity: 0 }, ${f2(t + 0.4)});
      ${bs.map((_, k) => `tl.fromTo("#${id}q${k}", { scale: 0 }, { scale: 1, duration: .16, ease: "power2.in", immediateRender: false }, ${f2(t - 0.3 + rnd(k, 61) * 0.12)}); tl.to("#${id}q${k}", { scale: 0, duration: .2, ease: E.ui }, ${f2(t + 0.04 + rnd(k, 62) * 0.14)});`).join(" ")}` };
  },

  luz(p, { de, para, t, n = 0 }) {
    const id = `trl${n}`;
    return { html: ov(id, `background:radial-gradient(ellipse at 50% 50%, #fff 0, ${hexA(p.T.destaque, 0.8)} 45%, ${hexA(p.T.destaque, 0)} 80%);mix-blend-mode:screen;`).html, js: `tl.fromTo("#${de}", { filter: "brightness(1)" }, { filter: "brightness(3.2)", duration: .22, ease: "power2.in", immediateRender: false }, ${f2(t - 0.22)});
      tl.fromTo("#${id}", { opacity: 0 }, { opacity: 1, duration: .22, ease: "power2.in", immediateRender: false }, ${f2(t - 0.22)}); tl.to("#${id}", { opacity: 0, duration: .4, ease: E.ui }, ${f2(t)});
      tl.fromTo("#${para}", { filter: "brightness(3)" }, { filter: "brightness(1)", duration: .45, ease: E.ui, immediateRender: false }, ${f2(t)});` };
  },

  desfoque(p, { de, para, t }) {
    return { js: `tl.fromTo("#${de}", { filter: "blur(0px)" }, { filter: "blur(${p.px(3)}px)", duration: .2, ease: "power2.in", immediateRender: false }, ${f2(t - 0.2)});
      tl.fromTo("#${para}", { filter: "blur(${p.px(3)}px)", scale: 1.05 }, { filter: "blur(0px)", scale: 1, duration: .38, ease: E.ui, immediateRender: false }, ${f2(t)});` };
  },

  pixel(p, { de, para, t, n = 0, C = 16, L = 12 }) {
    const id = `trx${n}`, w = Math.ceil(p.W / C), h = Math.ceil(p.H / L), bs = [];
    for (let k = 0; k < C * L; k++) bs.push(`<i id="${id}q${k}" style="position:absolute;left:${(k % C) * w}px;top:${Math.floor(k / C) * h}px;width:${w + 1}px;height:${h + 1}px;background:${rnd(k, 71) > 0.8 ? p.T.destaque : p.T.fundo};opacity:0"></i>`);
    const ord = bs.map((_, k) => k).sort((a, b) => rnd(a, 72) - rnd(b, 72));
    const js = ord.map((k, i) => `tl.set("#${id}q${k}", { opacity: 1 }, ${f2(t - 0.25 + (i / ord.length) * 0.22)}); tl.set("#${id}q${k}", { opacity: 0 }, ${f2(t + 0.03 + rnd(k, 73) * 0.25)});`).join(" ");
    return { html: ov(id, "", bs.join("")).html, js: `tl.set("#${id}", { opacity: 1 }, ${f2(t - 0.26)}); tl.set("#${id}", { opacity: 0 }, ${f2(t + 0.3)}); ${js}` };
  },

  dobra3D(p, { de, para, t }) {
    return { js: `tl.fromTo("#${de}", { rotationY: 0 }, { rotationY: 88, duration: .2, ease: "power2.in", immediateRender: false }, ${f2(t - 0.2)});
      tl.fromTo("#${para}", { rotationY: -88 }, { rotationY: 0, duration: .34, ease: "power3.out", immediateRender: false }, ${f2(t)});` };
  },

  empurrar(p, { de, para, t, dir = 1 }) {
    return { js: `tl.set("#${para}", { opacity: 1 }, ${f2(t - 0.4)}); tl.fromTo("#${de}", { x: 0 }, { x: ${-dir * p.W}, duration: .4, ease: E.cam, immediateRender: false }, ${f2(t - 0.4)}); tl.fromTo("#${para}", { x: ${dir * p.W} }, { x: 0, duration: .4, ease: E.cam, immediateRender: false }, ${f2(t - 0.4)});` };
  },

  laser(p, { de, para, t, n = 0 }) {
    const id = `trz${n}`;
    const linha = `<i id="${id}l" style="position:absolute;left:0;right:0;top:${p.H / 2 - p.px(0.3)}px;height:${p.px(0.6)}px;background:#fff;box-shadow:0 0 ${p.px(1)}px #fff,0 0 ${p.px(3)}px ${p.T.destaque},0 0 ${p.px(9)}px ${p.T.destaque};transform-origin:0 50%"></i>`;
    const fl = efeitos.flare(p, { id: id + "f", x: 0, x1: p.W, y: p.H / 2, t: t - 0.28, dur: 0.5 });
    return { html: ov(id, "", linha).html + fl.html, css: fl.css, js: `tl.set("#${id}", { opacity: 1 }, ${f2(t - 0.28)}); tl.fromTo("#${id}l", { scaleX: 0 }, { scaleX: 1, duration: .2, ease: "power2.in", immediateRender: false }, ${f2(t - 0.28)}); tl.to("#${id}l", { scaleY: 6, opacity: 0, duration: .3, ease: E.ui }, ${f2(t + 0.05)}); tl.set("#${id}", { opacity: 0 }, ${f2(t + 0.4)});
      tl.fromTo("#${de}", { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(50% 0% 50% 0%)", duration: .14, ease: "power3.in", immediateRender: false }, ${f2(t - 0.14)});
      tl.fromTo("#${para}", { clipPath: "inset(50% 0% 50% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: .36, ease: "expo.out", immediateRender: false }, ${f2(t)}); ${fl.js}` };
  },

  estatica(p, { de, para, t, n = 0 }) {
    const id = `tre${n}`;
    return { html: ov(id, `background:url("assets/grain.png");background-size:${p.px(30)}px ${p.px(53)}px;filter:contrast(3) brightness(1.4);`).html, js: `tl.set("#${id}", { opacity: .95 }, ${f2(t - 0.12)}); ${Array.from({ length: 6 }, (_, k) => `tl.set("#${id}", { backgroundPosition: "${Math.round(rnd(k, n + 80) * 300)}px ${Math.round(rnd(k, n + 81) * 500)}px" }, ${f2(t - 0.12 + k * 0.04)});`).join(" ")} tl.set("#${id}", { opacity: 0 }, ${f2(t + 0.12)});` };
  },

  desligar(p, { de, para, t, n = 0 }) {
    const id = `tro${n}`;
    const linha = `<i id="${id}l" style="position:absolute;left:0;right:0;top:${p.H / 2 - p.px(0.3)}px;height:${p.px(0.6)}px;background:#fff;box-shadow:0 0 ${p.px(4)}px #fff"></i>`;
    return { html: ov(id, "", linha).html, js: `tl.fromTo("#${de}", { scaleY: 1, filter: "brightness(1)" }, { scaleY: .006, filter: "brightness(3)", duration: .16, ease: "power3.in", immediateRender: false }, ${f2(t - 0.3)});
      tl.set("#${id}", { opacity: 1 }, ${f2(t - 0.14)}); tl.fromTo("#${id}l", { scaleX: 1 }, { scaleX: 0, duration: .14, ease: "power3.in", immediateRender: false }, ${f2(t - 0.14)}); tl.set("#${id}", { opacity: 0 }, ${f2(t)});
      tl.fromTo("#${para}", { opacity: 0 }, { opacity: 1, duration: .3, ease: E.ui, immediateRender: false }, ${f2(t)});` };
  },
};
export const LISTA_TRANSICOES = Object.keys(transicoes);
export const LISTA_CENAS = [...Object.keys(cenas), "fecho.iceberg", "fecho.imersao", "marcaIvan (card de redes)"];
export const LISTA_EFEITOS = [...Object.keys(efeitos), "JS_BASE.glitch", "JS_BASE.rastro", "JS_BASE.pulsoBrilho", "brilho()", "legenda()"];
