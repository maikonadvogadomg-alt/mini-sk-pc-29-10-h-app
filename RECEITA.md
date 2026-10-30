# 🧬 Receita para recriar: Mini SK

_Gerada sem IA, lendo 117 arquivo(s). Serve para remontar este app como HTML modular — com qualquer IA, um arquivo por vez._

## 1. O que é

- **Nome:** Mini SK
- **Partes de código:** 66 (2 tela, 62 logica, 1 servidor, 0 dados, 1 estilo)
- **Tem servidor (rotas /api):** sim — veja o passo do servidor
- **Peças de fora (bibliotecas):**  + JSON.stringify(principal) + ,  + q + u + q + , child_process, crypto, electron, fs, http, net, os, path, react, react-dom, url, ws

## 2. Estrutura modular proposta

```
index.html            ← a página; chama os módulos NA ORDEM
css/app.css           ← o visual
js/00-core.js         ← a "locomotiva": cria window.APP (registrar, guardar, avisar)
js/10-conta.js        ← Mini SK — 04-conta.js SEM login, SEM nuvem, SEM banco de dados. Tudo f (era app/js/04-conta.js)
js/15-fs.js           ← Mini SK — 10-fs.js Projetos e arquivos. Cada projeto fica salvo no nav (era app/js/10-fs.js)
js/20-zip.js          ← Mini SK — 20-zip.js Lê e cria arquivos .zip SEM biblioteca externa (fu (era app/js/20-zip.js)
js/25-highlight.js    ← Mini SK — 30-highlight.js Cores do código (realce de sintaxe) para HTM (era app/js/30-highlight.js)
js/30-editor.js       ← Mini SK — 40-editor.js O editor de código: abas, cores, números de lin (era app/js/40-editor.js)
js/35-tree.js         ← Mini SK — 50-tree.js Árvore de arquivos: pastas dentro de pastas, cria (era app/js/50-tree.js)
js/40-preview.js      ← Mini SK — 60-preview.js Preview ao vivo, sempre na parte de baixo (pod (era app/js/60-preview.js)
js/45-tsx.js          ← Mini SK — 61-tsx.js ⚛️ Prévia de UM componente .tsx / .jsx (do jeito d (era app/js/61-tsx.js)
js/50-search.js       ← Mini SK — 70-search.js Buscar (e trocar) em todos os arquivos do proje (era app/js/70-search.js)
js/55-ai.js           ← Mini SK — 80-ai.js IA para ajudar a escrever código. - Chaves: cole qu (era app/js/80-ai.js)
js/60-80b-web.js      ← 🌐 Internet para a IA do Mini SK: pesquisar (DuckDuckGo, grátis, sem c (era app/js/80b-web.js)
js/65-gasto.js        ← Mini SK — 81-gasto.js 💰 Quanto a IA está gastando. - Depois de cada r (era app/js/81-gasto.js)
js/70-voz.js          ← Mini SK — 83-voz.js 🗣️ Voz e modo conversa (igual ao jurídico): - Voz (era app/js/83-voz.js)
js/75-ponte.js        ← Mini SK — 84-ponte.js 🔗 Ponte com os outros apps (cada um continua se (era app/js/84-ponte.js)
js/80-checkpoints.js  ← Mini SK — 85-checkpoints.js Pontos de volta. Uma "foto" de todos os ar (era app/js/85-checkpoints.js)
js/85-terminal.js     ← Mini SK — 86-terminal.js ⌨️ Terminal leve, ligado à ÁRVORE do projeto. (era app/js/86-terminal.js)
js/90-86b-node.js     ← logica (era app/js/86b-node.js)
js/91-86c-termux.js   ← logica (era app/js/86c-termux.js)
js/92-86e-atalhos.js  ← Mini SK — 86e-atalhos.js ⚡ Comandos prontos para os terminais (⚡ Node  (era app/js/86e-atalhos.js)
js/93-86f-pasta-viva.js← Mini SK — 86f-pasta-viva.js   (SÓ no Mini SK para PC) 📁 PASTA VIVA: i (era app/js/86f-pasta-viva.js)
js/94-86g-largura.js  ← Mini SK — 86g-largura.js ↔ Arraste a borda esquerda do painel (🤖 IA,  (era app/js/86g-largura.js)
js/95-86h-node-extra.js← Mini SK — 86h-node-extra.js Botões a mais no ⚡ Node (peça separada: se (era app/js/86h-node-extra.js)
js/96-links.js        ← Mini SK — 87-links.js 🔗 Meus Links: guarda os endereços dos seus PWAs (era app/js/87-links.js)
js/97-inventario.js   ← logica (era app/js/88-inventario.js)
js/98-config.js       ← Mini SK — 89-config.js ⚙️ Configuração: 🔑 Cofre de chaves (IA, GitHub (era app/js/89-config.js)
js/98-89b-cacador.js  ← Mini SK — 89b-cacador.js 🐞 CAÇADOR DE ERROS (para qualquer app que vo (era app/js/89b-cacador.js)
js/98-github.js       ← Mini SK — 90-github.js Repositório no GitHub, direto do navegador (sem (era app/js/90-github.js)
js/98-acoes.js        ← Mini SK — 91-acoes.js ⚙️ Execuções no GitHub (Actions) — dentro do pai (era app/js/91-acoes.js)
js/98-91b-publicar.js ← Mini SK — 91b-publicar.js 🚀 PUBLICAR — um botão para cada coisa (igua (era app/js/91b-publicar.js)
js/98-playground.js   ← Mini SK — 92-playground.js ▶️ Playground isolado, que abre ao lado (nã (era app/js/92-playground.js)
js/98-92c-importar.js ← Mini SK — 92c-importar.js 📥 IMPORTAR TUDO / ✂️ PICOTAR — o Picotador  (era app/js/92c-importar.js)
js/98-conversa.js     ← Mini SK — 93-conversa.js 🧩 Desembaralhar conversa: lê uma conversa co (era app/js/93-conversa.js)
js/98-fatiador.js     ← Mini SK — 94-fatiador.js ✂️ Fatiador: pega um arquivo grande (JS, TS,  (era app/js/94-fatiador.js)
js/98-pwa.js          ← logica (era app/js/95-pwa.js)
js/98-apk.js          ← logica (era app/js/96-apk.js)
js/98-96b-eas.js      ← logica (era app/js/96b-eas.js)
js/98-96c-preparar.js ← logica (era app/js/96c-preparar.js)
js/98-96d-exe-minisk.js← Mini SK — 96d-exe-minisk.js Quando o projeto aberto é o PRÓPRIO Mini S (era app/js/96d-exe-minisk.js)
js/98-96e-exe-python.js← Mini SK — 96e-exe-python.js 🪶 Programa .exe LEVE (Python, um arquivo  (era app/js/96e-exe-python.js)
js/98-analise.js      ← logica (era app/js/97-analise.js)
js/98-97b-cacabug.js  ← Mini SK — 97b-cacabug.js 🔬 Caça-Bug — DENTRO do Mini SK (não é um app (era app/js/97b-cacabug.js)
js/98-97c-modularizar.js← logica (era app/js/97c-modularizar.js)
js/98-97d-faxina.js   ← Mini SK — 97d-faxina.js  ·  🧹 Faxina do projeto (antes de importar) P (era app/js/97d-faxina.js)
js/98-api.js          ← Mini SK — 98-api.js 🧪 Testador da API do próprio projeto (o servidor  (era app/js/98-api.js)
js/98-cofre-arquivo.js← 🔐 Arquivo de chaves do Maikon — o MESMO formato no Mini SK, no Meu Ch (era app/js/lib/cofre-arquivo.js)
js/98-expo-core.js    ← expo-core.js — ☁️ Consertar um projeto EXPO para gerar APK pelo EAS Us (era app/js/lib/expo-core.js)
js/98-guia-maikon.js  ← 🧭 Guia das ferramentas do Maikon — o MESMO texto em todos os apps (Mi (era app/js/lib/guia-maikon.js)
js/98-analise.js      ← Laboratório — 30-analise.js: lê o projeto INTEIRO (vários arquivos ou  (era app/js/lib/lab/30-analise.js)
js/98-comparar.js     ← Laboratório — 50-comparar.js: ⚖️ A (o que funciona) × B (o que não fun (era app/js/lib/lab/50-comparar.js)
js/98-base.js         ← Picotador — 00-base.js: peças comuns (tela, avisos, baixar, tamanhos) (era app/js/lib/picotador/00-base.js)
js/98-ler.js          ← Picotador — 10-ler.js: descobre o que é o arquivo e transforma tudo nu (era app/js/lib/picotador/10-ler.js)
js/98-projetos.js     ← Picotador — 20-projetos.js: backup de tudo / projeto .zip → escolher p (era app/js/lib/picotador/20-projetos.js)
js/98-mensagens.js    ← Picotador — 30-mensagens.js: escolher a conversa, marcar só o pedaço q (era app/js/lib/picotador/30-mensagens.js)
js/98-plano-core.js   ← logica (era app/js/lib/plano-core.js)
js/98-receita-core.js ← receita-core.js — 🧬 Receita para recriar um projeto (sem IA). Lê os a (era app/js/lib/receita-core.js)
js/98-selar.js        ← Mini SK — js/lib/selar.js "Tranca" um segredo do jeito que o GitHub ex (era app/js/lib/selar.js)
js/98-ponte.js        ← Ponte de arquivos do Mini SK — no PC, o próprio programa liga (no celu (era electron/ponte.cjs)
js/98-terminal.js     ← Terminal do computador para o Mini SK — fala o mesmo "idioma" do ttyd  (era electron/terminal.cjs)
js/98-preload.js      ← Conta para o Mini SK que ele está no PC (terminal e ponte já ligados p (era electron/preload.cjs)
js/98-98b-rotas.js    ← Mini SK — 98b-rotas.js  ·  🧭 Mapa de Rotas (tela × servidor × manual) (era app/js/98b-rotas.js)
js/98-app.js          ← Mini SK (era app/index.html)
js/98-inicio.js       ← Mini-SK-PC-29-10-H — Mini-SK-PC-29-10-H (era index.html)
js/99-app.js          ← o último: monta a tela com o que embarcou
```

## 3. As partes, uma por uma

| # | Era | Vira | Tipo | O que faz | Usa |
|---|---|---|---|---|---|
| 1 | `app/js/00-core.js` | css/app.css | logica | Mini SK — 00-core.js Base de tudo: atalhos, eventos, avisos, janelas de confirmação e o ba | — |
| 2 | `app/js/04-conta.js` | `js/10-conta.js` | logica | Mini SK — 04-conta.js SEM login, SEM nuvem, SEM banco de dados. Tudo fica só neste aparelh | — |
| 3 | `app/js/10-fs.js` | `js/15-fs.js` | logica | Mini SK — 10-fs.js Projetos e arquivos. Cada projeto fica salvo no navegador (IndexedDB).  | — |
| 4 | `app/js/20-zip.js` | `js/20-zip.js` | logica | Mini SK — 20-zip.js Lê e cria arquivos .zip SEM biblioteca externa (funciona offline). Usa | — |
| 5 | `app/js/30-highlight.js` | `js/25-highlight.js` | logica | Mini SK — 30-highlight.js Cores do código (realce de sintaxe) para HTML, CSS, JavaScript/T | — |
| 6 | `app/js/40-editor.js` | `js/30-editor.js` | logica | Mini SK — 40-editor.js O editor de código: abas, cores, números de linha, Tab/Enter inteli | — |
| 7 | `app/js/50-tree.js` | `js/35-tree.js` | logica | Mini SK — 50-tree.js Árvore de arquivos: pastas dentro de pastas, criar, renomear, duplica | — |
| 8 | `app/js/60-preview.js` | `js/40-preview.js` | logica | Mini SK — 60-preview.js Preview ao vivo, sempre na parte de baixo (pode aumentar, diminuir | — |
| 9 | `app/js/61-tsx.js` | `js/45-tsx.js` | logica | Mini SK — 61-tsx.js ⚛️ Prévia de UM componente .tsx / .jsx (do jeito dos sites de "playgro | — |
| 10 | `app/js/70-search.js` | `js/50-search.js` | logica | Mini SK — 70-search.js Buscar (e trocar) em todos os arquivos do projeto. Cada resultado m | — |
| 11 | `app/js/80-ai.js` | `js/55-ai.js` | logica | Mini SK — 80-ai.js IA para ajudar a escrever código. - Chaves: cole qualquer chave, o prov | — |
| 12 | `app/js/80b-web.js` | `js/60-80b-web.js` | logica | 🌐 Internet para a IA do Mini SK: pesquisar (DuckDuckGo, grátis, sem chave) e ler links. O | — |
| 13 | `app/js/81-gasto.js` | `js/65-gasto.js` | logica | Mini SK — 81-gasto.js 💰 Quanto a IA está gastando. - Depois de cada resposta: tokens de e | — |
| 14 | `app/js/83-voz.js` | `js/70-voz.js` | logica | Mini SK — 83-voz.js 🗣️ Voz e modo conversa (igual ao jurídico): - Voz: Francisca (neural) | — |
| 15 | `app/js/84-ponte.js` | `js/75-ponte.js` | logica | Mini SK — 84-ponte.js 🔗 Ponte com os outros apps (cada um continua separado, sem bagunça) | — |
| 16 | `app/js/85-checkpoints.js` | `js/80-checkpoints.js` | logica | Mini SK — 85-checkpoints.js Pontos de volta. Uma "foto" de todos os arquivos do projeto. - | — |
| 17 | `app/js/86-terminal.js` | `js/85-terminal.js` | logica | Mini SK — 86-terminal.js ⌨️ Terminal leve, ligado à ÁRVORE do projeto. Funciona no celular | — |
| 18 | `app/js/86b-node.js` | `js/90-86b-node.js` | logica | ehSite, lacreLigado, registrarSW, ligarLacre | — |
| 19 | `app/js/86c-termux.js` | `js/91-86c-termux.js` | logica | status, carregarScript, carregarCss, prepararTela | — |
| 20 | `app/js/86e-atalhos.js` | `js/92-86e-atalhos.js` | logica | Mini SK — 86e-atalhos.js ⚡ Comandos prontos para os terminais (⚡ Node e 📱 Termux): um toq | — |
| 21 | `app/js/86f-pasta-viva.js` | `js/93-86f-pasta-viva.js` | logica | Mini SK — 86f-pasta-viva.js   (SÓ no Mini SK para PC) 📁 PASTA VIVA: igual ao VS Code. Cad | — |
| 22 | `app/js/86g-largura.js` | `js/94-86g-largura.js` | logica | Mini SK — 86g-largura.js ↔ Arraste a borda esquerda do painel (🤖 IA, 💻 Terminal…) para d | — |
| 23 | `app/js/86h-node-extra.js` | `js/95-86h-node-extra.js` | logica | Mini SK — 86h-node-extra.js Botões a mais no ⚡ Node (peça separada: se der problema, o Nod | — |
| 24 | `app/js/87-links.js` | `js/96-links.js` | logica | Mini SK — 87-links.js 🔗 Meus Links: guarda os endereços dos seus PWAs e sites num lugar s | — |
| 25 | `app/js/88-inventario.js` | `js/97-inventario.js` | logica | texto, limpaTag, familia, analisar | — |
| 26 | `app/js/89-config.js` | `js/98-config.js` | logica | Mini SK — 89-config.js ⚙️ Configuração: 🔑 Cofre de chaves (IA, GitHub e "Minhas chaves"). | — |
| 27 | `app/js/89b-cacador.js` | `js/98-89b-cacador.js` | logica | Mini SK — 89b-cacador.js 🐞 CAÇADOR DE ERROS (para qualquer app que você rodar aqui) Junta | — |
| 28 | `app/js/90-github.js` | `js/98-github.js` | logica | Mini SK — 90-github.js Repositório no GitHub, direto do navegador (sem servidor, sem Repli | — |
| 29 | `app/js/91-acoes.js` | `js/98-acoes.js` | logica | Mini SK — 91-acoes.js ⚙️ Execuções no GitHub (Actions) — dentro do painel 🐙 GitHub. Antes | — |
| 30 | `app/js/91b-publicar.js` | `js/98-91b-publicar.js` | logica | Mini SK — 91b-publicar.js 🚀 PUBLICAR — um botão para cada coisa (igual ao APK Builder): ? | — |
| 31 | `app/js/92-playground.js` | `js/98-playground.js` | logica | Mini SK — 92-playground.js ▶️ Playground isolado, que abre ao lado (não é a primeira tela) | — |
| 32 | `app/js/92c-importar.js` | `js/98-92c-importar.js` | logica | Mini SK — 92c-importar.js 📥 IMPORTAR TUDO / ✂️ PICOTAR — o Picotador dentro do Mini SK. A | — |
| 33 | `app/js/93-conversa.js` | `js/98-conversa.js` | logica | Mini SK — 93-conversa.js 🧩 Desembaralhar conversa: lê uma conversa copiada do app de IA ( | — |
| 34 | `app/js/94-fatiador.js` | `js/98-fatiador.js` | logica | Mini SK — 94-fatiador.js ✂️ Fatiador: pega um arquivo grande (JS, TS, TSX, HTML, CSS, Pyth | — |
| 35 | `app/js/95-pwa.js` | `js/98-pwa.js` | logica | gradFill, shapePath, hexA, content | favicon.ico, icon.svg, apple-touch-icon.png |
| 36 | `app/js/96-apk.js` | `js/98-apk.js` | logica | wfNome, receitas, MainActivity, Voz | package.json |
| 37 | `app/js/96b-eas.js` | `js/98-96b-eas.js` | logica | versaoBase, majorExpo, lerJson, conferir | app.json |
| 38 | `app/js/96c-preparar.js` | `js/98-96c-preparar.js` | logica | lerJSON, raizPkg, permissoes, analisar | — |
| 39 | `app/js/96d-exe-minisk.js` | `js/98-96d-exe-minisk.js` | logica | Mini SK — 96d-exe-minisk.js Quando o projeto aberto é o PRÓPRIO Mini SK, o .exe sai como o | ponte.cjs, terminal.cjs |
| 40 | `app/js/96e-exe-python.js` | `js/98-96e-exe-python.js` | logica | Mini SK — 96e-exe-python.js 🪶 Programa .exe LEVE (Python, um arquivo só) — igual ao do ju | — |
| 41 | `app/js/97-analise.js` | `js/98-analise.js` | logica | explain, scriptHelp, parseCatalog, analyze | — |
| 42 | `app/js/97b-cacabug.js` | `js/98-97b-cacabug.js` | logica | Mini SK — 97b-cacabug.js 🔬 Caça-Bug — DENTRO do Mini SK (não é um app separado): - 🔍 lê  | — |
| 43 | `app/js/97c-modularizar.js` | `js/98-97c-modularizar.js` | logica | dirDe, normalizar, juntarCaminho, relativo | ,  |
| 44 | `app/js/97d-faxina.js` | `js/98-97d-faxina.js` | logica | Mini SK — 97d-faxina.js  ·  🧹 Faxina do projeto (antes de importar) Para projetos grandes | — |
| 45 | `app/js/98-api.js` | `js/98-api.js` | logica | Mini SK — 98-api.js 🧪 Testador da API do próprio projeto (o servidor rodando no seu PC, e | — |
| 46 | `app/js/99-app.js` | css/app.css | logica | Mini SK — 99-app.js Junta tudo: barra de cima, gavetas (Arquivos à esquerda; IA, Busca, Ch | estilo.css, app.js |
| 47 | `app/js/lib/cofre-arquivo.js` | `js/98-cofre-arquivo.js` | logica | 🔐 Arquivo de chaves do Maikon — o MESMO formato no Mini SK, no Meu Chat e no que vier dep | — |
| 48 | `app/js/lib/expo-core.js` | `js/98-expo-core.js` | logica | expo-core.js — ☁️ Consertar um projeto EXPO para gerar APK pelo EAS Usado pelo Caça-Bug (D | app.json |
| 49 | `app/js/lib/guia-maikon.js` | `js/98-guia-maikon.js` | logica | 🧭 Guia das ferramentas do Maikon — o MESMO texto em todos os apps (Mini SK, Meu Chat…). A | — |
| 50 | `app/js/lib/lab/30-analise.js` | `js/98-analise.js` | logica | Laboratório — 30-analise.js: lê o projeto INTEIRO (vários arquivos ou um HTML só) e descob | — |
| 51 | `app/js/lib/lab/50-comparar.js` | `js/98-comparar.js` | logica | Laboratório — 50-comparar.js: ⚖️ A (o que funciona) × B (o que não funciona), lado a lado. | — |
| 52 | `app/js/lib/picotador/00-base.js` | `js/98-base.js` | logica | Picotador — 00-base.js: peças comuns (tela, avisos, baixar, tamanhos) | — |
| 53 | `app/js/lib/picotador/10-ler.js` | `js/98-ler.js` | logica | Picotador — 10-ler.js: descobre o que é o arquivo e transforma tudo num formato só. Conver | — |
| 54 | `app/js/lib/picotador/20-projetos.js` | `js/98-projetos.js` | logica | Picotador — 20-projetos.js: backup de tudo / projeto .zip → escolher projetos, refazer o . | — |
| 55 | `app/js/lib/picotador/30-mensagens.js` | `js/98-mensagens.js` | logica | Picotador — 30-mensagens.js: escolher a conversa, marcar só o pedaço que quer, dividir em  | — |
| 56 | `app/js/lib/plano-core.js` | `js/98-plano-core.js` | logica | ext, uniq, normRota, arvore | — |
| 57 | `app/js/lib/receita-core.js` | `js/98-receita-core.js` | logica | receita-core.js — 🧬 Receita para recriar um projeto (sem IA). Lê os arquivos, descobre o  | a.js, …, app.css |
| 58 | `app/js/lib/selar.js` | `js/98-selar.js` | logica | Mini SK — js/lib/selar.js "Tranca" um segredo do jeito que o GitHub exige para guardar em  | — |
| 59 | `electron/ponte.cjs` | `js/98-ponte.js` | logica | Ponte de arquivos do Mini SK — no PC, o próprio programa liga (no celular, roda no Termux) | — |
| 60 | `electron/terminal.cjs` | `js/98-terminal.js` | logica | Terminal do computador para o Mini SK — fala o mesmo "idioma" do ttyd (o do Termux), então | — |
| 61 | `electron/main.cjs` | css/app.css | logica | Mini SK para PC — abre o Mini SK numa janela própria e liga, por dentro: - o 💻 Terminal d | ponte.cjs, terminal.cjs |
| 62 | `electron/preload.cjs` | `js/98-preload.js` | logica | Conta para o Mini SK que ele está no PC (terminal e ponte já ligados pelo programa) | — |
| 63 | `app/js/98b-rotas.js` | `js/98-98b-rotas.js` | servidor | Mini SK — 98b-rotas.js  ·  🧭 Mapa de Rotas (tela × servidor × manual) Para o "Failed to f | plano-b.js |
| 64 | `app/css/app.css` | css/app.css | estilo | Mini SK — app.css   (tema escuro, celular e computador) | — |
| 65 | `app/index.html` | `js/98-app.js` | tela | Mini SK | app.css, manifest.json, favicon.ico, icon.svg |
| 66 | `index.html` | `js/98-inicio.js` | tela | Mini-SK-PC-29-10-H — Mini-SK-PC-29-10-H | manifest.json, favicon.ico, icon.svg, apple-touch-icon.png |

## 4. Montar passo a passo (cada bloco é um pedido pronto: 📋 Copiar → colar na IA)

### Passo 0 — combinar as regras com a IA

```text
Vamos recriar o app "Mini SK" como HTML MODULAR, que abre pelo index.html, sem servidor e sem nada da Replit.
Regras: (1) index.html chama os arquivos js/ na ordem, antes do </body>; (2) js/00-core.js cria window.APP com APP.registrar(modulo), APP.guardar(chave, valor) em IndexedDB/localStorage e APP.avisar(texto); (3) cada arquivo js/NN-nome.js cuida de UM assunto, começa com (function (APP) { e termina com })(window.APP); (4) js/99-app.js vem por último e monta a tela com os módulos registrados; (5) textos em português do Brasil.
Vou pedir UM arquivo por vez. Responda só com o arquivo completo, sem cortar nada. Primeiro: crie index.html, css/app.css e js/00-core.js.
```

### Passo 1 — `js/10-conta.js` (era `app/js/04-conta.js`, 25 linhas)

```text
Crie js/10-conta.js. Ele faz: Mini SK — 04-conta.js SEM login, SEM nuvem, SEM banco de dados. Tudo fica só neste aparelho. Este arquivo só existe para os outros módulos continuarem funcionando: ele diz "não há nuvem" e limpa qualquer ligação antiga com o Supabase.
No app original ele tinha estas funções/partes: nada.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 2 — `js/15-fs.js` (era `app/js/10-fs.js`, 284 linhas)

```text
Crie js/15-fs.js. Ele faz: Mini SK — 10-fs.js Projetos e arquivos. Cada projeto fica salvo no navegador (IndexedDB). - Reconhece o tipo do arquivo pela extensão (HTML, CSS, JS, JSON, Python…) - Reconhece a codificação (UTF-8, UTF-8 com BOM, UTF-16, Windows-1252/Latin-1).
No app original ele tinha estas funções/partes: extOf, baseName, dirName, norm, typeOf, decodeBytes, looksBinary, toBase64, fromBase64, recordFromBytes, saveNow, touch, getDir, sort, ensureParents, commonRoot.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 3 — `js/20-zip.js` (era `app/js/20-zip.js`, 219 linhas)

```text
Crie js/20-zip.js. Ele faz: Mini SK — 20-zip.js Lê e cria arquivos .zip SEM biblioteca externa (funciona offline). Usa o descompactador que já vem no navegador (DecompressionStream).
No app original ele tinha estas funções/partes: CRC_TABLE, crc32, streamThrough, read, write, tipoPorBytes, tarCabecalhoOk, ehCompactado, nomeSemExt, formatoNaoAbre, lerTar, str, readAny.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 4 — `js/25-highlight.js` (era `app/js/30-highlight.js`, 127 linhas)

```text
Crie js/25-highlight.js. Ele faz: Mini SK — 30-highlight.js Cores do código (realce de sintaxe) para HTML, CSS, JavaScript/TypeScript, JSON, Python, Markdown, SQL, YAML/.env e Shell. Sem biblioteca externa.
No app original ele tinha estas funções/partes: esc, span, lex, html.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 5 — `js/30-editor.js` (era `app/js/40-editor.js`, 261 linhas)

```text
Crie js/30-editor.js. Ele faz: Mini SK — 40-editor.js O editor de código: abas, cores, números de linha, Tab/Enter inteligentes, ir para linha, selecionar um trecho (usado pela busca e pela IA). Imagens abrem como imagem; outros binários mostram tamanho e "Baixar".
No app original ele tinha estas funções/partes: build, applyPrefs, paint, paintSoon, syncScroll, renderTabs, updateStatus, open, close, showEmpty, onInput, insertText, onKey, goToLinePrompt, reveal.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 6 — `js/35-tree.js` (era `app/js/50-tree.js`, 240 linhas)

```text
Crie js/35-tree.js. Ele faz: Mini SK — 50-tree.js Árvore de arquivos: pastas dentro de pastas, criar, renomear, duplicar, mover (arrastando ou digitando o caminho), apagar, baixar, analisar com IA. Importa arquivos soltos, pasta inteira ou .zip.
No app original ele tinha estas funções/partes: build, render, walk, targetDir, onClick, toolbar, newFile, newDir, starter, expandTo, rename, moveAsk, move, remove, downloadNode, openMenu, popup, outside.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 7 — `js/40-preview.js` (era `app/js/60-preview.js`, 380 linhas)

```text
Crie js/40-preview.js. Ele faz: Mini SK — 60-preview.js Preview ao vivo, sempre na parte de baixo (pode aumentar, diminuir ou esconder arrastando a barrinha). Monta a página com TODOS os arquivos do projeto: CSS, JS, imagens, módulos (import/export) e até fetch('dados.json').
No app original ele tinha estas funções/partes: build, onClick, applySize, setupGrip, end, htmlFiles, pickTarget, fillSelect, isExternal, resolve, revokeAll, mkPage, fileURL, rewriteCss, rewriteModule, fix, consoleShim, buildHtml.
O original usava as bibliotecas  + q + u + q + : em HTML puro, use a versão de CDN (ou faça sem ela, se for simples).
Ele chamava estes endereços: dados.json. Em HTML, ligue cada um à função equivalente do módulo certo.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 8 — `js/45-tsx.js` (era `app/js/61-tsx.js`, 133 linhas)

```text
Crie js/45-tsx.js. Ele faz: Mini SK — 61-tsx.js ⚛️ Prévia de UM componente .tsx / .jsx (do jeito dos sites de "playground"): - traduz o TSX para JavaScript (Babel, baixado uma vez da internet); - segue os imports do próprio projeto (./x, ../x, @/x) e traduz também;.
No app original ele tinha estas funções/partes: carregarBabel, acharArquivo, tentar, deFora, montar, urlDe, mostrarErro, Guarda.
O original usava as bibliotecas react, react-dom,  + JSON.stringify(principal) + : em HTML puro, use a versão de CDN (ou faça sem ela, se for simples).
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 9 — `js/50-search.js` (era `app/js/70-search.js`, 119 linhas)

```text
Crie js/50-search.js. Ele faz: Mini SK — 70-search.js Buscar (e trocar) em todos os arquivos do projeto. Cada resultado mostra arquivo e linha com o trecho DESTACADO; tocar abre o arquivo já com o trecho selecionado. "Trocar tudo" cria um checkpoint antes.
No app original ele tinha estas funções/partes: build, makeRegex, includeFilter, search, replaceAll.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 10 — `js/55-ai.js` (era `app/js/80-ai.js`, 887 linhas)

```text
Crie js/55-ai.js. Ele faz: Mini SK — 80-ai.js IA para ajudar a escrever código. - Chaves: cole qualquer chave, o provedor é reconhecido sozinho (Groq gsk_, Gemini AIza, OpenAI sk-, Claude sk-ant-, OpenRouter sk-or-, xAI xai-).
No app original ele tinha estas funções/partes: detect, saveKeys, current, curInfo, tok, adjust, aiFetch, errorText, gFetch, geminiBody, listModels, paraAnthropic, paraOpenAI, temImagem, chat, finish, dicaImagem, readSSE.
Ele chamava estes endereços: https://api.anthropic.com/v1/models?limit=100, http://127.0.0.1:11434/api/version. Em HTML, ligue cada um à função equivalente do módulo certo.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 11 — `js/60-80b-web.js` (era `app/js/80b-web.js`, 159 linhas)

```text
Crie js/60-80b-web.js. Ele faz: 🌐 Internet para a IA do Mini SK: pesquisar (DuckDuckGo, grátis, sem chave) e ler links. O navegador não deixa uma página ler outros sites direto (a trava "CORS"). Então tenta, nesta ordem: 1. 📦 dentro do APK: o próprio Android busca (AndroidBridge.buscar) 2. 💻 no Mini SK para PC: o programa busca (miniskPC.buscar).
No app original ele tinha estas funções/partes: porAndroid, comTempo, texto, limpar, linkReal, lerResultadosHTML, lerResultadosMD, wikipedia, pesquisar, lerPagina, blocoPesquisa, blocoLink.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 12 — `js/65-gasto.js` (era `app/js/81-gasto.js`, 142 linhas)

```text
Crie js/65-gasto.js. Ele faz: Mini SK — 81-gasto.js 💰 Quanto a IA está gastando. - Depois de cada resposta: tokens de entrada (↑ o que foi enviado), tokens de saída (↓ o que a IA escreveu) e o custo em reais.
No app original ele tinha estas funções/partes: dolar, limiteMes, avisoPedido, preco, brl, fmt, custo, registra, totais, antes, previa, resumoHTML, painel.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 13 — `js/70-voz.js` (era `app/js/83-voz.js`, 166 linhas)

```text
Crie js/70-voz.js. Ele faz: Mini SK — 83-voz.js 🗣️ Voz e modo conversa (igual ao jurídico): - Voz: Francisca (neural) quando existe no aparelho, velocidade 1,15, tom 0,95. No PC, pelo navegador Edge, aparece "Microsoft Francisca Online (Natural)".
No app original ele tinha estas funções/partes: salvar, carregarVozes, melhorVoz, limpar, pedacos, falar, parar, estado, ouvir, norm, ehEco, enviarFala, ligar, desligar, ajustesHTML, ligarAjustes.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 14 — `js/75-ponte.js` (era `app/js/84-ponte.js`, 68 linhas)

```text
Crie js/75-ponte.js. Ele faz: Mini SK — 84-ponte.js 🔗 Ponte com os outros apps (cada um continua separado, sem bagunça): - 🩺 Mandar o projeto aberto para o Cirurgião (detectar problemas, corrigir). - ↩️ Receber de volta só os arquivos que o Cirurgião corrigiu.
No app original ele tinha estas funções/partes: endereco, arquivosDoProjeto, mandarCirurgiao.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 15 — `js/80-checkpoints.js` (era `app/js/85-checkpoints.js`, 121 linhas)

```text
Crie js/80-checkpoints.js. Ele faz: Mini SK — 85-checkpoints.js Pontos de volta. Uma "foto" de todos os arquivos do projeto. - Manual: você cria quando quiser (botão 📸 ou Ctrl+S duas vezes). - Automático: antes de apagar, importar, trocar tudo, aplicar código da IA,.
No app original ele tinha estas funções/partes: sizeOf, create, prune, list, restore, remove, diff, build, render, onClick, sec.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 16 — `js/85-terminal.js` (era `app/js/86-terminal.js`, 411 linhas)

```text
Crie js/85-terminal.js. Ele faz: Mini SK — 86-terminal.js ⌨️ Terminal leve, ligado à ÁRVORE do projeto. Funciona no celular, sem internet e sem instalar nada. Criou uma pasta aqui, ela aparece em ☰. Comandos: ls, cd, pwd, tree, cat, head, tail, wc, mkdir, touch, rm, mv, cp,.
No app original ele tinha estas funções/partes: resolve, isDir, isFile, children, allUnder, base, join, print, err, printHTML, promptText, words, flags, checkpoint, show, walk, encName, npmJSON.
Ele chamava estes endereços: https://registry.npmjs.org, https://api.npms.io/v2/search?size=15&q=. Em HTML, ligue cada um à função equivalente do módulo certo.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 17 — `js/90-86b-node.js` (era `app/js/86b-node.js`, 229 linhas)

```text
Crie js/90-86b-node.js. Ele é uma parte de logica do app.
No app original ele tinha estas funções/partes: ehSite, lacreLigado, registrarSW, ligarLacre, carregarScript, carregarCss, arvore, ligar, mostrarServidor, trazer, andar, status, teclas, build, rodar, mandar.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 18 — `js/91-86c-termux.js` (era `app/js/86c-termux.js`, 431 linhas)

```text
Crie js/91-86c-termux.js. Ele é uma parte de logica do app.
No app original ele tinha estas funções/partes: status, carregarScript, carregarCss, prepararTela, escreverTela, enviar, tamanho, conectar, desconectar, copiar, buildPC, letra, irParaPasta, build, enderecoVer, pst, rodarP, nomeProj.
O original usava as bibliotecas http, fs, path, os: em HTML puro, use a versão de CDN (ou faça sem ela, se for simples).
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 19 — `js/92-86e-atalhos.js` (era `app/js/86e-atalhos.js`, 75 linhas)

```text
Crie js/92-86e-atalhos.js. Ele faz: Mini SK — 86e-atalhos.js ⚡ Comandos prontos para os terminais (⚡ Node e 📱 Termux): um toque e o comando vai. Lê o package.json do projeto e cria um botão para cada "npm run …" que existe nele. Usado por 86b-node.js e 86c-termux.js.
No app original ele tinha estas funções/partes: pacotes, montar, pintar, pre.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 20 — `js/93-86f-pasta-viva.js` (era `app/js/86f-pasta-viva.js`, 137 linhas)

```text
Crie js/93-86f-pasta-viva.js. Ele faz: Mini SK — 86f-pasta-viva.js   (SÓ no Mini SK para PC) 📁 PASTA VIVA: igual ao VS Code. Cada projeto é uma pasta de verdade no computador (Documentos\Mini-SK\NOME-DO-PROJETO) e fica SEMPRE igual à árvore: - você mexe na árvore/editor  → vai sozinho para a pasta;.
No app original ele tinha estas funções/partes: nomeProj, pasta, assin, assinRec, estado, chamar, item, mandar, iniciar, olhar, esvaziar.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 21 — `js/94-86g-largura.js` (era `app/js/86g-largura.js`, 37 linhas)

```text
Crie js/94-86g-largura.js. Ele faz: Mini SK — 86g-largura.js ↔ Arraste a borda esquerda do painel (🤖 IA, 💻 Terminal…) para deixar mais largo ou mais estreito. Fica guardado. No PC, o 💻 Terminal já abre largo (antes ficava espremido em 400px e não dava para ler).
No app original ele tinha estas funções/partes: aplicar, ligar, mover, soltar.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 22 — `js/95-86h-node-extra.js` (era `app/js/86h-node-extra.js`, 68 linhas)

```text
Crie js/95-86h-node-extra.js. Ele faz: Mini SK — 86h-node-extra.js Botões a mais no ⚡ Node (peça separada: se der problema, o Node continua igual): 🔗 Árvore ligada — o que o Node cria/muda (dist, arquivos novos) aparece sozinho na árvore 🤖 Chamar a IA · 🦙 Usar o Ollama · 👁 Ver na tela o que o npm run dev ligou.
No app original ele tinha estas funções/partes: puxar, ligarArvore, montar.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 23 — `js/96-links.js` (era `app/js/87-links.js`, 210 linhas)

```text
Crie js/96-links.js. Ele faz: Mini SK — 87-links.js 🔗 Meus Links: guarda os endereços dos seus PWAs e sites num lugar só (eles não somem como os "instalados" que o celular apaga). - Colar um ou vários links de uma vez; nome e ícone automáticos.
No app original ele tinha estas funções/partes: salvarLocal, salvar, carregar, sincNuvem, icone, nomeDe, extrair, build, juntar, adicionar, render, onListClick, paginaHTML, criarPagina, conversa.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 24 — `js/97-inventario.js` (era `app/js/88-inventario.js`, 183 linhas)

```text
Crie js/97-inventario.js. Ele é uma parte de logica do app.
No app original ele tinha estas funções/partes: texto, limpaTag, familia, analisar, lerArquivos, doProjeto, completude, grupos, oQueFaz, render, manualMD, pedirIA, build.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 25 — `js/98-config.js` (era `app/js/89-config.js`, 327 linhas)

```text
Crie js/98-config.js. Ele faz: Mini SK — 89-config.js ⚙️ Configuração: 🔑 Cofre de chaves (IA, GitHub e "Minhas chaves"). Tudo guardado SÓ neste aparelho. Sem login, sem nuvem.
No app original ele tinha estas funções/partes: extras, cofreLocal, aplicaCofre, auto, enviaProjeto, sincPlayground, setStatus, build, renderAll, renderConta, todasAsChaves, renderCofre, conteudoDoCofre, baixarCofre, trazerCofre, mask, renderBackup, renderNuvem.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 26 — `js/98-89b-cacador.js` (era `app/js/89b-cacador.js`, 123 linhas)

```text
Crie js/98-89b-cacador.js. Ele faz: Mini SK — 89b-cacador.js 🐞 CAÇADOR DE ERROS (para qualquer app que você rodar aqui) Junta num lugar só os erros da PRÉVIA (tela), das chamadas ao SERVIDOR e dos TERMINAIS (⚡ Node, 📱 Termux, 💻 PC). Diz em português se é normal,.
No app original ele tinha estas funções/partes: esconder, explicar, anotar, falou, diagnostico, pintarBotao, relatorio, pintar, abrir.
Ele chamava estes endereços: sw.js, http://127.0.0.1:. Em HTML, ligue cada um à função equivalente do módulo certo.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 27 — `js/98-github.js` (era `app/js/90-github.js`, 321 linhas)

```text
Crie js/98-github.js. Ele faz: Mini SK — 90-github.js Repositório no GitHub, direto do navegador (sem servidor, sem Replit): - Cole seu token (github.com/settings/tokens — "Fine-grained", com acesso "Contents: Read and write" nos repositórios; para criar repositório.
No app original ele tinha estas funções/partes: explain, pool, worker, gitSha, parseRepo, linkKey, getLink, setLink, status, importRepo, push, createRepo, enablePages, ensureUser, repoSlug, resolveRepo, ensureRepo, sendTo.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 28 — `js/98-acoes.js` (era `app/js/91-acoes.js`, 232 linhas)

```text
Crie js/98-acoes.js. Ele faz: Mini SK — 91-acoes.js ⚙️ Execuções no GitHub (Actions) — dentro do painel 🐙 GitHub. Antes o Mini SK só ENVIAVA. Agora ele também mostra o que o GitHub faz com o que foi enviado:.
No app original ele tinha estas funções/partes: stop, status, base, mount, pickRepo, load, renderWorkflows, renderRuns, onClick, follow, tick, detail, logExcerpt, downloads, afterPush.
Ele chamava estes endereços: https://api.github.com. Em HTML, ligue cada um à função equivalente do módulo certo.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 29 — `js/98-91b-publicar.js` (era `app/js/91b-publicar.js`, 127 linhas)

```text
Crie js/98-91b-publicar.js. Ele faz: Mini SK — 91b-publicar.js 🚀 PUBLICAR — um botão para cada coisa (igual ao APK Builder): 🌐 Site / PWA (GitHub Pages) · 📦 APK · 💻 .exe E a lista 📜 MINHAS PUBLICAÇÕES: o link fica guardado e NÃO some quando.
No app original ele tinha estas funções/partes: hist, guardar, pintarHist, publicarSite, ondePegar, tudo, build, rodar.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 30 — `js/98-playground.js` (era `app/js/92-playground.js`, 385 linhas)

```text
Crie js/98-playground.js. Ele faz: Mini SK — 92-playground.js ▶️ Playground isolado, que abre ao lado (não é a primeira tela). Vem do CodeLens, sem servidor: - HTML (+ CSS + JS), React (JSX) e Python (no próprio navegador).
No app original ele tinha estas funções/partes: App, fresh, esc, prepJSX, page, add, cleanPage, detectMode, build, slug, setMode, paintTabs, paintAll, clearCon, log, run, full, close.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 31 — `js/98-92c-importar.js` (era `app/js/92c-importar.js`, 85 linhas)

```text
Crie js/98-92c-importar.js. Ele faz: Mini SK — 92c-importar.js 📥 IMPORTAR TUDO / ✂️ PICOTAR — o Picotador dentro do Mini SK. Abre memória, backup de tudo, projeto .zip e conversas do ChatGPT/Claude, deixa escolher só o pedaço, e TRAZ DIRETO para o Mini SK (sem baixar nada):.
No app original ele tinha estas funções/partes: trazerProjetos, porMemoria, build.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 32 — `js/98-conversa.js` (era `app/js/93-conversa.js`, 141 linhas)

```text
Crie js/98-conversa.js. Ele faz: Mini SK — 93-conversa.js 🧩 Desembaralhar conversa: lê uma conversa copiada do app de IA (Monica, ChatGPT, Claude…) onde o código veio SEM marcação (sem ```), separa o que é texto e o que é código, e recupera cada arquivo:.
No app original ele tinha estas funções/partes: codeScore, sniff, slug, parse, startBlock, indexMD, toTXT.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 33 — `js/98-fatiador.js` (era `app/js/94-fatiador.js`, 389 linhas)

```text
Crie js/98-fatiador.js. Ele faz: Mini SK — 94-fatiador.js ✂️ Fatiador: pega um arquivo grande (JS, TS, TSX, HTML, CSS, Python, MD) e divide em BLOCOS de lógica (imports, funções, componentes, classes, tipos, estilos, scripts…), com um ÍNDICE.
No app original ele tinha estas funções/partes: lineStates, nameOfJs, splitByStarts, pullComments, splitJs, tryBase, short, splitCss, splitPy, splitMd, splitPlain, splitHtml, push, langOf, slice, rejoin, fence, slug.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 34 — `js/98-pwa.js` (era `app/js/95-pwa.js`, 613 linhas)

```text
Crie js/98-pwa.js. Ele é uma parte de logica do app.
No app original ele tinha estas funções/partes: gradFill, shapePath, hexA, content, draw, render, toBytes, svg, ico, iconFiles, saveFiles, rel, resolveFrom, titleOf, slug, initials, colorOf, manifestOf.
Ele chamava estes endereços: ./. Em HTML, ligue cada um à função equivalente do módulo certo.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 35 — `js/98-apk.js` (era `app/js/96-apk.js`, 1396 linhas)

```text
Crie js/98-apk.js. Ele é uma parte de logica do app.
No app original ele tinha estas funções/partes: wfNome, receitas, MainActivity, Voz, Fala, Ponte, mandar, salvar, nomeDe, local, slug, pkgPart, readCfg, validPkg, prepare, servir, EXE_RECEITA, temServidor.
O original usava as bibliotecas electron, path, fs, http: em HTML puro, use a versão de CDN (ou faça sem ela, se for simples).
Ele chamava estes endereços: https://api.github.com/repos/. Em HTML, ligue cada um à função equivalente do módulo certo.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 36 — `js/98-96b-eas.js` (era `app/js/96b-eas.js`, 278 linhas)

```text
Crie js/98-96b-eas.js. Ele é uma parte de logica do app.
No app original ele tinha estas funções/partes: versaoBase, majorExpo, lerJson, conferir, add, corrigir, testarExpo, repoOf, guardarSegredo, enviarEGerar, ultimo, parar, acompanhar, tick, status, build, rodar, fill.
O original usava as bibliotecas fs: em HTML puro, use a versão de CDN (ou faça sem ela, se for simples).
Ele chamava estes endereços: https://api.expo.dev/graphql. Em HTML, ligue cada um à função equivalente do módulo certo.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 37 — `js/98-96c-preparar.js` (era `app/js/96c-preparar.js`, 554 linhas)

```text
Crie js/98-96c-preparar.js. Ele é uma parte de logica do app.
No app original ele tinha estas funções/partes: lerJSON, raizPkg, permissoes, analisar, add, pastaDoBuild, nomeApp, idApp, receitaCap, criarCapacitor, MAIN_CJS, criarJanela, criarDesktop, receita, gerarPlano, tirarReplitDoCodigo, fazerTudo, quer.
O original usava as bibliotecas electron, path, fs, url: em HTML puro, use a versão de CDN (ou faça sem ela, se for simples).
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 38 — `js/98-96d-exe-minisk.js` (era `app/js/96d-exe-minisk.js`, 27 linhas)

```text
Crie js/98-96d-exe-minisk.js. Ele faz: Mini SK — 96d-exe-minisk.js Quando o projeto aberto é o PRÓPRIO Mini SK, o .exe sai como o Mini SK para PC de verdade (com o terminal do computador, a ponte e a pasta viva), e não a "casca só de tela" (que abria o terminal pedindo Termux).
No app original ele tinha estas funções/partes: log, portaOcupada, servirApp, ligarTudo, pedir, ollamaLigado, ligarOllama, iniciarTerminal, mandar, curto, prompt, trocarLinha, parar, expandir, rodar, tecla, nomeProj, dentro.
O original usava as bibliotecas electron, child_process, path, fs, http, net, crypto, ws, os: em HTML puro, use a versão de CDN (ou faça sem ela, se for simples).
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 39 — `js/98-96e-exe-python.js` (era `app/js/96e-exe-python.js`, 33 linhas)

```text
Crie js/98-96e-exe-python.js. Ele faz: Mini SK — 96e-exe-python.js 🪶 Programa .exe LEVE (Python, um arquivo só) — igual ao do jurídico que funciona. Sem Electron: pequeno (uns 10 MB) e sem tela preta. Abre o app numa janela do Edge/Chrome. Para o próprio Mini SK, já vem com o "lacre" ligado.
No app original ele tinha estas funções/partes: Pagina, __init__, send_head, end_headers, log_message, ja_ligado, abrir_janela, main, pasta_documentos, log, ollama_ligado, ligar_ollama, desligar_ollama, responder, do_GET, do_POST, nome_proj, dentro.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 40 — `js/98-analise.js` (era `app/js/97-analise.js`, 448 linhas)

```text
Crie js/98-analise.js. Ele é uma parte de logica do app.
No app original ele tinha estas funções/partes: explain, scriptHelp, parseCatalog, analyze, addUse, treeText, walk, planMD, unifiedPkg, sortObj, batText, aiPack, parseMarked, cleanViteConfig, rep, cleanReplit, convParse, desc.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 41 — `js/98-97b-cacabug.js` (era `app/js/97b-cacabug.js`, 185 linhas)

```text
Crie js/98-97b-cacabug.js. Ele faz: Mini SK — 97b-cacabug.js 🔬 Caça-Bug — DENTRO do Mini SK (não é um app separado): - 🔍 lê o projeto aberto inteiro (o motor do Laboratório) e acha os defeitos: nome declarado 2 vezes, erro de escrita, arquivo que não existe, botão que.
No app original ele tinha estas funções/partes: script, carregar, converter, atual, onde, abrirEm, paraIA, pedidoConserto, procurar, itemProblema, aoVivo, pintar, problemaDe, opcoesComparar, comparar, build, visivel, pintarVivos.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 42 — `js/98-97c-modularizar.js` (era `app/js/97c-modularizar.js`, 316 linhas)

```text
Crie js/98-97c-modularizar.js. Ele é uma parte de logica do app.
No app original ele tinha estas funções/partes: dirDe, normalizar, juntarCaminho, relativo, externo, moverCss, fix, nomeLimpo, pad, linhas, idsDe, andar, declaradosNaHora, idsPadrao, partirScript, usaNaHora, dividir, tag.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 43 — `js/98-97d-faxina.js` (era `app/js/97d-faxina.js`, 201 linhas)

```text
Crie js/98-97d-faxina.js. Ele faz: Mini SK — 97d-faxina.js  ·  🧹 Faxina do projeto (antes de importar) Para projetos grandes (ex.: o jurídico do Replit). Olha o pacote/pasta SEM encher o Mini SK e mostra, em português: 1. 🗑 LIXO: node_modules, .git, caches do Replit… (quanto pesa cada um).
No app original ele tinha estas funções/partes: mascarar, tam, ehTexto, precisaLer, ehLixo, deArquivo, dePasta, doProjeto, tirarRaiz, analisar, add, pega, build, rodar, mostrar, acao, levarTalvez, zipLimpo.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 44 — `js/98-api.js` (era `app/js/98-api.js`, 150 linhas)

```text
Crie js/98-api.js. Ele faz: Mini SK — 98-api.js 🧪 Testador da API do próprio projeto (o servidor rodando no seu PC, ex.: http://localhost:8080 ou o EXE leve em 127.0.0.1:18633). - Acha sozinho as ROTAS do servidor no código (Express, Fastify, Hono,.
No app original ele tinha estas funções/partes: lineOf, analyze, toRe, fullPath, req, save, show, send, hint, allGet, build, scan, loc.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 45 — `js/98-cofre-arquivo.js` (era `app/js/lib/cofre-arquivo.js`, 61 linhas)

```text
Crie js/98-cofre-arquivo.js. Ele faz: 🔐 Arquivo de chaves do Maikon — o MESMO formato no Mini SK, no Meu Chat e no que vier depois. Guarda SÓ as chaves (IA, GitHub, Expo, pesquisa e "Minhas chaves"), trancadas com uma senha sua (AES-GCM 256 + PBKDF2 com 250 mil voltas — sem a senha, o arquivo não abre). Assim dá para levar as chaves de um app/aparelho para outro sem passar pelo WhatsApp.
No app original ele tinha estas funções/partes: b64, deB64, chaveDaSenha, normal, selar, abrir, contar, mascara.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 46 — `js/98-expo-core.js` (era `app/js/lib/expo-core.js`, 201 linhas)

```text
Crie js/98-expo-core.js. Ele faz: expo-core.js — ☁️ Consertar um projeto EXPO para gerar APK pelo EAS Usado pelo Caça-Bug (Diagnóstico) e pelo Mini SK (painel ☁️ EAS). Junta o que os geradores antigos faziam separado (app.json, eas.json, autorizações, receita do GitHub) + limpeza da Replit, numa passada só.
No app original ele tinha estas funções/partes: json, raizDe, slugDe, ler, permissoes, tem, consertar, existe, tirarImg, limpa, base.
O original usava as bibliotecas fs: em HTML puro, use a versão de CDN (ou faça sem ela, se for simples).
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 47 — `js/98-guia-maikon.js` (era `app/js/lib/guia-maikon.js`, 93 linhas)

```text
Crie js/98-guia-maikon.js. Ele faz: 🧭 Guia das ferramentas do Maikon — o MESMO texto em todos os apps (Mini SK, Meu Chat…). A IA de cada app lê isto sozinha: assim ela já sabe o que ele tem, para que serve cada coisa, e quando é melhor mandar para outra ferramenta ou "levar para o Claude". Para atualizar: troque este arquivo nos apps (o Claude manda a versão nova junto).
No app original ele tinha estas funções/partes: resumoParaClaude, esconder.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 48 — `js/98-analise.js` (era `app/js/lib/lab/30-analise.js`, 177 linhas)

```text
Crie js/98-analise.js. Ele faz: Laboratório — 30-analise.js: lê o projeto INTEIRO (vários arquivos ou um HTML só) e descobre: os arquivos, como cada página carrega, as funções (o que fazem, quem chama quem), as ligações entre arquivos, dependências, rotas, e os problemas. O "motor" das funções é o do 🔪 Desmontar.
No app original ele tinha estas funções/partes: explicar, tipoArq, ehBiblioteca, linhaDe, lerJS, analisarCodigo, importsPorTexto, resolver, tenta, prob, tem.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 49 — `js/98-comparar.js` (era `app/js/lib/lab/50-comparar.js`, 131 linhas)

```text
Crie js/98-comparar.js. Ele faz: Laboratório — 50-comparar.js: ⚖️ A (o que funciona) × B (o que não funciona), lado a lado. Mostra arquivos novos/sumidos/mudados, as funções que mudaram e os problemas que só existem em B.
No app original ele tinha estas funções/partes: diff, norm, ladoAlado, lin, chave, par, linhaF.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 50 — `js/98-base.js` (era `app/js/lib/picotador/00-base.js`, 35 linhas)

```text
Crie js/98-base.js. Ele faz: Picotador — 00-base.js: peças comuns (tela, avisos, baixar, tamanhos).
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 51 — `js/98-ler.js` (era `app/js/lib/picotador/10-ler.js`, 93 linhas)

```text
Crie js/98-ler.js. Ele faz: Picotador — 10-ler.js: descobre o que é o arquivo e transforma tudo num formato só. Conversa = { titulo, data, origem, mensagens: [{ role: 'user'|'assistant', content }], diario } Projeto  = { name, files: { caminho: { text } | { b64 } }, folders: [] , ...resto do Mini SK }.
No app original ele tinha estas funções/partes: ehMsg, doChatGPT, doClaude, doMarkdown, deJSON, deZip.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 52 — `js/98-projetos.js` (era `app/js/lib/picotador/20-projetos.js`, 82 linhas)

```text
Crie js/98-projetos.js. Ele faz: Picotador — 20-projetos.js: backup de tudo / projeto .zip → escolher projetos, refazer o .zip original, separar um backup por projeto e abrir a memória (.sk) de cada um para picotar.
No app original ele tinha estas funções/partes: nMem, resumo.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 53 — `js/98-mensagens.js` (era `app/js/lib/picotador/30-mensagens.js`, 129 linhas)

```text
Crie js/98-mensagens.js. Ele faz: Picotador — 30-mensagens.js: escolher a conversa, marcar só o pedaço que quer, dividir em partes e baixar como memória do Mini SK, texto (.md) ou os códigos (.zip).
No app original ele tinha estas funções/partes: tokens, pintar, paraMD, paraMemoria, escolhidas, diario.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 54 — `js/98-plano-core.js` (era `app/js/lib/plano-core.js`, 171 linhas)

```text
Crie js/98-plano-core.js. Ele é uma parte de logica do app.
No app original ele tinha estas funções/partes: ext, uniq, normRota, arvore, andar, gerar, chave, dedup, temRota, tem, markdown, tab.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 55 — `js/98-receita-core.js` (era `app/js/lib/receita-core.js`, 139 linhas)

```text
Crie js/98-receita-core.js. Ele faz: receita-core.js — 🧬 Receita para recriar um projeto (sem IA). Lê os arquivos, descobre o que cada um faz e monta: - RECEITA.md: visão geral, estrutura modular proposta, ordem de montagem e UM PEDIDO PRONTO POR ARQUIVO (para colar em qualquer IA, até as pequenas);.
No app original ele tinha estas funções/partes: slug, base, semExt, uniq, papel, descricao, itens, usa, rotasDe, chamadasDe, ordenar, visita, gerar, titulo.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 56 — `js/98-selar.js` (era `app/js/lib/selar.js`, 94 linhas)

```text
Crie js/98-selar.js. Ele faz: Mini SK — js/lib/selar.js "Tranca" um segredo do jeito que o GitHub exige para guardar em Settings → Secrets (libsodium "sealed box"): chave temporária (X25519) + nonce = BLAKE2b(chaveTemp || chaveDoRepo, 24 bytes).
No app original ele tinha estas funções/partes: add64, add64c, compress, blake2b, b64para, paraB64, selar, abrir.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 57 — `js/98-ponte.js` (era `electron/ponte.cjs`, 81 linhas)

```text
Crie js/98-ponte.js. Ele faz: Ponte de arquivos do Mini SK — no PC, o próprio programa liga (no celular, roda no Termux). Leva o projeto da árvore para ~/minisk/NOME e traz de volta o que o terminal criou (dist, arquivos novos…). Só o próprio celular enxerga (127.0.0.1) e só quem tem o código entra.
No app original ele tinha estas funções/partes: nomeProj, dentro, responder, corpo, andar.
O original usava as bibliotecas http, fs, path, os: em HTML puro, use a versão de CDN (ou faça sem ela, se for simples).
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 58 — `js/98-terminal.js` (era `electron/terminal.cjs`, 89 linhas)

```text
Crie js/98-terminal.js. Ele faz: Terminal do computador para o Mini SK — fala o mesmo "idioma" do ttyd (o do Termux), então o painel 📱/💻 do Mini SK funciona sem mudar nada. Cada linha que você digita roda como um comando (cmd no Windows). Ctrl+C para o comando que está rodando. "cd" muda de pasta.
No app original ele tinha estas funções/partes: iniciarTerminal, mandar, curto, prompt, trocarLinha, parar, expandir, rodar, tecla.
O original usava as bibliotecas ws, child_process, path, fs, os: em HTML puro, use a versão de CDN (ou faça sem ela, se for simples).
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 59 — `js/98-preload.js` (era `electron/preload.cjs`, 6 linhas)

```text
Crie js/98-preload.js. Ele faz: Conta para o Mini SK que ele está no PC (terminal e ponte já ligados pelo programa).
No app original ele tinha estas funções/partes: arg.
O original usava as bibliotecas electron: em HTML puro, use a versão de CDN (ou faça sem ela, se for simples).
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 60 — `js/98-98b-rotas.js` (era `app/js/98b-rotas.js`, 312 linhas)

```text
Crie js/98-98b-rotas.js. Ele faz: Mini SK — 98b-rotas.js  ·  🧭 Mapa de Rotas (tela × servidor × manual) Para o "Failed to fetch" / "não encontrado" / tela azul: 1. Acha as CHAMADAS que a tela faz (/api/...), as ROTAS que o servidor tem e as rotas que o MANUAL/plano diz (arquivos .md ou texto colado).
No app original ele tinha estas funções/partes: semQuery, comParams, chave, casa, lev, metodoDe, rotasDoManual, mapear, metodoOk, prefixo, unicos, trocarNome, planoB, achar, banco, ler, gravar, json.
No original isto era SERVIDOR com as rotas GET /y, GET /x. Em HTML, troque por funções que guardam no aparelho (APP.guardar) ou que chamam a IA direto.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 61 — `js/98-app.js` (era `app/index.html`, 137 linhas)

```text
Crie js/98-app.js. Ele faz: Mini SK.
Ele usa o que já foi criado em: js/10-conta.js, js/15-fs.js, js/20-zip.js, js/25-highlight.js, js/30-editor.js, js/35-tree.js, js/40-preview.js, js/45-tsx.js, js/50-search.js, js/55-ai.js, js/60-80b-web.js, js/65-gasto.js, js/70-voz.js, js/75-ponte.js, js/80-checkpoints.js, js/85-terminal.js, js/90-86b-node.js, js/95-86h-node-extra.js, js/91-86c-termux.js, js/93-86f-pasta-viva.js, js/94-86g-largura.js, js/98-base.js, js/98-ler.js, js/98-projetos.js, js/98-mensagens.js, js/98-92c-importar.js, js/98-91b-publicar.js, js/92-86e-atalhos.js, js/96-links.js, js/97-inventario.js, js/98-config.js, js/98-89b-cacador.js, js/98-github.js, js/98-acoes.js, js/98-playground.js, js/98-conversa.js, js/98-fatiador.js, js/98-pwa.js, js/98-apk.js, js/98-96d-exe-minisk.js, js/98-96e-exe-python.js, js/98-selar.js, js/98-cofre-arquivo.js, js/98-guia-maikon.js, js/98-expo-core.js, js/98-96b-eas.js, js/98-plano-core.js, js/98-receita-core.js, js/98-96c-preparar.js, js/98-analise.js, js/98-97b-cacabug.js, js/98-97c-modularizar.js, js/98-97d-faxina.js, js/98-api.js, js/98-98b-rotas.js (pelo APP).
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 62 — `js/98-inicio.js` (era `index.html`, 81 linhas)

```text
Crie js/98-inicio.js. Ele faz: Mini-SK-PC-29-10-H — Mini-SK-PC-29-10-H.
No app original ele tinha estas funções/partes: rec, esc, card, show.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 63 — `js/99-app.js` e conferir

```text
Crie js/99-app.js: ele olha APP.modulos e monta o menu/abas com um botão para cada módulo. Depois, me mande o index.html atualizado com todos os <script src="js/…"> na ordem certa: js/00-core.js, js/10-conta.js, js/15-fs.js, js/20-zip.js, js/25-highlight.js, js/30-editor.js, js/35-tree.js, js/40-preview.js, js/45-tsx.js, js/50-search.js, js/55-ai.js, js/60-80b-web.js, js/65-gasto.js, js/70-voz.js, js/75-ponte.js, js/80-checkpoints.js, js/85-terminal.js, js/90-86b-node.js, js/91-86c-termux.js, js/92-86e-atalhos.js, js/93-86f-pasta-viva.js, js/94-86g-largura.js, js/95-86h-node-extra.js, js/96-links.js, js/97-inventario.js, js/98-config.js, js/98-89b-cacador.js, js/98-github.js, js/98-acoes.js, js/98-91b-publicar.js, js/98-playground.js, js/98-92c-importar.js, js/98-conversa.js, js/98-fatiador.js, js/98-pwa.js, js/98-apk.js, js/98-96b-eas.js, js/98-96c-preparar.js, js/98-96d-exe-minisk.js, js/98-96e-exe-python.js, js/98-analise.js, js/98-97b-cacabug.js, js/98-97c-modularizar.js, js/98-97d-faxina.js, js/98-api.js, js/98-cofre-arquivo.js, js/98-expo-core.js, js/98-guia-maikon.js, js/98-analise.js, js/98-comparar.js, js/98-base.js, js/98-ler.js, js/98-projetos.js, js/98-mensagens.js, js/98-plano-core.js, js/98-receita-core.js, js/98-selar.js, js/98-ponte.js, js/98-terminal.js, js/98-preload.js, js/98-98b-rotas.js, js/98-app.js, js/98-inicio.js, js/99-app.js.
```

## 5. Conferir no final

- [ ] Abrir o index.html na prévia: aparece a tela sem erro (▤ console vazio)?
- [ ] Cada botão abre a sua parte?
- [ ] Fechar e abrir de novo: os dados continuam?
- [ ] Nada com "replit", "REPL_", "@workspace" no código (🏗️ Preparar confere).
- [ ] 📱 PWA → deixar instalável; 📦 APK ou 🖥️ .exe.
