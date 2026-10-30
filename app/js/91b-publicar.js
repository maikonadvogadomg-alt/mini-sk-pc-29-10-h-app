/* =========================================================================
   Mini SK — 91b-publicar.js
   🚀 PUBLICAR — um botão para cada coisa (igual ao APK Builder):
   🌐 Site / PWA (GitHub Pages) · 📦 APK · 💻 .exe
   E a lista 📜 MINHAS PUBLICAÇÕES: o link fica guardado e NÃO some quando
   você sai para testar e volta (fica salvo mesmo fechando o Mini SK).
   ========================================================================= */
(function (SK) {
  'use strict';
  const fs = () => SK.fs;
  const hist = () => SK.pref.get('publicacoes', []);
  function guardar(item) { const h = hist(); h.unshift(Object.assign({ quando: Date.now(), projeto: fs().project ? fs().project.name : '' }, item)); SK.pref.set('publicacoes', h.slice(0, 80)); }
  let box = null;
  const $ = (s) => SK.$(s, box);
  function st(t, k) { const el = $('#pub-status'); if (!el) return; el.textContent = t; el.className = 'gh-status ' + (k || ''); }

  function pintarHist() {
    const el = box && $('#pub-hist'); if (!el) return;
    const h = hist();
    el.innerHTML = h.length ? h.map((x, i) =>
      '<div class="stack" style="border:1px solid var(--line2,#333);border-radius:10px;padding:8px;margin-bottom:6px">' +
      '<div class="row wrap"><b>' + ({ site: '🌐 Site / PWA', apk: '📦 APK', exe: '💻 .exe' }[x.tipo] || x.tipo) + '</b><span class="muted small">' + SK.esc(x.projeto || '') + ' · ' + new Date(x.quando).toLocaleString('pt-BR') + '</span></div>' +
      (x.link ? '<div class="small" style="overflow-wrap:anywhere"><a href="' + SK.esc(x.link) + '" target="_blank" rel="noopener">' + SK.esc(x.link) + '</a></div>' : '') +
      (x.nota ? '<div class="small muted">' + SK.esc(x.nota) + '</div>' : '') +
      '<div class="row wrap">' + (x.link ? '<a class="btn small primary" href="' + SK.esc(x.link) + '" target="_blank" rel="noopener">↗ Abrir</a><button class="btn small" data-copiar="' + i + '">📋 Copiar</button>' : '') +
      (x.acoes ? '<a class="btn small" href="' + SK.esc(x.acoes) + '" target="_blank" rel="noopener">⚙️ Ver no GitHub (Actions)</a>' : '') +
      (x.baixar ? '<a class="btn small" href="' + SK.esc(x.baixar) + '" target="_blank" rel="noopener">⬇ Onde baixar (Releases)</a>' : '') +
      '<button class="btn small" data-tirar="' + i + '">🗑</button></div></div>').join('')
      : '<p class="muted small">Nada publicado ainda. O que você publicar aqui fica guardado nesta lista.</p>';
  }

  async function publicarSite() {
    if (!fs().project) throw new Error('Abra um projeto primeiro.');
    if (!SK.github.token) throw new Error('Falta o token do GitHub: abra 🐙 GitHub, cole o token uma vez e volte aqui.');
    const nome = ($('#pub-repo').value.trim() || fs().project.name);
    if ($('#pub-pwa').checked && fs().exists('index.html') && !fs().exists('manifest.json') && !fs().exists('manifest.webmanifest')) {
      st('1/3 Deixando instalável (PWA: ícones, manifest, service worker)…');
      const n = fs().project.name;
      await SK.pwa.makeInstallable('index.html', { name: n, short: n.slice(0, 12), theme: '#0f172a', bg: '#0f172a', display: 'standalone', orientation: 'any', offline: true });
    }
    st('2/3 Mandando o projeto para o GitHub…');
    const r = await SK.github.sendTo(nome, 'Publicar site (Mini SK)', { mirror: true, includeSk: false });
    st('3/3 Ligando o site (GitHub Pages)…');
    let info = {}; try { info = await SK.github.gh('/repos/' + r.owner + '/' + r.repo); } catch {}
    const url = await SK.github.enablePages(r.owner, r.repo, info.default_branch || 'main');
    guardar({ tipo: 'site', link: url, acoes: 'https://github.com/' + r.owner + '/' + r.repo + '/actions', nota: (info.private ? '⚠ O repositório é privado: no plano grátis o site só abre se for público. ' : '') + 'O site fica pronto em 1–2 minutos. Para instalar como app: abra o link no Chrome → menu ⋮ → Instalar app.' });
    st('✅ Publicado! O link está guardado aqui embaixo (não some).', 'ok');
    pintarHist();
  }
  async function ondePegar(tipo) {
    if (!fs().project) throw new Error('Abra um projeto primeiro.');
    if (!SK.github.token) throw new Error('Falta o token do GitHub: abra 🐙 GitHub, cole o token uma vez e volte aqui.');
    const r = await SK.github.resolveRepo($('#pub-repo').value.trim() || fs().project.name);
    const base = 'https://github.com/' + r.owner + '/' + r.repo;
    guardar({ tipo, link: '', acoes: base + '/actions', baixar: base + '/releases', nota: tipo === 'apk' ? 'O APK é feito no GitHub (Actions). Quando ficar verde ✔, ele aparece em Releases ou em Artifacts.' : 'O .exe é feito no GitHub (Actions → Programa .exe para Windows). Verde ✔ → Artifacts/Releases.' });
    pintarHist();
  }

  // 🚀 TUDO DE UMA VEZ: manda o projeto UMA vez e pede ao GitHub a página, o APK e o .exe
  async function tudo() {
    if (!fs().project) throw new Error('Abra um projeto primeiro.');
    if (!SK.github.token) throw new Error('Falta o token do GitHub: abra 🐙 GitHub, cole o token uma vez e volte aqui.');
    const querSite = $('#pub-t-site').checked, querApk = $('#pub-t-apk').checked, querExe = $('#pub-t-exe').checked;
    if (!querSite && !querApk && !querExe) throw new Error('Marque pelo menos uma coisa.');
    await SK.apk.conferirProjeto((querSite ? 'site + ' : '') + (querApk ? 'APK + ' : '') + (querExe ? '.exe' : '').replace(/ \+ $/, ''));
    const nome = $('#pub-repo').value.trim() || fs().project.name;
    const notas = [];
    if (querSite && fs().exists('index.html') && !fs().exists('manifest.json') && !fs().exists('manifest.webmanifest') && $('#pub-pwa').checked) {
      st('1/4 Deixando instalável (PWA)…'); const n = fs().project.name;
      await SK.pwa.makeInstallable('index.html', { name: n, short: n.slice(0, 12), theme: '#0f172a', bg: '#0f172a', display: 'standalone', orientation: 'any', offline: true });
    }
    if (querApk) { st('1/4 Preparando o APK…'); try { await SK.apk.prepare(SK.apk.readCfg()); } catch (e) { notas.push('APK: ' + e.message); } }
    if (querExe) { st('1/4 Preparando o .exe…'); try { await SK.apk.prepararExe(); } catch (e) { notas.push('.exe: ' + e.message); } }
    st('2/4 Mandando o projeto para o GitHub (uma vez só)…');
    const r = await SK.github.sendTo(nome, 'Publicar tudo (Mini SK)', { mirror: true, includeSk: true });
    let info = {}; try { info = await SK.github.gh('/repos/' + r.owner + '/' + r.repo); } catch {}
    const branch = info.default_branch || 'main', base = 'https://github.com/' + r.owner + '/' + r.repo;
    if (querSite) {
      st('3/4 Ligando a página (GitHub Pages)…');
      if (!fs().exists('index.html')) notas.push('Página: o projeto não tem index.html na raiz — não liguei o site.');
      else { const url = await SK.github.enablePages(r.owner, r.repo, branch); guardar({ tipo: 'site', link: url, acoes: base + '/settings/pages', nota: (info.private ? '⚠ Repositório privado: no plano grátis o site só abre se for público. ' : '') + 'Fica pronto em 1–2 minutos.' }); }
    }
    st('4/4 Pedindo ao GitHub para montar…');
    if (querApk) { try { await SK.apk.despachar(r, 'apk.yml', branch); guardar({ tipo: 'apk', link: '', acoes: base + '/actions/workflows/apk.yml', baixar: base + '/releases', nota: 'Montando o APK (5–8 min). Verde ✔ → Releases.' }); } catch (e) { notas.push(e.message); } }
    if (querExe) { try { await SK.apk.despachar(r, SK.apk.EXE_WF, branch); guardar({ tipo: 'exe', link: '', acoes: base + '/actions/workflows/' + SK.apk.EXE_WF, baixar: base + '/releases', nota: 'Montando o .exe (5–10 min). Verde ✔ → Releases ou Artifacts.' }); } catch (e) { notas.push(e.message); } }
    pintarHist();
    st(notas.length ? '⚠ Feito, com avisos: ' + notas.join(' · ') : '✅ Mandei uma vez só e pedi tudo. Os links estão em 📜 Minhas publicações (abra ⚙️ Ver no GitHub para acompanhar).', notas.length ? 'error' : 'ok');
  }

  function build(el) {
    box = el;
    const nome = fs().project ? fs().project.name : '';
    el.innerHTML =
      '<p class="muted small">Um botão para cada coisa. O resultado fica guardado em <b>📜 Minhas publicações</b> — pode sair para testar e voltar, ele não some.</p>' +
      '<label class="small">Nome no GitHub (repositório) <input class="input" id="pub-repo" placeholder="' + SK.esc(nome) + '" style="width:100%" autocapitalize="off" spellcheck="false"></label>' +
      '<div class="stack" style="margin-top:8px">' +
      '<div style="border:1px solid var(--line2,#334);border-radius:12px;padding:10px"><b>🚀 Tudo de uma vez</b> <span class="small muted">(manda o projeto uma vez só)</span>' +
      '<div class="row wrap small" style="margin:6px 0"><label><input type="checkbox" id="pub-t-site" checked> 🌐 Página</label><label><input type="checkbox" id="pub-t-apk" checked> 📦 APK</label><label><input type="checkbox" id="pub-t-exe" checked> 💻 .exe</label></div>' +
      '<label class="small">Tipo do .exe <select class="input" id="pub-exe-tipo" style="width:100%">' + (SK.apk.opcoesTipoExe ? SK.apk.opcoesTipoExe() : '') + '</select></label>' +
      '<button class="btn primary" id="pub-tudo" style="font-size:16px;padding:12px;width:100%">🚀 Publicar tudo de uma vez</button></div>' +
      '<button class="btn" id="pub-site">🌐 Só a página / PWA</button>' +
      '<label class="small"><input type="checkbox" id="pub-pwa" checked> Deixar instalável como app (cria ícones e manifest se faltar)</label>' +
      '<div class="row wrap"><button class="btn" id="pub-apk">📦 Gerar APK</button><button class="btn" id="pub-exe">💻 Gerar .exe</button></div>' +
      '<div class="small muted">📦 e 💻 abrem o painel de sempre; depois de mandar, toque em <b>📌 Guardar onde pego</b> para o link ficar aqui.</div>' +
      '<div class="row wrap"><button class="btn small" id="pub-onde-apk">📌 Guardar onde pego o APK</button><button class="btn small" id="pub-onde-exe">📌 Guardar onde pego o .exe</button></div>' +
      '</div>' +
      '<div class="gh-status" id="pub-status"></div>' +
      '<h4 style="margin:12px 0 6px">📜 Minhas publicações</h4><div id="pub-hist"></div>';
    const rodar = (fn) => fn().catch((e) => st('⚠ ' + e.message, 'error'));
    $('#pub-site').onclick = () => rodar(publicarSite);
    if ($('#pub-exe-tipo')) $('#pub-exe-tipo').onchange = (e) => SK.apk.guardarTipoExe(e.target.value);
    $('#pub-tudo').onclick = () => { const b = $('#pub-tudo'); b.disabled = true; rodar(tudo).finally(() => { b.disabled = false; }); };
    $('#pub-apk').onclick = () => SK.app.openSide('apk');
    $('#pub-exe').onclick = () => { SK.app.openSide('prep'); SK.toast('Marque "🖥️ Desktop: .exe" e toque em ✅ Fazer tudo; depois 🐙 GitHub → Enviar.'); };
    $('#pub-onde-apk').onclick = () => rodar(() => ondePegar('apk'));
    $('#pub-onde-exe').onclick = () => rodar(() => ondePegar('exe'));
    $('#pub-hist').addEventListener('click', async (e) => {
      const c = e.target.closest('[data-copiar]'); if (c) { const x = hist()[+c.dataset.copiar]; try { await navigator.clipboard.writeText(x.link); SK.toast('📋 Link copiado'); } catch { SK.prompt('Copie o link:', x.link); } }
      const t = e.target.closest('[data-tirar]'); if (t) { const h = hist(); h.splice(+t.dataset.tirar, 1); SK.pref.set('publicacoes', h); pintarHist(); }
    });
    pintarHist();
  }
  SK.on('project-open', () => { if (box) { const t = box.querySelector('#pub-exe-tipo'); if (t && SK.apk.opcoesTipoExe) t.innerHTML = SK.apk.opcoesTipoExe(); } });
  SK.on('project-open', () => { if (box) { const i = box.querySelector('#pub-repo'); if (i) { i.value = ''; i.placeholder = fs().project ? fs().project.name : ''; } } });
  SK.publicar = { build, publicarSite, tudo, get historico() { return hist(); } };
})(window.SK);
