/* =========================================================================
   Mini SK — 96-apk.js
   📦 APK de verdade a partir de um projeto HTML (o app vai DENTRO do APK,
   funciona sem internet — não é a "casca" TWA que só abre um site).

   Como funciona:
   1. Você preenche nome, versão, cor, orientação → "Preparar arquivos":
      o Mini SK cria no projeto:
        apk.config.json                 (suas escolhas)
        android/…                       (projeto Android pequeno, em Java)
        .github/workflows/apk.yml       (a receita para o GitHub montar)
   2. "Enviar e gerar": envia ao GitHub e manda montar.
   3. O painel acompanha passo a passo (✅ ❌ ⏳). Se falhar, mostra o erro
      e o botão "Explicar com a IA". Se der certo, mostra o link do APK.

   Detalhes que evitam os erros antigos:
   - nenhum "|| true" ou "| tail": se falhar, fica VERMELHO;
   - a chave de assinatura é criada uma vez e guardada no repositório
     (o APK novo instala por cima do antigo, sem desinstalar);
   - o APK sai num link de download (Releases), não escondido.
   ========================================================================= */
(function (SK) {
  'use strict';
  const fs = () => SK.fs;
  let box, polling = null, alvo = 'apk'; // alvo: 'apk' ou 'exe'
  let wfEscolhido = ''; // receita escolhida na lista (vazio = automática)
  const wfNome = () => wfEscolhido || (alvo === 'exe' ? EXE_WF : 'apk.yml');
  const receitas = () => fs().list().filter((p) => /^\.github\/workflows\/[^/]+\.ya?ml$/i.test(p)).map((p) => p.split('/').pop());
  const WF = '.github/workflows/apk.yml';

  // ── Modelos dos arquivos ────────────────────────────────────────────────────
  const T = {};
  T['android/settings.gradle'] = `pluginManagement {
    repositories { google(); mavenCentral(); gradlePluginPortal() }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories { google(); mavenCentral() }
}
rootProject.name = "MiniSKApp"
include ':app'
`;
  T['android/build.gradle'] = `plugins {
    id 'com.android.application' version '8.5.2' apply false
}
`;
  T['android/gradle.properties'] = `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
`;
  T['android/app/build.gradle'] = `plugins { id 'com.android.application' }

// As escolhas feitas no painel 📦 APK do Mini SK ficam em apk.config.json
def cfg = new groovy.json.JsonSlurper().parse(rootProject.file('../apk.config.json'))

android {
    namespace 'app.minisk.shell'
    compileSdk 34

    defaultConfig {
        applicationId cfg.pacote
        minSdk 24
        targetSdk 34
        versionCode((cfg.versaoCodigo ?: 1) as Integer)
        versionName "\${cfg.versao ?: '1.0'}"
        resValue "string", "app_name", "\${cfg.nome}"
        resValue "color", "tema", "\${cfg.cor ?: '#0f1420'}"
        resValue "bool", "lacre", "\${cfg.lacre ? 'true' : 'false'}"
        manifestPlaceholders = [orientacao: (cfg.orientacao ?: 'unspecified')]
    }

    signingConfigs {
        release {
            storeFile rootProject.file('release.keystore')
            storePassword 'minisk-apk'
            keyAlias 'app'
            keyPassword 'minisk-apk'
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            signingConfig signingConfigs.release
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.webkit:webkit:1.11.0'
}
`;
  // 📱 Termux: deixa o app falar com o próprio celular (127.0.0.1) sem https. Só isso.
  T['android/app/src/main/res/xml/rede.xml'] = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">127.0.0.1</domain>
        <domain includeSubdomains="false">localhost</domain>
    </domain-config>
</network-security-config>
`;
  T['android/app/src/main/AndroidManifest.xml'] = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- 🔓 KIT COMPLETO de autorizações: o app já nasce com tudo o que uma página pode usar.
         As "perigosas" (microfone, câmera, fotos, localização, avisos) o Android pergunta UMA vez, ao abrir.
         Ficaram de fora só SMS, ligações e contatos: com elas o Play Protect bloqueia o APK. -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
    <uses-permission android:name="android.permission.READ_MEDIA_VISUAL_USER_SELECTED" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission android:name="android.permission.USE_FINGERPRINT" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.NFC" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />
    <!-- 🔋 pedir ao Android para não "dormir"/fechar o app quando ele vai para o fundo -->
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
    <uses-feature android:name="android.hardware.microphone" android:required="false" />
    <uses-feature android:name="android.hardware.location" android:required="false" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />
    <uses-feature android:name="android.hardware.bluetooth" android:required="false" />
    <uses-feature android:name="android.hardware.nfc" android:required="false" />
    <uses-feature android:name="android.hardware.fingerprint" android:required="false" />

    <!-- 🎤 ditado por voz no APK: o app precisa "enxergar" o reconhecimento de voz do Google -->
    <queries>
        <intent>
            <action android:name="android.speech.RecognitionService" />
        </intent>
        <!-- 🔊 voz que lê em voz alta (as vozes do próprio Android) -->
        <intent>
            <action android:name="android.intent.action.TTS_SERVICE" />
        </intent>
        <!-- abrir links, e-mail, WhatsApp, telefone e mapas a partir do app -->
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="https" />
        </intent>
        <intent>
            <action android:name="android.intent.action.SENDTO" />
            <data android:scheme="mailto" />
        </intent>
        <intent>
            <action android:name="android.intent.action.DIAL" />
        </intent>
        <intent>
            <action android:name="android.media.action.IMAGE_CAPTURE" />
        </intent>
    </queries>

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:allowBackup="true"
        android:hardwareAccelerated="true"
        android:networkSecurityConfig="@xml/rede"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:alwaysRetainTaskState="true"
            android:screenOrientation="\${orientacao}"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden|keyboard|uiMode|smallestScreenSize"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`;
  T['android/app/src/main/java/app/minisk/shell/MainActivity.java'] = `package app.minisk.shell;

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
            String tag = "<script src=\\"/assets/__ponte.js\\"></script>";
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
`;
  T['android/app/src/main/assets/__ponte.js'] = `/* Ponte do APK Builder: faz "baixar arquivo" e "imprimir" funcionarem dentro do APK.
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
`;
  T[WF] = `# Receita para o GitHub montar o APK — gerada pelo painel 📦 APK do Mini SK.
# Nada aqui esconde erro: se um passo falhar, fica VERMELHO e o painel mostra onde.
name: "📦 Gerar APK"

on:
  workflow_dispatch:

permissions:
  contents: write

jobs:
  apk:
    runs-on: ubuntu-latest
    timeout-minutes: 40
    steps:
      - name: "1. Baixar o projeto"
        uses: actions/checkout@v4

      - name: "2. Conferir configuração"
        run: |
          test -f apk.config.json || { echo "::error::Falta o apk.config.json. Use 'Preparar arquivos' no painel 📦 APK."; exit 1; }
          test -f index.html || { echo "::error::Falta o index.html na raiz do projeto."; exit 1; }
          test -f android/app/build.gradle || { echo "::error::Falta a pasta android/. Use 'Preparar arquivos' no painel 📦 APK."; exit 1; }
          jq . apk.config.json

      - name: "3. Instalar Java 17"
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: "17"

      - name: "4. Instalar Gradle"
        uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: "8.7"

      - name: "5. Chave de assinatura (só na primeira vez)"
        run: |
          if [ -f android/release.keystore ]; then
            echo "Chave já existe — o APK novo instala por cima do antigo."
          else
            keytool -genkeypair -v -keystore android/release.keystore -alias app -keyalg RSA -keysize 2048 -validity 10000 -storepass minisk-apk -keypass minisk-apk -dname "CN=Mini SK, O=App, C=BR"
            git config user.name "github-actions[bot]"
            git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
            git add android/release.keystore
            git commit -m "Chave de assinatura do APK (não apagar)"
            git push
          fi

      - name: "6. Colocar o site dentro do APK"
        run: |
          mkdir -p android/app/src/main/assets/www
          rsync -a --exclude '.git' --exclude '.github' --exclude 'android' --exclude '.sk' --exclude 'apk.config.json' ./ android/app/src/main/assets/www/
          echo "Arquivos dentro do APK: $(find android/app/src/main/assets/www -type f | wc -l)"

      - name: "7. Montar o APK"
        working-directory: android
        run: gradle assembleRelease --no-daemon --stacktrace

      - name: "8. Dar nome ao APK"
        id: apk
        run: |
          NOME=$(jq -r '.arquivo' apk.config.json)
          VER=$(jq -r '.versao' apk.config.json)
          SAIDA="\${NOME}-v\${VER}.apk"
          cp android/app/build/outputs/apk/release/app-release.apk "$SAIDA"
          ls -la "$SAIDA"
          echo "arquivo=$SAIDA" >> "$GITHUB_OUTPUT"

      - name: "9. Guardar o APK"
        uses: actions/upload-artifact@v4
        with:
          name: apk
          path: \${{ steps.apk.outputs.arquivo }}
          if-no-files-found: error

      - name: "10. Link de download (Releases)"
        uses: softprops/action-gh-release@v2
        with:
          tag_name: apk-\${{ github.run_number }}
          name: "APK \${{ steps.apk.outputs.arquivo }}"
          files: \${{ steps.apk.outputs.arquivo }}
`;

  // ── Configuração ────────────────────────────────────────────────────────────
  const slug = (s) => String(s || 'app').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app';
  const pkgPart = (s) => { const x = slug(s).replace(/-/g, ''); return /^[a-z]/.test(x) ? x : 'a' + x; };
  function readCfg() {
    let c = {}; try { c = JSON.parse(fs().read('apk.config.json') || '{}'); } catch {}
    const P = fs().project;
    let titulo = ''; const idx = fs().read('index.html'); if (idx) { const m = /<title[^>]*>([^<]*)</i.exec(idx); if (m) titulo = m[1].trim(); }
    const nome = c.nome || titulo || (P ? P.name : 'Meu App');
    const owner = (SK.github.getLink() || {}).owner || (SK.github.user && SK.github.user.login) || (SK.pref.get('ghUser', null) || {}).login || 'meuapp';
    return {
      nome, arquivo: c.arquivo || slug(nome), pacote: c.pacote || ('com.' + pkgPart(owner) + '.' + pkgPart(nome)),
      versao: c.versao || '1.0', versaoCodigo: c.versaoCodigo || 1, cor: c.cor || '#0f1420', orientacao: c.orientacao || 'unspecified', lacre: !!c.lacre,
    };
  }
  function validPkg(p) { return /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(p); }

  async function prepare(cfg) {
    const rep = [];
    if (!fs().exists('index.html')) throw new Error('O projeto precisa ter um index.html na raiz (a primeira página do app).');
    if (!validPkg(cfg.pacote)) throw new Error('O "nome do pacote" precisa ser assim: com.seunome.app (só letras minúsculas, números e pontos).');
    await SK.checkpoints.auto('Antes de preparar o APK');
    fs().write('apk.config.json', JSON.stringify(cfg, null, 2) + '\n', { silent: true }); rep.push('✅ apk.config.json (suas escolhas)');
    let n = 0;
    for (const [p, t] of Object.entries(T)) { if (fs().read(p) !== t) { fs().write(p, t, { silent: true }); n++; } }
    rep.push('✅ Projeto Android e receita do GitHub (' + n + ' arquivo(s) criados/atualizados)');
    // ícone do app
    const icon = 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png';
    const own = ['icons/icon-192.png', 'icon-192.png', 'icons/maskable-192.png'].find((p) => fs().exists(p) && fs().get(p).b64);
    if (own) { fs().writeRecord(icon, Object.assign({}, fs().get(own))); rep.push('✅ Ícone do app: usei ' + own); }
    else {
      const cv = document.createElement('canvas'); cv.width = cv.height = 192;
      const c = cv.getContext('2d'); c.save(); SK.pwa.draw(c, 192, false); c.restore();
      const bytes = await new Promise((r) => cv.toBlob(async (b) => r(new Uint8Array(await b.arrayBuffer())), 'image/png'));
      fs().writeRecord(icon, { b64: fs().toBase64(bytes), enc: 'binário', size: bytes.length });
      rep.push('✅ Ícone do app: desenhei com o estilo da aba 📱 PWA → 🎨 Ícone (troque lá se quiser)');
    }
    SK.emit('fs-change', { type: 'import' });
    return rep;
  }


  // ── 🖥️ Programa .exe (Windows) ──────────────────────────────────────────────
  // Projeto que já veio com a receita (jurídico, CodeLens, Mini SK para PC): usa a dele.
  // Projeto HTML simples: cria a "casca" do programa (Electron) que abre o index numa janela.
  const EXE_WF = 'programa-exe.yml';
  const EXE_MAIN = `// Programa do Windows feito pelo Mini SK: abre o index.html deste projeto numa janela.
const { app, BrowserWindow, shell, session, dialog } = require('electron');
const path = require('path'), fs = require('fs'), http = require('http');
// 🖤 Tela preta? Em muitos computadores (placa de vídeo/driver antigo) o Electron abre tudo preto.
// Desligar a aceleração de vídeo resolve — o programa fica igual, só não usa a placa de vídeo.
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu-compositing');
if (!app.requestSingleInstanceLock()) { app.quit(); return; }
const RAIZ = path.join(__dirname, '..');
const PORTA = Number(require('../package.json').portaDoPrograma || 7700); // fixa: os dados ficam guardados "por endereço"
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8' };
function servir() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      let u = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (u.endsWith('/')) u += 'index.html';
      const f = path.join(RAIZ, path.normalize(u).replace(/^([\\\\/])+/, ''));
      if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('não existe'); }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); fs.createReadStream(f).pipe(res);
    });
    s.once('error', () => { dialog.showErrorBox('Programa', 'A porta ' + PORTA + ' está ocupada. Feche o outro programa e abra de novo.'); app.exit(1); });
    s.listen(PORTA, '127.0.0.1', () => ok('http://127.0.0.1:' + PORTA));
  });
}
let janela = null;
app.whenReady().then(async () => {
  const base = await servir();
  if (process.env.TESTE_SAIR === '1') { http.get(base + '/', (r) => app.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => app.exit(1)); return; }
  session.defaultSession.setPermissionRequestHandler((_w, p, cb) => cb(['media', 'clipboard-read', 'clipboard-sanitized-write', 'fullscreen', 'notifications'].includes(p)));
  janela = new BrowserWindow({ width: 1280, height: 860, autoHideMenuBar: true });
  janela.webContents.setWindowOpenHandler(({ url }) => { if (url.startsWith(base) || url.startsWith('blob:') || url === 'about:blank') return { action: 'allow' }; shell.openExternal(url); return { action: 'deny' }; });
  janela.webContents.on('did-fail-load', (_e, cod, desc, url) => dialog.showErrorBox('Programa', 'Não consegui abrir a tela (' + desc + ' · ' + url + ').'));
  janela.webContents.on('render-process-gone', (_e, d) => { dialog.showErrorBox('Programa', 'A tela travou (' + d.reason + '). Vou abrir de novo.'); janela.reload(); });
  janela.loadURL(base + '/');
});
app.on('second-instance', () => { if (janela) { if (janela.isMinimized()) janela.restore(); janela.focus(); } });
app.on('window-all-closed', () => app.quit());
`;
  const EXE_RECEITA = (nomeExe) => `# Gera o programa .exe (Windows). Feita pelo Mini SK (📦 APK → 🖥️ .exe).
# Antes de entregar, o GitHub liga o programa e confere. Se falhar, fica VERMELHO.
name: "Programa .exe para Windows"
on:
  workflow_dispatch:
permissions:
  contents: write
jobs:
  exe:
    runs-on: windows-latest
    timeout-minutes: 45
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
      - name: Instalar as peças
        run: npm install --no-audit --no-fund
      - name: Teste - o programa liga?
        shell: pwsh
        timeout-minutes: 4
        continue-on-error: true
        run: |
          $env:TESTE_SAIR = "1"
          npx electron .
          if ($LASTEXITCODE -ne 0) { throw "O programa não ligou" }
      - name: Fazer o .exe
        run: npx electron-builder --win nsis portable --x64 --publish never
      - name: Entregar para baixar (Releases)
        uses: softprops/action-gh-release@v2
        with:
          tag_name: exe-\${{ github.run_number }}
          name: "${nomeExe} \${{ github.run_number }}"
          files: release/*.exe
      - name: Entregar também em Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${nomeExe}-Windows
          path: release/*.exe
          retention-days: 30
`;
  function temServidor() {
    let pj = {}; try { pj = JSON.parse(fs().read('package.json') || '{}'); } catch {}
    const d = Object.assign({}, pj.dependencies, pj.devDependencies);
    return !!((d.express || d.fastify || d.hono || d.koa) && fs().list().some((p) => /^(server|api-server|backend)\//.test(p)));
  }
  // 💻 os tipos de .exe (as "receitas" de todas as versões) — você escolhe; o padrão é o leve
  const TIPOS_EXE = [
    { id: 'leve', nome: '🪶 Leve (Python) — pequeno, abre no Edge/Chrome, sem tela preta', nomeMini: '🪶 Mini SK leve (Python) — menor, abre no Edge/Chrome', padrao: true },
    { id: 'electron', nome: '🖼️ Electron — janela própria (uns 100 MB)', nomeMini: '🖼️ Electron "só a tela" (SEM terminal — não use para o Mini SK)' },
    { id: 'electron-minisk', nome: '💻 Mini SK para PC (Electron: terminal + ponte + pasta viva) — o normal', soMini: true },
    { id: 'proprio', nome: '📄 A receita que o projeto já tem (não mexer)' },
  ];
  // o próprio Mini SK tem a escolha guardada À PARTE: por padrão sai o 💻 Mini SK para PC (com terminal e ponte), como antes
  const ehMini = () => !!(SK.exeMiniSK && SK.exeMiniSK.ehMiniSK());
  const tipoExe = () => ehMini() ? SK.pref.get('exeTipoMini', 'electron-minisk') : SK.pref.get('exeTipo', 'leve');
  const guardarTipoExe = (v) => SK.pref.set(ehMini() ? 'exeTipoMini' : 'exeTipo', v);
  function opcoesTipoExe() { const mini = ehMini(); const t = tipoExe(); return TIPOS_EXE.filter((x) => !x.soMini || mini).map((x) => '<option value="' + x.id + '"' + (x.id === t ? ' selected' : '') + '>' + SK.esc(mini && x.nomeMini ? x.nomeMini : x.nome) + '</option>').join(''); }
  async function prepararExe(tipo) {
    tipo = tipo || tipoExe();
    const rep = [];
    const mini = !!(SK.exeMiniSK && SK.exeMiniSK.ehMiniSK()); // o próprio Mini SK
    const wf = '.github/workflows/' + EXE_WF;
    const feitaAqui = fs().exists(wf) && SK.exePython && SK.exePython.feitaPeloMiniSK(wf);
    if (tipo === 'proprio' || (fs().exists(wf) && !feitaAqui)) {
      if (!fs().exists(wf)) throw new Error('Este projeto não tem receita própria de .exe. Escolha outro tipo (o 🪶 Leve serve para quase tudo).');
      rep.push('✅ O projeto já tem a receita do programa (' + wf + ') — vou usar a dele.'); return rep;
    }
    if (tipo === 'electron-minisk') { if (!mini) throw new Error('Esse tipo é só para o próprio Mini SK. Escolha 🪶 Leve ou 🖼️ Electron.'); return SK.exeMiniSK.aplicar(rep); }
    if (!mini && temServidor()) throw new Error('Este projeto tem SERVIDOR (banco, IA). O .exe "só da tela" abriria sem funcionar. Use a versão já preparada (a que veio com "Programa .exe para Windows").');
    if (!fs().exists('index.html')) throw new Error('Falta o index.html na raiz do projeto. O programa abre o index.html.');
    let pj = {}; try { pj = JSON.parse(fs().read('package.json') || '{}'); } catch {}
    if (pj.scripts && pj.scripts.build && /vite|react-scripts|next|webpack/.test(pj.scripts.build)) throw new Error('Projeto de build (Vite/React): primeiro gere o site pronto (pasta dist) e importe a pasta dist como projeto. Depois gere o .exe dela.');
    const cfg = readCfg();
    const nome = mini ? 'Mini SK' : (cfg.nome || fs().project.name);
    const nomeExe = slug(nome).replace(/-+/g, '-') || 'Meu-App';
    let soma = 0; for (const ch of nomeExe) soma = (soma * 31 + ch.charCodeAt(0)) >>> 0;
    if (tipo === 'electron') {
      // 🖼️ a receita do Electron "só a tela" (a das versões antigas), já com o conserto da tela preta
      const novo = {
        name: (pj.name || nomeExe).toLowerCase().replace(/[^a-z0-9-]/g, '-'), version: (cfg.versao || '1.0') + (String(cfg.versao || '1.0').split('.').length < 3 ? '.0' : ''), description: nome, author: 'Maikon', private: true,
        main: 'electron/main.cjs', portaDoPrograma: 7700 + (soma % 250),
        devDependencies: Object.assign({}, pj.devDependencies, { electron: '33.2.1', 'electron-builder': '25.1.8' }),
        build: { appId: (cfg.pacote || 'com.maikon.' + nomeExe.toLowerCase().replace(/[^a-z0-9]/g, '')) + '.pc', productName: nome, executableName: nomeExe, directories: { output: 'release' }, asar: false,
          files: ['**/*', '!android/**', '!.github/**', '!release/**', '!exe/**', '!node_modules/.cache/**', '!*.zip', '!.sk/**', '!apk.config.json'],
          win: Object.assign({ target: ['nsis', 'portable'] }, fs().exists('icons/icon-512.png') ? { icon: 'icons/icon-512.png' } : {}),
          nsis: { oneClick: true, perMachine: false, createDesktopShortcut: true, createStartMenuShortcut: true, shortcutName: nome, artifactName: nomeExe + '-Instalar.exe' },
          portable: { artifactName: nomeExe + '-sem-instalar.exe' } },
      };
      if (pj.dependencies) novo.dependencies = pj.dependencies;
      fs().write('package.json', JSON.stringify(novo, null, 2) + '\n', { silent: true });
      fs().write('electron/main.cjs', EXE_MAIN, { silent: true });
      fs().write(wf, EXE_RECEITA(nomeExe), { silent: true });
      rep.push('✅ Receita 🖼️ Electron: electron/main.cjs, package.json e ' + wf + ' (com o conserto da tela preta).');
      SK.emit('fs-change', { type: 'import' });
      return rep;
    }
    // 🪶 .exe LEVE em Python (igual ao do jurídico que abre): sem Electron, sem tela preta
    SK.exePython.aplicar(rep, { nome, exe: nomeExe, porta: mini ? 7790 : 7700 + (soma % 250), isolar: mini, wf: EXE_WF });
    return rep;
  }
  // 🆕 "gerar como app NOVO": muda nome e identidade, para instalar AO LADO do que já funciona (não substitui)
  function identidadeNova(oque) {
    const sel = SK.$('#apk-novo', box); if (!sel || !sel.checked) return '';
    const marca = new Date().toISOString().slice(5, 16).replace(/[-T:]/g, '');
    const rotulo = (SK.$('#apk-novo-nome', box).value.trim() || 'teste ' + marca).slice(0, 30);
    const limpo = rotulo.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '');
    if (oque === 'exe') {
      let pj = {}; try { pj = JSON.parse(fs().read('package.json') || '{}'); } catch {}
      pj.build = pj.build || {};
      const baseNome = (pj.build.productName || pj.name || fs().project.name).replace(/ \(.*\)$/, '');
      pj.build.productName = baseNome + ' (' + rotulo + ')';
      pj.build.appId = String(pj.build.appId || 'com.maikon.app').replace(/\.n[a-z0-9]+$/, '') + '.n' + limpo;
      const exe = String(pj.build.executableName || baseNome).replace(/[^\w-]+/g, '-').replace(/-n[a-z0-9]+$/, '') + '-n' + limpo;
      pj.build.executableName = exe;
      if (pj.build.nsis) { pj.build.nsis.artifactName = exe + '-Instalar.exe'; pj.build.nsis.shortcutName = pj.build.productName; }
      if (pj.build.portable) pj.build.portable.artifactName = exe + '-sem-instalar.exe';
      let soma = 0; for (const ch of limpo) soma = (soma * 31 + ch.charCodeAt(0)) >>> 0;
      pj.portaDoPrograma = 7800 + (soma % 900) * 3;
      fs().write('package.json', JSON.stringify(pj, null, 2) + '\n', { silent: true });
      return '🆕 App NOVO: "' + pj.build.productName + '" (instala ao lado do outro, com endereço próprio: porta ' + pj.portaDoPrograma + ').';
    }
    const c = readCfg();
    c.nome = String(c.nome || fs().project.name).replace(/ \(.*\)$/, '') + ' (' + rotulo + ')';
    c.pacote = String(c.pacote || 'com.maikon.app').replace(/\.n[a-z0-9]+$/, '') + '.n' + limpo;
    fs().write('apk.config.json', JSON.stringify(c, null, 2) + '\n', { silent: true });
    return '🆕 App NOVO: "' + c.nome + '" (' + c.pacote + ') — instala ao lado do outro.';
  }
  // 🛡️ antes de mandar para o GitHub: confere se o projeto aberto é o app DE VERDADE
  async function conferirProjeto(oque) {
    const P = fs().project; if (!P) throw new Error('Abra um projeto primeiro.');
    const lista = fs().list();
    let construcao = 0;
    for (const p of lista) { const t = fs().read(p); if (typeof t === 'string' && t.length < 6000 && /:\s*ainda em constru[çc]ão\.<\/p>/.test(t)) construcao++; } // só as PEÇAS do esqueleto (pequenas, com a tela de "em obras") — o código do próprio Mini SK fala dessa frase e não é esqueleto
    if (construcao >= 1 || /\(modular\)\s*$/i.test(P.name)) throw new Error('PAREI: o projeto aberto ("' + P.name + '") é um ESQUELETO (' + construcao + ' peças "ainda em constru\u00e7\u00e3o"). Ele não é o app de verdade. Toque no nome do projeto lá em cima e abra o projeto certo antes de gerar.');
    const idx = lista.find((p) => /(^|\/)index\.html$/i.test(p));
    if (!idx) throw new Error('PAREI: o projeto "' + P.name + '" não tem index.html (a tela principal).');
    const ok = await SK.confirm('Vou gerar o ' + oque + ' do projeto:\n\n📁 "' + P.name + '"\n' + lista.length + ' arquivos · tela principal: ' + idx + '\n\nA PRÉVIA está mostrando o app certo?', { okText: 'Sim, é este — gerar' });
    if (!ok) throw new Error('Cancelado. Abra o projeto certo (toque no nome lá em cima) e tente de novo.');
  }
  async function gerarExe() {
    await conferirProjeto('.exe (programa do computador)');
    const novoMsg = identidadeNova('exe');
    alvo = 'exe';
    const rep = await prepararExe();
    if (novoMsg) rep.unshift(novoMsg);
    SK.$('#apk-rep', box).innerHTML = rep.map((x) => '<div>' + SK.esc(x) + '</div>').join('');
    if (!SK.github.token) throw new Error('Cole o token do GitHub no painel 🐙 GitHub primeiro (ele fica salvo).');
    const r = await repoOf();
    const ens = await SK.github.ensureRepo(r, false);
    status((ens.created ? 'Repositório criado. ' : '') + 'Enviando o projeto para ' + r.owner + '/' + r.repo + '…');
    SK.$('#apk-repo', box).value = r.repo;
    await SK.github.push(r.owner, r.repo, r.branch || '', 'Programa .exe (Mini SK)', { mirror: true, includeSk: true });
    const info = await gh('/repos/' + r.owner + '/' + r.repo);
    const branch = r.branch || info.default_branch;
    status('Pedindo ao GitHub para montar o .exe…');
    const before = await lastRun(r);
    for (let tent = 1; ; tent++) {
      try { await gh('/repos/' + r.owner + '/' + r.repo + '/actions/workflows/' + wfNome() + '/dispatches', { method: 'POST', body: { ref: branch } }); break; }
      catch (e) {
        if ((e.status === 404 || e.status === 422) && tent < 5) { status('Esperando o GitHub reconhecer a receita… (' + tent + ')'); await new Promise((ok) => setTimeout(ok, 4000)); continue; }
        if (e.status === 403) throw new Error('O GitHub não deixou mandar montar. Dê ao token a permissão "Actions: Read and write".');
        throw e;
      }
    }
    watch(r, before ? before.id : 0);
  }

  // ── GitHub: enviar, mandar montar, acompanhar ───────────────────────────────
  const gh = (p, o) => SK.github.gh(p, o);
  async function repoOf() {
    const v = SK.$('#apk-repo', box).value.trim();
    const l = SK.github.getLink();
    if (!v && l) return l;
    return SK.github.resolveRepo(v || SK.github.repoSlug(fs().project.name) + '-app');
  }
  async function sendAndBuild() {
    await conferirProjeto('APK (app do celular)');
    if (!SK.github.token) throw new Error('Cole o token do GitHub no painel 🐙 GitHub primeiro (ele fica salvo).');
    const novoMsg = identidadeNova('apk');
    const cfg = readCfg();
    if (!wfEscolhido || wfEscolhido === 'apk.yml' || novoMsg) await prepare(cfg); // receita própria do projeto (escolhida na lista): não mexe nela
    if (novoMsg) status(novoMsg);
    const r = await repoOf();
    const ens = await SK.github.ensureRepo(r, false);
    status((ens.created ? 'Repositório criado. ' : '') + 'Enviando o projeto para ' + r.owner + '/' + r.repo + '…');
    SK.$('#apk-repo', box).value = r.repo;
    await SK.github.push(r.owner, r.repo, r.branch || '', 'APK v' + cfg.versao + ' (Mini SK)', { mirror: true, includeSk: true });
    const info = await gh('/repos/' + r.owner + '/' + r.repo);
    const branch = r.branch || info.default_branch;
    status('Pedindo ao GitHub para montar…');
    const before = await lastRun(r);
    try {
      // logo após enviar, o GitHub pode levar alguns segundos para "ver" a receita nova
      for (let tent = 1; ; tent++) {
        try { await gh('/repos/' + r.owner + '/' + r.repo + '/actions/workflows/' + wfNome() + '/dispatches', { method: 'POST', body: { ref: branch } }); break; }
        catch (e) { if ((e.status === 404 || e.status === 422) && tent < 5) { status('Esperando o GitHub reconhecer a receita… (' + tent + ')'); await new Promise((ok) => setTimeout(ok, 4000)); continue; } throw e; }
      }
    } catch (e) {
      if (e.status === 403 || e.status === 404) throw new Error('O GitHub não deixou mandar montar (' + e.message + '). Dê ao token a permissão "Actions: Read and write", ou abra o repositório → aba Actions → "📦 Gerar APK" → "Run workflow".');
      throw e;
    }
    watch(r, before ? before.id : 0);
  }
  async function lastRun(r) {
    try { const d = await gh('/repos/' + r.owner + '/' + r.repo + '/actions/workflows/' + wfNome() + '/runs?per_page=1'); return d.workflow_runs[0] || null; }
    catch { return null; }
  }
  function stopWatch() { if (polling) { clearTimeout(polling); polling = null; } }
  function watch(r, afterId) {
    stopWatch();
    const started = Date.now();
    const tick = async () => {
      try {
        const run = await lastRun(r);
        if (!run || run.id === afterId) {
          if (Date.now() - started > 90000) { status('O GitHub ainda não começou. Confira a aba Actions do repositório.', 'error'); return; }
          status('Esperando o GitHub começar…'); polling = setTimeout(tick, 4000); return;
        }
        await showRun(r, run);
        if (run.status !== 'completed') polling = setTimeout(tick, 8000);
      } catch (e) { status('⚠ ' + e.message, 'error'); }
    };
    tick();
  }
  const ICON = { success: '✅', failure: '❌', cancelled: '⛔', skipped: '⏭', in_progress: '⏳', queued: '🕒', completed: '✅' };
  async function showRun(r, run) {
    const jobs = await gh('/repos/' + r.owner + '/' + r.repo + '/actions/runs/' + run.id + '/jobs');
    const job = jobs.jobs[0];
    const out = SK.$('#apk-run', box);
    const mins = Math.round(((run.status === 'completed' ? new Date(run.updated_at) : new Date()) - new Date(run.run_started_at || run.created_at)) / 60000);
    let html = '<div class="row wrap"><b>Montagem nº ' + run.run_number + '</b><span class="muted small">' + mins + ' min</span><a class="small" href="' + SK.esc(run.html_url) + '" target="_blank" rel="noopener">abrir no GitHub ↗</a></div>';
    if (job && job.steps) html += '<div class="apk-steps">' + job.steps.map((s) => '<div class="apk-step ' + (s.conclusion || s.status) + '">' + (ICON[s.conclusion] || ICON[s.status] || '•') + ' ' + SK.esc(s.name) + '</div>').join('') + '</div>';
    out.innerHTML = html;
    if (run.status !== 'completed') { status('⏳ Montando… (o primeiro APK leva uns 5–8 minutos; os próximos são mais rápidos)'); return; }
    if (run.conclusion === 'success') {
      status(alvo === 'exe' ? '✅ Programa .exe pronto!' : '✅ APK pronto!', 'ok');
      try {
        const rel = await gh('/repos/' + r.owner + '/' + r.repo + '/releases/tags/' + (alvo === 'exe' ? 'exe-' : 'apk-') + run.run_number);
        const a = rel.assets && (rel.assets.find((x) => /Instalar\.exe$/i.test(x.name)) || rel.assets[0]);
        if (a) out.innerHTML += '<div class="apk-ok"><a class="btn primary" href="' + SK.esc(a.browser_download_url) + '" target="_blank" rel="noopener">⤓ Baixar ' + SK.esc(a.name) + ' (' + SK.bytes(a.size) + ')</a><p class="muted small">No celular: baixe, abra e permita "instalar apps desta fonte". Das próximas vezes, instala por cima.</p></div>';
      } catch { out.innerHTML += '<p class="small">Pronto — o APK está em <a href="' + SK.esc(run.html_url) + '" target="_blank">Artifacts</a> e na aba Releases do repositório.</p>'; }
      if (alvo === 'exe') return;
      const key = 'apkBumped:' + r.owner + '/' + r.repo;
      if (SK.pref.get(key, 0) !== run.id) { SK.pref.set(key, run.id); bumpVersion(); }
      return;
    }
    status('❌ A montagem falhou. Veja abaixo o motivo.', 'error');
    const fail = job && job.steps ? job.steps.find((s) => s.conclusion === 'failure') : null;
    let text = 'Passo que falhou: ' + (fail ? fail.name : '(não identificado)') + '\n';
    try {
      const ann = await gh('/repos/' + r.owner + '/' + r.repo + '/check-runs/' + job.id + '/annotations');
      if (ann.length) text += '\nMensagens do GitHub:\n' + ann.map((a) => '- ' + a.message).join('\n') + '\n';
    } catch {}
    try {
      const res = await fetch('https://api.github.com/repos/' + r.owner + '/' + r.repo + '/actions/jobs/' + job.id + '/logs', { headers: { Authorization: 'Bearer ' + SK.github.token } });
      if (res.ok) {
        const log = (await res.text()).replace(/^\S+Z /gm, '');
        const lines = log.split('\n');
        const idx = lines.findIndex((l) => /FAILURE|error:|ERROR|Error:|Exception|\* What went wrong/.test(l));
        const piece = (idx >= 0 ? lines.slice(Math.max(0, idx - 15), idx + 45) : lines.slice(-60)).join('\n');
        text += '\nTrecho do registro (log):\n' + piece;
      }
    } catch { text += '\n(O registro completo está no link "abrir no GitHub".)'; }
    out.innerHTML += '<pre class="apk-err">' + SK.esc(text) + '</pre><div class="row wrap"><button class="btn small primary" id="apk-ai">🤖 Explicar com a IA</button><button class="btn small" id="apk-copy">Copiar erro</button></div>';
    SK.$('#apk-copy', box).onclick = () => SK.copy(text);
    SK.$('#apk-ai', box).onclick = () => {
      SK.app.openSide('ai');
      const inp = SK.$('#ai-in'); if (inp) { inp.value = 'A montagem do APK no GitHub Actions falhou. Explique em português simples o motivo e diga o que mudar (se for um arquivo do projeto, mande o arquivo corrigido com filepath).\n\n' + text.slice(0, 6000); inp.focus(); }
    };
  }
  function bumpVersion() {
    try {
      const c = JSON.parse(fs().read('apk.config.json') || '{}');
      const next = (c.versaoCodigo || 1) + 1;
      const parts = String(c.versao || '1.0').split('.'); parts[parts.length - 1] = String((+parts[parts.length - 1] || 0) + 1);
      c.versaoCodigo = next; c.versao = parts.join('.');
      fs().write('apk.config.json', JSON.stringify(c, null, 2) + '\n', { silent: true });
      fill();
      SK.$('#apk-note', box).textContent = 'A versão já foi aumentada para ' + c.versao + ' — o próximo APK instala por cima deste.';
    } catch {}
  }

  // ── Painel ──────────────────────────────────────────────────────────────────
  function status(msg, kind) { const el = SK.$('#apk-status', box); if (el) { el.textContent = msg; el.className = 'gh-status ' + (kind || ''); } }
  function build(container) {
    box = container;
    box.innerHTML =
      '<p class="muted small">Gera um <b>APK de verdade</b>: o seu HTML vai <b>dentro</b> do app e funciona sem internet. Quem monta é o GitHub (de graça) — você só aperta o botão.</p>' +
      '<input class="inp" id="apk-nome" placeholder="Nome do app (aparece embaixo do ícone)">' +
      '<label class="small muted">Nome do pacote (identidade do app — não mude depois de instalar)</label><input class="inp mono" id="apk-pacote" placeholder="com.maikon.meuapp">' +
      '<div class="row wrap"><label class="chk">Versão <input class="inp tiny" id="apk-ver" style="width:70px"></label><label class="chk">Nº <input class="inp tiny" id="apk-cod" type="number" min="1" style="width:64px"></label><label class="chk">Cor da barra <input type="color" id="apk-cor"></label></div>' +
      '<select class="inp" id="apk-ori"><option value="unspecified">Gira com o celular (retrato e paisagem)</option><option value="portrait">Só retrato (em pé)</option><option value="landscape">Só paisagem (deitado)</option></select>' +
      '<label class="chk"><input type="checkbox" id="apk-lacre"> 🔒 Terminal real (lacre COOP/COEP) — só marque se o app usa o terminal WebContainer/StackBlitz. Pode bloquear imagens e scripts de outros sites que não permitem.</label>' +
      '<div class="pw-rep" style="margin:6px 0"><label class="chk"><input type="checkbox" id="apk-novo"> 🆕 <b>Gerar como app NOVO</b> (outro nome: instala <b>ao lado</b> do que já funciona, sem substituir)</label><input class="inp" id="apk-novo-nome" placeholder="nome curto do teste (ex.: teste 17-10)" hidden></div>' +
      '<label class="small muted">Receita do GitHub (workflow) que vai montar</label><select class="inp" id="apk-wf"></select>' +
      '<div class="row wrap"><button class="btn" id="apk-prep">🧰 Preparar arquivos</button><button class="btn primary" id="apk-go">📦 Enviar e gerar APK</button><button class="btn primary" id="apk-exe" title="Programa para o computador (Windows)">🖥️ Enviar e gerar .exe</button></div>' +
      '<label class="small muted">Tipo do .exe</label><select class="inp" id="apk-exe-tipo">' + opcoesTipoExe() + '</select>' +
      '<p class="muted small" style="margin:2px 0 6px">🖥️ <b>.exe</b> = programa do computador. Use um repositório diferente do APK (ex.: <i>nome-pc</i>). Ao terminar, aparece o botão para baixar o <b>…-Instalar.exe</b>.</p>' +
      '<div class="row"><input class="inp mono grow" id="apk-repo" placeholder="nome do repositório (ex.: meu-app) — cria se não existir"><button class="btn small" id="apk-check">Ver último</button></div>' +
      '<div id="apk-rep" class="pw-rep"></div><div class="gh-status" id="apk-status"></div><div id="apk-run" class="stack"></div><p class="muted small" id="apk-note"></p>' +
      '<details><summary class="small">O que cada coisa faz</summary><div class="small muted stack" style="margin-top:6px">' +
      '<div><b>Preparar arquivos</b>: cria <code>apk.config.json</code>, a pasta <code>android/</code> (app Android pequeno, em Java) e <code>.github/workflows/apk.yml</code>. Você pode ver e editar tudo na árvore.</div>' +
      '<div><b>Token</b>: o mesmo do painel 🐙 GitHub. Precisa de <b>Contents: Read and write</b> e <b>Actions: Read and write</b>.</div>' +
      '<div><b>Chave de assinatura</b>: o GitHub cria na primeira vez e guarda em <code>android/release.keystore</code>. Não apague — é ela que deixa o APK novo instalar por cima do antigo.</div>' +
      '<div><b>Importar arquivos e baixar</b> funcionam dentro do APK, em qualquer HTML (a ponte <code>__ponte.js</code> entra sozinha): o que você baixar vai para a pasta Downloads do celular. <b>Microfone e câmera</b>: o celular pergunta na primeira vez. <b>Imprimir</b> não existe dentro de APK: o app avisa.</div>' +
      '<div><b>Não funciona dentro de APK</b>: ditado por voz do navegador e programas que precisam de servidor (localhost, /api). Se o projeto for React/Vite, gere o site (<code>dist/</code>) antes.</div></div></details>';
    const $ = (s) => SK.$(s, box);
    const save = () => {
      const c = readCfg();
      Object.assign(c, { nome: $('#apk-nome').value.trim() || c.nome, pacote: $('#apk-pacote').value.trim().toLowerCase() || c.pacote, versao: $('#apk-ver').value.trim() || c.versao, versaoCodigo: Math.max(1, parseInt($('#apk-cod').value, 10) || c.versaoCodigo), cor: $('#apk-cor').value, orientacao: $('#apk-ori').value, lacre: $('#apk-lacre').checked });
      c.arquivo = slug(c.nome);
      return c;
    };
    const run = async (fn) => { const bs = SK.$$('button', box); bs.forEach((b) => (b.disabled = true)); try { await fn(); } catch (e) { status('⚠ ' + e.message, 'error'); } finally { bs.forEach((b) => (b.disabled = false)); } };
    $('#apk-prep').onclick = () => run(async () => { const rep = await prepare(save()); $('#apk-rep').innerHTML = rep.map((x) => '<div>' + SK.esc(x) + '</div>').join(''); status('Arquivos prontos. Agora: "Enviar e gerar APK".', 'ok'); });
    $('#apk-go').onclick = () => run(async () => { alvo = 'apk'; save(); await sendAndBuild(); });
    $('#apk-exe').onclick = () => run(async () => { save(); await gerarExe(); });
    $('#apk-exe-tipo').onchange = (e) => guardarTipoExe(e.target.value);
    $('#apk-novo').onchange = (e) => { $('#apk-novo-nome').hidden = !e.target.checked; };
    const pintarWf = () => { const l = receitas(); const sel = $('#apk-wf'); sel.innerHTML = '<option value="">Automática (APK: apk.yml · .exe: programa-exe.yml)</option>' + l.map((n) => '<option value="' + SK.esc(n) + '">' + SK.esc(n) + '</option>').join(''); sel.value = l.includes(wfEscolhido) ? wfEscolhido : ''; wfEscolhido = sel.value; };
    $('#apk-wf').onchange = (e) => { wfEscolhido = e.target.value; status(wfEscolhido ? 'Vou usar a receita: ' + wfEscolhido : 'Receita automática.'); };
    pintarWf(); SK.on('fs-change', () => { if (box && box.isConnected) pintarWf(); }); SK.on('project-open', () => setTimeout(() => { if (box && box.isConnected) pintarWf(); }, 50));
    $('#apk-check').onclick = () => run(async () => { alvo = fs().exists('.github/workflows/' + EXE_WF) && !fs().exists('apk.config.json') ? 'exe' : alvo; const r = await repoOf(); const last = await lastRun(r); if (!last) { status('Nenhuma montagem encontrada nesse repositório.'); return; } await showRun(r, last); if (last.status !== 'completed') watch(r, -1); });
    fill();
  }
  function fill() {
    if (!box || !fs().project) return;
    const c = readCfg(); const $ = (s) => SK.$(s, box);
    $('#apk-nome').value = c.nome; $('#apk-pacote').value = c.pacote; $('#apk-ver').value = c.versao; $('#apk-cod').value = c.versaoCodigo; $('#apk-cor').value = /^#[0-9a-f]{6}$/i.test(c.cor) ? c.cor : '#0f1420'; $('#apk-ori').value = c.orientacao; $('#apk-lacre').checked = !!c.lacre;
    const l = SK.github.getLink(); $('#apk-repo').value = l ? l.repo : '';
  }
  SK.on('project-open', () => { if (box) { const t = SK.$('#apk-exe-tipo', box); if (t) t.innerHTML = opcoesTipoExe(); } });
  SK.on('project-open', () => { stopWatch(); if (box) { fill(); SK.$('#apk-run', box).innerHTML = ''; SK.$('#apk-rep', box).innerHTML = ''; status(''); } });

  // para o 🚀 Publicar tudo de uma vez: pedir ao GitHub para montar uma receita (com paciência)
  async function despachar(r, wf, branch) {
    for (let tent = 1; ; tent++) {
      try { await gh('/repos/' + r.owner + '/' + r.repo + '/actions/workflows/' + wf + '/dispatches', { method: 'POST', body: { ref: branch } }); return true; }
      catch (e) {
        if ((e.status === 404 || e.status === 422) && tent < 6) { await new Promise((ok) => setTimeout(ok, 4000)); continue; }
        if (e.status === 403) throw new Error('O GitHub não deixou mandar montar ' + wf + '. Dê ao token a permissão "Actions: Read and write".');
        throw new Error('O GitHub não aceitou montar ' + wf + ' (' + e.message + ')');
      }
    }
  }
  SK.apk = { build, prepare, templates: T, readCfg, prepararExe, conferirProjeto, despachar, EXE_WF, TIPOS_EXE, opcoesTipoExe, tipoExe, guardarTipoExe };
})(window.SK);
