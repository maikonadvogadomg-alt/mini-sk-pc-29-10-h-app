/* Laboratório — 30-analise.js: lê o projeto INTEIRO (vários arquivos ou um HTML só) e descobre:
   os arquivos, como cada página carrega, as funções (o que fazem, quem chama quem), as ligações
   entre arquivos, dependências, rotas, e os problemas. O "motor" das funções é o do 🔪 Desmontar. */
(function (LB) {
  'use strict';
  const PISTAS = [
    [/fetch\(|axios|XMLHttpRequest|apiRequest/, 'busca dados na internet/servidor'], [/localStorage|sessionStorage/, 'guarda no aparelho'], [/indexedDB/, 'usa o banco do aparelho'],
    [/addEventListener|\.onclick\s*=|\.onchange\s*=|\.oninput\s*=/, 'liga botões/eventos'], [/innerHTML|insertAdjacentHTML|createElement|appendChild|textContent\s*=/, 'desenha/muda a tela'],
    [/createObjectURL|\.download\s*=/, 'baixa arquivo'], [/navigator\.clipboard/, 'copia'], [/speechSynthesis/, 'fala em voz alta'], [/SpeechRecognition/, 'escuta a voz'],
    [/JSZip|generateAsync/, 'mexe com zip'], [/FileReader|\.arrayBuffer\(\)|\.text\(\)/, 'lê arquivo'], [/setInterval|setTimeout/, 'usa tempo'], [/JSON\.parse|JSON\.stringify/, 'converte dados (JSON)'],
    [/WebSocket/, 'conversa ao vivo (WebSocket)'], [/useState|useEffect/, 'componente React (estado)'], [/res\.json|res\.send|req\.body/, 'responde no servidor'], [/\.query\(|db\.|prisma\.|drizzle/, 'mexe no banco de dados'],
  ];
  const PISTAS_NOME = [
    [/^(init|iniciar|start|boot|main|setup)/i, 'começa o app'], [/(render|desenhar|mostrar|exibir|atualizar|update|refresh|draw|pintar)/i, 'mostra/atualiza na tela'],
    [/(salvar|save|guardar|persist|gravar)/i, 'salva'], [/(carregar|load|^ler|read|restaurar|restore)/i, 'carrega'], [/(apagar|delete|remover|remove|excluir|limpar|clear)/i, 'apaga/limpa'],
    [/(exportar|export|baixar|download)/i, 'exporta/baixa'], [/(importar|import|abrir|open|upload)/i, 'importa/abre'], [/(validar|valid|check|verificar|conferir)/i, 'confere'],
    [/(calc|calcular|somar|total|contar)/i, 'calcula'], [/(toast|aviso|alert|notif)/i, 'mostra aviso'], [/(modal|dialog|popup|fechar|close)/i, 'abre/fecha janela'], [/(api|chat|gemini|openai|claude|groq|perguntar)/i, 'conversa com IA/API'],
  ];
  const explicar = (n, c) => { const o = []; for (const [r, t] of PISTAS_NOME) if (r.test(n)) { o.push(t); break; } for (const [r, t] of PISTAS) if (r.test(c) && !o.includes(t)) o.push(t); return o.slice(0, 4).join(' · ') || 'parte da lógica'; };
  const tipoArq = (c) => /\.html?$/i.test(c) ? 'html' : /\.(m?js|cjs)$/i.test(c) ? 'js' : /\.(tsx?|jsx)$/i.test(c) ? 'ts' : /\.(css|scss|less)$/i.test(c) ? 'css' : /\.json$/i.test(c) ? 'json' : /\.(md|txt)$/i.test(c) ? 'texto' : /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(c) ? 'imagem' : 'outro';
  const ehBiblioteca = (c) => { const ls = c.split('\n'); return c.length > 15000 && (c.length / Math.max(1, ls.length) > 300 || ls.length < 15); };
  const linhaDe = (txt, idx) => txt.slice(0, idx).split('\n').length;

  function lerJS(code, modulo) {
    const op = (t) => ({ ecmaVersion: 'latest', sourceType: t, locations: true, allowHashBang: true, allowReturnOutsideFunction: t === 'script', allowAwaitOutsideFunction: true });
    const repetidos = []; let texto = code;
    for (let v = 0; v < 12; v++) {
      try { const ast = window.acorn.parse(texto, op(modulo ? 'module' : 'script')); ast.repetidos = repetidos; return ast; }
      catch (e) {
        const m = /Identifier '([^']+)' has already been declared/.exec(e.message);
        if (m && e.pos != null && texto.slice(e.pos, e.pos + m[1].length) === m[1]) { repetidos.push({ nome: m[1], linha: e.loc ? e.loc.line : 0 }); texto = texto.slice(0, e.pos) + '_' + texto.slice(e.pos + 1); continue; }
        if (!modulo) { try { const ast = window.acorn.parse(texto, op('module')); ast.repetidos = repetidos; ast.virouModulo = true; return ast; } catch {} }
        return { erro: e.message, repetidos };
      }
    }
    return { erro: 'muitos nomes repetidos', repetidos };
  }
  // lê um pedaço de JavaScript (um arquivo .js ou um <script> de dentro do HTML)
  function analisarCodigo(code, arquivo, linha0, modulo) {
    const r = { arquivo, linha0, funcoes: [], topo: [], imports: [], fetches: [], rotas: [], erro: '', repetidos: [], biblioteca: false, aproximado: false };
    // ligações e rotas (por texto: funciona até em TS/JSX)
    const importsPorTexto = () => { for (const m of code.matchAll(/^[ \t]*(?:import\s+(?:[\w*{}\s,]+\s+from\s+)?|export\s+[\w*{}\s,]+\s+from\s+)['"]([^'"]+)['"]|\brequire\(\s*['"]([^'"]+)['"]\s*\)|\bimport\(\s*['"]([^'"]+)['"]\s*\)/gm)) r.imports.push({ de: m[1] || m[2] || m[3], linha: linha0 + linhaDe(code, m.index) - 1 }); };
    for (const m of code.matchAll(/\b(?:fetch|apiRequest\(\s*['"]\w+['"]\s*,|axios\.(?:get|post|put|patch|delete))\(?\s*[`'"]([^`'"]*\/api[^`'"]*)[`'"]/g)) r.fetches.push({ url: m[1].replace(/\$\{[^}]*\}/g, ':x'), linha: linha0 + linhaDe(code, m.index) - 1 });
    for (const m of code.matchAll(/\b(?:app|router|server|api)\.(get|post|put|patch|delete|all)\(\s*['"`]([^'"`]+)['"`]/g)) r.rotas.push({ metodo: m[1].toUpperCase(), caminho: m[2], linha: linha0 + linhaDe(code, m.index) - 1 });
    if (ehBiblioteca(code)) { r.biblioteca = true; return r; }
    if (/\.(tsx?|jsx)$/i.test(arquivo)) importsPorTexto();
    if (/\.(tsx?|jsx)$/i.test(arquivo)) {
      // TypeScript/JSX: o leitor não entende — pega as funções pelo jeito do texto
      r.aproximado = true;
      for (const m of code.matchAll(/(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::[^=]+)?=>/g)) {
        const nome = m[1] || m[2]; const ini = linha0 + linhaDe(code, m.index) - 1;
        r.funcoes.push({ nome, arquivo, ini, fim: ini, linhas: 0, chama: [], ids: [], faz: explicar(nome, code.slice(m.index, m.index + 1500)) });
      }
      return r;
    }
    const ast = lerJS(code, modulo); r.repetidos = (ast.repetidos || []).map((x) => ({ nome: x.nome, linha: linha0 + x.linha - 1 }));
    if (ast.erro) { r.erro = ast.erro; importsPorTexto(); return r; }
    window.acornWalk.full(ast, (n) => {
      let src = null;
      if ((n.type === 'ImportDeclaration' || n.type === 'ExportAllDeclaration' || (n.type === 'ExportNamedDeclaration' && n.source)) && n.source) src = n.source.value;
      else if (n.type === 'ImportExpression' && n.source && n.source.type === 'Literal') src = n.source.value;
      else if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && n.callee.name === 'require' && n.arguments[0] && n.arguments[0].type === 'Literal') src = n.arguments[0].value;
      if (typeof src === 'string') r.imports.push({ de: src, linha: linha0 + n.loc.start.line - 1 });
    });
    r.modulo = modulo || !!ast.virouModulo;
    for (const st of ast.body) {
      const lin = linha0 + st.loc.start.line - 1;
      if (st.type === 'FunctionDeclaration' && st.id) r.topo.push({ nome: st.id.name, linha: lin, lexico: false });
      else if (st.type === 'ClassDeclaration' && st.id) r.topo.push({ nome: st.id.name, linha: lin, lexico: true });
      else if (st.type === 'VariableDeclaration') for (const d of st.declarations) if (d.id.type === 'Identifier') r.topo.push({ nome: d.id.name, linha: lin, lexico: st.kind !== 'var' });
    }
    window.acornWalk.full(ast, (node) => {
      let nome = null, alvo = node;
      if (node.type === 'FunctionDeclaration' && node.id) nome = node.id.name;
      else if (node.type === 'VariableDeclarator' && node.init && /FunctionExpression|ArrowFunctionExpression/.test(node.init.type) && node.id.type === 'Identifier') { nome = node.id.name; alvo = node.init; }
      else if ((node.type === 'Property' || node.type === 'MethodDefinition') && node.value && /FunctionExpression|ArrowFunctionExpression/.test(node.value.type) && node.key && (node.key.name || node.key.value)) { nome = String(node.key.name || node.key.value); alvo = node.value; }
      if (!nome) return;
      const corpo = code.slice(node.start, node.end), chama = new Set();
      window.acornWalk.simple(alvo.body || alvo, { CallExpression(c) { if (c.callee.type === 'Identifier') chama.add(c.callee.name); else if (c.callee.type === 'MemberExpression' && c.callee.property && c.callee.property.name) chama.add((c.callee.object.type === 'Identifier' ? c.callee.object.name + '.' : '') + c.callee.property.name); } });
      const ids = [...new Set([...corpo.matchAll(/getElementById\(\s*['"]([\w-]+)['"]|querySelector(?:All)?\(\s*['"]#([\w-]+)/g)].map((x) => x[1] || x[2]))];
      r.funcoes.push({ nome, arquivo, ini: linha0 + node.loc.start.line - 1, fim: linha0 + node.loc.end.line - 1, linhas: node.loc.end.line - node.loc.start.line + 1, chama: [...chama], ids, faz: explicar(nome, corpo), corpo });
    });
    return r;
  }
  function resolver(base, ref, arquivos) {
    if (!ref || /^(https?:)?\/\//i.test(ref) || /^(data|blob|mailto|tel|javascript):/i.test(ref)) return { externo: true };
    ref = ref.split(/[?#]/)[0]; if (!ref) return { externo: true };
    let p; const dirBase = base.includes('/') ? base.slice(0, base.lastIndexOf('/') + 1) : '';
    const tenta = (lista) => { for (const c of lista) for (const ext of ['', '.js', '.mjs', '.ts', '.tsx', '.jsx', '.json', '/index.js', '/index.ts', '/index.tsx', '/index.html']) if (arquivos[c + ext]) return { caminho: c + ext }; return null; };
    if (ref.startsWith('@/')) { const r = tenta([(LB.apelidoArroba || 'src') + '/' + ref.slice(2), 'src/' + ref.slice(2), 'client/src/' + ref.slice(2), dirBase + 'src/' + ref.slice(2)]); return r || { faltando: ref }; }
    if (/^@[\w-]+\//.test(ref) && !/^@[\w-]+\/[\w-]+$/.test(ref) || /^@(shared|assets|lib|components)\//.test(ref)) { const nome = ref.slice(1).split('/')[0]; const r = tenta([nome + '/' + ref.split('/').slice(1).join('/'), 'client/src/' + nome + '/' + ref.split('/').slice(1).join('/'), 'attached_' + nome + '/' + ref.split('/').slice(1).join('/')]); if (r) return r; }
    if (ref.startsWith('/')) { const r = tenta([ref.slice(1), dirBase + ref.slice(1), dirBase + 'public/' + ref.slice(1), 'public/' + ref.slice(1)]); return r || { faltando: ref.slice(1) }; }
    else if (ref.startsWith('.')) { const pas = base.includes('/') ? base.slice(0, base.lastIndexOf('/')).split('/') : []; for (const parte of ref.split('/')) { if (parte === '..') pas.pop(); else if (parte !== '.') pas.push(parte); } p = pas.join('/'); }
    else if (!/[/.]/.test(ref[0]) && !/\.(js|css|html?|json|png|svg)$/i.test(ref)) return { pacote: ref.startsWith('@') ? ref.split('/').slice(0, 2).join('/') : ref.split('/')[0] };
    else { const dir = base.includes('/') ? base.slice(0, base.lastIndexOf('/') + 1) : ''; p = dir + ref; }
    for (const ext of ['', '.js', '.mjs', '.ts', '.tsx', '.jsx', '.json', '/index.js', '/index.ts', '/index.tsx', '/index.html']) if (arquivos[p + ext]) return { caminho: p + ext };
    return { faltando: p };
  }

  LB.analisar = (p) => {
    const A = p.arquivos, nomes = Object.keys(A).sort();
    const vite = nomes.find((c) => /(^|\/)vite\.config\.[cm]?[jt]s$/.test(c));
    LB.apelidoArroba = ''; if (vite && A[vite].t) { const m = /['"]@['"]\s*:\s*path\.resolve\([^,]+,\s*([^)]+)\)/.exec(A[vite].t); if (m) LB.apelidoArroba = [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]).join('/').replace(/^\.\//, ''); }
    const R = { nome: p.nome, arquivos: nomes.map((c) => ({ caminho: c, tipo: tipoArq(c), tam: A[c].t != null ? A[c].t.length : A[c].b, linhas: A[c].t != null ? A[c].t.split('\n').length : 0 })),
      paginas: [], codigos: [], funcoes: [], problemas: [], pacote: null, rotas: [], chamadasApi: [], quebradas: [], usados: new Set(), pacotesUsados: new Set() };
    const prob = (grave, texto, arquivo) => R.problemas.push({ grave, texto, arquivo });
    const porArquivo = Object.create(null);
    // 1) os arquivos de código soltos (.js/.ts)
    for (const c of nomes) if (/^(js|ts)$/.test(tipoArq(c)) && A[c].t != null && !/\.d\.ts$/.test(c) && !/(^|\/)(dist|build)\//.test(c)) {
      const ehMod = /\.mjs$/.test(c) || /^\s*(import|export)\s/m.test(A[c].t);
      const a = analisarCodigo(A[c].t, c, 1, ehMod); porArquivo[c] = a; R.codigos.push(a);
    }
    // 2) as páginas HTML (scripts de dentro + os que elas carregam)
    for (const c of nomes) if (tipoArq(c) === 'html' && A[c].t != null) {
      const html = A[c].t, pg = { caminho: c, carrega: [], estilos: [], inline: [], ids: [], cliques: [], titulo: (/<title[^>]*>([^<]*)/i.exec(html) || [])[1] || '' };
      for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        const at = m[1], src = (at.match(/\bsrc\s*=\s*["']([^"']+)/i) || [])[1], tipo = ((at.match(/\btype\s*=\s*["']([^"']+)/i) || [])[1] || '').toLowerCase();
        if (src) { const rs = resolver(c, src, A); pg.carrega.push({ src, modulo: tipo === 'module', ...rs }); if (rs.caminho) R.usados.add(rs.caminho); if (rs.faltando) R.quebradas.push({ de: c, para: src }); continue; }
        if (tipo && !/module|javascript|babel|jsx/.test(tipo)) continue;
        if (!m[2].trim()) continue;
        const a = analisarCodigo(m[2], c + ' (script da linha ' + linhaDe(html, m.index) + ')', linhaDe(html, m.index), tipo === 'module'); a.pagina = c; pg.inline.push(a); R.codigos.push(a);
      }
      for (const m of html.matchAll(/<link\b[^>]*rel=["']?(?:stylesheet|manifest|icon)[^>]*>/gi)) { const h = (m[0].match(/href\s*=\s*["']([^"']+)/i) || [])[1]; if (!h) continue; const rs = resolver(c, h, A); pg.estilos.push({ href: h, ...rs }); if (rs.caminho) R.usados.add(rs.caminho); if (rs.faltando) R.quebradas.push({ de: c, para: h }); }
      for (const m of html.matchAll(/<(?:img|source|iframe|a)\b[^>]*(?:src|href)\s*=\s*["']([^"'#]+\.(?:png|jpe?g|svg|gif|webp|html?))["']/gi)) { const rs = resolver(c, m[1], A); if (rs.caminho) R.usados.add(rs.caminho); else if (rs.faltando) R.quebradas.push({ de: c, para: m[1] }); }
      const soTela = html.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
      pg.ids = [...soTela.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map((x) => x[1]);
      for (const m of soTela.matchAll(/<(\w+)[^>]*?\s(on\w+)\s*=\s*["']([^"']*)["'][^>]*>([^<]{0,40})/gi)) { const fn = (m[3].match(/^\s*(?:return\s+)?([A-Za-z_$][\w$]*)(?:\.([A-Za-z_$][\w$]*))?\s*\(/) || []); pg.cliques.push({ evento: m[2], codigo: m[3].slice(0, 80), fn: fn[1] || '', texto: m[4].trim() || m[1] }); }
      R.paginas.push(pg);
    }
    // 3) ligações entre arquivos de código (import/require)
    for (const a of R.codigos) for (const im of a.imports) {
      const base = a.pagina || a.arquivo; const rs = resolver(base, im.de, A);
      im.resolvido = rs.caminho || ''; if (rs.caminho) R.usados.add(rs.caminho); if (rs.pacote) R.pacotesUsados.add(rs.pacote); if (rs.faltando) R.quebradas.push({ de: a.arquivo + ':' + im.linha, para: im.de });
    }
    // 4) funções: quem chama quem (no projeto todo)
    for (const a of R.codigos) R.funcoes.push(...a.funcoes);
    const porNome = Object.create(null); for (const f of R.funcoes) (porNome[f.nome] = porNome[f.nome] || []).push(f);
    for (const f of R.funcoes) { f.chamaAqui = [...new Set(f.chama.map((x) => x.split('.').pop()).filter((x) => porNome[x] && x !== f.nome))]; f.chamadaPor = []; }
    for (const f of R.funcoes) for (const c of f.chamaAqui) for (const g of porNome[c]) if (!g.chamadaPor.includes(f.nome)) g.chamadaPor.push(f.nome);
    // 5) package.json, rotas do servidor e chamadas do app
    const pj = nomes.find((c) => /(^|\/)package\.json$/.test(c) && !c.includes('node_modules') && c.split('/').length <= 2);
    if (pj) { try { R.pacote = Object.assign({ arquivo: pj }, JSON.parse(A[pj].t)); } catch (e) { prob(true, 'O package.json tem erro de escrita: ' + e.message, pj); } }
    for (const a of R.codigos) { for (const rt of a.rotas) R.rotas.push(Object.assign({ arquivo: a.arquivo }, rt)); for (const f of a.fetches) R.chamadasApi.push(Object.assign({ arquivo: a.arquivo }, f)); }
    // 6) problemas
    for (const a of R.codigos) {
      for (const rp of a.repetidos) prob(true, '"' + rp.nome + '" foi declarado DUAS vezes (linha ' + rp.linha + '). Isso TRAVA o código inteiro ("already been declared").', a.arquivo);
      if (a.erro) prob(true, 'Erro de escrita no código: ' + a.erro + ' — o arquivo inteiro não roda.', a.arquivo);
      for (const f of a.funcoes) if (f.linhas > 150) prob(false, 'A função ' + f.nome + ' tem ' + f.linhas + ' linhas (linha ' + f.ini + '): grande demais, boa candidata a ser dividida.', a.arquivo);
    }
    for (const q of R.quebradas) prob(true, q.de + ' chama "' + q.para + '", que NÃO existe no projeto (tela branca ou botão sem efeito).', q.de);
    for (const pg of R.paginas) {
      // scripts comuns da página dividem o mesmo "espaço": o mesmo nome em 2 arquivos (com let/const/class) trava
      const decl = Object.create(null);
      const doPg = pg.inline.concat(pg.carrega.filter((x) => x.caminho && !x.modulo && porArquivo[x.caminho]).map((x) => porArquivo[x.caminho]));
      for (const a of doPg) if (!a.modulo) for (const t of a.topo) (decl[t.nome] = decl[t.nome] || []).push(Object.assign({ arq: a.arquivo }, t));
      for (const [n, ds] of Object.entries(decl)) if (ds.length > 1 && new Set(ds.map((d) => d.arq)).size > 1) prob(ds.some((d) => d.lexico), '"' + n + '" existe em ' + ds.length + ' arquivos que a página ' + pg.caminho + ' carrega (' + ds.map((d) => d.arq + ':' + d.linha).join(', ') + ').' + (ds.some((d) => d.lexico) ? ' Com let/const/class isso TRAVA a página.' : ' Vale o último a carregar.'), pg.caminho);
      const existe = new Set(Object.keys(decl).concat(doPg.flatMap((a) => a.funcoes.map((f) => f.nome))));
      const OK = /^(if|return|void|typeof|new|alert|confirm|prompt|console|document|window|location|history|event|this|setTimeout|navigator|fetch|open|close|print|parent|top|self|JSON|Math|Object|Array|Date)$/;
      const leuTudo = doPg.every((a) => !a.erro && !a.aproximado) && !pg.carrega.some((x) => x.modulo);
      if (leuTudo && doPg.length) for (const k of pg.cliques) if (k.fn && !existe.has(k.fn) && !OK.test(k.fn)) prob(true, 'Na página ' + pg.caminho + ', o botão "' + k.texto + '" chama ' + k.fn + '(), que não existe em nenhum código que ela carrega.', pg.caminho);
      const ids = new Set(pg.ids); const falta = Object.create(null);
      for (const a of doPg) for (const f of a.funcoes) for (const id of f.ids) if (!ids.has(id)) (falta[id] = falta[id] || new Set()).add(f.nome);
      const nFalta = Object.keys(falta).length; if (nFalta) prob(false, 'Na página ' + pg.caminho + ', o código procura ' + nFalta + ' id(s) que a página não tem: ' + Object.entries(falta).slice(0, 8).map(([id, fs]) => '#' + id + ' (em ' + [...fs].slice(0, 2).join(', ') + ')').join(', ') + (nFalta > 8 ? '…' : '') + '. Podem ser criados depois pelo código — ou podem ser erro.', pg.caminho);
    }
    if (R.rotas.length) { const tem = (u) => R.rotas.some((r) => { const re = new RegExp('^' + r.caminho.replace(/:[\w]+/g, '[^/]+').replace(/\*/g, '.*') + '/?$'); return re.test(u.split('?')[0].replace(/:x/g, 'x')) || u.startsWith(r.caminho.replace(/\/:.*$/, '')); });
      const faltam = [...new Set(R.chamadasApi.map((c) => c.url))].filter((u) => u.startsWith('/') && !tem(u)); // só as do próprio servidor (as de sites de fora não contam) if (faltam.length) prob(false, faltam.length + ' endereço(s) que o app chama e o servidor NÃO tem: ' + faltam.slice(0, 10).join(', ') + (faltam.length > 10 ? '…' : '') + ' (dá "404" / "não encontrado").', '');
    } else if (R.chamadasApi.some((c) => c.url.startsWith('/'))) prob(false, 'O app chama ' + new Set(R.chamadasApi.map((c) => c.url)).size + ' endereço(s) /api, mas este projeto não tem servidor (rotas). Sem servidor, essas partes não funcionam.', '');
    if (R.pacote) { const deps = Object.assign({}, R.pacote.dependencies, R.pacote.devDependencies); const faltam = [...R.pacotesUsados].filter((x) => !deps[x] && !/^(node:.*|fs|fs\/promises|path|http|https|os|url|crypto|child_process|events|stream|util|zlib|net|tls|assert|buffer|readline|async_hooks|worker_threads|querystring|dns|module|process|timers|perf_hooks|v8|vm)$/.test(x)); if (faltam.length) prob(true, 'O código usa pacote(s) que não estão no package.json: ' + faltam.join(', ') + ' ("Cannot find module").', R.pacote.arquivo); }
    // soltos: código/estilo que ninguém carrega
    const entradas = new Set(R.paginas.map((p) => p.caminho)); if (R.pacote && R.pacote.main) entradas.add(R.pacote.main);
    R.soltos = R.arquivos.filter((a) => /^(js|ts|css)$/.test(a.tipo) && !R.usados.has(a.caminho) && !entradas.has(a.caminho) && !/(^|\/)(vite|tailwind|postcss|eslint|tsconfig|jest|babel|webpack|drizzle|capacitor|electron)[\w.-]*$/i.test(a.caminho) && !/(^|\/)(sw|service-worker|server|main|index|app|electron\/main)\.[cm]?[jt]sx?$/i.test(a.caminho)).map((a) => a.caminho);
    R.problemas.sort((a, b) => (b.grave ? 1 : 0) - (a.grave ? 1 : 0));
    return R;
  };
  LB.analisarCodigo = analisarCodigo;
})(window.LB);
