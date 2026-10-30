/* =========================================================================
   Mini SK — 20-zip.js
   Lê e cria arquivos .zip SEM biblioteca externa (funciona offline).
   Usa o descompactador que já vem no navegador (DecompressionStream).
   ========================================================================= */
(function (SK) {
  'use strict';

  const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

  async function streamThrough(u8, stream) {
    const res = new Response(new Blob([u8]).stream().pipeThrough(stream));
    return new Uint8Array(await res.arrayBuffer());
  }
  const canInflate = typeof DecompressionStream !== 'undefined';
  const canDeflate = typeof CompressionStream !== 'undefined';

  /** Lê um .zip → [{ name, data: Uint8Array }] */
  async function read(buffer, opts) {
    const pular = opts && opts.pular;
    const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    // Procura o "fim do diretório central" (EOCD), lendo de trás para frente
    let eocd = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('Arquivo .zip inválido ou corrompido');
    let count = dv.getUint16(eocd + 10, true);
    let cdOffset = dv.getUint32(eocd + 16, true);
    // ZIP64 (arquivos muito grandes)
    if (cdOffset === 0xffffffff || count === 0xffff) {
      const loc = eocd - 20;
      if (loc >= 0 && dv.getUint32(loc, true) === 0x07064b50) {
        const z64 = Number(dv.getBigUint64(loc + 8, true));
        count = Number(dv.getBigUint64(z64 + 32, true));
        cdOffset = Number(dv.getBigUint64(z64 + 48, true));
      }
    }
    const out = [];
    let p = cdOffset;
    const utf8 = new TextDecoder('utf-8'), cp437 = new TextDecoder('windows-1252');
    for (let i = 0; i < count; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const flags = dv.getUint16(p + 8, true);
      const method = dv.getUint16(p + 10, true);
      let compSize = dv.getUint32(p + 20, true);
      let size = dv.getUint32(p + 24, true);
      const nameLen = dv.getUint16(p + 28, true), extraLen = dv.getUint16(p + 30, true), commentLen = dv.getUint16(p + 32, true);
      let localOff = dv.getUint32(p + 42, true);
      const nameBytes = u8.subarray(p + 46, p + 46 + nameLen);
      let name;
      if (flags & 0x800) name = utf8.decode(nameBytes);
      else { try { name = new TextDecoder('utf-8', { fatal: true }).decode(nameBytes); } catch { name = cp437.decode(nameBytes); } }
      name = name.replace(/\\/g, '/');
      // extra ZIP64
      let e = p + 46 + nameLen; const eEnd = e + extraLen;
      while (e + 4 <= eEnd) {
        const id = dv.getUint16(e, true), len = dv.getUint16(e + 2, true);
        if (id === 0x0001) { let q = e + 4; if (size === 0xffffffff) { size = Number(dv.getBigUint64(q, true)); q += 8; } if (compSize === 0xffffffff) { compSize = Number(dv.getBigUint64(q, true)); q += 8; } if (localOff === 0xffffffff) { localOff = Number(dv.getBigUint64(q, true)); } }
        e += 4 + len;
      }
      p += 46 + nameLen + extraLen + commentLen;
      if (name.endsWith('/')) continue; // pasta
      const lNameLen = dv.getUint16(localOff + 26, true), lExtraLen = dv.getUint16(localOff + 28, true);
      const start = localOff + 30 + lNameLen + lExtraLen;
      if (pular && pular(name)) { out.push({ name, data: null, size }); continue; } // só conta (não abre: economiza memória)
      const comp = u8.subarray(start, start + compSize);
      let data;
      if (method === 0) data = comp.slice();
      else if (method === 8) {
        if (!canInflate) throw new Error('Este navegador não sabe descompactar .zip (atualize o Chrome/Edge/Safari)');
        data = await streamThrough(comp, new DecompressionStream('deflate-raw'));
      } else { console.warn('[zip] método não suportado', method, name); continue; }
      out.push({ name, data, size: data.length });
    }
    return out;
  }

  /** Cria um .zip a partir de [{ name, data: Uint8Array|string }] → Blob */
  async function write(entries) {
    const enc = new TextEncoder();
    const chunks = [], central = [];
    let offset = 0;
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    for (const ent of entries) {
      const nameBytes = enc.encode(ent.name);
      const raw = typeof ent.data === 'string' ? enc.encode(ent.data) : (ent.data || new Uint8Array(0));
      const crc = crc32(raw);
      let method = 0, body = raw;
      if (canDeflate && raw.length > 64 && !ent.name.endsWith('/')) {
        const def = await streamThrough(raw, new CompressionStream('deflate-raw'));
        if (def.length < raw.length) { method = 8; body = def; }
      }
      const local = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x800, true); lv.setUint16(8, method, true);
      lv.setUint16(10, dosTime, true); lv.setUint16(12, dosDate, true); lv.setUint32(14, crc, true);
      lv.setUint32(18, body.length, true); lv.setUint32(22, raw.length, true); lv.setUint16(26, nameBytes.length, true); lv.setUint16(28, 0, true);
      local.set(nameBytes, 30);
      const cd = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(cd.buffer);
      cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x800, true); cv.setUint16(10, method, true);
      cv.setUint16(12, dosTime, true); cv.setUint16(14, dosDate, true); cv.setUint32(16, crc, true);
      cv.setUint32(20, body.length, true); cv.setUint32(24, raw.length, true); cv.setUint16(28, nameBytes.length, true);
      cv.setUint32(38, ent.name.endsWith('/') ? 0x10 : 0, true); cv.setUint32(42, offset, true);
      cd.set(nameBytes, 46);
      chunks.push(local, body); central.push(cd);
      offset += local.length + body.length;
    }
    const cdSize = central.reduce((s, c) => s + c.length, 0);
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, central.length, true); ev.setUint16(10, central.length, true);
    ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true);
    return new Blob([...chunks, ...central, end], { type: 'application/zip' });
  }

  // ── .tar, .tar.gz, .tgz, .taz, .gz (o que o Replit baixa) ─────────────────
  // Reconhece pelo CONTEÚDO (os primeiros bytes), não só pelo nome: no celular
  // o arquivo às vezes chega sem o final certo (".bin", "download", sem nada).
  function tipoPorBytes(u8) {
    if (!u8 || u8.length < 4) return null;
    const b = (i) => u8[i];
    if (b(0) === 0x50 && b(1) === 0x4b && (b(2) === 3 || b(2) === 5 || b(2) === 7)) return 'zip';
    if (b(0) === 0x1f && b(1) === 0x8b) return 'gz';
    if (b(0) === 0x1f && b(1) === 0x9d) return 'Z';
    if (u8.length > 262 && String.fromCharCode(b(257), b(258), b(259), b(260), b(261)) === 'ustar') return 'tar';
    if (b(0) === 0x42 && b(1) === 0x5a && b(2) === 0x68) return 'bz2';
    if (b(0) === 0xfd && b(1) === 0x37 && b(2) === 0x7a && b(3) === 0x58) return 'xz';
    if (b(0) === 0x28 && b(1) === 0xb5 && b(2) === 0x2f && b(3) === 0xfd) return 'zst';
    if (b(0) === 0x37 && b(1) === 0x7a && b(2) === 0xbc && b(3) === 0xaf) return '7z';
    if (b(0) === 0x52 && b(1) === 0x61 && b(2) === 0x72 && b(3) === 0x21) return 'rar';
    if (u8.length >= 512 && tarCabecalhoOk(u8, 0)) return 'tar';                    // tar antigo (sem "ustar")
    return null;
  }
  function tarCabecalhoOk(u8, p) {                                                  // confere a "soma" do cabeçalho do tar
    const lido = parseInt(new TextDecoder().decode(u8.subarray(p + 148, p + 156)).replace(/\0.*$/, '').trim(), 8);
    if (!(lido > 0)) return false;
    let s = 0; for (let i = 0; i < 512; i++) s += (i >= 148 && i < 156) ? 32 : u8[p + i];
    return s === lido;
  }
  const EXT_PACOTE = /\.(zip|tar|tgz|taz|gz|tar\.gz|tbz2?|bz2|xz|txz|zst|tzst|7z|rar|z)$/i;
  const EXT_SEM_NOME = /(^[^.]*$)|\.(bin|download|crdownload|tmp|dat|part)$/i;      // nomes que não dizem o que é
  // É pacote? Pelo nome; ou pelo conteúdo, quando o nome não diz nada (assim um .docx/.apk não é aberto)
  const ehCompactado = (nome, u8) => EXT_PACOTE.test(nome || '') || (!!u8 && EXT_SEM_NOME.test(nome || '') && !!tipoPorBytes(u8));
  const nomeSemExt = (nome) => String(nome || '').replace(/\.(tar\.gz|tar\.bz2|tar\.xz|tar\.zst|tgz|taz|tbz2?|txz|tzst|tar|gz|bz2|xz|zst|zip|7z|rar|bin|download)$/i, '').replace(/\.(tar)$/i, '');
  const NOMES_FORMATO = { bz2: '.bz2', xz: '.xz', zst: '.zst', '7z': '.7z', rar: '.rar', Z: '.Z' };
  function formatoNaoAbre(t) {
    return new Error('Este pacote é ' + NOMES_FORMATO[t] + ' — esse tipo o Mini SK ainda não abre sozinho. Jeito fácil: no app "Arquivos" do celular (ou no 7-Zip do computador), extraia e mande de novo como .zip, .tar ou .tar.gz — ou importe a PASTA já extraída (⤒ → Pasta).');
  }
  async function lerTar(u8, opts) {
    const pular = opts && opts.pular;
    // .gz por fora? (começa com 1f 8b) → descompacta com o próprio navegador
    if (u8[0] === 0x1f && u8[1] === 0x8b) {
      if (!canInflate) throw new Error('Este navegador não abre .tar.gz');
      u8 = await streamThrough(u8, new DecompressionStream('gzip'));
    }
    const out = []; const dec = new TextDecoder('utf-8');
    const str = (a, b) => { const s = u8.subarray(a, b); const z = s.indexOf(0); return dec.decode(z >= 0 ? s.subarray(0, z) : s); };
    let p = 0, nomeLongo = null, paxNome = null;
    while (p + 512 <= u8.length) {
      if (u8[p] === 0 && u8[p + 1] === 0) break;                                  // fim
      let nome = str(p, p + 100);
      const tam = parseInt(str(p + 124, p + 136).trim() || '0', 8) || 0;
      const tipo = String.fromCharCode(u8[p + 156] || 48);
      const prefixo = str(p + 345, p + 500);
      if (prefixo && str(p + 257, p + 262) === 'ustar') nome = prefixo + '/' + nome;
      const ini = p + 512, fim = ini + tam;
      if (tipo === 'L') nomeLongo = str(ini, fim);                                 // nome comprido (GNU)
      else if (tipo === 'x') { const m = /\d+ path=([^\n]*)\n/.exec(dec.decode(u8.subarray(ini, fim))); paxNome = m ? m[1] : null; }
      else if (tipo === 'g') { /* cabeçalho geral (pax): só pula */ }
      else if (tipo === '0' || tipo === '\0' || tipo === '7') {
        const nm = paxNome || nomeLongo || nome;
        out.push(pular && pular(nm) ? { name: nm, data: null, size: tam } : { name: nm, data: u8.slice(ini, fim), size: tam });
        nomeLongo = null; paxNome = null;
      } else { nomeLongo = null; paxNome = null; }                                 // pastas, links: pula
      p = ini + Math.ceil(tam / 512) * 512;
    }
    if (!out.length) throw new Error('Arquivo .tar vazio ou não reconhecido');
    return out;
  }
  /** Lê .zip, .tar, .tar.gz/.tgz/.taz, .gz — e pacote DENTRO de pacote
      (ex.: .tar.gz que vira .tar, .zip com um .tar.gz dentro) → [{ name, data }] */
  async function readAny(buffer, nome, nivel, opts) {
    let u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    nivel = nivel || 0;
    let t = tipoPorBytes(u8), entries;
    if (t === 'gz') {                                                               // tira a casca .gz
      if (!canInflate) throw new Error('Este navegador não abre .gz (atualize o Chrome)');
      u8 = await streamThrough(u8, new DecompressionStream('gzip'));
      t = tipoPorBytes(u8);
      if (!t || (t !== 'tar' && t !== 'zip' && !(t === 'gz' && nivel < 3) && !NOMES_FORMATO[t])) { // era só um arquivo comprimido
        return [{ name: String(nome || 'arquivo').replace(/^.*\//, '').replace(/\.(tgz|taz)$/i, '.tar').replace(/\.gz$/i, '') || 'arquivo', data: u8, size: u8.length }];
      }
    }
    if (t === 'zip') entries = await read(u8, opts);
    else if (t === 'tar') entries = await lerTar(u8, opts);
    else if (t && NOMES_FORMATO[t]) throw formatoNaoAbre(t);
    else if (t === 'gz') return readAny(u8, nomeSemExt(nome), nivel + 1, opts);
    else {
      try { entries = await lerTar(u8, opts); }
      catch { throw new Error('Não reconheci este pacote' + (nome ? ' (' + nome + ')' : '') + '. O Mini SK abre .zip, .tar, .tar.gz, .tgz e .gz. Se ele estiver corrompido (download pela metade), baixe de novo.'); }
    }
    // pacote dentro de pacote: se dentro só tem UM arquivo e ele também é pacote, abre ele também
    const reais = entries.filter((e) => e.data && e.data.length && !/(^|\/)(__MACOSX\/|\.DS_Store$)/.test(e.name));
    if (nivel < 3 && reais.length === 1) {
      const so = reais[0], ts = tipoPorBytes(so.data);
      if (ts && (ts === 'zip' ? /\.zip$/i.test(so.name) || EXT_SEM_NOME.test(so.name.replace(/^.*\//, '')) : true)) {
        try { return await readAny(so.data, so.name.replace(/^.*\//, ''), nivel + 1, opts); } catch (e) { if (NOMES_FORMATO[ts]) throw e; }
      }
    }
    return entries;
  }

  SK.zip = { read, write, crc32, readAny, ehCompactado, nomeSemExt, tipoPorBytes };
})(window.SK);
