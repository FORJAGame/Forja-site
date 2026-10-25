# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

Site da **Forja**, a iniciativa de desenvolvimento de jogos do CESAR. Os alunos se organizam em **guildas** (~10), times que pesquisam e desenvolvem jogos e também produzem **artigos**. Hoje a Forja só tem Instagram e LinkedIn.

Já existiu um site em WordPress. Ele morreu porque a hospedagem ficou cara e ninguém sabia mexer. Esse é o sinal mais importante: o problema de fundo é **manutenção e posse**, não tecnologia. O Lucas constrói o site sozinho e depois **entrega** para a Forja, que passa a manter de forma comunitária, entre alunos e professores que se revezam a cada período. Toda escolha deve favorecer quem vai herdar o projeto.

Estado atual: **fase de design, ainda sem código.** Status geral: em avaliação (desde 2026-09-26).

### Requisitos

- Landing page moderna.
- Uma página por guilda e, dentro dela, as páginas dos jogos (texto, imagens, vídeos). Cada tipo de página tem template fixo.
- Cada guilda edita o próprio conteúdo sem código (há guildas formadas só por designers).
- Nada vai ao ar sem aprovação de um admin, **inclusive edições de páginas já publicadas**.
- Custo idealmente zero (planos gratuitos ou infraestrutura da faculdade), sem depender de um provedor específico.

## Stack

Um único app Next.js, entregue como uma única imagem Docker:

| Camada | Escolha |
|---|---|
| Front e back | **Next.js** (App Router). As páginas públicas são Server Components. |
| CMS e painel admin | **Payload 3** (TypeScript, roda dentro do Next.js) |
| Banco | **Postgres**: qualquer Postgres na nuvem, Docker Compose no ambiente local |
| Acesso a dados | **Adaptador Postgres do Payload** (`@payloadcms/db-postgres`) e **Local API** (`payload.find()`, etc.) |
| Mídia | `@payloadcms/storage-s3`: **SeaweedFS** no ambiente local (Docker Compose) e qualquer bucket compatível com S3 na nuvem. O Payload serve as imagens por `/api/media/file/...`; o bucket fica privado. Vídeo só por embed do YouTube. |
| Estilo | **Tailwind v4**, com os tokens no `@theme` de `src/styles/tokens.css` |
| Fontes | `next/font` (Saira Condensed, Inter) e o pacote `geist` (Geist Mono) |
| Animação | **Motion** (`motion/react`), seguindo a seção `## Motion` do `DESIGN.md` |
| Rich text | Lexical (padrão do Payload), limitado a poucos blocos para manter o template fixo |
| Testes | **Vitest**, com foco nas regras de acesso |
| Pacotes | pnpm |
| Deploy | **Imagem Docker** (`Dockerfile`), que roda em qualquer host de container |

**Decisões que não devem ser revertidas:**
- **Sem Prisma.** O Payload já gera o schema e as migrações a partir das coleções. Um segundo ORM duplicaria o schema e, pior, as leituras feitas por ele pulariam as regras de acesso. Leia e grave dados sempre pela Local API.
- **Sem Resend, Inngest ou cron.** Para refletir uma publicação no site, use o hook `afterChange` do Payload chamando `revalidatePath`. Quando o e-mail entrar (ver "Admins" abaixo), use `@payloadcms/email-nodemailer` com SMTP.
- **Sem acoplamento a provedor.** O app fala só com um Postgres (`DATABASE_URL`) e uma API S3 (`S3_*`), e roda como imagem Docker. Nada de arquivos ou scripts de um host específico (`vercel.json`, `railway.json`, `vercel-build`…): a Forja precisa poder trocar de hospedagem sem mexer no código.
- **Imagem buildada sem banco.** O build da imagem usa `next build --experimental-build-mode compile`, e o pré-render (`generate`) roda quando o container sobe, já com o banco do ambiente (`docker/app/entrypoint.sh`). Assim a mesma imagem serve para dev e prod.
- **Sem MinIO.** A edição comunitária foi arquivada em 2026 e as imagens oficiais não baixam mais. O S3 local é o SeaweedFS, com a versão fixada no `docker-compose.yml`.

As versões exatas vêm do template oficial do Payload, na hora de criar o projeto.

## Arquitetura

O Payload substitui o painel admin feito na mão: ele já entrega autenticação, papéis, upload, editor de rich text, versionamento e o painel. Sobram para implementar o modelo de conteúdo, as regras de acesso e o front.

- **Coleções:** `guilds`, `games`, `articles`, `users`, `media`.
- **Deploy:** um container (ver `README.md`, seções "Arquitetura" e "Imagem Docker"). Rode **uma única instância**: o cache das páginas fica no disco do container e a revalidação ao publicar só limpa o cache dela.

### Regras de acesso (núcleo do sistema)

- O usuário pertence a uma guilda e tem papel `admin` ou `editor`.
- O **editor** só edita docs da própria guilda e **só salva como draft**. Um jogo pertence a **uma única guilda** (não há colaboração entre guildas), então a checagem é uma comparação simples: `game.guild == user.guild`.
- **Publicar é exclusivo do admin.** Use os drafts/versions nativos do Payload: a versão publicada continua no ar enquanto a edição aguarda aprovação.
- **Admins (plural):** professores responsáveis e alunos veteranos de confiança. Eles aprovam o conteúdo das guildas e **cadastram os artigos**.
  - Manter sempre pelo menos 1 professor como admin, para garantir continuidade entre períodos.
  - Offboarding: revisar a lista de admins no início de cada período e rebaixar quem saiu.
  - Para evitar a responsabilidade difusa ("alguém aprova"), os admins precisam saber quando um rascunho entra na fila. **MVP:** uma visão "aguardando aprovação" no painel admin. **Logo depois do MVP:** e-mail aos admins quando um rascunho for enviado para revisão, via adaptador SMTP do Payload.
  - Autoaprovação: um admin que também é membro de guilda pode publicar o próprio conteúdo. Aceito por ora (o grupo é pequeno e baseado em confiança), mas **registre quem publicou via hook**, para deixar rastro.

### Artigos

Os artigos são **só vitrine**: não são lidos no site e não aparecem na página da guilda. Existe uma seção única, `/artigos`, com todos os artigos da Forja.
- Autoria em **texto livre** (lista de nomes), sem perfis de usuário.
- A guilda é um campo **opcional**, útil só para filtro.
- O link aponta para a publicação na revista ou no evento. Se houver DOI, prefira o link `doi.org/...`, que é persistente. **Sem upload de PDF** por enquanto. Reavaliar só se os links começarem a quebrar.
- Só admins criam e editam artigos (o volume é baixo e não justifica dar permissão aos editores).

### Modelo de conteúdo (rascunho)

- `guilds`: nome, slug, descrição curta, descrição longa, logo, capa, links (Instagram, itch.io…), membros como texto livre (opcional).
- `games`: título, slug, guilda (1), capa, galeria de imagens, trailer (URL do YouTube), sinopse, descrição (rich text simples), status (em desenvolvimento / lançado / pausado), plataformas, link para jogar (itch.io), créditos (texto), data.
- `articles`: título, descrição, autores (lista de texto), data, veículo (revista/evento), link externo, guilda (opcional), tags.
- `users`: e-mail, nome, papel (`admin` | `editor`), guilda.
- `media`: uploads de imagem.

### Alternativas descartadas (não reabrir sem motivo novo)

- **Tudo na mão (Next.js + backend próprio):** semanas a mais de trabalho (auth, reset de senha, upload/resize, rich text, versionamento, preview, painel) e código custom que só o autor entende.
- **Strapi:** o fluxo de revisão é pago.
- **Sanity:** papéis e permissão por documento só nos planos pagos.
- **Directus:** viável (permissões por item pela interface), mas é mais um serviço separado para hospedar.
- **Decap CMS (baseado em git):** não tem permissão por guilda e a mídia pesa no repositório.
- **Formulário + admin publica:** mais simples. Continua como fallback ou MVP.
- **WordPress de novo:** tecnicamente resolveria (papéis + plugin de fluxo editorial). Falhou por falta de dono e por custo, não por capacidade.

## Riscos a ter em mente

- **Repetir o destino do WordPress.** Se ninguém na Forja souber manter, o site morre igual. O risco principal é a entrega, não o código.
- **Contas de infra** devem ser criadas numa organização no GitHub, com o e-mail institucional do CESAR (que é permanente), nunca com conta pessoal.
- **Deploy de dev em contas pessoais:** serve para apresentar o MVP. Se a Forja adotar o site, a produção nasce nas contas institucionais; não promova o ambiente de dev a produção.
- **Imagens são públicas:** qualquer upload em `media` pode ser listado e acessado por URL, inclusive imagens de jogos ainda em rascunho. Aceito por ora; avisar no guia de editores.
- **Autosave enche a fila de aprovação:** com o autosave, uma edição em andamento já aparece em "Aguardando aprovação". Os admins devem aprovar quando o editor avisar que terminou.
- **Conteúdo desatualizado:** uma página de guilda parada passa a imagem de iniciativa morta.
- **A coordenação ainda não foi consultada formalmente**, e o admin aprovador precisa topar o trabalho recorrente.

## Próximos passos

1. Conversar com o dono da Forja: validar os requisitos, definir quem é o admin aprovador (de preferência um professor, pela estabilidade entre períodos) e confirmar se há interesse em manter o site.
2. Verificar as regras da faculdade (domínio, marca, possibilidade de hospedagem institucional).
3. Criar a organização no GitHub e as contas de infra com o e-mail institucional.
4. Fechar o modelo de conteúdo.
5. Protótipo no Payload: coleções, regra de acesso por guilda e fluxo draft/publish.
6. Documentar a entrega: README, runbook de deploy e backup, guia de 1 página para editores.

## Convenções de código

- **Código em inglês:** nomes de variáveis, funções, componentes, arquivos e comentários. O texto que aparece para o usuário do site continua em português.
- **Código que se explica sozinho.** Nomes claros e funções pequenas, em vez de comentários. Comente só o *porquê* que não está visível no código (uma regra de negócio, um contorno de bug). Não comente o *o quê*.
- **Componentes reutilizáveis são prioridade**, porque quem herdar o projeto vai mexer principalmente neles:
  - Um componente por responsabilidade. Os componentes de UI (botão, card, badge, cabeçalho de seção…) ficam separados das seções da página e não sabem nada do Payload: recebem props simples e tipadas.
  - As seções e as páginas buscam os dados e montam a tela a partir desses componentes.
  - As variações (ex.: botão `primary`/`secondary`/`onPrimary`, status do jogo) são uma prop do mesmo componente, não componentes duplicados.
  - Estilos só com os tokens (`src/styles/tokens.css`), sem cores ou tamanhos soltos.
  - Antes de criar um componente, procure um existente que resolva com uma nova variação.
- **Animações** também usam componentes reutilizáveis (ex.: um wrapper de "reveal"). Não espalhe configurações de Motion pelas seções.
- **Commits:** **NUNCA** inclua linhas de atribuição da IA na mensagem, como `Co-Authored-By: Claude …` ou `Claude-Session: https://claude.ai/code/session_…`. Vale também para descrições de PR.

## Comandos

```bash
pnpm db:up                  # Postgres e SeaweedFS (Docker). Cria os bancos forja/forja_test/forja_app e os buckets
pnpm docker:up              # tudo do compose, incluindo o site pela imagem Docker, em http://localhost:3001 (banco forja_app, bucket forja-media-app)
pnpm dev                    # site em http://localhost:3000, painel em /admin
pnpm test                   # Vitest (usa o banco forja_test; precisa do db:up)
pnpm test:coverage          # testes + cobertura; falha abaixo de 80% (o CI exige nos PRs para develop/main)
pnpm test tests/int/games.spec.ts -t "nome do teste"   # um arquivo ou um teste
pnpm typecheck && pnpm lint      # o CI exige nos PRs para develop/main (check `static`)
pnpm build
docker build -t forja-site .   # imagem de deploy (o CI exige nos PRs, check `docker`); o README explica as variáveis e o que roda na subida
pnpm generate:types         # depois de mudar qualquer coleção (atualiza src/payload-types.ts)
pnpm generate:importmap     # depois de registrar componente customizado no admin
pnpm payload migrate:create <nome>   # ao mudar o schema, antes de ir para produção
pnpm seed                   # APAGA e recria o conteúdo de exemplo, com imagens (admin@forja.local / forja-dev só em banco local; banco remoto exige SEED_CONFIRM_REMOTE_WIPE=yes)
```

Setup inicial: `cp .env.example .env` e gerar um `PAYLOAD_SECRET` (`openssl rand -hex 32`). O pnpm 12 lê a liberação de build scripts do `pnpm-workspace.yaml` (`allowBuilds`), não do `package.json`.

## Onde fica cada coisa

- **Regras de acesso:** `src/access/index.ts` (funções puras, com teste unitário). As coleções só compõem essas funções.
- **Fluxo de publicação:** `src/hooks/publication.ts`. Um não-admin só grava em modo rascunho (`requireDraftModeForNonAdmins`, no `beforeOperation`, porque um save sem `draft` escreve direto no documento publicado, mesmo com `_status: 'draft'`) e nunca com `_status: 'published'`. Publicar registra `publishedBy`/`publishedAt`, que só admins podem escrever. O `publishedAt` muda a cada publicação, então as listas de jogos ordenam por `createdAt`: republicar uma correção não pode levar um jogo antigo para o destaque. O acesso `adminOrOwnGuildDraft` também esconde o botão "Publicar" dos editores. Vale para `guilds` e `games` (`versions: draftVersions`).
- **Histórico de versões:** o `readVersions` consulta a tabela de versões, então usa `parent` (guildas) e `version.guild` (jogos), não os campos do documento.
- **Slug:** `src/fields/slug.ts` usa o `slugField` do Payload. O slug acompanha o título durante o autosave até a primeira publicação ou até alguém editá-lo à mão; depois fica fixo, para não quebrar links. Se o slug já existir (duas guildas com um jogo de mesmo nome), ganha um sufixo (`ecos-2`). Sem isso, o choque só apareceria quando o admin publicasse, porque os rascunhos ficam na tabela de versões, que não tem índice único.
- **Rascunho abandonado:** com autosave, abrir "Criar novo" já cria um rascunho vazio. Rascunhos sem título ficam fora da fila de aprovação, e o editor pode excluir jogos da própria guilda que nunca foram publicados (`adminOrOwnGuildUnpublished`).
- **Subida do container:** `docker/app/entrypoint.sh` roda `scripts/check-database.ts` (mensagem clara se faltar variável ou o banco não responder; a lógica fica em `src/config/database.ts`), `payload migrate`, o pré-render e o `next start`.
- **Variáveis de ambiente:** `src/config/env.ts` (`readServerEnv`) valida tudo o que o servidor precisa e falha com os nomes do que falta. Nova variável obrigatória entra lá, no `.env.example` e na tabela do `README.md`.
- **Push de schema só em banco local:** o Payload sincroniza o schema sozinho (`push`) apenas quando o `DATABASE_URL` aponta para `localhost`/`127.0.0.1` (`pushDevSchema`). Em qualquer outro banco, o schema muda só por migração: um push marca o banco e faz o `payload migrate` da subida do container travar numa pergunta.
- **Imagens:** `src/collections/Media.ts` (limite de 4 MB, para caber no limite de corpo de requisição comum em hosts e proxies) e o `s3Storage` em `src/payload.config.ts`. Os testes usam o bucket `forja-media-test`. Em scripts, passe um `context` novo a cada chamada da Local API: o adaptador grava marcadores nele, e um objeto compartilhado faz os uploads seguintes pularem o bucket (ver `src/seed/seed.ts`).
- **Sempre existe um admin:** `src/hooks/keepOneAdmin.ts` impede rebaixar ou excluir o último admin.
- **Editor sempre na própria guilda:** `src/hooks/assignOwnGuild.ts` (jogos) e o acesso `adminOrOwnGuild`.
- **Fila de aprovação:** `src/lib/pendingReviews.ts` + `src/components/admin/PendingReviews.tsx` (topo do dashboard, só para admins).
- **Status do jogo** é o campo `developmentStatus` (em desenvolvimento / lançado / pausado). Não use `status`: o nome colide com o enum do `_status` de publicação no Postgres.
- **Testes de integração** rodam o Payload de verdade contra o banco `forja_test`. Use as fábricas de `tests/helpers/fixtures.ts`. O primeiro usuário criado vira admin, então `createBaseFixture` cria o admin antes de tudo. Os tipos gerados exigem `slug` e `developmentStatus` na criação, mesmo com preenchimento automático, então fixtures e seed os passam explicitamente.

**Armadilha da Local API:** `payload.find/update/...` usam `overrideAccess: true` por padrão. Em código que age em nome de alguém (páginas públicas, endpoints, testes de permissão), passe sempre `overrideAccess: false` e o `user` quando houver.

## Front-end

- **Tokens:** `src/styles/tokens.css` é a fonte única dos valores (o `@theme` do Tailwind). O `DESIGN.md` só cita os nomes. A paleta padrão do Tailwind está desligada: só existem as cores desse arquivo. A tipografia é usada pelas classes `type-<token>` (ex.: `type-headline-md`).
- **Camadas de componentes** (`src/components/`):
  - `ui/`: primitivos sem Payload (`ButtonLink`, `Card`, `Cover`, `StatusBadge`, `SectionHeader`…).
  - `brand/`: logo, fagulhas (`Shards`) e faixas diagonais.
  - `motion/`: `Reveal`, `RevealGroup`/`RevealItem`, `CountUp`, `Parallax` e `MotionProvider`. Toda animação nova passa por aqui.
  - `layout/`: cabeçalho, menu mobile e rodapé.
  - `landing/`: seções da página inicial.
- **Dados:** páginas buscam com funções de `src/lib/queries/` (sempre como visitante, `overrideAccess: false`) e convertem documentos em *view models* em `src/lib/presenters.ts`. Os componentes nunca recebem documentos do Payload.
- **Textos fixos da landing:** `src/content/landing.ts`. **Contatos e navegação:** `src/config/site.ts` (e-mail e redes ainda provisórios).
- **Movimento reduzido:** o servidor não sabe a preferência do visitante. Nunca renderize marcação diferente com base em `useReducedMotion` (dá erro de hidratação). Zere o valor animado em vez de remover o atributo, como em `Parallax`.
- **Testes de componente:** `tests/components/*.spec.tsx`, com `// @vitest-environment jsdom` e `import '../helpers/dom'` no topo.
- `pnpm build` pré-renderiza a landing e precisa do Postgres de pé.
- **Páginas internas:** `/guildas`, `/guildas/[slug]`, `/jogos`, `/jogos/[slug]`, `/artigos`. Componentes por domínio em `components/guilds`, `components/games`, `components/articles` (cards e grades são compartilhados com a landing). Rich text do Lexical só em `components/content/RichTextContent.tsx`.
- **Publicar atualiza o site:** `src/hooks/revalidation.ts` chama `revalidatePath('/', 'layout')`, que atualiza todas as páginas públicas, quando algo é publicado, despublicado ou excluído. Não troque por caminhos como `/guildas/[slug]`: a tag de cache da página inclui o grupo `(frontend)` e a chamada não teria efeito. Rascunhos e autosave não mexem no cache. Scripts fora do Next (seed) passam `context: { disableRevalidate: true }`; os testes mocam `next/cache` em `vitest.setup.ts`. A revalidação só é visível em `pnpm build && pnpm start` (no `pnpm dev` tudo renderiza a cada visita).
- **Live preview:** o painel abre `/preview?collection=…&id=…` (`src/lib/preview.ts`); a rota confere o login, liga o `draftMode` e redireciona. As páginas de detalhe usam `resolveViewer` e buscam o rascunho **como o usuário do painel** (as regras de acesso valem também no preview); listas e grades mostram sempre a versão publicada. O autosave (800ms) mantém o preview atualizado.
- **Sem JavaScript:** elementos que começam escondidos para animar levam `data-reveal` (ou `data-reveal-exit`, para camadas que somem), e o CSS `@media (scripting: none)` em `globals.css` os mostra no estado final. Não use `<script>` inline no layout: o React reclama quando renderiza a 404 no navegador.

## Design: `DESIGN.md` é obrigatório

**Toda decisão visual precisa estar em conformidade com `DESIGN.md`.** Ele descreve em prosa quando e como usar cada token; os valores ficam em `src/styles/tokens.css`. Leia os dois antes de qualquer trabalho visual. Vale para cores, tipografia, espaçamento, cantos, componentes e layout de qualquer página, incluindo guilda, jogo e `/artigos`, não só a landing.

- Use os tokens (ex.: `bg-primary`, `type-headline-lg`, `py-section`). Não use valores soltos no código.
- Antes de criar um componente novo, veja se ele já está descrito em `## Components` ou em `## Page Patterns`. Para animações, siga `## Motion`.
- Se uma decisão exigir algo que o `DESIGN.md` não cobre ou que o contradiz, **atualize o `DESIGN.md` primeiro** (com o motivo) e só depois implemente. Nunca diverja em silêncio.


## Arquivos

- `DESIGN.md`: sistema visual normativo (regras em prosa).
- `src/styles/tokens.css`: valores dos tokens (cores, tipografia, cantos, espaçamento).
- `public/brand/forja-logo.png`: logo oficial (branco e vermelho, para fundo escuro). O vermelho da marca é `#D21312`. As três fagulhas da logo estão redesenhadas em SVG em `src/components/brand/Shards.tsx`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
