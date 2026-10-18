/* kit-fx.js · Kit Motion v2 (18/10/2026) · @oivandigital / PixelCorp · uso livre
 * Efeitos com DISTORÇÃO REAL da imagem (filtros SVG sobre o HTML, shaders WebGL e canvas)
 * para HyperFrames + GSAP. Tudo é função do tempo da linha do tempo: o vídeo sai igual toda vez.
 *
 * Uso:  <script src="gsap.min.js"></script><script src="kit-fx.js"></script>
 *       const tl = gsap.timeline({ paused: true });  FX.inicio({ W: 1080, H: 1920, cor: "#ffb341" });
 *       FX.trans.estilhaco(tl, 3.0, "#cena1 .quadro", "#cena2 .quadro");   // t = instante do corte
 *       window.__timelines["main"] = tl;
 * Regra: os filtros vão no filho (.quadro) da cena, nunca no elemento .clip.
 */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const FX = { W: 1080, H: 1920, cor: "#38e1ff", versao: "2.2" };
  let defs = null, nid = 0;

  FX.rnd = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
  FX.inicio = (o = {}) => Object.assign(FX, o);
  const $ = (s) => (typeof s === "string" ? document.querySelector(s) : s);
  const $$ = (s) => (typeof s === "string" ? [...document.querySelectorAll(s)] : [].concat(s));
  const rgb = (hex) => { const n = parseInt(hex.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  FX.rgba = (hex, a) => { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; };

  /* ---------- filtros SVG (distorção dos pixels do próprio HTML) ---------- */
  function raiz() {
    if (defs) return defs;
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("width", "0"); s.setAttribute("height", "0");
    s.style.cssText = "position:absolute;left:0;top:0;pointer-events:none";
    defs = document.createElementNS(NS, "defs"); s.appendChild(defs); document.body.appendChild(s);
    return defs;
  }
  function filtro(miolo, folga = 0.15) {
    const id = "fx" + ++nid, f = document.createElementNS(NS, "filter");
    const { W, H } = FX;
    f.setAttribute("id", id); f.setAttribute("filterUnits", "userSpaceOnUse"); f.setAttribute("primitiveUnits", "userSpaceOnUse");
    f.setAttribute("x", -W * folga); f.setAttribute("y", -H * folga); f.setAttribute("width", W * (1 + 2 * folga)); f.setAttribute("height", H * (1 + 2 * folga));
    f.setAttribute("color-interpolation-filters", "sRGB");
    f.innerHTML = miolo; raiz().appendChild(f);
    return { id, url: `url(#${id})`, q: (s) => f.querySelector(s) };
  }
  // mapa de deslocamento desenhado num canvas: fn(ctx, w, h) pinta R = desvio x, G = desvio y (128 = parado)
  function mapa(w, h, fn) { const c = document.createElement("canvas"); c.width = w; c.height = h; fn(c.getContext("2d"), w, h); return c.toDataURL("image/png"); }
  const img = (href, extra = "") => `<feImage href="${href}" x="0" y="0" width="${FX.W}" height="${FX.H}" preserveAspectRatio="none" ${extra}/>`;
  // liga o filtro só durante [ini, fim]
  function liga(tl, alvos, f, ini, fim) { $$(alvos).forEach((el) => { tl.set(el, { filter: f.url }, ini); tl.set(el, { filter: "none" }, fim); }); }

  FX.filtros = {
    // água/calor/líquido: ruído fractal deslocando a imagem
    onda(freq = "0.008 0.03", oit = 2, semente = 7) {
      return filtro(`<feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${oit}" seed="${semente}" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/>`);
    },
    // separa vermelho / verde / azul de verdade (aberração cromática) + fatias horizontais deslocadas
    glitch(semente = 3) {
      const W = FX.W, H = FX.H;
      const href = mapa(64, 512, (g, w, h) => {
        g.fillStyle = "rgb(128,128,128)"; g.fillRect(0, 0, w, h);
        let y = 0, i = 0; while (y < h) { const alt = 3 + Math.floor(FX.rnd(i, semente) * 26); const on = FX.rnd(i, semente + 1) < 0.45;
          g.fillStyle = on ? `rgb(${Math.floor(FX.rnd(i, semente + 2) * 255)},128,128)` : "rgb(128,128,128)"; g.fillRect(0, y, w, alt); y += alt; i++; }
      });
      return filtro(`<feImage href="${href}" x="0" y="0" width="${W}" height="${H * 2}" preserveAspectRatio="none" result="m"/>
        <feDisplacementMap in="SourceGraphic" in2="m" scale="0" xChannelSelector="R" yChannelSelector="G" result="d"/>
        <feColorMatrix in="d" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r"/>
        <feColorMatrix in="d" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g"/>
        <feColorMatrix in="d" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b"/>
        <feOffset in="r" dx="0" dy="0" result="ro"/><feOffset in="b" dx="0" dy="0" result="bo"/>
        <feBlend in="ro" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="bo" mode="screen"/>`, 0.05);
    },
    // vidro quebrando: cada caco é uma região de cor única no mapa e anda numa direção própria
    estilhaco(cx = 0.5, cy = 0.5, n = 11, semente = 5) {
      const pts = [];
      const href = mapa(540, 960, (g, w, h) => {
        g.fillStyle = "rgb(128,128,128)"; g.fillRect(0, 0, w, h);
        // leque de raios saindo do ponto de impacto + anéis = cacos triangulares/quadrados
        const raios = n, aneis = 5, R = Math.hypot(w, h);
        const ang = (k) => (k / raios) * Math.PI * 2 + (FX.rnd(k, semente) - 0.5) * 0.45;
        const rad = (j, k) => (j === 0 ? 0 : R * Math.pow(j / aneis, 1.6) * (0.85 + 0.3 * FX.rnd(j * 31 + k, semente + 1)));
        const P = (j, k) => [cx * w + Math.cos(ang(k)) * rad(j, k), cy * h + Math.sin(ang(k)) * rad(j, k)];
        let i = 0;
        for (let j = 0; j < aneis; j++) for (let k = 0; k < raios; k++) {
          const a = P(j, k), b = P(j, k + 1), c = P(j + 1, k + 1), d = P(j + 1, k);
          const meio = (ang(k) + ang(k + 1)) / 2 + (FX.rnd(i, semente + 2) - 0.5) * 0.8, forca = 0.35 + 0.65 * FX.rnd(i, semente + 3);
          g.fillStyle = `rgb(${Math.round(128 - Math.cos(meio) * 127 * forca)},${Math.round(128 - Math.sin(meio) * 127 * forca)},128)`;
          g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.lineTo(...d); g.closePath(); g.fill();
          if (j > 0) pts.push([a, b, c, d].map(([x, y]) => [x / w, y / h]));
          i++;
        }
      });
      const f = filtro(`${img(href, 'result="m"')}<feDisplacementMap in="SourceGraphic" in2="m" scale="0" xChannelSelector="R" yChannelSelector="G"/>`, 0.3);
      f.cacos = pts; return f;
    },
    // lente / buraco de minhoca: puxa (escala +) ou estufa (escala −) a imagem em volta de um ponto; giro > 0 = redemoinho
    lente(cx = 0.5, cy = 0.5, giro = 0) {
      const href = mapa(270, 480, (g, w, h) => {
        const im = g.createImageData(w, h), r0 = Math.hypot(w, h) / 2;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const dx = (x - cx * w) / r0, dy = (y - cy * h) / r0, r = Math.hypot(dx, dy) + 1e-6, f = Math.min(1, r) * Math.exp(-r * 1.2);
          const vx = (dx / r) * f * (1 - giro) - (dy / r) * f * giro, vy = (dy / r) * f * (1 - giro) + (dx / r) * f * giro;
          const o = (y * w + x) * 4; im.data[o] = 128 + vx * 127 * 2.2; im.data[o + 1] = 128 + vy * 127 * 2.2; im.data[o + 2] = 128; im.data[o + 3] = 255;
        }
        g.putImageData(im, 0, 0);
      });
      return filtro(`${img(href, 'result="m"')}<feDisplacementMap in="SourceGraphic" in2="m" scale="0" xChannelSelector="R" yChannelSelector="G"/>`, 0.2);
    },
    // borrão de movimento numa só direção (chicote de verdade)
    rastroMov() { return filtro(`<feGaussianBlur in="SourceGraphic" stdDeviation="0 0"/>`, 0.4); },
    // brilho real (bloom): pega só o que é claro, desfoca em 2 tamanhos e soma por cima
    bloom(forca = 1, raio = 1) {
      return filtro(`<feComponentTransfer in="SourceGraphic" result="c"><feFuncR type="linear" slope="${1.7 * forca}" intercept="-0.85"/><feFuncG type="linear" slope="${1.7 * forca}" intercept="-0.85"/><feFuncB type="linear" slope="${1.7 * forca}" intercept="-0.85"/></feComponentTransfer>
        <feGaussianBlur in="c" stdDeviation="${10 * raio}" result="b1"/><feGaussianBlur in="c" stdDeviation="${34 * raio}" result="b2"/>
        <feBlend in="SourceGraphic" in2="b1" mode="screen" result="x"/><feBlend in="x" in2="b2" mode="screen"/>`, 0);
    },
  };

  /* ---------- transições (t = instante do corte; a = cena que sai, b = cena que entra) ---------- */
  const flashEl = () => { let f = document.getElementById("fx-flash"); if (!f) { f = document.createElement("div"); f.id = "fx-flash";
    f.setAttribute("data-layout-ignore", "");
    // estouro de luz na cor do tema (um flash branco chapado vira véu cinza sobre fundo escuro)
    f.style.cssText = `position:absolute;inset:0;background:radial-gradient(circle at 50% 46%, #fff 0%, ${FX.rgba(FX.cor, 0.95)} 22%, ${FX.rgba(FX.cor, 0.35)} 48%, ${FX.rgba(FX.cor, 0)} 78%);opacity:0;mix-blend-mode:screen;pointer-events:none;z-index:900`; (document.querySelector("[data-composition-id]") || document.body).appendChild(f); } return f; };
  FX.flash = (tl, t, forca = 0.85, dur = 0.28) => tl.fromTo(flashEl(), { opacity: forca }, { opacity: 0, duration: dur, ease: "power2.out", immediateRender: false }, t);
  FX.tremor = (tl, alvo, t, dur = 0.4, forca = 26, semente = 1) => {
    const passos = Math.max(3, Math.round(dur / 0.033)), el = $(alvo);
    for (let i = 0; i < passos; i++) { const k = 1 - i / passos;
      tl.set(el, { x: (FX.rnd(i, semente) - 0.5) * 2 * forca * k, y: (FX.rnd(i, semente + 9) - 0.5) * 2 * forca * k, rotation: (FX.rnd(i, semente + 4) - 0.5) * 1.6 * k }, t + i * (dur / passos)); }
    tl.set(el, { x: 0, y: 0, rotation: 0 }, t + dur);
  };
  // garante que a cena que entra começa visível e limpa
  const entra = (tl, b, t, de) => tl.fromTo(b, de, { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0, duration: 0.001, immediateRender: false }, t);

  FX.trans = {
    // vidro estilhaça com a imagem real (cacos andam, giram de leve e caem), flash e linhas de rachadura
    estilhaco(tl, t, a, b, o = {}) {
      const f = FX.filtros.estilhaco(o.cx ?? 0.5, o.cy ?? 0.48, o.raios ?? 12, o.semente ?? 5), dm = f.q("feDisplacementMap"), dur = o.dur ?? 0.55;
      const A = $(a), B = $(b);
      // rachaduras acesas antes de quebrar
      const sv = document.createElementNS(NS, "svg"); sv.setAttribute("viewBox", "0 0 1 1"); sv.setAttribute("preserveAspectRatio", "none");
      sv.style.cssText = `position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0;mix-blend-mode:screen;filter:drop-shadow(0 0 6px ${FX.cor}) drop-shadow(0 0 18px ${FX.cor})`;
      sv.innerHTML = f.cacos.map((q) => `<polygon points="${q.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#fff" stroke-width="0.0022" vector-effect="non-scaling-stroke" style="stroke-width:3px"/>`).join("");
      A.appendChild(sv);
      tl.fromTo(sv, { opacity: 0 }, { opacity: 1, duration: 0.08, ease: "none", immediateRender: false }, t - 0.2);
      FX.tremor(tl, A, t - 0.2, 0.2, 14, 3);
      liga(tl, A, f, t - 0.02, t + dur + 0.05);
      tl.set(A, { zIndex: 50 }, t - 0.2); tl.set(A, { zIndex: 0 }, t + dur + 0.05);
      tl.fromTo(dm, { attr: { scale: 0 } }, { attr: { scale: o.forca ?? 1400 }, duration: dur, ease: "power2.in", immediateRender: false }, t);
      tl.fromTo(A, { scale: 1, rotation: 0 }, { scale: 1.22, rotation: o.giro ?? -4, opacity: 0, duration: dur, ease: "power2.in", immediateRender: false }, t);
      entra(tl, B, t, { opacity: 0 });
      tl.fromTo(B, { scale: 0.86, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "expo.out", immediateRender: false }, t);
      FX.flash(tl, t, 0.7, 0.24);
    },
    // túnel: a cena é sugada por uma lente que gira e some no centro; a nova sai de dentro
    tunel(tl, t, a, b, o = {}) {
      const fa = FX.filtros.lente(0.5, 0.5, o.giro ?? 0.55), fb = FX.filtros.lente(0.5, 0.5, -(o.giro ?? 0.55)), A = $(a), B = $(b);
      const ia = o.ida ?? 0.4, vb = o.volta ?? 0.5;
      liga(tl, A, fa, t - ia, t + 0.01); liga(tl, B, fb, t, t + vb);
      // máscara redonda: a borda retangular da cena nunca aparece girando
      const m = `radial-gradient(circle ${Math.round(Math.min(FX.W, FX.H) * 0.5)}px at 50% 50%, #000 55%, transparent 100%)`;
      tl.set(A, { webkitMaskImage: m, maskImage: m }, t - ia); tl.set(A, { webkitMaskImage: "none", maskImage: "none" }, t + 0.01);
      tl.set(B, { webkitMaskImage: m, maskImage: m }, t); tl.set(B, { webkitMaskImage: "none", maskImage: "none" }, t + vb * 0.6);
      tl.fromTo(fa.q("feDisplacementMap"), { attr: { scale: 0 } }, { attr: { scale: 900 }, duration: ia, ease: "power3.in", immediateRender: false }, t - ia);
      tl.fromTo(A, { scale: 1, rotation: 0 }, { scale: 0.35, rotation: 70, opacity: 0.2, duration: ia, ease: "power3.in", immediateRender: false }, t - ia);
      entra(tl, B, t, { opacity: 0 });
      tl.fromTo(fb.q("feDisplacementMap"), { attr: { scale: -1100 } }, { attr: { scale: 0 }, duration: vb, ease: "expo.out", immediateRender: false }, t);
      tl.fromTo(B, { scale: 2.6, rotation: -50, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: vb, ease: "expo.out", immediateRender: false }, t);
      FX.flash(tl, t, 0.6, 0.22);
    },
    // glitch RGB de verdade: canais separados + fatias deslocadas, em degraus
    glitch(tl, t, a, b, o = {}) {
      const A = $(a), B = $(b), dur = o.dur ?? 0.36, fa = FX.filtros.glitch(o.semente ?? 3), fb = FX.filtros.glitch((o.semente ?? 3) + 4);
      const anim = (f, el, ini, fim, dir) => {
        liga(tl, el, f, ini, fim);
        const dm = f.q("feDisplacementMap"), [ro, bo] = [f.q('feOffset[in="r"]'), f.q('feOffset[in="b"]')], im = f.q("feImage"), n = Math.round((fim - ini) / 0.04);
        for (let i = 0; i < n; i++) { const k = dir > 0 ? (i + 1) / n : 1 - i / n, s = FX.rnd(i, 21 + dir);
          tl.set(dm, { attr: { scale: (220 + 500 * s) * k } }, ini + i * 0.04);
          tl.set(ro, { attr: { dx: 40 * k * (s > 0.5 ? 1 : -1), dy: 6 * k } }, ini + i * 0.04); tl.set(bo, { attr: { dx: -40 * k * (s > 0.5 ? 1 : -1) } }, ini + i * 0.04);
          tl.set(im, { attr: { y: -Math.floor(FX.rnd(i, 30 + dir) * FX.H) } }, ini + i * 0.04); }
      };
      anim(fa, A, t - dur / 2, t, 1);
      entra(tl, B, t, { opacity: 0 });
      anim(fb, B, t, t + dur / 2 + 0.06, -1);
      tl.set(A, { x: -30 }, t - 0.08); tl.set(B, { x: 24 }, t); tl.set(B, { x: 0 }, t + 0.08);
    },
    // chicote: borrão de movimento real na direção do movimento
    chicote(tl, t, a, b, o = {}) {
      const A = $(a), B = $(b), v = o.vertical, d = (o.sentido ?? 1) * (v ? FX.H : FX.W), fa = FX.filtros.rastroMov(), fb = FX.filtros.rastroMov();
      const s = (f) => f.q("feGaussianBlur"), sd = (n) => (v ? `0 ${n}` : `${n} 0`);
      liga(tl, A, fa, t - 0.17, t + 0.01); liga(tl, B, fb, t, t + 0.34);
      tl.fromTo(s(fa), { attr: { stdDeviation: sd(0) } }, { attr: { stdDeviation: sd(90) }, duration: 0.16, ease: "power4.in", immediateRender: false }, t - 0.16);
      tl.fromTo(A, { x: 0, y: 0, skewX: 0 }, { [v ? "y" : "x"]: -d * 0.5, skewX: v ? 0 : -12, duration: 0.16, ease: "power4.in", immediateRender: false }, t - 0.16);
      entra(tl, B, t, { opacity: 1 });
      tl.fromTo(s(fb), { attr: { stdDeviation: sd(60) } }, { attr: { stdDeviation: sd(0) }, duration: 0.32, ease: "expo.out", immediateRender: false }, t);
      tl.fromTo(B, { [v ? "y" : "x"]: d * 0.42, skewX: v ? 0 : 12 }, { [v ? "y" : "x"]: 0, skewX: 0, duration: 0.32, ease: "expo.out", immediateRender: false }, t);
    },
    // derreter: a imagem vira líquido e escorre, a nova se solidifica
    derreter(tl, t, a, b, o = {}) {
      const A = $(a), B = $(b), fa = FX.filtros.onda("0.004 0.06", 2, 11), fb = FX.filtros.onda("0.004 0.06", 2, 17), dur = o.dur ?? 0.45;
      liga(tl, A, fa, t - dur, t + 0.01); liga(tl, B, fb, t, t + dur);
      tl.fromTo(fa.q("feDisplacementMap"), { attr: { scale: 0 } }, { attr: { scale: 380 }, duration: dur, ease: "power2.in", immediateRender: false }, t - dur);
      tl.fromTo(A, { y: 0, opacity: 1 }, { y: 260, opacity: 0.35, duration: dur, ease: "power2.in", immediateRender: false }, t - dur);
      tl.to(A, { opacity: 0, duration: 0.25, ease: "power1.out" }, t);
      entra(tl, B, t, { opacity: 0 });
      tl.fromTo(fb.q("feDisplacementMap"), { attr: { scale: 380 } }, { attr: { scale: 0 }, duration: dur, ease: "power3.out", immediateRender: false }, t);
      tl.fromTo(B, { y: -200, opacity: 0.45 }, { y: 0, opacity: 1, duration: dur, ease: "power3.out", immediateRender: false }, t);
    },
    // inundar: círculo de luz cresce a partir de um ponto, borda ondulada de verdade
    inundar(tl, t, a, b, o = {}) {
      const B = $(b), cx = (o.cx ?? 0.5) * 100, cy = (o.cy ?? 0.5) * 100, f = FX.filtros.onda("0.02 0.02", 2, 4), dur = o.dur ?? 0.55;
      entra(tl, B, t, { opacity: 1 });
      liga(tl, B, f, t, t + dur);
      tl.fromTo(B, { clipPath: `circle(0% at ${cx}% ${cy}%)` }, { clipPath: `circle(120% at ${cx}% ${cy}%)`, duration: dur, ease: "power3.in", immediateRender: false }, t);
      tl.set(B, { clipPath: "none" }, t + dur);
      tl.fromTo(f.q("feDisplacementMap"), { attr: { scale: 160 } }, { attr: { scale: 0 }, duration: dur, ease: "power2.in", immediateRender: false }, t);
      tl.fromTo($(a), { scale: 1 }, { scale: 1.12, duration: dur, ease: "power2.in", immediateRender: false }, t);
    },
    // luz: estouro de exposição (a imagem queima até o branco e volta)
    luz(tl, t, a, b) {
      const A = $(a), B = $(b);
      tl.fromTo(A, { filter: "brightness(1) saturate(1)" }, { filter: "brightness(3) saturate(0.6)", duration: 0.2, ease: "power2.in", immediateRender: false }, t - 0.2);
      entra(tl, B, t, { opacity: 1 });
      tl.fromTo(B, { filter: "brightness(3) saturate(0.6)", scale: 1.08 }, { filter: "brightness(1) saturate(1)", scale: 1, duration: 0.45, ease: "expo.out", immediateRender: false }, t);
      tl.set(B, { filter: "none" }, t + 0.46);
    },
    // corte seco com flash e soco de escala
    corte(tl, t, a, b) { const B = $(b); entra(tl, B, t, { opacity: 1 }); tl.fromTo(B, { scale: 1.12 }, { scale: 1, duration: 0.3, ease: "expo.out", immediateRender: false }, t); FX.flash(tl, t, 0.55, 0.18); },
  };

  /* ---------- câmera (no elemento que embrulha tudo, ex.: #mundo) ---------- */
  FX.camera = {
    // soco de zoom na batida (1 → 1,12 → 1)
    soco: (tl, alvo, t, forca = 0.12) => tl.fromTo($(alvo), { scale: 1 + forca }, { scale: 1, duration: 0.4, ease: "expo.out", immediateRender: false }, t),
    // aproximação lenta durante a cena (Ken Burns)
    deriva: (tl, alvo, t, dur, de = 1, ate = 1.08, x = 0, y = 0) => tl.fromTo($(alvo), { scale: de, x: 0, y: 0 }, { scale: ate, x, y, duration: dur, ease: "sine.inOut", immediateRender: false }, t),
    // profundidade: camadas andam em velocidades diferentes [{ alvo, fator }]
    parallax: (tl, camadas, t, dur, dist = 160) => camadas.forEach(({ alvo, fator }) => tl.fromTo($(alvo), { x: dist * fator, y: 0 }, { x: -dist * fator, duration: dur, ease: "none", immediateRender: false }, t)),
    tremor: (...a) => FX.tremor(...a),
  };

  /* ---------- canvas: partículas densas (função pura do tempo) ---------- */
  const sprites = {};
  function sprite(cor, tam = 64) {
    const k = cor + tam; if (sprites[k]) return sprites[k];
    const c = document.createElement("canvas"); c.width = c.height = tam; const g = c.getContext("2d"), h = tam / 2;
    const gr = g.createRadialGradient(h, h, 0, h, h, h); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.18, "rgba(255,255,255,.9)");
    gr.addColorStop(0.32, FX.rgba(cor, 0.75)); gr.addColorStop(1, FX.rgba(cor, 0)); g.fillStyle = gr; g.fillRect(0, 0, tam, tam);
    return (sprites[k] = c);
  }
  // camadas: [{ modo: "poeira"|"explosao"|"faiscas"|"vortice"|"chuva"|"estrelas", n, t0, dur, x, y, cor, tam }]
  FX.particulas = (tl, canvas, camadas, total) => {
    const cv = $(canvas), g = cv.getContext("2d"), W = cv.width, H = cv.height, P = { t: 0 };
    const desenha = (t) => {
      g.clearRect(0, 0, W, H); g.globalCompositeOperation = "lighter";
      for (const c of camadas) {
        const dt = t - (c.t0 ?? 0), dur = c.dur ?? total; if (dt < 0 || dt > dur) continue;
        const sp = sprite(c.cor || FX.cor), n = c.n ?? 300, s = c.semente ?? 1, tam = c.tam ?? 1, cx = (c.x ?? 0.5) * W, cy = (c.y ?? 0.5) * H;
        for (let i = 0; i < n; i++) {
          const r1 = FX.rnd(i, s), r2 = FX.rnd(i, s + 1), r3 = FX.rnd(i, s + 2), r4 = FX.rnd(i, s + 3);
          let x, y, r, a, cauda = 0, vx = 0, vy = 0;
          if (c.modo === "explosao" || c.modo === "faiscas") {
            const ang = r1 * Math.PI * 2, v = (c.vel ?? 1400) * (0.25 + r2), k = 3.2, d = (v / k) * (1 - Math.exp(-k * dt)), gr = c.modo === "faiscas" ? 900 : 260;
            x = cx + Math.cos(ang) * d; y = cy + Math.sin(ang) * d + gr * dt * dt; const vel = v * Math.exp(-k * dt);
            vx = Math.cos(ang) * vel; vy = Math.sin(ang) * vel + 2 * gr * dt; cauda = c.modo === "faiscas" ? 0.05 : 0.02;
            r = (4 + r3 * 14) * tam * (1 - dt / dur * 0.6); a = Math.max(0, 1 - dt / dur) * (0.6 + 0.4 * r4);
          } else if (c.modo === "vortice") {
            const R0 = (0.15 + r1) * Math.max(W, H) * 0.6, fase = (r2 + dt * (0.15 + r3 * 0.25)) % 1, rr = R0 * (1 - fase), th = r4 * 6.283 + fase * 9;
            x = cx + Math.cos(th) * rr; y = cy + Math.sin(th) * rr * 0.55; r = (3 + r3 * 8) * tam; a = Math.sin(fase * Math.PI) * 0.9;
          } else if (c.modo === "chuva") {
            const v = 500 + r2 * 1400; x = r1 * W; y = ((r3 * H + dt * v) % (H + 200)) - 100; vy = v; cauda = 0.06; r = (2 + r4 * 4) * tam; a = 0.35 + 0.5 * r4;
          } else if (c.modo === "estrelas") { // dobra espacial: saem do centro e esticam
            const fase = (r1 + dt * (0.35 + r2 * 0.6) * (c.vel ?? 1)) % 1, z = Math.pow(fase, 2.2), ang = r3 * 6.283, rr = z * Math.hypot(W, H) * 0.65;
            x = cx + Math.cos(ang) * rr; y = cy + Math.sin(ang) * rr; vx = Math.cos(ang) * rr * 2.5; vy = Math.sin(ang) * rr * 2.5; cauda = 0.12 * fase; r = (1.5 + z * 9) * tam; a = Math.min(1, z * 3);
          } else { // poeira
            const v = 20 + r2 * 70; x = r1 * W + Math.sin(dt * 0.7 + i) * 24; y = H - ((r3 * H + dt * v) % H); r = (3 + r4 * 9) * tam; a = 0.15 + 0.55 * Math.abs(Math.sin(dt * 2 + i * 1.7));
          }
          if (cauda > 0) { g.strokeStyle = FX.rgba(c.cor || FX.cor, a * 0.8); g.lineWidth = Math.max(1, r * 0.45); g.beginPath(); g.moveTo(x, y); g.lineTo(x - vx * cauda, y - vy * cauda); g.stroke(); }
          g.globalAlpha = Math.max(0, Math.min(1, a)); g.drawImage(sp, x - r * 2, y - r * 2, r * 4, r * 4); g.globalAlpha = 1;
        }
      }
      g.globalCompositeOperation = "source-over";
    };
    tl.fromTo(P, { t: 0 }, { t: total, duration: total, ease: "none", onUpdate: () => desenha(P.t), immediateRender: false }, 0);
    desenha(0);
  };

  /* ---------- WebGL: fundos em shader (túnel de luz, grade neon, raios, plasma) ---------- */
  const SH = {
    tunel: `float r=length(p),a=atan(p.y,p.x);float z=.35/(r+.02)+t*2.2;float an=a/6.2832*10.+t*.6;
      float ring=pow(abs(sin(z*3.1416)),18.)+.35*pow(abs(sin(z*6.2832)),40.);float sp=pow(abs(sin(an*3.1416)),30.)*.5;
      float fade=smoothstep(.0,.35,r);col=cor*(ring*1.4+sp*.6)*fade+vec3(1.)*pow(ring,4.)*fade*.6;col+=cor*.25*exp(-r*3.);`,
    grade: `float hz=.12;col=vec3(0.);if(p.y<hz){float d=hz-p.y;float z=1./d;vec2 g=vec2(p.x*z*1.6,z+t*2.4);vec2 f=abs(fract(g)-.5);
      float wx=.0045*z*1.6,wy=.0045*z*z;float ln=max(smoothstep(.5-wx,.5,f.x),smoothstep(.5-wy,.5,f.y));
      col=cor*ln*1.7*exp(-z*.06)+cor*.05*exp(-z*.2);}col+=cor*exp(-abs(p.y-hz)*26.)*1.1+vec3(1.)*exp(-abs(p.y-hz)*220.)*.8;
      col+=cor*.22*exp(-length(p-vec2(0.,hz+.18))*3.);`,
    raios: `vec2 c=vec2(0.,.25);vec2 d=p-c;float a=atan(d.y,d.x),r=length(d);float rays=pow(abs(sin(a*9.+t*.4)),8.)*.7+pow(abs(sin(a*23.-t*.7)),20.)*.5;
      col=cor*rays*exp(-r*1.4)*1.3+vec3(1.)*exp(-r*9.)*.9+cor*exp(-r*3.)*.5;`,
    plasma: `vec2 q=p*2.2;float v=sin(q.x*1.7+t)+sin(q.y*2.3-t*1.3)+sin((q.x+q.y)*1.4+t*.7)+sin(length(q)*3.-t*2.);v=v*.25+.5;
      col=mix(vec3(0.),cor,pow(v,3.))*1.2+vec3(1.)*pow(v,12.)*.5;`,
    ondas: `float y=p.y;col=vec3(0.);for(int i=0;i<6;i++){float fi=float(i);float w=sin(p.x*(3.+fi)+t*(1.+fi*.3)+fi)*.08*(1.+fi*.2)+(fi-2.5)*.06;
      col+=cor*exp(-abs(y-w)*90.)*.9+vec3(1.)*exp(-abs(y-w)*400.)*.4;}`,
  };
  // FX.shader(tl, canvas, "tunel"|"grade"|"raios"|"plasma"|"ondas"| código GLSL próprio, { cor, total, vel, ini, fim })
  // Um único contexto WebGL para o vídeo inteiro (o navegador aguenta ~16); cada cena recebe uma cópia no próprio canvas 2D.
  // Passe ini/fim (segundos em que a cena aparece) para só desenhar quando ela está na tela.
  let GL = null; const progs = {};
  function glBase(w, h) {
    if (!GL) { const c = document.createElement("canvas"); c.width = w; c.height = h; const gl = c.getContext("webgl", { preserveDrawingBuffer: true, alpha: false });
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); GL = { c, gl }; }
    if (GL.c.width < w || GL.c.height < h) { GL.c.width = Math.max(GL.c.width, w); GL.c.height = Math.max(GL.c.height, h); }
    return GL;
  }
  function programa(gl, corpo, cor) {
    const k = corpo + cor; if (progs[k]) return progs[k]; const [r, g, b] = rgb(cor);
    const fs = `precision highp float;uniform float t;uniform vec2 res;void main(){vec2 p=(gl_FragCoord.xy-res*.5)/min(res.x,res.y);vec3 cor=vec3(${(r / 255).toFixed(3)},${(g / 255).toFixed(3)},${(b / 255).toFixed(3)});vec3 col;${corpo}gl_FragColor=vec4(col,1.);}`;
    const sh = (ty, s) => { const x = gl.createShader(ty); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) console.error("shader:", gl.getShaderInfoLog(x)); return x; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, "attribute vec2 v;void main(){gl_Position=vec4(v,0.,1.);}")); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    return (progs[k] = { pr, v: gl.getAttribLocation(pr, "v"), t: gl.getUniformLocation(pr, "t"), res: gl.getUniformLocation(pr, "res") });
  }
  FX.shader = (tl, canvas, nome, o = {}) => {
    const cv = $(canvas), w = cv.width, h = cv.height, ctx = cv.getContext("2d"), G = glBase(w, h), gl = G.gl;
    const P = { t: 0 }, total = o.total ?? 10, vel = o.vel ?? 1, ini = o.ini ?? -1, fim = o.fim ?? 1e9, pg = programa(gl, SH[nome] || nome, o.cor || FX.cor);
    const draw = () => { if (P.t < ini - 0.05 || P.t > fim + 0.05) return;
      gl.useProgram(pg.pr); gl.bindBuffer(gl.ARRAY_BUFFER, gl.getParameter(gl.ARRAY_BUFFER_BINDING)); gl.enableVertexAttribArray(pg.v); gl.vertexAttribPointer(pg.v, 2, gl.FLOAT, false, 0, 0);
      gl.viewport(0, 0, w, h); gl.uniform2f(pg.res, w, h); gl.uniform1f(pg.t, P.t * vel + (o.fase ?? 0)); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      ctx.drawImage(G.c, 0, G.c.height - h, w, h, 0, 0, w, h); };
    tl.fromTo(P, { t: 0 }, { t: total, duration: total, ease: "none", onUpdate: draw, immediateRender: false }, 0);
    P.t = Math.max(0, ini); draw(); P.t = 0;
  };

  /* ---------- texto: 3D extrudado de verdade (camadas em profundidade), rastro, palavra a palavra ---------- */
  // transforma o elemento numa pilha de N cópias em profundidade; gire o elemento (rotationY/X) e a lateral aparece
  FX.texto3d = (alvo, o = {}) => {
    const el = $(alvo), n = o.camadas ?? 18, prof = o.prof ?? 2.2, cor = o.cor || FX.cor, [r, g, b] = rgb(cor), html = el.innerHTML;
    el.style.transformStyle = "preserve-3d"; el.style.position = el.style.position || "relative";
    el.innerHTML = `<span class="fx3-frente" style="position:relative;display:inline-block;transform:translateZ(0)">${html}</span>`;
    for (let i = 1; i <= n; i++) { const k = 1 - i / (n + 2), s = document.createElement("span");
      s.innerHTML = html; s.setAttribute("aria-hidden", "true"); s.setAttribute("data-layout-ignore", "");
      s.style.cssText = `position:absolute;left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;transform:translateZ(${-i * prof}px);color:rgb(${Math.round(r * k * 0.55)},${Math.round(g * k * 0.55)},${Math.round(b * k * 0.55)});text-shadow:none;-webkit-text-stroke:0`;
      el.insertBefore(s, el.firstChild); }
    return el;
  };
  // eco: N cópias que repetem a entrada com atraso e somem
  FX.rastro = (tl, alvo, t, de, para, o = {}) => {
    const el = $(alvo), n = o.n ?? 5, copias = [];
    for (let i = 0; i < n; i++) { const c = el.cloneNode(true); c.removeAttribute("id"); c.setAttribute("data-layout-ignore", ""); c.style.opacity = 0; c.style.pointerEvents = "none"; el.parentNode.insertBefore(c, el); copias.push(c); }
    copias.forEach((c, i) => { tl.fromTo(c, { ...de, opacity: 0.55 - i * 0.08 }, { ...para, opacity: 0, duration: (o.dur ?? 0.5) + i * 0.05, ease: o.ease || "expo.out", immediateRender: false }, t + (i + 1) * (o.atraso ?? 0.035)); });
    tl.fromTo(el, de, { ...para, duration: o.dur ?? 0.5, ease: o.ease || "expo.out", immediateRender: false }, t);
  };
  // divide o texto em palavras (.w) ou letras (.l)
  FX.dividir = (alvo, porLetra = false) => { const el = $(alvo), txt = el.textContent.trim();
    el.innerHTML = porLetra ? [...txt].map((c) => (c === " " ? " " : `<span class="l" style="display:inline-block">${c}</span>`)).join("")
      : txt.split(/\s+/).map((w) => `<span class="w" style="display:inline-block">${w}</span>`).join(" ");
    return [...el.querySelectorAll(porLetra ? ".l" : ".w")]; };
  FX.contar = (tl, alvo, de, ate, t, dur, fmt = (v) => Math.round(v).toLocaleString("pt-BR")) => {
    const el = $(alvo), P = { v: de }; el.textContent = fmt(de);
    tl.fromTo(P, { v: de }, { v: ate, duration: dur, ease: "power2.out", onUpdate: () => (el.textContent = fmt(P.v)), immediateRender: false }, t); };
  FX.digitar = (tl, alvo, texto, t, porLetra = 0.035) => { const el = $(alvo), P = { n: 0 }; el.textContent = "";
    tl.fromTo(P, { n: 0 }, { n: texto.length, duration: texto.length * porLetra, ease: "none", onUpdate: () => (el.textContent = texto.slice(0, Math.round(P.n))), immediateRender: false }, t); };

  /* ---------- interface rica (cartões com mini-gráfico, medidor, anel, barras, tabela, cronômetro) ---------- */
  const sv = (w, h, miolo) => `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="none" style="overflow:visible">${miolo}</svg>`;
  FX.ui = {
    // linha de gráfico com área preenchida; anime com FX.ui.desenhar(tl, el, t)
    linha(valores, o = {}) { const w = 300, h = 100, mx = Math.max(...valores), mn = Math.min(...valores), n = valores.length - 1, cor = o.cor || FX.cor;
      const pts = valores.map((v, i) => [(i / n) * w, h - ((v - mn) / (mx - mn || 1)) * h * 0.86 - 4]);
      const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" "), gid = "g" + ++nid;
      return sv(w, h, `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor}" stop-opacity=".45"/><stop offset="1" stop-color="${cor}" stop-opacity="0"/></linearGradient></defs>
        <path class="fx-area" d="${d} L${w} ${h} L0 ${h} Z" fill="url(#${gid})"/><path class="fx-traco" d="${d}" fill="none" stroke="${cor}" stroke-width="3.5" vector-effect="non-scaling-stroke" stroke-linejoin="round" style="filter:drop-shadow(0 0 6px ${cor})"/>
        <circle class="fx-ponta" cx="${pts[n][0]}" cy="${pts[n][1]}" r="5" fill="#fff" style="filter:drop-shadow(0 0 8px ${cor})"/>`); },
    barras(valores, o = {}) { const w = 300, h = 100, mx = Math.max(...valores), bw = w / valores.length, cor = o.cor || FX.cor;
      return sv(w, h, valores.map((v, i) => `<rect class="fx-barra" x="${i * bw + bw * 0.18}" y="${h - (v / mx) * h}" width="${bw * 0.64}" height="${(v / mx) * h}" rx="3" fill="${i === valores.length - 1 ? "#fff" : cor}" opacity="${0.45 + 0.55 * (i / valores.length)}" style="transform-origin:${i * bw}px ${h}px;transform-box:view-box"/>`).join("")); },
    // medidor em arco 0..1 com ponteiro
    medidor(o = {}) { const cor = o.cor || FX.cor, R = 80, C = Math.PI * R;
      return sv(200, 120, `<path d="M20 110 A80 80 0 0 1 180 110" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="14" stroke-linecap="round"/>
        <path class="fx-arco" d="M20 110 A80 80 0 0 1 180 110" fill="none" stroke="${cor}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" style="filter:drop-shadow(0 0 8px ${cor})"/>
        ${Array.from({ length: 11 }, (_, i) => { const a = Math.PI * (1 - i / 10); return `<line x1="${100 + Math.cos(a) * 62}" y1="${110 - Math.sin(a) * 62}" x2="${100 + Math.cos(a) * 54}" y2="${110 - Math.sin(a) * 54}" stroke="rgba(255,255,255,.4)" stroke-width="2"/>`; }).join("")}
        <g class="fx-ponteiro" style="transform-origin:100px 110px;transform:rotate(-90deg)"><line x1="100" y1="110" x2="100" y2="44" stroke="#fff" stroke-width="4" stroke-linecap="round" style="filter:drop-shadow(0 0 6px ${cor})"/><circle cx="100" cy="110" r="8" fill="#fff"/></g>`); },
    anel(o = {}) { const cor = o.cor || FX.cor, R = 44, C = 2 * Math.PI * R;
      return sv(100, 100, `<circle cx="50" cy="50" r="${R}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="8"/>
        <circle class="fx-anel" cx="50" cy="50" r="${R}" fill="none" stroke="${cor}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" transform="rotate(-90 50 50)" style="filter:drop-shadow(0 0 6px ${cor})"/>`); },
    // anima tudo que estiver dentro do elemento: traços se desenham, barras sobem, arcos/anéis enchem até "valor" (0..1)
    animar(tl, alvo, t, valor = 0.82, dur = 0.9) {
      const el = $(alvo);
      el.querySelectorAll(".fx-traco").forEach((p) => { const L = p.getTotalLength ? p.getTotalLength() : 1200; p.style.strokeDasharray = L; tl.fromTo(p, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: dur, ease: "power2.inOut", immediateRender: false }, t); });
      el.querySelectorAll(".fx-area").forEach((p) => tl.fromTo(p, { opacity: 0 }, { opacity: 1, duration: dur * 0.6, ease: "none", immediateRender: false }, t + dur * 0.4));
      el.querySelectorAll(".fx-ponta").forEach((p) => tl.fromTo(p, { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.3, ease: "back.out(3)", immediateRender: false }, t + dur));
      el.querySelectorAll(".fx-barra").forEach((r, i) => tl.fromTo(r, { scaleY: 0 }, { scaleY: 1, duration: 0.45, ease: "back.out(1.6)", immediateRender: false }, t + i * (dur / 14)));
      el.querySelectorAll(".fx-arco").forEach((p) => { const C = parseFloat(p.getAttribute("stroke-dasharray")); tl.fromTo(p, { strokeDashoffset: C }, { strokeDashoffset: C * (1 - valor), duration: dur, ease: "power3.out", immediateRender: false }, t); });
      el.querySelectorAll(".fx-ponteiro").forEach((p) => tl.fromTo(p, { rotation: -90 }, { rotation: -90 + 180 * valor, duration: dur, ease: "elastic.out(1,0.6)", immediateRender: false }, t));
      el.querySelectorAll(".fx-anel").forEach((p) => { const C = parseFloat(p.getAttribute("stroke-dasharray")); tl.fromTo(p, { strokeDashoffset: C }, { strokeDashoffset: C * (1 - valor), duration: dur, ease: "power3.out", immediateRender: false }, t); });
    },
  };

  window.FX = FX;
})();
