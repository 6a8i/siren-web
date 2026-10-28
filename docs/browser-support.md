# Navegadores e plataformas suportados

O Siren Web é compilado para **ES2017**. Essa é a base mínima que um navegador precisa executar
para abrir o aplicativo; nada abaixo disso recebe código transpilado nem polyfills de sintaxe.

## O que define a base

| Peça | Configuração | Efeito |
| --- | --- | --- |
| TypeScript (`tsconfig.json`) | `target: ES2017`, `lib: ES2017` | Os arquivos `.ts`/`.tsx` saem do `ts-loader` com classes, `async`/`await`, `for...of`, spread e template literals nativos. Só o que é posterior a ES2017 (spread de objetos, `?.`, `??`) é rebaixado. |
| Babel (`babel.config.js`) | `@babel/preset-env` guiado pela `browserslist` do `package.json`, com `bugfixes: true` | Os arquivos `.js`/`.jsx` e os pacotes listados em `webpack.common.js` são rebaixados só até o navegador mais antigo da lista. Com `bugfixes`, um defeito de um motor (por exemplo o cache de tagged templates do Safari 12) reescreve apenas a forma defeituosa, em vez de rebaixar a funcionalidade inteira para todos os alvos. |
| webpack (`target: 'browserslist'`) | a mesma `browserslist` | O código de runtime do webpack usa `const`, arrow functions e template literals quando todos os alvos aceitam. |
| `es-check` (`.escheckrc`) | `ecmaVersion: es2017` | `npm run escheck` falha se algum arquivo de `dist/` contiver sintaxe acima de ES2017 (os workers e o service worker continuam fora da verificação). |
| Polyfills (`src/lib/legacy`) | sem alteração | `core-js/stable`, `whatwg-fetch`, `intersection-observer`, `resize-observer-polyfill` e os demais continuam incluídos. APIs posteriores a ES2017 (`Promise.prototype.finally`, `Array.prototype.flat`, `Object.fromEntries`, `String.prototype.matchAll`…) seguem vindo do `core-js`. |

A lista exata (`browserslist` em `package.json`):

```
last 2 Firefox versions
last 2 Chrome versions
last 2 ChromeAndroid versions
last 2 Safari versions
last 2 Edge versions
Firefox ESR
Chrome >= 55
ChromeAndroid >= 55
Firefox >= 52
Safari >= 10.1
iOS >= 10.3
Edge >= 15
Opera >= 42
Samsung >= 6
```

As entradas `last 2 …` e `Firefox ESR` vêm da lista anterior e continuam valendo; os pisos `>=` são as
primeiras versões de cada navegador com suporte completo a ES2017 (`async`/`await`, `Object.values`,
`Object.entries`, `String.prototype.padStart`/`padEnd`, vírgula final em parâmetros).

## Navegadores suportados

| Navegador | Versão mínima |
| --- | --- |
| Chrome / Chromium (desktop) | 55 |
| Chrome para Android / WebView Android | 55 |
| Firefox (inclusive ESR) | 52 |
| Safari (macOS) | 10.1 |
| Safari (iOS / iPadOS) | 10.3 |
| Microsoft Edge | 15 (EdgeHTML 15 a 18 e todas as versões Chromium, 79+) |
| Opera | 42 |
| Samsung Internet | 6 |

## TVs e outros dispositivos

O que importa em uma TV é a versão do Chromium embutida no sistema. A tabela abaixo usa as versões
publicadas pelos fabricantes; a correspondência é aproximada e o teste real é abrir o aplicativo.

| Plataforma | Versão do sistema | Motor | Situação |
| --- | --- | --- | --- |
| Samsung Tizen | 4.0 (2018) | Chromium 56 | Suportado |
| Samsung Tizen | 5.0 / 5.5 / 6.0 / 6.5 / 7.0 / 8.0 e posteriores | Chromium 63 / 69 / 76 / 85 / 94 / 108 | Suportado |
| LG webOS | 5.0 (2020) e posteriores (6.0, 22, 23, 24…) | Chromium 68 / 79 / 87 / 94 / 108 | Suportado |
| Xbox One / Series (aplicativo UWP legado) | EdgeHTML 18 | Edge 18 | Suportado |
| Xbox One / Series (WebView2) | Chromium atual | Chromium | Suportado |
| Android TV, Google TV, Fire TV (WebView) | Android 7+ com WebView atualizado | Chromium 55+ | Suportado |
| Philips/TP Vision TitanOS, Amazon Vega, Opera TV / Vewd | Chromium recente | Chromium | Suportado |
| Apple TV (via navegador de outros dispositivos) | — | — | Não se aplica |

## O que deixou de ser suportado

A lista anterior tinha pisos ES5 (`Chrome 27`, `Chrome 38`, `Chrome 47`, `Chrome 53`, `iOS > 10`).
Com a base em ES2017 as plataformas abaixo não conseguem mais executar o aplicativo:

| Plataforma | Motor | Motivo |
| --- | --- | --- |
| LG webOS 1.x e 2.x | WebKit / Chromium 27 | Sem classes, `async`/`await` nem `for...of` nativos |
| LG webOS 3.x | Chromium 38 | Sem `async`/`await`, destructuring nem default parameters |
| LG webOS 4.x | Chromium 53 | Sem `async`/`await` (chegou no Chromium 55) |
| Samsung Tizen 2.3 / 2.4 / 3.0 | WebKit / Chromium 47 | Sem `async`/`await`, destructuring nem default parameters |
| Safari 9 e 10.0, iOS 9 e 10.0–10.2 | WebKit antigo | Sem `async`/`await` (chegou no Safari 10.1 / iOS 10.3) |
| Microsoft Edge 12 a 14 | EdgeHTML | Sem `async`/`await` (chegou no Edge 15) |
| Internet Explorer | Trident | Nunca foi suportado |
| Navegador do PlayStation 4 | WebKit antigo | Sem suporte a ES2015+ |
| Opera < 42, Samsung Internet < 6, Firefox < 52 | — | Sem `async`/`await` |

Quem precisa de uma dessas plataformas deve ficar na última versão publicada antes desta mudança.

## Como verificar

```
npm run build:production   # gera dist/
npm run escheck            # confere que dist/ é ES2017
```

O `eslint-plugin-compat` usa a mesma `browserslist`, portanto `npm run lint` avisa quando o código
usa uma API de navegador que algum alvo não tem.
