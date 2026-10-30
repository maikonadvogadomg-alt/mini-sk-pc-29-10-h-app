package app.minisk.shell;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.content.SharedPreferences;
import java.net.HttpURLConnection;
import java.net.URL;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.content.pm.PackageManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import org.json.JSONArray;
import java.util.Locale;
import org.json.JSONObject;

import androidx.webkit.ServiceWorkerClientCompat;
import androidx.webkit.ServiceWorkerControllerCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewFeature;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * App de uma tela só: abre o index.html que vai DENTRO do APK (pasta assets/www).
 * Usa um endereço https "de mentira" (appassets.androidplatform.net) para o
 * navegador interno liberar tudo: banco do navegador, módulos, service worker.
 */
public class MainActivity extends Activity {
    private static final String INICIO = "https://appassets.androidplatform.net/assets/www/index.html";
    private static final int ESCOLHER_ARQUIVO = 41;
    private WebView web;
    private ValueCallback<Uri[]> retornoArquivo;
    private static final int PEDIR_MICROFONE = 42;
    private PermissionRequest pedidoPendente;
    private static final int PEDIR_VOZ = 43;
    private static final int PEDIR_TUDO = 44;      // 🔓 o kit de autorizações, pedido UMA vez ao abrir
    private static final int PEDIR_LOCAL = 45;     // 📍 localização pedida por uma página
    private GeolocationPermissions.Callback geoRetorno;
    private String geoOrigem;
    private SpeechRecognizer reconhecedor;
    private String vozLingua = "pt-BR";
    private TextToSpeech fala;          // 🔊 a voz do Android (lê em voz alta, qualquer IA, sem chave)
    private boolean falaPronta = false;

    @Override
    protected void onCreate(Bundle salvo) {
        super.onCreate(salvo);
        try { getWindow().setStatusBarColor(getResources().getColor(R.color.tema, null)); } catch (Exception ignorado) { }

        final WebViewAssetLoader carregador = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        // O service worker do app (sw.js) também precisa achar os arquivos que vão DENTRO
        // do APK. Sem isto, da 2ª vez que abre ele tenta buscar na internet um endereço
        // que não existe e a página/prévia fica em branco.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_BASIC_USAGE)) {
            ServiceWorkerControllerCompat.getInstance().setServiceWorkerClient(new ServiceWorkerClientCompat() {
                @Override
                public WebResourceResponse shouldInterceptRequest(WebResourceRequest req) {
                    WebResourceResponse r = carregador.shouldInterceptRequest(req.getUrl());
                    String c = req.getUrl().getPath();
                    if (r != null && c != null && (c.toLowerCase().endsWith(".html") || c.toLowerCase().endsWith(".htm"))) r = comPonte(r);
                    return comLacre(r);
                }
            });
        }

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        // 📱 Termux: a página (https interno) precisa poder abrir ws://127.0.0.1
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setGeolocationEnabled(true);      // 📍 páginas que pedem a localização
        s.setJavaScriptCanOpenWindowsAutomatically(true);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) {
                WebResourceResponse r = carregador.shouldInterceptRequest(req.getUrl());
                String c = req.getUrl().getPath();
                if (r != null && c != null && (c.toLowerCase().endsWith(".html") || c.toLowerCase().endsWith(".htm"))) r = comPonte(r);
                return comLacre(r);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                Uri u = req.getUrl();
                String esquema = u.getScheme() == null ? "" : u.getScheme().toLowerCase();
                if ("appassets.androidplatform.net".equals(u.getHost())) return false;
                // páginas montadas dentro do app (preview, playground): blob:, data:, about:
                if (esquema.equals("blob") || esquema.equals("data") || esquema.equals("about") || esquema.equals("javascript")) return false;
                // quadros internos (iframe) carregam dentro do app
                if (!req.isForMainFrame()) return false;
                // links de fora (sites) abrem no navegador do celular
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignorado) { }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> retorno, FileChooserParams p) {
                if (retornoArquivo != null) retornoArquivo.onReceiveValue(null);
                retornoArquivo = retorno;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                if (p.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                try {
                    startActivityForResult(Intent.createChooser(i, "Escolher arquivo"), ESCOLHER_ARQUIVO);
                } catch (Exception e) {
                    retornoArquivo = null;
                    return false;
                }
                return true;
            }

            // 📍 localização: o Android pergunta ao usuário quando a página pede
            @Override
            public void onGeolocationPermissionsShowPrompt(String origem, GeolocationPermissions.Callback retorno) {
                if (checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                        || checkSelfPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                    retorno.invoke(origem, true, false);
                    return;
                }
                geoOrigem = origem; geoRetorno = retorno;
                requestPermissions(new String[]{ android.Manifest.permission.ACCESS_FINE_LOCATION, android.Manifest.permission.ACCESS_COARSE_LOCATION }, PEDIR_LOCAL);
            }

            // microfone/câmera: o Android pergunta ao usuário quando a página pede
            @Override
            public void onPermissionRequest(final PermissionRequest req) {
                runOnUiThread(() -> {
                    List<String> falta = new ArrayList<>();
                    for (String r : req.getResources()) {
                        String p = null;
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) p = android.Manifest.permission.RECORD_AUDIO;
                        if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) p = android.Manifest.permission.CAMERA;
                        if (p != null && checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) falta.add(p);
                    }
                    if (falta.isEmpty()) { req.grant(req.getResources()); return; }
                    pedidoPendente = req;
                    requestPermissions(falta.toArray(new String[0]), PEDIR_MICROFONE);
                });
            }
        });

        web.addJavascriptInterface(new Ponte(), "AndroidBridge");
        web.addJavascriptInterface(new Voz(), "AndroidVoz"); // 🎤 ditado pelo Android (a "janelinha" não tem o do Chrome)
        web.addJavascriptInterface(new Fala(), "AndroidFala"); // 🔊 ler em voz alta com as vozes do Android (a "janelinha" não tem speechSynthesis)
        ligarFala();
        setContentView(web);
        pedirTudoNaPrimeiraVez();
        if (salvo != null) web.restoreState(salvo);
        else web.loadUrl(INICIO);
    }

    @Override
    protected void onActivityResult(int pedido, int resultado, Intent dados) {
        if (pedido == ESCOLHER_ARQUIVO && retornoArquivo != null) {
            Uri[] lista = null;
            if (resultado == RESULT_OK && dados != null) {
                if (dados.getClipData() != null) {
                    int n = dados.getClipData().getItemCount();
                    lista = new Uri[n];
                    for (int k = 0; k < n; k++) lista[k] = dados.getClipData().getItemAt(k).getUri();
                } else if (dados.getData() != null) {
                    lista = new Uri[]{ dados.getData() };
                }
            }
            retornoArquivo.onReceiveValue(lista);
            retornoArquivo = null;
            return;
        }
        super.onActivityResult(pedido, resultado, dados);
    }

    @Override
    public void onRequestPermissionsResult(int pedido, String[] permissoes, int[] resultados) {
        super.onRequestPermissionsResult(pedido, permissoes, resultados);
        if (pedido == PEDIR_VOZ) {
            boolean okVoz = resultados.length > 0 && resultados[0] == PackageManager.PERMISSION_GRANTED;
            if (okVoz) comecarVoz();
            else js("window.__vozErro&&window.__vozErro(" + JSONObject.quote("Sem permissão de microfone. Libere em Configurações → Apps → este app → Permissões.") + ")");
            return;
        }
        if (pedido == PEDIR_TUDO) { pedirBateria(); return; }
        if (pedido == PEDIR_LOCAL && geoRetorno != null) {
            boolean okLocal = false;
            for (int r : resultados) if (r == PackageManager.PERMISSION_GRANTED) okLocal = true;
            geoRetorno.invoke(geoOrigem, okLocal, false);
            geoRetorno = null; geoOrigem = null;
            return;
        }
        if (pedido == PEDIR_MICROFONE && pedidoPendente != null) {
            boolean ok = resultados.length > 0;
            for (int r : resultados) if (r != PackageManager.PERMISSION_GRANTED) ok = false;
            if (ok) pedidoPendente.grant(pedidoPendente.getResources()); else pedidoPendente.deny();
            pedidoPendente = null;
        }
    }

    /** 🔓 Na 1ª vez que o app abre, pede de uma vez as autorizações que só valem com o "sim" do usuário.
     *  Depois não pergunta mais (quem negou pode liberar em Configurações → Apps → este app → Permissões). */
    private void pedirTudoNaPrimeiraVez() {
        if (Build.VERSION.SDK_INT < 23) return;
        SharedPreferences sp = getSharedPreferences("app-autorizacoes", MODE_PRIVATE);
        if (sp.getBoolean("pediuTudo", false)) return;
        sp.edit().putBoolean("pediuTudo", true).apply();
        List<String> lista = new ArrayList<>();
        lista.add("android.permission.RECORD_AUDIO");
        lista.add("android.permission.CAMERA");
        lista.add("android.permission.ACCESS_FINE_LOCATION");
        lista.add("android.permission.ACCESS_COARSE_LOCATION");
        if (Build.VERSION.SDK_INT >= 33) {
            lista.add("android.permission.POST_NOTIFICATIONS");
            lista.add("android.permission.READ_MEDIA_IMAGES");
            lista.add("android.permission.READ_MEDIA_VIDEO");
            lista.add("android.permission.READ_MEDIA_AUDIO");
        } else {
            lista.add("android.permission.READ_EXTERNAL_STORAGE");
        }
        List<String> falta = new ArrayList<>();
        for (String p : lista) if (checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) falta.add(p);
        if (!falta.isEmpty()) requestPermissions(falta.toArray(new String[0]), PEDIR_TUDO);
        else pedirBateria();
    }

    /** 🔋 "Sem restrição de bateria": o Android para de fechar o app quando você sai para baixar algo e volta.
     *  Pergunta uma vez só (é a janela do próprio Android: toque em Permitir). */
    private void pedirBateria() {
        try {
            if (Build.VERSION.SDK_INT < 23) return;
            android.os.PowerManager pm = (android.os.PowerManager) getSystemService(POWER_SERVICE);
            if (pm == null || pm.isIgnoringBatteryOptimizations(getPackageName())) return;
            Intent i = new Intent("android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS");
            i.setData(Uri.parse("package:" + getPackageName()));
            startActivity(i);
        } catch (Exception ignorado) { }
    }

    /** 🔒 Lacre (COOP/COEP): o que o sw.js fazia no navegador. Liga o "terminal real" (WebContainer). */
    private WebResourceResponse comLacre(WebResourceResponse r) {
        if (r == null) return null;
        boolean ligado = false;
        try { ligado = getResources().getBoolean(R.bool.lacre); } catch (Exception ignorado) { }
        if (!ligado) return r;
        java.util.Map<String, String> h = new java.util.HashMap<>();
        if (r.getResponseHeaders() != null) h.putAll(r.getResponseHeaders());
        h.put("Cross-Origin-Opener-Policy", "same-origin");
        h.put("Cross-Origin-Embedder-Policy", "credentialless");
        h.put("Cross-Origin-Resource-Policy", "cross-origin");
        r.setResponseHeaders(h);
        return r;
    }

    /** Coloca a ponte (assets/__ponte.js) no começo de cada página: faz "baixar" e "imprimir" funcionarem em qualquer HTML. */
    private WebResourceResponse comPonte(WebResourceResponse r) {
        try {
            InputStream in = r.getData();
            if (in == null) return r;
            ByteArrayOutputStream b = new ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) b.write(buf, 0, n);
            in.close();
            String html = new String(b.toByteArray(), StandardCharsets.UTF_8);
            String tag = "<script src=\"/assets/__ponte.js\"></script>";
            String baixo = html.toLowerCase();
            int i = baixo.indexOf("<head");
            if (i >= 0) { int f = baixo.indexOf('>', i); html = html.substring(0, f + 1) + tag + html.substring(f + 1); }
            else html = tag + html;
            return new WebResourceResponse("text/html", "UTF-8", new ByteArrayInputStream(html.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            return r;
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        // ⬅ botão VOLTAR do celular: 1º a página fecha o que estiver aberto (painel, janela);
        // 2º volta a página anterior; 3º na primeira tela NÃO fecha o app — só vai para o fundo, sem perder nada.
        if (web == null) { moveTaskToBack(true); return; }
        web.evaluateJavascript("(function(){try{return !!(window.__voltarApp&&window.__voltarApp())}catch(e){return false}})()", r -> {
            if ("true".equals(r)) return;
            if (web.canGoBack()) web.goBack();
            else moveTaskToBack(true);
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle saida) {
        super.onSaveInstanceState(saida);
        if (web != null) web.saveState(saida);
    }

    @Override
    protected void onPause() {
        // avisa a página para salvar tudo antes do app ir para o fundo (ou ser fechado)
        if (web != null) web.evaluateJavascript("try{window.dispatchEvent(new Event('pagehide'));window.dispatchEvent(new Event('app-pausa'));}catch(e){}", null);
        super.onPause();
        CookieManager.getInstance().flush();
    }

    private void js(final String codigo) { runOnUiThread(() -> { if (web != null) web.evaluateJavascript(codigo, null); }); }

    /** 🎤 Ouve uma frase com o reconhecimento de voz do próprio Android e devolve o texto para a página. */
    private void comecarVoz() {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            js("window.__vozErro&&window.__vozErro(" + JSONObject.quote("Este celular não tem o reconhecimento de voz do Google. Instale ou atualize o app Google.") + ")");
            return;
        }
        if (reconhecedor != null) { try { reconhecedor.destroy(); } catch (Exception ignorado) { } }
        reconhecedor = SpeechRecognizer.createSpeechRecognizer(this);
        reconhecedor.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle b) { }
            @Override public void onBeginningOfSpeech() { }
            @Override public void onRmsChanged(float v) { }
            @Override public void onBufferReceived(byte[] b) { }
            @Override public void onEndOfSpeech() { }
            @Override public void onEvent(int tipo, Bundle b) { }
            @Override public void onError(int erro) {
                String m;
                if (erro == SpeechRecognizer.ERROR_NO_MATCH || erro == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) m = "Não ouvi nada. Toque no microfone e fale.";
                else if (erro == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) m = "Sem permissão de microfone.";
                else if (erro == SpeechRecognizer.ERROR_NETWORK || erro == SpeechRecognizer.ERROR_NETWORK_TIMEOUT) m = "Sem internet para entender a voz.";
                else m = "O reconhecimento de voz falhou (código " + erro + ").";
                js("window.__vozErro&&window.__vozErro(" + JSONObject.quote(m) + ")");
            }
            @Override public void onResults(Bundle b) {
                ArrayList<String> r = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                String t = (r != null && !r.isEmpty()) ? r.get(0) : "";
                js("window.__vozResultado&&window.__vozResultado(" + JSONObject.quote(t) + ")");
            }
            @Override public void onPartialResults(Bundle b) {
                ArrayList<String> r = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (r != null && !r.isEmpty()) js("window.__vozParcial&&window.__vozParcial(" + JSONObject.quote(r.get(0)) + ")");
            }
        });
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, vozLingua);
        i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        reconhecedor.startListening(i);
    }

    /** 🔊 Liga a voz do Android. Quando fica pronta, avisa a página (window.__falaPronta). */
    private void ligarFala() {
        fala = new TextToSpeech(this, status -> {
            falaPronta = status == TextToSpeech.SUCCESS;
            if (!falaPronta) return;
            try { fala.setLanguage(new Locale("pt", "BR")); } catch (Exception ignorado) { }
            fala.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) { js("window.__falaComecou&&window.__falaComecou(" + JSONObject.quote(id) + ")"); }
                @Override public void onDone(String id) { js("(window.__falaFimPonte&&window.__falaFimPonte(" + JSONObject.quote(id) + "));(window.__falaFim&&window.__falaFim(" + JSONObject.quote(id) + "))"); }
                @Override public void onStop(String id, boolean interrompido) { onDone(id); }
                @Override public void onError(String id) { js("(window.__falaFimPonte&&window.__falaFimPonte(" + JSONObject.quote(id) + "));(window.__falaErro&&window.__falaErro(" + JSONObject.quote(id) + ",''))"); }
            });
            js("window.__falaPronta&&window.__falaPronta()");
        });
    }

    @Override
    protected void onDestroy() {
        if (fala != null) { try { fala.stop(); fala.shutdown(); } catch (Exception ignorado) { } }
        if (reconhecedor != null) { try { reconhecedor.destroy(); } catch (Exception ignorado) { } }
        super.onDestroy();
    }

    /** Ponte JavaScript → Android para a voz: window.AndroidVoz.ouvir("pt-BR") / parar(). */
    class Voz {
        @JavascriptInterface
        public void ouvir(String lingua) {
            vozLingua = (lingua == null || lingua.isEmpty()) ? "pt-BR" : lingua;
            runOnUiThread(() -> {
                if (checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{ android.Manifest.permission.RECORD_AUDIO }, PEDIR_VOZ);
                    return;
                }
                comecarVoz();
            });
        }

        @JavascriptInterface
        public void parar() {
            runOnUiThread(() -> { if (reconhecedor != null) { try { reconhecedor.stopListening(); } catch (Exception ignorado) { } } });
        }
    }

    /** 🔊 Ponte JavaScript → Android para LER EM VOZ ALTA: window.AndroidFala.falar(id, texto, voz, velocidade, tom, naFila) / parar() / vozes(). */
    class Fala {
        @JavascriptInterface
        public boolean pronta() { return falaPronta; }

        @JavascriptInterface
        public String vozes() {
            JSONArray l = new JSONArray();
            try {
                if (falaPronta && fala.getVoices() != null) for (Voice v : fala.getVoices()) {
                    Locale lo = v.getLocale();
                    if (lo == null || !"pt".equalsIgnoreCase(lo.getLanguage())) continue;
                    if (v.getFeatures() != null && v.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
                    JSONObject o = new JSONObject();
                    o.put("nome", v.getName());
                    o.put("lingua", lo.toLanguageTag());
                    o.put("rede", v.isNetworkConnectionRequired());
                    o.put("qualidade", v.getQuality());
                    l.put(o);
                }
            } catch (Exception ignorado) { }
            return l.toString();
        }

        @JavascriptInterface
        public void falar(String id, String texto, String voz, float velocidade, float tom, boolean naFila) {
            if (!falaPronta || fala == null) { js("(window.__falaFimPonte&&window.__falaFimPonte(" + JSONObject.quote(id) + "));(window.__falaErro&&window.__falaErro(" + JSONObject.quote(id) + "," + JSONObject.quote("A voz do Android ainda não ligou. Confira em Configurações do celular → Saída de texto para fala.") + "))"); return; }
            try {
                if (voz != null && !voz.isEmpty() && fala.getVoices() != null) for (Voice v : fala.getVoices()) if (voz.equals(v.getName())) { fala.setVoice(v); break; }
                fala.setSpeechRate(velocidade > 0 ? velocidade : 1f);
                fala.setPitch(tom > 0 ? tom : 1f);
                fala.speak(texto == null ? "" : texto, naFila ? TextToSpeech.QUEUE_ADD : TextToSpeech.QUEUE_FLUSH, null, id);
            } catch (Exception e) {
                js("(window.__falaFimPonte&&window.__falaFimPonte(" + JSONObject.quote(id) + "));(window.__falaErro&&window.__falaErro(" + JSONObject.quote(id) + "," + JSONObject.quote(String.valueOf(e.getMessage())) + "))");
            }
        }

        @JavascriptInterface
        public void parar() { try { if (fala != null) fala.stop(); } catch (Exception ignorado) { } }
    }

    /** Ponte JavaScript → Android: salva arquivos baixados na pasta Downloads. */
    class Ponte {
        @JavascriptInterface
        public String salvar(String nome, String base64, String tipo) {
            try {
                byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues cv = new ContentValues();
                    cv.put(MediaStore.Downloads.DISPLAY_NAME, nome);
                    cv.put(MediaStore.Downloads.MIME_TYPE, (tipo == null || tipo.isEmpty()) ? "application/octet-stream" : tipo);
                    Uri u = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                    if (u == null) return "sem acesso a Downloads";
                    try (OutputStream os = getContentResolver().openOutputStream(u)) { os.write(bytes); }
                } else {
                    File pasta = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    try (FileOutputStream os = new FileOutputStream(new File(pasta, nome))) { os.write(bytes); }
                }
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Salvo em Downloads: " + nome, Toast.LENGTH_LONG).show());
                return "ok";
            } catch (Exception e) {
                return String.valueOf(e.getMessage());
            }
        }

        /** 🌐 Busca uma página da internet pelo próprio Android (sem a trava de "CORS" do navegador).
         *  Usado pela IA para pesquisar (DuckDuckGo) e ler links. Responde em window.__buscaFim(id, ok, texto). */
        @JavascriptInterface
        public void buscar(final String id, final String endereco) {
            new Thread(() -> {
                boolean ok = false; String texto;
                HttpURLConnection c = null;
                try {
                    if (endereco == null || !endereco.matches("(?i)^https?://.+")) throw new Exception("endereço inválido");
                    c = (HttpURLConnection) new URL(endereco).openConnection();
                    c.setInstanceFollowRedirects(true);
                    c.setConnectTimeout(15000); c.setReadTimeout(20000);
                    c.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36");
                    c.setRequestProperty("Accept-Language", "pt-BR,pt;q=0.9");
                    int cod = c.getResponseCode();
                    InputStream in = cod >= 400 ? c.getErrorStream() : c.getInputStream();
                    ByteArrayOutputStream b = new ByteArrayOutputStream();
                    if (in != null) { byte[] buf = new byte[16384]; int n; while ((n = in.read(buf)) > 0 && b.size() < 3000000) b.write(buf, 0, n); in.close(); }
                    texto = new String(b.toByteArray(), StandardCharsets.UTF_8);
                    ok = cod < 400;
                    if (!ok) texto = "HTTP " + cod;
                } catch (Exception e) {
                    texto = String.valueOf(e.getMessage());
                } finally { if (c != null) c.disconnect(); }
                js("window.__buscaFim&&window.__buscaFim(" + JSONObject.quote(String.valueOf(id)) + "," + ok + "," + JSONObject.quote(texto) + ")");
            }).start();
        }

        @JavascriptInterface
        public void aviso(String m) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, m, Toast.LENGTH_LONG).show());
        }
    }
}
