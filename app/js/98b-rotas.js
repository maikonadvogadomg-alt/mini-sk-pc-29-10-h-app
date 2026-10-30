/* =========================================================================
   Mini SK — 98b-rotas.js  ·  🧭 Mapa de Rotas (tela × servidor × manual)
   Para o "Failed to fetch" / "não encontrado" / tela azul:
     1. Acha as CHAMADAS que a tela faz (/api/...), as ROTAS que o servidor
        tem e as rotas que o MANUAL/plano diz (arquivos .md ou texto colado).
     2. Compara e mostra: ✅ existe · ⚠️ nome parecido (ex.: /api/template x
        /api/templates) · ❌ não existe em lugar nenhum · 📘 só no manual.
     3. Conserta, como TESTE (sempre cria um 📸 ponto de volta antes):
        ✏️ troca o nome errado na tela pelo nome certo;
        🧩 cria o "plano B" (plano-b.js): quando o servidor não responde,
           a própria página responde — salva no aparelho e fala com a IA.
   ========================================================================= */
(function (SK) {
  'use strict';
  const fs = () => SK.fs;
  const E = (s) => SK.esc(String(s == null ? '' : s));
  const METODOS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  // ── normalizar e comparar caminhos ──
  const semQuery = (p) => String(p || '').split('?')[0].split('#')[0];
  const comParams = (p) => semQuery(p).replace(/\$\{[^}]*\}/g, ':p').replace(/\/:[\w]+/g, '/:p').replace(/\/\{[\w]+\}/g, '/:p').replace(/\/\[[\w.]+\]/g, '/:p').replace(/\/+$/, '') || '/';
  const chave = (p) => comParams(p).toLowerCase().split('/').map((s) => s === ':p' ? s : s.replace(/[-_]/g, '').replace(/(ies)$/, 'y').replace(/s$/, '')).join('/');
  function casa(a, b) { // a = caminho com :p ; b = caminho com :p
    const x = a.split('/'), y = b.split('/'); if (x.length !== y.length) return false;
    return x.every((s, i) => s === y[i] || s === ':p' || y[i] === ':p');
  }
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 4) return 9;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }

  // ── o método (GET/POST…) de uma chamada, olhando em volta dela ──
  function metodoDe(texto, linha, bruto) {
    const ls = texto.split('\n'); const l = ls[linha - 1] || '';
    const i = Math.max(0, l.indexOf(bruto));
    const antes = l.slice(Math.max(0, i - 80), i);                                   // apiRequest("POST", "/api/x"
    let depois = l.slice(i + bruto.length) + '\n' + ls.slice(linha, linha + 4).join('\n');
    const corte = depois.search(/\b(fetch|apiRequest|axios(\.\w+)?|useQuery|queryKey)\s*[(:]/); if (corte > 0) depois = depois.slice(0, corte);
    let m = /apiRequest\(\s*['"`](GET|POST|PUT|PATCH|DELETE)['"`]\s*,\s*['"`]?$/i.exec(antes) || /axios\.(get|post|put|patch|delete)\(\s*['"`]?$/i.exec(antes) || /method\s*:\s*['"`](GET|POST|PUT|PATCH|DELETE)['"`]/i.exec(depois);
    return m ? m[1].toUpperCase() : 'GET';
  }

  // ── o manual / plano ──
  function rotasDoManual(colado) {
    const out = []; const fontes = [];
    for (const p of fs().list()) if (/\.(md|txt|markdown)$/i.test(p) && !/(^|\/)(node_modules|\.sk|dist|build)\//.test(p) && !/CHANGELOG|LICENSE/i.test(p)) fontes.push([p, fs().read(p) || '']);
    if (colado && colado.trim()) fontes.push(['(texto colado)', colado]);
    for (const [arq, t] of fontes) {
      if (t.length > 3e6) continue;
      const linhas = t.split('\n');
      linhas.forEach((l, i) => {
        let m; const re = /\b(GET|POST|PUT|PATCH|DELETE)\b[\s`*|:]*((?:https?:\/\/[^\s/`]+)?\/[\w\-/:{}.[\]]+)/g;
        let achou = false;
        while ((m = re.exec(l))) { achou = true; out.push({ method: m[1].toUpperCase(), path: m[2].replace(/^https?:\/\/[^/]+/, '').replace(/[.,;:)]+$/, ''), arq, linha: i + 1 }); }
        if (!achou) { const re2 = /`(\/api\/[\w\-/:{}.[\]]*)`/g; while ((m = re2.exec(l))) out.push({ method: 'ANY', path: m[1], arq, linha: i + 1 }); }
      });
    }
    return out;
  }

  // ── juntar tudo ──
  function mapear(colado) {
    if (!fs().project) throw new Error('Abra um projeto primeiro.');
    const A = SK.api.analyze();
    const prefixo = A.mounts.includes('/api') ? '/api' : '';
    const servidor = A.routes.map((r) => ({ method: r.method, path: (!r.path.startsWith('/api') && prefixo && r.src !== 'Next.js') ? prefixo + r.path : r.path, file: r.file, line: r.line }));
    // montagens: app.use('/api/x', rotas) + router.get('/y') → /api/x/y
    // só para rotas "soltas" (router.get('/x')) — as que já começam com /api não ganham prefixo de novo
    for (const r of A.routes) if (!r.path.startsWith('/api')) for (const mt of A.mounts) if (mt && mt !== '/api' && !r.path.startsWith(mt)) servidor.push({ method: r.method, path: mt + (r.path === '/' ? '' : r.path), file: r.file, line: r.line, montada: true });
    const manual = rotasDoManual(colado);
    // chamadas da tela (sem repetir)
    const vistos = new Map();
    // todas as chamadas, uma por uma (o testador junta as repetidas do mesmo arquivo e perde o método)
    const chamadasTodas = [];
    const frente = fs().list().filter((p) => /\.(m?[jt]sx?|cjs|html?|vue|svelte)$/.test(p) && !/(^|\/)(node_modules|dist|build|android|\.sk)\//.test(p) && !/(^|\/)(server|api-server|backend)\//.test(p) && !/(^|\/)plano-b\.js$/.test(p));
    for (const p of frente) {
      const t = fs().read(p); if (!t || t.length > 3e6) continue;
      const re = /(['"`])((?:\$\{[^}`]*\})?\/(?:api|auth)\/[^'"`\s]*)\1/g; let m;
      while ((m = re.exec(t))) {
        const raw = m[2]; let n = 1; for (let i = 0; i < m.index; i++) if (t.charCodeAt(i) === 10) n++;
        chamadasTodas.push({ path: raw.replace(/^\$\{[^}]*\}/, ''), raw, file: p, line: n });
      }
    }
    for (const c of (chamadasTodas.length ? chamadasTodas : A.calls)) {
      const t = fs().read(c.file) || '';
      const ln = (t.split('\n')[c.line - 1] || '');
      // \`\${API}/auth/x\` com API = "/api" → /api/auth/x
      if (/^\$\{/.test(c.raw) && !/^\/api\//.test(c.path) && /\b(API|API_URL|API_BASE|BASE_URL|apiBase)\s*=\s*['"`][^'"`]*\/api['"`]/.test(t)) c.path = '/api' + c.path;
      if (c.path === '/api' || c.path === '/api/') continue;
      if (!/^\/api\//.test(c.path) && !/^\/(auth|trpc|graphql)\b/.test(c.path)) continue;
      // lista/tabela de rotas (ex.: { method: "GET", path: "/api/x", desc: … }) não é chamada de verdade
      if (/\b(path|rota|route|endpoint|url)\s*:\s*['"`]\/api/.test(ln) && !/\b(fetch|apiRequest|axios|useQuery|queryKey)\b/.test(ln)) continue;
      const method = metodoDe(t, c.line, c.raw);
      const k = method + ' ' + comParams(c.path);
      if (!vistos.has(k)) vistos.set(k, { method, path: comParams(c.path), bruto: c.raw, onde: [] });
      vistos.get(k).onde.push({ file: c.file, line: c.line, raw: c.raw });
    }
    const chamadas = [...vistos.values()];
    const srvP = servidor.map((r) => Object.assign({}, r, { cp: comParams(r.path), k: chave(r.path) }));
    const manP = manual.map((r) => Object.assign({}, r, { cp: comParams(r.path), k: chave(r.path) }));
    const metodoOk = (a, b) => a === 'ANY' || b === 'ANY' || b === 'ALL' || a === b;
    for (const c of chamadas) {
      const s = srvP.find((r) => metodoOk(r.method, c.method) && casa(r.cp, c.path));
      const n = manP.find((r) => metodoOk(r.method, c.method) && casa(r.cp, c.path));
      c.noManual = n || null;
      if (s) { c.status = 'ok'; c.servidor = s; continue; }
      const k = chave(c.path);
      const prefixo = (r) => { const x = r.cp.split('/'), y = c.path.split('/'); return x.length === y.length && x.every((s, i) => s === y[i] || ((s.startsWith(y[i] + '-') || y[i].startsWith(s + '-')) && i === x.length - 1 - [...x].reverse().findIndex((z) => z !== ':p'))); };
      const parecido = srvP.find((r) => r.k === k && r.cp !== c.path) || srvP.find((r) => r.cp !== c.path && prefixo(r)) || srvP.find((r) => r.cp !== c.path && lev(r.cp.toLowerCase(), c.path.toLowerCase()) <= 2 && r.cp.split('/').length === c.path.split('/').length);
      const soMetodo = srvP.find((r) => casa(r.cp, c.path));
      if (soMetodo) { c.status = 'metodo'; c.servidor = soMetodo; continue; }
      if (parecido) { c.status = 'parecido'; c.sugestao = parecido.cp; c.de = 'servidor'; c.servidor = parecido; continue; }
      const pm = !n && (manP.find((r) => r.k === k && r.cp !== c.path) || manP.find((r) => r.cp !== c.path && lev(r.cp.toLowerCase(), c.path.toLowerCase()) <= 2 && r.cp.split('/').length === c.path.split('/').length));
      if (pm) { c.status = 'parecido'; c.sugestao = pm.cp; c.de = 'manual'; c.manualRef = pm; continue; }
      c.status = n ? 'manual' : 'falta';
    }
    const soManual = manP.filter((r) => !chamadas.some((c) => casa(r.cp, c.path)) && !srvP.some((s) => casa(s.cp, r.cp)));
    const naoUsadas = srvP.filter((r) => !r.montada && !chamadas.some((c) => casa(r.cp, c.path)));
    return { chamadas, servidor: srvP, manual: manP, soManual: unicos(soManual), naoUsadas: unicos(naoUsadas), temServidor: srvP.length > 0 };
  }
  const unicos = (l) => { const v = new Set(); return l.filter((r) => { const k = r.method + r.cp; if (v.has(k)) return false; v.add(k); return true; }); };

  // ── ✏️ trocar o nome errado na tela ──
  async function trocarNome(c) {
    await SK.checkpoints?.auto('Antes de trocar ' + c.path + ' → ' + c.sugestao);
    let n = 0;
    const velho = c.path.replace(/:p/g, ''), novo = c.sugestao;
    for (const o of c.onde) {
      const t = fs().read(o.file); if (t == null) continue;
      const ls = t.split('\n'); const i = o.line - 1; if (!ls[i]) continue;
      // troca só o pedaço fixo do caminho (o que vem antes do primeiro ${…} ou :param)
      const fixoVelho = o.raw.split(/\$\{|\/:|\?/)[0], fixoNovo = novo.split(/\/:p|\?/)[0];
      const alvoVelho = fixoVelho.replace(/\/$/, ''), alvoNovo = fixoNovo.replace(/\/$/, '');
      if (!alvoVelho || alvoVelho === alvoNovo || !ls[i].includes(alvoVelho)) continue;
      ls[i] = ls[i].split(alvoVelho).join(alvoNovo); n++;
      fs().write(o.file, ls.join('\n'));
    }
    return n ? '✏️ Troquei ' + E(velho) + ' por ' + E(novo) + ' em ' + n + ' lugar(es). (📸 dá para voltar em Checkpoints)' : '⚠ Não consegui trocar sozinho (o caminho está montado de um jeito diferente). Use 🤖 Perguntar à IA.';
  }

  // ── 🧩 plano B ──
  function planoB(rotas, opcoes) {
    const lista = JSON.stringify(rotas.map((r) => ({ m: r.method, p: r.path })));
    return `/* 🧩 PLANO B — feito pelo Mini SK (🧭 Mapa de Rotas).
   Quando o SERVIDOR não responde (Failed to fetch, 404, erro 500), a própria
   página responde estas rotas: guarda no aparelho (IndexedDB) e, nas rotas de
   conversa, fala direto com a IA (Gemini) usando a SUA chave, guardada só aqui.
   Para desligar: apague a linha <script src="plano-b.js"> do index.html. */
(function () {
  'use strict';
  var ROTAS = ${lista};
  var SERVIDOR_PRIMEIRO = ${opcoes.servidorPrimeiro ? 'true' : 'false'};
  var IA = /(chat|conversa|mensag|ia|ai|gemini|openai|gpt|perguntar|ask|complet|gerar|generat|resum|analis)/i;
  var original = window.fetch.bind(window);
  function rx(p) { return new RegExp('^' + p.replace(/[.+?^$|()\\\\]/g, '\\\\$&').replace(/\\/:p/g, '/([^/]+)') + '/?$'); }
  ROTAS.forEach(function (r) { r.re = rx(r.p); });
  function achar(m, caminho) { for (var i = 0; i < ROTAS.length; i++) { var r = ROTAS[i]; if ((r.m === m || r.m === 'ANY') && r.re.test(caminho)) return r; } return null; }
  // gaveta grande do aparelho
  var bancoP = null;
  function banco() { return bancoP || (bancoP = new Promise(function (ok, erro) { var q = indexedDB.open('plano-b', 1); q.onupgradeneeded = function () { q.result.createObjectStore('dados'); }; q.onsuccess = function () { ok(q.result); }; q.onerror = function () { erro(q.error); }; })); }
  function ler(k) { return banco().then(function (db) { return new Promise(function (ok) { var t = db.transaction('dados').objectStore('dados').get(k); t.onsuccess = function () { ok(t.result); }; t.onerror = function () { ok(undefined); }; }); }); }
  function gravar(k, v) { return banco().then(function (db) { return new Promise(function (ok, erro) { var tx = db.transaction('dados', 'readwrite'); tx.objectStore('dados').put(v, k); tx.oncomplete = function () { ok(); }; tx.onerror = function () { erro(tx.error); }; }); }); }
  function json(obj, status) { return new Response(obj === undefined ? null : JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json', 'X-Plano-B': '1' } }); }
  function colecao(caminho) { return caminho.replace(/^\\/api\\//, '').split('/').filter(function (s) { return s && !/^\\d+$/.test(s) && !/^[0-9a-f-]{16,}$/i.test(s); })[0] || 'geral'; }
  function idDe(caminho) { var s = caminho.split('/').filter(Boolean); var u = s[s.length - 1]; return (s.length > 2 && u !== colecao(caminho)) ? u : null; }
  function chaveIA() {
    var k = ''; try { k = localStorage.getItem('planoB:chaveGemini') || ''; } catch (e) {}
    if (!k) { k = (window.prompt('🧩 Plano B: o servidor não respondeu. Cole sua chave do Gemini (começa com AIza) para a IA responder direto daqui. Ela fica guardada só neste aparelho.') || '').trim(); if (k) try { localStorage.setItem('planoB:chaveGemini', k); } catch (e) {} }
    return k;
  }
  function textoDoPedido(b) {
    if (!b) return '';
    if (typeof b === 'string') return b;
    var msgs = b.messages || b.history || b.historico || b.mensagens;
    if (Array.isArray(msgs) && msgs.length) return msgs.map(function (m) { return (m.role ? m.role + ': ' : '') + (m.content || m.text || m.texto || ''); }).join('\\n');
    return b.message || b.mensagem || b.prompt || b.pergunta || b.text || b.texto || b.content || b.input || b.query || JSON.stringify(b);
  }
  function perguntarIA(corpo) {
    var k = chaveIA(); if (!k) return Promise.resolve(json({ error: 'Sem chave do Gemini: o servidor não respondeu e o plano B precisa da sua chave.' }, 503));
    var pedido = textoDoPedido(corpo);
    return original('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(k), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: pedido }] }] }) })
      .then(function (r) { return r.json(); }).then(function (j) {
        if (j.error) return json({ error: 'IA: ' + j.error.message }, 502);
        var t = ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(function (p) { return p.text || ''; }).join('');
        return json({ reply: t, response: t, resposta: t, content: t, text: t, message: t, answer: t, choices: [{ message: { role: 'assistant', content: t } }] });
      });
  }
  function local(r, m, url, corpo) {
    var caminho = url.pathname;
    if (IA.test(caminho) && m === 'POST') return perguntarIA(corpo);
    var col = 'col:' + colecao(caminho), id = idDe(caminho);
    return ler(col).then(function (lista) {
      lista = Array.isArray(lista) ? lista : [];
      var acha = function (x) { return String(x.id) === String(id); };
      if (m === 'GET') return id ? (lista.find(acha) ? json(lista.find(acha)) : json({ error: 'não achei' }, 404)) : json(lista);
      if (m === 'POST') { var novo = Object.assign({ id: Date.now() }, corpo && typeof corpo === 'object' ? corpo : { valor: corpo }, { createdAt: new Date().toISOString() }); lista.push(novo); return gravar(col, lista).then(function () { return json(novo, 201); }); }
      if (m === 'PUT' || m === 'PATCH') { var i = lista.findIndex(acha); if (i < 0 && !id) { return gravar(col, corpo).then(function () { return json(corpo); }); } if (i < 0) return json({ error: 'não achei' }, 404); lista[i] = Object.assign({}, m === 'PATCH' ? lista[i] : { id: lista[i].id }, corpo, { updatedAt: new Date().toISOString() }); return gravar(col, lista).then(function () { return json(lista[i]); }); }
      if (m === 'DELETE') { var antes = lista.length; lista = id ? lista.filter(function (x) { return !acha(x); }) : []; return gravar(col, lista).then(function () { return json({ ok: true, apagados: antes - lista.length }); }); }
      return json({ error: 'método não suportado no plano B' }, 405);
    });
  }
  window.fetch = function (entrada, init) {
    var url, m;
    try { url = new URL(typeof entrada === 'string' ? entrada : (entrada && entrada.url) || String(entrada), location.href); m = String((init && init.method) || (entrada && entrada.method) || 'GET').toUpperCase(); } catch (e) { return original(entrada, init); }
    var r = url.origin === location.origin ? achar(m, url.pathname.replace(/\\/+$/, '') || '/') : null;
    if (!r) return original(entrada, init);
    var corpo = null; try { corpo = init && init.body ? (typeof init.body === 'string' ? JSON.parse(init.body) : init.body) : null; } catch (e) { corpo = init.body; }
    var naoServidor = function () { console.info('🧩 plano B respondeu', m, url.pathname); return local(r, m, url, corpo); };
    if (!SERVIDOR_PRIMEIRO) return naoServidor();
    return original(entrada, init).then(function (resp) { return (resp.status === 404 || resp.status === 405 || resp.status >= 500 || /text\\/html/.test(resp.headers.get('content-type') || '') && m !== 'GET' ) ? naoServidor() : resp; }, naoServidor);
  };
  window.__planoB = { rotas: ROTAS, local: local };
})();
`;
  }
  function instalarPlanoB(rotas, opcoes) {
    const idxs = fs().list().filter((p) => /(^|\/)index\.html?$/i.test(p) && !/(^|\/)(node_modules|dist|build|\.sk|android|www|app\/www)\//.test(p));
    if (!idxs.length) throw new Error('Não achei o index.html do projeto.');
    const vite = fs().list().some((p) => /(^|\/)vite\.config\.[cm]?[jt]s$/.test(p));
    const feitos = [];
    for (const idx of idxs) {
      const dir = fs().dirName ? fs().dirName(idx) : idx.replace(/\/?[^/]*$/, '');
      const pastaArq = vite ? (dir ? dir + '/public' : 'public') : dir;
      const arq = (pastaArq ? pastaArq + '/' : '') + 'plano-b.js';
      fs().write(arq, planoB(rotas, opcoes));
      let h = fs().read(idx) || '';
      if (!/plano-b\.js/.test(h)) {
        const tag = '<script src="plano-b.js"></script><!-- 🧩 plano B (Mini SK) -->';
        h = /<meta[^>]+charset[^>]*>/i.test(h) ? h.replace(/<meta[^>]+charset[^>]*>/i, (m) => m + '\n    ' + tag) : /<head[^>]*>/i.test(h) ? h.replace(/<head[^>]*>/i, (m) => m + '\n    ' + tag) : tag + '\n' + h;
        fs().write(idx, h);
      }
      feitos.push(arq);
    }
    return feitos;
  }

  // ── tela ──
  let box, ultimo = null;
  function build(el) {
    box = el;
    el.innerHTML =
      '<p class="small muted">Compara o que a <b>tela</b> pede (/api/...), o que o <b>servidor</b> tem e o que o <b>manual</b> diz. É aí que nascem o "Failed to fetch", o "não encontrado" e a tela azul. Os consertos são um <b>teste</b>: antes, faço um 📸 ponto de volta.</p>' +
      '<details><summary class="small">📘 Colar o plano / manual (opcional — os .md do projeto eu já leio sozinho)</summary><textarea class="inp" id="ro-manual" rows="5" placeholder="Cole aqui o trecho do manual que lista as rotas (ex.: GET /api/templates, POST /api/chat …)"></textarea></details>' +
      '<div class="row wrap" style="margin-top:8px"><button class="btn primary" id="ro-mapear">🧭 Mapear as rotas</button></div>' +
      '<div id="ro-st" class="small" style="margin:8px 0"></div><div id="ro-res"></div>';
    SK.$('#ro-mapear', el).onclick = mostrar;
  }
  function aoAbrir() { if (box && fs().project && !ultimo) mostrar(); }
  function mostrar() {
    const $ = (s) => SK.$(s, box);
    try { ultimo = mapear($('#ro-manual').value); } catch (e) { $('#ro-st').innerHTML = '❌ ' + E(e.message); return; }
    const r = ultimo, cs = r.chamadas;
    const n = (s) => cs.filter((c) => c.status === s).length;
    const linha = (c, i) => {
      const onde = c.onde.slice(0, 3).map((o) => '<a href="#" data-abrir="' + E(o.file) + '" data-linha="' + o.line + '">' + E(o.file.split('/').pop()) + ':' + o.line + '</a>').join(', ') + (c.onde.length > 3 ? ' +' + (c.onde.length - 3) : '');
      const st = { ok: '✅', parecido: '⚠️', falta: '❌', manual: '📘', metodo: '⚠️' }[c.status];
      const extra = c.status === 'ok' ? '<span class="muted">servidor: ' + E(c.servidor.file.split('/').pop()) + '</span>'
        : c.status === 'parecido' ? 'o ' + (c.de === 'servidor' ? 'servidor' : 'manual') + ' chama de <code>' + E(c.sugestao) + '</code> <button class="btn tiny" data-trocar="' + i + '">✏️ Trocar na tela</button>'
        : c.status === 'manual' ? 'o manual prevê, mas o servidor não tem'
        : c.status === 'metodo' ? 'o servidor tem esse caminho, mas com <b>' + E(c.servidor.method) + '</b> (a tela usa ' + c.method + ')'
        : 'não existe no servidor' + (r.manual.length ? ' nem no manual' : '');
      return '<li>' + st + ' <b>' + c.method + '</b> <code>' + E(c.path) + '</code><br><span class="small">' + extra + '</span><br><span class="small muted">na tela: ' + onde + '</span></li>';
    };
    const faltando = cs.filter((c) => c.status !== 'ok');
    $('#ro-res').innerHTML =
      '<p><b>' + cs.length + '</b> rota(s) que a tela usa · ✅ ' + n('ok') + ' · ⚠️ ' + n('parecido') + ' · ❌ ' + n('falta') + ' · 📘 ' + n('manual') + (n('metodo') ? ' · ⚠️ método: ' + n('metodo') : '') + '<br><span class="small muted">Servidor: ' + (r.temServidor ? r.servidor.length + ' rota(s) achadas' : '<b>não achei servidor</b> no projeto') + ' · Manual: ' + r.manual.length + ' rota(s)</span></p>' +
      (cs.length ? '<ol class="small" style="padding-left:18px">' + cs.map((c, i) => [c, i]).sort((a, b) => ['falta', 'parecido', 'metodo', 'manual', 'ok'].indexOf(a[0].status) - ['falta', 'parecido', 'metodo', 'manual', 'ok'].indexOf(b[0].status)).map(([c, i]) => linha(c, i)).join('') + '</ol>' : '<p class="small">Não achei chamadas /api/ na tela.</p>') +
      (r.soManual.length ? '<details><summary class="small">📘 ' + r.soManual.length + ' rota(s) que só o manual cita (ninguém usa nem fez)</summary><ul class="small">' + r.soManual.map((m) => '<li><b>' + m.method + '</b> <code>' + E(m.cp) + '</code> <span class="muted">(' + E(m.arq) + ':' + m.linha + ')</span></li>').join('') + '</ul></details>' : '') +
      (r.naoUsadas.length ? '<details><summary class="small">🖥 ' + r.naoUsadas.length + ' rota(s) do servidor que a tela não usa</summary><ul class="small">' + r.naoUsadas.map((m) => '<li><b>' + m.method + '</b> <code>' + E(m.cp) + '</code></li>').join('') + '</ul></details>' : '') +
      '<h3 style="font-size:1rem;margin:12px 0 4px">🧩 Plano B (teste)</h3>' +
      '<p class="small">Cria o <code>plano-b.js</code> e liga no index.html. Quando o servidor não responder, a página responde sozinha: <b>guarda no aparelho</b> e, nas rotas de conversa, <b>fala com o Gemini</b> com a sua chave (pede uma vez e guarda só no aparelho).</p>' +
      '<label class="small"><input type="radio" name="ro-quais" value="faltando" checked> Só as ' + faltando.length + ' que faltam/estão erradas</label><br>' +
      '<label class="small"><input type="radio" name="ro-quais" value="todas"> Todas as ' + cs.length + ' (o app funciona até sem servidor: APK, PWA, abrir pelo index)</label><br>' +
      '<label class="small"><input type="checkbox" id="ro-srv" checked> Tentar o servidor primeiro (se ele responder, usa ele)</label>' +
      '<div class="row wrap" style="margin-top:6px"><button class="btn primary" id="ro-planob"' + (cs.length ? '' : ' disabled') + '>🧩 Criar o plano B</button><button class="btn" id="ro-md">📋 Relatório (.md)</button><button class="btn" id="ro-ia">🤖 Perguntar à IA</button></div>' +
      '<p class="small muted">Testar: abra a prévia (ou o APK/PWA) e use o app. No console aparece "🧩 plano B respondeu" quando ele entrar em ação. Para desfazer: 📸 Checkpoints.</p>';
    $('#ro-st').textContent = '';
    box.querySelectorAll('[data-abrir]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); try { SK.editor.reveal(a.dataset.abrir, +a.dataset.linha); } catch { SK.editor.open(a.dataset.abrir); } }));
    box.querySelectorAll('[data-trocar]').forEach((b) => (b.onclick = async () => { const msg = await trocarNome(cs[+b.dataset.trocar]); mostrar(); $('#ro-st').innerHTML = msg; }));
    $('#ro-planob').onclick = async () => {
      try {
        const todas = (box.querySelector('[name="ro-quais"]:checked') || {}).value === 'todas';
        const rotas = (todas ? cs : faltando).map((c) => ({ method: c.method, path: c.path }));
        if (!rotas.length) throw new Error('Não há rota faltando. Marque "Todas" se quiser que o app funcione sem servidor.');
        await SK.checkpoints?.auto('Antes do plano B');
        const f = instalarPlanoB(rotas, { servidorPrimeiro: $('#ro-srv').checked });
        $('#ro-st').innerHTML = '✅ Plano B criado: ' + f.map(E).join(', ') + ' (' + rotas.length + ' rota(s)) e ligado no index.html. Teste na prévia. Para desfazer: 📸 Checkpoints.';
        SK.toast('🧩 Plano B criado', 'ok');
      } catch (e) { $('#ro-st').innerHTML = '❌ ' + E(e.message); }
    };
    $('#ro-md').onclick = () => SK.download((fs().project.name || 'projeto') + '-rotas.md', relatorio(), 'text/markdown;charset=utf-8');
    $('#ro-ia').onclick = () => {
      const t = 'Este é o mapa de rotas do meu projeto (feito pelo Mini SK). Me diga, em português simples, o que fazer com cada rota ❌ e ⚠️ para acabar com o "Failed to fetch" e a tela azul. Não invente rotas que não estão aqui.\n\n' + relatorio();
      SK.app.openSide('ai');
      setTimeout(() => { const inp = document.getElementById('ai-in'); if (inp) { inp.value = t; inp.dispatchEvent(new Event('input')); SK.toast('🤖 Escrevi o pedido na IA — confira e toque em Enviar.'); } else { SK.copy(t); SK.toast('📋 Copiei o pedido. Cole na 🤖 IA.'); } }, 150);
    };
  }
  function relatorio() {
    const r = ultimo, L = ['# 🧭 Mapa de rotas — ' + fs().project.name, ''];
    const nome = { ok: '✅ existe', parecido: '⚠️ nome parecido', falta: '❌ não existe', manual: '📘 só no manual', metodo: '⚠️ método diferente' };
    for (const c of r.chamadas) L.push('- ' + nome[c.status] + ' · ' + c.method + ' `' + c.path + '`' + (c.sugestao ? ' → certo: `' + c.sugestao + '`' : '') + ' · tela: ' + c.onde.map((o) => o.file + ':' + o.line).join(', '));
    if (r.soManual.length) { L.push('', '## 📘 Só no manual'); r.soManual.forEach((m) => L.push('- ' + m.method + ' `' + m.cp + '` (' + m.arq + ':' + m.linha + ')')); }
    if (r.naoUsadas.length) { L.push('', '## 🖥 No servidor, sem uso na tela'); r.naoUsadas.forEach((m) => L.push('- ' + m.method + ' `' + m.cp + '`')); }
    return L.join('\n') + '\n';
  }

  SK.rotas = { build, aoAbrir, mapear, planoB, instalarPlanoB, rotasDoManual };
})(window.SK);
