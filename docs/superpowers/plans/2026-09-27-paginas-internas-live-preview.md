# Páginas internas e live preview — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar as páginas `/guildas`, `/guildas/[slug]`, `/jogos`, `/jogos/[slug]` e `/artigos`, atualizar o site na hora em que um admin publica, e dar aos editores uma pré-visualização ao vivo do rascunho dentro do painel.

**Architecture:** As páginas continuam no padrão do Plano 2: funções em `src/lib/queries/` buscam como visitante e devolvem *view models* de `src/lib/presenters.ts`, e os componentes só recebem esses modelos. Cards e grades passam a ser compartilhados entre a landing e as páginas internas (`components/guilds`, `components/games`, `components/articles`). O live preview é feito no servidor: o painel abre `/preview?collection=…&id=…` num iframe; a rota confere o login do Payload, liga o `draftMode` do Next e redireciona para a página pública, que busca o rascunho **como aquele usuário** (as regras de acesso do Plano 1 garantem que um editor só vê os rascunhos da própria guilda). Com o autosave ligado, o `RefreshRouteOnSave` recarrega a página a cada salvamento. Na publicação, um hook `afterChange` chama `revalidatePath` para todas as páginas públicas.

**Tech Stack:** Next.js 16.3.6 (`draftMode`, `revalidatePath`, `generateStaticParams`, `notFound`), Payload 3.90.2 (`admin.livePreview`, `admin.preview`, `versions.drafts.autosave`), `@payloadcms/live-preview-react` 3.90.2 (`RefreshRouteOnSave`), `@payloadcms/richtext-lexical/react` (`RichText`), Tailwind 4, Motion 13, Vitest + jsdom.

**Spec:** `CLAUDE.md` (Regras de acesso, Artigos, Modelo de conteúdo, Convenções de código, Front-end) e `DESIGN.md` (Components, Motion, Page Patterns).

**Protótipo aprovado pelo Lucas (2026-09-27):** Figma `qLr3pgjNo0az2ZJVdMaBaQ`, página `03 · Páginas internas`, frames desktop: guilda `20:3`, jogo `20:147`, `/guildas` `22:2`, `/jogos` `22:113`, `/artigos` `22:266`, 404 `22:344`. O mobile não foi prototipado (limite de chamadas do Figma MCP no plano Starter): segue as regras da landing (uma coluna, títulos `headline-lg-mobile`, botões em largura total, galeria em uma coluna). **Não gaste chamadas do Figma MCP** para executar este plano; as medidas estão aqui e no `DESIGN.md`.

Decisões que o protótipo revelou (já refletidas nas tasks abaixo):
- Dentro do rich text, `h2` usa `headline-sm` (26px) para não competir com o título da seção (`headline-md`, 32px); `h3` usa `body-lg` em `on-surface` e peso 600.
- A seta ↗ cai numa fonte de emoji quando desenhada com a Saira Condensed: o componente `Arrow` força a Inter.
- Cards lado a lado têm a mesma altura (os `li` da grade esticam e o card usa `h-full`).

## Global Constraints

- Toda decisão visual segue o `DESIGN.md`. O que não estiver coberto é **acrescentado ao `DESIGN.md` primeiro** (Task 2), com `pnpm tokens` e o linter oficial.
- Sem cores, tamanhos de fonte ou espaçamentos de componente soltos: use as classes geradas (`type-*`, `text-*`, `gap-*`, `max-w-measure`…). Valores arbitrários só para posicionamento de composição.
- Componentes de `components/ui`, `components/brand` e `components/motion` não importam Payload. O único lugar que conhece o formato do Lexical é `components/content/`.
- Leituras públicas usam `overrideAccess: false`. Rascunhos só com `draft: true` **e** o `user` autenticado da sessão do painel.
- O status do jogo é `developmentStatus`. Os slugs são únicos por coleção.
- Código em inglês, textos visíveis em português.
- `revalidatePath` só funciona dentro de uma requisição do Next: hooks respeitam `context.disableRevalidate` (seed e scripts), e os testes mocam `next/cache`.
- `pnpm build` pré-renderiza as páginas e precisa do Postgres de pé.
- pnpm pode não estar no PATH do agente: use `$HOME/.local/share/pnpm/bin/pnpm` se preciso.

## Review Focus

1. **Vazamento de rascunho:** um visitante, ou um editor de outra guilda, com o cookie de `draftMode` nunca pode ver o rascunho de uma guilda ou jogo que não é dele. Deve ver só a versão publicada, ou 404 se nunca foi publicado. (Testes nas Tasks 3, 4 e 8.)
2. **Pré-visualização sem login ou de documento inexistente:** `/preview` responde com erro claro (400, 401 ou 404) e nunca liga o `draftMode`. (Task 8.)
3. **Publicar reflete no site:** depois que um admin publica, a landing, as listas e a página do item mudam sem esperar os 60s. Salvar rascunho não mexe no cache. (Task 7 e verificação na Task 9.)
4. **Autosave de editor:** o autosave de um editor funciona (rascunho em modo draft) e nunca publica; dois rascunhos novos ainda sem título não colidem no slug. (Task 8.)
5. **Guilda ou jogo sem descrição, capa, trailer, galeria, links ou membros:** a página renderiza sem seções vazias nem imagens quebradas. (Tasks 5 e 6.)

---

## File Structure

```
DESIGN.md                                     + measure, Page Patterns internas, rich text, embed, galeria, preview
src/styles/tokens.css                         GERADO (pnpm tokens)
src/utilities/date.ts                         formatMonthYear
src/lib/views.ts                              + RichTextData, ExternalLinkView
src/lib/presenters.ts                         + toGuildPage, toGamePage; url de artigo opcional
src/lib/viewer.ts                             Viewer, PUBLIC_VIEWER, queryOptionsFor (puro)
src/lib/queries/viewer.ts                     resolveViewer (draftMode + payload.auth)
src/lib/queries/counts.ts                     countPublishedGamesByGuild
src/lib/queries/guilds.ts                     listGuilds, getGuildPage, listGuildSlugs
src/lib/queries/games.ts                      listGames, getGamePage, listGameSlugs
src/lib/queries/articles.ts                   listArticles
src/lib/queries/landing.ts                    usa counts.ts
src/lib/preview.ts                            publicPathFor, previewUrlFor, previewAdminOptions (puro)
src/lib/queries/preview.ts                    resolvePreviewTarget
src/hooks/revalidation.ts                     revalidatePublicSite, revalidateOnPublish, revalidateAfterDelete
src/fields/slug.ts                            slug vazio vira null
src/hooks/publication.ts                      draftVersions com autosave
src/components/ui/                            + PageHeader, SectionTitle, BackLink, YouTubeEmbed, Gallery; SectionHeader.number opcional; Cover.priority
src/components/content/RichTextContent.tsx    renderiza o Lexical com os tokens
src/components/guilds/                        GuildCard (movido), GuildGrid, GuildsIndex, GuildProfile
src/components/games/                         GameCard (movido), GameGrid, GamesIndex, GameDetail
src/components/articles/                      ArticleRow (movido), ArticlesIndex
src/components/preview/                       PreviewBanner, LivePreviewListener, PreviewTools
src/app/(frontend)/guildas/page.tsx, [slug]/page.tsx
src/app/(frontend)/jogos/page.tsx, [slug]/page.tsx
src/app/(frontend)/artigos/page.tsx
src/app/(frontend)/not-found.tsx
src/app/(frontend)/preview/route.ts, preview/exit/route.ts
tests/unit/date.spec.ts, viewer.spec.ts, preview.spec.ts, revalidation.spec.ts
tests/int/guild-pages.spec.ts, game-pages.spec.ts, preview-target.spec.ts, autosave.spec.ts
tests/components/content.spec.tsx, guild-pages.spec.tsx, game-pages.spec.tsx, polish.spec.tsx
```

---

### Task 1: Pendências menores da revisão do Plano 2

**Files:**
- Modify: `src/components/landing/HeroContent.tsx`, `src/components/landing/GameCard.tsx`, `src/components/ui/ChipList.tsx`, `src/components/landing/ArticleRow.tsx`, `src/components/ui/ArrowLink.tsx`, `src/components/ui/Arrow.tsx`, `src/components/ui/Cover.tsx`, `src/components/ui/Card.tsx`, `src/components/layout/MobileMenu.tsx`, `src/lib/presenters.ts`, `tests/components/landing.spec.tsx`, `tests/components/ui.spec.tsx`, `tests/unit/presenters.spec.ts`
- Test: `tests/components/polish.spec.tsx`

**Interfaces:**
- Produces: `ArticleRowView.url: string | null` (antes `string`). `ArticleRow` sem link quando `url` é `null`. Links externos anunciam "(abre em nova aba)" para leitores de tela.

- [ ] **Step 1: Escrever os testes**

Crie `tests/components/polish.spec.tsx`:

```tsx
// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { ArticleRow } from '@/components/landing/ArticleRow'
import { Hero } from '@/components/landing/Hero'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { ArrowLink } from '@/components/ui/ArrowLink'

const article = {
  id: 1,
  title: 'Masmorras procedurais',
  url: 'https://doi.org/10.1/x',
  venue: 'SBGames 2026',
  authors: 'Ana Lima',
  date: '2026-09-01T00:00:00.000Z',
}

describe('review polish', () => {
  it('uses the singular for a single published guild', () => {
    render(<Hero guildCount={1} />)
    expect(screen.getByText(/^1 guilda \|/)).toBeInTheDocument()
  })

  it('tells screen reader users that external links open a new tab', () => {
    render(
      <ArrowLink href="https://doi.org/10.1" external>
        Ler publicação
      </ArrowLink>,
    )
    expect(screen.getByRole('link', { name: 'Ler publicação (abre em nova aba)' })).toBeInTheDocument()
  })

  it('announces the new tab on article links too', () => {
    render(<ArticleRow article={article} />)
    expect(screen.getByRole('link', { name: 'Masmorras procedurais (abre em nova aba)' })).toHaveAttribute(
      'target',
      '_blank',
    )
  })

  it('renders an article without a link when it has no URL', () => {
    render(<ArticleRow article={{ ...article, url: null }} />)

    expect(screen.getByRole('heading', { name: 'Masmorras procedurais' })).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByText('Ler publicação')).not.toBeInTheDocument()
  })

  it('only points aria-controls at the menu while it exists', async () => {
    const user = userEvent.setup()
    render(<MobileMenu />)

    expect(screen.getByRole('button', { name: 'Abrir menu' })).not.toHaveAttribute('aria-controls')
    await user.click(screen.getByRole('button', { name: 'Abrir menu' }))
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-controls', 'menu-mobile')
  })
})
```

Em `tests/unit/presenters.spec.ts`, acrescente dentro de `describe('toGuildCard', …)`:

```ts
  it('keeps emoji intact in the initials', () => {
    expect(toGuildCard({ ...guild, name: '🔥Brasa' }, 0).initials).toBe('🔥B')
  })
```

e dentro de `describe('toArticleRow', …)`:

```ts
  it('keeps a missing URL as null instead of an empty link', () => {
    expect(toArticleRow({ ...article, url: null }).url).toBeNull()
  })
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test tests/components/polish.spec.tsx tests/unit/presenters.spec.ts`
Expected: FAIL nos 5 testes novos de componente e nos 2 de presenter.

- [ ] **Step 3: Implementar**

`src/components/landing/HeroContent.tsx`: importe `pluralize` de `@/utilities/pluralize` e troque a linha dos pilares por:

```tsx
  const pillars = [pluralize(guildCount, 'guilda', 'guildas'), ...hero.pillars].join('  |  ')
```

`src/lib/presenters.ts`:
- `ArticleRowView.url` passa a ser `url: string | null`.
- Em `toArticleRow`: `url: article.url ?? null,`
- Em `toGuildCard`: `initials: Array.from(guild.name).slice(0, 2).join(''),`

`src/components/ui/ArrowLink.tsx`, no ramo `external`, logo antes de `<Arrow external />`:

```tsx
      <span className="sr-only"> (abre em nova aba)</span>
```

`src/components/landing/ArticleRow.tsx` passa a ser:

```tsx
import { Arrow } from '@/components/ui/Arrow'
import { landingCopy } from '@/content/landing'
import type { ArticleRowView } from '@/lib/presenters'

export function ArticleRow({ article }: { article: ArticleRowView }) {
  return (
    <article className="group relative flex flex-col gap-sm border-b border-outline py-lg md:flex-row md:items-center md:gap-2xl md:py-xl">
      <p className="type-label-mono min-w-0 break-words text-primary-text md:w-[220px] md:shrink-0">{article.venue}</p>
      <div className="flex min-w-0 flex-1 flex-col gap-sm">
        <h3 className="type-headline-sm break-words md:type-title-list">
          {article.url ? (
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="after:absolute after:inset-0">
              {article.title}
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          ) : (
            article.title
          )}
        </h3>
        <p className="type-body-sm text-on-surface-muted">{article.authors}</p>
      </div>
      {article.url && (
        <span aria-hidden="true" className="type-button inline-flex items-center gap-sm md:shrink-0">
          {landingCopy.articles.readLabel}
          <Arrow external />
        </span>
      )}
    </article>
  )
}
```

`src/components/layout/MobileMenu.tsx`: troque `aria-controls="menu-mobile"` por `aria-controls={isOpen ? 'menu-mobile' : undefined}`.

Ajustes só de estilo (sem teste de unidade; conferidos no navegador na Task 9):
- `src/components/landing/GameCard.tsx`: a sinopse ganha `break-words` → `className="type-body-sm break-words text-on-surface-variant"`.
- `src/components/ui/ChipList.tsx`: cada `li` ganha `max-w-full break-words`.
- `src/components/ui/Arrow.tsx`: acrescente `motion-reduce:transition-none motion-reduce:group-hover:translate-x-0` e `[font-family:var(--font-inter)]` às classes (a Saira Condensed não tem o glifo ↗ e o navegador cai numa fonte de emoji; o protótipo do Figma mostrou isso).
- `src/components/ui/Cover.tsx`: na imagem, acrescente `motion-reduce:transition-none motion-reduce:group-hover:scale-100`.
- `src/components/ui/Card.tsx`: na barra de hover, acrescente `motion-reduce:transition-none`.

Atualize os testes existentes que usavam o nome antigo dos links externos:
- `tests/components/ui.spec.tsx`, teste `opens external links in a new tab safely`: `screen.getByRole('link', { name: 'Ler publicação (abre em nova aba)' })`.
- `tests/components/landing.spec.tsx`, teste `links each article to the external publication in a new tab`: `screen.getByRole('link', { name: 'Masmorras procedurais (abre em nova aba)' })`.

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: tudo verde.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: address the landing review minors"
```

---

### Task 2: Padrões das páginas internas no DESIGN.md e novos primitivos

**Files:**
- Modify: `DESIGN.md`, `src/styles/tokens.css` (gerado), `src/components/ui/SectionHeader.tsx`, `src/components/ui/Cover.tsx`, `src/lib/views.ts`, `package.json`
- Create: `src/utilities/date.ts`, `src/components/ui/PageHeader.tsx`, `src/components/ui/SectionTitle.tsx`, `src/components/ui/BackLink.tsx`, `src/components/ui/YouTubeEmbed.tsx`, `src/components/ui/Gallery.tsx`, `src/components/content/RichTextContent.tsx`
- Test: `tests/unit/date.spec.ts`, `tests/components/content.spec.tsx`

**Interfaces:**
- Produces:
  - Token `spacing.measure` (680px) → classe `max-w-measure`.
  - `formatMonthYear(iso: string): string` → `"setembro de 2026"` (UTC).
  - `type RichTextData` e `type ExternalLinkView = { label: string; url: string }` em `@/lib/views`.
  - `PageHeader({ eyebrow, title, description? })`: um único `h1` por página.
  - `SectionTitle({ id, children })`: `h2` de seção interna.
  - `BackLink({ href, children })`: "← …", seta decorativa.
  - `YouTubeEmbed({ videoId, title })`: iframe `youtube-nocookie`, 16:9, `loading="lazy"`.
  - `Gallery({ images: MediaView[] })`: grade de imagens.
  - `RichTextContent({ data: RichTextData })`: Lexical com a tipografia do `DESIGN.md`.
  - `SectionHeader.number` passa a ser opcional; `Cover` ganha `priority?: boolean`.

- [ ] **Step 1: Atualizar o `DESIGN.md`**

No YAML, em `spacing`, acrescente depois de `content-max`:

```yaml
  measure: 680px
```

Em `## Layout`, acrescente à lista:

```markdown
- **Medida de leitura (`measure`, 680px):** largura máxima de texto corrido (descrições, rich text, subtítulos longos), para as linhas não passarem de ~75 caracteres.
```

Em `## Components`, acrescente à lista:

```markdown
- **Cabeçalho de página (`PageHeader`):** usado nas páginas internas. Rótulo mono em `primary-text`, título `headline-lg` (48px no mobile) com quebras intencionais e, opcionalmente, um parágrafo `body-lg` em `on-surface-variant` limitado à `measure`. É o único `h1` da página.
- **Link de volta (`BackLink`):** "← Todas as guildas", em `type-button` e `on-surface-variant`, no topo das páginas de detalhe. A seta desloca 4px para a esquerda no hover.
- **Rich text:** parágrafos `body-lg` em `on-surface-variant`; `h2` em `headline-sm` (menor que o título da seção, que é `headline-md`) e `h3` em `body-lg` peso 600, ambos em `on-surface`; listas com marcador quadrado em `primary`; links em `on-surface` sublinhados (nunca vermelhos); tudo limitado à `measure`.
- **Trailer:** embed do YouTube em modo sem cookies (`youtube-nocookie.com`), 16:9, com borda `outline` e cantos retos. Carrega sob demanda (`loading="lazy"`).
- **Galeria:** grade de imagens 16:9 com cantos retos; 1 coluna no mobile, 2 em `md`, 3 em `lg`; `gap` de `md`.
- **Faixa de pré-visualização:** barra fixa no rodapé da tela, fundo `surface-raised` com borda superior `primary`, rótulo mono "Pré-visualização do rascunho" em `primary-text` e o link "Sair". Só aparece para quem abriu o preview pelo painel.
```

Em `## Page Patterns`, acrescente ao final:

```markdown
Páginas internas (mesmo cabeçalho, rodapé e tokens da landing; sem hero cinematográfico):

- **`/guildas`:** `PageHeader` ("Guildas" / "Todas as\nguildas."), grade de cards de guilda (4 colunas em `lg`, 2 em `md`, lista compacta no mobile), em ordem alfabética.
- **`/guildas/[slug]`:** `BackLink`; capa `banner` (12:5, placeholder de fagulhas); identidade (avatar, rótulo "Guilda", nome em `headline-lg`, descrição curta); links externos (Instagram, itch.io…) como `ArrowLink` ↗; seções "Sobre" (rich text), "Jogos" (grade de cards de jogo) e "Membros" (lista em colunas), cada uma só se tiver conteúdo.
- **`/jogos`:** `PageHeader` ("Jogos" / "Feito nas\nguildas."), grade de cards de jogo (3 colunas em `md`, 1 no mobile), mais recentes primeiro.
- **`/jogos/[slug]`:** `BackLink`; em `lg`, duas colunas: à esquerda status, título `headline-lg`, guilda (link), sinopse `body-lg`, botão "Jogar" (primário, se houver link), plataformas e data; à direita a capa 16:9. Abaixo, seções "Trailer", "Sobre o jogo" (rich text), "Galeria" e "Créditos", cada uma só se tiver conteúdo.
- **`/artigos`:** `PageHeader` ("Pesquisa" / "Artigos das\nguildas."), lista de linhas de artigo, mais recentes primeiro.
- **Página não encontrada:** rótulo "404", título "Página não\nencontrada." e botão "Voltar ao início".
- Seções internas usam `SectionTitle` (`h2` em `headline-md`) em vez do cabeçalho numerado da landing.
```

```bash
pnpm tokens
npx -y -p @google/design.md designmd lint DESIGN.md
```

Expected: `src/styles/tokens.css` com `--spacing-measure: 680px;` e o linter com `"errors": 0`.

- [ ] **Step 2: Escrever os testes**

Crie `tests/unit/date.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { formatMonthYear } from '@/utilities/date'

describe('formatMonthYear', () => {
  it('writes the month and year in Portuguese', () => {
    expect(formatMonthYear('2026-09-01T00:00:00.000Z')).toBe('setembro de 2026')
  })

  it('does not shift the month with the server time zone', () => {
    expect(formatMonthYear('2026-01-01T00:00:00.000Z')).toBe('janeiro de 2026')
  })
})
```

Crie `tests/components/content.spec.tsx`:

```tsx
// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RichTextContent } from '@/components/content/RichTextContent'
import { BackLink } from '@/components/ui/BackLink'
import { Gallery } from '@/components/ui/Gallery'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { YouTubeEmbed } from '@/components/ui/YouTubeEmbed'
import type { RichTextData } from '@/lib/views'

const text = (value: string) => ({ type: 'text', text: value, version: 1, detail: 0, format: 0, mode: 'normal', style: '' })

const richText = {
  root: {
    type: 'root',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children: [
      { type: 'heading', tag: 'h2', version: 1, direction: 'ltr', format: '', indent: 0, children: [text('Mecânicas')] },
      {
        type: 'paragraph',
        version: 1,
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        children: [text('Forje peças para abrir caminhos.')],
      },
    ],
  },
} as unknown as RichTextData

describe('PageHeader', () => {
  it('renders the page title as the only h1', () => {
    render(<PageHeader eyebrow="Guildas" title={'Todas as\nguildas.'} description="Times de alunos." />)

    expect(screen.getByRole('heading', { level: 1, name: 'Todas as guildas.' })).toBeInTheDocument()
    expect(screen.getByText('Times de alunos.')).toBeInTheDocument()
  })
})

describe('SectionHeader', () => {
  it('works without a section number on internal pages', () => {
    render(<SectionHeader id="x" eyebrow="Guildas" title="Todas" />)
    expect(screen.getByText('Guildas')).toBeInTheDocument()
  })
})

describe('BackLink', () => {
  it('links back with a decorative arrow', () => {
    render(<BackLink href="/guildas">Todas as guildas</BackLink>)

    expect(screen.getByRole('link', { name: 'Todas as guildas' })).toHaveAttribute('href', '/guildas')
    expect(screen.getByText('←')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('YouTubeEmbed', () => {
  it('embeds the privacy-enhanced player lazily with an accessible title', () => {
    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Trailer de Ecos de Ferro" />)

    const frame = screen.getByTitle('Trailer de Ecos de Ferro')
    expect(frame).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(frame).toHaveAttribute('loading', 'lazy')
  })
})

describe('Gallery', () => {
  it('shows every image with its alt text', () => {
    render(
      <Gallery
        images={[
          { url: '/api/media/file/a.png', alt: 'Tela 1' },
          { url: '/api/media/file/b.png', alt: 'Tela 2' },
        ]}
      />,
    )

    expect(screen.getByRole('img', { name: 'Tela 1' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Tela 2' })).toBeInTheDocument()
  })
})

describe('RichTextContent', () => {
  it('renders the Lexical headings and paragraphs', () => {
    render(<RichTextContent data={richText} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Mecânicas' })).toBeInTheDocument()
    expect(screen.getByText('Forje peças para abrir caminhos.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm test tests/unit/date.spec.ts tests/components/content.spec.tsx`
Expected: FAIL (imports não resolvem).

- [ ] **Step 4: Implementar**

Crie `src/utilities/date.ts`:

```ts
const monthYear = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export const formatMonthYear = (iso: string): string => monthYear.format(new Date(iso))
```

Em `src/lib/views.ts`, acrescente:

```ts
import type { RichText } from '@payloadcms/richtext-lexical/react'
import type { ComponentProps } from 'react'

export type RichTextData = ComponentProps<typeof RichText>['data']

export type ExternalLinkView = { label: string; url: string }
```

(os imports vão para o topo do arquivo).

Crie `src/components/ui/PageHeader.tsx`:

```tsx
import { Reveal } from '@/components/motion/Reveal'

import { Container } from './Container'
import { Eyebrow } from './Eyebrow'
import { LineBreaks } from './LineBreaks'

type PageHeaderProps = { eyebrow: string; title: string; description?: string }

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <Container className="pb-2xl pt-2xl md:pt-3xl">
      <Reveal className="flex flex-col gap-md">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="type-headline-lg-mobile break-words md:type-headline-lg">
          <LineBreaks text={title} />
        </h1>
        {description && <p className="type-body-lg max-w-measure text-on-surface-variant">{description}</p>}
      </Reveal>
    </Container>
  )
}
```

Crie `src/components/ui/SectionTitle.tsx`:

```tsx
import type { ReactNode } from 'react'

export function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="type-headline-md mb-xl">
      {children}
    </h2>
  )
}
```

Crie `src/components/ui/BackLink.tsx`:

```tsx
import Link from 'next/link'
import type { ReactNode } from 'react'

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="group type-button inline-flex items-center gap-sm text-on-surface-variant hover:text-on-surface">
      <span
        aria-hidden="true"
        className="inline-block transition-transform duration-200 ease-forge group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
      >
        ←
      </span>
      {children}
    </Link>
  )
}
```

Crie `src/components/ui/YouTubeEmbed.tsx`:

```tsx
export function YouTubeEmbed({ videoId, title }: { videoId: string; title: string }) {
  return (
    <div className="relative aspect-video overflow-hidden border border-outline bg-surface">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={title}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 size-full"
      />
    </div>
  )
}
```

Crie `src/components/ui/Gallery.tsx`:

```tsx
import Image from 'next/image'

import type { MediaView } from '@/lib/views'

export function Gallery({ images }: { images: MediaView[] }) {
  return (
    <ul className="grid gap-md md:grid-cols-2 lg:grid-cols-3">
      {images.map((image) => (
        <li key={image.url} className="relative aspect-video overflow-hidden border border-outline bg-surface">
          <Image src={image.url} alt={image.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
        </li>
      ))}
    </ul>
  )
}
```

Crie `src/components/content/RichTextContent.tsx`:

```tsx
import { RichText } from '@payloadcms/richtext-lexical/react'

import type { RichTextData } from '@/lib/views'

// DESIGN.md › Components › Rich text.
const RICH_TEXT_CLASSES = [
  'max-w-measure flex flex-col gap-md',
  '[&_p]:type-body-lg [&_p]:text-on-surface-variant',
  '[&_h2]:type-headline-sm [&_h2]:mt-lg',
  '[&_h3]:type-body-lg [&_h3]:mt-md [&_h3]:font-semibold [&_h3]:text-on-surface',
  '[&_ul]:flex [&_ul]:list-[square] [&_ul]:flex-col [&_ul]:gap-sm [&_ul]:pl-lg [&_ul_li]:marker:text-primary',
  '[&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-sm [&_ol]:pl-lg',
  '[&_li]:type-body-lg [&_li]:text-on-surface-variant',
  '[&_a]:text-on-surface [&_a]:underline [&_a]:underline-offset-4',
  '[&_strong]:text-on-surface',
].join(' ')

export function RichTextContent({ data }: { data: RichTextData }) {
  return <RichText data={data} className={RICH_TEXT_CLASSES} />
}
```

Em `src/components/ui/SectionHeader.tsx`, `number` vira opcional e o rótulo muda para:

```tsx
        <Eyebrow>{number ? `${number} / ${eyebrow}` : eyebrow}</Eyebrow>
```

(tipo: `number?: string`).

Em `src/components/ui/Cover.tsx`, acrescente `priority?: boolean` às props e repasse para o `Image` (`priority={priority}`).

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: tudo verde (o teste de sincronia do `tokens.css` inclusive).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add internal page patterns and content primitives"
```

---

### Task 3: Quem está vendo (viewer), grades compartilhadas e dados das guildas

**Files:**
- Move: `src/components/landing/GuildCard.tsx` → `src/components/guilds/GuildCard.tsx`; `src/components/landing/GameCard.tsx` → `src/components/games/GameCard.tsx`; `src/components/landing/ArticleRow.tsx` → `src/components/articles/ArticleRow.tsx`
- Create: `src/lib/viewer.ts`, `src/lib/queries/viewer.ts`, `src/lib/queries/counts.ts`, `src/lib/queries/guilds.ts`, `src/components/guilds/GuildGrid.tsx`, `src/components/games/GameGrid.tsx`
- Modify: `src/lib/presenters.ts`, `src/lib/queries/landing.ts`, `src/components/landing/GuildsSection.tsx`, `src/components/landing/FeaturedGamesSection.tsx`, `src/components/landing/RecentArticlesSection.tsx`, imports nos testes que usam os componentes movidos
- Test: `tests/unit/viewer.spec.ts`, `tests/int/guild-pages.spec.ts`

**Interfaces:**
- Consumes: presenters e fixtures dos Planos 1 e 2 (`createBaseFixture`, `createGame`, `createGuild`).
- Produces:
  - `type Viewer = { draft: boolean; user: TypedUser | null }`, `PUBLIC_VIEWER`, `queryOptionsFor(viewer)` → `{ draft, user, overrideAccess: false }` (`@/lib/viewer`)
  - `resolveViewer(payload): Promise<Viewer>`: rascunho só com `draftMode` ligado **e** usuário logado no painel (`@/lib/queries/viewer`)
  - `countPublishedGamesByGuild(payload): Promise<Map<number, number>>`
  - `type GuildPageView = { id; name; slug; href; shortDescription; description: RichTextData | null; initials; logo; cover; links: ExternalLinkView[]; members: string[]; games: GameCardView[] }` e `toGuildPage(guild, games)`
  - `listGuilds(payload): Promise<GuildCardView[]>` (todas publicadas, por nome), `getGuildPage(payload, slug, viewer?)`, `listGuildSlugs(payload)`
  - `GuildGrid({ guilds, mobileLimit? })`, `GameGrid({ games, layout?: 'grid' | 'carousel' })`

A busca do documento principal usa o `viewer`; se o rascunho não for visível para ele, cai para a versão pública. Listas (cards de guildas e de jogos dentro da guilda) usam sempre a versão publicada: o preview serve para conferir o próprio documento.

- [ ] **Step 1: Mover os cards compartilhados**

```bash
mkdir -p src/components/guilds src/components/games src/components/articles
git mv src/components/landing/GuildCard.tsx src/components/guilds/GuildCard.tsx
git mv src/components/landing/GameCard.tsx src/components/games/GameCard.tsx
git mv src/components/landing/ArticleRow.tsx src/components/articles/ArticleRow.tsx
```

Atualize os imports: nas seções da landing (`./GuildCard` → `@/components/guilds/GuildCard`, `./GameCard` → `@/components/games/GameCard`, `./ArticleRow` → `@/components/articles/ArticleRow`) e em `tests/components/polish.spec.tsx` (`@/components/articles/ArticleRow`).

Run: `pnpm test && pnpm typecheck`
Expected: tudo verde (só mudança de lugar).

- [ ] **Step 2: Escrever os testes**

Crie `tests/unit/viewer.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { PUBLIC_VIEWER, queryOptionsFor } from '@/lib/viewer'

describe('queryOptionsFor', () => {
  it('reads published content as an anonymous visitor by default', () => {
    expect(queryOptionsFor(PUBLIC_VIEWER)).toEqual({ draft: false, user: null, overrideAccess: false })
  })

  it('reads drafts with the logged-in user, never overriding access', () => {
    const user = { id: 1, collection: 'users' } as never
    expect(queryOptionsFor({ draft: true, user })).toEqual({ draft: true, user, overrideAccess: false })
  })
})
```

Crie `tests/int/guild-pages.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { getGuildPage, listGuilds, listGuildSlugs } from '@/lib/queries/guilds'
import type { Viewer } from '@/lib/viewer'

import { createBaseFixture, createGame, createGuild, getTestPayload, resetDatabase } from '../helpers/fixtures'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  await resetDatabase(payload)
})

const saveDraft = (guildId: number, shortDescription: string, user: Viewer['user']) =>
  payload.update({
    collection: 'guilds',
    id: guildId,
    data: { shortDescription },
    draft: true,
    user,
    overrideAccess: false,
  })

describe('guild pages', () => {
  it('lists every published guild in alphabetical order', async () => {
    await createBaseFixture(payload)
    await createGuild(payload, 'Rascunho', { _status: 'draft' })

    expect((await listGuilds(payload)).map((guild) => guild.name)).toEqual(['Aurora', 'Bigorna'])
    expect((await listGuildSlugs(payload)).sort()).toEqual(['aurora', 'bigorna'])
  })

  it('builds the guild page with links, members and published games', async () => {
    const { guildA } = await createBaseFixture(payload)
    await payload.update({
      collection: 'guilds',
      id: guildA.id,
      data: {
        links: [{ platform: 'itch', url: 'https://aurora.itch.io' }],
        members: 'Ana\nBruno',
        _status: 'published',
      },
      overrideAccess: true,
    })
    await createGame(payload, guildA.id)
    await createGame(payload, guildA.id, { title: 'Protótipo secreto', _status: 'draft' })

    const page = await getGuildPage(payload, 'aurora')

    expect(page?.links).toEqual([{ label: 'itch.io', url: 'https://aurora.itch.io' }])
    expect(page?.members).toEqual(['Ana', 'Bruno'])
    expect(page?.games.map((game) => game.title)).toEqual(['Ecos de Ferro'])
  })

  it('returns null for unknown or never-published guilds', async () => {
    await createGuild(payload, 'Rascunho', { _status: 'draft' })

    expect(await getGuildPage(payload, 'nao-existe')).toBeNull()
    expect(await getGuildPage(payload, 'rascunho')).toBeNull()
  })

  it('shows the pending draft to an editor of the guild previewing it', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    await saveDraft(guildA.id, 'Rascunho novo', editorA)

    const preview = await getGuildPage(payload, 'aurora', { draft: true, user: editorA })
    const publicPage = await getGuildPage(payload, 'aurora')

    expect(preview?.shortDescription).toBe('Rascunho novo')
    expect(publicPage?.shortDescription).toBe('Guilda Aurora')
  })

  it('never shows another guild draft, even in preview mode', async () => {
    const { editorA, editorB, guildB } = await createBaseFixture(payload)
    await saveDraft(guildB.id, 'Segredo da Bigorna', editorB)

    const page = await getGuildPage(payload, 'bigorna', { draft: true, user: editorA })

    expect(page?.shortDescription).toBe('Guilda Bigorna')
  })

  it('never shows drafts to a preview cookie without a user', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    await saveDraft(guildA.id, 'Rascunho novo', editorA)

    const page = await getGuildPage(payload, 'aurora', { draft: true, user: null })

    expect(page?.shortDescription).toBe('Guilda Aurora')
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm test tests/unit/viewer.spec.ts tests/int/guild-pages.spec.ts`
Expected: FAIL (`@/lib/viewer` e `@/lib/queries/guilds` não existem).

- [ ] **Step 4: Implementar**

Crie `src/lib/viewer.ts`:

```ts
import type { TypedUser } from 'payload'

export type Viewer = { draft: boolean; user: TypedUser | null }

export const PUBLIC_VIEWER: Viewer = { draft: false, user: null }

export const queryOptionsFor = ({ draft, user }: Viewer) => ({ draft, user, overrideAccess: false as const })
```

Crie `src/lib/queries/viewer.ts`:

```ts
import { draftMode, headers } from 'next/headers'
import type { Payload } from 'payload'

import { PUBLIC_VIEWER, type Viewer } from '@/lib/viewer'

// The draft cookie alone is not enough: drafts are read as the panel user, so access rules still apply.
export const resolveViewer = async (payload: Payload): Promise<Viewer> => {
  const { isEnabled } = await draftMode()
  if (!isEnabled) return PUBLIC_VIEWER
  const { user } = await payload.auth({ headers: await headers() })
  return user ? { draft: true, user } : PUBLIC_VIEWER
}
```

Crie `src/lib/queries/counts.ts` (movendo a lógica que está em `landing.ts`):

```ts
import type { Payload } from 'payload'

export const countPublishedGamesByGuild = async (payload: Payload): Promise<Map<number, number>> => {
  const { docs } = await payload.find({
    collection: 'games',
    overrideAccess: false,
    pagination: false,
    depth: 0,
    select: { guild: true },
  })
  const counts = new Map<number, number>()
  for (const { guild } of docs) {
    const guildId = typeof guild === 'object' ? guild.id : guild
    counts.set(guildId, (counts.get(guildId) ?? 0) + 1)
  }
  return counts
}
```

Em `src/lib/queries/landing.ts`, remova `countGamesByGuild` e a quarta consulta; use:

```ts
  const [guilds, featuredGames, articles, gamesByGuild] = await Promise.all([
    payload.find({ collection: 'guilds', ...asVisitor, sort: 'name', limit: FEATURED_GUILDS, depth: 1 }),
    payload.find({ collection: 'games', ...asVisitor, sort: '-publishedAt', limit: FEATURED_GAMES, depth: 1 }),
    payload.find({ collection: 'articles', ...asVisitor, sort: '-date', limit: RECENT_ARTICLES, depth: 0 }),
    countPublishedGamesByGuild(payload),
  ])
  const publishedGames = [...gamesByGuild.values()].reduce((total, count) => total + count, 0)
```

e `stats.games: publishedGames`.

Em `src/lib/presenters.ts`, acrescente (e importe `RichTextData`, `ExternalLinkView` de `./views`):

```ts
export type GuildPageView = {
  id: number
  name: string
  slug: string
  href: string
  shortDescription: string
  description: RichTextData | null
  initials: string
  logo: MediaView | null
  cover: MediaView | null
  links: ExternalLinkView[]
  members: string[]
  games: GameCardView[]
}

type GuildLinkPlatform = NonNullable<Guild['links']>[number]['platform']

const GUILD_LINK_LABELS: Record<GuildLinkPlatform, string> = {
  instagram: 'Instagram',
  itch: 'itch.io',
  linkedin: 'LinkedIn',
  website: 'Site',
  other: 'Link',
}

const toLines = (text: string | null | undefined): string[] =>
  (text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

// Payload's generated rich text type is the same serialized Lexical state the renderer expects.
const toRichText = (value: unknown): RichTextData | null => (value ? (value as RichTextData) : null)

export const toGuildPage = (guild: Guild, games: GameCardView[]): GuildPageView => {
  const card = toGuildCard(guild, games.length)
  return {
    id: guild.id,
    name: guild.name,
    slug: guild.slug,
    href: card.href,
    shortDescription: guild.shortDescription,
    description: toRichText(guild.description),
    initials: card.initials,
    logo: card.logo,
    cover: toMediaView(guild.cover),
    links: (guild.links ?? [])
      .filter((link) => link.url)
      .map((link) => ({ label: GUILD_LINK_LABELS[link.platform], url: link.url as string })),
    members: toLines(guild.members),
    games,
  }
}
```

e troque `countLines` por `toLines(...).length` em `toGuildCard` (uma função a menos).

Crie `src/lib/queries/guilds.ts`:

```ts
import type { Payload } from 'payload'

import { type GuildCardView, type GuildPageView, toGameCard, toGuildCard, toGuildPage } from '@/lib/presenters'
import { PUBLIC_VIEWER, queryOptionsFor, type Viewer } from '@/lib/viewer'

import { countPublishedGamesByGuild } from './counts'

const findGuildBySlug = async (payload: Payload, slug: string, viewer: Viewer) => {
  const { docs } = await payload.find({
    collection: 'guilds',
    ...queryOptionsFor(viewer),
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return docs[0] ?? null
}

export const listGuilds = async (payload: Payload): Promise<GuildCardView[]> => {
  const [guilds, gamesByGuild] = await Promise.all([
    payload.find({ collection: 'guilds', overrideAccess: false, sort: 'name', pagination: false, depth: 1 }),
    countPublishedGamesByGuild(payload),
  ])
  return guilds.docs.map((guild) => toGuildCard(guild, gamesByGuild.get(guild.id) ?? 0))
}

export const getGuildPage = async (
  payload: Payload,
  slug: string,
  viewer: Viewer = PUBLIC_VIEWER,
): Promise<GuildPageView | null> => {
  const guild =
    (await findGuildBySlug(payload, slug, viewer)) ??
    (viewer.draft ? await findGuildBySlug(payload, slug, PUBLIC_VIEWER) : null)
  if (!guild) return null

  const games = await payload.find({
    collection: 'games',
    overrideAccess: false,
    where: { guild: { equals: guild.id } },
    sort: '-publishedAt',
    pagination: false,
    depth: 1,
  })
  return toGuildPage(guild, games.docs.map(toGameCard))
}

export const listGuildSlugs = async (payload: Payload): Promise<string[]> => {
  const { docs } = await payload.find({
    collection: 'guilds',
    overrideAccess: false,
    pagination: false,
    depth: 0,
    select: { slug: true },
  })
  return docs.map((guild) => guild.slug)
}
```

Crie `src/components/guilds/GuildGrid.tsx`:

```tsx
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'
import type { GuildCardView } from '@/lib/presenters'
import { cx } from '@/utilities/cx'

import { GuildCard } from './GuildCard'

type GuildGridProps = { guilds: GuildCardView[]; mobileLimit?: number }

export function GuildGrid({ guilds, mobileLimit }: GuildGridProps) {
  return (
    <RevealGroup as="ul" className="grid gap-md md:grid-cols-2 md:gap-lg lg:grid-cols-4">
      {guilds.map((guild, index) => (
        <RevealItem
          as="li"
          key={guild.id}
          className={cx(mobileLimit !== undefined && index >= mobileLimit && 'max-md:hidden')}
        >
          <GuildCard guild={guild} />
        </RevealItem>
      ))}
    </RevealGroup>
  )
}
```

Crie `src/components/games/GameGrid.tsx`:

```tsx
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'
import type { GameCardView } from '@/lib/presenters'

import { GameCard } from './GameCard'

const LAYOUT = {
  grid: { list: 'grid gap-md md:grid-cols-2 md:gap-lg lg:grid-cols-3', item: '' },
  carousel: {
    list: '-mx-margin-mobile flex snap-x snap-mandatory gap-md overflow-x-auto px-margin-mobile pb-md md:mx-0 md:grid md:grid-cols-3 md:gap-lg md:overflow-visible md:px-0 md:pb-0',
    item: 'w-[85%] shrink-0 snap-start md:w-auto',
  },
} as const

type GameGridProps = { games: GameCardView[]; layout?: keyof typeof LAYOUT }

export function GameGrid({ games, layout = 'grid' }: GameGridProps) {
  return (
    <RevealGroup as="ul" className={LAYOUT[layout].list}>
      {games.map((game) => (
        <RevealItem as="li" key={game.id} className={LAYOUT[layout].item}>
          <GameCard game={game} />
        </RevealItem>
      ))}
    </RevealGroup>
  )
}
```

Refatore a landing para usar as grades: em `GuildsSection`, troque o `RevealGroup` por `<GuildGrid guilds={guilds} mobileLimit={GUILDS_ON_MOBILE} />`; em `FeaturedGamesSection`, por `<GameGrid games={games} layout="carousel" />`.

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: tudo verde (incluindo os testes da landing, que não mudam).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: load guild pages with draft-aware viewers and share card grids"
```

---

### Task 4: Dados de jogos e artigos

**Files:**
- Create: `src/lib/queries/games.ts`, `src/lib/queries/articles.ts`
- Modify: `src/lib/presenters.ts`
- Test: `tests/int/game-pages.spec.ts`

**Interfaces:**
- Consumes: `queryOptionsFor`, `PUBLIC_VIEWER` (Task 3), `getYouTubeVideoId` (Plano 1), `formatMonthYear` (Task 2).
- Produces:
  - `type GamePageView = GameCardView & { slug: string; guild: { name: string; href: string } | null; trailerVideoId: string | null; description: RichTextData | null; gallery: MediaView[]; playUrl: string | null; credits: string | null; releaseDate: string | null }` e `toGamePage(game)`
  - `listGames(payload)` (publicados, mais recentes primeiro), `getGamePage(payload, slug, viewer?)`, `listGameSlugs(payload)`
  - `listArticles(payload)` (todos, por data desc)

- [ ] **Step 1: Escrever os testes**

Crie `tests/int/game-pages.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { listArticles } from '@/lib/queries/articles'
import { getGamePage, listGames, listGameSlugs } from '@/lib/queries/games'

import {
  createArticle,
  createBaseFixture,
  createGame,
  getTestPayload,
  resetDatabase,
} from '../helpers/fixtures'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  await resetDatabase(payload)
})

describe('game pages', () => {
  it('lists published games, newest first', async () => {
    const { guildA } = await createBaseFixture(payload)
    await createGame(payload, guildA.id, { title: 'Primeiro' })
    await createGame(payload, guildA.id, { title: 'Segundo' })
    await createGame(payload, guildA.id, { title: 'Rascunho', _status: 'draft' })

    expect((await listGames(payload)).map((game) => game.title)).toEqual(['Segundo', 'Primeiro'])
    expect((await listGameSlugs(payload)).sort()).toEqual(['primeiro', 'segundo'])
  })

  it('builds the game page with guild link, trailer id, date and credits', async () => {
    const { guildA } = await createBaseFixture(payload)
    await createGame(payload, guildA.id, {
      trailerUrl: 'https://youtu.be/dQw4w9WgXcQ',
      playUrl: 'https://aurora.itch.io/ecos',
      credits: 'Ana — arte',
      releaseDate: '2026-09-01T00:00:00.000Z',
    })

    const page = await getGamePage(payload, 'ecos-de-ferro')

    expect(page?.guild).toEqual({ name: 'Aurora', href: '/guildas/aurora' })
    expect(page?.trailerVideoId).toBe('dQw4w9WgXcQ')
    expect(page?.playUrl).toBe('https://aurora.itch.io/ecos')
    expect(page?.releaseDate).toBe('setembro de 2026')
    expect(page?.credits).toBe('Ana — arte')
    expect(page?.gallery).toEqual([])
    expect(page?.description).toBeNull()
  })

  it('returns null for unknown or never-published games', async () => {
    const { guildA } = await createBaseFixture(payload)
    await createGame(payload, guildA.id, { title: 'Rascunho', _status: 'draft' })

    expect(await getGamePage(payload, 'rascunho')).toBeNull()
    expect(await getGamePage(payload, 'nao-existe')).toBeNull()
  })

  it('shows a brand-new game draft to its guild editor in preview mode only', async () => {
    const { editorA, editorB, guildA } = await createBaseFixture(payload)
    await payload.create({
      collection: 'games',
      data: { title: 'Maré Baixa', synopsis: 'Puzzle cooperativo.', guild: guildA.id },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })

    expect((await getGamePage(payload, 'mare-baixa', { draft: true, user: editorA }))?.title).toBe('Maré Baixa')
    expect(await getGamePage(payload, 'mare-baixa', { draft: true, user: editorB })).toBeNull()
    expect(await getGamePage(payload, 'mare-baixa')).toBeNull()
  })

  it('lists every article, newest first', async () => {
    await createArticle(payload, { title: 'Antigo', date: '2024-01-01T00:00:00.000Z' })
    await createArticle(payload, { title: 'Novo', date: '2026-06-01T00:00:00.000Z' })

    expect((await listArticles(payload)).map((article) => article.title)).toEqual(['Novo', 'Antigo'])
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test tests/int/game-pages.spec.ts`
Expected: FAIL (`@/lib/queries/games` não existe).

- [ ] **Step 3: Implementar**

Em `src/lib/presenters.ts`, acrescente (importando `getYouTubeVideoId` de `@/utilities/url` e `formatMonthYear` de `@/utilities/date`):

```ts
export type GamePageView = GameCardView & {
  slug: string
  guild: { name: string; href: string } | null
  trailerVideoId: string | null
  description: RichTextData | null
  gallery: MediaView[]
  playUrl: string | null
  credits: string | null
  releaseDate: string | null
}

export const toGamePage = (game: Game): GamePageView => ({
  ...toGameCard(game),
  slug: game.slug,
  guild: typeof game.guild === 'object' ? { name: game.guild.name, href: `/guildas/${game.guild.slug}` } : null,
  trailerVideoId: game.trailerUrl ? getYouTubeVideoId(game.trailerUrl) : null,
  description: toRichText(game.description),
  gallery: (game.gallery ?? []).map(toMediaView).filter((image): image is MediaView => image !== null),
  playUrl: game.playUrl || null,
  credits: game.credits?.trim() || null,
  releaseDate: game.releaseDate ? formatMonthYear(game.releaseDate) : null,
})
```

Crie `src/lib/queries/games.ts`:

```ts
import type { Payload } from 'payload'

import { type GameCardView, type GamePageView, toGameCard, toGamePage } from '@/lib/presenters'
import { PUBLIC_VIEWER, queryOptionsFor, type Viewer } from '@/lib/viewer'

const findGameBySlug = async (payload: Payload, slug: string, viewer: Viewer) => {
  const { docs } = await payload.find({
    collection: 'games',
    ...queryOptionsFor(viewer),
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return docs[0] ?? null
}

export const listGames = async (payload: Payload): Promise<GameCardView[]> => {
  const { docs } = await payload.find({
    collection: 'games',
    overrideAccess: false,
    sort: '-publishedAt',
    pagination: false,
    depth: 1,
  })
  return docs.map(toGameCard)
}

export const getGamePage = async (
  payload: Payload,
  slug: string,
  viewer: Viewer = PUBLIC_VIEWER,
): Promise<GamePageView | null> => {
  const game =
    (await findGameBySlug(payload, slug, viewer)) ??
    (viewer.draft ? await findGameBySlug(payload, slug, PUBLIC_VIEWER) : null)
  return game ? toGamePage(game) : null
}

export const listGameSlugs = async (payload: Payload): Promise<string[]> => {
  const { docs } = await payload.find({
    collection: 'games',
    overrideAccess: false,
    pagination: false,
    depth: 0,
    select: { slug: true },
  })
  return docs.map((game) => game.slug)
}
```

Crie `src/lib/queries/articles.ts`:

```ts
import type { Payload } from 'payload'

import { type ArticleRowView, toArticleRow } from '@/lib/presenters'

export const listArticles = async (payload: Payload): Promise<ArticleRowView[]> => {
  const { docs } = await payload.find({
    collection: 'articles',
    overrideAccess: false,
    sort: '-date',
    pagination: false,
    depth: 0,
  })
  return docs.map(toArticleRow)
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm test tests/int/game-pages.spec.ts && pnpm typecheck`
Expected: PASS e typecheck limpo.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: load game and article pages"
```

---

### Task 5: Páginas de guildas

**Files:**
- Create: `src/components/guilds/GuildsIndex.tsx`, `src/components/guilds/GuildProfile.tsx`, `src/components/preview/PreviewBanner.tsx`, `src/components/preview/LivePreviewListener.tsx`, `src/components/preview/PreviewTools.tsx`, `src/app/(frontend)/guildas/page.tsx`, `src/app/(frontend)/guildas/[slug]/page.tsx`, `src/app/(frontend)/not-found.tsx`
- Modify: `package.json` (`@payloadcms/live-preview-react`)
- Test: `tests/components/guild-pages.spec.tsx`

**Interfaces:**
- Consumes: `listGuilds`, `getGuildPage`, `listGuildSlugs`, `resolveViewer` (Task 3); primitivos da Task 2; `GuildGrid`, `GameGrid`.
- Produces:
  - `GuildsIndex({ guilds })`, `GuildProfile({ guild })`
  - `PreviewTools()`: faixa de pré-visualização + ouvinte do live preview (só renderizado quando `viewer.draft`).
  - Rotas `/guildas` e `/guildas/[slug]` (`revalidate = 60`, `generateStaticParams`, `generateMetadata`), e a página 404 do site.

- [ ] **Step 1: Dependência**

```bash
pnpm add @payloadcms/live-preview-react@3.90.2
```

- [ ] **Step 2: Escrever os testes**

Crie `tests/components/guild-pages.spec.tsx`:

```tsx
// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GuildProfile } from '@/components/guilds/GuildProfile'
import { GuildsIndex } from '@/components/guilds/GuildsIndex'
import { PreviewBanner } from '@/components/preview/PreviewBanner'
import type { GuildPageView } from '@/lib/presenters'

const guild: GuildPageView = {
  id: 1,
  name: 'Aurora',
  slug: 'aurora',
  href: '/guildas/aurora',
  shortDescription: 'Narrativa e jogos de exploração.',
  description: null,
  initials: 'Au',
  logo: null,
  cover: null,
  links: [{ label: 'itch.io', url: 'https://aurora.itch.io' }],
  members: ['Ana', 'Bruno'],
  games: [
    {
      id: 1,
      title: 'Ecos de Ferro',
      href: '/jogos/ecos-de-ferro',
      synopsis: 'Um metroidvania.',
      status: 'released',
      guildName: 'Aurora',
      platforms: ['PC'],
      cover: null,
    },
  ],
}

describe('GuildsIndex', () => {
  it('titles the page and links every guild', () => {
    render(<GuildsIndex guilds={[{ id: 1, name: 'Aurora', href: '/guildas/aurora', focus: 'x', initials: 'Au', logo: null, meta: '1 jogo' }]} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Todas as guildas.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Aurora' })).toHaveAttribute('href', '/guildas/aurora')
  })

  it('shows an empty state when no guild is published', () => {
    render(<GuildsIndex guilds={[]} />)
    expect(screen.getByText('As guildas aparecem aqui assim que forem publicadas.')).toBeInTheDocument()
  })
})

describe('GuildProfile', () => {
  it('shows the guild identity, links, games and members', () => {
    render(<GuildProfile guild={guild} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Aurora' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Todas as guildas' })).toHaveAttribute('href', '/guildas')
    expect(screen.getByRole('link', { name: 'itch.io (abre em nova aba)' })).toHaveAttribute('href', 'https://aurora.itch.io')
    expect(screen.getByRole('link', { name: 'Ecos de Ferro' })).toHaveAttribute('href', '/jogos/ecos-de-ferro')
    expect(screen.getByRole('list', { name: 'Membros' })).toHaveTextContent('AnaBruno')
  })

  it('leaves out the sections the guild has not filled in', () => {
    render(<GuildProfile guild={{ ...guild, links: [], members: [], games: [], description: null }} />)

    expect(screen.queryByRole('heading', { name: 'Sobre' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Membros' })).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Links da guilda' })).not.toBeInTheDocument()
    expect(screen.getByText('Esta guilda ainda não publicou jogos.')).toBeInTheDocument()
  })
})

describe('PreviewBanner', () => {
  it('explains the preview and offers a way out that does not prefetch', () => {
    render(<PreviewBanner />)

    expect(screen.getByText('Pré-visualização do rascunho')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sair da pré-visualização' })).toHaveAttribute('href', '/preview/exit')
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm test tests/components/guild-pages.spec.tsx`
Expected: FAIL.

- [ ] **Step 4: Componentes**

Crie `src/components/guilds/GuildsIndex.tsx`:

```tsx
import { EmptyState } from '@/components/landing/EmptyState'
import { Container } from '@/components/ui/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import { landingCopy } from '@/content/landing'
import type { GuildCardView } from '@/lib/presenters'

import { GuildGrid } from './GuildGrid'

export function GuildsIndex({ guilds }: { guilds: GuildCardView[] }) {
  return (
    <>
      <PageHeader
        eyebrow="Guildas"
        title={'Todas as\nguildas.'}
        description="Cada guilda é um time de alunos com foco próprio. Escolha uma para ver os jogos e a pesquisa que ela produz."
      />
      <Container className="pb-section-mobile md:pb-section">
        {guilds.length === 0 ? <EmptyState>{landingCopy.guilds.empty}</EmptyState> : <GuildGrid guilds={guilds} />}
      </Container>
    </>
  )
}
```

Crie `src/components/guilds/GuildProfile.tsx`:

```tsx
import { EmptyState } from '@/components/landing/EmptyState'
import { GameGrid } from '@/components/games/GameGrid'
import { RichTextContent } from '@/components/content/RichTextContent'
import { Reveal } from '@/components/motion/Reveal'
import { ArrowLink } from '@/components/ui/ArrowLink'
import { BackLink } from '@/components/ui/BackLink'
import { Container } from '@/components/ui/Container'
import { Cover } from '@/components/ui/Cover'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { GuildAvatar } from '@/components/ui/GuildAvatar'
import { Section } from '@/components/ui/Section'
import { SectionTitle } from '@/components/ui/SectionTitle'
import type { GuildPageView } from '@/lib/presenters'

export function GuildProfile({ guild }: { guild: GuildPageView }) {
  return (
    <article>
      <Container className="flex flex-col gap-lg pt-xl">
        <BackLink href="/guildas">Todas as guildas</BackLink>
        <Cover image={guild.cover} ratio="banner" sizes="(min-width: 1248px) 1200px, 100vw" priority />
      </Container>

      <Container className="flex flex-col gap-xl py-2xl md:flex-row md:items-end md:justify-between">
        <Reveal className="flex items-start gap-lg">
          <GuildAvatar initials={guild.initials} logo={guild.logo} />
          <div className="flex min-w-0 flex-col gap-sm">
            <Eyebrow>Guilda</Eyebrow>
            <h1 className="type-headline-lg-mobile break-words md:type-headline-lg">{guild.name}</h1>
            <p className="type-body-lg max-w-measure text-on-surface-variant">{guild.shortDescription}</p>
          </div>
        </Reveal>
        {guild.links.length > 0 && (
          <ul aria-label="Links da guilda" className="flex flex-wrap gap-lg md:justify-end">
            {guild.links.map((link) => (
              <li key={link.url}>
                <ArrowLink href={link.url} external>
                  {link.label}
                </ArrowLink>
              </li>
            ))}
          </ul>
        )}
      </Container>

      {guild.description && (
        <Section id="sobre" labelledBy="sobre-title">
          <SectionTitle id="sobre-title">Sobre</SectionTitle>
          <RichTextContent data={guild.description} />
        </Section>
      )}

      <Section id="jogos" labelledBy="jogos-title">
        <SectionTitle id="jogos-title">Jogos</SectionTitle>
        {guild.games.length === 0 ? (
          <EmptyState>Esta guilda ainda não publicou jogos.</EmptyState>
        ) : (
          <GameGrid games={guild.games} />
        )}
      </Section>

      {guild.members.length > 0 && (
        <Section id="membros" labelledBy="membros-title">
          <SectionTitle id="membros-title">Membros</SectionTitle>
          <ul aria-label="Membros" className="grid gap-sm sm:grid-cols-2 lg:grid-cols-4">
            {guild.members.map((member) => (
              <li key={member} className="type-body-md text-on-surface-variant">
                {member}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </article>
  )
}
```

Crie `src/components/preview/PreviewBanner.tsx`:

```tsx
import { Container } from '@/components/ui/Container'

export function PreviewBanner() {
  return (
    <div role="status" className="fixed inset-x-0 bottom-0 z-50 border-t border-primary bg-surface-raised">
      <Container className="flex items-center justify-between gap-md py-sm">
        <p className="type-label-mono text-primary-text">Pré-visualização do rascunho</p>
        {/* A plain anchor: prefetching the exit route would switch draft mode off by itself. */}
        <a href="/preview/exit" className="type-button text-on-surface">
          Sair da pré-visualização
        </a>
      </Container>
    </div>
  )
}
```

Crie `src/components/preview/LivePreviewListener.tsx`:

```tsx
'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import { useSyncExternalStore } from 'react'

const noSubscription = () => () => {}

export function LivePreviewListener() {
  const router = useRouter()
  // The panel and the site share the origin; it is only known in the browser.
  const origin = useSyncExternalStore(noSubscription, () => window.location.origin, () => '')
  if (!origin) return null
  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={origin} />
}
```

Crie `src/components/preview/PreviewTools.tsx`:

```tsx
import { LivePreviewListener } from './LivePreviewListener'
import { PreviewBanner } from './PreviewBanner'

export function PreviewTools() {
  return (
    <>
      <PreviewBanner />
      <LivePreviewListener />
    </>
  )
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm test tests/components/guild-pages.spec.tsx`
Expected: PASS.

- [ ] **Step 6: Rotas**

Crie `src/app/(frontend)/guildas/page.tsx`:

```tsx
import config from '@payload-config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

import { GuildsIndex } from '@/components/guilds/GuildsIndex'
import { listGuilds } from '@/lib/queries/guilds'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Guildas',
  description: 'Os times de alunos que formam a Forja.',
}

export default async function GuildsPage() {
  const payload = await getPayload({ config })
  return <GuildsIndex guilds={await listGuilds(payload)} />
}
```

Crie `src/app/(frontend)/guildas/[slug]/page.tsx`:

```tsx
import config from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { GuildProfile } from '@/components/guilds/GuildProfile'
import { PreviewTools } from '@/components/preview/PreviewTools'
import { getGuildPage, listGuildSlugs } from '@/lib/queries/guilds'
import { resolveViewer } from '@/lib/queries/viewer'

type GuildPageProps = { params: Promise<{ slug: string }> }

export const revalidate = 60

export async function generateStaticParams() {
  const payload = await getPayload({ config })
  return (await listGuildSlugs(payload)).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: GuildPageProps): Promise<Metadata> {
  const payload = await getPayload({ config })
  const guild = await getGuildPage(payload, (await params).slug)
  return guild ? { title: guild.name, description: guild.shortDescription } : {}
}

export default async function GuildPage({ params }: GuildPageProps) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const viewer = await resolveViewer(payload)
  const guild = await getGuildPage(payload, slug, viewer)
  if (!guild) notFound()

  return (
    <>
      {viewer.draft && <PreviewTools />}
      <GuildProfile guild={guild} />
    </>
  )
}
```

Crie `src/app/(frontend)/not-found.tsx`:

```tsx
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Container } from '@/components/ui/Container'
import { PageHeader } from '@/components/ui/PageHeader'

export default function NotFound() {
  return (
    <>
      <PageHeader eyebrow="404" title={'Página não\nencontrada.'} description="O endereço pode ter mudado ou o conteúdo ainda não foi publicado." />
      <Container className="pb-section-mobile md:pb-section">
        <ButtonLink href="/">Voltar ao início</ButtonLink>
      </Container>
    </>
  )
}
```

- [ ] **Step 7: Build**

```bash
pnpm db:up
pnpm test && pnpm typecheck && pnpm lint && pnpm build
```

Expected: tudo verde. O build lista `/guildas` (`○`) e `/guildas/[slug]` (`●`, com os slugs do banco local).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add the guild index and guild pages"
```

---

### Task 6: Páginas de jogos e de artigos

**Files:**
- Create: `src/components/games/GamesIndex.tsx`, `src/components/games/GameDetail.tsx`, `src/components/articles/ArticlesIndex.tsx`, `src/app/(frontend)/jogos/page.tsx`, `src/app/(frontend)/jogos/[slug]/page.tsx`, `src/app/(frontend)/artigos/page.tsx`
- Modify: `src/components/ui/ButtonLink.tsx` (`newTab`), `src/components/articles/ArticleRow.tsx` (`headingLevel`)
- Test: `tests/components/game-pages.spec.tsx`, `tests/components/ui.spec.tsx`

**Interfaces:**
- Consumes: `listGames`, `getGamePage`, `listGameSlugs`, `listArticles` (Task 4); `resolveViewer`, `PreviewTools` (Tasks 3 e 5).
- Produces: `GamesIndex({ games })`, `GameDetail({ game })`, `ArticlesIndex({ articles })`; rotas `/jogos`, `/jogos/[slug]`, `/artigos`.

- [ ] **Step 1: Escrever os testes**

Crie `tests/components/game-pages.spec.tsx`:

```tsx
// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ArticlesIndex } from '@/components/articles/ArticlesIndex'
import { GameDetail } from '@/components/games/GameDetail'
import { GamesIndex } from '@/components/games/GamesIndex'
import type { GamePageView } from '@/lib/presenters'

const game: GamePageView = {
  id: 1,
  title: 'Ecos de Ferro',
  slug: 'ecos-de-ferro',
  href: '/jogos/ecos-de-ferro',
  synopsis: 'Um metroidvania.',
  status: 'released',
  guildName: 'Aurora',
  platforms: ['PC', 'Web'],
  cover: null,
  guild: { name: 'Aurora', href: '/guildas/aurora' },
  trailerVideoId: 'dQw4w9WgXcQ',
  description: null,
  gallery: [{ url: '/api/media/file/a.png', alt: 'Tela 1' }],
  playUrl: 'https://aurora.itch.io/ecos',
  credits: 'Ana — arte\nBruno — código',
  releaseDate: 'setembro de 2026',
}

describe('GamesIndex', () => {
  it('titles the page and links every game', () => {
    render(<GamesIndex games={[game]} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Feito nas guildas.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ecos de Ferro' })).toHaveAttribute('href', '/jogos/ecos-de-ferro')
  })
})

describe('GameDetail', () => {
  it('shows the game with its guild, play link, trailer, gallery and credits', () => {
    render(<GameDetail game={game} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Ecos de Ferro' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Todos os jogos' })).toHaveAttribute('href', '/jogos')
    expect(screen.getByRole('link', { name: 'Aurora' })).toHaveAttribute('href', '/guildas/aurora')
    expect(screen.getByRole('link', { name: 'Jogar (abre em nova aba)' })).toHaveAttribute('href', 'https://aurora.itch.io/ecos')
    expect(screen.getByTitle('Trailer de Ecos de Ferro')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Tela 1' })).toBeInTheDocument()
    expect(screen.getByText(/Bruno — código/)).toBeInTheDocument()
    expect(screen.getByText('setembro de 2026')).toBeInTheDocument()
  })

  it('leaves out the sections the game does not have', () => {
    render(
      <GameDetail
        game={{ ...game, trailerVideoId: null, gallery: [], credits: null, playUrl: null, releaseDate: null, description: null }}
      />,
    )

    for (const title of ['Trailer', 'Sobre o jogo', 'Galeria', 'Créditos']) {
      expect(screen.queryByRole('heading', { name: title })).not.toBeInTheDocument()
    }
    expect(screen.queryByRole('link', { name: /Jogar/ })).not.toBeInTheDocument()
  })
})

describe('ArticlesIndex', () => {
  it('lists the articles, or explains that there are none yet', () => {
    const { rerender } = render(
      <ArticlesIndex
        articles={[{ id: 1, title: 'Masmorras', url: 'https://doi.org/1', venue: 'SBGames', authors: 'Ana', date: '2026-01-01' }]}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Artigos das guildas.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Masmorras (abre em nova aba)' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Masmorras (abre em nova aba)' })).toBeInTheDocument()

    rerender(<ArticlesIndex articles={[]} />)
    expect(screen.getByText('Os artigos das guildas aparecem aqui quando forem publicados.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test tests/components/game-pages.spec.tsx`
Expected: FAIL.

- [ ] **Step 3: Componentes**

Crie `src/components/games/GamesIndex.tsx`:

```tsx
import { EmptyState } from '@/components/landing/EmptyState'
import { Container } from '@/components/ui/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import { landingCopy } from '@/content/landing'
import type { GameCardView } from '@/lib/presenters'

import { GameGrid } from './GameGrid'

export function GamesIndex({ games }: { games: GameCardView[] }) {
  return (
    <>
      <PageHeader
        eyebrow="Jogos"
        title={'Feito nas\nguildas.'}
        description="Protótipos, jogos em desenvolvimento e lançamentos das guildas da Forja."
      />
      <Container className="pb-section-mobile md:pb-section">
        {games.length === 0 ? <EmptyState>{landingCopy.games.empty}</EmptyState> : <GameGrid games={games} />}
      </Container>
    </>
  )
}
```

Crie `src/components/games/GameDetail.tsx`:

```tsx
import Link from 'next/link'

import { RichTextContent } from '@/components/content/RichTextContent'
import { Reveal } from '@/components/motion/Reveal'
import { BackLink } from '@/components/ui/BackLink'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { ChipList } from '@/components/ui/ChipList'
import { Container } from '@/components/ui/Container'
import { Cover } from '@/components/ui/Cover'
import { Gallery } from '@/components/ui/Gallery'
import { Section } from '@/components/ui/Section'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { YouTubeEmbed } from '@/components/ui/YouTubeEmbed'
import type { GamePageView } from '@/lib/presenters'

export function GameDetail({ game }: { game: GamePageView }) {
  return (
    <article>
      <Container className="pt-xl">
        <BackLink href="/jogos">Todos os jogos</BackLink>
      </Container>

      <Container className="grid gap-2xl py-2xl lg:grid-cols-2 lg:items-center">
        <Reveal className="flex min-w-0 flex-col gap-lg">
          <StatusBadge status={game.status} />
          <h1 className="type-headline-lg-mobile break-words md:type-headline-lg">{game.title}</h1>
          {game.guild && (
            <Link href={game.guild.href} className="type-label-mono w-fit text-on-surface-variant underline underline-offset-4 hover:text-on-surface">
              {game.guild.name}
            </Link>
          )}
          <p className="type-body-lg max-w-measure break-words text-on-surface-variant">{game.synopsis}</p>
          <div className="flex flex-col gap-md md:flex-row md:items-center">
            {game.playUrl && (
              <ButtonLink href={game.playUrl} newTab arrow className="max-md:w-full">
                Jogar
                <span className="sr-only"> (abre em nova aba)</span>
              </ButtonLink>
            )}
            {game.platforms.length > 0 && <ChipList label="Plataformas" items={game.platforms} />}
          </div>
          {game.releaseDate && <p className="type-label-mono text-on-surface-muted">{game.releaseDate}</p>}
        </Reveal>
        <Cover image={game.cover} ratio="video" sizes="(min-width: 1024px) 600px, 100vw" priority />
      </Container>

      {game.trailerVideoId && (
        <Section id="trailer" labelledBy="trailer-title">
          <SectionTitle id="trailer-title">Trailer</SectionTitle>
          <YouTubeEmbed videoId={game.trailerVideoId} title={`Trailer de ${game.title}`} />
        </Section>
      )}

      {game.description && (
        <Section id="sobre" labelledBy="sobre-title">
          <SectionTitle id="sobre-title">Sobre o jogo</SectionTitle>
          <RichTextContent data={game.description} />
        </Section>
      )}

      {game.gallery.length > 0 && (
        <Section id="galeria" labelledBy="galeria-title">
          <SectionTitle id="galeria-title">Galeria</SectionTitle>
          <Gallery images={game.gallery} />
        </Section>
      )}

      {game.credits && (
        <Section id="creditos" labelledBy="creditos-title">
          <SectionTitle id="creditos-title">Créditos</SectionTitle>
          <p className="type-body-md max-w-measure whitespace-pre-line text-on-surface-variant">{game.credits}</p>
        </Section>
      )}
    </article>
  )
}
```

The "Jogar" link must open a new tab: `ButtonLink` renders a plain `<a>` for external links but without `target`. Add a `newTab?: boolean` prop to `ButtonLink` (sets `target="_blank" rel="noopener noreferrer"` on the external anchor) and pass `newTab` here. Add to `tests/components/ui.spec.tsx`:

```tsx
  it('can open an external link in a new tab', () => {
    render(
      <ButtonLink href="https://itch.io" newTab>
        Jogar
      </ButtonLink>,
    )
    const link = screen.getByRole('link', { name: 'Jogar' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
```

Crie `src/components/articles/ArticlesIndex.tsx`:

```tsx
import { EmptyState } from '@/components/landing/EmptyState'
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'
import { Container } from '@/components/ui/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import { landingCopy } from '@/content/landing'
import type { ArticleRowView } from '@/lib/presenters'

import { ArticleRow } from './ArticleRow'

export function ArticlesIndex({ articles }: { articles: ArticleRowView[] }) {
  return (
    <>
      <PageHeader
        eyebrow="Pesquisa"
        title={'Artigos das\nguildas.'}
        description="Pesquisa publicada pelas guildas em revistas e eventos. Os links levam à publicação original."
      />
      <Container className="pb-section-mobile md:pb-section">
        {articles.length === 0 ? (
          <EmptyState>{landingCopy.articles.empty}</EmptyState>
        ) : (
          <RevealGroup as="ul" className="border-t border-outline">
            {articles.map((article) => (
              <RevealItem as="li" key={article.id}>
                <ArticleRow article={article} />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </Container>
    </>
  )
}
```

Na página de artigos, o título de cada artigo vem logo abaixo do `h1`, sem um `h2` de seção no meio. Acrescente ao `ArticleRow` a prop `headingLevel?: 'h2' | 'h3'` (padrão `'h3'`, usado na landing), renderize o título com `const Heading = headingLevel` e passe `headingLevel="h2"` aqui (`<ArticleRow article={article} headingLevel="h2" />`).

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm test tests/components/game-pages.spec.tsx tests/components/ui.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Rotas**

Crie `src/app/(frontend)/jogos/page.tsx`:

```tsx
import config from '@payload-config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

import { GamesIndex } from '@/components/games/GamesIndex'
import { listGames } from '@/lib/queries/games'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Jogos',
  description: 'Jogos feitos pelas guildas da Forja.',
}

export default async function GamesPage() {
  const payload = await getPayload({ config })
  return <GamesIndex games={await listGames(payload)} />
}
```

Crie `src/app/(frontend)/jogos/[slug]/page.tsx`:

```tsx
import config from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { GameDetail } from '@/components/games/GameDetail'
import { PreviewTools } from '@/components/preview/PreviewTools'
import { getGamePage, listGameSlugs } from '@/lib/queries/games'
import { resolveViewer } from '@/lib/queries/viewer'

type GamePageProps = { params: Promise<{ slug: string }> }

export const revalidate = 60

export async function generateStaticParams() {
  const payload = await getPayload({ config })
  return (await listGameSlugs(payload)).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const payload = await getPayload({ config })
  const game = await getGamePage(payload, (await params).slug)
  return game ? { title: game.title, description: game.synopsis } : {}
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const viewer = await resolveViewer(payload)
  const game = await getGamePage(payload, slug, viewer)
  if (!game) notFound()

  return (
    <>
      {viewer.draft && <PreviewTools />}
      <GameDetail game={game} />
    </>
  )
}
```

Crie `src/app/(frontend)/artigos/page.tsx`:

```tsx
import config from '@payload-config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

import { ArticlesIndex } from '@/components/articles/ArticlesIndex'
import { listArticles } from '@/lib/queries/articles'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Artigos',
  description: 'Pesquisa publicada pelas guildas da Forja.',
}

export default async function ArticlesPage() {
  const payload = await getPayload({ config })
  return <ArticlesIndex articles={await listArticles(payload)} />
}
```

- [ ] **Step 6: Verificação e commit**

```bash
pnpm test && pnpm typecheck && pnpm lint && pnpm build
git add -A
git commit -m "feat: add the game index, game pages and the articles page"
```

Expected: build lista `/jogos`, `/jogos/[slug]` e `/artigos`.

---

### Task 7: Atualizar o site ao publicar

**Files:**
- Create: `src/hooks/revalidation.ts`
- Modify: `src/collections/Guilds.ts`, `src/collections/Games.ts`, `src/collections/Articles.ts`, `vitest.setup.ts`, `src/seed/seed.ts`
- Test: `tests/unit/revalidation.spec.ts`

**Interfaces:**
- Produces:
  - `PUBLIC_ROUTES`: as rotas públicas revalidadas.
  - `revalidatePublicSite()`, que marca todas as rotas públicas.
  - `revalidateOnPublish: CollectionAfterChangeHook`, que só age quando o documento salvo está publicado (ou a coleção não tem rascunhos).
  - `revalidateAfterDelete: CollectionAfterDeleteHook`
  - Ambos respeitam `context.disableRevalidate`.

Revalidar tudo é intencional: o site tem poucas páginas, e um nome de guilda muda cards da landing, das listas e das páginas de jogo. Um admin que despublica algo cai no fallback de 60s.

- [ ] **Step 1: Mock global de `next/cache`**

`revalidatePath` lança erro fora de uma requisição do Next. Em `vitest.setup.ts`, acrescente no final:

```ts
import { vi } from 'vitest'

// Payload hooks call revalidatePath, which only works inside a Next.js request.
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
```

(o `import` vai para o topo do arquivo).

- [ ] **Step 2: Escrever os testes**

Crie `tests/unit/revalidation.spec.ts`:

```ts
import { revalidatePath } from 'next/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PUBLIC_ROUTES, revalidateAfterDelete, revalidateOnPublish } from '@/hooks/revalidation'

type AfterChangeArgs = Parameters<typeof revalidateOnPublish>[0]
type AfterDeleteArgs = Parameters<typeof revalidateAfterDelete>[0]

const afterChange = (doc: Record<string, unknown>, context: Record<string, unknown> = {}) =>
  revalidateOnPublish({ doc, context, req: { context } } as unknown as AfterChangeArgs)

beforeEach(() => {
  vi.mocked(revalidatePath).mockClear()
})

describe('revalidateOnPublish', () => {
  it('refreshes every public route when a document is published', () => {
    afterChange({ _status: 'published' })

    expect(vi.mocked(revalidatePath).mock.calls).toEqual(PUBLIC_ROUTES.map((route) => route))
  })

  it('refreshes public routes for collections without drafts (articles)', () => {
    afterChange({ title: 'Artigo' })
    expect(revalidatePath).toHaveBeenCalledWith('/artigos')
  })

  it('leaves the cache alone for draft saves and autosaves', () => {
    afterChange({ _status: 'draft' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('can be switched off for trusted scripts such as the seed', () => {
    afterChange({ _status: 'published' }, { disableRevalidate: true })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('returns the document untouched', () => {
    const doc = { _status: 'published' }
    expect(afterChange(doc)).toBe(doc)
  })
})

describe('revalidateAfterDelete', () => {
  it('refreshes public routes when a document is deleted', () => {
    const doc = { id: 1 }
    const result = revalidateAfterDelete({ doc, context: {}, req: { context: {} } } as unknown as AfterDeleteArgs)

    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(result).toBe(doc)
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm test tests/unit/revalidation.spec.ts`
Expected: FAIL (`@/hooks/revalidation` não existe).

- [ ] **Step 4: Implementar**

Crie `src/hooks/revalidation.ts`:

```ts
import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

// The site is small and a single change (a guild name) shows up on many pages, so publish refreshes them all.
export const PUBLIC_ROUTES: Array<[path: string] | [path: string, type: 'page']> = [
  ['/'],
  ['/guildas'],
  ['/guildas/[slug]', 'page'],
  ['/jogos'],
  ['/jogos/[slug]', 'page'],
  ['/artigos'],
]

export const revalidatePublicSite = (): void => {
  for (const route of PUBLIC_ROUTES) revalidatePath(...route)
}

const isPublic = (doc: { _status?: unknown }) => doc._status === undefined || doc._status === 'published'

export const revalidateOnPublish: CollectionAfterChangeHook = ({ doc, context }) => {
  if (!context.disableRevalidate && isPublic(doc)) revalidatePublicSite()
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc, context }) => {
  if (!context.disableRevalidate) revalidatePublicSite()
  return doc
}
```

Nas coleções, acrescente os hooks (import de `@/hooks/revalidation`):
- `Guilds.ts`: `afterChange: [revalidateOnPublish]`, `afterDelete: [revalidateAfterDelete]` dentro de `hooks`.
- `Games.ts`: idem.
- `Articles.ts`: `hooks: { afterChange: [revalidateOnPublish], afterDelete: [revalidateAfterDelete] }`.

Em `src/seed/seed.ts`, o seed roda fora do Next: passe `context: { disableRevalidate: true }` em **todas** as chamadas `payload.create` e `payload.delete` (declare `const trustedScript = { overrideAccess: true, context: { disableRevalidate: true } } as const` e espalhe nas chamadas).

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: tudo verde.

- [ ] **Step 6: O seed ainda roda fora do Next**

Run: `pnpm seed`
Expected: `Seed complete. …` (sem "static generation store missing").

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: refresh the public site when content is published"
```

---

### Task 8: Live preview no painel

**Files:**
- Create: `src/lib/preview.ts`, `src/lib/queries/preview.ts`, `src/app/(frontend)/preview/route.ts`, `src/app/(frontend)/preview/exit/route.ts`
- Modify: `src/hooks/publication.ts`, `src/fields/slug.ts`, `src/collections/Guilds.ts`, `src/collections/Games.ts`
- Test: `tests/unit/preview.spec.ts`, `tests/int/preview-target.spec.ts`, `tests/int/autosave.spec.ts`

**Interfaces:**
- Consumes: `PreviewTools` (Task 5), `getGuildPage`/`getGamePage` com `viewer` (Tasks 3 e 4).
- Produces:
  - `type PreviewCollection = 'guilds' | 'games'`, `isPreviewCollection`, `publicPathFor(collection, slug)`, `previewUrlFor(collection, id)` → `/preview?collection=…&id=…` ou `null` sem id, `previewAdminOptions(collection)` → `{ livePreview, preview }` para o `admin` da coleção (`@/lib/preview`)
  - `resolvePreviewTarget(payload, user, collection, id)` → `{ path: string }` | `{ status: 400 | 401 | 404; message: string }`
  - Rotas `GET /preview` (liga o `draftMode` e redireciona) e `GET /preview/exit`.
  - Autosave ligado em guildas e jogos (`draftVersions`), com o botão "Salvar rascunho" mantido.
  - Slug vazio vira `null` (a coluna aceita vários `null` no índice único).

- [ ] **Step 1: Escrever os testes**

Crie `tests/unit/preview.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { isPreviewCollection, previewAdminOptions, previewUrlFor, publicPathFor } from '@/lib/preview'

describe('preview URLs', () => {
  it('maps each collection to its public page', () => {
    expect(publicPathFor('guilds', 'aurora')).toBe('/guildas/aurora')
    expect(publicPathFor('games', 'ecos-de-ferro')).toBe('/jogos/ecos-de-ferro')
  })

  it('opens the preview route for saved documents only', () => {
    expect(previewUrlFor('games', 7)).toBe('/preview?collection=games&id=7')
    expect(previewUrlFor('games', undefined)).toBeNull()
  })

  it('accepts only the collections that have public pages', () => {
    expect(isPreviewCollection('guilds')).toBe(true)
    expect(isPreviewCollection('users')).toBe(false)
    expect(isPreviewCollection(null)).toBe(false)
  })

  it('wires the live preview iframe and the preview button to the same URL', async () => {
    const options = previewAdminOptions('guilds')
    const livePreviewUrl = options.livePreview.url as (args: { data: Record<string, unknown> }) => string | null

    expect(livePreviewUrl({ data: { id: 3 } })).toBe('/preview?collection=guilds&id=3')
    expect(livePreviewUrl({ data: {} })).toBeNull()
    expect(options.preview({ id: 3 }, {} as never)).toBe('/preview?collection=guilds&id=3')
    expect(options.livePreview.breakpoints?.map((breakpoint) => breakpoint.width)).toEqual([390, 1440])
  })
})
```

Crie `tests/int/preview-target.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { resolvePreviewTarget } from '@/lib/queries/preview'

import { createBaseFixture, createGame, getTestPayload, resetDatabase } from '../helpers/fixtures'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  await resetDatabase(payload)
})

describe('resolvePreviewTarget', () => {
  it('sends an editor to the public page of their own draft', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    const draft = await payload.create({
      collection: 'games',
      data: { title: 'Maré Baixa', synopsis: 'Puzzle.', guild: guildA.id },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })

    expect(await resolvePreviewTarget(payload, editorA, 'games', String(draft.id))).toEqual({ path: '/jogos/mare-baixa' })
    expect(await resolvePreviewTarget(payload, editorA, 'guilds', String(guildA.id))).toEqual({ path: '/guildas/aurora' })
  })

  it('refuses anyone who is not logged in to the panel', async () => {
    const { guildA } = await createBaseFixture(payload)
    const game = await createGame(payload, guildA.id)

    expect(await resolvePreviewTarget(payload, null, 'games', String(game.id))).toMatchObject({ status: 401 })
  })

  it('hides documents of other guilds', async () => {
    const { editorB, guildA } = await createBaseFixture(payload)
    const draft = await createGame(payload, guildA.id, { title: 'Segredo', _status: 'draft' })

    expect(await resolvePreviewTarget(payload, editorB, 'games', String(draft.id))).toMatchObject({ status: 404 })
  })

  it('rejects unknown collections and missing ids', async () => {
    const { admin } = await createBaseFixture(payload)

    expect(await resolvePreviewTarget(payload, admin, 'users', '1')).toMatchObject({ status: 400 })
    expect(await resolvePreviewTarget(payload, admin, 'games', null)).toMatchObject({ status: 400 })
    expect(await resolvePreviewTarget(payload, admin, 'games', '999999')).toMatchObject({ status: 404 })
  })
})
```

Crie `tests/int/autosave.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createBaseFixture, createGame, getTestPayload, resetDatabase } from '../helpers/fixtures'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  await resetDatabase(payload)
})

describe('autosave', () => {
  it('lets an editor autosave a draft without publishing it', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    const game = await createGame(payload, guildA.id)

    await payload.update({
      collection: 'games',
      id: game.id,
      data: { synopsis: 'Digitando…' },
      draft: true,
      autosave: true,
      user: editorA,
      overrideAccess: false,
    })

    const live = await payload.findByID({ collection: 'games', id: game.id, overrideAccess: false })
    expect(live.synopsis).toBe(game.synopsis)
  })

  it('lets two untitled drafts coexist', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    const untitledDraft = () =>
      payload.create({
        collection: 'games',
        data: { guild: guildA.id } as never,
        draft: true,
        user: editorA,
        overrideAccess: false,
      })

    const first = await untitledDraft()
    const second = await untitledDraft()

    expect(first.slug ?? null).toBeNull()
    expect(second.slug ?? null).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test tests/unit/preview.spec.ts tests/int/preview-target.spec.ts tests/int/autosave.spec.ts`
Expected: FAIL. `@/lib/preview` e `@/lib/queries/preview` não existem, e o segundo rascunho sem título colide no slug `''`. Se o teste de autosave do editor passar já neste passo, está certo: ele protege a regra de modo rascunho contra o autosave.

- [ ] **Step 3: Implementar**

Crie `src/lib/preview.ts`:

```ts
import type { GeneratePreviewURL, LivePreviewConfig } from 'payload'

export type PreviewCollection = 'guilds' | 'games'

const PUBLIC_PATH_PREFIX: Record<PreviewCollection, string> = { guilds: '/guildas', games: '/jogos' }

// DESIGN.md › Layout: the same widths the landing was designed and verified at.
const PREVIEW_BREAKPOINTS: NonNullable<LivePreviewConfig['breakpoints']> = [
  { name: 'mobile', label: 'Celular', width: 390, height: 844 },
  { name: 'desktop', label: 'Desktop', width: 1440, height: 900 },
]

export const isPreviewCollection = (value: string | null): value is PreviewCollection =>
  value === 'guilds' || value === 'games'

export const publicPathFor = (collection: PreviewCollection, slug: string): string =>
  `${PUBLIC_PATH_PREFIX[collection]}/${slug}`

export const previewUrlFor = (collection: PreviewCollection, id: unknown): string | null =>
  id ? `/preview?${new URLSearchParams({ collection, id: String(id) })}` : null

export const previewAdminOptions = (collection: PreviewCollection) => {
  const livePreview: LivePreviewConfig = {
    url: ({ data }) => previewUrlFor(collection, data?.id),
    breakpoints: PREVIEW_BREAKPOINTS,
  }
  const preview: GeneratePreviewURL = (doc) => previewUrlFor(collection, doc.id)
  return { livePreview, preview }
}
```

Crie `src/lib/queries/preview.ts`:

```ts
import type { Payload, TypedUser } from 'payload'

import { isPreviewCollection, publicPathFor } from '@/lib/preview'

export type PreviewTarget = { path: string } | { status: 400 | 401 | 404; message: string }

export const resolvePreviewTarget = async (
  payload: Payload,
  user: TypedUser | null,
  collection: string | null,
  id: string | null,
): Promise<PreviewTarget> => {
  if (!isPreviewCollection(collection) || !id) return { status: 400, message: 'Pré-visualização inválida.' }
  if (!user) return { status: 401, message: 'Entre no painel para pré-visualizar.' }

  const doc = await payload.findByID({
    collection,
    id,
    draft: true,
    user,
    overrideAccess: false,
    depth: 0,
    disableErrors: true,
  })
  if (!doc?.slug) return { status: 404, message: 'Rascunho não encontrado. Dê um nome e salve antes de pré-visualizar.' }

  return { path: publicPathFor(collection, doc.slug) }
}
```

Crie `src/app/(frontend)/preview/route.ts`:

```ts
import config from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { resolvePreviewTarget } from '@/lib/queries/preview'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })

  const target = await resolvePreviewTarget(payload, user, searchParams.get('collection'), searchParams.get('id'))
  if ('status' in target) return new Response(target.message, { status: target.status })

  ;(await draftMode()).enable()
  redirect(target.path)
}
```

Crie `src/app/(frontend)/preview/exit/route.ts`:

```ts
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET() {
  ;(await draftMode()).disable()
  redirect('/')
}
```

Em `src/hooks/publication.ts`, troque `draftVersions` por:

```ts
// Autosave keeps the live preview in sync while editors type; the explicit save button stays for reassurance.
export const draftVersions = {
  drafts: { autosave: { interval: 800, showSaveDraftButton: true } },
  maxPerDoc: 25,
} as const
```

Em `src/fields/slug.ts`, o hook passa a devolver `null` quando não há texto (evita colisão de `''` no índice único):

```ts
    beforeValidate: [
      ({ value, data }) =>
        slugify(typeof value === 'string' && value ? value : String(data?.[sourceField] ?? '')) || null,
    ],
```

Nas coleções, acrescente ao `admin` (import de `@/lib/preview`):
- `Guilds.ts`: `...previewAdminOptions('guilds'),`
- `Games.ts`: `...previewAdminOptions('games'),`

```bash
pnpm generate:types
pnpm generate:importmap
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: tudo verde.

- [ ] **Step 5: Migração**

A mudança de `versions` (autosave) pode adicionar a coluna `autosave` às tabelas de versões.

```bash
pnpm payload migrate:create live_preview_autosave
```

Expected: uma migração nova em `src/migrations/` (se o Payload responder que não há mudanças, não há o que commitar aqui).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: live preview drafts from the admin panel"
```

---

### Task 9: Verificação no navegador e documentação

**Files:**
- Modify: `CLAUDE.md`
- Test: verificação no navegador (Playwright MCP `mcp__plugin_playwright_playwright__*`)

- [ ] **Step 1: Subir com conteúdo**

```bash
pnpm db:up && pnpm seed && pnpm dev
```

- [ ] **Step 2: Páginas públicas (1440 e 390)**

Para `/guildas`, `/guildas/aurora`, `/jogos`, `/jogos/ecos-de-ferro`, `/artigos` e uma URL inexistente (`/jogos/nao-existe`):
1. Role até o fim (para disparar os reveals) e capture a página inteira em 1440×900 e 390×844.
2. Confira contra o `DESIGN.md` › Page Patterns: `BackLink`, capa, identidade, seções só quando têm conteúdo, grades (4/2/1 colunas de guilda, 3/2/1 de jogo), 404 com botão.
3. Sem rolagem horizontal (`document.documentElement.scrollWidth <= clientWidth`) e sem erros no console.
4. Com JavaScript desligado (novo contexto com `javaScriptEnabled: false`), todos os `h1`/`h2` visíveis.

- [ ] **Step 3: Conteúdo real**

No admin (`admin@forja.local` / `forja-dev`), na guilda Aurora preencha descrição (com um título `h2`, um parágrafo, uma lista e um link), dois links, membros; no jogo Ecos de Ferro, trailer (`https://youtu.be/dQw4w9WgXcQ`), uma imagem de capa, duas de galeria, créditos e data; publique. Confira que:
1. A página pública muda **logo depois de publicar** (sem esperar 60s): revalidação (Review Focus 3).
2. O rich text segue o `DESIGN.md` (parágrafos cinza, `h2` condensado, marcador quadrado vermelho, link branco sublinhado).
3. O trailer carrega de `youtube-nocookie.com`.

- [ ] **Step 4: Live preview como editor**

1. Como admin, crie um editor da guilda Aurora (Usuários → novo, papel Editor).
2. Numa janela anônima, entre como esse editor e abra o jogo Ecos de Ferro.
3. Abra o live preview (ícone de pré-visualização no topo do documento): o iframe mostra `/jogos/ecos-de-ferro` com a faixa "Pré-visualização do rascunho".
4. Altere a sinopse e espere ~1s: o iframe mostra o texto novo (autosave + `RefreshRouteOnSave`). Troque para o breakpoint "Celular".
5. Numa terceira janela anônima (sem login), abra `/jogos/ecos-de-ferro`: aparece a **versão publicada**, sem a faixa (Review Focus 1).
6. Ainda sem login, abra `/preview?collection=games&id=<id>`: resposta 401 com "Entre no painel para pré-visualizar." (Review Focus 2).
7. Como o editor, clique "Sair da pré-visualização": volta para `/` e a faixa some.
8. Como admin, publique o rascunho: a fila "Aguardando aprovação" esvazia e o site mostra a sinopse nova.

Qualquer defeito vira um teste (quando testável) e uma correção antes do commit.

- [ ] **Step 5: Documentar no `CLAUDE.md`**

Na seção `## Front-end`, acrescente:

```markdown
- **Páginas internas:** `/guildas`, `/guildas/[slug]`, `/jogos`, `/jogos/[slug]`, `/artigos`. Componentes por domínio em `components/guilds`, `components/games`, `components/articles` (cards e grades são compartilhados com a landing). Rich text do Lexical só em `components/content/RichTextContent.tsx`.
- **Publicar atualiza o site:** `src/hooks/revalidation.ts` chama `revalidatePath` para todas as rotas públicas quando algo é publicado ou excluído. Rascunhos e autosave não mexem no cache. Scripts fora do Next (seed) passam `context: { disableRevalidate: true }`; os testes mocam `next/cache` em `vitest.setup.ts`.
- **Live preview:** o painel abre `/preview?collection=…&id=…` (`src/lib/preview.ts`); a rota confere o login, liga o `draftMode` e redireciona. As páginas de detalhe usam `resolveViewer` e buscam o rascunho **como o usuário do painel** (as regras de acesso valem também no preview); listas e grades mostram sempre a versão publicada. O autosave (800ms) mantém o preview atualizado.
```

E em `## Riscos a ter em mente`, acrescente:

```markdown
- **Autosave enche a fila de aprovação:** com o autosave, uma edição em andamento já aparece em "Aguardando aprovação". Os admins devem aprovar quando o editor avisar que terminou.
```

- [ ] **Step 6: Verificação final e commit**

```bash
npx -y -p @google/design.md designmd lint DESIGN.md
pnpm test && pnpm typecheck && pnpm lint && pnpm build
git add -A
git commit -m "docs: document internal pages, revalidation and live preview"
```

Expected: linter com `"errors": 0` e tudo verde.
