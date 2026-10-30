# 📋 Plano do projeto: Mini-SK-PC-29-10-H

_Gerado em 29/10/2026, 21:09:50 — sem IA, lendo os arquivos._

## 📊 Visão geral
| Item | Valor |
|---|---|
| Arquivos | 117 |
| Linhas | 15.912 |
| Telas/páginas | 2 |
| Rotas do backend | 3 |
| Chamadas do app | 1 |
| Tabelas do banco | 0 |
| Variáveis de ambiente | 8 |

**Linguagens:** JavaScript (69), Imagem (30), Imagem SVG (4), Markdown (3), JSON (3), Outros (2), Ícone (2), HTML (2), YAML (1), CSS (1)

## 💡 O que fazer (em ordem)
1. 🧹 Tirar a Replit de 19 arquivo(s) (🏗️ Preparar → Fazer tudo)
2. 🖥️ O projeto tem backend próprio: para funcionar fora da Replit ele precisa ficar ligado num servidor (Render, Railway, Vercel) ou virar funções
3. 🔐 Criar um .env.example com: BASE_PATH, DADOS_EM, GITHUB_STEP_SUMMARY, LOCALAPPDATA, PONTE_BASE, PONTE_CODIGO, PONTE_PORTA, TESTE_SAIR (os valores você coloca no servidor, nunca no código)
4. 📝 Criar um README.md explicando como rodar

## 🚀 Por onde começa
- `app/index.html`
- `index.html`

## ⌨️ Comandos (package.json)
| Pasta | Comando | O que roda |
|---|---|---|
| . | `npm run programa` | `electron .` |
| . | `npm run exe` | `electron-builder --win nsis portable --x64 --publish never` |

## 📱 Telas e páginas
| Endereço | Arquivo |
|---|---|
| `app/index.html` | app/index.html |
| `index.html` | index.html |

## 🖥️ Rotas do backend
| Método | Rota | Arquivo |
|---|---|---|
| USE | `/api/x` | app/js/98b-rotas.js |
| GET | `/y` | app/js/98b-rotas.js |
| GET | `/x` | app/js/98b-rotas.js |

## 📡 O que o app pede ao servidor
| Método | Endereço | Onde |
|---|---|---|
| POST | `/api/x` | app/js/98b-rotas.js |

## 🔌 O que falta no backend
✅ Tudo que o app chama tem rota no projeto (ou o app não usa servidor).

## 💤 Rotas que o app não usa
- GET `/y` — app/js/98b-rotas.js

## 🗄️ Banco de dados
_Nenhuma tabela encontrada._

## 🔐 Variáveis de ambiente (configurar no servidor)
- `BASE_PATH`
- `DADOS_EM`
- `GITHUB_STEP_SUMMARY`
- `LOCALAPPDATA`
- `PONTE_BASE`
- `PONTE_CODIGO`
- `PONTE_PORTA`
- `TESTE_SAIR`

_Só os nomes. Os valores (chaves, senhas) nunca vão no código nem no GitHub._

## 🤖 IA usada
- api.groq.com
- console.groq.com
- generativelanguage.googleapis.com
- openrouter.ai
- api.anthropic.com
- console.anthropic.com
- api.openai.com
- platform.openai.com

## 🌐 Serviços de fora que ele acessa
- aistudio.google.com
- api.allorigins.win
- api.anthropic.com
- api.deepseek.com
- api.exemplo.com
- api.expo.dev
- api.github.com
- api.groq.com
- api.npms.io
- api.openai.com
- api.perplexity.ai
- api.x.ai
- appassets.androidplatform.net
- cdn.jsdelivr.net
- cdn.tailwindcss.com
- console.anthropic.com
- console.groq.com
- console.x.ai
- duckduckgo.com
- esm.sh
- expo.dev
- generativelanguage.googleapis.com
- github.com
- html.duckduckgo.com
- lite.duckduckgo.com
- mail.google.com
- ollama.com
- openapi.monica.im
- openrouter.ai
- platform.monica.im
- platform.openai.com
- pt.wikipedia.org
- r.jina.ai
- raw.github.com
- registry.npmjs.org
- seu-usuario.github.io
- stuartk.com
- stuk.github.io
- u.expo.dev
- unpkg.com
- www.google.com
- www.npmjs.com
- www.perplexity.ai
- xxxx.supabase.co

## 📦 Peças principais (dependências)
`ws`

## 🧹 Arquivos com coisa da Replit
- app/js/20-zip.js
- app/js/50-tree.js
- app/js/70-search.js
- app/js/80-ai.js
- app/js/86-terminal.js
- app/js/86c-termux.js
- app/js/88-inventario.js
- app/js/90-github.js
- app/js/95-pwa.js
- app/js/96b-eas.js
- app/js/96c-preparar.js
- app/js/97-analise.js
- app/js/97d-faxina.js
- app/js/lib/expo-core.js
- app/js/lib/guia-maikon.js
- app/js/lib/plano-core.js
- app/js/lib/receita-core.js
- app/service-worker.js
- service-worker.js

## 🔁 Roteiro para recriar fora da Replit
1. Importar o projeto no Mini SK e tocar em 🏗️ Preparar → ✅ Fazer tudo (tira a Replit, cria os arquivos que faltam).
2. Backend: escolher onde ele vai ficar ligado (Render/Railway grátis) — ou pedir à IA para transformar as rotas em funções do Netlify/Vercel, usando a tabela "O que falta no backend".
3. Variáveis: cadastrar 8 variável(is) no servidor (lista acima).
4. Testar a prévia; se der erro, 🤖 Mandar os erros para a IA.
5. App: 📲 Instalável (PWA), 📦 APK ou 🖥️ Desktop (.exe) pelo 🏗️ Preparar.

## 🌳 Árvore de arquivos
```
├─ 📁 .github/
│  └─ 📁 workflows/
│     └─ programa-exe.yml
├─ 📁 app/
│  ├─ 📁 css/
│  │  └─ app.css
│  ├─ 📁 icons/
│  │  ├─ apple-touch-icon.png
│  │  ├─ icon-128.png
│  │  ├─ icon-144.png
│  │  ├─ icon-152.png
│  │  ├─ icon-16.png
│  │  ├─ icon-180.png
│  │  ├─ icon-192.png
│  │  ├─ icon-32.png
│  │  ├─ icon-384.png
│  │  ├─ icon-48.png
│  │  ├─ icon-512.png
│  │  ├─ icon-72.png
│  │  ├─ icon-96.png
│  │  ├─ icon.svg
│  │  ├─ maskable-192.png
│  │  ├─ maskable-512.png
│  │  └─ maskable.svg
│  ├─ 📁 js/
│  │  ├─ 📁 lib/
│  │  │  ├─ 📁 lab/
│  │  │  │  ├─ 30-analise.js
│  │  │  │  └─ 50-comparar.js
│  │  │  ├─ 📁 picotador/
│  │  │  │  ├─ 00-base.js
│  │  │  │  ├─ 10-ler.js
│  │  │  │  ├─ 20-projetos.js
│  │  │  │  └─ 30-mensagens.js
│  │  │  ├─ acorn.min.js
│  │  │  ├─ cofre-arquivo.js
│  │  │  ├─ expo-core.js
│  │  │  ├─ guia-maikon.js
│  │  │  ├─ jszip.min.js
│  │  │  ├─ nacl-fast.min.js
│  │  │  ├─ plano-core.js
│  │  │  ├─ ponte-termux.cjs.txt
│  │  │  ├─ receita-core.js
│  │  │  └─ selar.js
│  │  ├─ 00-core.js
│  │  ├─ 04-conta.js
│  │  ├─ 10-fs.js
│  │  ├─ 20-zip.js
│  │  ├─ 30-highlight.js
│  │  ├─ 40-editor.js
│  │  ├─ 50-tree.js
│  │  ├─ 60-preview.js
│  │  ├─ 61-tsx.js
│  │  ├─ 70-search.js
│  │  ├─ 80-ai.js
│  │  ├─ 80b-web.js
│  │  ├─ 81-gasto.js
│  │  ├─ 83-voz.js
│  │  ├─ 84-ponte.js
│  │  ├─ 85-checkpoints.js
│  │  ├─ 86-terminal.js
│  │  ├─ 86b-node.js
│  │  ├─ 86c-termux.js
│  │  ├─ 86e-atalhos.js
│  │  ├─ 86f-pasta-viva.js
│  │  ├─ 86g-largura.js
│  │  ├─ 86h-node-extra.js
│  │  ├─ 87-links.js
│  │  ├─ 88-inventario.js
│  │  ├─ 89-config.js
│  │  ├─ 89b-cacador.js
│  │  ├─ 90-github.js
│  │  ├─ 91-acoes.js
│  │  ├─ 91b-publicar.js
│  │  ├─ 92-playground.js
│  │  ├─ 92c-importar.js
│  │  ├─ 93-conversa.js
│  │  ├─ 94-fatiador.js
│  │  ├─ 95-pwa.js
│  │  ├─ 96-apk.js
│  │  ├─ 96b-eas.js
│  │  ├─ 96c-preparar.js
│  │  ├─ 96d-exe-minisk.js
│  │  ├─ 96e-exe-python.js
│  │  ├─ 97-analise.js
│  │  ├─ 97b-cacabug.js
│  │  ├─ 97c-modularizar.js
│  │  ├─ 97d-faxina.js
│  │  ├─ 98-api.js
│  │  ├─ 98b-rotas.js
│  │  └─ 99-app.js
│  ├─ favicon.ico
│  ├─ index.html
│  ├─ LEIA-ME.md
│  ├─ manifest.json
│  ├─ service-worker.js
│  └─ sw.js
├─ 📁 electron/
│  ├─ main.cjs
│  ├─ ponte.cjs
│  ├─ preload.cjs
│  └─ terminal.cjs
├─ 📁 icons/
│  ├─ apple-touch-icon.png
│  ├─ icon-128.png
│  ├─ icon-144.png
│  ├─ icon-152.png
│  ├─ icon-16.png
│  ├─ icon-180.png
│  ├─ icon-192.png
│  ├─ icon-32.png
│  ├─ icon-384.png
│  ├─ icon-48.png
│  ├─ icon-512.png
│  ├─ icon-72.png
│  ├─ icon-96.png
│  ├─ icon.svg
│  ├─ maskable-192.png
│  ├─ maskable-512.png
│  └─ maskable.svg
├─ .gitignore
├─ favicon.ico
├─ index.html
├─ LEIA-ME.md
├─ manifest.json
├─ package.json
├─ PLANO.md
└─ service-worker.js
```
