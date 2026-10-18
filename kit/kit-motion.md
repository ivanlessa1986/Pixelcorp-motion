# Kit Motion · guia de referências para a IA animar vídeos

> Versão 2.0 · 18/10/2026 (v2: distorção real com o `kit-fx.js`) · feito por @oivandigital (PixelCorp) · grátis, uso livre.
> **Arquivos do kit:** `kit-motion.md` (este guia) + `kit-fx.js` (efeitos prontos com distorção real da imagem; seção 10). Os dois ficam na mesma pasta do vídeo.
> **Para a IA que está lendo:** leia este guia inteiro ANTES de escrever qualquer animação e use os valores daqui (tamanhos, cores, ritmo, curvas). Ele foi escrito para o HyperFrames (HTML + CSS + GSAP, gratuito, licença Apache-2.0), mas os números valem para qualquer ferramenta de vídeo por código.
> **Para a pessoa:** você não precisa entender nada disto. Cole o pedido na sua IA e diga "leia o kit-motion.md antes". Ela usa os números certos e o vídeo sai com cara de profissional, em vez de cara de apresentação antiga.

## 0. As 7 regras que mais mudam o resultado
1. **A palavra aparece quando é dita.** Legenda palavra por palavra, 0,22 a 0,35 s por palavra (padrão 0,32 s). Com locução, use o início de cada palavra do arquivo de transcrição; sem locução, simule uma fala de ~3 palavras/s.
2. **Uma ideia por cena, uma ilustração literal por frase.** Se a frase diz "cortou o preço", a tela mostra um preço sendo cortado.
3. **Algo muda a cada 2,5 s no máximo** (corte, zoom, palavra gigante, faísca). Cena nunca dura menos de 1,8 s.
4. **Entrada rápida e decidida, saída mais rápida ainda.** Entrada com desaceleração (ease-out); saída com 40 a 60% do tempo da entrada.
5. **Luz de verdade:** núcleo quase branco + halo colorido em camadas (seção 6). Fundo quase preto, um só tom de destaque por vídeo.
6. **Nunca texto pequeno.** No celular, nada que precisa ser lido fica abaixo de 40 px reais.
7. **Sem sorteio.** Tudo que parece aleatório usa uma função com semente (seção 9), para o vídeo sair igual toda vez.

## 0b. Contenção: efeito só onde ele ajuda (regra do Ivan, 18/10/2026)
O kit tem muitos efeitos, e **nenhum vídeo usa todos**. Cada efeito precisa de um motivo; no vídeo do canal o excesso atrapalha a leitura. Regras:
1. **Um foco por cena:** no máximo UM efeito de destaque ativo por vez (brilho forte, flare, partículas densas, glitch, texto 3D). O resto da cena fica calmo.
2. **Onde o efeito vale:** gancho (0 a 3 s), a palavra-chave do ponto central, a revelação do resultado, a virada entre blocos e o fecho. **Cenas de leitura** (pedido, resumo, lista, prova, aviso) têm fundo calmo: sem partículas, sem grade animada, sem painel técnico atrás do texto.
3. **Fundo atrás de texto:** no máximo 12 partículas, sem passar por cima do texto; nenhum rótulo técnico ou número de fundo competindo com o que deve ser lido. O texto manda: nítido, grande e com contraste.
4. **Sem relógio nem numeração de cena nos vídeos do canal:** a barra de progresso no topo já mostra o andamento. Contador de tempo (GRAV/REC), "cena NN/NN" e rótulos de estúdio ficam só na vitrine de efeitos ("Poder do Motion").
5. **Densidade:** no máximo 3 camadas ao mesmo tempo (fundo + texto + 1 elemento) e pelo menos 60% da tela livre em cena de leitura.
6. **Transições:** variar, mas transição de impacto só nas viradas (no máximo 1 a cada 6 a 8 s). Entre cenas de leitura, corte simples ou fade curto.
7. **Teste de legibilidade antes de entregar:** pause em 5 quadros ao acaso, em 390 px de largura. Se algo do fundo compete com o texto, remova; se o vídeo ficou "carregado", tire um efeito, não adicione outro.
8. **A vitrine é a exceção:** o vídeo que mostra o kit pode usar tudo. Vídeo de assunto (livro, ferramenta, oferta) escolhe poucos efeitos e os usa bem.
9. **Tempo medido é resultado, não cronômetro:** mostre o número final ("1 MIN 05 S") entrando de uma vez; nada de relógio correndo nem barra enchendo (repete a barra do topo).
10. **Palavra-isca no fecho desde o começo da cena** (até 0,5 s), não no fim. Entre cenas de leitura, fade de 0,25 s.

## 1. Unidade de medida
`u` = 1% do menor lado do quadro. Vídeo em pé 1080×1920 → u = 10,8 px. Tela 1600×1200 → u = 12 px. Todos os tamanhos abaixo estão em `u`.

## 2. Tipografia (fontes gratuitas)
| Papel | Fonte | Tamanho | Detalhes |
|---|---|---|---|
| Palavra gigante (1 a 2 palavras) | Archivo Black | 22u | entrelinha 0,9 · espaçamento −0,03em |
| Número gigante | Archivo Black | 30u | algarismos de largura fixa (tabular-nums) |
| Título | Space Grotesk 700 | 11u | −0,02em |
| Legenda palavra a palavra | Space Grotesk 700 | 8u | entrelinha 1,08 · no máximo 2 linhas |
| Frase de apoio / chips | Manrope 600–700 | 5u / 4,2u | entrelinha 1,2 |
| Rótulo técnico (HUD) | JetBrains Mono 800 | 2,2u | CAIXA ALTA · espaçamento 0,14em |
| Micro rótulo | JetBrains Mono 500 | 1,7u | CAIXA ALTA · 0,1em |
Palavra-chave da frase: cor de destaque + brilho + "soco" de escala (1,25 → 1 em 0,3 s, expo.out).

## 3. Grade e zonas
- Margem lateral 6u; 6 colunas; calha 2u.
- **Vídeo 9:16 (1080×1920):** topo 0–130 px é da interface da rede social; 130–330 px fica para selo/marca; **legenda entre 360 e 700 px; elemento principal entre 700 e 1400 px; nada importante abaixo de 1670 px** (botões do Reels).
- **Tela dentro de um monitor (1600×1200):** legenda em 7–30% da altura, elemento principal em 30–78%, HUD a 4u das bordas.

## 4. Ritmo
| Item | Valor |
|---|---|
| Duração por palavra | 0,22 a 0,35 s (padrão 0,32 s) |
| Palavra entra em | 0,16 s, começando 0,03 s antes de ser dita |
| Cena mínima | 1,8 s |
| Troca máxima | 2,5 s sem nada mudar |
| Leitura de frase inteira (ex.: pedido) | 0,30 s por palavra + 1 s; pedido ≥ 3,5 s parado |
| Pausa antes de um impacto | 0,12 s |
| Sobra no fim da cena | 0,3 s |
Cortes no fim de palavra ou na batida da música; som de impacto no quadro exato do corte; nunca duas transições pesadas seguidas (pesada, leve, corte seco).

## 5. Curvas de movimento (nomes do GSAP)
| Movimento | Curva | Duração |
|---|---|---|
| Palavra/número gigante ("slam") | `expo.out` | 0,45 s, de escala 1,7 e desfoque 18 px para 1 e 0 |
| Cartão, chip, painel | `power3.out` | 0,35 s |
| Selo, ícone, botão (pop) | `back.out(1.7)` | 0,36 s |
| Objeto que cai no lugar (1 por cena) | `elastic.out(1, 0.55)` | 0,7 s |
| Saída | `power2.in` | 0,18 s |
| Câmera (zoom/pan) | `power3.inOut` | 0,8 s |
| Chicote (whip) | sai `power4.in` 0,16 s · entra `expo.out` 0,32 s | |
| Contador, rolagem, varredura | `none` (linear) | |
| Respiração, deriva | `sine.inOut` | |
Anime só posição, escala, rotação, opacidade, filtro e recorte (nunca largura, altura, top ou left).

## 6. Paletas (escolha UMA por vídeo; um só tom de destaque)
| Tema | Fundo | Fundo 2 | Superfície | Texto | Mudo | Destaque | Alerta | Ok |
|---|---|---|---|---|---|---|---|---|
| Escuro neon | #05080d | #0a1220 | #0e1726 | #eaf9ff | #7f93a8 | **#38e1ff** | #ff4d6d | #3dffa8 |
| Escuro ouro | #080604 | #14100a | #1c160d | #fff5e3 | #a8957a | **#ffb341** | #ff5a4f | #9cf27a |
| Escuro magenta | #07030c | #170828 | #1e0b33 | #fdeeff | #9d88b0 | **#ff3fd8** | #ffcc33 | #4dffc3 |
| Claro | #f2f0ea | #e6e3da | #ffffff | #0f1419 | #5d6670 | **#2457ff** | #e0342f | #0f9d58 |
Fundo: degradê radial do Fundo 2 (centro, 42% da altura) para o Fundo (borda, 70%).

### Brilho (bloom) em camadas
Núcleo da letra = 70% branco + 30% destaque. Halo com 5 sombras em `em` (escala com a letra):
```css
.neon { color: #c3f5ff; /* 70% branco + 30% #38e1ff */
  text-shadow: 0 0 .01em rgba(255,255,255,.9), 0 0 .04em #38e1ff, 0 0 .12em rgba(56,225,255,.85),
               0 0 .3em rgba(56,225,255,.55), 0 0 .6em rgba(56,225,255,.28); }
```
Tema claro: nada de núcleo branco; só 2 sombras suaves (0,06em e 0,2em, 35%).
Se der para pós-processar o vídeo (ffmpeg), some um bloom real: realces acima de 45% → desfoque 9 px tingido com o destaque, mais uma cópia a 1/4 da resolução com desfoque 9 px, as duas em modo "screen".

## 7. Efeitos (receitas curtas)
- **Faísca (flare):** ponto branco com halo radial (#fff 0–7%, destaque 18%, 35% em 40%, transparente em 70%, 18u de diâmetro) + traço horizontal fino de 140u × 0,7u (transparente → destaque → branco → destaque → transparente) + 2 raios de 28u girados ±62° + 4 círculos "fantasmas" de 3 a 9u com borda a 35%. Modo de mistura `screen`. Atravessa a palavra gigante em ~0,9 s logo depois que ela entra; o núcleo pulsa (escala 1 → 1,25, 0,07 s, ida e volta).
- **Mira (crosshair):** linha horizontal e vertical da tela inteira (destaque a 55%), anel tracejado de raio 7u girando 220° em ~2 s, ponto branco com brilho, leitura de coordenadas em mono ("ALVO · 0412 · 0288") que muda enquanto ela anda (`power3.inOut`). Ao chegar: 4 cantos em L entram de escala 2,2 para 1 (0,22 s, expo.out) + flash de 25%.
- **Grade em perspectiva (piso):** dois degradês lineares de linhas de 0,25u a cada 9u, `perspective(60u) rotateX(64deg)`, máscara sumindo no horizonte e embaixo, linha de horizonte acesa (destaque com sombra 3u). Rola para a frente animando `background-position` (linear).
- **Partículas:** num canvas, 40 a 70 pontos com posição calculada a partir do tempo (nunca guardando estado): "poeira" sobe devagar e pisca; "explosão" sai de um ponto com desaceleração exponencial e gravidade. Cada ponto é um degradê radial branco → destaque → transparente.
- **HUD de estúdio:** cantos em L (3,2u, traço 0,35u, destaque 75%), no topo "TÍTULO · CENA 03 / 15" e "● GRAVANDO 00:12:04" (bolinha vermelha piscando a cada 0,26 s), embaixo um rótulo técnico por cena e uma régua com marcas e uma cabeça de leitura que anda durante a cena.
- **Tela (por cima de tudo):** linhas de varredura (faixas de 0,17u a cada 0,45u, preto 16%), grão animado (textura trocando de posição 8 vezes por segundo, 13%, modo `screen`), vinheta radial (45% → 100%, até 55% de preto). Opcional: borda arredondada de tubo.
- **Glitch RGB:** por 0,2 a 0,5 s, a cada 0,04 s: deslocamento horizontal em degraus (até 12 px, diminuindo), duas sombras coloridas `drop-shadow(Npx 0 0 rgba(255,40,90,.85)) drop-shadow(-Npx 0 0 rgba(40,230,255,.85))` e, a cada 3 passos, um recorte de faixa (`clip-path: inset(a% 0 b% 0)`). Termina limpo.
- **Texto 3D extrudado:** 9 sombras de texto empilhadas atrás do brilho, cada uma 0,006em para a direita e 0,011em para baixo, do destaque escurecido até quase preto, mais uma sombra de contato desfocada. **Rastro:** 4 cópias da palavra que fazem o mesmo movimento de entrada com 0,03 s de atraso cada e somem (eco).
- **Orbe de luz:** círculo de 75u com degradê radial do destaque (30% → 0) passeando devagar atrás de tudo (6 s por trecho, `sine.inOut`).

## 8. Cenas modelo (escolha uma por frase)
1. **Palavra gigante** 3D com brilho, rastro, faísca e tremor.
2. **Número gigante** contando, crescendo junto com o valor, tremor e flash no fim.
3. **Pedido digitado** numa barra com cursor; sugestões entrando embaixo; botão de enviar que afunda.
4. **Cartões** (2 a 4) que entram girando e acendem quando a palavra é dita.
5. **Antes × depois** com cortina de luz que varre.
6. **Linha do tempo** com fio de luz e passos que acendem.
7. **Código rolando** num editor, com a linha atual destacada.
8. **Gráfico** de barras que sobem com valor no topo.
9. **Medidor** com arco e ponteiro.
10. **Selo de prova** (carimbo que cai girando, treme e dá flash).
11. **Lista marcada** (o visto se desenha).
12. **Preço cortado:** a mira trava na etiqueta, um laser corta, as metades caem e nasce "GRÁTIS" (ou o novo preço).
13. **Mira no alvo:** a mira trava numa palavra e ela muda de cor.
14. **Fluxo:** nós ligados por linhas tracejadas que correm (pedido → IA → vídeo).
15. **Celular** com o resultado real tocando.
16. **Vitrine:** grade de cartões pequenos que viram em cascata.
17. **Frase** grande com sublinhado de luz.
18. **Iceberg:** acima da água o que se viu; abaixo, o que uma empresa de verdade precisa.
19. **Fecho:** chamada final + "Comenta PALAVRA" + redes.

## 9. Transições (20)
Corte seco com flash · chicote (lateral ou vertical, com desfoque e inclinação) · zoom através · zoom para fora · túnel (anéis de luz) · glitch RGB · estilhaço (vidro em triângulos que voam) · película (fita de filme passando) · inundar (círculo de cor) · íris · persiana · blocos · luz (estouro de exposição) · desfoque · pixel · dobra 3D · empurrar · laser (a tela fecha numa linha e reabre) · estática de TV · desligar (tubo apagando).
Regras: saída em [t − 0,16…0,3 s, t] e entrada em [t, t + 0,3…0,5 s]; som de whoosh/impacto no instante t; alternar pesada, leve e corte seco.

## 10. Distorção real e efeitos prontos (`kit-fx.js`)
O `kit-fx.js` mexe nos PIXELS da cena (filtros SVG de deslocamento sobre o próprio HTML, shaders WebGL, canvas), em vez de só mover caixas. É isso que dá cara de "motion de verdade". Carregue depois do GSAP e chame `FX.inicio({ W: 1080, H: 1920, cor: "<destaque do tema>" })`.

| Função | O que faz |
|---|---|
| `FX.trans.estilhaco(tl, t, "#c1 .quadro", "#c2 .quadro", {cx, cy})` | rachaduras acesas, a imagem real quebra em cacos que voam, flash |
| `FX.trans.tunel(tl, t, a, b)` | a cena é sugada por uma lente que gira (redemoinho real); a nova sai de dentro |
| `FX.trans.glitch(tl, t, a, b)` | separa vermelho/verde/azul de verdade + fatias deslocadas em degraus |
| `FX.trans.chicote(tl, t, a, b, {vertical, sentido})` | borrão de movimento real na direção do giro |
| `FX.trans.derreter(tl, t, a, b)` | a imagem vira líquido e escorre; a nova se solidifica |
| `FX.trans.inundar(tl, t, a, b, {cx, cy})` | círculo cresce com borda ondulada |
| `FX.trans.luz(tl, t, a, b)` · `FX.trans.corte(tl, t, a, b)` | estouro de exposição · corte seco com soco e flash (leves) |
| `FX.filtros.bloom(forca, raio)` → `.url` | brilho REAL (só o que é claro vaza luz). Aplique uma vez em `#mundo` |
| `FX.filtros.onda()/glitch()/lente(cx, cy, giro)` | os mesmos filtros para usar dentro de uma cena (anime `feDisplacementMap` `attr.scale`) |
| `FX.shader(tl, "#canvas", "grade"/"tunel"/"raios"/"plasma"/"ondas", {total, ini, fim})` | fundo vivo em WebGL (piso neon em perspectiva, túnel de luz, raios, plasma, ondas). Um contexto só para o vídeo inteiro; passe `ini`/`fim` da cena |
| `FX.particulas(tl, "#canvas", [{modo, n, t0, dur, x, y}], total)` | `poeira`, `explosao`, `faiscas` (com rastro e gravidade), `vortice`, `chuva`, `estrelas` (dobra espacial). Centenas de pontos com brilho somado |
| `FX.texto3d("#el", {camadas: 24, prof: 4})` | letras 3D extrudadas DE VERDADE (pilha em profundidade); gire com `rotationY/rotationX` + `transformPerspective: 1000` |
| `FX.rastro(tl, "#el", t, de, para)` | eco: cópias repetem a entrada com atraso |
| `FX.contar(tl, "#el", de, ate, t, dur, fmt)` · `FX.digitar(tl, "#el", texto, t)` · `FX.dividir("#el")` | número que sobe · texto digitado · palavras em `.w` |
| `FX.ui.linha([...])`, `FX.ui.barras([...])`, `FX.ui.medidor()`, `FX.ui.anel()` + `FX.ui.animar(tl, "#painel", t, valor)` | mini-gráficos que se desenham, barras que sobem, medidor com ponteiro elástico, anel de progresso |
| `FX.camera.soco/deriva/parallax/tremor` · `FX.flash(tl, t)` | câmera: soco de zoom, aproximação lenta, profundidade, tremor com semente |

**Esqueleto (copie e preencha):**
```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script src="kit-fx.js"></script>
<style>
 #root{position:relative;width:1080px;height:1920px;overflow:hidden;background:#080604}
 #mundo{position:absolute;inset:0}                 /* recebe o bloom e a câmera */
 .cena{position:absolute;inset:0}
 .quadro{position:absolute;inset:0;overflow:hidden;background:#080604}  /* os filtros vão AQUI */
 canvas.fundo,#particulas{position:absolute;inset:0;width:100%;height:100%}
</style>
<div id="root" data-composition-id="main" data-start="0" data-duration="45" data-width="1080" data-height="1920">
 <div id="mundo">
  <!-- cena 1 vai até o corte em 3,0 s e fica mais 0,6 s para a transição -->
  <div id="c1" class="cena clip" data-start="0" data-duration="3.6" data-track-index="1" data-layout-allow-overlap data-layout-allow-occlusion>
   <div class="quadro"><canvas class="fundo" id="f1" width="540" height="960"></canvas> ...conteúdo... </div></div>
  <!-- a cena seguinte COMEÇA no instante do corte (nunca antes) -->
  <div id="c2" class="cena clip" data-start="3" data-duration="3.6" data-track-index="2" data-layout-allow-overlap data-layout-allow-occlusion>
   <div class="quadro"> ... </div></div>
 </div>
 <canvas id="particulas" width="1080" height="1920" data-layout-ignore></canvas>
 <!-- HUD fixo e rótulos ficam aqui, fora de #mundo -->
</div>
<script>
 FX.inicio({ W: 1080, H: 1920, cor: "#ffb341" });
 const tl = gsap.timeline({ paused: true });
 FX.shader(tl, "#f1", "grade", { total: 45, ini: 0, fim: 3.6 });
 FX.particulas(tl, "#particulas", [{ modo: "poeira", n: 160 }, { modo: "explosao", n: 320, t0: 3, dur: 1.2 }], 45);
 FX.trans.estilhaco(tl, 3.0, "#c1 .quadro", "#c2 .quadro");
 document.querySelector("#mundo").style.filter = FX.filtros.bloom(1, 1).url;
 window.__timelines = { main: tl };
</script>
```
Cuidados: filtros só no `.quadro` (nunca no `.clip`); uma transição por corte; o render fica em ~6 s por segundo de vídeo (normal). O `check` acusa sobreposição/contraste nas camadas do texto 3D, nas partículas e no meio das transições: é intencional; Lint e Runtime têm de passar sem erro e o resto você confere nos quadros.

## 11. Nível de impacto (o que separa amador de profissional)
1. **Quadro 0 já aceso e em movimento:** palavra gigante no meio do "slam", fundo em shader andando, partículas, faísca. Nunca começar do preto nem com fade.
2. **Toda cena tem 3 camadas:** fundo vivo (shader, grade ou partículas) + elemento principal GIGANTE (60 a 95% da largura) + interface de apoio densa (HUD, números, chips, mini-gráficos).
3. **Interface rica, não caixa vazia:** um painel tem 4 a 8 blocos (mini-gráfico de linha, barras, medidor, anel, tabela de 3 a 5 linhas com números contando, cronômetro em fonte mono, chips de status, barra de progresso), acendendo em cascata (0,06 s entre itens).
4. **Partículas com densidade:** poeira 120 a 200 sempre; 250 a 400 em cada impacto; 300 a 500 no túnel/dobra espacial.
5. **Câmera viva:** `soco` em cada batida, `deriva` em toda cena, `tremor` em todo impacto.
6. **Transição com distorção real em todo corte**, alternando pesada (estilhaço, túnel, glitch, derreter), média (chicote, inundar) e leve (luz, corte seco). Nunca a mesma pesada duas vezes seguidas.
7. **Bloom real ligado** (`FX.filtros.bloom`) + brilho em camadas na tipografia (seção 6). Contraste alto: fundo quase preto, destaque saturado, núcleo quase branco.

## 12. Vídeo "vitrine" (mostrar várias possibilidades num vídeo só)
- 2 a 4 s por possibilidade; troca de cena a cada 2 a 3 s; 12 a 18 possibilidades em 45 s.
- Em cada cena, um rótulo pequeno do que foi pedido, entre 360 e 560 px de altura: micro rótulo mono "PEDIDO 07" + a frase entre aspas em Space Grotesk 700, 4,5u, até 2 linhas (ex.: pedido: "faça o preço cair e virar GRÁTIS"). Ele entra digitado (`FX.digitar`) em até 0,6 s.
- O efeito ocupa o centro (700 a 1500 px) e é literal: se o pedido diz "gráfico que cresce", o gráfico cresce na tela.
- Abra com a possibilidade mais forte (palavra gigante 3D + faísca + explosão de partículas) e feche com uma frase gigante, sem tela parada no fim.

## 13. Regras técnicas (HyperFrames)
- Uma única linha do tempo GSAP pausada, registrada em `window.__timelines["<id>"]`.
- `fromTo` com valores iniciais explícitos; nada de `Math.random()`/`Date.now()`. "Aleatório" com semente:
  `rnd = (i, s) => { const x = Math.sin(i*127.1 + s*311.7) * 43758.5453; return x - Math.floor(x); }`
- Contadores e canvas: um objeto "proxy" animado e `onUpdate` que desenha a partir do valor (função pura do tempo).
- Rode `npx hyperframes check` e corrija tudo antes de `npx hyperframes render`. Confira quadros do vídeo pronto (início, meio e fim de cada cena).

## 14. Antes de entregar (checklist)
- [ ] A frase de abertura aparece em até 0,5 s e a promessa inteira cabe em 3 s.
- [ ] Toda palavra dita aparece na tela no instante certo; palavra-chave em destaque.
- [ ] Nenhuma cena parada por mais de 2,5 s; nenhuma cena com menos de 1,8 s.
- [ ] Um só tom de destaque; fundo quase preto (ou o tema claro inteiro).
- [ ] Nada importante fora das zonas da seção 3.
- [ ] Nada inventado: nomes, preços e ofertas exatamente como a pessoa pediu.
- [ ] Quadro 0 aceso e em movimento; bloom ligado; toda cena com fundo vivo + elemento gigante + interface de apoio (seção 11).
- [ ] Toda transição pesada usa o `kit-fx.js` (distorção real), alternando com leves.
