/* 🔐 Arquivo de chaves do Maikon — o MESMO formato no Mini SK, no Meu Chat e no que vier depois.
   Guarda SÓ as chaves (IA, GitHub, Expo, pesquisa e "Minhas chaves"), trancadas com uma senha sua
   (AES-GCM 256 + PBKDF2 com 250 mil voltas — sem a senha, o arquivo não abre).
   Assim dá para levar as chaves de um app/aparelho para outro sem passar pelo WhatsApp. */
(function () {
  'use strict';
  const VOLTAS = 250000;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = (u8) => { let s = ''; const a = new Uint8Array(u8); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); };
  const deB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  async function chaveDaSenha(senha, sal) {
    const base = await crypto.subtle.importKey('raw', enc.encode(String(senha)), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: sal, iterations: VOLTAS, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  // nomes dos provedores iguais em todos os apps
  const NOMES = { anthropic: 'claude', claude: 'claude', google: 'gemini', gemini: 'gemini' };
  const normal = (p) => NOMES[String(p || '').toLowerCase()] || String(p || '').toLowerCase() || 'outro';

  /** Tranca { ia:[{provedor,chave,modelo,base,apelido}], github, expo, busca:{tipo,chave}, extras:[{nome,valor}] } com a senha. Devolve o texto do arquivo. */
  async function selar(conteudo, senha, deOnde) {
    if (!senha || String(senha).length < 4) throw new Error('A senha precisa ter pelo menos 4 letras ou números.');
    const sal = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const k = await chaveDaSenha(senha, sal);
    const dados = Object.assign({}, conteudo, { ia: (conteudo.ia || []).map((x) => Object.assign({}, x, { provedor: normal(x.provedor) })) });
    const cifra = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, enc.encode(JSON.stringify(dados)));
    const resumo = contar(dados);
    return JSON.stringify({ app: 'cofre-de-chaves-do-maikon', versao: 1, de: deOnde || '', criado: new Date().toISOString(), resumo, voltas: VOLTAS, sal: b64(sal), iv: b64(iv), dados: b64(cifra) }, null, 1);
  }

  /** Abre o arquivo com a senha. Devolve o conteúdo (mesmo formato do selar). */
  async function abrir(texto, senha) {
    let j; try { j = JSON.parse(texto); } catch (e) { throw new Error('Esse arquivo não é um cofre de chaves.'); }
    if (!j || j.app !== 'cofre-de-chaves-do-maikon') throw new Error('Esse arquivo não é um cofre de chaves (é outro tipo de backup).');
    const base = await crypto.subtle.importKey('raw', enc.encode(String(senha || '')), 'PBKDF2', false, ['deriveKey']);
    const k = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: deB64(j.sal), iterations: j.voltas || VOLTAS, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    let claro;
    try { claro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(j.iv) }, k, deB64(j.dados)); } catch (e) { throw new Error('Senha errada.'); }
    const d = JSON.parse(dec.decode(claro));
    d.ia = (d.ia || []).map((x) => Object.assign({}, x, { provedor: normal(x.provedor) }));
    d.extras = d.extras || [];
    return d;
  }

  function contar(d) {
    const p = [];
    if ((d.ia || []).length) p.push((d.ia || []).length + ' de IA');
    if (d.github) p.push('GitHub');
    if (d.expo) p.push('Expo');
    if (d.busca && d.busca.chave) p.push('pesquisa');
    if ((d.extras || []).length) p.push((d.extras || []).length + ' outras');
    return p.join(', ') || 'nenhuma';
  }

  /** Esconde o meio da chave: AIza••••••xyz */
  const mascara = (v) => { v = String(v || ''); return v.length <= 8 ? '••••••' : v.slice(0, 4) + '••••••' + v.slice(-3); };

  window.CofreArquivo = { selar, abrir, contar, mascara, normal };
})();
