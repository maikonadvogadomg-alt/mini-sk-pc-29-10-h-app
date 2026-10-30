/* Ponte do APK Builder: faz "baixar arquivo" e "imprimir" funcionarem dentro do APK.
   Entra sozinha no começo de cada página. Não precisa mexer. */
(function () {
  if (window.__ponteAPK || !window.AndroidBridge) return;
  window.__ponteAPK = 1;
  // ⬅ botão VOLTAR do celular: a página pode fechar o que está aberto em vez de sair.
  // Qualquer app pode ouvir: window.addEventListener('voltar-celular', e => { if (algoAberto) { fechar(); e.preventDefault(); } })
  window.__voltarApp = function () {
    var ev = new CustomEvent('voltar-celular', { cancelable: true });
    window.dispatchEvent(ev);
    if (ev.defaultPrevented) return true;
    var d = document.querySelector('dialog[open], .modal-wrap, [aria-modal="true"]:not([hidden]), .modal.show');
    if (d) {
      if (d.tagName === 'DIALOG' && d.close) { d.close(); return true; }
      var esc = { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true };
      (document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keydown', esc));
      document.dispatchEvent(new KeyboardEvent('keydown', esc));
      return !document.contains(d) || d.hidden || getComputedStyle(d).display === 'none';
    }
    return false;
  };
  // 💾 "armazenamento persistente": o Android não apaga os dados da página (banco do navegador) para liberar espaço
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {}); } catch (e) {}
  // 🎤 ditado: dentro do APK não existe o reconhecimento de voz do Chrome. Este faz o papel dele usando o do Android.
  if (window.AndroidVoz && !window.SpeechRecognition && !window.webkitSpeechRecognition) {
    var evento = function (t, fim) { var alt = { transcript: t, confidence: 1 }; var res = [alt]; res.isFinal = fim; res.item = function (k) { return res[k]; }; var lista = [res]; lista.item = function (k) { return lista[k]; }; return { resultIndex: 0, results: lista }; };
    var SR = function () { this.lang = 'pt-BR'; this.interimResults = false; this.continuous = false; this.maxAlternatives = 1; this.onresult = this.onerror = this.onend = this.onstart = null; this._ev = {}; };
    SR.prototype.addEventListener = function (n, f) { (this._ev[n] = this._ev[n] || []).push(f); };
    SR.prototype.removeEventListener = function (n, f) { var l = this._ev[n] || []; var i = l.indexOf(f); if (i >= 0) l.splice(i, 1); };
    SR.prototype._dar = function (n, e) { try { if (this['on' + n]) this['on' + n](e); } catch (x) {} var l = this._ev[n] || []; for (var i = 0; i < l.length; i++) try { l[i](e); } catch (x) {} };
    SR.prototype.start = function () {
      var me = this, fim = false;
      var acabar = function () { if (!fim) { fim = true; me._dar('end', {}); } };
      window.__vozParcial = function (t) { if (me.interimResults) me._dar('result', evento(t, false)); };
      window.__vozResultado = function (t) { if (t) me._dar('result', evento(t, true)); acabar(); };
      window.__vozErro = function (m) { me._dar('error', { error: /permiss/i.test(m) ? 'not-allowed' : (/ouvi/i.test(m) ? 'no-speech' : 'network'), message: m }); acabar(); };
      me._dar('start', {}); window.AndroidVoz.ouvir(me.lang || 'pt-BR');
    };
    SR.prototype.stop = SR.prototype.abort = function () { try { window.AndroidVoz.parar(); } catch (x) {} };
    window.SpeechRecognition = window.webkitSpeechRecognition = SR;
  }
  // 🔊 ler em voz alta: dentro do APK não existe o speechSynthesis do Chrome. Este faz o papel dele com as vozes do Android
  //    (assim QUALQUER página — jurídico, chats… — fala, com a voz, a velocidade e o tom que a página escolher).
  if (window.AndroidFala && !('speechSynthesis' in window && window.speechSynthesis && window.speechSynthesis.getVoices && window.speechSynthesis.getVoices().length)) {
    var esperando = {}, nU = 0, ouvintes = [];
    var Utt = function (t) { this.text = t || ''; this.lang = 'pt-BR'; this.rate = 1; this.pitch = 1; this.volume = 1; this.voice = null; this.onstart = this.onend = this.onerror = this.onboundary = this.onpause = this.onresume = null; this._ev = {}; };
    Utt.prototype.addEventListener = function (n, f) { (this._ev[n] = this._ev[n] || []).push(f); };
    Utt.prototype.removeEventListener = function (n, f) { var l = this._ev[n] || []; var i = l.indexOf(f); if (i >= 0) l.splice(i, 1); };
    Utt.prototype._dar = function (n) { var e = { type: n, utterance: this, elapsedTime: 0, charIndex: 0 }; try { if (this['on' + n]) this['on' + n](e); } catch (x) {} var l = this._ev[n] || []; for (var i = 0; i < l.length; i++) try { l[i](e); } catch (x) {} };
    var lerVozes = function () { try { return JSON.parse(window.AndroidFala.vozes() || '[]').map(function (v) { return { name: v.nome, voiceURI: v.nome, lang: (v.lingua || 'pt-BR'), localService: !v.rede, default: false }; }); } catch (x) { return []; } };
    var S = {
      speaking: false, pending: false, paused: false, onvoiceschanged: null,
      getVoices: lerVozes,
      speak: function (u) { var id = 'p' + (++nU); esperando[id] = u; S.speaking = true; window.AndroidFala.falar(id, String(u.text || ''), u.voice ? (u.voice.name || '') : '', +u.rate || 1, +u.pitch || 1, true); },
      cancel: function () { var l = esperando; esperando = {}; try { window.AndroidFala.parar(); } catch (x) {} S.speaking = false; for (var k in l) try { l[k]._dar('end'); } catch (x) {} },
      pause: function () {}, resume: function () {},
      addEventListener: function (n, f) { if (n === 'voiceschanged') ouvintes.push(f); }, removeEventListener: function () {}
    };
    window.__falaComecou = (function (antes) { return function (id) { var u = esperando[id]; if (u) u._dar('start'); if (antes) antes(id); }; })(window.__falaComecou);
    window.__falaFimPonte = function (id) { var u = esperando[id]; if (!u) return; delete esperando[id]; S.speaking = Object.keys(esperando).length > 0; u._dar('end'); };
    window.__falaPronta = (function (antes) { return function () { try { if (S.onvoiceschanged) S.onvoiceschanged({}); } catch (x) {} for (var i = 0; i < ouvintes.length; i++) try { ouvintes[i]({}); } catch (x) {} if (antes) antes(); }; })(window.__falaPronta);
    try { Object.defineProperty(window, 'speechSynthesis', { value: S, configurable: true }); } catch (x) { window.speechSynthesis = S; }
    window.SpeechSynthesisUtterance = Utt;
  }
  var B = window.AndroidBridge;
  var P = {
    salvar: function (b64, tipo, nome) { var r = B.salvar(nome, b64, tipo); if (r !== 'ok') B.aviso('Não consegui salvar: ' + r); },
    aviso: function (m) { B.aviso(String(m)); },
    erro: function (m) { try { console.error(m); } catch (e) {} }
  };
  var guardados = {};

  // Guarda o arquivo na hora em que a página cria o link (antes de ela apagar o link)
  var criar = URL.createObjectURL;
  URL.createObjectURL = function (o) {
    var u = criar.apply(URL, arguments);
    try { if (o instanceof Blob) guardados[u] = o; } catch (e) {}
    return u;
  };

  var EXT = { 'application/pdf': 'pdf', 'text/plain': 'txt', 'text/html': 'html', 'application/json': 'json',
    'text/csv': 'csv', 'application/zip': 'zip', 'image/png': 'png', 'image/jpeg': 'jpg', 'audio/mpeg': 'mp3',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx' };
  function mandar(blob, nome) {
    nome = nome || 'arquivo';
    var tipo = String(blob.type || '').split(';')[0];
    if (nome.indexOf('.') < 0 && EXT[tipo]) nome += '.' + EXT[tipo];
    var fr = new FileReader();
    fr.onload = function () {
      var s = String(fr.result);
      P.salvar(s.substring(s.indexOf(',') + 1), blob.type || 'application/octet-stream', nome || 'arquivo');
    };
    fr.onerror = function () { P.aviso('Não consegui ler o arquivo para salvar.'); };
    fr.readAsDataURL(blob);
  }

  function salvar(href, nome) {
    try {
      if (!href) return false;
      if (href.indexOf('data:') === 0) {
        var i = href.indexOf(',');
        var meta = href.substring(5, i);
        var dados = href.substring(i + 1);
        var b64 = meta.indexOf(';base64') >= 0
          ? dados
          : btoa(unescape(encodeURIComponent(decodeURIComponent(dados))));
        P.salvar(b64, meta.split(';')[0] || 'application/octet-stream', nome || 'arquivo');
        return true;
      }
      if (guardados[href]) { mandar(guardados[href], nome); return true; }
      if (href.indexOf('blob:') === 0 || href.indexOf(location.origin) === 0) {
        fetch(href).then(function (r) { return r.blob(); })
          .then(function (b) { mandar(b, nome || href.split('/').pop()); })
          .catch(function (e) { P.aviso('Não consegui baixar: ' + e); });
        return true;
      }
    } catch (e) { P.erro(String(e)); }
    return false;
  }
  window.__ponteSalvar = salvar;

  function nomeDe(a) {
    var n = a.getAttribute('download');
    return n || (a.href || '').split('/').pop().split('?')[0] || 'arquivo';
  }
  function local(h) { return h.indexOf('blob:') === 0 || h.indexOf('data:') === 0 || h.indexOf(location.origin) === 0; }

  // Link clicado pela pessoa
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[download]') : null;
    if (!a) return;
    var h = a.href || '';
    if (local(h) && salvar(h, nomeDe(a))) { ev.preventDefault(); ev.stopPropagation(); }
  }, true);

  // Link clicado pelo código (o jeito mais comum: a.click())
  var clicar = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    var h = this.href || '';
    if (this.hasAttribute('download') && local(h) && salvar(h, nomeDe(this))) return;
    return clicar.apply(this, arguments);
  };

  // window.open(blob) — alguns apps abrem o PDF numa aba nova
  var abrir = window.open;
  window.open = function (u) {
    var h = String(u || '');
    if (h.indexOf('blob:') === 0 || h.indexOf('data:') === 0) { if (salvar(h, 'arquivo')) return null; }
    return abrir.apply(window, arguments);
  };

  // Imprimir não existe dentro de WebView
  window.print = function () {
    P.aviso('Imprimir não funciona dentro do APK. Salve o arquivo (PDF/Word) e imprima a partir dele.');
  };
})();
