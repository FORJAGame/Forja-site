---
version: alpha
name: Forja — Arena
description: Sistema visual do site da Forja, iniciativa de desenvolvimento de jogos do CESAR. Escuro, preto/vermelho/branco, títulos condensados em caixa-alta, cantos retos.
colors:
  primary: "#D21312"
  primary-hover: "#E8201F"
  primary-text: "#FF5A4F"
  primary-tint: "#290E0F"
  ember: "#3A0C0C"
  neutral: "#060607"
  surface: "#0D0D0F"
  surface-raised: "#16161A"
  on-surface: "#FFFFFF"
  on-surface-variant: "#A1A1A6"
  on-surface-muted: "#86868C"
  outline: "#FFFFFF17"
  outline-strong: "#FFFFFF2E"
  divider: "#FFFFFF0F"
  on-primary: "#FFFFFF"
typography:
  display-xl:
    fontFamily: Saira Condensed
    fontSize: 148px
    fontWeight: 800
    lineHeight: 0.88
    letterSpacing: -0.01em
  display-mobile:
    fontFamily: Saira Condensed
    fontSize: 60px
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: -0.005em
  headline-lg:
    fontFamily: Saira Condensed
    fontSize: 72px
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: -0.005em
  headline-lg-mobile:
    fontFamily: Saira Condensed
    fontSize: 48px
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: -0.005em
  headline-md:
    fontFamily: Saira Condensed
    fontSize: 32px
    fontWeight: 800
    lineHeight: 1
  headline-sm:
    fontFamily: Saira Condensed
    fontSize: 26px
    fontWeight: 800
    lineHeight: 1
  title-list:
    fontFamily: Saira Condensed
    fontSize: 30px
    fontWeight: 700
    lineHeight: 1.05
  stat:
    fontFamily: Saira Condensed
    fontSize: 104px
    fontWeight: 800
    lineHeight: 0.9
  body-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.55
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: Saira Condensed
    fontSize: 19px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.04em
  nav-link:
    fontFamily: Saira Condensed
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.04em
  label-mono:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0.1em
  label-mono-sm:
    fontFamily: Geist Mono
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.06em
rounded:
  none: 0px
  xs: 2px
  full: 9999px
spacing:
  unit: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 56px
  3xl: 72px
  section: 120px
  section-mobile: 72px
  gutter: 24px
  margin: 120px
  margin-mobile: 24px
  content-max: 1200px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.xs}"
    padding: 12px 26px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.on-surface}"
    typography: "{typography.button}"
    rounded: "{rounded.xs}"
    padding: 12px 26px
    borderColor: "{colors.outline-strong}"
  button-on-primary:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    typography: "{typography.button}"
    rounded: "{rounded.xs}"
    padding: 14px 28px
  eyebrow:
    textColor: "{colors.primary-text}"
    typography: "{typography.label-mono}"
  nav:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.nav-link}"
    height: 76px
    borderColor: "{colors.outline}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: 24px
    borderColor: "{colors.outline}"
  card-hover:
    borderColor: "{colors.primary}"
  card-accent-bar:
    backgroundColor: "{colors.primary}"
    width: 56px
    height: 4px
  card-cover:
    backgroundColor: "{colors.ember}"
  avatar-guild:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-mono}"
    rounded: "{rounded.none}"
    size: 56px
  badge-status-dev:
    backgroundColor: "{colors.primary-tint}"
    textColor: "{colors.primary-text}"
    typography: "{typography.label-mono-sm}"
    rounded: "{rounded.none}"
    padding: 4px 8px
  badge-status-released:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-mono-sm}"
    rounded: "{rounded.none}"
    padding: 4px 8px
  badge-status-paused:
    backgroundColor: transparent
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.label-mono-sm}"
    rounded: "{rounded.none}"
    padding: 4px 8px
    borderColor: "{colors.outline-strong}"
  chip:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-mono-sm}"
    rounded: "{rounded.none}"
    padding: 3px 8px
  article-row:
    typography: "{typography.title-list}"
    padding: 32px 0px
    borderColor: "{colors.outline}"
  cta-block:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    padding: 80px 72px
    rounded: "{rounded.none}"
---

# Forja — Design System

Protótipo de referência (Figma): https://www.figma.com/design/qLr3pgjNo0az2ZJVdMaBaQ/Forja
- Página `01 · Direções`: as três direções exploradas (A Bigorna, B Oficina, **C Arena — escolhida**).
- Página `02 · Landing`: landing desktop (1440) e mobile (390).

## Overview

A Forja é a iniciativa de desenvolvimento de jogos do CESAR, organizada em guildas de alunos. O site fala com dois públicos ao mesmo tempo:

1. **Alunos**, que devem sair instigados a entrar numa guilda.
2. **Gente de fora** (patrocinadores, parceiros, voluntários, a própria faculdade), que precisa entender a proposta e levar a iniciativa a sério.

Por isso o sistema combina **impacto no topo e sobriedade no resto**. A referência é o Raycast: tela quase preta, pouca cor e um momento "cinematográfico" no hero. A diferença é que a Forja assume o vermelho como cor de ação e puxa a energia da própria logo: letreiro pesado, cortes diagonais e fagulhas.

Personalidade: **arena, oficina, energia contida**. Parece coisa de estúdio de games, não de agência nem de SaaS. É escuro do começo ao fim, sem seções claras.

**Motivo gráfico: as fagulhas.** Os três estilhaços vermelhos da logo são o elemento visual recorrente. Aparecem grandes no hero, pequenas nas capas de placeholder e em preto translúcido sobre o bloco vermelho. Sempre acompanham **faixas diagonais a ~28°**, que repetem a inclinação dos cortes do letreiro. Os polígonos-base, extraídos da logo, estão no Figma, na camada `fagulhas`.

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

- **Saira Condensed (700–800), sempre em CAIXA-ALTA:** a voz da marca. Aparece em títulos, nomes de guilda e de jogo, números grandes, botões e menu. É condensada e pesada como o letreiro da logo. O `letterSpacing` fica levemente negativo nos tamanhos grandes e positivo (+4%) em botões e menu.
- **Inter (400–500):** todo texto corrido (descrições, sinopses, autores). Nunca em caixa-alta.
- **Geist Mono (400–500), em CAIXA-ALTA com espaçamento aberto:** metadados e rótulos "técnicos", como a numeração de seção (`01 / O QUE É A FORJA`), contagens (`3 JOGOS · 12 MEMBROS`), status, veículo do artigo e rodapé.

Regras:
- **Destaque do hero:** uma única palavra (ou expressão) fica em `primary`. Na landing é "FORJADOS."
- **Tamanho no mobile:** o `display` cai de 148px para 60px e os títulos de seção de 72px para 48px, sempre mantendo a quebra de linha intencional.
- A caixa-alta não é um token. Aplique com `text-transform: uppercase` nas classes de Saira Condensed e Geist Mono.

## Layout

- **Container:** largura máxima de 1200px, com margem lateral de 120px no desktop e 24px no mobile. O hero e o bloco "Apoie" podem ir de ponta a ponta.
- **Grid:** 12 colunas com gutter de 24px. Cards de guilda em 4 colunas, jogos e passos em 3 colunas. No mobile tudo vira 1 coluna, e as guildas viram uma lista compacta.
- **Ritmo vertical:** 120px entre seções no desktop e 72px no mobile. Cada seção é separada por uma linha fina (`divider`) no topo.
- **Cabeçalho de seção:** rótulo mono numerado em `primary-text`, título grande em Saira Condensed em duas linhas e, à direita, um link "VER TODOS →" quando houver.
- **Espaçamento:** tudo em múltiplos de 8px, com meio passo de 4px para ajustes finos.

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

## Page Patterns

Estrutura da landing (`/`):

1. **Hero:** rótulo mono, "ONDE JOGOS SÃO FORJADOS." (com "FORJADOS." em vermelho), uma frase de apoio, "Entre para uma guilda" e "Ver jogos", mais uma linha mono com os pilares.
2. **01 / O que é a Forja:** texto curto e 3 números grandes (guildas, jogos, artigos).
3. **02 / Como funciona:** Seleção, Guilda e Publique. *O processo de seleção ainda está por definir com a coordenação.*
4. **03 / Guildas:** grade 4×N, com link para `/guildas/[slug]`.
5. **04 / Jogos em destaque:** 3 cards, com link para `/jogos`.
6. **05 / Artigos recentes:** as 3 linhas mais recentes, com link para `/artigos`.
7. **06 / Apoie a Forja:** bloco vermelho, "Fale com a gente" e e-mail de contato (*provisório: `forja@exemplo.com`*).
8. **Rodapé.**

As páginas internas (guilda, jogo, `/artigos`) reaproveitam os mesmos componentes: cabeçalho de seção, cards, linha de artigo e badges.
