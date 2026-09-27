# Sistema visual e landing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o `DESIGN.md` em tokens do Tailwind e numa biblioteca de componentes reutilizáveis, e montar a landing (`/`) com animações lendo o conteúdo publicado no Payload.

**Architecture:** Um gerador lê o YAML do `DESIGN.md` e escreve `src/styles/tokens.css` (`@theme` do Tailwind v4 + utilitários `type-*`). Um teste garante que o arquivo está em sincronia com o `DESIGN.md`. A UI é dividida em camadas: `components/ui` (primitivos sem conhecimento do Payload), `components/brand` (logo e grafismos), `components/motion` (animações reutilizáveis), `components/layout` (cabeçalho e rodapé) e `components/landing` (seções). Os dados chegam por `getLandingData(payload)`, que lê como visitante (`overrideAccess: false`) e converte os documentos em *view models* simples via `lib/presenters.ts`. Os textos fixos da landing ficam em `src/content/landing.ts`, e os contatos em `src/config/site.ts`.

**Tech Stack:** Next.js 16.3.6 (App Router), Tailwind CSS 4.3.3 (`@tailwindcss/postcss`), Motion 13.4.4 (`motion/react`), `next/font` (Saira Condensed, Inter) + `geist` 1.7.2 (Geist Mono), `yaml` 2.9.1, Vitest + jsdom 30 + Testing Library.

**Spec:** `DESIGN.md` (tokens, componentes, Motion, Page Patterns) e `CLAUDE.md` (convenções de código, stack). Protótipo de referência: Figma `https://www.figma.com/design/qLr3pgjNo0az2ZJVdMaBaQ/Forja`, página `02 · Landing` (desktop no frame `10:3`, mobile no frame `14:2`).

## Global Constraints

- **Toda decisão visual segue o `DESIGN.md`.** Se algo não estiver coberto, atualize o `DESIGN.md` primeiro (com o motivo), rode `pnpm tokens` e o linter, e só depois implemente.
- **Nada de cores, tamanhos de fonte, pesos ou espaçamentos de componente soltos no código.** Use as classes geradas (`text-primary`, `type-headline-md`, `py-section`, `gap-lg`…). Valores arbitrários (`w-[85%]`, `top-[14%]`) só para posicionamento de composição (onde um grafismo fica, larguras de colunas), nunca para cor ou tipografia.
- A paleta padrão do Tailwind é desligada (`--color-*: initial`). Só existem as cores do `DESIGN.md`.
- Código em inglês. Textos visíveis em português.
- Componentes de `components/ui`, `components/brand` e `components/motion` **não importam nada do Payload**: recebem props simples e tipadas.
- Animações só com `transform` e `opacity`. `prefers-reduced-motion` é respeitado (`MotionConfig reducedMotion="user"` + checagens explícitas no parallax e na contagem).
- Leituras públicas usam a Local API com `overrideAccess: false` e sem `user`.
- O status do jogo é `developmentStatus` (`'in-development' | 'released' | 'paused'`).
- `pnpm build` pré-renderiza a landing e **precisa do Postgres de pé** (`pnpm db:up`).
- pnpm pode não estar no PATH do agente: use `$HOME/.local/share/pnpm/bin/pnpm` se preciso.

## Review Focus

1. **Visitante com `prefers-reduced-motion`**: nada se desloca (sem parallax, sem subida de texto, sem contagem) e todo o conteúdo fica visível. (Testes na Tarefa 7 e verificação na Tarefa 10.)
2. **CMS vazio** (nenhuma guilda, jogo ou artigo publicado): a landing renderiza com estados vazios e números zerados, sem quebrar. (Testes nas Tarefas 6 e 9.)
3. **Conteúdo mais longo que o do protótipo** (nome de guilda longo, sinopse de 280 caracteres, título de artigo enorme, muitas plataformas): nada vaza do card nem é cortado. (Classes `min-w-0`/`break-words` nas Tarefas 4 e 9, verificação visual na Tarefa 10.)
4. **Guilda sem logo e jogo sem capa**: aparece o placeholder (iniciais, capa com fagulhas), nunca imagem quebrada. (Testes na Tarefa 4.)
5. **Usuário só de teclado**: link "Pular para o conteúdo", foco visível em todo elemento interativo e menu mobile que abre, fecha com Esc e informa `aria-expanded`. (Testes na Tarefa 8.)

---

## File Structure

```
DESIGN.md                                   + stat-mobile, foco, breakpoints
postcss.config.mjs                          Tailwind v4
scripts/generate-tokens.ts                  `pnpm tokens`
src/design-system/tokens.ts                 DESIGN.md → CSS (puro, testado)
src/styles/tokens.css                       GERADO: @theme + utilitários type-*
src/app/(frontend)/globals.css              Tailwind + tokens + base
src/app/(frontend)/fonts.ts                 next/font
src/app/(frontend)/layout.tsx               fontes, MotionProvider, header, footer
src/app/(frontend)/page.tsx                 landing
public/brand/forja-logo.png                 logo (movida da raiz)
src/config/site.ts                          nome, e-mail, navegação, redes
src/content/landing.ts                      textos fixos da landing
src/utilities/cx.ts, pluralize.ts           helpers puros
src/lib/presenters.ts                       documentos Payload → view models
src/lib/queries/landing.ts                  getLandingData(payload)
src/components/ui/                          ButtonLink, ArrowLink, Arrow, Eyebrow, Container, Section,
                                            SectionHeader, LineBreaks, Card, CardLink, Cover,
                                            StatusBadge, ChipList, GuildAvatar, Stat
src/components/brand/                       Logo, Shards, DiagonalBands
src/components/motion/                      tokens, MotionProvider, Reveal, RevealGroup/RevealItem,
                                            CountUp, Parallax
src/components/layout/                      SiteHeader, MobileMenu, SiteFooter
src/components/landing/                     Hero, HeroBackdrop, HeroContent, AboutSection,
                                            HowItWorksSection, GuildsSection, GuildCard,
                                            FeaturedGamesSection, GameCard, RecentArticlesSection,
                                            ArticleRow, SupportSection
tests/helpers/dom.ts                        setup de testes de componente (jsdom)
tests/unit/tokens.spec.ts, helpers.spec.ts, presenters.spec.ts
tests/int/landing-data.spec.ts
tests/components/*.spec.tsx
```

---

### Task 1: Tokens do DESIGN.md no Tailwind

**Files:**
- Modify: `DESIGN.md`, `package.json`, `src/app/(frontend)/layout.tsx`
- Create: `postcss.config.mjs`, `src/design-system/tokens.ts`, `scripts/generate-tokens.ts`, `src/styles/tokens.css` (gerado), `src/app/(frontend)/globals.css`, `src/app/(frontend)/fonts.ts`
- Test: `tests/unit/tokens.spec.ts`

**Interfaces:**
- Produces:
  - `readDesignTokens(designMd: string): DesignTokens` e `generateTokensCss(designMd: string): string` (`@/design-system/tokens`)
  - Classes Tailwind: `bg-*`/`text-*`/`border-*` para cada cor do `DESIGN.md`; `rounded-none|xs|full`; espaçamentos `p-*`/`gap-*`/`m-*` com `xs, sm, md, lg, xl, 2xl, 3xl, section, section-mobile, gutter, margin, margin-mobile, content-max, unit`; utilitários `type-<token>` para cada token de tipografia (ex.: `type-display-xl`, `type-label-mono-sm`); `ease-forge`.
  - Variáveis de fonte no `<html>`: `--font-saira-condensed`, `--font-inter`, `--font-geist-mono`.
  - Script `pnpm tokens`.

- [ ] **Step 1: Atualizar o `DESIGN.md` (antes de qualquer código)**

No YAML, em `typography`, logo depois de `stat:`, acrescente:

```yaml
  stat-mobile:
    fontFamily: Saira Condensed
    fontSize: 56px
    fontWeight: 800
    lineHeight: 0.9
```

Na seção `## Layout`, acrescente ao final da lista:

```markdown
- **Breakpoints:** mobile até 767px; `md` a partir de 768px (grades de 2–3 colunas, espaçamentos de desktop); `lg` a partir de 1024px (grade de 4 colunas de guildas e o título `display-xl` do hero, que não cabe antes disso).
```

Na seção `## Components`, acrescente ao final da lista:

```markdown
- **Foco:** todo elemento interativo mostra, em `:focus-visible`, um contorno de 2px em `primary-text` com 2px de afastamento. Nunca remova o foco sem colocar outro indicador no lugar.
- **Números grandes no mobile:** `stat-mobile` (56px) abaixo de `md`.
```

Valide:

```bash
npx -y -p @google/design.md designmd lint DESIGN.md
```

Expected: `"errors": 0` (os avisos de `borderColor` continuam, são intencionais).

- [ ] **Step 2: Escrever os testes do gerador**

Crie `tests/unit/tokens.spec.ts`:

```ts
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { generateTokensCss } from '@/design-system/tokens'

const designMd = (typography: string) => `---
version: alpha
name: Test
colors:
  primary: "#D21312"
  outline: "#FFFFFF17"
typography:
${typography}
rounded:
  xs: 2px
spacing:
  lg: 24px
  2xl: 56px
---

# Body
`

const displayAndBody = `  display-xl:
    fontFamily: Saira Condensed
    fontSize: 148px
    fontWeight: 800
    lineHeight: 0.88
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55`

describe('generateTokensCss', () => {
  it('turns colors, radii and spacing into Tailwind theme variables, replacing the default palette', () => {
    const css = generateTokensCss(designMd(displayAndBody))

    expect(css).toContain('@theme static {')
    expect(css).toContain('  --color-*: initial;')
    expect(css).toContain('  --color-primary: #D21312;')
    expect(css).toContain('  --color-outline: #FFFFFF17;')
    expect(css).toContain('  --radius-xs: 2px;')
    expect(css).toContain('  --spacing-lg: 24px;')
    expect(css).toContain('  --spacing-2xl: 56px;')
  })

  it('creates one type-* utility per typography token, using the next/font variable', () => {
    const css = generateTokensCss(designMd(displayAndBody))

    expect(css).toContain(`@utility type-display-xl {
  font-family: var(--font-saira-condensed);
  font-size: 148px;
  font-weight: 800;
  line-height: 0.88;
  letter-spacing: -0.01em;
  text-transform: uppercase;
}`)
    expect(css).toContain(`@utility type-body-md {
  font-family: var(--font-inter);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.55;
}`)
  })

  it('refuses a font family that the layout does not load', () => {
    const unknownFont = `  body-md:
    fontFamily: Comic Sans
    fontSize: 16px`

    expect(() => generateTokensCss(designMd(unknownFont))).toThrow('No font variable for "Comic Sans"')
  })

  it('refuses a file without YAML front matter', () => {
    expect(() => generateTokensCss('# Only prose')).toThrow('DESIGN.md has no YAML front matter')
  })

  it('keeps src/styles/tokens.css in sync with DESIGN.md (run `pnpm tokens` after editing DESIGN.md)', () => {
    const expected = generateTokensCss(readFileSync('DESIGN.md', 'utf8'))
    expect(readFileSync('src/styles/tokens.css', 'utf8')).toBe(expected)
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm test tests/unit/tokens.spec.ts`
Expected: FAIL (`Cannot find package '@/design-system/tokens'`).

- [ ] **Step 4: Instalar Tailwind, fontes e YAML**

```bash
pnpm add geist@1.7.2
pnpm add -D tailwindcss@4.3.3 @tailwindcss/postcss@4.3.3 yaml@2.9.1
```

Crie `postcss.config.mjs`:

```js
export default {
  plugins: { '@tailwindcss/postcss': {} },
}
```

- [ ] **Step 5: Implementar o gerador**

Crie `src/design-system/tokens.ts`:

```ts
import { parse } from 'yaml'

type TypographyToken = {
  fontFamily: string
  fontSize: string
  fontWeight?: number
  lineHeight?: number | string
  letterSpacing?: string
}

export type DesignTokens = {
  colors: Record<string, string>
  typography: Record<string, TypographyToken>
  rounded: Record<string, string>
  spacing: Record<string, string | number>
}

// Each family must be loaded with next/font in src/app/(frontend)/fonts.ts under this CSS variable.
const FONT_VARIABLES: Record<string, string> = {
  'Saira Condensed': '--font-saira-condensed',
  Inter: '--font-inter',
  'Geist Mono': '--font-geist-mono',
}

// DESIGN.md: Saira Condensed and Geist Mono are always uppercase.
const UPPERCASE_FAMILIES = new Set(['Saira Condensed', 'Geist Mono'])

const HEADER = '/* Generated from DESIGN.md by `pnpm tokens`. Do not edit by hand. */'

export const readDesignTokens = (designMd: string): DesignTokens => {
  const frontMatter = designMd.match(/^---\n([\s\S]*?)\n---/)
  if (!frontMatter) throw new Error('DESIGN.md has no YAML front matter')
  return parse(frontMatter[1]) as DesignTokens
}

const fontVariable = (family: string): string => {
  const variable = FONT_VARIABLES[family]
  if (!variable) throw new Error(`No font variable for "${family}". Load it with next/font and map it in FONT_VARIABLES.`)
  return variable
}

const themeLines = ({ colors, rounded, spacing }: DesignTokens): string[] => [
  '  --color-*: initial;',
  ...Object.entries(colors).map(([name, value]) => `  --color-${name}: ${value};`),
  ...Object.entries(rounded).map(([name, value]) => `  --radius-${name}: ${value};`),
  ...Object.entries(spacing).map(([name, value]) => `  --spacing-${name}: ${value};`),
]

const typographyUtility = (name: string, token: TypographyToken): string =>
  [
    `@utility type-${name} {`,
    `  font-family: var(${fontVariable(token.fontFamily)});`,
    `  font-size: ${token.fontSize};`,
    token.fontWeight !== undefined && `  font-weight: ${token.fontWeight};`,
    token.lineHeight !== undefined && `  line-height: ${token.lineHeight};`,
    token.letterSpacing !== undefined && `  letter-spacing: ${token.letterSpacing};`,
    UPPERCASE_FAMILIES.has(token.fontFamily) && '  text-transform: uppercase;',
    '}',
  ]
    .filter(Boolean)
    .join('\n')

export const generateTokensCss = (designMd: string): string => {
  const tokens = readDesignTokens(designMd)
  const utilities = Object.entries(tokens.typography).map(([name, token]) => typographyUtility(name, token))

  return [HEADER, '', '@theme static {', ...themeLines(tokens), '}', '', utilities.join('\n\n'), ''].join('\n')
}
```

Crie `scripts/generate-tokens.ts`:

```ts
import { readFileSync, writeFileSync } from 'node:fs'

import { generateTokensCss } from '../src/design-system/tokens'

writeFileSync('src/styles/tokens.css', generateTokensCss(readFileSync('DESIGN.md', 'utf8')))
console.log('src/styles/tokens.css updated from DESIGN.md')
```

```bash
npm pkg set scripts.tokens="tsx scripts/generate-tokens.ts"
mkdir -p src/styles
pnpm tokens
```

Expected: `src/styles/tokens.css updated from DESIGN.md` e o arquivo contém `@utility type-stat-mobile`.

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm test tests/unit/tokens.spec.ts`
Expected: PASS (5 testes).

- [ ] **Step 7: Fontes e CSS global**

Crie `src/app/(frontend)/fonts.ts`:

```ts
import { GeistMono } from 'geist/font/mono'
import { Inter, Saira_Condensed } from 'next/font/google'

const sairaCondensed = Saira_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-saira-condensed',
})

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const fontVariables = [sairaCondensed.variable, inter.variable, GeistMono.variable].join(' ')
```

Crie `src/app/(frontend)/globals.css`:

```css
@import 'tailwindcss';
@import '../../styles/tokens.css';

/* DESIGN.md › Motion: default easing. */
@theme {
  --ease-forge: cubic-bezier(0.22, 1, 0.36, 1);
}

@layer base {
  html {
    background-color: var(--color-neutral);
    color: var(--color-on-surface);
    color-scheme: dark;
  }

  body {
    font-family: var(--font-inter), system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  ::selection {
    background-color: var(--color-primary);
    color: var(--color-on-primary);
  }

  :focus-visible {
    outline: 2px solid var(--color-primary-text);
    outline-offset: 2px;
  }
}
```

Substitua `src/app/(frontend)/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { fontVariables } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Forja — Onde jogos são forjados', template: '%s · Forja' },
  description: 'Guildas de alunos do CESAR pesquisando, prototipando e lançando jogos.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={fontVariables}>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 8: Build e verificação do CSS gerado**

```bash
pnpm typecheck && pnpm lint && pnpm build
grep -ho "type-headline-lg{[^}]*" .next/static/chunks/*.css | head -1
```

Expected: build verde. Se o `grep` não achar nada (a página provisória ainda não usa a classe), tudo bem: a checagem real acontece na Tarefa 2.

- [ ] **Step 9: Documentar e commitar**

No `CLAUDE.md`, na seção `## Comandos`, acrescente dentro do bloco:

```bash
pnpm tokens                 # regenera src/styles/tokens.css a partir do DESIGN.md (o teste falha se esquecer)
```

```bash
git add -A
git commit -m "feat: generate Tailwind tokens from DESIGN.md"
```

---

### Task 2: Primitivos de UI e ambiente de teste de componentes

**Files:**
- Create: `src/utilities/cx.ts`, `src/utilities/pluralize.ts`, `src/components/ui/Arrow.tsx`, `src/components/ui/ButtonLink.tsx`, `src/components/ui/ArrowLink.tsx`, `src/components/ui/Eyebrow.tsx`, `src/components/ui/Container.tsx`, `src/components/ui/LineBreaks.tsx`, `tests/helpers/dom.ts`
- Modify: `src/utilities/url.ts`, `vitest.config.mts`, `package.json`
- Test: `tests/unit/helpers.spec.ts`, `tests/components/ui.spec.tsx`

**Interfaces:**
- Produces:
  - `cx(...classes: Array<string | false | null | undefined>): string`
  - `pluralize(count: number, singular: string, plural: string): string` → `"1 jogo"`, `"3 jogos"`
  - `isExternalHref(href: string): boolean` (em `@/utilities/url`)
  - `ButtonLink({ href, variant?: 'primary' | 'secondary' | 'onPrimary', size?: 'md' | 'sm', arrow?, className?, onClick?, children })`
  - `ArrowLink({ href, external?, className?, children })`, `Arrow({ external? })`
  - `Eyebrow({ tone?: 'accent' | 'muted' | 'onPrimary', className?, children })`
  - `Container({ className?, children })`
  - `LineBreaks({ text })`: quebra `\n` em linhas `block`, mantendo o nome acessível com espaços.
  - `tests/helpers/dom.ts`: importar no topo de todo teste de componente.

- [ ] **Step 1: Dependências e configuração de testes de componente**

```bash
pnpm add -D jsdom@30.1.1 @testing-library/react@16.3.3 @testing-library/jest-dom@7.0.1 @testing-library/user-event@14.6.7
```

Em `vitest.config.mts`, troque o `include` por:

```ts
    include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
```

Crie `tests/helpers/dom.ts`:

```ts
import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom has no IntersectionObserver; Motion's whileInView/useInView need one to mount.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

globalThis.IntersectionObserver ??= IntersectionObserverStub as unknown as typeof IntersectionObserver

afterEach(cleanup)
```

- [ ] **Step 2: Escrever os testes**

Crie `tests/unit/helpers.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { cx } from '@/utilities/cx'
import { pluralize } from '@/utilities/pluralize'
import { isExternalHref } from '@/utilities/url'

describe('cx', () => {
  it('joins truthy class names only', () => {
    expect(cx('a', false, null, undefined, 'b', '')).toBe('a b')
  })
})

describe('pluralize', () => {
  it('uses the singular only for exactly one', () => {
    expect(pluralize(0, 'jogo', 'jogos')).toBe('0 jogos')
    expect(pluralize(1, 'jogo', 'jogos')).toBe('1 jogo')
    expect(pluralize(12, 'membro', 'membros')).toBe('12 membros')
  })
})

describe('isExternalHref', () => {
  it('treats http, mailto and tel links as external', () => {
    expect(isExternalHref('https://doi.org/10.1')).toBe(true)
    expect(isExternalHref('mailto:forja@exemplo.com')).toBe(true)
    expect(isExternalHref('tel:+5581999999999')).toBe(true)
    expect(isExternalHref('/jogos')).toBe(false)
    expect(isExternalHref('/#como-funciona')).toBe(false)
  })
})
```

Crie `tests/components/ui.spec.tsx`:

```tsx
// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ArrowLink } from '@/components/ui/ArrowLink'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { LineBreaks } from '@/components/ui/LineBreaks'

describe('ButtonLink', () => {
  it('renders an internal link with the variant classes', () => {
    render(<ButtonLink href="/jogos">Ver jogos</ButtonLink>)

    const link = screen.getByRole('link', { name: 'Ver jogos' })
    expect(link).toHaveAttribute('href', '/jogos')
    expect(link).toHaveClass('bg-primary', 'type-button')
  })

  it('hides the decorative arrow from assistive technology', () => {
    render(
      <ButtonLink href="/jogos" variant="secondary" arrow>
        Ver jogos
      </ButtonLink>,
    )

    expect(screen.getByRole('link', { name: 'Ver jogos' })).toHaveClass('border-outline-strong')
    expect(screen.getByText('→')).toHaveAttribute('aria-hidden', 'true')
  })

  it('uses a plain anchor for mailto links', () => {
    render(
      <ButtonLink href="mailto:forja@exemplo.com" variant="onPrimary">
        Fale com a gente
      </ButtonLink>,
    )

    expect(screen.getByRole('link', { name: 'Fale com a gente' })).toHaveAttribute('href', 'mailto:forja@exemplo.com')
  })
})

describe('ArrowLink', () => {
  it('opens external links in a new tab safely', () => {
    render(
      <ArrowLink href="https://doi.org/10.1" external>
        Ler publicação
      </ArrowLink>,
    )

    const link = screen.getByRole('link', { name: 'Ler publicação' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText('↗')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('Eyebrow', () => {
  it('uses the accessible red for small text by default', () => {
    render(<Eyebrow>01 / O que é a Forja</Eyebrow>)
    expect(screen.getByText('01 / O que é a Forja')).toHaveClass('type-label-mono', 'text-primary-text')
  })
})

describe('LineBreaks', () => {
  it('keeps words separated in the accessible name', () => {
    render(
      <h2>
        <LineBreaks text={'Uma iniciativa\nfeita por alunos.'} />
      </h2>,
    )

    expect(screen.getByRole('heading', { name: 'Uma iniciativa feita por alunos.' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm test tests/unit/helpers.spec.ts tests/components/ui.spec.tsx`
Expected: FAIL (imports não resolvem).

- [ ] **Step 4: Implementar**

Crie `src/utilities/cx.ts`:

```ts
export const cx = (...classes: Array<string | false | null | undefined>): string => classes.filter(Boolean).join(' ')
```

Crie `src/utilities/pluralize.ts`:

```ts
export const pluralize = (count: number, singular: string, plural: string): string =>
  `${count} ${count === 1 ? singular : plural}`
```

Em `src/utilities/url.ts`, acrescente ao final:

```ts
export const isExternalHref = (href: string): boolean => /^(https?:|mailto:|tel:)/.test(href)
```

Crie `src/components/ui/Arrow.tsx`:

```tsx
export function Arrow({ external = false }: { external?: boolean }) {
  return (
    <span aria-hidden="true" className="inline-block transition-transform duration-200 ease-forge group-hover:translate-x-1">
      {external ? '↗' : '→'}
    </span>
  )
}
```

Crie `src/components/ui/ButtonLink.tsx`:

```tsx
import Link from 'next/link'
import type { ReactNode } from 'react'

import { cx } from '@/utilities/cx'
import { isExternalHref } from '@/utilities/url'

import { Arrow } from './Arrow'

export type ButtonVariant = 'primary' | 'secondary' | 'onPrimary'
export type ButtonSize = 'md' | 'sm'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'border border-outline-strong text-on-surface hover:border-on-surface',
  onPrimary: 'bg-neutral text-on-surface hover:bg-surface-raised',
}

// DESIGN.md › button-primary padding is 12px 26px.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: 'px-[26px] py-3',
  sm: 'px-md py-sm',
}

type ButtonLinkProps = {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
  arrow?: boolean
  className?: string
  onClick?: () => void
  children: ReactNode
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  arrow = false,
  className,
  onClick,
  children,
}: ButtonLinkProps) {
  const classes = cx(
    'group type-button inline-flex items-center justify-center gap-sm rounded-xs transition-colors duration-200 ease-forge',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  )
  const content = (
    <>
      {children}
      {arrow && <Arrow />}
    </>
  )

  return isExternalHref(href) ? (
    <a href={href} className={classes} onClick={onClick}>
      {content}
    </a>
  ) : (
    <Link href={href} className={classes} onClick={onClick}>
      {content}
    </Link>
  )
}
```

Crie `src/components/ui/ArrowLink.tsx`:

```tsx
import Link from 'next/link'
import type { ReactNode } from 'react'

import { cx } from '@/utilities/cx'

import { Arrow } from './Arrow'

type ArrowLinkProps = { href: string; external?: boolean; className?: string; children: ReactNode }

export function ArrowLink({ href, external = false, className, children }: ArrowLinkProps) {
  const classes = cx('group type-button inline-flex items-center gap-sm text-on-surface', className)

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
      {children}
      <Arrow external />
    </a>
  ) : (
    <Link href={href} className={classes}>
      {children}
      <Arrow />
    </Link>
  )
}
```

Crie `src/components/ui/Eyebrow.tsx`:

```tsx
import type { ReactNode } from 'react'

import { cx } from '@/utilities/cx'

const TONE_CLASSES = {
  accent: 'text-primary-text',
  muted: 'text-on-surface-muted',
  onPrimary: 'text-on-primary',
} as const

type EyebrowProps = { tone?: keyof typeof TONE_CLASSES; className?: string; children: ReactNode }

export function Eyebrow({ tone = 'accent', className, children }: EyebrowProps) {
  return <p className={cx('type-label-mono', TONE_CLASSES[tone], className)}>{children}</p>
}
```

Crie `src/components/ui/Container.tsx`:

```tsx
import type { ReactNode } from 'react'

import { cx } from '@/utilities/cx'

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cx(
        'mx-auto w-full max-w-[calc(var(--spacing-content-max)_+_2*var(--spacing-margin-mobile))] px-margin-mobile',
        className,
      )}
    >
      {children}
    </div>
  )
}
```

Crie `src/components/ui/LineBreaks.tsx`:

```tsx
import { Fragment } from 'react'

export function LineBreaks({ text }: { text: string }) {
  return text.split('\n').map((line, index) => (
    <Fragment key={index}>
      {index > 0 && ' '}
      <span className="block">{line}</span>
    </Fragment>
  ))
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm test tests/unit/helpers.spec.ts tests/components/ui.spec.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
pnpm typecheck && pnpm lint
git add -A
git commit -m "feat: add UI primitives and component test setup"
```

---

### Task 3: Marca: logo, fagulhas e faixas diagonais

**Files:**
- Move: `forja_logo_whitered-2048x687.png` → `public/brand/forja-logo.png`
- Create: `src/components/brand/Logo.tsx`, `src/components/brand/Shards.tsx`, `src/components/brand/DiagonalBands.tsx`
- Modify: `next.config.ts`, `CLAUDE.md`
- Test: `tests/components/brand.spec.tsx`

**Interfaces:**
- Produces:
  - `Logo({ className?, priority? })`: imagem com `alt="Forja"`.
  - `SHARD_POLYGONS: readonly string[]` (3 polígonos, `viewBox="0 0 272 283"`) e `Shards({ className? })`: SVG decorativo, `fill="currentColor"`.
  - `DiagonalBands({ tone?: 'primary' | 'ink', className? })`: faixas a −28°, decorativas. `ink` = preto translúcido, para o bloco vermelho.

- [ ] **Step 1: Escrever os testes**

Crie `tests/components/brand.spec.tsx`:

```tsx
// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DiagonalBands } from '@/components/brand/DiagonalBands'
import { Logo } from '@/components/brand/Logo'
import { SHARD_POLYGONS, Shards } from '@/components/brand/Shards'

describe('brand', () => {
  it('renders the logo with an accessible name', () => {
    render(<Logo />)
    expect(screen.getByRole('img', { name: 'Forja' })).toBeInTheDocument()
  })

  it('draws the three sparks from the logo as decoration only', () => {
    const { container } = render(<Shards className="text-primary" />)
    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('viewBox', '0 0 272 283')
    expect(container.querySelectorAll('polygon')).toHaveLength(SHARD_POLYGONS.length)
  })

  it('keeps the diagonal bands out of the accessibility tree', () => {
    const { container } = render(<DiagonalBands tone="ink" />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test tests/components/brand.spec.tsx`
Expected: FAIL (imports não resolvem).

- [ ] **Step 3: Implementar**

```bash
mkdir -p public/brand
git mv forja_logo_whitered-2048x687.png public/brand/forja-logo.png
```

Em `next.config.ts`, acrescente o padrão das imagens da marca em `images.localPatterns`:

```ts
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
      {
        pathname: '/brand/**',
      },
    ],
  },
```

Crie `src/components/brand/Logo.tsx`:

```tsx
import Image from 'next/image'

import { cx } from '@/utilities/cx'

export function Logo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/forja-logo.png"
      width={2048}
      height={687}
      alt="Forja"
      priority={priority}
      className={cx('h-auto', className)}
    />
  )
}
```

Crie `src/components/brand/Shards.tsx`:

```tsx
// The three red sparks of the logo, measured from forja-logo.png and normalized to their bounding box.
export const SHARD_POLYGONS = [
  '16,45 96,137 90,158 10,82',
  '85,0 272,238 250,240 126,142',
  '0,128 184,258 184,283 12,283 96,247',
] as const

export function Shards({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 272 283" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      {SHARD_POLYGONS.map((points) => (
        <polygon key={points} points={points} />
      ))}
    </svg>
  )
}
```

Crie `src/components/brand/DiagonalBands.tsx`:

```tsx
import { cx } from '@/utilities/cx'

const BAND_COLOR = { primary: 'bg-primary', ink: 'bg-neutral' } as const

type DiagonalBandsProps = { tone?: keyof typeof BAND_COLOR; className?: string }

export function DiagonalBands({ tone = 'primary', className }: DiagonalBandsProps) {
  const color = BAND_COLOR[tone]

  return (
    <div aria-hidden="true" className={cx('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className={cx('absolute -left-1/4 top-[58%] h-[180px] w-[150%] -rotate-[28deg] opacity-10', color)} />
      <div className={cx('absolute -left-1/4 top-[82%] h-[110px] w-[150%] -rotate-[28deg] opacity-[0.06]', color)} />
      {tone === 'primary' && (
        <div className={cx('absolute -left-1/4 top-[74%] h-1.5 w-[150%] -rotate-[28deg]', color)} />
      )}
    </div>
  )
}
```

No `CLAUDE.md`, na seção `## Arquivos`, troque a linha da logo por:

```markdown
- `public/brand/forja-logo.png`: logo oficial (branco e vermelho, para fundo escuro). O vermelho da marca é `#D21312`. As três fagulhas da logo estão redesenhadas em SVG em `src/components/brand/Shards.tsx`.
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm test tests/components/brand.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
pnpm typecheck && pnpm lint
git add -A
git commit -m "feat: add logo, spark shards and diagonal bands"
```

---

### Task 4: Cards, capas, badges e avatares

**Files:**
- Create: `src/components/ui/Card.tsx`, `src/components/ui/Cover.tsx`, `src/components/ui/StatusBadge.tsx`, `src/components/ui/ChipList.tsx`, `src/components/ui/GuildAvatar.tsx`, `src/lib/views.ts`
- Test: `tests/components/cards.spec.tsx`

**Interfaces:**
- Consumes: `cx` (Task 2), `Shards` (Task 3).
- Produces:
  - `src/lib/views.ts`: `type MediaView = { url: string; alt: string }`, `type DevelopmentStatus = 'in-development' | 'released' | 'paused'`.
  - `Card({ as?: 'article' | 'div', className?, children })`: borda fina, barra de acento 56×4px e barra de hover em largura total (animada por `scale-x`).
  - `CardLink({ href, className?, children })`: link "esticado", que torna o card inteiro clicável.
  - `Cover({ image: MediaView | null, ratio: 'video' | 'banner', sizes, className? })`: imagem com `next/image` ou placeholder (gradiente de brasa + fagulhas).
  - `StatusBadge({ status: DevelopmentStatus })`
  - `ChipList({ items: string[], label, className? })`
  - `GuildAvatar({ initials, logo: MediaView | null, size?: 'sm' | 'md' })`

- [ ] **Step 1: Escrever os testes**

Crie `tests/components/cards.spec.tsx`:

```tsx
// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Card, CardLink } from '@/components/ui/Card'
import { ChipList } from '@/components/ui/ChipList'
import { Cover } from '@/components/ui/Cover'
import { GuildAvatar } from '@/components/ui/GuildAvatar'
import { StatusBadge } from '@/components/ui/StatusBadge'

describe('Card', () => {
  it('makes the whole card clickable through its title link', () => {
    render(
      <Card>
        <h3>
          <CardLink href="/jogos/ecos-de-ferro">Ecos de Ferro</CardLink>
        </h3>
      </Card>,
    )

    const link = screen.getByRole('link', { name: 'Ecos de Ferro' })
    expect(link).toHaveAttribute('href', '/jogos/ecos-de-ferro')
    expect(link).toHaveClass('after:absolute', 'after:inset-0')
    expect(screen.getByRole('article')).toHaveClass('border-outline')
  })
})

describe('Cover', () => {
  it('shows the uploaded image with its alt text', () => {
    render(<Cover image={{ url: '/api/media/file/capa.png', alt: 'Tela de título' }} ratio="video" sizes="100vw" />)
    expect(screen.getByRole('img', { name: 'Tela de título' })).toBeInTheDocument()
  })

  it('falls back to the spark placeholder when there is no image', () => {
    const { container } = render(<Cover image={null} ratio="video" sizes="100vw" />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(container.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument()
  })
})

describe('StatusBadge', () => {
  it.each([
    ['in-development', 'Em desenvolvimento', 'text-primary-text'],
    ['released', 'Lançado', 'text-on-surface'],
    ['paused', 'Pausado', 'text-on-surface-muted'],
  ] as const)('labels %s in Portuguese', (status, label, colorClass) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toHaveClass(colorClass)
  })
})

describe('ChipList', () => {
  it('lists every item under an accessible label', () => {
    render(<ChipList label="Plataformas" items={['PC', 'Web']} />)

    const list = screen.getByRole('list', { name: 'Plataformas' })
    expect(list.querySelectorAll('li')).toHaveLength(2)
  })
})

describe('GuildAvatar', () => {
  it('shows the initials when the guild has no logo', () => {
    render(<GuildAvatar initials="Tê" logo={null} />)

    expect(screen.getByText('Tê')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows the logo as decoration when there is one, since the name is next to it', () => {
    const { container } = render(<GuildAvatar initials="Au" logo={{ url: '/api/media/file/logo.png', alt: 'Logo' }} />)

    expect(container.querySelector('img')).toHaveAttribute('alt', '')
    expect(screen.queryByText('Au')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test tests/components/cards.spec.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Crie `src/lib/views.ts`:

```ts
export type MediaView = { url: string; alt: string }

export type DevelopmentStatus = 'in-development' | 'released' | 'paused'
```

Crie `src/components/ui/Card.tsx`:

```tsx
import Link from 'next/link'
import type { ReactNode } from 'react'

import { cx } from '@/utilities/cx'

type CardProps = { as?: 'article' | 'div'; className?: string; children: ReactNode }

export function Card({ as: Tag = 'article', className, children }: CardProps) {
  return (
    <Tag
      className={cx(
        'group relative flex flex-col overflow-hidden border border-outline bg-surface transition-colors duration-200 ease-forge hover:border-primary/50 focus-within:border-primary/50',
        className,
      )}
    >
      <span aria-hidden="true" className="absolute left-0 top-0 z-10 h-1 w-14 bg-primary" />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-10 h-1 origin-left scale-x-0 bg-primary transition-transform duration-200 ease-forge group-hover:scale-x-100 group-focus-within:scale-x-100"
      />
      {children}
    </Tag>
  )
}

export function CardLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={cx('after:absolute after:inset-0', className)}>
      {children}
    </Link>
  )
}
```

Crie `src/components/ui/Cover.tsx`:

```tsx
import Image from 'next/image'

import { Shards } from '@/components/brand/Shards'
import type { MediaView } from '@/lib/views'
import { cx } from '@/utilities/cx'

const RATIO_CLASSES = { video: 'aspect-video', banner: 'aspect-[12/5]' } as const

type CoverProps = { image: MediaView | null; ratio: keyof typeof RATIO_CLASSES; sizes: string; className?: string }

export function Cover({ image, ratio, sizes, className }: CoverProps) {
  return (
    <div className={cx('relative overflow-hidden bg-linear-to-br from-ember to-surface-raised', RATIO_CLASSES[ratio], className)}>
      {image ? (
        <Image
          src={image.url}
          alt={image.alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-300 ease-forge group-hover:scale-[1.03]"
        />
      ) : (
        <Shards className="absolute -bottom-[12%] right-[4%] w-[36%] text-primary opacity-45" />
      )}
    </div>
  )
}
```

Crie `src/components/ui/StatusBadge.tsx`:

```tsx
import type { DevelopmentStatus } from '@/lib/views'
import { cx } from '@/utilities/cx'

const STATUS: Record<DevelopmentStatus, { label: string; className: string }> = {
  'in-development': { label: 'Em desenvolvimento', className: 'bg-primary-tint text-primary-text' },
  released: { label: 'Lançado', className: 'bg-surface-raised text-on-surface' },
  paused: { label: 'Pausado', className: 'border border-outline-strong text-on-surface-muted' },
}

export function StatusBadge({ status }: { status: DevelopmentStatus }) {
  const { label, className } = STATUS[status]

  return (
    <span className={cx('type-label-mono-sm inline-flex w-fit items-center gap-1.5 px-sm py-xs', className)}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
```

Crie `src/components/ui/ChipList.tsx`:

```tsx
import { cx } from '@/utilities/cx'

type ChipListProps = { items: string[]; label: string; className?: string }

export function ChipList({ items, label, className }: ChipListProps) {
  return (
    <ul aria-label={label} className={cx('flex flex-wrap gap-sm', className)}>
      {items.map((item) => (
        <li key={item} className="type-label-mono-sm bg-surface-raised px-sm py-xs text-on-surface-variant">
          {item}
        </li>
      ))}
    </ul>
  )
}
```

Crie `src/components/ui/GuildAvatar.tsx`:

```tsx
import Image from 'next/image'

import type { MediaView } from '@/lib/views'
import { cx } from '@/utilities/cx'

const SIZE_CLASSES = { sm: 'size-12', md: 'size-14' } as const

type GuildAvatarProps = { initials: string; logo: MediaView | null; size?: keyof typeof SIZE_CLASSES }

export function GuildAvatar({ initials, logo, size = 'md' }: GuildAvatarProps) {
  return (
    <span
      className={cx(
        'relative flex shrink-0 items-center justify-center overflow-hidden border border-outline-strong bg-surface-raised',
        SIZE_CLASSES[size],
      )}
    >
      {logo ? (
        <Image src={logo.url} alt="" fill sizes="56px" className="object-cover" />
      ) : (
        <span className="type-label-mono normal-case text-on-surface">{initials}</span>
      )}
    </span>
  )
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm test tests/components/cards.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
pnpm typecheck && pnpm lint
git add -A
git commit -m "feat: add cards, covers, status badges and guild avatars"
```

---

### Task 5: Presenters (documento do Payload → view model)

**Files:**
- Create: `src/lib/presenters.ts`
- Test: `tests/unit/presenters.spec.ts`

**Interfaces:**
- Consumes: tipos `Guild`, `Game`, `Article`, `Media` de `@/payload-types`, `pluralize` (Task 2), `MediaView`/`DevelopmentStatus` (Task 4).
- Produces:
  - `toMediaView(media: number | Media | null | undefined): MediaView | null`
  - `type GuildCardView = { id: number; name: string; href: string; focus: string; initials: string; logo: MediaView | null; meta: string }` e `toGuildCard(guild: Guild, gameCount: number): GuildCardView`. O `href` é `/guildas/<slug>`, e o `meta` é `"3 jogos  ·  12 membros"` (membros contados por linha do campo `members`, omitidos quando vazio).
  - `type GameCardView = { id: number; title: string; href: string; synopsis: string; status: DevelopmentStatus; guildName: string | null; platforms: string[]; cover: MediaView | null }` e `toGameCard(game: Game): GameCardView`. O `href` é `/jogos/<slug>`, e as plataformas saem como `PC`, `Web`, `Mobile` e `Console`.
  - `type ArticleRowView = { id: number; title: string; url: string; venue: string; authors: string; date: string }` e `toArticleRow(article: Article): ArticleRowView`

- [ ] **Step 1: Escrever os testes**

Crie `tests/unit/presenters.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { toArticleRow, toGameCard, toGuildCard, toMediaView } from '@/lib/presenters'
import type { Article, Game, Guild, Media } from '@/payload-types'

const timestamps = { createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z' }

const media = { id: 5, alt: 'Capa', url: '/api/media/file/capa.png', ...timestamps } as Media

const guild = {
  id: 1,
  name: 'Têmpera',
  slug: 'tempera',
  shortDescription: 'Áudio e trilha sonora.',
  members: 'Ana\n\nBruno\n  \nCarla',
  logo: null,
  ...timestamps,
} as Guild

const game = {
  id: 9,
  title: 'Ecos de Ferro',
  slug: 'ecos-de-ferro',
  synopsis: 'Um metroidvania.',
  developmentStatus: 'in-development',
  platforms: ['pc', 'web'],
  guild,
  cover: media,
  ...timestamps,
} as Game

const article = {
  id: 3,
  title: 'Masmorras procedurais',
  description: 'x',
  authors: [{ name: 'Ana Lima' }, { name: 'Pedro Souza' }],
  date: '2026-09-01T00:00:00.000Z',
  venue: 'SBGames 2026',
  url: 'https://doi.org/10.1/x',
  ...timestamps,
} as Article

describe('toMediaView', () => {
  it('keeps only populated media with a URL', () => {
    expect(toMediaView(media)).toEqual({ url: '/api/media/file/capa.png', alt: 'Capa' })
    expect(toMediaView(5)).toBeNull()
    expect(toMediaView(null)).toBeNull()
    expect(toMediaView({ ...media, url: null })).toBeNull()
  })
})

describe('toGuildCard', () => {
  it('builds the card with link, initials and counts', () => {
    expect(toGuildCard(guild, 3)).toEqual({
      id: 1,
      name: 'Têmpera',
      href: '/guildas/tempera',
      focus: 'Áudio e trilha sonora.',
      initials: 'Tê',
      logo: null,
      meta: '3 jogos  ·  3 membros',
    })
  })

  it('omits members when the guild did not list any', () => {
    expect(toGuildCard({ ...guild, members: null }, 1).meta).toBe('1 jogo')
  })
})

describe('toGameCard', () => {
  it('builds the card with guild name, platform labels and cover', () => {
    expect(toGameCard(game)).toEqual({
      id: 9,
      title: 'Ecos de Ferro',
      href: '/jogos/ecos-de-ferro',
      synopsis: 'Um metroidvania.',
      status: 'in-development',
      guildName: 'Têmpera',
      platforms: ['PC', 'Web'],
      cover: { url: '/api/media/file/capa.png', alt: 'Capa' },
    })
  })

  it('tolerates an unpopulated guild and no platforms', () => {
    const card = toGameCard({ ...game, guild: 1, platforms: null, cover: null })

    expect(card.guildName).toBeNull()
    expect(card.platforms).toEqual([])
    expect(card.cover).toBeNull()
  })
})

describe('toArticleRow', () => {
  it('joins the authors and keeps the external link', () => {
    expect(toArticleRow(article)).toEqual({
      id: 3,
      title: 'Masmorras procedurais',
      url: 'https://doi.org/10.1/x',
      venue: 'SBGames 2026',
      authors: 'Ana Lima, Pedro Souza',
      date: '2026-09-01T00:00:00.000Z',
    })
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test tests/unit/presenters.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Crie `src/lib/presenters.ts`:

```ts
import type { Article, Game, Guild, Media } from '@/payload-types'
import { pluralize } from '@/utilities/pluralize'

import type { DevelopmentStatus, MediaView } from './views'

export type GuildCardView = {
  id: number
  name: string
  href: string
  focus: string
  initials: string
  logo: MediaView | null
  meta: string
}

export type GameCardView = {
  id: number
  title: string
  href: string
  synopsis: string
  status: DevelopmentStatus
  guildName: string | null
  platforms: string[]
  cover: MediaView | null
}

export type ArticleRowView = {
  id: number
  title: string
  url: string
  venue: string
  authors: string
  date: string
}

type Platform = NonNullable<Game['platforms']>[number]

const PLATFORM_LABELS: Record<Platform, string> = { pc: 'PC', web: 'Web', mobile: 'Mobile', console: 'Console' }

const countLines = (text: string | null | undefined): number =>
  (text ?? '').split('\n').filter((line) => line.trim()).length

export const toMediaView = (media: number | Media | null | undefined): MediaView | null =>
  typeof media === 'object' && media?.url ? { url: media.url, alt: media.alt } : null

export const toGuildCard = (guild: Guild, gameCount: number): GuildCardView => {
  const memberCount = countLines(guild.members)
  const meta = [pluralize(gameCount, 'jogo', 'jogos'), memberCount > 0 && pluralize(memberCount, 'membro', 'membros')]
    .filter(Boolean)
    .join('  ·  ')

  return {
    id: guild.id,
    name: guild.name,
    href: `/guildas/${guild.slug}`,
    focus: guild.shortDescription,
    initials: guild.name.slice(0, 2),
    logo: toMediaView(guild.logo),
    meta,
  }
}

export const toGameCard = (game: Game): GameCardView => ({
  id: game.id,
  title: game.title,
  href: `/jogos/${game.slug}`,
  synopsis: game.synopsis,
  status: game.developmentStatus,
  guildName: typeof game.guild === 'object' ? game.guild.name : null,
  platforms: (game.platforms ?? []).map((platform) => PLATFORM_LABELS[platform]),
  cover: toMediaView(game.cover),
})

export const toArticleRow = (article: Article): ArticleRowView => ({
  id: article.id,
  title: article.title,
  url: article.url ?? '',
  venue: article.venue,
  authors: article.authors.map((author) => author.name).join(', '),
  date: article.date,
})
```

O `url` do artigo é opcional nos tipos gerados (o campo usa `validate`, não `required`), mas a validação garante que ele sempre existe. Daí o `?? ''`.

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm test tests/unit/presenters.spec.ts && pnpm typecheck`
Expected: PASS e typecheck limpo.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: map Payload documents to landing view models"
```

---

### Task 6: Dados da landing

**Files:**
- Create: `src/lib/queries/landing.ts`
- Modify: `tests/helpers/fixtures.ts`
- Test: `tests/int/landing-data.spec.ts`

**Interfaces:**
- Consumes: presenters (Task 5), fixtures do Plano 1 (`createBaseFixture`, `createGuild`, `createGame`, `resetDatabase`, `getTestPayload`).
- Produces:
  - `type LandingStats = { guilds: number; games: number; articles: number }`
  - `type LandingData = { stats: LandingStats; guilds: GuildCardView[]; games: GameCardView[]; articles: ArticleRowView[] }`
  - `getLandingData(payload: Payload): Promise<LandingData>`: só conteúdo publicado; até 8 guildas por nome, os 3 jogos publicados mais recentes (`-publishedAt`) e os 3 artigos mais recentes (`-date`); os números contam tudo o que está publicado.
  - `createArticle(payload, overrides?)` em `tests/helpers/fixtures.ts`.

- [ ] **Step 1: Fixture de artigo**

Em `tests/helpers/fixtures.ts`, troque o import de tipos para `import type { Article, Game, Guild, User } from '@/payload-types'` e acrescente:

```ts
export const createArticle = (payload: Payload, overrides: Partial<Article> = {}): Promise<Article> =>
  payload.create({
    collection: 'articles',
    data: {
      title: 'Geração procedural de masmorras',
      description: 'Um estudo sobre geração de níveis.',
      authors: [{ name: 'Ana Lima' }],
      date: '2026-09-01T00:00:00.000Z',
      venue: 'SBGames 2026',
      url: 'https://doi.org/10.0000/exemplo',
      ...overrides,
    },
    overrideAccess: true,
  })
```

- [ ] **Step 2: Escrever os testes**

Crie `tests/int/landing-data.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { getLandingData } from '@/lib/queries/landing'

import {
  createArticle,
  createBaseFixture,
  createGame,
  createGuild,
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

describe('getLandingData', () => {
  it('returns empty sections and zero counts when nothing is published', async () => {
    expect(await getLandingData(payload)).toEqual({
      stats: { guilds: 0, games: 0, articles: 0 },
      guilds: [],
      games: [],
      articles: [],
    })
  })

  it('shows only published guilds and games to visitors', async () => {
    const { guildA } = await createBaseFixture(payload)
    await createGuild(payload, 'Rascunho', { _status: 'draft' })
    await createGame(payload, guildA.id)
    await createGame(payload, guildA.id, { title: 'Protótipo secreto', _status: 'draft' })

    const data = await getLandingData(payload)

    expect(data.stats).toEqual({ guilds: 2, games: 1, articles: 0 })
    expect(data.guilds.map((guild) => guild.name)).toEqual(['Aurora', 'Bigorna'])
    expect(data.games.map((game) => game.title)).toEqual(['Ecos de Ferro'])
  })

  it('counts published games per guild on the guild cards', async () => {
    const { guildA } = await createBaseFixture(payload)
    await createGame(payload, guildA.id)
    await createGame(payload, guildA.id, { title: 'Maré Baixa' })

    const { guilds } = await getLandingData(payload)

    expect(guilds.find((guild) => guild.name === 'Aurora')?.meta).toBe('2 jogos')
    expect(guilds.find((guild) => guild.name === 'Bigorna')?.meta).toBe('0 jogos')
  })

  it('features the three most recently published games', async () => {
    const { guildA } = await createBaseFixture(payload)
    for (const title of ['Primeiro', 'Segundo', 'Terceiro', 'Quarto']) {
      await createGame(payload, guildA.id, { title })
    }

    const { games, stats } = await getLandingData(payload)

    expect(stats.games).toBe(4)
    expect(games.map((game) => game.title)).toEqual(['Quarto', 'Terceiro', 'Segundo'])
    expect(games[0].guildName).toBe('Aurora')
  })

  it('lists the three most recent articles by publication date', async () => {
    await createArticle(payload, { title: 'Antigo', date: '2024-01-01T00:00:00.000Z' })
    await createArticle(payload, { title: 'Novo', date: '2026-06-01T00:00:00.000Z' })
    await createArticle(payload, { title: 'Médio', date: '2025-03-01T00:00:00.000Z' })
    await createArticle(payload, { title: 'Mais antigo', date: '2023-01-01T00:00:00.000Z' })

    const { articles, stats } = await getLandingData(payload)

    expect(stats.articles).toBe(4)
    expect(articles.map((article) => article.title)).toEqual(['Novo', 'Médio', 'Antigo'])
  })

  it('shows at most eight guilds, in alphabetical order', async () => {
    for (const name of ['Juno', 'Ímã', 'Hélio', 'Gama', 'Fênix', 'Eco', 'Delta', 'Cobre', 'Brasa']) {
      await createGuild(payload, name)
    }

    const { guilds, stats } = await getLandingData(payload)

    expect(stats.guilds).toBe(9)
    expect(guilds).toHaveLength(8)
    expect(guilds[0].name).toBe('Brasa')
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm test tests/int/landing-data.spec.ts`
Expected: FAIL (`@/lib/queries/landing` não existe).

- [ ] **Step 4: Implementar**

Crie `src/lib/queries/landing.ts`:

```ts
import type { Payload } from 'payload'

import {
  type ArticleRowView,
  type GameCardView,
  type GuildCardView,
  toArticleRow,
  toGameCard,
  toGuildCard,
} from '@/lib/presenters'

export type LandingStats = { guilds: number; games: number; articles: number }

export type LandingData = {
  stats: LandingStats
  guilds: GuildCardView[]
  games: GameCardView[]
  articles: ArticleRowView[]
}

const FEATURED_GUILDS = 8
const FEATURED_GAMES = 3
const RECENT_ARTICLES = 3

const asVisitor = { overrideAccess: false } as const

const countGamesByGuild = (games: Array<{ guild: number | { id: number } }>): Map<number, number> => {
  const counts = new Map<number, number>()
  for (const { guild } of games) {
    const guildId = typeof guild === 'object' ? guild.id : guild
    counts.set(guildId, (counts.get(guildId) ?? 0) + 1)
  }
  return counts
}

export const getLandingData = async (payload: Payload): Promise<LandingData> => {
  const [guilds, featuredGames, articles, allGames] = await Promise.all([
    payload.find({ collection: 'guilds', ...asVisitor, sort: 'name', limit: FEATURED_GUILDS, depth: 1 }),
    payload.find({ collection: 'games', ...asVisitor, sort: '-publishedAt', limit: FEATURED_GAMES, depth: 1 }),
    payload.find({ collection: 'articles', ...asVisitor, sort: '-date', limit: RECENT_ARTICLES, depth: 0 }),
    payload.find({ collection: 'games', ...asVisitor, pagination: false, depth: 0, select: { guild: true } }),
  ])
  const gamesByGuild = countGamesByGuild(allGames.docs)

  return {
    stats: { guilds: guilds.totalDocs, games: allGames.totalDocs, articles: articles.totalDocs },
    guilds: guilds.docs.map((guild) => toGuildCard(guild, gamesByGuild.get(guild.id) ?? 0)),
    games: featuredGames.docs.map(toGameCard),
    articles: articles.docs.map(toArticleRow),
  }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm test tests/int/landing-data.spec.ts && pnpm typecheck`
Expected: PASS e typecheck limpo.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: load published landing content as a visitor"
```

---

### Task 7: Animações reutilizáveis

**Files:**
- Create: `src/components/motion/tokens.ts`, `src/components/motion/MotionProvider.tsx`, `src/components/motion/Reveal.tsx`, `src/components/motion/RevealGroup.tsx`, `src/components/motion/CountUp.tsx`, `src/components/motion/Parallax.tsx`
- Modify: `package.json`, `tests/helpers/dom.ts`
- Test: `tests/components/motion.spec.tsx`, `tests/components/motion-preferences.spec.tsx`

**Interfaces:**
- Produces (todos Client Components, `'use client'`):
  - `FORGE_EASE`, `DURATION = { micro, enter, hero }`, `STAGGER`, `REVEAL_OFFSET` (`@/components/motion/tokens`)
  - `MotionProvider({ children })`: `MotionConfig reducedMotion="user"` com o easing do `DESIGN.md`.
  - `Reveal({ className?, delay?, children })`: fade e subida de 20px, uma vez, ao entrar na tela.
  - `RevealGroup({ as?: 'div' | 'ul' | 'ol', className?, label?, children })` e `RevealItem({ as?: 'div' | 'li', className?, children })`: stagger de 70ms.
  - `CountUp({ value, className? })`: conta de 0 até `value` ao entrar na tela; o valor final fica sempre disponível para leitores de tela; com movimento reduzido mostra o valor direto.
  - `Parallax({ distance?, className?, children })`: deslocamento vertical de até `distance` px (padrão 40) conforme o scroll; parado com movimento reduzido.

- [ ] **Step 1: Instalar o Motion**

```bash
pnpm add motion@13.4.4
```

- [ ] **Step 2: Escrever os testes**

Crie `tests/components/motion.spec.tsx`:

```tsx
// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CountUp } from '@/components/motion/CountUp'
import { Reveal } from '@/components/motion/Reveal'
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'

describe('Reveal', () => {
  it('renders its children', () => {
    render(
      <Reveal>
        <p>Conteúdo</p>
      </Reveal>,
    )
    expect(screen.getByText('Conteúdo')).toBeInTheDocument()
  })
})

describe('RevealGroup', () => {
  it('keeps list semantics for staggered lists', () => {
    render(
      <RevealGroup as="ul" label="Guildas">
        <RevealItem as="li">Aurora</RevealItem>
        <RevealItem as="li">Bigorna</RevealItem>
      </RevealGroup>,
    )

    const list = screen.getByRole('list', { name: 'Guildas' })
    expect(list.querySelectorAll('li')).toHaveLength(2)
  })
})

describe('CountUp', () => {
  it('always exposes the final value to screen readers', () => {
    render(<CountUp value={30} />)

    expect(screen.getByText('30', { selector: '.sr-only' })).toBeInTheDocument()
  })
})
```

Em `tests/helpers/dom.ts`, acrescente ao final um observador que dá tudo como visível (o padrão continua sendo o inerte):

```ts
export const mockVisibleIntersections = () => {
  globalThis.IntersectionObserver = class {
    constructor(private readonly callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      const entry = { isIntersecting: true, intersectionRatio: 1, target } as IntersectionObserverEntry
      this.callback([entry], this as unknown as IntersectionObserver)
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  } as unknown as typeof IntersectionObserver
}
```

Crie `tests/components/motion-preferences.spec.tsx`. Ele controla a preferência do usuário e espiona o `animate`, então cada teste falha se a checagem de movimento reduzido sumir:

```tsx
// @vitest-environment jsdom
import { mockVisibleIntersections } from '../helpers/dom'

import { render, screen } from '@testing-library/react'
import { animate } from 'motion/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CountUp } from '@/components/motion/CountUp'
import { Parallax } from '@/components/motion/Parallax'

const preferences = vi.hoisted(() => ({ reduceMotion: false }))

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()
  return {
    ...actual,
    useReducedMotion: () => preferences.reduceMotion,
    animate: vi.fn(() => ({ stop: () => {} })),
    useTransform: () => actual.motionValue(40),
  }
})

beforeEach(() => {
  vi.mocked(animate).mockClear()
  mockVisibleIntersections()
})

describe('CountUp', () => {
  it('counts up from zero once it is visible', () => {
    preferences.reduceMotion = false
    render(<CountUp value={30} />)

    expect(animate).toHaveBeenCalledWith(0, 30, expect.objectContaining({ duration: expect.any(Number) }))
  })

  it('shows the final number without counting when motion is reduced', () => {
    preferences.reduceMotion = true
    render(<CountUp value={30} />)

    expect(animate).not.toHaveBeenCalled()
    expect(screen.getByText('30', { selector: '[aria-hidden="true"]' })).toBeInTheDocument()
  })
})

describe('Parallax', () => {
  it('follows the scroll', () => {
    preferences.reduceMotion = false
    render(
      <Parallax>
        <span>Fagulhas</span>
      </Parallax>,
    )

    expect(screen.getByText('Fagulhas').parentElement?.style.transform).toContain('translateY(40px)')
  })

  it('stays still when motion is reduced', () => {
    preferences.reduceMotion = true
    render(
      <Parallax>
        <span>Fagulhas</span>
      </Parallax>,
    )

    expect(screen.getByText('Fagulhas').parentElement?.style.transform ?? '').not.toContain('translateY')
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm test tests/components/motion.spec.tsx tests/components/motion-preferences.spec.tsx`
Expected: FAIL (imports não resolvem).

- [ ] **Step 4: Implementar**

Crie `src/components/motion/tokens.ts`:

```ts
// DESIGN.md › Motion.
export const FORGE_EASE = [0.22, 1, 0.36, 1] as const

export const DURATION = { micro: 0.18, enter: 0.5, hero: 0.7 } as const

export const STAGGER = 0.07

export const REVEAL_OFFSET = 20
```

Crie `src/components/motion/MotionProvider.tsx`:

```tsx
'use client'

import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

import { DURATION, FORGE_EASE } from './tokens'

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: FORGE_EASE, duration: DURATION.enter }}>
      {children}
    </MotionConfig>
  )
}
```

Crie `src/components/motion/Reveal.tsx`:

```tsx
'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import { DURATION, REVEAL_OFFSET } from './tokens'

export const REVEAL_VIEWPORT = { once: true, amount: 0.2 } as const

type RevealProps = { className?: string; delay?: number; children: ReactNode }

export function Reveal({ className, delay = 0, children }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: REVEAL_OFFSET }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={{ duration: DURATION.enter, delay }}
    >
      {children}
    </motion.div>
  )
}
```

Crie `src/components/motion/RevealGroup.tsx`:

```tsx
'use client'

import { motion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

import { REVEAL_VIEWPORT } from './Reveal'
import { DURATION, REVEAL_OFFSET, STAGGER } from './tokens'

const groupVariants: Variants = { hidden: {}, visible: { transition: { staggerChildren: STAGGER } } }

const itemVariants: Variants = {
  hidden: { opacity: 0, y: REVEAL_OFFSET },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.enter } },
}

const GROUP_TAGS = { div: motion.div, ul: motion.ul, ol: motion.ol }
const ITEM_TAGS = { div: motion.div, li: motion.li }

type RevealGroupProps = { as?: keyof typeof GROUP_TAGS; className?: string; label?: string; children: ReactNode }

export function RevealGroup({ as = 'div', className, label, children }: RevealGroupProps) {
  const Group = GROUP_TAGS[as] as typeof motion.div

  return (
    <Group
      aria-label={label}
      className={className}
      variants={groupVariants}
      initial="hidden"
      whileInView="visible"
      viewport={REVEAL_VIEWPORT}
    >
      {children}
    </Group>
  )
}

type RevealItemProps = { as?: keyof typeof ITEM_TAGS; className?: string; children: ReactNode }

export function RevealItem({ as = 'div', className, children }: RevealItemProps) {
  const Item = ITEM_TAGS[as] as typeof motion.div

  return (
    <Item className={className} variants={itemVariants}>
      {children}
    </Item>
  )
}
```

Crie `src/components/motion/CountUp.tsx`:

```tsx
'use client'

import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { FORGE_EASE } from './tokens'

const COUNT_DURATION = 1.2

export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.6 })
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    if (!isInView || reduceMotion) return
    const controls = animate(0, value, {
      duration: COUNT_DURATION,
      ease: FORGE_EASE,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    })
    return () => controls.stop()
  }, [isInView, reduceMotion, value])

  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true">{display}</span>
      <span className="sr-only">{value}</span>
    </span>
  )
}
```

Crie `src/components/motion/Parallax.tsx`:

```tsx
'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { type ReactNode, useRef } from 'react'

type ParallaxProps = { distance?: number; className?: string; children: ReactNode }

export function Parallax({ distance = 40, className, children }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, distance])

  return (
    <motion.div ref={ref} style={reduceMotion ? undefined : { y }} className={className}>
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm test tests/components/motion.spec.tsx tests/components/motion-preferences.spec.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
pnpm typecheck && pnpm lint
git add -A
git commit -m "feat: add reusable reveal, count-up and parallax motion"
```

---

### Task 8: Cabeçalho, menu mobile e rodapé

**Files:**
- Create: `src/config/site.ts`, `src/components/layout/SiteHeader.tsx`, `src/components/layout/MobileMenu.tsx`, `src/components/layout/SiteFooter.tsx`
- Modify: `src/app/(frontend)/layout.tsx`
- Test: `tests/components/layout.spec.tsx`

**Interfaces:**
- Consumes: `ButtonLink`, `Container`, `Logo`, `MotionProvider`, `cx`.
- Produces:
  - `siteConfig = { name, tagline, description, email, nav: NavItem[], cta: NavItem, social: NavItem[] }`, com `type NavItem = { label: string; href: string }`
  - `SiteHeader()` (Server Component), com link "Pular para o conteúdo" para `#conteudo`
  - `MobileMenu()` (Client Component): botão com `aria-expanded`/`aria-controls="menu-mobile"`; fecha com Esc e ao escolher um link.
  - `SiteFooter()`
  - O layout passa a envolver tudo em `MotionProvider` e renderiza `<main id="conteudo">`.

- [ ] **Step 1: Escrever os testes**

Crie `tests/components/layout.spec.tsx`:

```tsx
// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { MobileMenu } from '@/components/layout/MobileMenu'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { siteConfig } from '@/config/site'

describe('SiteHeader', () => {
  it('offers a skip link to the main content', () => {
    render(<SiteHeader />)
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute('href', '#conteudo')
  })

  it('links every section of the main navigation and the call to action', () => {
    render(<SiteHeader />)

    const nav = screen.getByRole('navigation', { name: 'Principal' })
    for (const item of siteConfig.nav) {
      expect(nav.querySelector(`a[href="${item.href}"]`)).toHaveTextContent(item.label)
    }
    expect(screen.getAllByRole('link', { name: siteConfig.cta.label })[0]).toHaveAttribute('href', siteConfig.cta.href)
  })
})

describe('MobileMenu', () => {
  it('opens and closes with the button, announcing its state', async () => {
    const user = userEvent.setup()
    render(<MobileMenu />)
    const toggle = screen.getByRole('button', { name: 'Abrir menu' })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)

    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'Jogos' })).toBeInTheDocument()
  })

  it('closes with Escape', async () => {
    const user = userEvent.setup()
    render(<MobileMenu />)

    await user.click(screen.getByRole('button', { name: 'Abrir menu' }))
    await user.keyboard('{Escape}')

    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('SiteFooter', () => {
  it('shows the contact e-mail as a mailto link', () => {
    render(<SiteFooter />)
    expect(screen.getByRole('link', { name: siteConfig.email })).toHaveAttribute('href', `mailto:${siteConfig.email}`)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test tests/components/layout.spec.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Crie `src/config/site.ts`:

```ts
export type NavItem = { label: string; href: string }

// Contact and social links are placeholders until the Forja confirms the official ones.
export const siteConfig = {
  name: 'Forja',
  tagline: 'Iniciativa de desenvolvimento de jogos do CESAR.',
  description: 'Guildas de alunos do CESAR pesquisando, prototipando e lançando jogos.',
  email: 'forja@exemplo.com',
  nav: [
    { label: 'Guildas', href: '/guildas' },
    { label: 'Jogos', href: '/jogos' },
    { label: 'Artigos', href: '/artigos' },
    { label: 'Sobre', href: '/#sobre' },
  ] satisfies NavItem[],
  cta: { label: 'Participe', href: '/#como-funciona' } satisfies NavItem,
  social: [
    { label: 'Instagram', href: 'https://www.instagram.com/' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
  ] satisfies NavItem[],
}
```

Crie `src/components/layout/MobileMenu.tsx`:

```tsx
'use client'

import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { ButtonLink } from '@/components/ui/ButtonLink'
import { siteConfig } from '@/config/site'
import { cx } from '@/utilities/cx'

const BAR = 'h-0.5 w-[22px] bg-on-surface transition-transform duration-200 ease-forge'

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const close = () => setIsOpen(false)

  useEffect(() => {
    if (!isOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="menu-mobile"
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
        onClick={() => setIsOpen((open) => !open)}
        className="flex size-11 flex-col items-center justify-center gap-[5px]"
      >
        <span className={cx(BAR, isOpen && 'translate-y-[7px] rotate-45')} />
        <span className={cx(BAR, isOpen && 'opacity-0')} />
        <span className={cx(BAR, isOpen && '-translate-y-[7px] -rotate-45')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.nav
            id="menu-mobile"
            aria-label="Principal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col gap-2xl bg-neutral px-margin-mobile py-2xl"
          >
            <ul className="flex flex-col gap-lg">
              {siteConfig.nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={close} className="type-headline-md">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ButtonLink href={siteConfig.cta.href} onClick={close} className="w-full">
              {siteConfig.cta.label}
            </ButtonLink>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  )
}
```

Crie `src/components/layout/SiteHeader.tsx`:

```tsx
import Link from 'next/link'

import { Logo } from '@/components/brand/Logo'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Container } from '@/components/ui/Container'
import { siteConfig } from '@/config/site'

import { MobileMenu } from './MobileMenu'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-outline bg-neutral/85 backdrop-blur-md">
      <a
        href="#conteudo"
        className="type-button sr-only focus:not-sr-only focus:absolute focus:left-md focus:top-md focus:z-50 focus:bg-primary focus:px-md focus:py-sm"
      >
        Pular para o conteúdo
      </a>
      <Container className="flex h-16 items-center justify-between md:h-[76px]">
        <Link href="/" aria-label="Forja — página inicial">
          <Logo priority className="w-[92px] md:w-[120px]" />
        </Link>
        <nav aria-label="Principal" className="max-md:hidden">
          <ul className="flex gap-xl">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="type-nav-link text-on-surface-variant transition-colors duration-200 hover:text-on-surface"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <ButtonLink href={siteConfig.cta.href} size="sm" className="max-md:hidden">
          {siteConfig.cta.label}
        </ButtonLink>
        <MobileMenu />
      </Container>
    </header>
  )
}
```

Crie `src/components/layout/SiteFooter.tsx`:

```tsx
import Link from 'next/link'

import { Logo } from '@/components/brand/Logo'
import { Container } from '@/components/ui/Container'
import { type NavItem, siteConfig } from '@/config/site'
import { isExternalHref } from '@/utilities/url'

function FooterColumn({ title, links }: { title: string; links: NavItem[] }) {
  return (
    <div className="flex flex-col gap-md">
      <p className="type-label-mono-sm text-on-surface-muted">{title}</p>
      <ul className="flex flex-col gap-sm">
        {links.map((link) => (
          <li key={link.href}>
            {isExternalHref(link.href) ? (
              <a href={link.href} className="type-body-sm text-on-surface-variant hover:text-on-surface">
                {link.label}
              </a>
            ) : (
              <Link href={link.href} className="type-body-sm text-on-surface-variant hover:text-on-surface">
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-outline">
      <Container className="flex flex-col gap-2xl py-3xl">
        <div className="flex flex-col gap-2xl md:flex-row md:justify-between">
          <div className="flex flex-col gap-md">
            <Logo className="w-40" />
            <p className="type-body-sm text-on-surface-variant">{siteConfig.tagline}</p>
          </div>
          <div className="grid grid-cols-2 gap-xl sm:grid-cols-3 md:gap-2xl">
            <FooterColumn title="Navegação" links={siteConfig.nav} />
            <FooterColumn title="Redes" links={siteConfig.social} />
            <FooterColumn title="Contato" links={[{ label: siteConfig.email, href: `mailto:${siteConfig.email}` }]} />
          </div>
        </div>
        <div className="flex flex-col gap-sm md:flex-row md:justify-between">
          <p className="type-label-mono-sm text-on-surface-muted">© {year} Forja | CESAR</p>
          <p className="type-label-mono-sm text-on-surface-muted">Feito pelos alunos, mantido pela comunidade</p>
        </div>
      </Container>
    </footer>
  )
}
```

Em `src/app/(frontend)/layout.tsx`, troque o `body` por:

```tsx
      <body>
        <MotionProvider>
          <SiteHeader />
          <main id="conteudo">{children}</main>
          <SiteFooter />
        </MotionProvider>
      </body>
```

com os imports:

```tsx
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { MotionProvider } from '@/components/motion/MotionProvider'
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm test tests/components/layout.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
pnpm typecheck && pnpm lint
git add -A
git commit -m "feat: add site header, mobile menu and footer"
```

---

### Task 9: Seções da landing e a página `/`

**Files:**
- Create: `src/content/landing.ts`, `src/components/ui/Section.tsx`, `src/components/ui/SectionHeader.tsx`, `src/components/ui/Stat.tsx`, `src/components/landing/Hero.tsx`, `src/components/landing/HeroBackdrop.tsx`, `src/components/landing/HeroContent.tsx`, `src/components/landing/AboutSection.tsx`, `src/components/landing/HowItWorksSection.tsx`, `src/components/landing/GuildCard.tsx`, `src/components/landing/GuildsSection.tsx`, `src/components/landing/GameCard.tsx`, `src/components/landing/FeaturedGamesSection.tsx`, `src/components/landing/ArticleRow.tsx`, `src/components/landing/RecentArticlesSection.tsx`, `src/components/landing/SupportSection.tsx`, `src/components/landing/EmptyState.tsx`
- Modify: `src/app/(frontend)/page.tsx`
- Test: `tests/components/landing.spec.tsx`

**Interfaces:**
- Consumes: tudo das Tarefas 2–8; `getLandingData` (Task 6); `siteConfig` (Task 8).
- Produces:
  - `landingCopy` (`@/content/landing`): textos fixos da landing, em português.
  - `Section({ id, labelledBy, className?, children })`, `SectionHeader({ id, number, eyebrow, title, link? })`, `Stat({ value, label })`, `EmptyState({ children })`
  - Seções: `Hero({ guildCount })`, `AboutSection({ stats })`, `HowItWorksSection()`, `GuildsSection({ guilds })`, `FeaturedGamesSection({ games })`, `RecentArticlesSection({ articles })`, `SupportSection()`.
  - Âncoras: `#sobre`, `#como-funciona`, `#guildas`, `#jogos`, `#artigos`, `#apoie`.
  - `page.tsx` com `export const revalidate = 60`. Revalidação na hora da publicação é do Plano 3.

- [ ] **Step 1: Textos**

Crie `src/content/landing.ts`:

```ts
export const landingCopy = {
  hero: {
    eyebrow: 'Iniciativa de desenvolvimento de jogos · CESAR',
    firstLine: 'Onde jogos',
    secondLine: 'São',
    accent: 'forjados.',
    subtitle:
      'Guildas de alunos pesquisando, prototipando e lançando jogos. Entre para uma, construa seu portfólio e publique o que você cria.',
    primaryAction: { label: 'Entre para uma guilda', href: '/#como-funciona' },
    secondaryAction: { label: 'Ver jogos', href: '/jogos' },
    pillars: ['jogos', 'pesquisa', 'artigos'],
  },
  about: {
    eyebrow: 'O que é a Forja',
    title: 'Uma iniciativa\nfeita por alunos.',
    lead: 'A Forja é a iniciativa de desenvolvimento de jogos do CESAR. Alunos se organizam em guildas, times que pesquisam, prototipam e lançam jogos ao longo dos períodos, com orientação de professores.',
    detail: 'Além dos jogos, as guildas produzem pesquisa: artigos publicados em revistas e eventos da área.',
    stats: { guilds: 'Guildas', games: 'Jogos', articles: 'Artigos' },
  },
  howItWorks: {
    eyebrow: 'Como funciona',
    title: 'Da seleção\nao jogo publicado.',
    steps: [
      {
        title: 'Seleção',
        text: 'A Forja abre seleção para novos membros. Fique de olho no Instagram para as datas.',
        note: 'Processo a definir',
      },
      {
        title: 'Guilda',
        text: 'Você entra em um time com foco próprio (narrativa, gameplay, arte, tecnologia) e trabalha com gente de vários cursos.',
      },
      {
        title: 'Publique',
        text: 'Jogos vão para a itch.io, pesquisas viram artigos, e tudo ganha uma página aqui no site.',
      },
    ],
  },
  guilds: {
    eyebrow: 'Guildas',
    title: 'Encontre\nsua guilda.',
    link: 'Ver todas as guildas',
    empty: 'As guildas aparecem aqui assim que forem publicadas.',
  },
  games: {
    eyebrow: 'Jogos em destaque',
    title: 'Feito nas\nguildas.',
    link: 'Ver todos os jogos',
    empty: 'Os primeiros jogos estão sendo forjados. Volte em breve.',
  },
  articles: {
    eyebrow: 'Pesquisa',
    title: 'Artigos\nrecentes.',
    link: 'Ver todos os artigos',
    readLabel: 'Ler publicação',
    empty: 'Os artigos das guildas aparecem aqui quando forem publicados.',
  },
  support: {
    eyebrow: 'Apoie a Forja',
    title: 'Quer ajudar\na forjar?',
    text: 'Patrocínio, mentoria, espaço, equipamento ou horas de trabalho voluntário. Toda ajuda move as guildas e chega direto nos projetos dos alunos.',
    action: 'Fale com a gente',
  },
}
```

- [ ] **Step 2: Escrever os testes das seções**

Crie `tests/components/landing.spec.tsx`:

```tsx
// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AboutSection } from '@/components/landing/AboutSection'
import { FeaturedGamesSection } from '@/components/landing/FeaturedGamesSection'
import { GuildsSection } from '@/components/landing/GuildsSection'
import { Hero } from '@/components/landing/Hero'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { RecentArticlesSection } from '@/components/landing/RecentArticlesSection'
import { SupportSection } from '@/components/landing/SupportSection'
import { siteConfig } from '@/config/site'
import type { ArticleRowView, GameCardView, GuildCardView } from '@/lib/presenters'

const guild: GuildCardView = {
  id: 1,
  name: 'Aurora',
  href: '/guildas/aurora',
  focus: 'Narrativa e jogos de exploração.',
  initials: 'Au',
  logo: null,
  meta: '3 jogos',
}

const game: GameCardView = {
  id: 1,
  title: 'Ecos de Ferro',
  href: '/jogos/ecos-de-ferro',
  synopsis: 'Um metroidvania.',
  status: 'in-development',
  guildName: 'Aurora',
  platforms: ['PC', 'Web'],
  cover: null,
}

const article: ArticleRowView = {
  id: 1,
  title: 'Masmorras procedurais',
  url: 'https://doi.org/10.1/x',
  venue: 'SBGames 2026',
  authors: 'Ana Lima, Pedro Souza',
  date: '2026-09-01T00:00:00.000Z',
}

describe('Hero', () => {
  it('announces the Forja tagline as the page heading', () => {
    render(<Hero guildCount={8} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Onde jogos São forjados.' })).toBeInTheDocument()
  })

  it('shows the live guild count and both calls to action', () => {
    render(<Hero guildCount={8} />)

    expect(screen.getByText(/8 guildas/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Entre para uma guilda' })).toHaveAttribute('href', '/#como-funciona')
    expect(screen.getByRole('link', { name: 'Ver jogos' })).toHaveAttribute('href', '/jogos')
  })
})

describe('AboutSection', () => {
  it('shows the published counts, including zero', () => {
    render(<AboutSection stats={{ guilds: 8, games: 0, articles: 3 }} />)

    const stats = screen.getByRole('list', { name: 'A Forja em números' })
    expect(stats).toHaveTextContent('8')
    expect(stats).toHaveTextContent('0')
    expect(stats).toHaveTextContent('3')
  })
})

describe('HowItWorksSection', () => {
  it('lists the three steps in order and flags the undefined selection process', () => {
    render(<HowItWorksSection />)

    const steps = screen.getByRole('list', { name: 'Etapas' })
    expect(steps.tagName).toBe('OL')
    expect(steps.querySelectorAll('li')).toHaveLength(3)
    expect(screen.getByText('Processo a definir')).toBeInTheDocument()
  })
})

describe('GuildsSection', () => {
  it('links each guild card to its page', () => {
    render(<GuildsSection guilds={[guild]} />)
    expect(screen.getByRole('link', { name: 'Aurora' })).toHaveAttribute('href', '/guildas/aurora')
    expect(screen.getByRole('link', { name: 'Ver todas as guildas' })).toHaveAttribute('href', '/guildas')
  })

  it('shows an empty state instead of an empty grid', () => {
    render(<GuildsSection guilds={[]} />)
    expect(screen.getByText('As guildas aparecem aqui assim que forem publicadas.')).toBeInTheDocument()
  })
})

describe('FeaturedGamesSection', () => {
  it('shows status, guild and platforms for each game', () => {
    render(<FeaturedGamesSection games={[game]} />)

    expect(screen.getByRole('link', { name: 'Ecos de Ferro' })).toHaveAttribute('href', '/jogos/ecos-de-ferro')
    expect(screen.getByText('Em desenvolvimento')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Guilda e plataformas' })).toHaveTextContent('AuroraPCWeb')
  })

  it('shows an empty state when no game is published', () => {
    render(<FeaturedGamesSection games={[]} />)
    expect(screen.getByText('Os primeiros jogos estão sendo forjados. Volte em breve.')).toBeInTheDocument()
  })
})

describe('RecentArticlesSection', () => {
  it('links each article to the external publication in a new tab', () => {
    render(<RecentArticlesSection articles={[article]} />)

    const link = screen.getByRole('link', { name: 'Masmorras procedurais' })
    expect(link).toHaveAttribute('href', 'https://doi.org/10.1/x')
    expect(link).toHaveAttribute('target', '_blank')
    expect(screen.getByText('Ana Lima, Pedro Souza')).toBeInTheDocument()
  })

  it('shows an empty state when there are no articles', () => {
    render(<RecentArticlesSection articles={[]} />)
    expect(screen.getByText('Os artigos das guildas aparecem aqui quando forem publicados.')).toBeInTheDocument()
  })
})

describe('SupportSection', () => {
  it('points supporters to the contact e-mail', () => {
    render(<SupportSection />)
    expect(screen.getByRole('link', { name: 'Fale com a gente' })).toHaveAttribute('href', `mailto:${siteConfig.email}`)
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm test tests/components/landing.spec.tsx`
Expected: FAIL.

- [ ] **Step 4: Blocos de seção**

Crie `src/components/ui/Section.tsx`:

```tsx
import type { ReactNode } from 'react'

import { cx } from '@/utilities/cx'

import { Container } from './Container'

type SectionProps = { id: string; labelledBy: string; className?: string; children: ReactNode }

export function Section({ id, labelledBy, className, children }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cx('scroll-mt-20 border-t border-divider py-section-mobile md:py-section', className)}
    >
      <Container>{children}</Container>
    </section>
  )
}
```

Crie `src/components/ui/SectionHeader.tsx`:

```tsx
import { Reveal } from '@/components/motion/Reveal'

import { ArrowLink } from './ArrowLink'
import { Eyebrow } from './Eyebrow'
import { LineBreaks } from './LineBreaks'

type SectionHeaderProps = {
  id: string
  number: string
  eyebrow: string
  title: string
  link?: { href: string; label: string }
}

export function SectionHeader({ id, number, eyebrow, title, link }: SectionHeaderProps) {
  return (
    <Reveal className="mb-2xl flex flex-col gap-lg md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-md">
        <Eyebrow>
          {number} / {eyebrow}
        </Eyebrow>
        <h2 id={id} className="type-headline-lg-mobile md:type-headline-lg">
          <LineBreaks text={title} />
        </h2>
      </div>
      {link && <ArrowLink href={link.href}>{link.label}</ArrowLink>}
    </Reveal>
  )
}
```

Crie `src/components/ui/Stat.tsx`:

```tsx
import { CountUp } from '@/components/motion/CountUp'

export function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-sm border-l border-outline-strong px-md md:px-lg">
      <CountUp value={value} className="type-stat-mobile md:type-stat" />
      <span className="type-label-mono text-on-surface-variant">{label}</span>
    </div>
  )
}
```

Crie `src/components/landing/EmptyState.tsx`:

```tsx
import type { ReactNode } from 'react'

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="type-body-lg border border-dashed border-outline-strong p-xl text-on-surface-variant">{children}</p>
}
```

- [ ] **Step 5: Hero**

Crie `src/components/landing/HeroBackdrop.tsx`:

```tsx
'use client'

import { motion } from 'motion/react'

import { DiagonalBands } from '@/components/brand/DiagonalBands'
import { SHARD_POLYGONS } from '@/components/brand/Shards'
import { Parallax } from '@/components/motion/Parallax'
import { DURATION } from '@/components/motion/tokens'

// DESIGN.md › Motion › Hero: sparks strike in diagonally, then the bands slide in.
const SHARD_STAGGER = 0.08
const BANDS_DELAY = 0.25

export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, x: -160 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: DURATION.hero, delay: BANDS_DELAY }}
      >
        <DiagonalBands />
      </motion.div>
      <Parallax className="absolute right-[-10%] top-[4%] w-[60%] max-w-[640px] md:right-[-2%] md:top-[12%] md:w-[44%]">
        <svg viewBox="0 0 272 283" fill="currentColor" focusable="false" className="w-full text-primary">
          {SHARD_POLYGONS.map((points, index) => (
            <motion.polygon
              key={points}
              points={points}
              initial={{ opacity: 0, x: -60, y: 60, scale: 1.08 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              transition={{ duration: DURATION.hero, delay: index * SHARD_STAGGER }}
            />
          ))}
        </svg>
      </Parallax>
    </div>
  )
}
```

Crie `src/components/landing/HeroContent.tsx`:

```tsx
'use client'

import { motion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

import { DURATION } from '@/components/motion/tokens'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { landingCopy } from '@/content/landing'

// DESIGN.md › Motion › Hero: lines rise through a mask, the accent lights up last, then the rest fades in.
const TITLE_DELAY = 0.35
const LINE_STAGGER = 0.12
const ACCENT_DELAY = 0.55
const DETAILS_DELAY = 0.9

const lineVariants: Variants = {
  hidden: { y: '105%' },
  visible: { y: '0%', transition: { duration: DURATION.hero } },
}

const accentVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { delay: ACCENT_DELAY, duration: DURATION.micro * 2 } },
}

function MaskedLine({ children }: { children: ReactNode }) {
  return (
    <span className="block overflow-hidden pb-[0.04em]">
      <motion.span className="block" variants={lineVariants}>
        {children}
      </motion.span>
    </span>
  )
}

function Accent({ children }: { children: string }) {
  return (
    <span className="relative inline-block">
      {children}
      <motion.span aria-hidden="true" className="absolute inset-0 text-primary" variants={accentVariants}>
        {children}
      </motion.span>
    </span>
  )
}

export function HeroContent({ guildCount }: { guildCount: number }) {
  const { hero } = landingCopy
  const pillars = [`${guildCount} guildas`, ...hero.pillars].join('  |  ')

  return (
    <div className="flex flex-col gap-lg">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Eyebrow>{hero.eyebrow}</Eyebrow>
      </motion.div>
      <motion.h1
        id="hero-title"
        className="type-display-mobile lg:type-display-xl"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: LINE_STAGGER, delayChildren: TITLE_DELAY }}
      >
        <MaskedLine>{hero.firstLine}</MaskedLine>{' '}
        <MaskedLine>
          {hero.secondLine} <Accent>{hero.accent}</Accent>
        </MaskedLine>
      </motion.h1>
      <motion.div
        className="flex flex-col gap-lg"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: DETAILS_DELAY }}
      >
        <p className="type-body-lg max-w-[540px] text-on-surface-variant">{hero.subtitle}</p>
        <div className="flex flex-col gap-md md:flex-row">
          <ButtonLink href={hero.primaryAction.href}>{hero.primaryAction.label}</ButtonLink>
          <ButtonLink href={hero.secondaryAction.href} variant="secondary" arrow>
            {hero.secondaryAction.label}
          </ButtonLink>
        </div>
        <p className="type-label-mono text-on-surface-muted">{pillars}</p>
      </motion.div>
    </div>
  )
}
```

Crie `src/components/landing/Hero.tsx`:

```tsx
import { Container } from '@/components/ui/Container'

import { HeroBackdrop } from './HeroBackdrop'
import { HeroContent } from './HeroContent'

export function Hero({ guildCount }: { guildCount: number }) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      <HeroBackdrop />
      <Container className="flex min-h-[calc(100svh-4rem)] flex-col justify-end pb-section-mobile pt-[45vw] md:justify-center md:pt-section lg:min-h-[784px]">
        <HeroContent guildCount={guildCount} />
      </Container>
    </section>
  )
}
```

- [ ] **Step 6: Seções 01 a 06**

Crie `src/components/landing/AboutSection.tsx`:

```tsx
import { Reveal } from '@/components/motion/Reveal'
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'
import { Section } from '@/components/ui/Section'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Stat } from '@/components/ui/Stat'
import { landingCopy } from '@/content/landing'
import type { LandingStats } from '@/lib/queries/landing'

export function AboutSection({ stats }: { stats: LandingStats }) {
  const { about } = landingCopy

  return (
    <Section id="sobre" labelledBy="sobre-title">
      <SectionHeader id="sobre-title" number="01" eyebrow={about.eyebrow} title={about.title} />
      <div className="grid gap-2xl md:grid-cols-2">
        <Reveal className="flex max-w-[560px] flex-col gap-md">
          <p className="type-body-lg">{about.lead}</p>
          <p className="type-body-lg text-on-surface-variant">{about.detail}</p>
        </Reveal>
        <RevealGroup as="ul" label="A Forja em números" className="grid grid-cols-3 self-start">
          <RevealItem as="li">
            <Stat value={stats.guilds} label={about.stats.guilds} />
          </RevealItem>
          <RevealItem as="li">
            <Stat value={stats.games} label={about.stats.games} />
          </RevealItem>
          <RevealItem as="li">
            <Stat value={stats.articles} label={about.stats.articles} />
          </RevealItem>
        </RevealGroup>
      </div>
    </Section>
  )
}
```

Crie `src/components/landing/HowItWorksSection.tsx`:

```tsx
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'
import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { landingCopy } from '@/content/landing'

export function HowItWorksSection() {
  const { howItWorks } = landingCopy

  return (
    <Section id="como-funciona" labelledBy="como-funciona-title">
      <SectionHeader id="como-funciona-title" number="02" eyebrow={howItWorks.eyebrow} title={howItWorks.title} />
      <RevealGroup as="ol" label="Etapas" className="grid gap-md md:grid-cols-3 md:gap-lg">
        {howItWorks.steps.map((step, index) => (
          <RevealItem as="li" key={step.title}>
            <Card className="h-full">
              <div className="flex flex-col gap-md p-xl">
                <span aria-hidden="true" className="type-headline-lg text-primary">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="type-headline-md">{step.title}</h3>
                <p className="type-body-md text-on-surface-variant">{step.text}</p>
                {'note' in step && <p className="type-label-mono-sm text-primary-text">{step.note}</p>}
              </div>
            </Card>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  )
}
```

Crie `src/components/landing/GuildCard.tsx`:

```tsx
import { Card, CardLink } from '@/components/ui/Card'
import { GuildAvatar } from '@/components/ui/GuildAvatar'
import type { GuildCardView } from '@/lib/presenters'

export function GuildCard({ guild }: { guild: GuildCardView }) {
  return (
    <Card className="h-full">
      <div className="flex items-center gap-md p-md md:flex-col md:items-start md:gap-lg md:p-lg">
        <GuildAvatar initials={guild.initials} logo={guild.logo} />
        <div className="flex min-w-0 flex-1 flex-col gap-xs">
          <h3 className="type-headline-sm break-words md:type-headline-md">
            <CardLink href={guild.href}>{guild.name}</CardLink>
          </h3>
          <p className="type-body-sm text-on-surface-muted">{guild.focus}</p>
        </div>
        <p className="type-label-mono-sm text-on-surface-muted max-md:hidden">{guild.meta}</p>
        <span aria-hidden="true" className="text-on-surface-variant md:hidden">
          →
        </span>
      </div>
    </Card>
  )
}
```

Crie `src/components/landing/GuildsSection.tsx`:

```tsx
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'
import { Section } from '@/components/ui/Section'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { landingCopy } from '@/content/landing'
import type { GuildCardView } from '@/lib/presenters'
import { cx } from '@/utilities/cx'

import { EmptyState } from './EmptyState'
import { GuildCard } from './GuildCard'

const GUILDS_ON_MOBILE = 4

export function GuildsSection({ guilds }: { guilds: GuildCardView[] }) {
  const copy = landingCopy.guilds

  return (
    <Section id="guildas" labelledBy="guildas-title">
      <SectionHeader
        id="guildas-title"
        number="03"
        eyebrow={copy.eyebrow}
        title={copy.title}
        link={{ href: '/guildas', label: copy.link }}
      />
      {guilds.length === 0 ? (
        <EmptyState>{copy.empty}</EmptyState>
      ) : (
        <RevealGroup as="ul" className="grid gap-md md:grid-cols-2 md:gap-lg lg:grid-cols-4">
          {guilds.map((guild, index) => (
            <RevealItem as="li" key={guild.id} className={cx(index >= GUILDS_ON_MOBILE && 'max-md:hidden')}>
              <GuildCard guild={guild} />
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </Section>
  )
}
```

Crie `src/components/landing/GameCard.tsx`:

```tsx
import { Card, CardLink } from '@/components/ui/Card'
import { ChipList } from '@/components/ui/ChipList'
import { Cover } from '@/components/ui/Cover'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { GameCardView } from '@/lib/presenters'

export function GameCard({ game }: { game: GameCardView }) {
  const tags = [game.guildName, ...game.platforms].filter((tag): tag is string => Boolean(tag))

  return (
    <Card className="h-full">
      <Cover image={game.cover} ratio="video" sizes="(min-width: 768px) 33vw, 85vw" />
      <div className="flex flex-1 flex-col gap-md p-lg">
        <StatusBadge status={game.status} />
        <h3 className="type-headline-md break-words">
          <CardLink href={game.href}>{game.title}</CardLink>
        </h3>
        <p className="type-body-sm text-on-surface-variant">{game.synopsis}</p>
        {tags.length > 0 && <ChipList label="Guilda e plataformas" items={tags} className="mt-auto" />}
      </div>
    </Card>
  )
}
```

Crie `src/components/landing/FeaturedGamesSection.tsx`:

```tsx
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'
import { Section } from '@/components/ui/Section'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { landingCopy } from '@/content/landing'
import type { GameCardView } from '@/lib/presenters'

import { EmptyState } from './EmptyState'
import { GameCard } from './GameCard'

export function FeaturedGamesSection({ games }: { games: GameCardView[] }) {
  const copy = landingCopy.games

  return (
    <Section id="jogos" labelledBy="jogos-title">
      <SectionHeader
        id="jogos-title"
        number="04"
        eyebrow={copy.eyebrow}
        title={copy.title}
        link={{ href: '/jogos', label: copy.link }}
      />
      {games.length === 0 ? (
        <EmptyState>{copy.empty}</EmptyState>
      ) : (
        <RevealGroup
          as="ul"
          className="-mx-margin-mobile flex snap-x snap-mandatory gap-md overflow-x-auto px-margin-mobile pb-md md:mx-0 md:grid md:grid-cols-3 md:gap-lg md:overflow-visible md:px-0 md:pb-0"
        >
          {games.map((game) => (
            <RevealItem as="li" key={game.id} className="w-[85%] shrink-0 snap-start md:w-auto">
              <GameCard game={game} />
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </Section>
  )
}
```

Crie `src/components/landing/ArticleRow.tsx`:

```tsx
import { Arrow } from '@/components/ui/Arrow'
import { landingCopy } from '@/content/landing'
import type { ArticleRowView } from '@/lib/presenters'

export function ArticleRow({ article }: { article: ArticleRowView }) {
  return (
    <article className="group relative flex flex-col gap-sm border-b border-outline py-lg md:flex-row md:items-center md:gap-2xl md:py-xl">
      <p className="type-label-mono text-primary-text md:w-[220px] md:shrink-0">{article.venue}</p>
      <div className="flex min-w-0 flex-1 flex-col gap-sm">
        <h3 className="type-headline-sm break-words md:type-title-list">
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="after:absolute after:inset-0">
            {article.title}
          </a>
        </h3>
        <p className="type-body-sm text-on-surface-muted">{article.authors}</p>
      </div>
      <span aria-hidden="true" className="type-button inline-flex items-center gap-sm md:shrink-0">
        {landingCopy.articles.readLabel}
        <Arrow external />
      </span>
    </article>
  )
}
```

Crie `src/components/landing/RecentArticlesSection.tsx`:

```tsx
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'
import { Section } from '@/components/ui/Section'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { landingCopy } from '@/content/landing'
import type { ArticleRowView } from '@/lib/presenters'

import { ArticleRow } from './ArticleRow'
import { EmptyState } from './EmptyState'

export function RecentArticlesSection({ articles }: { articles: ArticleRowView[] }) {
  const copy = landingCopy.articles

  return (
    <Section id="artigos" labelledBy="artigos-title">
      <SectionHeader
        id="artigos-title"
        number="05"
        eyebrow={copy.eyebrow}
        title={copy.title}
        link={{ href: '/artigos', label: copy.link }}
      />
      {articles.length === 0 ? (
        <EmptyState>{copy.empty}</EmptyState>
      ) : (
        <RevealGroup as="ul" className="border-t border-outline">
          {articles.map((article) => (
            <RevealItem as="li" key={article.id}>
              <ArticleRow article={article} />
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </Section>
  )
}
```

Crie `src/components/landing/SupportSection.tsx`:

```tsx
import { DiagonalBands } from '@/components/brand/DiagonalBands'
import { Shards } from '@/components/brand/Shards'
import { Reveal } from '@/components/motion/Reveal'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { LineBreaks } from '@/components/ui/LineBreaks'
import { siteConfig } from '@/config/site'
import { landingCopy } from '@/content/landing'

export function SupportSection() {
  const { support } = landingCopy
  const mailto = `mailto:${siteConfig.email}`

  return (
    <section id="apoie" aria-labelledby="apoie-title" className="scroll-mt-20 py-lg md:py-section">
      <Container>
        <Reveal className="relative isolate overflow-hidden bg-primary px-lg py-2xl md:px-3xl md:py-3xl">
          <DiagonalBands tone="ink" className="-z-10" />
          <Shards className="absolute -top-[10%] right-[-6%] -z-10 w-[55%] max-w-[520px] text-neutral opacity-20" />
          <div className="flex flex-col gap-2xl md:flex-row md:items-end md:justify-between">
            <div className="flex max-w-[560px] flex-col gap-lg">
              <Eyebrow tone="onPrimary">06 / {support.eyebrow}</Eyebrow>
              <h2 id="apoie-title" className="type-headline-lg-mobile text-on-primary md:type-headline-lg">
                <LineBreaks text={support.title} />
              </h2>
              <p className="type-body-lg text-on-primary">{support.text}</p>
            </div>
            <div className="flex flex-col gap-md md:items-end">
              <ButtonLink href={mailto} variant="onPrimary" arrow className="max-md:w-full">
                {support.action}
              </ButtonLink>
              <a href={mailto} className="type-label-mono normal-case text-on-primary">
                {siteConfig.email}
              </a>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
```

- [ ] **Step 7: Rodar e ver passar**

Run: `pnpm test tests/components/landing.spec.tsx`
Expected: PASS.

- [ ] **Step 8: A página**

Substitua `src/app/(frontend)/page.tsx`:

```tsx
import config from '@payload-config'
import { getPayload } from 'payload'

import { AboutSection } from '@/components/landing/AboutSection'
import { FeaturedGamesSection } from '@/components/landing/FeaturedGamesSection'
import { GuildsSection } from '@/components/landing/GuildsSection'
import { Hero } from '@/components/landing/Hero'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { RecentArticlesSection } from '@/components/landing/RecentArticlesSection'
import { SupportSection } from '@/components/landing/SupportSection'
import { getLandingData } from '@/lib/queries/landing'

// On-demand revalidation on publish arrives in Plan 3; until then the landing refreshes every minute.
export const revalidate = 60

export default async function HomePage() {
  const payload = await getPayload({ config })
  const { stats, guilds, games, articles } = await getLandingData(payload)

  return (
    <>
      <Hero guildCount={stats.guilds} />
      <AboutSection stats={stats} />
      <HowItWorksSection />
      <GuildsSection guilds={guilds} />
      <FeaturedGamesSection games={games} />
      <RecentArticlesSection articles={articles} />
      <SupportSection />
    </>
  )
}
```

- [ ] **Step 9: Suíte, tipos, lint e build**

```bash
pnpm db:up
pnpm test
pnpm typecheck && pnpm lint
pnpm build
```

Expected: tudo verde. A rota `/` aparece como `○` (estática, com revalidação).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: build the animated landing page from published content"
```

---

### Task 10: Verificação visual, movimento reduzido e documentação

**Files:**
- Modify: `CLAUDE.md`
- Test: verificação manual/automatizada no navegador (sem arquivo de teste novo)

**Interfaces:**
- Consumes: a landing completa (Task 9) e o seed do Plano 1.

- [ ] **Step 1: Subir com o conteúdo do protótipo**

```bash
pnpm db:up && pnpm seed && pnpm dev
```

- [ ] **Step 2: Comparar com o Figma**

Com o Playwright (ferramentas `mcp__plugin_playwright_playwright__*`) ou manualmente:

1. Viewport 1440×900: capture a página inteira de http://localhost:3000 e compare com o frame `10:3` da página `02 · Landing` do Figma (use `get_screenshot` do Figma com `fileKey=qLr3pgjNo0az2ZJVdMaBaQ`, `nodeId=10:3`). Confira a ordem das seções, a tipografia (títulos condensados em caixa-alta, rótulos mono), a barra vermelha dos cards, o bloco vermelho do "Apoie" e o rodapé.
2. Viewport 390×844: capture e compare com o frame `14:2`. Confira o título do hero em 2 linhas sem estourar, os botões em largura total, as guildas em lista com 4 itens, os jogos em carrossel horizontal e o menu hambúrguer abrindo e fechando.
3. Confira detalhes que o teste não pega: iniciais das guildas em caixa mista ("Au", "Tê", não "AU") e o e-mail do "Apoie" em minúsculas (as classes `normal-case` precisam vencer o `uppercase` dos utilitários `type-*`; se não vencerem, use `!normal-case`).
4. Anote as divergências. Onde o `DESIGN.md` e o Figma divergirem, vale o `DESIGN.md` (ex.: o título do "Apoie" usa `headline-lg`, 72px, e não os 88px do protótipo).

- [ ] **Step 3: Animações e movimento reduzido**

1. Recarregue em 1440: as fagulhas entram em diagonal, as faixas deslizam, as linhas do título sobem e "FORJADOS." acende em vermelho, tudo em até ~1,2s. Role a página: as seções aparecem uma vez, os números contam e as fagulhas têm parallax leve.
2. Emule `prefers-reduced-motion: reduce` (`browser_emulate_media` com `reducedMotion: 'reduce'`, ou nas DevTools) e recarregue: nada se desloca, os números aparecem prontos e o conteúdo fica visível.

- [ ] **Step 4: Conteúdo longo e teclado**

1. No admin (`admin@forja.local` / `forja-dev`), edite e publique uma guilda com nome longo ("Guilda de Experimentos Narrativos Interativos") e um jogo com sinopse de 280 caracteres e 4 plataformas. Aguarde até 60s (revalidação) ou reinicie o `pnpm dev`, e confira que nada vaza nem fica cortado em 1440 e 390. Rode `pnpm seed` depois para voltar ao conteúdo original.
2. Só com Tab: o primeiro foco é "Pular para o conteúdo"; todo link e botão mostra o contorno vermelho claro; no mobile, o menu abre com Enter e fecha com Esc.

Qualquer defeito encontrado nos Steps 2–4 vira um teste (quando testável) e uma correção, antes do commit.

- [ ] **Step 5: Documentar no `CLAUDE.md`**

Acrescente, logo depois da seção `## Onde fica cada coisa`:

````markdown
## Front-end

- **Tokens:** `DESIGN.md` → `pnpm tokens` → `src/styles/tokens.css` (gerado, não editar). O teste `tests/unit/tokens.spec.ts` falha se o arquivo estiver desatualizado. A paleta padrão do Tailwind está desligada: só existem as cores do `DESIGN.md`. A tipografia é usada pelas classes `type-<token>` (ex.: `type-headline-md`).
- **Camadas de componentes** (`src/components/`):
  - `ui/`: primitivos sem Payload (`ButtonLink`, `Card`, `Cover`, `StatusBadge`, `SectionHeader`…).
  - `brand/`: logo, fagulhas (`Shards`) e faixas diagonais.
  - `motion/`: `Reveal`, `RevealGroup`/`RevealItem`, `CountUp`, `Parallax` e `MotionProvider`. Toda animação nova passa por aqui.
  - `layout/`: cabeçalho, menu mobile e rodapé.
  - `landing/`: seções da página inicial.
- **Dados:** páginas buscam com funções de `src/lib/queries/` (sempre como visitante, `overrideAccess: false`) e convertem documentos em *view models* em `src/lib/presenters.ts`. Os componentes nunca recebem documentos do Payload.
- **Textos fixos da landing:** `src/content/landing.ts`. **Contatos e navegação:** `src/config/site.ts` (e-mail e redes ainda provisórios).
- **Testes de componente:** `tests/components/*.spec.tsx`, com `// @vitest-environment jsdom` e `import '../helpers/dom'` no topo.
- `pnpm build` pré-renderiza a landing e precisa do Postgres de pé.
````

- [ ] **Step 6: Verificação final e commit**

```bash
npx -y -p @google/design.md designmd lint DESIGN.md
pnpm test && pnpm typecheck && pnpm lint && pnpm build
git add -A
git commit -m "docs: document the front-end structure and verify the landing"
```

Expected: linter com `"errors": 0` e tudo verde.
