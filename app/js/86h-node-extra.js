/* =========================================================================
   Mini SK — 86h-node-extra.js
   Botões a mais no ⚡ Node (peça separada: se der problema, o Node continua igual):
   🔗 Árvore ligada — o que o Node cria/muda (dist, arquivos novos) aparece sozinho na árvore
   🤖 Chamar a IA · 🦙 Usar o Ollama · 👁 Ver na tela o que o npm run dev ligou
   ========================================================================= */
(function (SK) {
  'use strict';
  const PULAR = /(^|\/)(node_modules|\.git|\.sk|\.cache|\.vite)(\/|$)/;
  let servidor = null, vigia = null, fila = new Set(), tFila = 0, aplicando = false, caixa = null;
  const dec = new TextDecoder('utf-8', { fatal: true });
  function st(t, k) { const el = caixa && caixa.querySelector('#nx-status'); if (el) { el.textContent = t; el.style.color = k === 'erro' ? 'var(--danger,#e66)' : k === 'ok' ? 'var(--ok,#4c9)' : ''; } }
  async function puxar() {
    const wc = SK.node.wc; if (!wc || !SK.fs.project || !fila.size) return;
    const lista = [...fila]; fila.clear(); let novos = 0, mudou = 0, saiu = 0;
    aplicando = true;
    try {
      for (const p of lista) {
        if (PULAR.test(p)) continue;
        let bytes = null; try { bytes = await wc.fs.readFile(p); } catch { bytes = null; }
        if (bytes == null) { if (SK.fs.exists(p) && !SK.fs.isFolder(p)) { SK.fs.remove(p); saiu++; } continue; } // apagado no Node
        if (bytes.length > 5 * 1024 * 1024) continue;
        let texto = null; try { texto = dec.decode(bytes); } catch {}
        const antes = SK.fs.exists(p) ? SK.fs.get(p) : null;
        if (texto != null) { if (antes && antes.text === texto) continue; SK.fs.write(p, texto); }
        else { const b64 = SK.fs.toBase64(bytes); if (antes && antes.b64 === b64) continue; SK.fs.writeRecord(p, { b64, enc: 'binário', size: bytes.length }); }
        antes ? mudou++ : novos++;
      }
    } finally { aplicando = false; }
    if (novos + mudou + saiu) { st('🔗 Do Node para a árvore: ' + [novos && novos + ' novo(s)', mudou && mudou + ' mudado(s)', saiu && saiu + ' apagado(s)'].filter(Boolean).join(', ') + ' · ' + new Date().toLocaleTimeString('pt-BR'), 'ok'); }
  }
  function ligarArvore(on) {
    SK.pref.set('nodeArvore', !!on);
    if (vigia) { try { vigia.close(); } catch {} vigia = null; }
    if (!on) { st('Árvore desligada do Node (use ⬇ Trazer).'); return; }
    const wc = SK.node.wc; if (!wc) return;
    try {
      vigia = wc.fs.watch('.', { recursive: true }, (evento, nome) => {
        if (aplicando || !nome) return; const p = String(nome).replace(/^\.?\//, '');
        if (PULAR.test(p)) return; fila.add(p); clearTimeout(tFila); tFila = setTimeout(() => puxar().catch((e) => st('⚠ ' + e.message, 'erro')), 1200);
      });
      st('🔗 Árvore ligada: o que o Node criar ou mudar aparece sozinho na árvore.', 'ok');
    } catch (e) { st('⚠ Não deu para ligar a árvore (' + e.message + '). Use ⬇ Trazer.', 'erro'); }
  }
  function montar(ligado) {
    if (caixa || !ligado) return;
    caixa = document.createElement('div'); caixa.className = 'stack'; caixa.id = 'node-extra';
    caixa.innerHTML =
      '<label class="small"><input type="checkbox" id="nx-arvore"> <b>🔗 Árvore ligada</b> — o que o Node cria (ex.: a pasta dist) aparece sozinho na árvore</label>' +
      '<div class="row wrap"><button class="btn small primary" id="nx-ver">👁 Ver na tela</button><button class="btn small" id="nx-ia">🤖 Chamar a IA</button><button class="btn small" id="nx-ollama">🦙 Usar o Ollama</button></div>' +
      '<div id="nx-status" class="small muted"></div>';
    ligado.insertBefore(caixa, ligado.firstChild);
    const chk = caixa.querySelector('#nx-arvore'); chk.checked = SK.pref.get('nodeArvore', true);
    chk.onchange = () => ligarArvore(chk.checked);
    caixa.querySelector('#nx-ia').onclick = () => SK.app.openSide('ai');
    caixa.querySelector('#nx-ollama').onclick = () => { SK.app.openSide('ai'); SK.toast('🦙 Na 🤖 IA: ⚙️ Chaves → ＋ → "Ollama" → 🧪 Testar (o Ollama precisa estar ligado no aparelho).'); };
    caixa.querySelector('#nx-ver').onclick = () => {
      if (!servidor) { SK.toast('Primeiro rode o servidor: ▶ npm run dev (nos Comandos prontos). Quando ele ligar, eu mostro aqui.'); return; }
      const f = document.querySelector('#node-prev'); if (f) { f.hidden = false; if (!f.src) f.src = servidor.url; f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    };
    if (chk.checked) ligarArvore(true);
  }
  // quando o painel do Node mostra a parte de baixo (depois do "✅ Node ligado"), põe os botões
  new MutationObserver(() => { const l = document.querySelector('#node-ligado'); if (l && !l.hidden && SK.node.wc) { if (!caixa || !document.body.contains(caixa)) { caixa = null; montar(l); } } }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden'], childList: true });
  SK.on('node-servidor', (s) => { servidor = s; const b = caixa && caixa.querySelector('#nx-ver'); if (b) b.textContent = '👁 Ver na tela (porta ' + s.porta + ')'; });
  SK.nodeExtra = { ligarArvore, puxar };
})(window.SK);
