/* =========================================================================
   Mini SK — 89b-cacador.js
   🐞 CAÇADOR DE ERROS (para qualquer app que você rodar aqui)
   Junta num lugar só os erros da PRÉVIA (tela), das chamadas ao SERVIDOR e dos
   TERMINAIS (⚡ Node, 📱 Termux, 💻 PC). Diz em português se é normal,
   configuração ou defeito do projeto. Copiar · baixar .md · mandar para a IA.
   O botão 🐞 vermelho aparece sozinho quando acontece um erro.
   ========================================================================= */
(function (SK) {
  'use strict';
  const lista = [], MAX = 150;
  let botao = null, painel = null;
  const esconder = (t) => String(t).replace(/AIza[0-9A-Za-z_\-]{20,}/g, 'AIza…(escondida)').replace(/\b(sk-(?:ant-|or-|proj-)?)[A-Za-z0-9_\-]{12,}/g, '$1…(escondida)').replace(/\b(gsk_|pplx-|xai-|ghp_|github_pat_)[A-Za-z0-9_\-]{10,}/g, '$1…(escondida)').replace(/(Bearer\s+)[A-Za-z0-9._\-]{12,}/gi, '$1…(escondida)').replace(/(postgres(?:ql)?:\/\/[^:\s]+:)[^@\s]+@/gi, '$1…(escondida)@');
  const REGRAS = [
    [/not found: electron|electron-builder|Missing script: "(exe|programa)"/i, '✅ Normal no celular', 'O programa .exe (Electron) NÃO roda nem é montado no celular (nem no ⚡ Node, nem no 📱 Termux). Para gerar o .exe: 🚀 Publicar → Tudo (o GitHub monta). Para usar no computador: pasta Mini-SK-PC → npm install → npm run programa.'],
    [/Missing script/i, '⚙️ Configuração', 'Este projeto NÃO TEM esse comando no package.json. Use os botões ▶ npm run … dos ⚡ Comandos prontos: só aparecem os que existem.'],
    [/EADDRINUSE|address already in use|porta .* (ocupada|em uso)/i, '⚙️ Configuração', 'A PORTA já está sendo usada (um servidor ficou ligado). Pare o outro com Ctrl+C, ou feche e abra de novo.'],
    [/Cannot find module|MODULE_NOT_FOUND|ERR_MODULE_NOT_FOUND|Failed to resolve import/i, '⚙️ Configuração', 'Falta uma PEÇA (pacote). Rode  npm install. Se continuar, o pacote não está no package.json — é defeito do projeto.'],
    [/ERESOLVE|peer dep|conflicting peer/i, '⚙️ Configuração', 'Conflito de VERSÕES entre pacotes. Tente:  npm install --legacy-peer-deps'],
    [/command not found|não é reconhecido|is not recognized|not found: (node|npm|python|git)/i, '⚙️ Configuração', 'O PROGRAMA não está instalado nesse terminal (node, npm, python…). Instale e tente de novo.'],
    [/ENOENT|no such file or directory/i, '🔧 Defeito do projeto', 'Um ARQUIVO que o comando procura não existe (caminho errado, ou faltou criar).'],
    [/sem resposta|Sem resposta do servidor|Failed to fetch|Failed to parse URL|ECONNREFUSED|NetworkError|Load failed/i, '⚙️ Configuração', 'O SERVIDOR está desligado (ou caiu). Ligue o servidor (npm run dev / npm run servidor) e tente de novo.'],
    [/\b429\b|quota|RESOURCE_EXHAUSTED|rate.?limit|Too Many Requests/i, '⚙️ Configuração', 'O limite da chave da IA acabou (comum na chave grátis). Espere ou use outra chave.'],
    [/API.?key|\b401\b|\b403\b|PERMISSION_DENIED|invalid.?key|Unauthorized/i, '⚙️ Configuração', 'Problema com a CHAVE (faltando, errada ou sem permissão). Não é defeito do projeto.'],
    [/relation .* does not exist|no such table/i, '🔧 Defeito do projeto', 'O BANCO não tem a tabela que essa parte usa.'],
    [/respondeu 404|Cannot (GET|POST|PUT|PATCH|DELETE)/i, '🔧 Defeito do projeto', 'A tela chama um ENDEREÇO que o servidor não tem (falta a rota).'],
    [/respondeu 5\d\d|Internal Server Error/i, '🔧 Defeito do projeto', 'Deu erro DENTRO do servidor. Veja o erro do terminal logo antes.'],
    [/não encontrad|nao encontrad|not found/i, '✅ Normal', 'Pediu algo que não existe (ainda não foi criado ou já foi apagado). Normalmente não é defeito.'],
    [/ReferenceError|TypeError|SyntaxError|is not defined|is not a function|Cannot read prop|Unexpected token|already been declared/i, '🔧 Defeito do projeto', 'Erro no CÓDIGO (algo que o programa esperava e não existe, ou escrita errada). Mande para a IA.'],
  ];
  function explicar(x) { const t = x.de + ' ' + x.msg; for (const [re, selo, texto] of REGRAS) if (re.test(t)) return { selo, texto }; return { selo: '❓ Ver com a IA', texto: 'Não reconheci. Copie e mande para a IA.' }; }
  function anotar(de, msg) {
    msg = esconder(String(msg || '').trim()).slice(0, 1500); if (!msg) return;
    const ult = lista[lista.length - 1];
    if (ult && ult.de === de && ult.msg === msg) ult.vezes = (ult.vezes || 1) + 1;
    else { lista.push({ quando: new Date().toLocaleTimeString('pt-BR'), de, msg }); if (lista.length > MAX) lista.shift(); }
    pintarBotao(); if (painel && !painel.hidden) pintar();
  }
  // ── de onde vêm os erros ──
  window.addEventListener('message', (e) => { const d = e.data; if (d && d.sk === 'console' && d.level === 'error') anotar('🖥 Prévia', d.text); });
  const ERRO_TERM = /npm ERR!|npm error|\bERR_[A-Z_]+|Error:|error TS\d|EADDRINUSE|ENOENT|ECONNREFUSED|Cannot find module|Traceback \(most recent|SyntaxError|TypeError|ReferenceError|Unhandled|✘ \[ERROR\]|\[vite\].*(error|failed)|command not found|não é reconhecido|failed to compile/i;
  const restos = {}; const dec = new TextDecoder();
  SK.on('terminal-saida', (ev) => {
    if (!ev) return;
    let t = typeof ev.texto === 'string' ? ev.texto : dec.decode(ev.texto instanceof Uint8Array ? ev.texto : new Uint8Array(ev.texto || []), { stream: true });
    t = (restos[ev.de] || '') + t.replace(/\x1b\[[0-9;?]*[ -\/]*[@-~]|\x1b\][^\x07]*\x07/g, '').replace(/\r(?!\n)/g, '\n');
    const linhas = t.split('\n'); restos[ev.de] = linhas.pop().slice(-500);
    const RUIDO = /^\s*npm (error|ERR!)\s*$|To see a list of scripts|^\s*npm (error|ERR!)\s+npm run\s*$|A complete log of this run|Did you mean this\?|npm exec # Run a command/i;
    for (let l of linhas) if ((l = l.replace(/[\u2800-\u28ff]/g, '')) && !RUIDO.test(l) && ERRO_TERM.test(l) && !/(^|[#$>❯%]\s*)(echo|printf)\s/.test(l) && l.length < 1200) anotar(ev.de, l.trim());
  });
  // ── o que os painéis disseram (📦 APK/.exe, 🐙 GitHub, ⚡ Node, 📱 Termux, 🚀 Publicar…) ──
  const falas = [];
  function falou(de, t) { t = esconder(String(t || '').trim()); if (!t || (falas.length && falas[falas.length - 1].t === t)) return; falas.push({ q: new Date().toLocaleTimeString('pt-BR'), de, t: t.slice(0, 400) }); if (falas.length > 40) falas.shift(); }
  const NOMES = { 'apk-status': '📦 APK/.exe', 'gh-status': '🐙 GitHub', 'node-status': '⚡ Node', 'tx-status': '📱/💻 Terminal', 'tx-p-status': '⇅ Ponte', 'pub-status': '🚀 Publicar', 'tx-vivo': '🔗 Árvore', 'nx-status': '⚡ Node árvore' };
  new MutationObserver((ms) => { for (const m of ms) { const el = m.target.nodeType === 3 ? m.target.parentElement : m.target; const alvo = el && el.closest && el.closest('[id]'); if (alvo && NOMES[alvo.id]) falou(NOMES[alvo.id], alvo.textContent); } }).observe(document.documentElement, { subtree: true, childList: true, characterData: true });
  if (SK.toast) { const t0 = SK.toast; SK.toast = function (msg, k) { try { falou('aviso', msg); } catch {} return t0.apply(this, arguments); }; }
  // ── 🩺 diagnóstico: tudo num texto só, para colar no chat ──
  async function diagnostico() {
    const L = [], sim = (v) => (v ? 'sim' : 'não');
    const ua = navigator.userAgent;
    L.push('# 🩺 Diagnóstico do Mini SK — ' + new Date().toLocaleString('pt-BR'));
    L.push('Versão: ' + SK.version + ' (' + ((document.getElementById('versao-chip') || {}).textContent || '') + ')');
    L.push('Aberto em: ' + location.protocol + '//' + location.host + location.pathname);
    L.push('Aparelho: ' + (/Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : 'outro') + ' · ' + ((ua.match(/(Chrome|Edg|Firefox|Version)\/[\d.]+/) || [''])[0]) + ' · como app instalado (PWA): ' + sim(matchMedia('(display-mode: standalone)').matches) + ' · APK: ' + sim(!!window.AndroidBridge) + ' · programa do PC: ' + sim(!!window.miniskPC));
    L.push('', '## ⚡ Node');
    L.push('Lacre ligado na página (isolada): ' + sim(window.crossOriginIsolated) + ' · lacre marcado: ' + sim(SK.pref.get('lacre', false)) + ' · Node ligado: ' + sim(SK.node && SK.node.ligado));
    let sw = 'não'; try { const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); sw = reg ? (reg.active ? reg.active.scriptURL : 'registrando') + ' (escopo ' + reg.scope + ')' : 'nenhum'; } catch (e) { sw = 'erro: ' + e.message; }
    L.push('Service worker: ' + sw);
    let temSW = 'não sei'; try { temSW = (await fetch('sw.js', { cache: 'no-store' })).ok ? 'sim' : 'não'; } catch { temSW = 'não (arquivo solto?)'; }
    L.push('sw.js ao lado da página: ' + temSW);
    L.push('', '## 📱 Termux / 💻 terminal');
    L.push('Terminal conectado: ' + sim(SK.termux && SK.termux.ligado));
    let ponte = 'não testei'; try { const pc = window.miniskPC; const porta = (pc && pc.portas && pc.portas.ponte) || 7682; const ctl = new AbortController(); setTimeout(() => ctl.abort(), 2500); const r = await fetch('http://127.0.0.1:' + porta + '/ping', { signal: ctl.signal, headers: { 'X-Codigo': pc ? pc.codigo : SK.pref.get('termuxPonteCodigo', '') } }); ponte = 'respondeu ' + r.status; } catch (e) { ponte = 'não respondeu (' + (e.name === 'AbortError' ? 'tempo esgotado' : e.message) + ')'; }
    L.push('Ponte de arquivos: ' + ponte);
    L.push('', '## 🐙 GitHub e projeto');
    L.push('Token do GitHub salvo: ' + sim(SK.github && SK.github.token) + (SK.github && SK.github.user ? ' · conta: ' + SK.github.user.login : ''));
    const P = SK.fs.project;
    if (P) { const lista = SK.fs.list(); L.push('Projeto aberto: "' + P.name + '" · ' + lista.length + ' arquivos · index.html na raiz: ' + sim(SK.fs.exists('index.html')) + ' · outro index: ' + (lista.filter((f) => /(^|\/)index\.html$/.test(f) && f !== 'index.html').slice(0, 3).join(', ') || '—'));
      L.push('Receitas do GitHub (.github/workflows): ' + (lista.filter((f) => f.startsWith('.github/workflows/')).join(', ') || 'nenhuma') + ' · apk.config.json: ' + sim(SK.fs.exists('apk.config.json')) + ' · electron/main.cjs: ' + sim(SK.fs.exists('electron/main.cjs')) + ' · manifest: ' + sim(SK.fs.exists('manifest.json') || SK.fs.exists('manifest.webmanifest'))); }
    else L.push('Nenhum projeto aberto.');
    L.push('', '## 💬 O que os painéis disseram (últimas)'); for (const f of falas.slice(-25)) L.push('- ' + f.q + ' · ' + f.de + ': ' + f.t); if (!falas.length) L.push('(nada ainda)');
    L.push('', '## 🐞 Erros (' + lista.length + ')'); for (const x of lista.slice(-25)) L.push('- ' + x.quando + ' · ' + x.de + ': ' + x.msg.split('\n')[0].slice(0, 300) + (x.vezes > 1 ? ' (' + x.vezes + 'x)' : ''));
    return L.join('\n');
  }

  // ── a tela ──
  function pintarBotao() {
    if (!botao) { botao = document.createElement('button'); botao.id = 'cacador-bt'; botao.title = 'Erros encontrados (toque para ver)'; botao.style.cssText = 'position:fixed;right:12px;bottom:72px;z-index:60;border:0;border-radius:99px;padding:10px 14px;font:700 15px system-ui;background:#dc2626;color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.4);cursor:pointer'; botao.onclick = abrir; document.body.appendChild(botao); }
    const n = lista.reduce((s, x) => s + (x.vezes || 1), 0);
    botao.hidden = false; botao.textContent = n ? '🐞 ' + n : '🐞'; botao.style.background = n ? '#dc2626' : '#475569'; botao.style.padding = n ? '10px 14px' : '8px 11px';
  }
  function relatorio() {
    return '# 🐞 Erros encontrados — ' + (SK.fs.project ? SK.fs.project.name : '') + ' — ' + new Date().toLocaleString('pt-BR') + '\n\n' +
      lista.map((x, i) => { const e = explicar(x); return '## ' + (i + 1) + '. ' + x.de + ' · ' + x.quando + (x.vezes > 1 ? ' (' + x.vezes + ' vezes)' : '') + '\n**' + e.selo + '** — ' + e.texto + '\n```\n' + x.msg + '\n```'; }).join('\n\n') +
      '\n\n---\nPedido para a IA: estes são os erros do meu projeto. Os marcados como "🔧 Defeito do projeto" são os que preciso consertar. Me devolva o(s) arquivo(s) INTEIRO(S) consertado(s).\n';
  }
  function pintar() {
    const c = painel.querySelector('.cc-lista');
    c.innerHTML = lista.length ? lista.slice().reverse().map((x) => { const e = explicar(x); return '<div style="border:1px solid var(--line2,#334);border-radius:10px;padding:8px;margin-bottom:6px"><div class="small"><b>' + SK.esc(e.selo) + '</b> · ' + SK.esc(x.de) + ' · ' + x.quando + (x.vezes > 1 ? ' · ' + x.vezes + 'x' : '') + '</div><div class="small muted">' + SK.esc(e.texto) + '</div><pre style="white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.4 ui-monospace,monospace;margin:6px 0 0;max-height:160px;overflow:auto">' + SK.esc(x.msg) + '</pre></div>'; }).join('') : '<p class="muted">Nenhum erro por enquanto. ✅</p>';
  }
  function abrir() {
    if (!painel) {
      painel = document.createElement('div'); painel.id = 'cacador-painel';
      painel.style.cssText = 'position:fixed;inset:auto 8px 8px 8px;max-height:75vh;z-index:61;background:var(--bg2,#16213a);color:var(--fg,#e6edf8);border:1px solid var(--line2,#334);border-radius:14px;padding:10px;overflow:auto;box-shadow:0 10px 40px rgba(0,0,0,.5);max-width:720px;margin:0 auto';
      painel.innerHTML = '<div class="row wrap" style="align-items:center"><b>🐞 Caçador de erros</b><span style="flex:1"></span><button class="btn small primary" data-c="diag">🩺 Copiar diagnóstico</button><button class="btn small" data-c="cacabug">🔬 Caça-Bug</button><button class="btn small" data-c="copiar">📋 Copiar erros</button><button class="btn small" data-c="baixar">⤓ .md</button><button class="btn small primary" data-c="ia">🤖 Mandar para a IA</button><button class="btn small" data-c="limpar">🧹 Limpar</button><button class="btn small" data-c="fechar">✕</button></div><p class="small muted" style="margin:6px 0"><b>🩺 Copiar diagnóstico</b>: junta tudo o que preciso saber (versão, como foi aberto, Node/lacre, Termux, GitHub, as últimas mensagens dos painéis e os erros) — é só colar no chat. Erros da prévia, do servidor e dos terminais (Node, Termux, PC), explicados. ✅ Normal · ⚙️ Configuração · 🔧 Defeito do projeto.</p><div class="cc-lista"></div>';
      painel.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-c]'); if (!b) return; const c = b.dataset.c;
        if (c === 'fechar') painel.hidden = true;
        if (c === 'cacabug') { painel.hidden = true; SK.app.openSide('bug'); }
        if (c === 'diag') { b.disabled = true; b.textContent = '🩺 Juntando…'; try { const t = await diagnostico(); try { await navigator.clipboard.writeText(t); SK.toast('🩺 Diagnóstico copiado — cole aqui para o Claude'); } catch { SK.prompt('Copie o diagnóstico:', t); } } finally { b.disabled = false; b.textContent = '🩺 Copiar diagnóstico'; } }
        if (c === 'limpar') { lista.length = 0; pintar(); pintarBotao(); }
        if (c === 'copiar') { try { await navigator.clipboard.writeText(relatorio()); SK.toast('📋 Erros copiados'); } catch { SK.prompt('Copie:', relatorio()); } }
        if (c === 'baixar') SK.download('erros-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.md', relatorio(), 'text/markdown');
        if (c === 'ia') { SK.app.openSide('ai'); const inp = document.getElementById('ai-in'); if (inp) { inp.value = relatorio(); inp.dispatchEvent(new Event('input')); } painel.hidden = true; SK.toast('Escrevi os erros na IA — confira e toque em Enviar.'); }
      });
      document.body.appendChild(painel);
    }
    painel.hidden = false; pintar();
  }
  SK.cacador = { anotar, abrir, diagnostico, get lista() { return lista; }, relatorio };
  setTimeout(pintarBotao, 800);
})(window.SK);
