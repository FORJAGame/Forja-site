# Forja — Design System

**Tokens:** os valores (cores, tipografia, cantos, espaçamento) ficam só em `src/styles/tokens.css`, que é o `@theme` do Tailwind. Este documento usa os nomes dos tokens e explica quando usar cada um. Para mudar um valor, edite o CSS. Para criar ou remover um token, edite os dois arquivos. Os hexadecimais citados em `## Colors` justificam o contraste; se uma cor mudar, atualize também o texto.

## Overview

A Forja é a iniciativa de desenvolvimento de jogos do CESAR, organizada em guildas de alunos. O site fala com dois públicos ao mesmo tempo:

1. **Alunos**, que devem sair instigados a entrar numa guilda.
2. **Gente de fora** (patrocinadores, parceiros, voluntários, a própria faculdade), que precisa entender a proposta e levar a iniciativa a sério.

Por isso o sistema combina **impacto no topo e sobriedade no resto**. A referência é o Raycast: tela quase preta, pouca cor e um momento "cinematográfico" no hero. A diferença é que a Forja assume o vermelho como cor de ação e puxa a energia da própria logo: letreiro pesado, cortes diagonais e fagulhas.

Personalidade: **arena, oficina, energia contida**. Parece coisa de estúdio de games, não de agência nem de SaaS. É escuro do começo ao fim, sem seções claras.

**Motivo gráfico: as fagulhas.** Os três estilhaços vermelhos da logo são o elemento visual recorrente. Aparecem grandes no hero, pequenas nas capas de placeholder e em preto translúcido sobre o bloco vermelho. Sempre acompanham **faixas diagonais a ~28°**, que repetem a inclinação dos cortes do letreiro. Os polígonos-base, extraídos da logo, estão em `SHARD_POLYGONS` (`src/components/brand/Shards.tsx`).

## Colors

A paleta é preto, vermelho e branco, e nada mais. Tons neutros fazem a hierarquia, e o vermelho é a única cor.

- **Forja Red (`primary`, #D21312):** o vermelho exato da logo. Serve para botões primários, a palavra de destaque do hero, a barra de acento dos cards, o bloco "Apoie" e as fagulhas. Com texto branco por cima dá 5,4:1 (passa no AA).
- **Fagulha (`primary-text`, #FF5A4F):** vermelho clareado para **texto pequeno em vermelho** (rótulos de seção, status "em desenvolvimento", avisos). O `#D21312` sobre o fundo dá só 3,8:1, então nunca deve ser usado em texto abaixo de 24px.
- **Brasa (`ember`, #3A0C0C):** vermelho quase preto, usado no gradiente das capas de placeholder e em fundos com tom de marca.
- **Neutral (#060607):** o fundo de todas as páginas.
- **Surface (#0D0D0F) / Surface raised (#16161A):** cards, e dentro deles avatares e chips.
- **On-surface (#FFFFFF):** títulos e texto principal.
- **On-surface variant (#A1A1A6):** texto de apoio e links do menu.
- **On-surface muted (#86868C):** metadados e legendas. É o cinza mais escuro permitido para texto (5,5:1).
- **Outline (branco a 9%) / Outline strong (branco a 18%) / Divider (branco a 6%):** linhas finas que definem cards, botões secundários e separadores de seção.

## Typography

São três famílias, cada uma com um papel fixo:

- **Saira Condensed (700–800), sempre em CAIXA-ALTA:** a voz da marca. Aparece em títulos, nomes de guilda e de jogo, números grandes, botões e menu. É condensada e pesada como o letreiro da logo. O espaçamento entre letras fica levemente negativo nos tamanhos grandes e positivo (+4%) em botões e menu.
- **Inter (400–500):** todo texto corrido (descrições, sinopses, autores). Nunca em caixa-alta.
- **Geist Mono (400–500), em CAIXA-ALTA com espaçamento aberto:** metadados e rótulos "técnicos", como a numeração de seção (`01 / O QUE É A FORJA`), contagens (`3 JOGOS · 12 MEMBROS`), status, veículo do artigo e rodapé.

Regras:
- **Destaque do hero:** uma única palavra (ou expressão) fica em `primary`. Na landing é "FORJADOS."
- **Tamanho no mobile:** o `display` cai de 148px para 60px e os títulos de seção de 72px para 48px, sempre mantendo a quebra de linha intencional.
- As classes `type-<token>` de Saira Condensed e Geist Mono já aplicam `text-transform: uppercase`.

## Layout

- **Container:** largura máxima de 1200px, com margem lateral de 120px no desktop e 24px no mobile. O hero e o bloco "Apoie" podem ir de ponta a ponta.
- **Grid:** 12 colunas com gutter de 24px. Cards de guilda em 4 colunas, jogos e passos em 3 colunas. No mobile tudo vira 1 coluna, e as guildas viram uma lista compacta.
- **Ritmo vertical:** 120px entre seções no desktop e 72px no mobile. Cada seção é separada por uma linha fina (`divider`) no topo.
- **Cabeçalho de seção:** rótulo mono numerado em `primary-text`, título grande em Saira Condensed em duas linhas e, à direita, um link "VER TODOS →" quando houver.
- **Espaçamento:** tudo em múltiplos de 8px, com meio passo de 4px para ajustes finos.
- **Medida de leitura (`measure`, 680px):** largura máxima de texto corrido (descrições, rich text, subtítulos longos), para as linhas não passarem de ~75 caracteres.
- **Breakpoints:** mobile até 767px; `md` a partir de 768px (grades de 2–3 colunas, espaçamentos de desktop); `lg` a partir de 1024px (grade de 4 colunas de guildas e o título `display-xl` do hero, que não cabe antes disso).

## Elevation & Depth

**Não há sombras.** A profundidade vem de:
- **Camadas tonais:** o fundo em `neutral`, os cards em `surface` e os elementos internos em `surface-raised`.
- **Linhas finas:** `outline` define os cards. No hover, a borda passa para `primary` (a 50%) e a barra de acento ocupa toda a largura do card.
- **Atmosfera no hero:** as faixas diagonais em vermelho translúcido (6–10%) e uma faixa sólida fina criam profundidade sem sombra.

## Shapes

A forma é **reta e angular**, como os cortes da logo.
- **Cards, badges, chips e avatares:** 0px de raio.
- **Botões:** 2px, só para não parecer serrilhado.
- **Pontos de status:** círculo (`full`). É o único elemento redondo.
- **Barra de acento:** 56×4px em `primary`, no canto superior esquerdo de todo card. É a assinatura do sistema.
- **Diagonais a ~28°:** faixas decorativas e fagulhas. Nunca use curvas decorativas.

## Components

Medidas e tokens de cada componente:

| Componente | Fundo | Texto | Tipografia | Canto | Medidas |
|---|---|---|---|---|---|
| `button-primary` | `primary` (hover: `primary-hover`) | `on-primary` | `button` | `xs` | padding 12px 26px |
| `button-secondary` | transparente, borda `outline-strong` | `on-surface` | `button` | `xs` | padding 12px 26px |
| `button-on-primary` | `neutral` | `on-surface` | `button` | `xs` | padding 14px 28px |
| `eyebrow` (rótulo de seção) | — | `primary-text` | `label-mono` | — | — |
| `nav` | `neutral`, borda inferior `outline` | `on-surface-variant` | `nav-link` | — | altura 76px |
| `card` | `surface`, borda `outline` (hover: `primary`) | — | — | `none` | padding 24px |
| `card-accent-bar` | `primary` | — | — | — | 56×4px |
| `card-cover` | `ember` | — | — | — | — |
| `avatar-guild` | `surface-raised` | `on-surface` | `label-mono` | `none` | 56×56px |
| `badge-status-dev` | `primary-tint` | `primary-text` | `label-mono-sm` | `none` | padding 4px 8px |
| `badge-status-released` | `surface-raised` | `on-surface` | `label-mono-sm` | `none` | padding 4px 8px |
| `badge-status-paused` | transparente, borda `outline-strong` | `on-surface-muted` | `label-mono-sm` | `none` | padding 4px 8px |
| `chip` | `surface-raised` | `on-surface-variant` | `label-mono-sm` | `none` | padding 3px 8px |
| `article-row` | borda `outline` | — | `title-list` | — | padding 32px 0 |
| `cta-block` | `primary` | `on-primary` | — | `none` | padding 80px 72px |

- **Botões:** o `button-primary` (vermelho) é a ação principal, no máximo um por tela ou bloco ("Entre para uma guilda", "Participe"). O `button-secondary` tem só contorno e é a ação secundária ("Ver jogos →"). O `button-on-primary` (preto) é usado só sobre o bloco vermelho. No mobile os botões ocupam a largura toda e ficam empilhados.
- **Menu:** barra de ponta a ponta com 76px de altura e uma linha fina embaixo. Logo à esquerda, links no centro (Guildas, Jogos, Artigos, Sobre) e "Participe" à direita. No mobile vira logo + ícone de menu (hambúrguer).
- **Card de guilda:** avatar quadrado de 56px com as iniciais em mono, nome em `headline-md`, foco da guilda em `body-sm` com cor `muted` e contagem em `label-mono-sm`. No mobile vira uma linha: avatar, nome e "→".
- **Card de jogo:** capa 16:9 no topo, badge de status, título em `headline-md`, sinopse em `body-sm` com cor `variant` e, por fim, guilda e plataformas em mono.
- **Badges de status do jogo:** `badge-status-dev` para "EM DESENVOLVIMENTO", `badge-status-released` para "LANÇADO" e `badge-status-paused` para "PAUSADO". Todos começam com um ponto de 6px.
- **Linha de artigo:** linha editorial com o veículo (mono, `primary-text`, coluna de 220px), o título (`title-list`) com os autores embaixo e "LER PUBLICAÇÃO ↗" à direita. As linhas são separadas por `outline`.
- **Números grandes (stat):** o número em `stat` e o rótulo mono embaixo, com uma linha fina à esquerda.
- **Bloco "Apoie" (`cta-block`):** o único bloco com fundo vermelho no site, com fagulhas em preto a 22% e faixas diagonais pretas a 8–10%.
- **Capa de placeholder:** gradiente diagonal de `ember` para `surface-raised`, com fagulhas pequenas a 45%. Aparece enquanto a guilda não sobe uma imagem.
- **Rodapé:** a logo com uma frase curta, colunas (Navegação, Redes, Contato) e uma linha final em mono.
- **Foco:** todo elemento interativo mostra, em `:focus-visible`, um contorno de 2px em `primary-text` com 2px de afastamento. Nunca remova o foco sem colocar outro indicador no lugar.
- **Números grandes no mobile:** `stat-mobile` (56px) abaixo de `md`.
- **Cabeçalho de página (`PageHeader`):** usado nas páginas internas. Rótulo mono em `primary-text`, título `headline-lg` (48px no mobile) com quebras intencionais e, opcionalmente, um parágrafo `body-lg` em `on-surface-variant` limitado à `measure`. É o único `h1` da página.
- **Link de volta (`BackLink`):** "← Todas as guildas", em `type-button` e `on-surface-variant`, no topo das páginas de detalhe. A seta desloca 4px para a esquerda no hover.
- **Rich text:** parágrafos `body-lg` em `on-surface-variant`; `h2` em `headline-sm` (menor que o título da seção, que é `headline-md`) e `h3` em `body-lg` peso 600, ambos em `on-surface`; listas com marcador quadrado em `primary`; links em `on-surface` sublinhados (nunca vermelhos); tudo limitado à `measure`.
- **Setas (→ ↗ ←):** sempre desenhadas com a Inter, mesmo dentro de textos em Saira Condensed, que não tem esses glifos (o navegador cairia numa fonte de emoji).
- **Trailer:** embed do YouTube em modo sem cookies (`youtube-nocookie.com`), 16:9, com borda `outline` e cantos retos. Carrega sob demanda (`loading="lazy"`).
- **Galeria:** grade de imagens 16:9 com cantos retos; 1 coluna no mobile, 2 em `md`, 3 em `lg`; `gap` de `md`.
- **Faixa de pré-visualização:** barra fixa no rodapé da tela, fundo `surface-raised` com borda superior `primary`, rótulo mono "Pré-visualização do rascunho" em `primary-text` e o link "Sair da pré-visualização". Só aparece para quem abriu o preview pelo painel.

## Do's and Don'ts

- **Faça:** use `#D21312` só em preenchimentos, textos ≥24px e elementos gráficos. Para texto vermelho menor, use `#FF5A4F`.
- **Faça:** mantenha um único botão vermelho por bloco. O resto é secundário.
- **Faça:** coloque os títulos em Saira Condensed caixa-alta, o texto corrido em Inter e os metadados em Geist Mono.
- **Faça:** dê a todo card a barra de acento vermelha de 56×4px e canto reto.
- **Faça:** numere as seções da landing (`01 / …`), o que reforça o tom de "oficina".
- **Faça:** mantenha o contraste AA. O texto mais escuro permitido é `#86868C`.
- **Não faça:** usar o vermelho em links de texto corrido, ícones genéricos ou bordas de repouso.
- **Não faça:** criar seções claras ou alternar faixas claras e escuras.
- **Não faça:** usar sombras projetadas, cantos arredondados em cards, gradientes coloridos fora das capas e do hero, ou cores fora da paleta (sem azul, sem verde).
- **Não faça:** usar Saira Condensed em parágrafos, nem Inter em caixa-alta.
- **Não faça:** repetir a logo inteira como decoração. O que se repete são as fagulhas, não o letreiro.

## Motion

A animação reforça a ideia de **"forja"**: coisas que cortam, faíscam e se encaixam. É rápida, direta e sempre com propósito. Nada flutua nem quica. Implementação com **Motion** (`motion/react`) em componentes reutilizáveis.

**Curvas e durações**
- Easing padrão: `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out forte), com ataque rápido e pouso suave.
- Micro-interações (hover, foco, press): 150–200ms.
- Entradas de elementos: 400–600ms.
- Momento do hero: até ~1,2s no total, só no primeiro carregamento.
- Stagger entre itens de uma lista ou grade: 60–80ms.

**Momentos**
- **Hero ("golpe"):** as fagulhas entram em diagonal (~28°), vindo de fora para a posição final, com leve sobre-escala que se assenta. As faixas diagonais deslizam logo em seguida. As linhas do título sobem uma a uma, revelando o texto por uma máscara. "FORJADOS." acende por último em vermelho. Depois vêm o subtítulo e os botões.
- **Entradas por scroll:** cabeçalhos de seção, cards e linhas de artigo aparecem com fade e um deslocamento de 16–24px para cima, uma única vez, quando entram na tela. Os grids usam stagger.
- **Números grandes (stat):** contam de 0 até o valor quando entram na tela.
- **Hover em card:** a barra de acento cresce de 56px até a largura total, a borda passa para `primary` e a capa ganha um leve zoom (1.03).
- **Hover em botão:** o primário vai para `primary-hover`. Os links com "→" deslocam a seta 4px.
- **Fagulhas no hero:** um parallax sutil com o scroll (no máximo ~40px). Nada além disso.

**Regras**
- Respeite `prefers-reduced-motion`: sem deslocamentos, parallax nem contagem. O conteúdo aparece direto, com no máximo um fade curto.
- Anime só `transform` e `opacity` (performance). Nunca anime layout.
- Nada de scroll-jacking, loops infinitos chamando atenção, animação atrasando conteúdo ou entrada que se repete toda vez que o elemento reaparece.
- O conteúdo precisa estar legível e clicável mesmo antes de qualquer animação terminar.

## Page Patterns

Estrutura da landing (`/`):

1. **Hero:** rótulo mono, "ONDE JOGOS SÃO FORJADOS." (com "FORJADOS." em vermelho), uma frase de apoio, "Entre para uma guilda" e "Ver jogos", mais uma linha mono com os pilares.
2. **01 / O que é a Forja:** texto curto e 3 números grandes (guildas, jogos, artigos).
3. **02 / Como funciona:** Seleção, Guilda e Publique.
4. **03 / Guildas:** grade 4×N, com link para `/guildas/[slug]`.
5. **04 / Jogos em destaque:** 3 cards, com link para `/jogos`.
6. **05 / Artigos recentes:** as 3 linhas mais recentes, com link para `/artigos`.
7. **06 / Apoie a Forja:** bloco vermelho, "Fale com a gente" e e-mail de contato.
8. **Rodapé.**

As páginas internas (guilda, jogo, `/artigos`) reaproveitam os mesmos componentes: cabeçalho de seção, cards, linha de artigo e badges.

Páginas internas (mesmo cabeçalho, rodapé e tokens da landing; sem hero cinematográfico).

- **`/guildas`:** `PageHeader` ("Guildas" / "Todas as\nguildas."), grade de cards de guilda (4 colunas em `lg`, 2 em `md`, lista compacta no mobile), em ordem alfabética.
- **`/guildas/[slug]`:** `BackLink`; capa `banner` (12:5, placeholder de fagulhas); identidade (avatar, rótulo "Guilda", nome em `headline-lg`, descrição curta); links externos (Instagram, itch.io…) como `ArrowLink` ↗; seções "Sobre" (rich text), "Jogos" (grade de cards de jogo) e "Membros" (lista em colunas), cada uma só se tiver conteúdo.
- **`/jogos`:** `PageHeader` ("Jogos" / "Feito nas\nguildas."), grade de cards de jogo (3 colunas em `lg`, 2 em `md`, 1 no mobile), mais recentes primeiro.
- **`/jogos/[slug]`:** `BackLink`; em `lg`, duas colunas: à esquerda status, título `headline-lg`, guilda (link), sinopse `body-lg`, botão "Jogar" (primário, se houver link), plataformas e data; à direita a capa 16:9. Abaixo, seções "Trailer", "Sobre o jogo" (rich text), "Galeria" e "Créditos", cada uma só se tiver conteúdo.
- **`/artigos`:** `PageHeader` ("Pesquisa" / "Artigos das\nguildas."), lista de linhas de artigo, mais recentes primeiro.
- **Página não encontrada:** rótulo "404", título "Página não\nencontrada." e botão "Voltar ao início".
- Seções internas usam `SectionTitle` (`h2` em `headline-md`) em vez do cabeçalho numerado da landing. Cards lado a lado têm sempre a mesma altura.
