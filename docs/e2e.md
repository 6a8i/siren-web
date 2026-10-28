# Testes de ponta a ponta (Playwright)

A suíte em `tests/e2e/` abre o Siren Web de verdade, num Chromium controlado pelo
[Playwright](https://playwright.dev/), contra um servidor Siren **descartável**: a cada execução o
harness sobe uma instância nova num diretório temporário, completa o assistente inicial pela API,
cria uma família e, no fim, mata o processo e apaga o diretório. Nada é lido nem escrito nos dados
do servidor que você usa no dia a dia; a instância de teste escuta na porta 8097, não na 8096.

## O que é preciso

| Peça | Onde o harness procura | Variável de ambiente |
| --- | --- | --- |
| O build de produção deste repositório (`dist/index.html`) | `dist/` na raiz do repositório | — (rode `npm run build:production` antes; a suíte falha na hora se o `dist/` não existir) |
| O servidor compilado em Release | `C:\Repositories\siren\Jellyfin.Server\bin\Release\net10.0\jellyfin.dll` | `SERVER_DLL` |
| O ffmpeg | `C:\Users\arime\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe` | `FFMPEG` |
| O host do .NET (`dotnet` no PATH) | `dotnet` | `DOTNET` |
| O Chromium do Playwright | cache do Playwright (`npx playwright install chromium` uma vez) | — |

Outras variáveis:

| Variável | Efeito |
| --- | --- |
| `E2E_PORT` | Porta da instância descartável (padrão `8097`). |
| `E2E_REPORT=html` | Gera também o relatório HTML em `playwright-report/` (por padrão só a saída em lista). |
| `JELLYFIN_FFMPEG__NOVALIDATION=true` | Repassada ao servidor: pula a validação do ffmpeg, como fazem os testes de integração do servidor. Use se o ffmpeg da máquina não passar na validação. |
| `CI` | Qualquer valor: `test.only` passa a ser erro. |

## Como rodar

```
npm ci                            # uma vez
npx playwright install chromium   # uma vez
npm run build:production          # sempre que o código do cliente mudar
npm run test:e2e
```

Para apontar para outro servidor ou outro ffmpeg:

```
# PowerShell
$env:SERVER_DLL = 'D:\build\jellyfin.dll'; $env:FFMPEG = 'D:\ffmpeg\bin\ffmpeg.exe'; npm run test:e2e

# bash
SERVER_DLL=/opt/siren/jellyfin.dll FFMPEG=/usr/bin/ffmpeg npm run test:e2e
```

Comandos úteis do Playwright (`npx playwright test ...`): `--headed` abre o navegador, `--debug`
abre o inspetor, `-g "PIN"` filtra pelo título, `--trace on` grava o trace de todos os testes
(`npx playwright show-trace test-results/<pasta>/trace.zip` abre um).

## O que a suíte faz

1. **Setup global** (`tests/e2e/global-setup.ts`): cria `%TEMP%\siren-e2e-*`, escreve
   `config/network.xml` com a porta 8097 e sem descoberta automática, inicia
   `dotnet jellyfin.dll --datadir <tmp> --webdir <repo>/dist --ffmpeg <ffmpeg> --nonetchange`,
   espera `GET /System/Info/Public` e `GET /System/Ping` responderem (a página de "iniciando" do
   servidor responde a primeira antes do servidor de verdade estar no ar), completa o assistente
   (`POST /Startup/Configuration` com `UICulture: en-US`, `GET`/`POST /Startup/User`,
   `POST /Startup/RemoteAccess`, `POST /Startup/Complete`), autentica o administrador `e2e` e cria
   a família **Silva** com os perfis **pai** (administrador da família, PIN 1234) e **filho**
   (sem PIN).
2. **Projeto `setup`** (`auth.setup.ts`): o administrador entra pela tela de login e cai na home;
   o estado do navegador fica em `tests/e2e/.auth/admin.json` (ignorado pelo git) para os testes
   do painel e das configurações, que então não precisam entrar de novo.
3. **Projeto `chromium`** (`*.spec.ts`): família (login de um perfil cai em "Who's watching?" com o
   chip "Continue as pai"; trocar para o perfil sem PIN recarrega na home; PIN errado mostra
   "Incorrect PIN."), painel (a página Families lista a família) e configurações de exibição (o
   select de cor de destaque aparece).
4. **Teardown global**: mata o servidor e apaga o diretório temporário.

Os textos são conferidos em inglês porque o assistente define `en-US` e o Chromium roda com
`locale: 'en-US'`; assim a suíte não depende do idioma da máquina.

### Limite de autenticações

O servidor aceita dez autenticações por minuto por endereço (login, troca de perfil e PIN errado
contam), e esse limite vale também na instância descartável. A suíte gasta sete: uma na API do
setup, uma no login do administrador e cinco nos testes de família. Os arquivos rodam um de cada
vez (`workers: 1`) e o administrador entra uma única vez justamente para caber nesse orçamento; ao
acrescentar testes que fazem login, prefira partir do estado salvo em `.auth/admin.json` ou conte
as autenticações novas.

## Integração contínua

`.github/workflows/e2e.yml` roda a suíte em um runner Ubuntu: faz checkout de `6a8i/siren` ao lado
deste repositório, compila o servidor em Release com o .NET 10, instala o ffmpeg pelo apt, compila
este cliente (`npm ci`, `npm run build:production`), instala o Chromium e executa `npm run test:e2e`
com `SERVER_DLL` e `FFMPEG` apontando para os caminhos do runner. Quando um teste falha, a pasta
`test-results/` (com traces e capturas) sobe como artefato.
