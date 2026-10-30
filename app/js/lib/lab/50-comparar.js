/* Laboratório — 50-comparar.js: ⚖️ A (o que funciona) × B (o que não funciona), lado a lado.
   Mostra arquivos novos/sumidos/mudados, as funções que mudaram e os problemas que só existem em B. */
(function (LB) {
  'use strict';
  const E = LB.esc;
  let espacos = true;
  function diff(a, b) {   // Myers (o mesmo do Comparar do Laboratório)
    const norm = (l) => (espacos ? l.replace(/\s+/g, ' ').trim() : l);
    const A = a.split('\n'), B = b.split('\n'), na = A.map(norm), nb = B.map(norm);
    let ini = 0; while (ini < na.length && ini < nb.length && na[ini] === nb[ini]) ini++;
    let fa = na.length, fb = nb.length; while (fa > ini && fb > ini && na[fa - 1] === nb[fb - 1]) { fa--; fb--; }
    const X = na.slice(ini, fa), Y = nb.slice(ini, fb), N = X.length, M = Y.length, MAX = N + M;
    if (MAX > 40000) return { muitoGrande: true };
    const v = new Int32Array(2 * MAX + 2), trilha = []; let fim = -1;
    for (let d = 0; d <= MAX; d++) {
      trilha.push(v.slice());
      for (let k = -d; k <= d; k += 2) { let x = (k === -d || (k !== d && v[MAX + k - 1] < v[MAX + k + 1])) ? v[MAX + k + 1] : v[MAX + k - 1] + 1; let y = x - k; while (x < N && y < M && X[x] === Y[y]) { x++; y++; } v[MAX + k] = x; if (x >= N && y >= M) { fim = d; break; } }
      if (fim >= 0) break; if (d > 4000) return { muitoDiferente: true };
    }
    const ops = []; let x = N, y = M;
    for (let d = fim; d > 0; d--) { const vv = trilha[d], k = x - y; const kA = (k === -d || (k !== d && vv[MAX + k - 1] < vv[MAX + k + 1])) ? k + 1 : k - 1; const xA = vv[MAX + kA], yA = xA - kA; while (x > xA && y > yA) { ops.push(['=', ini + x - 1, ini + y - 1]); x--; y--; } if (x === xA) ops.push(['+', -1, ini + y - 1]); else ops.push(['-', ini + x - 1, -1]); x = xA; y = yA; }
    while (x > 0 && y > 0) { ops.push(['=', ini + x - 1, ini + y - 1]); x--; y--; }
    ops.reverse();
    const L = []; for (let i = 0; i < ini; i++) L.push({ t: '=', a: i + 1, b: i + 1, sa: A[i], sb: B[i] });
    for (const [t, i, j] of ops) L.push(t === '+' ? { t, b: j + 1, sb: B[j] } : t === '-' ? { t, a: i + 1, sa: A[i] } : { t, a: i + 1, b: j + 1, sa: A[i], sb: B[j] });
    for (let i = fa, j = fb; i < A.length; i++, j++) L.push({ t: '=', a: i + 1, b: j + 1, sa: A[i], sb: B[j] });
    return { linhas: L, mais: L.filter((l) => l.t === '+').length, menos: L.filter((l) => l.t === '-').length };
  }
  // lado a lado: junta "saiu" e "entrou" na mesma altura; só os trechos que mudaram (3 linhas em volta)
  function ladoAlado(r) {
    if (r.muitoGrande || r.muitoDiferente) return '<p class="muted" style="padding:8px">Arquivo grande/diferente demais para mostrar linha por linha.</p>';
    const L = r.linhas, mostrar = new Array(L.length).fill(false);
    L.forEach((l, i) => { if (l.t !== '=') for (let j = Math.max(0, i - 3); j <= Math.min(L.length - 1, i + 3); j++) mostrar[j] = true; });
    const lin = (n, s, cls) => '<div class="l ' + cls + '"><span class="n">' + (n || '') + '</span>' + E(s == null ? '' : s) + '</div>';
    let h = '<p class="legenda pequeno muted" style="padding:4px 8px;margin:0">🟥 vermelho = como era em A · 🟩 verde = como ficou em B</p><div class="lado"><div class="cab">A (funciona)</div><div class="cab">B</div>'; let ant = -2, i = 0;
    while (i < L.length) {
      if (!mostrar[i]) { i++; continue; }
      if (ant !== i - 1) h += '<div class="sep">⋯ linha ' + (L[i].a || L[i].b) + ' ⋯</div>';
      if (L[i].t === '=') { h += lin(L[i].a, L[i].sa, '') + lin(L[i].b, L[i].sb, 'igualB'); ant = i; i++; continue; }
      const sai = [], entra = []; while (i < L.length && L[i].t !== '=') { (L[i].t === '-' ? sai : entra).push(L[i]); ant = i; i++; }
      for (let k = 0; k < Math.max(sai.length, entra.length); k++) h += (sai[k] ? lin(sai[k].a, sai[k].sa, 'menos') : lin('', '', 'vazio')) + (entra[k] ? lin(entra[k].b, entra[k].sb, 'mais') : lin('', '', 'vazio'));
    }
    return h + '</div>';
  }
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  LB.comparar = (pa, pb) => {
    const A = pa.arquivos, B = pb.arquivos, nomes = [...new Set(Object.keys(A).concat(Object.keys(B)))].sort();
    const r = { a: pa.nome, b: pb.nome, novos: [], sumiram: [], mudaram: [], iguais: 0, funcoes: { novas: [], sumiram: [], mudaram: [] }, problemasSoB: [], problemasSoA: [] };
    for (const c of nomes) {
      if (!A[c]) { r.novos.push(c); continue; } if (!B[c]) { r.sumiram.push(c); continue; }
      const ta = A[c].t, tb = B[c].t;
      if (ta == null || tb == null) { if ((A[c].b || 0) !== (B[c].b || 0)) r.mudaram.push({ c, bin: true }); else r.iguais++; continue; }
      if ((espacos ? norm(ta) === norm(tb) : ta === tb)) { r.iguais++; continue; }
      const d = diff(ta, tb); r.mudaram.push({ c, d, mais: d.mais || 0, menos: d.menos || 0 });
    }
    // funções e problemas (analisando os dois projetos inteiros)
    const ra = LB.analisar(pa), rb = LB.analisar(pb);
    const chave = (f) => f.arquivo.replace(/ \(script da linha \d+\)/, ' (script)') + ' › ' + f.nome;
    const fa = Object.create(null), fb = Object.create(null); for (const f of ra.funcoes) fa[chave(f)] = f; for (const f of rb.funcoes) fb[chave(f)] = f;
    // função que só MUDOU DE ARQUIVO (ex.: ao modularizar) não "sumiu": acha pelo nome
    const porNomeA = Object.create(null), porNomeB = Object.create(null);
    for (const f of ra.funcoes) (porNomeA[f.nome] = porNomeA[f.nome] || []).push(f);
    for (const f of rb.funcoes) (porNomeB[f.nome] = porNomeB[f.nome] || []).push(f);
    r.funcoes.mudouDeLugar = [];
    const par = (f, lista) => (lista || []).find((g) => g.corpo != null && f.corpo != null && norm(g.corpo) === norm(f.corpo)) || (lista && lista.length === 1 ? lista[0] : null);
    for (const k of Object.keys(fb)) if (!fa[k]) { const g = par(fb[k], porNomeA[fb[k].nome]); if (!g) r.funcoes.novas.push(fb[k]); }
    for (const k of Object.keys(fa)) if (!fb[k]) {
      const g = par(fa[k], porNomeB[fa[k].nome]);
      if (!g) r.funcoes.sumiram.push(fa[k]);
      else if (fa[k].corpo != null && g.corpo != null && norm(fa[k].corpo) !== norm(g.corpo)) r.funcoes.mudaram.push({ a: fa[k], b: g });
      else r.funcoes.mudouDeLugar.push({ a: fa[k], b: g });
    }
    for (const k of Object.keys(fa)) if (fb[k] && fa[k].corpo != null && norm(fa[k].corpo) !== norm(fb[k].corpo)) r.funcoes.mudaram.push({ a: fa[k], b: fb[k] });
    const ta = new Set(ra.problemas.map((p) => p.texto)), tb = new Set(rb.problemas.map((p) => p.texto));
    r.problemasSoB = rb.problemas.filter((p) => !ta.has(p.texto)); r.problemasSoA = ra.problemas.filter((p) => !tb.has(p.texto));
    r.ra = ra; r.rb = rb;
    return r;
  };
  LB.mostrarComparacao = (r) => {
    const linhaF = (f) => '<li><code>' + E(f.nome) + '</code> <span class="muted">— ' + E(f.arquivo) + ':' + f.ini + ' · ' + E(f.faz) + '</span></li>';
    let h = '<div class="card"><h2>Resumo: ' + E(r.a) + ' (A) × ' + E(r.b) + ' (B)</h2><div class="linha">' +
      '<span class="chip">✏️ ' + r.mudaram.length + ' mudado(s)</span><span class="chip ad">➕ ' + r.novos.length + ' novo(s) em B</span><span class="chip rm">➖ ' + r.sumiram.length + ' sumiram em B</span><span class="chip">= ' + r.iguais + ' igual(is)</span></div>';
    // onde pode estar o defeito
    const graveB = r.problemasSoB.filter((p) => p.grave);
    h += '<h2 style="margin-top:12px">🔎 Onde pode estar o defeito</h2><ul>' +
      (graveB.length ? graveB.map((p) => '<li class="rm">🔴 Só em B: ' + E(p.texto) + '</li>').join('') : '<li class="muted">Nenhum problema grave novo em B (o defeito pode estar numa mudança de lógica — veja as funções mudadas).</li>') +
      r.problemasSoB.filter((p) => !p.grave).slice(0, 8).map((p) => '<li class="mu">🟡 Só em B: ' + E(p.texto) + '</li>').join('') +
      (r.funcoes.mudaram.length ? '<li>✏️ ' + r.funcoes.mudaram.length + ' função(ões) mudaram por dentro: ' + r.funcoes.mudaram.slice(0, 12).map((x) => '<code>' + E(x.b.nome) + '</code>').join(', ') + (r.funcoes.mudaram.length > 12 ? '…' : '') + '</li>' : '') +
      (r.funcoes.sumiram.length ? '<li class="rm">➖ ' + r.funcoes.sumiram.length + ' função(ões) que existiam em A e sumiram em B: ' + r.funcoes.sumiram.slice(0, 12).map((f) => '<code>' + E(f.nome) + '</code>').join(', ') + '</li>' : '') +
      (r.funcoes.mudouDeLugar && r.funcoes.mudouDeLugar.length ? '<li class="ad">🚚 ' + r.funcoes.mudouDeLugar.length + ' função(ões) só mudaram de arquivo e estão IGUAIS por dentro (normal ao modularizar).</li>' : '') +
      '</ul></div>';
    if (r.funcoes.mudaram.length || r.funcoes.novas.length || r.funcoes.sumiram.length) {
      h += '<div class="card"><h2>⚙️ Funções</h2>';
      if (r.funcoes.mudaram.length) h += '<b>Mudaram por dentro (' + r.funcoes.mudaram.length + ')</b><ul>' + r.funcoes.mudaram.slice(0, 80).map((x) => linhaF(x.b)).join('') + '</ul>';
      if (r.funcoes.sumiram.length) h += '<b class="rm">Sumiram em B (' + r.funcoes.sumiram.length + ')</b><ul>' + r.funcoes.sumiram.slice(0, 80).map(linhaF).join('') + '</ul>';
      if (r.funcoes.novas.length) h += '<b class="ad">Novas em B (' + r.funcoes.novas.length + ')</b><ul>' + r.funcoes.novas.slice(0, 80).map(linhaF).join('') + '</ul>';
      h += '</div>';
    }
    h += '<h2>📄 Arquivos que mudaram <span class="muted pequeno">(toque para ver lado a lado)</span></h2>';
    h += r.mudaram.map((m, i) => '<details class="arq" data-i="' + i + '"><summary><b>' + E(m.c) + '</b>' + (m.bin ? '<span class="chip">binário (tamanho mudou)</span>' : '<span class="ad">+' + m.mais + '</span><span class="rm">−' + m.menos + '</span>') + '</summary><div class="corpo"></div></details>').join('') || '<p class="muted">Nenhum.</p>';
    if (r.novos.length) h += '<div class="card"><b class="ad">➕ Só em B:</b> ' + r.novos.map((c) => '<code>' + E(c) + '</code>').join(', ') + '</div>';
    if (r.sumiram.length) h += '<div class="card"><b class="rm">➖ Só em A (sumiram em B):</b> ' + r.sumiram.map((c) => '<code>' + E(c) + '</code>').join(', ') + '</div>';
    const el = LB.$('#v-cmp'); el.innerHTML = h;
    el.querySelectorAll('details.arq').forEach((d) => d.addEventListener('toggle', () => { const c = d.querySelector('.corpo'); if (d.open && !c.innerHTML) { const m = r.mudaram[+d.dataset.i]; c.innerHTML = m.bin ? '<p class="muted" style="padding:8px">Arquivo binário (imagem etc.).</p>' : ladoAlado(m.d); } }));
  };
  LB.comparacaoMD = (r) => {
    const L = ['# ⚖️ Comparação — A: ' + r.a + ' × B: ' + r.b, '', '> A = a versão que funciona · B = a que não funciona. Gerado pelo 🔬 Laboratório em ' + new Date().toLocaleString('pt-BR') + '.', '',
      '## Resumo', '', '- Mudaram: ' + r.mudaram.length + ' · Novos em B: ' + r.novos.length + ' · Sumiram em B: ' + r.sumiram.length + ' · Iguais: ' + r.iguais, '',
      '## Onde pode estar o defeito', ''];
    if (r.problemasSoB.length) for (const p of r.problemasSoB) L.push('- ' + (p.grave ? '🔴' : '🟡') + ' Só em B: ' + p.texto); else L.push('- Nenhum problema novo detectado em B.');
    if (r.funcoes.mudaram.length) L.push('- Funções que mudaram por dentro: ' + r.funcoes.mudaram.map((x) => '`' + x.b.nome + '` (' + x.b.arquivo + ':' + x.b.ini + ')').join(', '));
    if (r.funcoes.sumiram.length) L.push('- Funções que sumiram em B: ' + r.funcoes.sumiram.map((f) => '`' + f.nome + '` (' + f.arquivo + ')').join(', '));
    if (r.funcoes.mudouDeLugar && r.funcoes.mudouDeLugar.length) L.push('- ' + r.funcoes.mudouDeLugar.length + ' função(ões) só mudaram de arquivo (iguais por dentro).');
    if (r.funcoes.novas.length) L.push('- Funções novas em B: ' + r.funcoes.novas.map((f) => '`' + f.nome + '` (' + f.arquivo + ')').join(', '));
    L.push('', '## Arquivos que mudaram', '');
    for (const m of r.mudaram) {
      L.push('### ' + m.c + (m.bin ? ' (binário)' : ' (+' + m.mais + ' −' + m.menos + ')'), '');
      if (m.bin || !m.d.linhas) continue;
      L.push('```diff'); let n = 0; const Ls = m.d.linhas; const mostrar = new Array(Ls.length).fill(false);
      Ls.forEach((l, i) => { if (l.t !== '=') for (let j = Math.max(0, i - 2); j <= Math.min(Ls.length - 1, i + 2); j++) mostrar[j] = true; });
      let ant = -2; for (let i = 0; i < Ls.length && n < 400; i++) { if (!mostrar[i]) continue; if (ant !== i - 1) L.push('@@ linha ' + (Ls[i].a || Ls[i].b) + ' @@'); const l = Ls[i]; L.push((l.t === '=' ? ' ' : l.t) + ' ' + (l.t === '+' ? l.sb : l.sa)); ant = i; n++; }
      if (n >= 400) L.push('… (cortado: mudança muito grande)'); L.push('```', '');
    }
    if (r.novos.length) L.push('## Só em B', '', r.novos.map((c) => '- `' + c + '`').join('\n'), '');
    if (r.sumiram.length) L.push('## Sumiram em B', '', r.sumiram.map((c) => '- `' + c + '`').join('\n'), '');
    L.push('## Pedido pronto para a IA', '', '```', 'A versão A funciona e a B não. Acima estão todas as diferenças entre elas.', 'Me diga qual mudança mais provavelmente causou o defeito e me devolva o arquivo INTEIRO consertado (sem me pedir para trocar pedaços), mantendo as melhorias novas da B.', '```');
    return L.join('\n');
  };
  LB.setEspacos = (v) => { espacos = v; };
})(window.LB);
