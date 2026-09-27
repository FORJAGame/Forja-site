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

## Arquitetura

O CMS é o **Payload** (headless, em TypeScript, roda dentro do Next.js), em vez de construir um painel admin na mão. O Payload já entrega autenticação, papéis, upload, editor de rich text, versionamento e painel admin. Sobram para implementar o modelo de conteúdo, as regras de acesso e o front.

- **Coleções:** `guilds`, `games`, `articles`, `users`, `media`.
- **Deploy:** Vercel, com Postgres no **Neon**. O free do Neon escala a zero e volta sozinho (com cold start). Evite o Supabase free, que **pausa o projeto após ~7 dias sem atividade**, e um site de pouco tráfego com páginas cacheadas pode cair nisso.
- **Mídia:** imagens em object storage (R2 ou Supabase Storage). Vídeo só por embed do YouTube.

### Regras de acesso (núcleo do sistema)

- O usuário pertence a uma guilda e tem papel `admin` ou `editor`.
- O **editor** só edita docs da própria guilda e **só salva como draft**. Um jogo pertence a **uma única guilda** (não há colaboração entre guildas), então a checagem é uma comparação simples: `game.guild == user.guild`.
- **Publicar é exclusivo do admin.** Use os drafts/versions nativos do Payload: a versão publicada continua no ar enquanto a edição aguarda aprovação.
- **Admins (plural):** professores responsáveis e alunos veteranos de confiança. Eles aprovam o conteúdo das guildas e **cadastram os artigos**.
  - Manter sempre pelo menos 1 professor como admin, para garantir continuidade entre períodos.
  - Offboarding: revisar a lista de admins no início de cada período e rebaixar quem saiu.
  - Para evitar a responsabilidade difusa ("alguém aprova"), notificar os admins por e-mail quando um rascunho for enviado para revisão.
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

## Design: `DESIGN.md` é obrigatório

**Toda decisão visual precisa estar em conformidade com `DESIGN.md`.** Ele segue o formato DESIGN.md do Google Stitch: tokens em YAML no frontmatter e as regras em prosa. Vale para cores, tipografia, espaçamento, cantos, componentes e layout de qualquer página, incluindo guilda, jogo e `/artigos`, não só a landing.

- Use os tokens do `DESIGN.md` (ex.: `primary`, `headline-lg`, `spacing.section`). Não use valores soltos no código.
- Antes de criar um componente novo, veja se ele já está descrito em `## Components` ou em `## Page Patterns`.
- Se uma decisão exigir algo que o `DESIGN.md` não cobre ou que o contradiz, **atualize o `DESIGN.md` primeiro** (com o motivo) e só depois implemente. Nunca diverja em silêncio.
- Depois de editar o arquivo, valide com o linter oficial. Os avisos de `borderColor` são intencionais.
  ```
  npx -y -p @google/design.md designmd lint DESIGN.md
  ```
- Protótipo de referência no Figma: https://www.figma.com/design/qLr3pgjNo0az2ZJVdMaBaQ/Forja (página `02 · Landing`, desktop e mobile). Onde o Figma e o `DESIGN.md` divergirem, vale o `DESIGN.md`.

`raycast-design.md` é só a referência de inspiração que originou o sistema. Não é norma.

## Arquivos

- `DESIGN.md`: sistema visual normativo.
- `forja_logo_whitered-2048x687.png`: logo oficial (branco e vermelho, para fundo escuro). O vermelho da marca é `#D21312`.
