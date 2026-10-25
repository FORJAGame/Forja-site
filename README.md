# Forja — site

Site da Forja, a iniciativa de desenvolvimento de jogos do CESAR. Next.js + Payload CMS + Postgres.
As decisões de arquitetura e as regras do projeto estão no [`CLAUDE.md`](CLAUDE.md); o visual, no [`DESIGN.md`](DESIGN.md).
Para contribuir (branches, PRs e releases), veja o [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Rodar localmente

Requisitos: Node 24+, pnpm 12 e Docker.

1. `cp .env.example .env` e troque o `PAYLOAD_SECRET` por `openssl rand -hex 32`.
2. `pnpm install`
3. `pnpm db:up` — sobe o Postgres e o SeaweedFS (armazenamento de imagens compatível com S3) e cria os buckets.
4. `pnpm seed` — conteúdo de exemplo. **Apaga** o conteúdo local. Login: `admin@forja.local` / `forja-dev`.
5. `pnpm dev` — site em http://localhost:3000, painel em http://localhost:3000/admin.

Para ver os arquivos de imagem guardados localmente, abra o Filer do SeaweedFS em http://localhost:8888/buckets/forja-media/. Use só para olhar: apagar ou enviar por lá não passa pelo Payload, e a imagem quebra no site. Para mexer em imagens, use o painel.

Para rodar o site pela **mesma imagem Docker da nuvem**, use `pnpm docker:up` (sobe tudo: site, Postgres e SeaweedFS) e abra http://localhost:3001. O container usa um banco (`forja_app`) e um bucket (`forja-media-app`) só dele: o `pnpm dev` sincroniza o schema do banco `forja` sozinho, e a migração do container travaria nele. O banco começa vazio, então o primeiro usuário criado em `/admin` vira admin. Cada serviço do `docker-compose.yml` tem ao lado o comando para subi-lo isoladamente.

Os outros comandos (testes, tipos, migrações) estão no `CLAUDE.md`, seção "Comandos".

## Arquitetura

O site é **um único container** e depende de dois serviços externos: um **Postgres** e um **bucket compatível com S3**. Nenhum dos três é amarrado a um provedor. Qualquer host que rode uma imagem Docker serve, e o mesmo vale para qualquer Postgres e qualquer serviço que fale a API do S3.

```mermaid
flowchart LR
    visitor([Visitante]) -->|páginas públicas| app
    editor([Editor / admin]) -->|/admin| app

    subgraph container [Container forja-site]
        app[Next.js + Payload<br/>porta 3000]
        cache[(Cache das páginas<br/>disco do container)]
        app <--> cache
    end

    app -->|DATABASE_URL| db[(Postgres)]
    app -->|S3_* · API S3| bucket[(Bucket S3<br/>privado)]
```

- **Postgres** guarda todo o conteúdo: guildas, jogos, artigos, usuários, versões e rascunhos.
- **O bucket** guarda só os arquivos de imagem. Ele fica **privado**: o navegador nunca fala com ele. O Payload lê o arquivo e o entrega por `/api/media/file/...`, então o bucket não precisa de domínio público nem de CORS.
- **O cache das páginas** fica no disco do próprio container. Publicar no painel limpa esse cache (hook `afterChange` → `revalidatePath`). Por isso, **rode uma única instância**: com duas ou mais, cada uma teria o próprio cache e só a que recebeu a publicação se atualizaria.

## Variáveis de ambiente

O app não inicia se faltar alguma variável obrigatória. A mensagem de erro lista quais. A validação fica em `src/config/env.ts`.

### Obrigatórias em qualquer ambiente

| Variável | Para quê | Local (`.env`) | Nuvem (dev ou prod) |
|---|---|---|---|
| `DATABASE_URL` | Conexão com o Postgres | `postgresql://postgres:postgres@127.0.0.1:5432/forja` | Connection string do Postgres do ambiente. Se o provedor exigir TLS, inclua `?sslmode=require` |
| `PAYLOAD_SECRET` | Assina as sessões do painel | `openssl rand -hex 32` | Um valor gerado só para esse ambiente. Nunca o do `.env.example` (o app se recusa a subir com ele) |
| `S3_ENDPOINT` | Endereço da API S3 | `http://127.0.0.1:8333` (SeaweedFS) | Endpoint S3 do provedor |
| `S3_REGION` | Região do bucket | `us-east-1` | A região que o provedor pedir (alguns aceitam `auto`) |
| `S3_BUCKET` | Bucket das imagens | `forja-media` | Um bucket por ambiente (ex.: `forja-media-dev`, `forja-media-prod`) |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Credenciais do bucket | `forja` / `forja-dev-secret` | Chave com leitura e escrita **só nesse bucket** |

### Só no ambiente local

| Variável | Para quê |
|---|---|
| `DATABASE_URL_TEST` | Banco `forja_test`, usado pelo `pnpm test`. Nunca aponte para um banco com dados reais: os testes apagam tudo |
| `S3_BUCKET_TEST` | Bucket `forja-media-test`, usado pelo `pnpm test` |

### Só no container

Já vêm definidas na imagem. Mude só se o host exigir.

| Variável | Padrão | Para quê |
|---|---|---|
| `PORT` | `3000` | Porta em que o servidor escuta |
| `HOSTNAME` | `0.0.0.0` | Interface em que o servidor escuta |

### Só para rodar o seed num banco remoto

O seed **apaga todo o conteúdo, os usuários e as imagens** do banco de destino. Num banco que não seja local, ele exige as três variáveis abaixo. Rode da sua máquina, com as variáveis do ambiente de destino, e só num banco recém-criado.

| Variável | Para quê |
|---|---|
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Admin criado pelo seed. Fora do banco local, o seed se recusa a criar o admin padrão, cuja senha é pública |
| `SEED_CONFIRM_REMOTE_WIPE=yes` | Confirma que você quer apagar o banco remoto |

```bash
DATABASE_URL=… S3_…=… SEED_ADMIN_EMAIL=voce@… SEED_ADMIN_PASSWORD=… SEED_CONFIRM_REMOTE_WIPE=yes pnpm seed
```

## Imagem Docker

A mesma imagem serve para qualquer ambiente. Ela é construída **sem banco e sem segredos**, e tudo o que depende do ambiente acontece quando o container sobe.

```bash
docker build -t forja-site .
docker run --env-file .env.cloud -p 3000:3000 forja-site   # .env.cloud com as variáveis da tabela "Nuvem"
```

Para testar a imagem na sua máquina sem montar nada, use o serviço `app` do compose (ver "Rodar localmente").

### Como funciona

O `Dockerfile` tem duas etapas:

1. **Build:** instala as dependências, roda `next build --experimental-build-mode compile` e remove as dependências de desenvolvimento. O modo `compile` compila o app **sem pré-renderizar páginas**, então não precisa de banco.
2. **Runtime:** copia o resultado e roda como o usuário `node`, sem root.

Ao subir, o container executa o `docker/app/entrypoint.sh`:

```mermaid
flowchart TD
    start([docker run]) --> check["1 · scripts/check-database.ts<br/>confere as variáveis e conecta no Postgres"]
    check -->|variável faltando| fail([Sai com erro listando as variáveis])
    check -->|banco não responde| retry{"tentou 10 vezes?<br/>(3 s entre tentativas)"}
    retry -->|não| check
    retry -->|sim| failDb([Sai com erro dizendo o que conferir])
    check -->|senha errada ou banco inexistente| failDb
    check -->|ok| migrate["2 · payload migrate<br/>aplica as migrações pendentes"]
    migrate --> generate["3 · next build --experimental-build-mode generate<br/>pré-renderiza as páginas com o conteúdo do banco (~10 s)"]
    generate --> serve["4 · next start<br/>serve na porta 3000"]
```

- **Erro de banco:** a checagem diz o que está errado sem mostrar a senha. Os casos são: host não encontrado, nada escutando na porta, usuário ou senha recusados e banco inexistente. Falhas de rede são tentadas de novo por uns 30 s, porque o banco pode estar subindo junto com o app. Quando o servidor responde com erro, a checagem falha na hora.
- **Tempo de subida:** uns 10 a 20 s até responder, por causa das migrações e do pré-render. Configure o healthcheck do host com essa folga, usando `GET /`.
- **Reiniciar é seguro:** as migrações já aplicadas são puladas, e o pré-render roda de novo com o conteúdo atual.
- **Flag experimental:** os modos `compile` e `generate` do `next build` são marcados como experimentais pelo Next. Ao atualizar o Next, confira se continuam existindo (`next build --help`).

### Cuidados na operação

- **Primeiro admin:** num banco vazio, o primeiro usuário criado em `/admin` vira admin. Crie o seu logo depois do primeiro deploy, **antes** de divulgar o link.
- **Uploads até 4 MB:** o limite fica em `src/collections/Media.ts` e o painel mostra erro para arquivos maiores. Se houver um proxy na frente, ele precisa aceitar requisições desse tamanho.
- **Migrações travando numa pergunta ("run Payload in dev mode"):** o banco foi marcado por um *push* de schema. O app só faz push quando o `DATABASE_URL` aponta para `localhost`, mas, se acontecer, apague a marca e reinicie o container: `DELETE FROM payload_migrations WHERE batch = -1;`

## Design system: o padrão do `DESIGN.md`

O visual tem duas fontes, cada uma com um papel:

- **`DESIGN.md` diz _quando e como_ usar cada token, em prosa.** Ele é normativo: toda decisão visual precisa estar de acordo com ele. Cita os tokens só pelo nome (`primary`, `headline-lg`, `section`), nunca pelo valor. Cobre cores, tipografia, layout, cantos, componentes, movimento e a estrutura de cada página.
- **`src/styles/tokens.css` diz _quanto_ vale cada token.** É a única fonte dos valores. Por ser o `@theme` do Tailwind, cada token vira classe automaticamente.

```mermaid
flowchart LR
    design["DESIGN.md<br/><i>regras em prosa</i><br/>quando usar cada token"]
    tokens["src/styles/tokens.css<br/><i>valores</i><br/>@theme + @utility type-*"]
    globals["src/app/(frontend)/globals.css<br/>importa o Tailwind e os tokens"]
    tailwind{{Tailwind v4}}
    classes["Classes geradas<br/>bg-primary · text-on-surface-variant<br/>py-section · rounded-xs · type-headline-lg"]
    ui["src/components/ui, brand, layout…<br/>usam só essas classes"]

    design -. "nomeia os tokens" .-> tokens
    tokens --> globals --> tailwind --> classes --> ui
    design -. "descreve os componentes" .-> ui
```

### Onde configurar cada coisa

| O que mudar | Onde | Vira |
|---|---|---|
| Cores | `--color-*` em `src/styles/tokens.css` | `bg-*`, `text-*`, `border-*` (ex.: `bg-primary`) |
| Espaçamentos e larguras | `--spacing-*` em `tokens.css` | `p-*`, `m-*`, `gap-*`, `max-w-*` (ex.: `py-section`) |
| Cantos | `--radius-*` em `tokens.css` | `rounded-*` (ex.: `rounded-xs`) |
| Estilos de texto (fonte, tamanho, peso, entrelinha) | blocos `@utility type-*` em `tokens.css` | `type-*` (ex.: `type-headline-lg`) |
| Famílias de fonte | `src/app/(frontend)/fonts.ts` (`next/font` e `geist`) | as variáveis `--font-*` usadas pelos `type-*` |
| Curva e durações das animações | `src/components/motion/tokens.ts` e `--ease-forge` em `globals.css` | usadas pelos componentes de `src/components/motion` |

A paleta padrão do Tailwind está desligada (`--color-*: initial`), então só existem as cores do `tokens.css`. Uma classe como `bg-red-500` não gera nada.

### Fluxo para mudar o visual

1. **Mudar um valor** (ex.: o tom do vermelho): edite só o `tokens.css`. Se o `DESIGN.md` citar o valor para justificar contraste, atualize o texto também.
2. **Criar ou remover um token:** edite os dois arquivos. O `DESIGN.md` precisa dizer quando usar o token novo.
3. **Algo que o `DESIGN.md` não cobre ou contradiz:** atualize o `DESIGN.md` primeiro, explicando o motivo, e só depois implemente.
4. **Nunca use valores soltos no código** (`#fff`, `px-[37px]`). Se faltar um token, siga o passo 2.
