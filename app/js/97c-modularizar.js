/* =========================================================================
   Mini SK — 97c-modularizar.js
   🧩 Modularizar — tudo ligado, num painel só (celular e computador):
   1. ✂️ DIVIDIR SEM QUEBRAR: o HTML grande vira um projeto NOVO ao lado
      ("NOME (modular)"): cada <style> vai para css/, cada <script> para js/,
      na MESMA ordem. Script grande é partido por funções SÓ onde é seguro
      (o que roda ao abrir a página nunca fica antes do que ele usa).
      O original não muda.
   2. ✅ CONFERIR SOZINHO: roda as duas versões escondidas e compara os erros
      e a tela; e abre o 🔬 Caça-Bug comparando simples × modular
      (as funções que mudaram/sumiram, os defeitos que só existem na modular).
   3. ▶ TESTAR NO TERMINAL: no computador, liga um servidor no 💻 terminal
      (python -m http.server) e abre no navegador; no celular, usa o ⚡ Node
      (npx serve) — é o "precisa de servidor" que a Triagem fala.
   4. 🧷 JUNTAR DE VOLTA: a versão modular vira um arquivo só (o juntar.py,
      aqui dentro), para abrir em qualquer lugar.
   ========================================================================= */
(function (SK) {
  'use strict';
  const fs = () => SK.fs;
  const E = (s) => SK.esc(String(s == null ? '' : s));
  let box = null, ultimo = null;

  // ── caminhos ──
  const dirDe = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
  function normalizar(p) { const o = []; for (const s of p.split('/')) { if (!s || s === '.') continue; if (s === '..') o.pop(); else o.push(s); } return o.join('/'); }
  const juntarCaminho = (dir, rel) => normalizar((dir ? dir + '/' : '') + rel);
  function relativo(deDir, para) {
    const a = deDir ? deDir.split('/') : [], b = para.split('/');
    let i = 0; while (i < a.length && i < b.length - 1 && a[i] === b[i]) i++;
    return '../'.repeat(a.length - i) + b.slice(i).join('/');
  }
  const externo = (u) => !u || /^(?:[a-z][\w+.-]*:|\/\/|#|data:)/i.test(u.trim()) || u.trim().startsWith('/');
  // url(...) e @import de um CSS que MUDA de pasta: continuam apontando para o mesmo arquivo
  function moverCss(css, deDir, paraDir) {
    const fix = (u) => (externo(u) ? u : relativo(paraDir, juntarCaminho(deDir, u)));
    return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, u) => 'url(' + q + fix(u) + q + ')')
      .replace(/@import\s+(['"])([^'"]+)\1/g, (m, q, u) => '@import ' + q + fix(u) + q);
  }
  const nomeLimpo = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 30) || 'parte';
  const pad = (n) => String(n).padStart(2, '0');
  const linhas = (t) => t.split('\n').length;

  // ── partir um <script> comum grande, só onde é seguro ──
  function idsDe(node, fora) {
    // nomes usados (sem entrar em funções — a não ser as que rodam na hora: (function(){…})())
    const out = new Set();
    (function andar(n, pai, chave) {
      if (!n || typeof n.type !== 'string') return;
      const ehFuncao = /^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(n.type);
      if (ehFuncao && !fora && !(pai && pai.type === 'CallExpression' && chave === 'callee') && !(pai && pai.type === 'CallExpression' && chave === 'arguments' && false)) return;
      if (n.type === 'Identifier') { if (!(pai && pai.type === 'MemberExpression' && chave === 'property' && !pai.computed) && !(pai && pai.type === 'Property' && chave === 'key' && !pai.computed)) out.add(n.name); return; }
      for (const k of Object.keys(n)) {
        if (k === 'loc' || k === 'start' || k === 'end') continue;
        const v = n[k];
        if (Array.isArray(v)) v.forEach((x) => andar(x, n, k)); else if (v && typeof v.type === 'string') andar(v, n, k);
      }
    })(node, null, null);
    return out;
  }
  function declaradosNaHora(st) {
    // nomes que existem desde o início do <script> (function f(){} e var x) — é isso que quebra se partir errado
    const s = new Set();
    if (st.type === 'FunctionDeclaration' && st.id) s.add(st.id.name);
    if (st.type === 'VariableDeclaration' && st.kind === 'var') for (const d of st.declarations) for (const n of idsPadrao(d.id)) s.add(n);
    return s;
  }
  function idsPadrao(p) { if (!p) return []; if (p.type === 'Identifier') return [p.name]; if (p.type === 'ObjectPattern') return p.properties.flatMap((x) => idsPadrao(x.value || x.argument)); if (p.type === 'ArrayPattern') return p.elements.flatMap(idsPadrao); if (p.type === 'AssignmentPattern') return idsPadrao(p.left); if (p.type === 'RestElement') return idsPadrao(p.argument); return []; }
  function partirScript(code, maxLinhas) {
    let ast; try { ast = window.acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script', locations: true, allowReturnOutsideFunction: true, allowHashBang: true }); } catch (e) { return { erro: e.message }; }
    const corpo = ast.body; if (corpo.length < 2) return { inteiro: true, motivo: corpo.length === 1 && /Expression/.test(corpo[0].type) ? 'o código todo está dentro de uma "caixa" (function(){…})()' : 'só tem uma parte' };
    const estrito = corpo[0].directive === 'use strict';
    // o corpo de cada função (para saber o que ela usa quando é chamada na hora)
    const corpoDe = Object.create(null);
    for (const st of corpo) {
      if (st.type === 'FunctionDeclaration' && st.id) corpoDe[st.id.name] = idsDe(st.body, true);
      if (st.type === 'VariableDeclaration') for (const d of st.declarations) if (d.id.type === 'Identifier' && d.init && /Function/.test(d.init.type)) corpoDe[d.id.name] = idsDe(d.init.body, true);
    }
    const usaNaHora = (st) => { const vistos = new Set(), fila = [...idsDe(st, false)]; while (fila.length) { const n = fila.pop(); if (vistos.has(n)) continue; vistos.add(n); if (corpoDe[n]) for (const x of corpoDe[n]) if (!vistos.has(x)) fila.push(x); } return vistos; };
    // 1) pedaços por tamanho
    let grupos = [], atual = [], tam = 0;
    for (const st of corpo) { const l = st.loc.end.line - st.loc.start.line + 1; if (atual.length && tam + l > maxLinhas) { grupos.push(atual); atual = []; tam = 0; } atual.push(st); tam += l; }
    if (atual.length) grupos.push(atual);
    // 2) junta os pedaços onde partir quebraria (algo que roda na hora usa o que só vem depois)
    let mudou = true, juntadas = 0;
    while (mudou) {
      mudou = false;
      const decl = grupos.map((g) => { const s = new Set(); g.forEach((st) => declaradosNaHora(st).forEach((n) => s.add(n))); return s; });
      for (let i = 0; i < grupos.length && !mudou; i++) {
        const usa = new Set(); grupos[i].forEach((st) => usaNaHora(st).forEach((n) => usa.add(n)));
        for (let j = grupos.length - 1; j > i; j--) if ([...decl[j]].some((n) => usa.has(n))) { grupos.splice(i, j - i + 1, grupos.slice(i, j + 1).flat()); mudou = true; juntadas++; break; }
      }
    }
    if (grupos.length < 2) return { inteiro: true, motivo: 'as partes dependem umas das outras ao abrir — partir quebraria' };
    // 3) o texto de cada pedaço (com os comentários que estão entre eles)
    const partes = grupos.map((g, k) => {
      const ini = k === 0 ? 0 : g[0].start, fim = k === grupos.length - 1 ? code.length : grupos[k + 1][0].start;
      let txt = code.slice(ini, fim).replace(/^\s*\n/, '');
      if (estrito && k > 0) txt = "'use strict';\n" + txt;
      const f = g.find((st) => st.type === 'FunctionDeclaration' && st.id) || g.find((st) => st.type === 'VariableDeclaration' && st.declarations[0] && st.declarations[0].id.name) || g.find((st) => st.type === 'ClassDeclaration' && st.id);
      const nome = f ? (f.id ? f.id.name : f.declarations[0].id.name) : 'parte';
      return { txt, nome };
    });
    return { partes, juntadas };
  }

  // ── 1. ✂️ dividir sem quebrar ──
  async function dividir(htmlPath, maxLinhas) {
    const P = fs().project; const src = fs().read(htmlPath);
    if (src == null) throw new Error('Escolha o arquivo HTML.');
    try { await SK.cacabug.carregar(); } catch {}
    const dir = dirDe(htmlPath), novos = {}, rel = [];
    let nS = 0, nC = 0;
    const cssDir = juntarCaminho(dir, 'css'), jsDir = juntarCaminho(dir, 'js');
    let html = src.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (m, at, css) => {
      if (!css.trim()) return m;
      nC++; const nome = pad(nC) + '-estilo.css', p = cssDir + '/' + nome;
      novos[p] = moverCss(css.replace(/^\s*\n/, ''), dir, cssDir);
      const media = (at.match(/\bmedia\s*=\s*(["'][^"']*["'])/i) || [])[1];
      rel.push('🎨 ' + p + ' (' + linhas(css) + ' linhas)');
      return '<link rel="stylesheet" href="css/' + nome + '"' + (media ? ' media=' + media : '') + '>';
    });
    const avisos = [];
    html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (m, at, js) => {
      if (/\bsrc\s*=/i.test(at) || !js.trim()) return m;
      const tipo = ((at.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1] || '').toLowerCase();
      if (tipo && !/^(text\/javascript|application\/javascript|module)$/.test(tipo)) { avisos.push('Deixei dentro do HTML um <script type="' + tipo + '"> (' + (tipo.includes('babel') ? 'o Babel/React só lê de dentro, ou com servidor' : 'não é JavaScript comum') + ').'); return m; }
      if (/document\.currentScript|document\.write\s*\(/.test(js)) { avisos.push('Deixei dentro do HTML um script que usa document.write/currentScript (fora dele mudaria o comportamento).'); return m; }
      const modulo = tipo === 'module';
      const outros = at.replace(/\btype\s*=\s*["']?[^"'\s>]+["']?/i, '').replace(/\s+(async|defer)\b/gi, '').trim();
      const tag = (arq) => '<script' + (modulo ? ' type="module"' : '') + ' src="js/' + arq + '"' + (outros ? ' ' + outros : '') + '></script>';
      if (modulo) {
        nS++; const arq = pad(nS) + '-modulo.mjs';
        novos[jsDir + '/' + arq] = js.replace(/^\s*\n/, '').replace(/(\bfrom\s*|\bimport\s*\(?\s*)(['"])(\.\.?\/[^'"]+)\2/g, (x, a, q, u) => a + q + relativo('js', normalizar(u)) + q);
        rel.push('📦 ' + jsDir + '/' + arq + ' (módulo, ' + linhas(js) + ' linhas)');
        return tag(arq);
      }
      let pedacos = [{ txt: js.replace(/^\s*\n/, ''), nome: 'codigo' }];
      if (linhas(js) > maxLinhas && window.acorn) {
        const r = partirScript(js, maxLinhas);
        if (r.partes) { pedacos = r.partes; if (r.juntadas) avisos.push('Num script, ' + r.juntadas + ' divisão(ões) ficaram juntas de propósito: o que roda ao abrir usa o que vem depois.'); }
        else if (r.erro) avisos.push('Um script tem erro de escrita (' + r.erro + ') — ficou inteiro num arquivo só.');
        else avisos.push('Um script grande ficou inteiro: ' + r.motivo + '.');
      }
      return pedacos.map((pc) => { nS++; const arq = pad(nS) + '-' + nomeLimpo(pc.nome) + '.js'; novos[jsDir + '/' + arq] = pc.txt; rel.push('⚙️ ' + jsDir + '/' + arq + ' (' + linhas(pc.txt) + ' linhas)'); return tag(arq); }).join('\n');
    });
    if (!nS && !nC) throw new Error('Este HTML não tem <style> nem <script> dentro para dividir (talvez já seja modular).');
    // o projeto novo: tudo igual, só o HTML trocado + as pastas novas
    const files = {};
    for (const p of Object.keys(P.files)) files[p] = Object.assign({}, P.files[p]);
    files[htmlPath] = { text: html };
    for (const p of Object.keys(novos)) files[p] = { text: novos[p] };
    files['LEIA-MODULAR.md'] = { text: '# ' + P.name + ' — versão modular\n\nFeita pelo 🧩 Modularizar do Mini SK em ' + new Date().toLocaleString('pt-BR') + ', a partir de `' + htmlPath + '` do projeto "' + P.name + '" (o original não mudou).\n\n## Arquivos criados\n\n' + rel.map((x) => '- ' + x).join('\n') + (avisos.length ? '\n\n## Avisos\n\n' + avisos.map((x) => '- ' + x).join('\n') : '') + '\n\n## Para testar\n\nScripts comuns (.js) abrem até direto do arquivo. Módulos (.mjs) precisam de servidor: no 🧩 Modularizar → ▶ Testar no terminal.\n' };
    const original = P.name;
    const nomeNovo = original.replace(/ \(modular\)$/, '') + ' (modular)';
    try { const velho = await SK.db.get('projects', nomeNovo); if (velho) await SK.db.del('projects', nomeNovo); } catch {}
    await SK.fs.create(nomeNovo, files);
    ultimo = { original, modular: SK.fs.project.name, html: htmlPath, rel, avisos };
    SK.pref.set('modularizarUltimo', ultimo);
    return ultimo;
  }

  // ── montar a página com tudo dentro (usado no "juntar" e na conferência) ──
  function juntarHTML(files, htmlPath) {
    const ler = (p) => (files[p] && files[p].text != null ? files[p].text : null);
    const dir = dirDe(htmlPath); const faltou = []; let n = 0;
    let html = ler(htmlPath); if (html == null) throw new Error('Não achei ' + htmlPath);
    html = html.replace(/<link\b[^>]*rel\s*=\s*["']?stylesheet["']?[^>]*>/gi, (m) => {
      const h = (m.match(/\bhref\s*=\s*["']([^"']+)["']/i) || [])[1]; if (!h || externo(h)) return m;
      const p = juntarCaminho(dir, h.split(/[?#]/)[0]); const css = ler(p); if (css == null) { faltou.push(h); return m; }
      n++; const media = (m.match(/\bmedia\s*=\s*(["'][^"']*["'])/i) || [])[1];
      return '<style' + (media ? ' media=' + media : '') + '>\n' + moverCss(css, dirDe(p), dir) + '\n</style>';
    });
    html = html.replace(/<script\b([^>]*)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (m, a1, src, a2) => {
      if (externo(src)) return m;
      const p = juntarCaminho(dir, src.split(/[?#]/)[0]); let js = ler(p); if (js == null) { faltou.push(src); return m; }
      const at = (a1 + ' ' + a2).replace(/\s+(async|defer)\b/gi, '');
      if (/type\s*=\s*["']?module/i.test(at) && /(\bfrom\s*|\bimport\s*\(?\s*)['"]\.\.?\//.test(js)) return m; // módulo que importa outros arquivos: fica como está
      n++; js = js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\x21--');
      return '<script' + at.replace(/\s+/g, ' ').replace(/\s+$/, '') + '>\n' + js + '\n</script>';
    });
    return { html, n, faltou };
  }

  // ── 2. ✅ conferir rodando as duas versões escondidas ──
  function rodarEscondido(html, ms) {
    return new Promise((ok) => {
      const id = 'mz' + Math.random().toString(36).slice(2);
      const espia = '<script>(function(){var P=parent,I=' + JSON.stringify(id) + ',L=[];function m(t){L.push(String(t).slice(0,300))}' +
        'addEventListener("error",function(e){m((e.message||"Erro")+(e.lineno?" (linha "+e.lineno+")":""))},true);' +
        'addEventListener("unhandledrejection",function(e){m("Promise rejeitada: "+(e.reason&&e.reason.message||e.reason))});' +
        'var o=console.error;console.error=function(){m([].slice.call(arguments).join(" "));o&&o.apply(console,arguments)};' +
        'window.alert=window.confirm=window.prompt=function(){};' +
        'setTimeout(function(){var b=document.body;P.postMessage({mz:I,erros:L,texto:b?b.innerText.length:0,elementos:document.querySelectorAll("body *:not(script):not(style):not(link)").length},"*")},' + (ms || 2500) + ')})();<\/script>';
      const doc = /<head[^>]*>/i.test(html) ? html.replace(/<head([^>]*)>/i, (m) => m + espia) : espia + html;
      const f = document.createElement('iframe');
      f.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      f.style.cssText = 'position:fixed;left:-9999px;top:0;width:1024px;height:768px;opacity:0;pointer-events:none';
      let fim = false;
      const ouvir = (e) => { if (e.data && e.data.mz === id) { fim = true; window.removeEventListener('message', ouvir); f.remove(); ok(e.data); } };
      window.addEventListener('message', ouvir);
      setTimeout(() => { if (!fim) { window.removeEventListener('message', ouvir); f.remove(); ok({ erros: ['(a página não respondeu — travou ou demorou demais)'], texto: 0, elementos: 0, travou: true }); } }, (ms || 2500) + 4000);
      document.body.appendChild(f); f.srcdoc = doc;
    });
  }
  async function conferir() {
    const u = ultimo || SK.pref.get('modularizarUltimo', null);
    if (!u) throw new Error('Primeiro ✂️ divida um projeto.');
    const po = await SK.db.get('projects', u.original), pm = await SK.db.get('projects', u.modular);
    if (!po || !pm) throw new Error('Não achei os dois projetos ("' + u.original + '" e "' + u.modular + '").');
    if (SK.fs.project && SK.fs.project.name === u.modular) await SK.fs.saveNow();
    const pmAgora = SK.fs.project && SK.fs.project.name === u.modular ? SK.fs.project.files : pm.files;
    const a = await rodarEscondido(juntarHTML(po.files, u.html).html);
    const b = await rodarEscondido(juntarHTML(pmAgora, u.html).html);
    const novos = b.erros.filter((x) => !a.erros.includes(x));
    const telaIgual = Math.abs(a.elementos - b.elementos) <= Math.max(3, a.elementos * 0.05) && Math.abs(a.texto - b.texto) <= Math.max(20, a.texto * 0.05);
    return { a, b, novos, telaIgual, u };
  }

  // ── 3. ▶ testar no terminal ──
  async function testar() {
    const u = ultimo || SK.pref.get('modularizarUltimo', null);
    const nome = u ? u.modular : SK.fs.project && SK.fs.project.name;
    if (!nome) throw new Error('Abra um projeto.');
    if (!SK.fs.project || SK.fs.project.name !== nome) await SK.fs.open(nome);
    const pagina = u ? u.html : 'index.html';
    if (window.miniskPC) {
      SK.app.openSide('termux');
      SK.toast('▶ Ligando o servidor no 💻 terminal… a página abre numa janela nova em alguns segundos.');
      setTimeout(() => {
        SK.termux.mandar((window.miniskPC.so === 'win32' ? 'python -m http.server 5500' : 'python3 -m http.server 5500'));
        setTimeout(() => { window.open('http://127.0.0.1:5500/' + pagina, '_blank'); }, 2500);
      }, 2500);
      return 'pc';
    }
    SK.app.openSide('node');
    try { await SK.node.mandar('npx -y serve -l 5500 .'); }
    catch (e) { throw new Error('O ⚡ Node não ligou: ' + e.message); }
    SK.toast('▶ O ⚡ Node está ligando o servidor. Quando ligar, a tela aparece embaixo do terminal.');
    return 'node';
  }

  // ── 4. 🧷 juntar de volta ──
  async function juntarDeVolta() {
    const P = SK.fs.project; if (!P) throw new Error('Abra um projeto.');
    const u = ultimo || SK.pref.get('modularizarUltimo', null);
    const pagina = (u && u.modular === P.name && u.html) || SK.$('#mz-html', box).value || 'index.html';
    const r = juntarHTML(P.files, pagina);
    const nome = (P.name.replace(/ \(modular\)$/, '') || 'projeto').replace(/[^\w.-]+/g, '-') + '-UNICO.html';
    SK.fs.write(nome, r.html);
    return { nome, n: r.n, faltou: r.faltou };
  }

  // ── painel ──
  function opcoesHtml() {
    const sel = box && SK.$('#mz-html', box); if (!sel) return;
    const lista = fs().project ? fs().list().filter((p) => /\.html?$/i.test(p) && !/(^|\/)(node_modules|dist)\//.test(p) && !/-UNICO\.html$/i.test(p)) : [];
    const atual = sel.value;
    sel.innerHTML = lista.length ? lista.map((p) => { const t = fs().read(p) || ''; return '<option value="' + E(p) + '">' + E(p) + ' · ' + linhas(t) + ' linhas</option>'; }).join('') : '<option value="">(este projeto não tem HTML)</option>';
    if (lista.includes(atual)) sel.value = atual; else { const i = lista.find((p) => /(^|\/)index\.html$/i.test(p)); if (i) sel.value = i; }
    const u = ultimo || SK.pref.get('modularizarUltimo', null);
    const el = SK.$('#mz-par', box);
    if (el) el.innerHTML = u ? '🧩 Último par: <b>' + E(u.original) + '</b> (simples) → <b>' + E(u.modular) + '</b> (modular)' : '';
  }
  const st = (id, h) => { const el = box && SK.$(id, box); if (el) el.innerHTML = h; };
  function build(container) {
    box = container;
    box.innerHTML =
      '<p class="muted small">Divide um HTML grande em módulos <b>sem quebrar</b>, confere sozinho, testa num servidor e junta de volta. O projeto original <b>nunca muda</b>: a versão modular é um projeto novo ao lado.</p>' +
      '<div id="mz-par" class="small" style="margin:4px 0"></div>' +
      '<h3 style="font-size:1rem;margin:10px 0 4px">1. ✂️ Dividir sem quebrar</h3>' +
      '<div class="row wrap"><select class="input" id="mz-html" style="flex:1;min-width:0"></select></div>' +
      '<label class="small">Partir scripts com mais de <input type="number" id="mz-max" value="300" min="60" step="20" style="width:5em"> linhas (só onde é seguro)</label>' +
      '<div class="row wrap" style="margin-top:6px"><button class="btn primary" id="mz-dividir">✂️ Dividir em módulos</button></div><div id="mz-s1" class="small" style="margin:6px 0"></div>' +
      '<h3 style="font-size:1rem;margin:10px 0 4px">2. ✅ Conferir sozinho</h3>' +
      '<div class="row wrap"><button class="btn primary" id="mz-conferir">✅ Rodar as duas e comparar</button><button class="btn" id="mz-cacabug">🔬 Comparar no Caça-Bug</button></div><div id="mz-s2" class="small" style="margin:6px 0"></div>' +
      '<h3 style="font-size:1rem;margin:10px 0 4px">3. ▶ Testar num servidor</h3>' +
      '<p class="muted small">' + (window.miniskPC ? 'Liga <code>python -m http.server</code> no 💻 terminal do computador e abre a página.' : 'Liga <code>npx serve</code> no ⚡ Node (precisa do lacre) e mostra a tela embaixo do terminal.') + ' É o "precisa de servidor" que a Triagem fala — módulos (.mjs) só abrem assim.</p>' +
      '<div class="row wrap"><button class="btn" id="mz-testar">▶ Testar no ' + (window.miniskPC ? '💻 terminal' : '⚡ Node') + '</button></div><div id="mz-s3" class="small" style="margin:6px 0"></div>' +
      '<h3 style="font-size:1rem;margin:10px 0 4px">4. 🧷 Juntar de volta</h3>' +
      '<p class="muted small">Cria <code>NOME-UNICO.html</code> com tudo dentro (abre em qualquer lugar, até sem servidor).</p>' +
      '<div class="row wrap"><button class="btn" id="mz-juntar">🧷 Juntar num arquivo só</button></div><div id="mz-s4" class="small" style="margin:6px 0"></div>';
    const rodar = (id, fn) => async () => { try { await fn(); } catch (e) { st(id, '⚠ ' + E(e.message)); } };
    SK.$('#mz-dividir', box).onclick = rodar('#mz-s1', async () => {
      const h = SK.$('#mz-html', box).value; if (!h) throw new Error('Escolha o HTML.');
      st('#mz-s1', '✂️ Dividindo…');
      const r = await dividir(h, Math.max(60, +SK.$('#mz-max', box).value || 300));
      st('#mz-s1', '✅ Criei o projeto <b>' + E(r.modular) + '</b> (já está aberto) com ' + r.rel.length + ' arquivo(s):<br>' + r.rel.slice(0, 30).map(E).join('<br>') + (r.rel.length > 30 ? '<br>…' : '') +
        (r.avisos.length ? '<div style="margin-top:6px">⚠ ' + r.avisos.map(E).join('<br>⚠ ') + '</div>' : '') + '<div style="margin-top:6px">Agora: <b>2. ✅ Rodar as duas e comparar</b>.</div>');
      opcoesHtml();
    });
    SK.$('#mz-conferir', box).onclick = rodar('#mz-s2', async () => {
      st('#mz-s2', '✅ Rodando a simples e a modular escondidas (uns segundos)…');
      const r = await conferir();
      const lista = (xs) => xs.length ? xs.slice(0, 8).map((x) => '<code>' + E(x) + '</code>').join('<br>') : '';
      st('#mz-s2', (r.novos.length ? '❌ <b>A modular tem ' + r.novos.length + ' erro(s) que a simples não tem:</b><br>' + lista(r.novos) + '<br><button class="btn small primary" id="mz-ia">🤖 Pedir conserto à IA</button>'
        : '✅ <b>A modular não tem nenhum erro novo</b>' + (r.a.erros.length ? ' (as duas têm os mesmos ' + r.a.erros.length + ' erro(s) de antes)' : '') + '.') +
        '<br>' + (r.telaIgual ? '🖥 A tela ficou igual (' + r.b.elementos + ' elementos).' : '🖥 <b>A tela ficou diferente</b>: simples ' + r.a.elementos + ' elementos / ' + r.a.texto + ' letras · modular ' + r.b.elementos + ' / ' + r.b.texto + '.') +
        '<br><span class="muted">Para ver as funções e o código lado a lado: 🔬 Comparar no Caça-Bug.</span>');
      const ia = SK.$('#mz-ia', box);
      if (ia) ia.onclick = () => { SK.app.openSide('ai'); setTimeout(() => { const inp = document.getElementById('ai-in'); if (inp) { inp.value = 'Dividi o meu projeto "' + r.u.original + '" em módulos ("' + r.u.modular + '"). A versão simples funciona; a modular dá estes erros que a simples não dá:\n\n' + r.novos.join('\n') + '\n\nArquivos da modular: ' + r.u.rel.join(', ') + '\n\nMe diga o que quebrou e me devolva os arquivos INTEIROS consertados.'; inp.dispatchEvent(new Event('input')); } }, 150); };
    });
    SK.$('#mz-cacabug', box).onclick = rodar('#mz-s2', async () => {
      const u = ultimo || SK.pref.get('modularizarUltimo', null); if (!u) throw new Error('Primeiro ✂️ divida um projeto.');
      if (!SK.fs.project || SK.fs.project.name !== u.modular) await SK.fs.open(u.modular);
      await SK.cacabug.compararCom(u.original);
    });
    SK.$('#mz-testar', box).onclick = rodar('#mz-s3', async () => { const r = await testar(); st('#mz-s3', r === 'pc' ? '▶ Mandei <code>python -m http.server 5500</code> para o 💻 terminal. A página abre em <b>http://127.0.0.1:5500</b>. Para parar: Ctrl+C no terminal.' : '▶ Mandei <code>npx serve</code> para o ⚡ Node. Quando ligar, a tela aparece embaixo do terminal.'); });
    SK.$('#mz-juntar', box).onclick = rodar('#mz-s4', async () => { const r = await juntarDeVolta(); st('#mz-s4', '✅ Criei <b>' + E(r.nome) + '</b> na árvore, com ' + r.n + ' arquivo(s) dentro.' + (r.faltou.length ? '<br>⚠ Não achei: ' + r.faltou.map(E).join(', ') : '') + ' <button class="btn small" id="mz-baixar">⤓ Baixar</button>'); SK.$('#mz-baixar', box).onclick = () => SK.download(r.nome, SK.fs.read(r.nome), 'text/html;charset=utf-8'); });
    opcoesHtml();
  }
  SK.on('project-open', () => opcoesHtml());
  SK.on('fs-change', (e) => { if (!e || e.type === 'import' || /\.html?$/i.test(e.path || '')) opcoesHtml(); });
  SK.modularizar = { build, dividir, conferir, testar, juntarDeVolta, juntarHTML, partirScript, aoAbrir: opcoesHtml };
})(window.SK);
