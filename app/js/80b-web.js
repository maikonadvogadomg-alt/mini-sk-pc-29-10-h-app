/* 🌐 Internet para a IA do Mini SK: pesquisar (DuckDuckGo, grátis, sem chave) e ler links.
   O navegador não deixa uma página ler outros sites direto (a trava "CORS"). Então tenta, nesta ordem:
   1. 📦 dentro do APK: o próprio Android busca (AndroidBridge.buscar)
   2. 💻 no Mini SK para PC: o programa busca (miniskPC.buscar)
   3. direto (sites que deixam)
   4. leitores públicos grátis (r.jina.ai, allorigins) que devolvem a página para o navegador
   Se tudo falhar na pesquisa, usa a Wikipédia (que sempre deixa). */
(function (SK) {
  'use strict';
  const ESPERA = 25000;
  const pend = {};
  let seq = 0;
  const antes = window.__buscaFim;
  window.__buscaFim = function (id, ok, texto) {
    const p = pend[id];
    if (p) { delete pend[id]; clearTimeout(p.t); p.ok({ ok: !!ok, texto: String(texto || '') }); return; }
    if (typeof antes === 'function') try { antes(id, ok, texto); } catch (e) {}
  };

  function porAndroid(url) {
    return new Promise((ok) => {
      const id = 'b' + (++seq) + '-' + Date.now();
      pend[id] = { ok, t: setTimeout(() => { delete pend[id]; ok({ ok: false, texto: 'demorou demais' }); }, ESPERA) };
      try { window.AndroidBridge.buscar(id, url); } catch (e) { clearTimeout(pend[id].t); delete pend[id]; ok({ ok: false, texto: e.message }); }
    });
  }
  async function comTempo(url, init, ms) {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), ms || 15000);
    try { return await fetch(url, Object.assign({}, init, { signal: c.signal })); } finally { clearTimeout(t); }
  }

  /** Busca o texto de um endereço. Devolve { ok, texto, via, html } (html = true quando veio o HTML da página). */
  async function texto(url) {
    const erros = [];
    if (window.AndroidBridge && typeof window.AndroidBridge.buscar === 'function') {
      const r = await porAndroid(url);
      if (r.ok && r.texto) return { ok: true, texto: r.texto, via: 'Android', html: true };
      erros.push('Android: ' + r.texto);
    }
    if (window.miniskPC && typeof window.miniskPC.buscar === 'function') {
      try { const r = await window.miniskPC.buscar(url); if (r && r.ok && r.texto) return { ok: true, texto: r.texto, via: 'PC', html: true }; erros.push('PC: ' + ((r && r.texto) || 'falhou')); } catch (e) { erros.push('PC: ' + e.message); }
    }
    try { const r = await comTempo(url, {}, 10000); if (r.ok) { const t = await r.text(); if (t) return { ok: true, texto: t, via: 'direto', html: true }; } else erros.push('direto: HTTP ' + r.status); } catch (e) { erros.push('direto: bloqueado'); }
    try { const r = await comTempo('https://r.jina.ai/' + url, { headers: { 'X-Return-Format': 'html' } }, 15000); if (r.ok) { const t = await r.text(); if (t) return { ok: true, texto: t, via: 'leitor', html: /<a\s|<div|<p[\s>]/i.test(t) }; } else erros.push('leitor: HTTP ' + r.status); } catch (e) { erros.push('leitor: ' + (e.name === 'AbortError' ? 'demorou' : 'bloqueado')); }
    try { const r = await comTempo('https://api.allorigins.win/raw?url=' + encodeURIComponent(url), {}, 12000); if (r.ok) { const t = await r.text(); if (t) return { ok: true, texto: t, via: 'allorigins', html: true }; } else erros.push('allorigins: HTTP ' + r.status); } catch (e) { erros.push('allorigins: bloqueado'); }
    return { ok: false, texto: erros.join(' · '), via: '' };
  }

  const limpar = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  function linkReal(h) {
    try {
      if (!h) return '';
      if (h.startsWith('//')) h = 'https:' + h;
      const u = new URL(h, 'https://duckduckgo.com');
      const real = u.searchParams.get('uddg');
      if (real) return real;
      return /duckduckgo\.com$/.test(u.hostname) ? '' : u.href;
    } catch (e) { return ''; }
  }
  function lerResultadosHTML(t) {
    const doc = new DOMParser().parseFromString(t, 'text/html');
    const out = [];
    // html.duckduckgo.com
    doc.querySelectorAll('.result').forEach((r) => {
      if (r.classList.contains('result--ad')) return;
      const a = r.querySelector('a.result__a'); if (!a) return;
      const url = linkReal(a.getAttribute('href'));
      if (url) out.push({ titulo: limpar(a.textContent), url, trecho: limpar((r.querySelector('.result__snippet') || {}).textContent) });
    });
    // lite.duckduckgo.com
    if (!out.length) doc.querySelectorAll('a.result-link').forEach((a) => {
      const url = linkReal(a.getAttribute('href')); if (!url) return;
      const tr = a.closest('tr'); let trecho = '';
      let n = tr && tr.nextElementSibling; for (let i = 0; n && i < 2; i++, n = n.nextElementSibling) { const s = n.querySelector('.result-snippet'); if (s) { trecho = limpar(s.textContent); break; } }
      out.push({ titulo: limpar(a.textContent), url, trecho });
    });
    return out;
  }
  function lerResultadosMD(t) {
    const out = [], vistos = new Set();
    const re = /\[([^\]\n]{3,200})\]\((https?:[^)\s]+)\)/g; let m;
    while ((m = re.exec(t))) {
      const url = linkReal(m[2]); if (!url || vistos.has(url) || /duckduckgo\.com/.test(url)) continue;
      vistos.add(url);
      const depois = t.slice(re.lastIndex, re.lastIndex + 400).split('\n').map(limpar).find((l) => l && !/^\[|^!\[|^https?:/.test(l)) || '';
      out.push({ titulo: limpar(m[1]).replace(/^#+\s*/, ''), url, trecho: depois.slice(0, 300) });
    }
    return out;
  }

  async function wikipedia(q) {
    try {
      const r = await comTempo('https://pt.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=5&srsearch=' + encodeURIComponent(q), {}, 12000);
      const j = await r.json();
      return ((j.query || {}).search || []).map((x) => ({ titulo: x.title, url: 'https://pt.wikipedia.org/wiki/' + encodeURIComponent(x.title.replace(/ /g, '_')), trecho: limpar(String(x.snippet || '').replace(/<[^>]+>/g, '')) }));
    } catch (e) { return []; }
  }

  /** 🔎 Pesquisa: devolve { fonte, resultados: [{titulo, url, trecho}], erro } */
  async function pesquisar(q, max) {
    q = limpar(q); max = max || 6;
    if (!q) return { fonte: '', resultados: [], erro: 'pesquisa vazia' };
    const tentativas = ['https://html.duckduckgo.com/html/?kl=br-pt&q=' + encodeURIComponent(q), 'https://lite.duckduckgo.com/lite/?kl=br-pt&q=' + encodeURIComponent(q)];
    let erro = '';
    for (const u of tentativas) {
      const r = await texto(u);
      if (!r.ok) { erro = r.texto; continue; }
      let lista = r.html ? lerResultadosHTML(r.texto) : [];
      if (!lista.length) lista = lerResultadosMD(r.texto);
      if (lista.length) return { fonte: 'DuckDuckGo (' + r.via + ')', resultados: lista.slice(0, max) };
      erro = 'o DuckDuckGo não mandou resultados (via ' + r.via + ')';
    }
    const w = await wikipedia(q);
    if (w.length) return { fonte: 'Wikipédia (o DuckDuckGo não respondeu daqui)', resultados: w.slice(0, max) };
    return { fonte: '', resultados: [], erro: erro || 'nenhum resultado' };
  }

  /** 📄 Lê uma página e devolve { ok, titulo, texto, via } (só o texto, sem menus e propaganda). */
  async function lerPagina(url, limite) {
    limite = limite || 6000;
    const r = await texto(url);
    if (!r.ok) return { ok: false, titulo: '', texto: r.texto, via: '' };
    let titulo = '', corpo = r.texto;
    if (r.html && /<\/?[a-z][\s\S]*>/i.test(corpo)) {
      const doc = new DOMParser().parseFromString(corpo, 'text/html');
      titulo = limpar((doc.querySelector('title') || {}).textContent);
      doc.querySelectorAll('script,style,noscript,svg,nav,footer,header,aside,form,iframe,button,[aria-hidden="true"]').forEach((e) => e.remove());
      const raiz = doc.querySelector('article') || doc.querySelector('main') || doc.body || doc.documentElement;
      const blocos = [];
      raiz.querySelectorAll('h1,h2,h3,h4,p,li,pre,blockquote,td,th,dt,dd').forEach((e) => { const t = limpar(e.textContent); if (t && t.length > 1) blocos.push(/^H\d/.test(e.tagName) ? '## ' + t : t); });
      corpo = blocos.length ? [...new Set(blocos)].join('\n') : limpar(raiz.textContent);
    } else {
      const m = /^Title:\s*(.+)$/m.exec(corpo); if (m) titulo = m[1].trim();
    }
    corpo = corpo.replace(/\n{3,}/g, '\n\n').trim();
    return { ok: true, titulo, texto: corpo.length > limite ? corpo.slice(0, limite) + '\n…(cortado)' : corpo, via: r.via };
  }

  /** Monta o bloco que vai para a IA: resultados + o texto das primeiras páginas. */
  async function blocoPesquisa(q, lerQuantas) {
    const p = await pesquisar(q);
    if (!p.resultados.length) return { n: 0, texto: '🌐 PESQUISA NA INTERNET: "' + q + '" — não consegui pesquisar (' + (p.erro || 'sem resultado') + '). Responda com o que você já sabe e avise que não deu para conferir na internet.' };
    const linhas = ['🌐 RESULTADOS DA PESQUISA NA INTERNET — "' + q + '" — fonte: ' + p.fonte];
    p.resultados.forEach((x, i) => linhas.push((i + 1) + '. ' + x.titulo + '\n   ' + x.url + (x.trecho ? '\n   ' + x.trecho : '')));
    const ler = p.resultados.slice(0, lerQuantas == null ? 2 : lerQuantas);
    const paginas = await Promise.all(ler.map((x) => lerPagina(x.url, 3500).catch(() => ({ ok: false }))));
    paginas.forEach((pg, i) => { if (pg.ok && pg.texto) linhas.push('\n--- CONTEÚDO DE ' + ler[i].url + (pg.titulo ? ' (' + pg.titulo + ')' : '') + ' ---\n' + pg.texto); });
    linhas.push('\nUse estes resultados para responder. Cite os links que usou no fim (Fontes:).');
    return { n: p.resultados.length, texto: linhas.join('\n') };
  }
  async function blocoLink(url) {
    const pg = await lerPagina(url, 12000);
    if (!pg.ok) return { ok: false, texto: '🌐 LINK: ' + url + ' — não consegui abrir (' + pg.texto + ').' };
    return { ok: true, texto: '🌐 PÁGINA ABERTA: ' + url + (pg.titulo ? ' — ' + pg.titulo : '') + ' (via ' + pg.via + ')\n' + pg.texto };
  }

  SK.web = { texto, pesquisar, lerPagina, blocoPesquisa, blocoLink, _lerResultadosHTML: lerResultadosHTML, _lerResultadosMD: lerResultadosMD };
})(window.SK);
