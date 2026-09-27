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
- Custo idealmente zero (Vercel + Neon/Supabase, ou infraestrutura da faculdade).

## Stack

Um único app Next.js, com um único deploy:

| Camada | Escolha |
|---|---|
| Front e back | **Next.js** (App Router). As páginas públicas são Server Components. |
| CMS e painel admin | **Payload 3** (TypeScript, roda dentro do Next.js) |
| Banco | **Postgres**: Neon em produção, Docker Compose no ambiente local |
| Acesso a dados | **Adaptador Postgres do Payload** (`@payloadcms/db-postgres`) e **Local API** (`payload.find()`, etc.) |
| Mídia | `@payloadcms/storage-vercel-blob` (ou `storage-s3` apontando para o Cloudflare R2). Vídeo só por embed do YouTube. |
| Estilo | **Tailwind v4**, com os tokens do `DESIGN.md` no `@theme` |
| Fontes | `next/font` (Saira Condensed, Inter) e o pacote `geist` (Geist Mono) |
| Animação | **Motion** (`motion/react`), seguindo a seção `## Motion` do `DESIGN.md` |
| Rich text | Lexical (padrão do Payload), limitado a poucos blocos para manter o template fixo |
| Testes | **Vitest**, com foco nas regras de acesso |
| Pacotes | pnpm |

**Decisões que não devem ser revertidas:**
- **Sem Prisma.** O Payload já gera o schema e as migrações a partir das coleções. Um segundo ORM duplicaria o schema e, pior, as leituras feitas por ele pulariam as regras de acesso. Leia e grave dados sempre pela Local API.
- **Sem Resend, Inngest ou cron.** Para refletir uma publicação no site, use o hook `afterChange` do Payload chamando `revalidatePath`. Quando o e-mail entrar (ver "Admins" abaixo), use `@payloadcms/email-nodemailer` com SMTP.
- **Neon, não Supabase.** O free do Neon escala a zero e volta sozinho. O free do Supabase **pausa o projeto após ~7 dias sem atividade**, e um site de pouco tráfego com páginas cacheadas pode cair nisso.

As versões exatas vêm do template oficial do Payload, na hora de criar o projeto.

## Arquitetura

O Payload substitui o painel admin feito na mão: ele já entrega autenticação, papéis, upload, editor de rich text, versionamento e o painel. Sobram para implementar o modelo de conteúdo, as regras de acesso e o front.

- **Coleções:** `guilds`, `games`, `articles`, `users`, `media`.
- **Deploy:** Vercel, com Postgres no Neon.

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
- **Vercel Hobby** é para uso pessoal e não comercial, e não tem times (o Pro custa US$ 20 por membro/mês).
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
  - Estilos só com tokens do `DESIGN.md`, sem cores ou tamanhos soltos.
  - Antes de criar um componente, procure um existente que resolva com uma nova variação.
- **Animações** também usam componentes reutilizáveis (ex.: um wrapper de "reveal"). Não espalhe configurações de Motion pelas seções.

## Comandos

```bash
pnpm db:up                  # Postgres local (Docker). Cria os bancos forja e forja_test
pnpm dev                    # site em http://localhost:3000, painel em /admin
pnpm test                   # Vitest (usa o banco forja_test; precisa do db:up)
pnpm test tests/int/games.spec.ts -t "nome do teste"   # um arquivo ou um teste
pnpm typecheck && pnpm lint
pnpm build
pnpm generate:types         # depois de mudar qualquer coleção (atualiza src/payload-types.ts)
pnpm generate:importmap     # depois de registrar componente customizado no admin
pnpm payload migrate:create <nome>   # ao mudar o schema, antes de ir para produção
pnpm seed                   # APAGA e recria o conteúdo de exemplo no banco local (admin@forja.local / forja-dev)
```

Setup inicial: `cp .env.example .env` e gerar um `PAYLOAD_SECRET` (`openssl rand -hex 32`). O pnpm 12 lê a liberação de build scripts do `pnpm-workspace.yaml` (`allowBuilds`), não do `package.json`.

## Onde fica cada coisa

- **Regras de acesso:** `src/access/index.ts` (funções puras, com teste unitário). As coleções só compõem essas funções.
- **Fluxo de publicação:** `src/hooks/publication.ts`. Um não-admin só grava rascunho (`_status: 'draft'`), e publicar registra `publishedBy`/`publishedAt`. Vale para `guilds` e `games` (`versions: draftVersions`).
- **Editor sempre na própria guilda:** `src/hooks/assignOwnGuild.ts` (jogos) e o acesso `adminOrOwnGuild`.
- **Fila de aprovação:** `src/lib/pendingReviews.ts` + `src/components/admin/PendingReviews.tsx` (topo do dashboard, só para admins).
- **Status do jogo** é o campo `developmentStatus` (em desenvolvimento / lançado / pausado). Não use `status`: o nome colide com o enum do `_status` de publicação no Postgres.
- **Testes de integração** rodam o Payload de verdade contra o banco `forja_test`. Use as fábricas de `tests/helpers/fixtures.ts`. O primeiro usuário criado vira admin, então `createBaseFixture` cria o admin antes de tudo. Os tipos gerados exigem `slug` e `developmentStatus` na criação, mesmo com preenchimento automático, então fixtures e seed os passam explicitamente.

**Armadilha da Local API:** `payload.find/update/...` usam `overrideAccess: true` por padrão. Em código que age em nome de alguém (páginas públicas, endpoints, testes de permissão), passe sempre `overrideAccess: false` e o `user` quando houver.

## Design: `DESIGN.md` é obrigatório

**Toda decisão visual precisa estar em conformidade com `DESIGN.md`.** Ele segue o formato DESIGN.md do Google Stitch: tokens em YAML no frontmatter e as regras em prosa. Vale para cores, tipografia, espaçamento, cantos, componentes e layout de qualquer página, incluindo guilda, jogo e `/artigos`, não só a landing.

- Use os tokens do `DESIGN.md` (ex.: `primary`, `headline-lg`, `spacing.section`). Não use valores soltos no código.
- Antes de criar um componente novo, veja se ele já está descrito em `## Components` ou em `## Page Patterns`. Para animações, siga `## Motion`.
- Se uma decisão exigir algo que o `DESIGN.md` não cobre ou que o contradiz, **atualize o `DESIGN.md` primeiro** (com o motivo) e só depois implemente. Nunca diverja em silêncio.
- Depois de editar o arquivo, valide com o linter oficial. Os avisos de `borderColor` são intencionais.
  ```
  npx -y -p @google/design.md designmd lint DESIGN.md
  ```
- Protótipo de referência no Figma: https://www.figma.com/design/qLr3pgjNo0az2ZJVdMaBaQ/Forja (página `02 · Landing`, desktop e mobile). Onde o Figma e o `DESIGN.md` divergirem, vale o `DESIGN.md`.


## Arquivos

- `DESIGN.md`: sistema visual normativo.
- `forja_logo_whitered-2048x687.png`: logo oficial (branco e vermelho, para fundo escuro). O vermelho da marca é `#D21312`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
