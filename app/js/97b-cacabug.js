/* =========================================================================
   Mini SK — 97b-cacabug.js
   🔬 Caça-Bug — DENTRO do Mini SK (não é um app separado):
   - 🔍 lê o projeto aberto inteiro (o motor do Laboratório) e acha os defeitos:
     nome declarado 2 vezes, erro de escrita, arquivo que não existe, botão que
     chama função que não existe, #id que a página não tem, pacote faltando…
   - 🐞 junta os erros AO VIVO da prévia e dos terminais (o Caçador de erros);
   - ⚖️ compara com um 📸 ponto de volta ou outro projeto ("funcionava antes"):
     mostra o que mudou, as funções que mudaram e os defeitos que só existem agora;
   - toque no defeito → abre o arquivo NA LINHA · 🤖 manda para a IA consertar.
   Procura sozinho quando você salva (se o painel estiver aberto).
   ========================================================================= */
(function (SK) {
  'use strict';
  const fs = () => SK.fs;
  const E = (s) => SK.esc(String(s == null ? '' : s));
  let box = null, ultimo = null, cmp = null, carregando = null, tAuto = 0;

  // ── as peças do Laboratório (só carregam quando você abre o Caça-Bug) ──
  const LB = window.LB = window.LB || {};
  LB.$ = LB.$ || ((s, r) => (r || document).querySelector(s));
  LB.$$ = LB.$$ || ((s, r) => Array.from((r || document).querySelectorAll(s)));
  LB.esc = LB.esc || ((s) => SK.esc(String(s == null ? '' : s)));
  function script(src) { return new Promise((ok, erro) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => erro(new Error('não consegui carregar ' + src)); document.head.appendChild(s); }); }
  function carregar() {
    if (window.LB.analisar && window.LB.comparar && window.acorn) return Promise.resolve();
    if (!carregando) carregando = (async () => {
      if (!window.acorn) await script('js/lib/acorn.min.js');
      if (!window.LB.analisar) await script('js/lib/lab/30-analise.js');
      if (!window.LB.comparar) await script('js/lib/lab/50-comparar.js');
    })().catch((e) => { carregando = null; throw e; });
    return carregando;
  }

  // projeto do Mini SK → formato do Laboratório
  function converter(nome, files) {
    const arquivos = Object.create(null);
    for (const p of Object.keys(files || {})) {
      if (/(^|\/)(node_modules|\.git)\//.test(p)) continue;
      const r = files[p] || {};
      arquivos[p] = r.text != null ? { t: r.text } : { b: r.size || (r.b64 ? Math.round(r.b64.length * 0.75) : 0) };
    }
    return { nome, arquivos };
  }
  const atual = () => converter(fs().project.name, fs().project.files);

  // "js/x.js:12", "index.html (script da linha 30)", "(linha 198)" → { caminho, linha }
  function onde(p) {
    const arq = String(p.arquivo || ''), txt = String(p.texto || '');
    let caminho = arq.replace(/ \(script da linha \d+\)$/, '').replace(/:\d+$/, '');
    let linha = +((/\(linha (\d+)\)/.exec(txt) || [])[1] || (/:(\d+)$/.exec(arq) || [])[1] || (/script da linha (\d+)/.exec(arq) || [])[1] || 0);
    // o texto cita "arquivo:linha" (ex.: nome repetido em js/a.js:1, js/b.js:1): abre o último citado que existe
    const citados = [...txt.matchAll(/([\w./@-]+\.(?:m?js|cjs|tsx?|jsx|html?|css))[:](\d+)/g)].filter((m) => fs().exists(m[1]));
    if (citados.length) { const m = citados[citados.length - 1]; return { caminho: m[1], linha: +m[2] }; }
    if (!caminho || !fs().exists(caminho)) { const m = /([\w./@-]+\.(?:m?js|cjs|tsx?|jsx|html?|css|json))(?::(\d+))?/.exec(txt); if (m && fs().exists(m[1])) { caminho = m[1]; linha = linha || +(m[2] || 0); } }
    return fs().exists(caminho) ? { caminho, linha } : null;
  }
  function abrirEm(o) { if (!o) return; try { if (o.linha) SK.editor.reveal(o.caminho, o.linha); else SK.editor.open(o.caminho); SK.toast('📄 ' + o.caminho + (o.linha ? ' · linha ' + o.linha : '')); } catch (e) { SK.toast('⚠ ' + e.message); } }

  function paraIA(texto) {
    SK.app.openSide('ai');
    setTimeout(() => { const inp = document.getElementById('ai-in'); if (inp) { inp.value = texto; inp.dispatchEvent(new Event('input')); } SK.toast('🤖 Escrevi o pedido na IA — confira e toque em Enviar.'); }, 150);
  }
  function pedidoConserto(p) {
    const o = onde(p); let t = 'O 🔬 Caça-Bug do Mini SK achou este defeito no meu projeto "' + fs().project.name + '":\n\n' + (p.grave ? '🔴 ' : '🟡 ') + p.texto + '\n';
    if (o) { const c = fs().read(o.caminho) || ''; t += '\nArquivo: ' + o.caminho + (o.linha ? ' (linha ' + o.linha + ')' : '') + '\n\n```\n' + (c.length > 60000 ? c.slice(0, 60000) + '\n… (cortado)' : c) + '\n```\n'; }
    return t + '\nMe explique em português simples o que está errado e me devolva o arquivo INTEIRO consertado (não me peça para trocar pedaços).';
  }

  // ── 🔍 procurar ──
  async function procurar(quieto) {
    if (!fs().project) { if (!quieto) SK.toast('Abra um projeto primeiro.'); return; }
    const st = box && SK.$('#cb-status', box); if (st && !quieto) st.textContent = '🔍 Lendo o projeto inteiro…';
    try { await carregar(); ultimo = window.LB.analisar(atual()); ultimo.quando = new Date().toLocaleTimeString('pt-BR'); }
    catch (e) { if (st) st.textContent = '⚠ ' + e.message; return; }
    pintar();
  }
  function itemProblema(p, i, origem) {
    const o = onde(p);
    return '<div class="cb-item ' + (p.grave ? 'grave' : '') + '"><div>' + (p.grave ? '🔴' : '🟡') + ' ' + E(p.texto) + '</div>' +
      '<div class="row wrap" style="margin-top:4px">' + (o ? '<button class="btn small" data-abrir="' + origem + ':' + i + '">📄 ' + E(o.caminho) + (o.linha ? ' · linha ' + o.linha : '') + '</button>' : '') +
      '<button class="btn small" data-ia="' + origem + ':' + i + '">🤖 Pedir conserto</button></div></div>';
  }
  function aoVivo() { return ((SK.cacador && SK.cacador.lista) || []).slice(-12).reverse(); }
  function pintar() {
    if (!box) return;
    const R = ultimo, vivos = aoVivo();
    const st = SK.$('#cb-status', box);
    if (R) {
      const graves = R.problemas.filter((p) => p.grave).length, avisos = R.problemas.length - graves;
      st.innerHTML = (graves ? '🔴 <b>' + graves + ' defeito(s) grave(s)</b>' : '✅ <b>Nenhum defeito grave</b>') + (avisos ? ' · 🟡 ' + avisos + ' aviso(s)' : '') + ' <span class="muted">· ' + R.quando + '</span>';
      SK.$('#cb-lista', box).innerHTML = R.problemas.length ? R.problemas.map((p, i) => itemProblema(p, i, 'p')).join('') : '<p class="muted small">Não achei nada errado lendo o código. Se mesmo assim algo não funciona, veja os erros ao vivo abaixo ou ⚖️ compare com quando funcionava.</p>';
      const nFun = R.funcoes.length, nPag = R.paginas.length;
      SK.$('#cb-mapa', box).innerHTML = '<div class="small">📄 ' + R.arquivos.length + ' arquivos · 🖥 ' + nPag + ' página(s) · ⚙️ ' + nFun + ' funções · 🔗 ' + R.quebradas.length + ' ligação(ões) quebrada(s)' + (R.pacote ? ' · 📦 ' + E(R.pacote.arquivo) : '') + '</div>' +
        (R.soltos && R.soltos.length ? '<div class="small muted" style="margin-top:4px">🧩 Arquivos que nenhuma página carrega (podem estar sobrando): ' + R.soltos.slice(0, 15).map((c) => '<code>' + E(c) + '</code>').join(', ') + (R.soltos.length > 15 ? '…' : '') + '</div>' : '');
    }
    SK.$('#cb-vivo', box).innerHTML = vivos.length ? vivos.map((x, i) => {
      const o = onde({ arquivo: '', texto: x.msg });
      return '<div class="cb-item"><div class="small muted">' + E(x.de) + ' · ' + E(x.quando) + (x.vezes > 1 ? ' · ' + x.vezes + 'x' : '') + '</div><div class="small" style="white-space:pre-wrap;word-break:break-word">' + E(x.msg.slice(0, 400)) + '</div>' +
        '<div class="row wrap" style="margin-top:4px">' + (o ? '<button class="btn small" data-abrir="v:' + i + '">📄 ' + E(o.caminho) + (o.linha ? ' · linha ' + o.linha : '') + '</button>' : '') + '<button class="btn small" data-ia="v:' + i + '">🤖 Pedir conserto</button></div></div>';
    }).join('') : '<p class="muted small">Nenhum erro ao vivo agora. (Aparecem aqui os erros da prévia e dos terminais — os mesmos do 🐞.)</p>';
  }
  function problemaDe(chave) {
    const [o, i] = chave.split(':');
    if (o === 'p') return ultimo && ultimo.problemas[+i];
    if (o === 'c') return cmp && cmp.problemasSoB[+i];
    if (o === 'v') { const x = aoVivo()[+i]; return x && { grave: true, texto: x.msg, arquivo: '' }; }
    return null;
  }

  // ── ⚖️ comparar com quando funcionava ──
  async function opcoesComparar() {
    const sel = SK.$('#cb-a', box); if (!sel) return;
    const cps = fs().project ? await SK.checkpoints.list() : [];
    let projs = []; try { projs = (await SK.db.all('projects')).map((p) => p.name).filter((n) => !fs().project || n !== fs().project.name).sort(); } catch {}
    sel.innerHTML = '<option value="">— escolha a versão que FUNCIONAVA —</option>' +
      (cps.length ? '<optgroup label="📸 Pontos de volta deste projeto">' + cps.slice(0, 40).map((c) => '<option value="cp:' + E(c.id) + '">📸 ' + E(c.label) + ' — ' + new Date(c.at).toLocaleString('pt-BR') + '</option>').join('') + '</optgroup>' : '') +
      (projs.length ? '<optgroup label="🗂 Outros projetos">' + projs.map((n) => '<option value="pj:' + E(n) + '">🗂 ' + E(n) + '</option>').join('') + '</optgroup>' : '');
  }
  async function comparar() {
    const v = SK.$('#cb-a', box).value; const st = SK.$('#cb-cmp-status', box);
    if (!v) { SK.toast('Escolha a versão que funcionava.'); return; }
    st.textContent = '⚖️ Comparando…';
    try {
      await carregar();
      let A;
      if (v.startsWith('cp:')) { const cp = await SK.db.get('checkpoints', v.slice(3)); if (!cp) throw new Error('ponto de volta não encontrado'); A = converter('📸 ' + cp.label, cp.snap.files); }
      else { const p = await SK.db.get('projects', v.slice(3)); if (!p) throw new Error('projeto não encontrado'); A = converter(p.name, p.files); }
      cmp = window.LB.comparar(A, atual());
      window.LB.mostrarComparacao(cmp);
      // os defeitos que só existem AGORA também ganham 📄 e 🤖
      const extra = SK.$('#cb-cmp-novos', box);
      extra.innerHTML = cmp.problemasSoB.length ? '<b>🔎 Defeitos que só existem AGORA (' + cmp.problemasSoB.length + ')</b>' + cmp.problemasSoB.map((p, i) => itemProblema(p, i, 'c')).join('') : '';
      st.innerHTML = '✅ <b>' + E(A.nome) + '</b> (funcionava) × <b>' + E(fs().project.name) + '</b> (agora). <button class="btn small primary" id="cb-cmp-ia">🤖 Mandar a comparação para a IA</button> <button class="btn small" id="cb-cmp-md">⤓ .md</button>';
    } catch (e) { st.textContent = '⚠ ' + e.message; }
  }

  function build(container) {
    box = container;
    if (!document.getElementById('cb-estilo')) {
      const s = document.createElement('style'); s.id = 'cb-estilo';
      s.textContent = '.cb-item{border:1px solid var(--line2,#334);border-radius:10px;padding:8px;margin:6px 0}.cb-item.grave{border-color:var(--danger,#e66)}' +
        '#v-cmp .card{border:1px solid var(--line2,#334);border-radius:10px;padding:8px;margin:8px 0}#v-cmp h2{font-size:1rem;margin:6px 0}#v-cmp .chip{display:inline-block;border:1px solid var(--line2,#334);border-radius:99px;padding:1px 8px;margin:2px;font-size:.85em}' +
        '#v-cmp .ad{color:var(--ok,#4c9)}#v-cmp .rm{color:var(--danger,#e66)}#v-cmp .mu{color:#d9a400}#v-cmp details.arq{border:1px solid var(--line2,#334);border-radius:8px;margin:6px 0;padding:4px 8px}#v-cmp details.arq summary{cursor:pointer;display:flex;gap:8px;flex-wrap:wrap}' +
        '#v-cmp .lado{display:grid;grid-template-columns:1fr 1fr;font:12px/1.4 ui-monospace,Consolas,monospace;overflow:auto}#v-cmp .lado .cab{font-weight:bold;padding:4px}#v-cmp .lado .l{white-space:pre-wrap;word-break:break-all;padding:0 4px;min-height:1.4em}' +
        '#v-cmp .lado .n{display:inline-block;min-width:3em;opacity:.5;user-select:none}#v-cmp .lado .menos{background:rgba(230,80,80,.18)}#v-cmp .lado .mais{background:rgba(60,200,120,.18)}#v-cmp .lado .sep{grid-column:1/3;text-align:center;opacity:.6;padding:2px}#v-cmp .muted{opacity:.7}#v-cmp .pequeno{font-size:.85em}';
      document.head.appendChild(s);
    }
    box.innerHTML =
      '<p class="muted small">Acha defeitos no projeto aberto lendo o código inteiro, junta os erros ao vivo (🐞) e compara com quando funcionava. Toque no defeito para abrir o arquivo na linha, ou 🤖 para a IA consertar.</p>' +
      '<div class="row wrap"><button class="btn primary" id="cb-procurar">🔍 Procurar bugs agora</button><label class="small"><input type="checkbox" id="cb-auto"> 🔄 Procurar sozinho quando eu salvar</label></div>' +
      '<div id="cb-status" class="small" style="margin:6px 0"></div><div id="cb-lista"></div>' +
      '<h3 style="font-size:1rem;margin:14px 0 4px">🐞 Erros ao vivo (prévia e terminais)</h3><div id="cb-vivo"></div>' +
      '<h3 style="font-size:1rem;margin:14px 0 4px">⚖️ O que mudou desde quando funcionava</h3>' +
      '<div class="row wrap"><select class="input" id="cb-a" style="flex:1;min-width:0"></select><button class="btn primary" id="cb-comparar">⚖️ Comparar com o de agora</button></div>' +
      '<div id="cb-cmp-status" class="small" style="margin:6px 0"></div><div id="cb-cmp-novos"></div><div id="v-cmp"></div>' +
      '<h3 style="font-size:1rem;margin:14px 0 4px">🗺️ Mapa do projeto</h3><div id="cb-mapa" class="small muted">Toque em 🔍 Procurar.</div>';
    const auto = SK.$('#cb-auto', box); auto.checked = SK.pref.get('cacabugAuto', true); auto.onchange = () => SK.pref.set('cacabugAuto', auto.checked);
    SK.$('#cb-procurar', box).onclick = () => procurar(false);
    SK.$('#cb-comparar', box).onclick = comparar;
    box.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.abrir) { const p = problemaDe(b.dataset.abrir); if (p) abrirEm(onde(p)); }
      if (b.dataset.ia) { const p = problemaDe(b.dataset.ia); if (p) paraIA(pedidoConserto(p)); }
      if (b.id === 'cb-cmp-ia' && cmp) paraIA(window.LB.comparacaoMD(cmp));
      if (b.id === 'cb-cmp-md' && cmp) SK.download('comparacao-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.md', window.LB.comparacaoMD(cmp), 'text/markdown');
    });
    pintar();
  }
  const visivel = () => box && document.body.contains(box) && box.offsetParent !== null;
  SK.on('fs-change', (ev) => { if (!visivel() || !SK.pref.get('cacabugAuto', true) || (ev && ev.silent)) return; clearTimeout(tAuto); tAuto = setTimeout(() => procurar(true), 1500); });
  SK.on('project-open', () => { ultimo = null; cmp = null; if (visivel()) { const v = SK.$('#v-cmp', box); if (v) v.innerHTML = ''; SK.$('#cb-cmp-novos', box).innerHTML = ''; SK.$('#cb-cmp-status', box).textContent = ''; opcoesComparar(); procurar(true); } });
  setInterval(() => { if (visivel()) pintarVivos(); }, 3000);
  let nVivos = -1; function pintarVivos() { const n = ((SK.cacador && SK.cacador.lista) || []).length; if (n !== nVivos) { nVivos = n; pintar(); } }

  function aoAbrir() { if (!box) return; opcoesComparar(); procurar(true); }
  // usado pelo 🧩 Modularizar: compara o projeto aberto com outro (ex.: o original simples)
  async function compararCom(nomeProjeto) {
    SK.app.openSide('bug'); await opcoesComparar();
    const sel = SK.$('#cb-a', box); sel.value = 'pj:' + nomeProjeto;
    await comparar(); try { SK.$('#cb-cmp-status', box).scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {}
  }
  SK.cacabug = { build, procurar, comparar, compararCom, carregar, aoAbrir, get ultimo() { return ultimo; } };
})(window.SK);
