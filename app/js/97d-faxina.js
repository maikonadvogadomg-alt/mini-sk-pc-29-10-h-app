/* =========================================================================
   Mini SK — 97d-faxina.js  ·  🧹 Faxina do projeto (antes de importar)
   Para projetos grandes (ex.: o jurídico do Replit). Olha o pacote/pasta
   SEM encher o Mini SK e mostra, em português:
     1. 🗑 LIXO: node_modules, .git, caches do Replit… (quanto pesa cada um)
     2. 🔑 SEGREDOS: .env, chaves de IA, senha de banco (mostra mascarado)
     3. 🕰 HISTÓRICO: as mudanças guardadas no .git (data + o que mudou)
   E faz: "importar só o que presta" (novo projeto, sem lixo, sem segredos)
   ou baixar um .zip limpo. NUNCA apaga nada do original.
   ========================================================================= */
(function (SK) {
  'use strict';
  const fs = () => SK.fs;
  const E = (s) => SK.esc(String(s == null ? '' : s));

  // ── 🗑 o que é lixo ──
  const LIXO = [
    { id: 'node_modules', re: /(^|\/)node_modules\//, nome: 'node_modules', porque: 'bibliotecas baixadas — voltam sozinhas com "npm install"' },
    { id: 'git', re: /(^|\/)\.git\//, nome: '.git', porque: 'histórico do Git (o Mini SK lê o resumo antes de tirar)' },
    { id: 'cache', re: /(^|\/)(\.cache|\.npm|\.pnpm-store|\.yarn\/cache|\.next\/cache|\.turbo|\.vite|\.parcel-cache|\.angular|\.expo|__pycache__|\.pytest_cache|\.mypy_cache|coverage)\//, nome: 'caches', porque: 'arquivos temporários de montagem' },
    { id: 'replit', re: /(^|\/)(\.local|\.upm|\.pythonlibs|\.config|\.breakpoints|\.ccls-cache)\//, nome: 'pastas internas do Replit', porque: 'só servem dentro do Replit' },
    { id: 'sistema', re: /(^|\/)(__MACOSX\/|\.DS_Store$|Thumbs\.db$|desktop\.ini$)|\.log$/i, nome: 'sujeira de sistema e logs', porque: 'Mac/Windows/registros' },
  ];
  const TALVEZ = [
    { id: 'anexos', re: /(^|\/)attached_assets\//, nome: 'attached_assets', porque: 'prints e textos que você colou no chat do Replit — pode ter coisa útil' },
    { id: 'pacotes', re: /\.(zip|tar|tgz|gz|rar|7z)$/i, nome: 'pacotes dentro do projeto', porque: 'backups antigos dentro do projeto' },
  ];
  // ── 🔑 segredos ──
  const ARQ_SEGREDO = /(^|\/)(\.env(\.[\w.-]+)?|[^/]*\.(pem|key|p12|pfx|keystore|jks)|credentials\.json|service-account[^/]*\.json|chave-ia\.txt|id_rsa|id_ed25519|\.npmrc|\.netrc)$/i;
  const EXEMPLO = /\.env\.(example|exemplo|sample|template)$/i;
  const PADROES = [
    ['Google/Gemini', /AIza[0-9A-Za-z_-]{35}/g],
    ['Anthropic (Claude)', /sk-ant-[A-Za-z0-9_-]{20,}/g],
    ['OpenRouter', /sk-or-v1-[A-Za-z0-9]{20,}/g],
    ['OpenAI', /sk-(?:proj-)?(?!ant-|or-)[A-Za-z0-9_-]{32,}/g],
    ['Groq', /gsk_[A-Za-z0-9]{40,}/g],
    ['xAI', /xai-[A-Za-z0-9]{40,}/g],
    ['GitHub', /(?:ghp|gho|ghs|ghu)_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,}/g],
    ['Banco de dados (com senha)', /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s:'"`@/]+:[^\s'"`@]+@[^\s'"`]+/g],
    ['Amazon (AWS)', /AKIA[0-9A-Z]{16}/g],
    ['Chave privada', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
    ['Stripe', /sk_live_[A-Za-z0-9]{20,}/g],
  ];
  const mascarar = (v) => v.startsWith('-----') ? v : v.length <= 10 ? '••••' : v.slice(0, 6) + '•••' + v.slice(-3) + ' (' + v.length + ' letras)';
  const tam = (n) => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(0) + ' KB' : n < 1073741824 ? (n / 1048576).toFixed(1) + ' MB' : (n / 1073741824).toFixed(2) + ' GB';
  const ehTexto = (u8) => { if (!u8) return false; const n = Math.min(u8.length, 8000); for (let i = 0; i < n; i++) if (u8[i] === 0) return false; return true; };
  const precisaLer = (n) => /(^|\/)\.git\/(logs\/HEAD|config|HEAD)$/.test(n);
  const ehLixo = (n) => !precisaLer(n) && LIXO.some((l) => l.re.test(n));

  let ultimo = null; // { nome, itens:[{name,data,size}], rel }

  // ── ler a origem ──
  async function deArquivo(f) {
    const u8 = new Uint8Array(await f.arrayBuffer());
    if (!SK.zip.tipoPorBytes(u8)) throw new Error('"' + f.name + '" não parece um pacote (.zip, .tar, .tar.gz, .gz). Para uma pasta, use "📁 Uma pasta".');
    const itens = await SK.zip.readAny(u8, f.name, 0, { pular: ehLixo });
    return { nome: SK.zip.nomeSemExt(f.name), itens: tirarRaiz(itens), origem: '🗜 ' + f.name + ' (' + tam(f.size) + ')' };
  }
  async function dePasta(lista) {
    const fl = Array.from(lista || []); if (!fl.length) throw new Error('Nenhum arquivo na pasta.');
    const itens = [];
    for (const f of fl) {
      const n = f.webkitRelativePath || f.name;
      itens.push(ehLixo(n) ? { name: n, data: null, size: f.size } : { name: n, data: new Uint8Array(await f.arrayBuffer()), size: f.size });
    }
    const raiz = (fl[0].webkitRelativePath || '').split('/')[0] || 'pasta';
    return { nome: raiz, itens: tirarRaiz(itens), origem: '📁 ' + raiz + ' (' + fl.length + ' arquivos)' };
  }
  function doProjeto() {
    const P = fs().project; if (!P) throw new Error('Abra um projeto primeiro.');
    const itens = fs().list().map((p) => { const b = fs().bytesOf(p); return { name: p, data: b, size: b ? b.length : 0 }; });
    return { nome: P.name, itens, origem: '📂 projeto aberto "' + P.name + '"' };
  }
  function tirarRaiz(itens) {
    const ns = itens.map((i) => i.name); if (ns.length < 2) return itens;
    const r = ns[0].split('/')[0];
    if (!r || !ns.every((n) => n.startsWith(r + '/'))) return itens;
    return itens.map((i) => Object.assign({}, i, { name: i.name.slice(r.length + 1) })).filter((i) => i.name);
  }

  // ── analisar ──
  function analisar(fonte) {
    const grupos = {}; const add = (g, it) => { (grupos[g.id] = grupos[g.id] || { g, n: 0, bytes: 0, ex: [] }); const x = grupos[g.id]; x.n++; x.bytes += it.size || 0; if (x.ex.length < 4) x.ex.push(it.name); };
    const bons = [], segredos = [], arqSeg = [];
    let total = 0;
    for (const it of fonte.itens) {
      total += it.size || 0;
      const l = LIXO.find((x) => x.re.test(it.name));
      if (l) { add(l, it); continue; }
      const t = TALVEZ.find((x) => x.re.test(it.name)); if (t) add(t, it);
      if (ARQ_SEGREDO.test(it.name) && !EXEMPLO.test(it.name)) arqSeg.push(it.name);
      if (it.data && it.size < 3e6 && ehTexto(it.data)) {
        const txt = new TextDecoder().decode(it.data);
        const linhas = txt.split('\n');
        for (const [nome, re] of PADROES) {
          re.lastIndex = 0; let m;
          while ((m = re.exec(txt))) {
            const linha = txt.slice(0, m.index).split('\n').length;
            if (/SUA_CHAVE|example|exemplo|xxxx|\.\.\./i.test(m[0])) continue;
            segredos.push({ arq: it.name, linha, tipo: nome, valor: m[0], trecho: (linhas[linha - 1] || '').trim().slice(0, 140) });
            if (segredos.length > 300) break;
          }
        }
      }
      if (!t) bons.push(it);
    }
    // 🕰 histórico (.git/logs/HEAD é texto puro)
    const pega = (n) => { const it = fonte.itens.find((i) => i.name === n || i.name.endsWith('/' + n)); return it && it.data ? new TextDecoder().decode(it.data) : ''; };
    const historico = pega('.git/logs/HEAD').split('\n').filter(Boolean).map((l) => {
      const [cab, msg] = l.split('\t'); const m = /^(\w+) (\w+) (.*) <[^>]*> (\d+) ([+-]\d{4})$/.exec(cab || '');
      return m ? { quando: new Date(+m[4] * 1000), quem: m[3], msg: (msg || '').replace(/^(commit( \(initial\))?|checkout|reset|merge|pull|rebase[^:]*): /, ''), tipo: ((msg || '').match(/^\w+/) || [''])[0], id: m[2].slice(0, 7) } : null;
    }).filter(Boolean).reverse();
    const gitCfg = pega('.git/config'); const remoto = (gitCfg.match(/url = (.+)/) || [])[1] || '';
    if (/\/\/[^/@\s]+:[^/@\s]+@|\/\/(gh[ps]_|github_pat_)[^@]*@/.test(remoto)) segredos.push({ arq: '.git/config', linha: 0, tipo: 'Senha/token no endereço do GitHub', valor: remoto, trecho: '' });
    return { fonte, grupos, bons, segredos, arqSeg, historico, remoto: remoto.replace(/\/\/[^@/]+@/, '//•••@'), total };
  }

  // ── tela ──
  function build(el) {
    el.innerHTML =
      '<p class="small muted">Para projetos <b>grandes</b> (como o jurídico do Replit). Olho o pacote <b>antes</b> de entrar no Mini SK e separo: 🗑 lixo, 🔑 segredos e 🕰 histórico de mudanças. <b>Não apago nada do original.</b></p>' +
      '<div class="row wrap"><button class="btn primary" id="fx-arq">🗜 Um pacote (.zip, .tar, .tar.gz…)</button><button class="btn" id="fx-pasta">📁 Uma pasta</button><button class="btn" id="fx-proj">📂 O projeto aberto</button></div>' +
      '<input type="file" id="fx-arq-in" hidden><input type="file" id="fx-pasta-in" webkitdirectory multiple hidden>' +
      '<div id="fx-st" class="small" style="margin:8px 0"></div><div id="fx-res"></div>';
    const $ = (s) => SK.$(s, el);
    const rodar = (fn) => async (...a) => { $('#fx-st').textContent = '⏳ Olhando… (pacote grande demora um pouco)'; $('#fx-res').innerHTML = ''; try { await new Promise((r) => setTimeout(r, 30)); mostrar(analisar(await fn(...a))); $('#fx-st').textContent = ''; } catch (e) { $('#fx-st').innerHTML = '❌ ' + E(e.message); } };
    $('#fx-arq').onclick = () => $('#fx-arq-in').click();
    $('#fx-pasta').onclick = () => $('#fx-pasta-in').click();
    $('#fx-arq-in').onchange = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) rodar(deArquivo)(f); };
    $('#fx-pasta-in').onchange = (e) => { const l = e.target.files; rodar(dePasta)(l).then(() => { e.target.value = ''; }); };
    $('#fx-proj').onclick = () => rodar(async () => doProjeto())();

    function mostrar(r) {
      ultimo = r;
      const lixo = LIXO.map((l) => r.grupos[l.id]).filter(Boolean), talvez = TALVEZ.map((l) => r.grupos[l.id]).filter(Boolean);
      const bytesLixo = lixo.reduce((s, x) => s + x.bytes, 0), bytesBons = r.bons.reduce((s, x) => s + (x.size || 0), 0);
      const seg = r.segredos, porArq = {}; seg.forEach((s) => { (porArq[s.arq] = porArq[s.arq] || []).push(s); });
      $('#fx-res').innerHTML =
        '<div class="small muted">' + E(r.fonte.origem) + '</div>' +
        '<p><b>Total:</b> ' + tam(r.total) + ' · <b>o que presta:</b> ' + r.bons.length + ' arquivos (' + tam(bytesBons) + ') · <b>lixo:</b> ' + tam(bytesLixo) + '</p>' +
        '<h3 style="font-size:1rem;margin:12px 0 4px">🗑 Lixo (' + tam(bytesLixo) + ')</h3>' +
        (lixo.length ? '<ul class="small">' + lixo.map((x) => '<li><b>' + E(x.g.nome) + '</b> — ' + x.n + ' arquivos, ' + tam(x.bytes) + '<br><span class="muted">' + E(x.g.porque) + '</span></li>').join('') + '</ul>' : '<p class="small">✅ Nenhum lixo.</p>') +
        (talvez.length ? '<p class="small"><b>🤔 Talvez:</b></p><ul class="small">' + talvez.map((x) => '<li><label><input type="checkbox" data-talvez="' + x.g.id + '"> levar junto</label> <b>' + E(x.g.nome) + '</b> — ' + x.n + ' arquivos, ' + tam(x.bytes) + '<br><span class="muted">' + E(x.g.porque) + '. Ex.: ' + x.ex.map(E).join(', ') + '</span></li>').join('') + '</ul>' : '') +
        '<h3 style="font-size:1rem;margin:12px 0 4px">🔑 Segredos (' + (seg.length + r.arqSeg.length) + ')</h3>' +
        (r.arqSeg.length ? '<p class="small">Arquivos de senha (<b>não vão</b> na cópia limpa): ' + r.arqSeg.map((a) => '<code>' + E(a) + '</code>').join(', ') + '</p>' : '') +
        (seg.length ? '<ul class="small">' + Object.keys(porArq).map((a) => '<li><code>' + E(a) + '</code><br>' + porArq[a].map((s) => (s.linha ? 'linha ' + s.linha + ' · ' : '') + '<b>' + E(s.tipo) + '</b>: <code>' + E(mascarar(s.valor)) + '</code>').join('<br>') + '</li>').join('') + '</ul>' +
          '<label class="small"><input type="checkbox" id="fx-trocar" checked> Na cópia limpa, trocar essas chaves no código por <code>SUA_CHAVE_AQUI</code> (depois você põe a sua na ⚙️ configuração do app)</label>' : (r.arqSeg.length ? '' : '<p class="small">✅ Não achei chave no código.</p>')) +
        '<h3 style="font-size:1rem;margin:12px 0 4px">🕰 Histórico de mudanças (' + r.historico.length + ')</h3>' +
        (r.historico.length ? (r.remoto ? '<p class="small muted">GitHub ligado: ' + E(r.remoto) + '</p>' : '') + '<ol class="small" style="max-height:260px;overflow:auto">' + r.historico.slice(0, 200).map((h) => '<li><b>' + h.quando.toLocaleString('pt-BR') + '</b> · ' + E(h.msg || h.tipo) + ' <span class="muted">(' + h.id + ')</span></li>').join('') + '</ol>' : '<p class="small muted">Não veio histórico (o pacote não tem a pasta .git, ou ela está sem o registro).</p>') +
        '<div class="row wrap" style="margin-top:10px"><button class="btn primary" id="fx-importar">✅ Importar só o que presta (projeto novo)</button><button class="btn" id="fx-zip">⤓ Baixar .zip limpo</button><button class="btn" id="fx-md">📋 Relatório (.md)</button></div>' +
        '<p class="small muted">O original fica intacto. O projeto novo se chama "' + E(r.fonte.nome) + ' (limpo)".</p>';
      $('#fx-importar').onclick = () => acao(async () => {
        const blob = await zipLimpo();
        await fs().create(r.fonte.nome + ' (limpo)', {});
        const res = await fs().importFiles([new File([blob], 'limpo.zip')], '');
        if (r.historico.length) fs().write('.sk/historico-git.md', relatorio(true), { silent: true });
        await fs().saveNow(); SK.tree && SK.tree.render();
        return '✅ Projeto "' + fs().project.name + '" criado com ' + res.count + ' arquivos.' + (r.historico.length ? ' O histórico ficou em .sk/historico-git.md.' : '');
      });
      $('#fx-zip').onclick = () => acao(async () => { SK.download(SK.zip.nomeSemExt(r.fonte.nome) + '-limpo.zip', await zipLimpo()); return '⤓ Baixando o .zip limpo.'; });
      $('#fx-md').onclick = () => acao(async () => { SK.download(r.fonte.nome + '-faxina.md', relatorio(false), 'text/markdown;charset=utf-8'); return '📋 Relatório baixado (as chaves aparecem mascaradas).'; });
    }
    async function acao(fn) { try { $('#fx-st').innerHTML = '⏳ …'; $('#fx-st').innerHTML = E(await fn()); SK.toast($('#fx-st').textContent, 'ok'); } catch (e) { $('#fx-st').innerHTML = '❌ ' + E(e.message); } }
    function levarTalvez() { return SK.$$('[data-talvez]', el).filter((c) => c.checked).map((c) => c.dataset.talvez); }
    async function zipLimpo() {
      const r = ultimo; const lev = levarTalvez(); const trocar = SK.$('#fx-trocar', el) ? SK.$('#fx-trocar', el).checked : false;
      const porArq = {}; r.segredos.forEach((s) => { (porArq[s.arq] = porArq[s.arq] || []).push(s.valor); });
      const ents = [];
      for (const it of r.fonte.itens) {
        if (!it.data || LIXO.some((l) => l.re.test(it.name))) continue;
        const t = TALVEZ.find((x) => x.re.test(it.name)); if (t && !lev.includes(t.id)) continue;
        if (ARQ_SEGREDO.test(it.name) && !EXEMPLO.test(it.name)) continue;
        let data = it.data;
        if (trocar && porArq[it.name]) { let txt = new TextDecoder().decode(data); for (const v of porArq[it.name]) txt = txt.split(v).join('SUA_CHAVE_AQUI'); data = new TextEncoder().encode(txt); }
        ents.push({ name: it.name, data });
      }
      if (r.arqSeg.some((a) => /\.env$/i.test(a)) && !r.fonte.itens.some((i) => /\.env\.(example|exemplo)$/i.test(i.name))) {
        const env = r.fonte.itens.find((i) => /(^|\/)\.env$/i.test(i.name) && i.data);
        if (env) ents.push({ name: '.env.exemplo', data: new TextDecoder().decode(env.data).split('\n').map((l) => l.replace(/^(\s*[\w.]+\s*=).*/, '$1')).join('\n') }); // só os NOMES, sem os valores
      }
      if (!ents.length) throw new Error('Não sobrou nada para levar.');
      return SK.zip.write(ents);
    }
    function relatorio(soHistorico) {
      const r = ultimo, L = [];
      if (!soHistorico) {
        L.push('# 🧹 Faxina — ' + r.fonte.nome, '', '- Origem: ' + r.fonte.origem, '- Total: ' + tam(r.total) + ' · o que presta: ' + r.bons.length + ' arquivos', '', '## 🗑 Lixo');
        LIXO.concat(TALVEZ).forEach((l) => { const x = r.grupos[l.id]; if (x) L.push('- ' + l.nome + ': ' + x.n + ' arquivos, ' + tam(x.bytes) + ' — ' + l.porque); });
        L.push('', '## 🔑 Segredos (mascarados)'); r.arqSeg.forEach((a) => L.push('- arquivo de senha: `' + a + '`'));
        r.segredos.forEach((s) => L.push('- `' + s.arq + '`' + (s.linha ? ' linha ' + s.linha : '') + ' · ' + s.tipo + ': `' + mascarar(s.valor) + '`'));
        if (!r.segredos.length && !r.arqSeg.length) L.push('- nenhum'); L.push('');
      }
      L.push('## 🕰 Histórico de mudanças (do .git)', ''); if (r.remoto) L.push('GitHub: ' + r.remoto, '');
      r.historico.forEach((h) => L.push('- ' + h.quando.toLocaleString('pt-BR') + ' · ' + (h.msg || h.tipo) + ' (' + h.id + ')'));
      if (!r.historico.length) L.push('- (sem histórico)');
      return L.join('\n') + '\n';
    }
  }
  SK.faxina = { build, analisar, ehLixo, PADROES, mascarar };
})(window.SK);
