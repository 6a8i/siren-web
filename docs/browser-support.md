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
| Polyfills (`src/lib/legacy`) | só os que algum alvo ainda precisa | Veja a tabela em [Polyfills](#polyfills): os da era ES5 (`whatwg-fetch`, `proxy-polyfill`, `element-closest-polyfill`, `regenerator-runtime`) saíram; `core-js/stable`, `intersection-observer`, `resize-observer-polyfill`, `abortcontroller-polyfill` e `fast-text-encoding` ficam; `classlist.js` saiu junto quando o slideshow deixou de usar `replace()`. APIs posteriores a ES2017 (`Promise.prototype.finally`, `Array.prototype.flat`, `Object.fromEntries`, `String.prototype.matchAll`…) seguem vindo do `core-js`. |

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

## Polyfills

`src/lib/legacy/index.ts` importa só os polyfills que algum navegador da lista ainda precisa. A
decisão por pacote, com a primeira versão de cada motor que traz a API nativa (dados do
`caniuse-lite` e da MDN; os pisos são Chrome 55, Firefox 52, Safari 10.1, iOS 10.3, Edge 15,
Opera 42 e Samsung 6):

| Pacote | Decisão | Motivo |
| --- | --- | --- |
| `core-js/stable` | **Fica** | O Babel só injeta os módulos do `core-js` (`useBuiltIns: 'usage'`) nos arquivos que ele compila; os `.ts`/`.tsx` saem do `ts-loader` e os pacotes fora da lista de inclusão do Babel não passam por ele. Esses dois grupos usam APIs posteriores a ES2017 que os pisos não têm: `Promise.prototype.finally` (Chrome 63, Firefox 58, Safari 11.1, Edge 18), `Object.fromEntries` (Chrome 73, Firefox 63, Safari 12.1), `Array.prototype.flat` (Chrome 69, Firefox 62, Safari 12), `String.prototype.matchAll` (Chrome 73, Firefox 67, Safari 13). |
| `regenerator-runtime/runtime` | **Sai** | Nenhum alvo precisa do runtime como global: o `ts-loader` mantém `async`/`await` e generators nativos (alvo ES2017) e o Babel atual embute o helper de regenerator dentro de cada arquivo que ele reescreve (o `transform-regenerator` ainda roda para o Firefox 52), sem referenciar `regeneratorRuntime` nem importar o pacote. O bundle `node_modules.regenerator-runtime` desaparece do `dist/`. |
| `element-closest-polyfill` | **Sai** | `Element.closest`: Chrome 41, Firefox 35, Safari 9, Edge 15, Opera 28, Samsung 5. Todos os pisos têm. |
| `fast-text-encoding` | **Fica** | `TextEncoder`/`TextDecoder`: o EdgeHTML nunca teve (Edge 15 a 18; só o Edge 79, Chromium). Os demais pisos têm (Chrome 38, Firefox 20, Safari 10.1, Opera 25, Samsung 4). |
| `intersection-observer` | **Fica** | `IntersectionObserver`: Chrome 58 (51 parcial), Firefox 55, Safari 12.1 (iOS 12.2), Edge 16, Opera 45, Samsung 7.2. Falta no Firefox 52, no Safari 10.1–12 e no Edge 15. |
| `classlist.js` | **Sai** | `classList` em si existe em todos os pisos (Chrome 28, Firefox 26, Safari 7, Edge 12). Só `DOMTokenList.replace()` faltava (Chrome 61, Edge 17, Opera 48, Samsung 8), e as duas chamadas que o `components/slideshow` fazia viraram `remove()` + `add()`. |
| `whatwg-fetch` | **Sai** | `fetch`: Chrome 42, Firefox 39, Safari 10.1, iOS 10.3, Edge 14, Opera 29, Samsung 4. Todos os pisos têm. O `abortcontroller-polyfill` passa a remendar o `fetch` nativo. |
| `abortcontroller-polyfill` | **Fica** | `AbortController` e o `signal` no `fetch`: Chrome 66, Firefox 57, Safari 12.1 (iOS 12.2), Edge 16, Opera 53, Samsung 9.2. Nenhum piso tem. |
| `resize-observer-polyfill` | **Fica** | `ResizeObserver`: Chrome 64, Firefox 69, Safari 13.1 (iOS 13.4), Edge 79, Opera 52, Samsung 9.2. Nenhum piso tem. |
| `proxy-polyfill` | **Sai** | `Proxy`: Chrome 49, Firefox 18, Safari 10, iOS 10, Edge 12, Opera 36, Samsung 5. Todos os pisos têm (e o polyfill só cobria `get`/`set`/`apply`/`construct`). |

Os pacotes que saíram (`whatwg-fetch`, `proxy-polyfill`, `element-closest-polyfill`, `classlist.js`;
`regenerator-runtime` já não era uma dependência direta) também saíram de `package.json`, e o
`eslint-plugin-compat` deixou de listar `fetch`/`Response` como polyfilled em `eslint.config.mjs`:
todos os alvos têm `fetch` nativo, então o aviso que ele daria não existe.

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
