# Fundação e CMS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o app Next.js + Payload da Forja com banco local em Docker, todas as coleções (`users`, `guilds`, `games`, `articles`, `media`), as regras de acesso por guilda, o fluxo rascunho → aprovação do admin, a fila "aguardando aprovação" no painel e um seed com os dados do protótipo.

**Architecture:** Um único app Next.js 16 com o Payload 3 embutido, partindo do template oficial `with-postgres` na tag `v3.90.2`. As regras de acesso são funções puras em `src/access/`. O fluxo de publicação vive em hooks reutilizáveis (`src/hooks/`) aplicados às coleções com drafts (`guilds` e `games`). Os testes são de integração: rodam o Payload de verdade contra um banco `forja_test` no mesmo Postgres do Docker.

**Tech Stack:** Next.js 16.3.6, Payload 3.90.2 (`@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`, `@payloadcms/translations`), Postgres 17 (Docker), Vitest 5, pnpm 12, TypeScript.

**Spec:** `CLAUDE.md` (seções Projeto, Stack, Arquitetura, Regras de acesso, Artigos, Modelo de conteúdo, Convenções de código) e `DESIGN.md` (não se aplica a esta fase; o painel admin usa o visual padrão do Payload).

## Roadmap (este é o Plano 1 de 4)

1. **Fundação e CMS** (este plano): projeto, banco, coleções, regras de acesso, fluxo de publicação e seed.
2. **Sistema visual e landing:** tokens do `DESIGN.md` no Tailwind, fontes, componentes de UI, Motion e a landing lendo dados do Payload.
3. **Páginas internas:** `/guildas`, `/guildas/[slug]`, `/jogos`, `/jogos/[slug]`, `/artigos` e revalidação ao publicar.
4. **Produção e entrega:** Neon, Vercel, Vercel Blob, migrações em produção, e-mail SMTP para admins, README, runbook e guia de editores.

## Global Constraints

- Código (variáveis, funções, arquivos, comentários) em **inglês**. Texto visível ao usuário (labels do admin, mensagens de erro) em **português**.
- Comentários só para o *porquê* não óbvio. Nada de comentário explicando o que o código faz.
- **Sem Prisma.** Acesso a dados sempre pela Local API do Payload.
- A Local API usa `overrideAccess: true` por padrão. Toda chamada feita **em nome de um usuário** (ou de um visitante) precisa de `overrideAccess: false` (e `user`, quando houver).
- Versões fixas: `payload`, `@payloadcms/*` em `3.90.2` e `next` em `16.3.6`.
- Gerenciador: **pnpm** (a máquina tem pnpm 12; se `pnpm` não estiver no PATH, use `$HOME/.local/share/pnpm/bin/pnpm`). Node ≥ 24.
- Após qualquer mudança em coleção: `pnpm generate:types`. Após registrar componente no admin: `pnpm generate:importmap`.
- Todos os testes precisam do Postgres local de pé (`pnpm db:up`).

## Review Focus

1. **Editor tentando virar admin ou trocar de guilda pela API**: a mudança deve ser ignorada em silêncio, com o papel e a guilda inalterados. (Teste na Tarefa 4, `users.spec.ts`.)
2. **Editor publicando por fora da interface** (salvar sem `draft` ou mandando `_status: 'published'`): deve receber 403, e a versão publicada não pode mudar. (Testes nas Tarefas 5 e 6.)
3. **Editor mexendo em jogo de outra guilda ou movendo o próprio jogo para outra guilda**: deve receber 403, ou ter a guilda forçada para a dele. (Tarefa 6.)
4. **Visitante anônimo buscando rascunhos ou docs nunca publicados**: nunca devem ser retornados. (Tarefas 5 e 6.)
5. **Admin excluindo guilda que ainda tem membros ou jogos**: deve ser bloqueado com uma mensagem clara. (Tarefas 4 e 6.)

---

## File Structure

```
docker-compose.yml                      Postgres 17 local
docker/postgres/init.sql                cria o banco forja_test
pnpm-workspace.yaml                     allowBuilds (pnpm 12)
.env.example / .env                     DATABASE_URL, DATABASE_URL_TEST, PAYLOAD_SECRET
vitest.config.mts / vitest.setup.ts     testes usam o banco forja_test
src/
  payload.config.ts                     config do Payload (pt, coleções, admin)
  access/index.ts                       regras de acesso (funções puras)
  utilities/slugify.ts                  texto → slug
  utilities/url.ts                      isHttpUrl, getYouTubeVideoId
  fields/validators.ts                  validadores de campo (mensagens em pt)
  fields/slug.ts                        campo slug gerado automaticamente
  fields/richText.ts                    editor Lexical enxuto
  fields/publication.ts                 campos publishedBy/publishedAt
  hooks/assignFirstUserAsAdmin.ts       primeiro usuário vira admin
  hooks/publication.ts                  requireDraftForNonAdmins, recordPublisher
  hooks/assignOwnGuild.ts               editor sempre grava na própria guilda
  hooks/preventDeletingGuildInUse.ts    bloqueia exclusão de guilda em uso
  collections/Users.ts Guilds.ts Games.ts Articles.ts Media.ts
  lib/pendingReviews.ts                 lista de rascunhos aguardando aprovação
  components/admin/PendingReviews.tsx   painel no dashboard do admin
  seed/data.ts seed.ts index.ts         dados de exemplo (protótipo do Figma)
  app/(frontend)/…                      placeholder até o Plano 2
  app/(payload)/…                       gerado pelo template
tests/
  helpers/fixtures.ts                   payload de teste, reset do banco, fábricas
  unit/access.spec.ts utilities.spec.ts
  int/smoke.spec.ts users.spec.ts guilds.spec.ts publication.spec.ts
  int/games.spec.ts articles.spec.ts pending-reviews.spec.ts seed.spec.ts
```

---

### Task 1: Projeto, banco local e ambiente de testes

**Files:**
- Create: tudo que vem do template `with-postgres#v3.90.2`, `pnpm-workspace.yaml`, `docker-compose.yml` (substitui o do template), `docker/postgres/init.sql`, `.env.example`, `.env`, `tests/int/smoke.spec.ts`
- Modify: `package.json`, `vitest.config.mts`, `vitest.setup.ts`, `.gitignore`, `src/payload.config.ts`, `src/app/(frontend)/layout.tsx`, `src/app/(frontend)/page.tsx`, `CLAUDE.md`
- Delete: `Dockerfile`, `README.md` do template, `playwright.config.ts`, `tests/e2e`, `tests/helpers`, `tests/int/api.int.spec.ts`, `src/app/my-route`, `src/app/(payload)/api/graphql`, `src/app/(payload)/api/graphql-playground`, `src/migrations`, `src/app/(frontend)/styles.css`

**Interfaces:**
- Produces: `@payload-config` (alias para `src/payload.config.ts`), `@/*` (alias para `src/*`), scripts `pnpm dev | build | test | typecheck | lint | db:up | db:down | generate:types | generate:importmap`, bancos `forja` e `forja_test`.

- [ ] **Step 1: Commitar os documentos existentes e criar a branch**

```bash
cd /home/lucas/dev/forja
git add CLAUDE.md DESIGN.md raycast-design.md forja_logo_whitered-2048x687.png docs/
git commit -m "docs: add project context, design system and foundation plan"
git switch -c feat/foundation
```

- [ ] **Step 2: Baixar o template na versão exata e copiar sem sobrescrever**

```bash
pnpm dlx tiged "payloadcms/payload/templates/with-postgres#v3.90.2" .template-tmp
cp -rn .template-tmp/. .
rm -rf .template-tmp
```

Esperado: `package.json`, `src/`, `tests/`, `next.config.ts`, `tsconfig.json` etc. na raiz. `CLAUDE.md` e `DESIGN.md` intactos.

- [ ] **Step 3: Remover o que não vamos usar**

```bash
rm -rf Dockerfile README.md playwright.config.ts tests/e2e tests/helpers tests/int/api.int.spec.ts \
  src/app/my-route "src/app/(payload)/api/graphql" "src/app/(payload)/api/graphql-playground" \
  src/migrations "src/app/(frontend)/styles.css"
```

- [ ] **Step 4: Ajustar o `package.json`**

```bash
npm pkg set name=forja version=0.1.0 description="Site da Forja, iniciativa de desenvolvimento de jogos do CESAR"
npm pkg set private=true --json
npm pkg delete license pnpm scripts.test:e2e scripts.test:int scripts.devsafe
npm pkg set engines.node=">=24" engines.pnpm=">=10"
npm pkg set scripts.test="cross-env NODE_OPTIONS=--no-deprecation vitest run" \
  scripts.test:watch="cross-env NODE_OPTIONS=--no-deprecation vitest" \
  scripts.typecheck="tsc --noEmit" \
  scripts.db:up="docker compose up -d --wait" \
  scripts.db:down="docker compose down"
```

- [ ] **Step 5: Liberar os build scripts no pnpm 12**

O pnpm 12 ignora o campo `pnpm` do `package.json`. Crie `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  esbuild: true
  sharp: true
  unrs-resolver: true
```

- [ ] **Step 6: Instalar e fixar versões**

```bash
pnpm install
pnpm add payload@3.90.2 @payloadcms/db-postgres@3.90.2 @payloadcms/next@3.90.2 \
  @payloadcms/richtext-lexical@3.90.2 @payloadcms/ui@3.90.2 @payloadcms/translations@3.90.2 next@16.3.6
pnpm add -D eslint-config-next@16.3.6 dotenv@^18
pnpm remove @playwright/test @testing-library/react jsdom @vitejs/plugin-react
```

Esperado: nenhum `ERR_PNPM_IGNORED_BUILDS`.

- [ ] **Step 7: Postgres local**

Substitua `docker-compose.yml` inteiro:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: forja
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres -d forja']
      interval: 2s
      timeout: 5s
      retries: 20

volumes:
  pgdata:
```

Crie `docker/postgres/init.sql`:

```sql
CREATE DATABASE forja_test;
```

Substitua `.env.example`:

```
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/forja
DATABASE_URL_TEST=postgresql://postgres:postgres@127.0.0.1:5432/forja_test
PAYLOAD_SECRET=troque-por-um-segredo-longo
```

```bash
cp .env.example .env
sed -i "s/^PAYLOAD_SECRET=.*/PAYLOAD_SECRET=$(openssl rand -hex 32)/" .env
grep -qx '.env' .gitignore || printf '\n# env\n.env\n\n# local uploads\n/media\n' >> .gitignore
```

- [ ] **Step 8: Vitest apontando para o banco de teste**

Substitua `vitest.config.mts`:

```ts
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    setupFiles: ['./vitest.setup.ts'],
    fileParallelism: false,
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
})
```

Substitua `vitest.setup.ts`:

```ts
import 'dotenv/config'

if (!process.env.DATABASE_URL_TEST) {
  throw new Error('DATABASE_URL_TEST is not set. Copy .env.example to .env.')
}

process.env.DATABASE_URL = process.env.DATABASE_URL_TEST
```

- [ ] **Step 9: Config do Payload (admin em português, sem GraphQL)**

Substitua `src/payload.config.ts`:

```ts
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { pt } from '@payloadcms/translations/languages/pt'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media'
import { Users } from './collections/Users'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [Users, Media],
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
  }),
  editor: lexicalEditor(),
  graphQL: { disable: true },
  i18n: { supportedLanguages: { pt }, fallbackLanguage: 'pt' },
  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
```

- [ ] **Step 10: Front provisório (até o Plano 2)**

Substitua `src/app/(frontend)/layout.tsx`:

```tsx
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Forja',
  description: 'Iniciativa de desenvolvimento de jogos do CESAR.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
```

Substitua `src/app/(frontend)/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main>
      <h1>Forja</h1>
      <p>Site em construção.</p>
    </main>
  )
}
```

- [ ] **Step 11: Teste de fumaça**

Crie `tests/int/smoke.spec.ts`:

```ts
import config from '@payload-config'
import { getPayload } from 'payload'
import { describe, expect, it } from 'vitest'

describe('payload', () => {
  it('boots against the test database', async () => {
    const payload = await getPayload({ config })
    const { totalDocs } = await payload.count({ collection: 'users' })
    expect(totalDocs).toBeGreaterThanOrEqual(0)
  })
})
```

```bash
pnpm db:up
pnpm test
```

Esperado: `1 passed`.

- [ ] **Step 12: Tipos, lint e build**

```bash
pnpm generate:types
pnpm generate:importmap
pnpm typecheck
pnpm lint
pnpm build
```

Esperado: tudo sem erros. O build lista as rotas `/`, `/admin/[[...segments]]` e `/api/[...slug]`.

- [ ] **Step 13: Documentar comandos no `CLAUDE.md`**

Substitua a seção `## Ambiente local` inteira por:

````markdown
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
```

Setup inicial: `cp .env.example .env` e gerar um `PAYLOAD_SECRET` (`openssl rand -hex 32`). O pnpm 12 lê a liberação de build scripts do `pnpm-workspace.yaml` (`allowBuilds`), não do `package.json`.
````

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + Payload with local Postgres and Vitest"
```

---

### Task 2: Regras de acesso

**Files:**
- Create: `src/access/index.ts`
- Test: `tests/unit/access.spec.ts`

**Interfaces:**
- Produces (todos exportados de `@/access`):
  - `type Role = 'admin' | 'editor'`
  - `type SessionUser = { id: number | string; role?: Role | null; guild?: number | { id: number } | null }`
  - `isAdmin(user?: SessionUser | null): boolean`
  - `getUserGuildId(user?: SessionUser | null): number | null`
  - `Access`: `anyone`, `authenticated`, `adminOnly`, `adminOrSelf`, `adminOrGuildMember`, `adminOrOwnGuild(guildField: string)`, `publishedOrOwnGuild(guildField: string)`
  - `FieldAccess`: `adminOnlyField`

- [ ] **Step 1: Escrever os testes**

Crie `tests/unit/access.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import {
  adminOnly,
  adminOnlyField,
  adminOrGuildMember,
  adminOrOwnGuild,
  adminOrSelf,
  getUserGuildId,
  isAdmin,
  publishedOrOwnGuild,
  type SessionUser,
} from '@/access'

type AccessArgs = Parameters<typeof adminOnly>[0]
type FieldAccessArgs = Parameters<typeof adminOnlyField>[0]

const argsFor = (user: SessionUser | null) => ({ req: { user } }) as unknown as AccessArgs
const fieldArgsFor = (user: SessionUser | null) => ({ req: { user } }) as unknown as FieldAccessArgs

const admin: SessionUser = { id: 1, role: 'admin', guild: null }
const editor: SessionUser = { id: 2, role: 'editor', guild: 7 }
const editorWithPopulatedGuild: SessionUser = { id: 3, role: 'editor', guild: { id: 7 } }
const editorWithoutGuild: SessionUser = { id: 4, role: 'editor', guild: null }

const published = { _status: { equals: 'published' } }

describe('isAdmin', () => {
  it('is true only for the admin role', () => {
    expect(isAdmin(admin)).toBe(true)
    expect(isAdmin(editor)).toBe(false)
    expect(isAdmin(null)).toBe(false)
    expect(isAdmin(undefined)).toBe(false)
  })
})

describe('getUserGuildId', () => {
  it('reads the guild id whether the relation is populated or not', () => {
    expect(getUserGuildId(editor)).toBe(7)
    expect(getUserGuildId(editorWithPopulatedGuild)).toBe(7)
  })

  it('returns null when there is no guild or no user', () => {
    expect(getUserGuildId(editorWithoutGuild)).toBeNull()
    expect(getUserGuildId(null)).toBeNull()
  })
})

describe('adminOnly / adminOnlyField', () => {
  it('allows only admins', () => {
    expect(adminOnly(argsFor(admin))).toBe(true)
    expect(adminOnly(argsFor(editor))).toBe(false)
    expect(adminOnly(argsFor(null))).toBe(false)
    expect(adminOnlyField(fieldArgsFor(admin))).toBe(true)
    expect(adminOnlyField(fieldArgsFor(editor))).toBe(false)
  })
})

describe('adminOrSelf', () => {
  it('scopes non-admins to their own document', () => {
    expect(adminOrSelf(argsFor(admin))).toBe(true)
    expect(adminOrSelf(argsFor(editor))).toEqual({ id: { equals: 2 } })
    expect(adminOrSelf(argsFor(null))).toBe(false)
  })
})

describe('adminOrGuildMember', () => {
  it('requires a guild for non-admins', () => {
    expect(adminOrGuildMember(argsFor(admin))).toBe(true)
    expect(adminOrGuildMember(argsFor(editor))).toBe(true)
    expect(adminOrGuildMember(argsFor(editorWithoutGuild))).toBe(false)
    expect(adminOrGuildMember(argsFor(null))).toBe(false)
  })
})

describe('adminOrOwnGuild', () => {
  const access = adminOrOwnGuild('guild')

  it('scopes editors to documents of their guild', () => {
    expect(access(argsFor(admin))).toBe(true)
    expect(access(argsFor(editor))).toEqual({ guild: { equals: 7 } })
    expect(access(argsFor(editorWithPopulatedGuild))).toEqual({ guild: { equals: 7 } })
  })

  it('denies users without a guild and anonymous visitors', () => {
    expect(access(argsFor(editorWithoutGuild))).toBe(false)
    expect(access(argsFor(null))).toBe(false)
  })
})

describe('publishedOrOwnGuild', () => {
  const access = publishedOrOwnGuild('guild')

  it('lets admins read everything', () => {
    expect(access(argsFor(admin))).toBe(true)
  })

  it('limits anonymous visitors and guildless users to published documents', () => {
    expect(access(argsFor(null))).toEqual(published)
    expect(access(argsFor(editorWithoutGuild))).toEqual(published)
  })

  it('lets editors also read their own guild documents', () => {
    expect(access(argsFor(editor))).toEqual({ or: [published, { guild: { equals: 7 } }] })
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test tests/unit/access.spec.ts`
Expected: FAIL (`Failed to resolve import "@/access"`).

- [ ] **Step 3: Implementar**

Crie `src/access/index.ts`:

```ts
import type { Access, FieldAccess, Where } from 'payload'

export type Role = 'admin' | 'editor'

type GuildReference = number | { id: number } | null | undefined

export type SessionUser = {
  id: number | string
  role?: Role | null
  guild?: GuildReference
}

export const isAdmin = (user?: SessionUser | null): boolean => user?.role === 'admin'

export const getUserGuildId = (user?: SessionUser | null): number | null => {
  const guild = user?.guild
  if (guild === null || guild === undefined) return null
  return typeof guild === 'object' ? guild.id : guild
}

const published: Where = { _status: { equals: 'published' } }

export const anyone: Access = () => true

export const authenticated: Access = ({ req }) => Boolean(req.user)

export const adminOnly: Access = ({ req }) => isAdmin(req.user)

export const adminOnlyField: FieldAccess = ({ req }) => isAdmin(req.user)

export const adminOrSelf: Access = ({ req }) => {
  if (!req.user) return false
  if (isAdmin(req.user)) return true
  return { id: { equals: req.user.id } }
}

export const adminOrGuildMember: Access = ({ req }) =>
  isAdmin(req.user) || getUserGuildId(req.user) !== null

export const adminOrOwnGuild =
  (guildField: string): Access =>
  ({ req }) => {
    if (isAdmin(req.user)) return true
    const guildId = getUserGuildId(req.user)
    if (guildId === null) return false
    return { [guildField]: { equals: guildId } }
  }

export const publishedOrOwnGuild =
  (guildField: string): Access =>
  ({ req }) => {
    if (isAdmin(req.user)) return true
    const guildId = getUserGuildId(req.user)
    if (guildId === null) return published
    return { or: [published, { [guildField]: { equals: guildId } }] }
  }
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm test tests/unit/access.spec.ts`
Expected: PASS (todos os testes).

- [ ] **Step 5: Commit**

```bash
git add src/access tests/unit/access.spec.ts
git commit -m "feat: add guild-scoped access rules"
```

---

### Task 3: Utilitários e validadores de campo

**Files:**
- Create: `src/utilities/slugify.ts`, `src/utilities/url.ts`, `src/fields/validators.ts`
- Test: `tests/unit/utilities.spec.ts`

**Interfaces:**
- Produces:
  - `slugify(value: string): string` (`@/utilities/slugify`)
  - `isHttpUrl(value: string): boolean`, `getYouTubeVideoId(url: string): string | null` (`@/utilities/url`)
  - `validateRequiredHttpUrl`, `validateOptionalHttpUrl`, `validateOptionalYouTubeUrl`: `(value: string | null | undefined) => true | string` (`@/fields/validators`)

- [ ] **Step 1: Escrever os testes**

Crie `tests/unit/utilities.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import {
  validateOptionalHttpUrl,
  validateOptionalYouTubeUrl,
  validateRequiredHttpUrl,
} from '@/fields/validators'
import { slugify } from '@/utilities/slugify'
import { getYouTubeVideoId, isHttpUrl } from '@/utilities/url'

describe('slugify', () => {
  it.each([
    ['Ecos de Ferro', 'ecos-de-ferro'],
    ['Têmpera!', 'tempera'],
    ['Circuito 404', 'circuito-404'],
    ['  Maré   Baixa  ', 'mare-baixa'],
    ['Áudio & Trilha', 'audio-trilha'],
    ['   ', ''],
  ])('%s → %s', (input, expected) => {
    expect(slugify(input)).toBe(expected)
  })
})

describe('isHttpUrl', () => {
  it('accepts only http and https URLs', () => {
    expect(isHttpUrl('https://doi.org/10.1000/xyz')).toBe(true)
    expect(isHttpUrl('http://example.com')).toBe(true)
    expect(isHttpUrl('ftp://example.com')).toBe(false)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('example.com')).toBe(false)
  })
})

describe('getYouTubeVideoId', () => {
  const id = 'dQw4w9WgXcQ'

  it.each([
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=42`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://youtube.com/shorts/${id}`,
  ])('extracts the id from %s', (url) => {
    expect(getYouTubeVideoId(url)).toBe(id)
  })

  it.each([
    'https://vimeo.com/123456',
    'https://www.youtube.com/watch?v=short',
    'https://youtu.be/',
    'not a url',
  ])('rejects %s', (url) => {
    expect(getYouTubeVideoId(url)).toBeNull()
  })
})

describe('field validators', () => {
  it('requires a full URL when the field is mandatory', () => {
    expect(validateRequiredHttpUrl('https://example.com')).toBe(true)
    expect(validateRequiredHttpUrl('')).toEqual(expect.any(String))
    expect(validateRequiredHttpUrl(undefined)).toEqual(expect.any(String))
    expect(validateRequiredHttpUrl('example.com')).toEqual(expect.any(String))
  })

  it('allows empty optional URLs but rejects malformed ones', () => {
    expect(validateOptionalHttpUrl(null)).toBe(true)
    expect(validateOptionalHttpUrl('https://itch.io/game')).toBe(true)
    expect(validateOptionalHttpUrl('itch.io/game')).toEqual(expect.any(String))
  })

  it('accepts only YouTube links for trailers', () => {
    expect(validateOptionalYouTubeUrl(undefined)).toBe(true)
    expect(validateOptionalYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
    expect(validateOptionalYouTubeUrl('https://vimeo.com/1')).toEqual(expect.any(String))
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test tests/unit/utilities.spec.ts`
Expected: FAIL (imports não resolvem).

- [ ] **Step 3: Implementar**

Crie `src/utilities/slugify.ts`:

```ts
export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
```

Crie `src/utilities/url.ts`:

```ts
const YOUTUBE_VIDEO_ID = /^[\w-]{11}$/
const YOUTUBE_PATH_ID = /^\/(?:embed|shorts|live)\/([^/?]+)/

const parseUrl = (value: string): URL | null => {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

export const isHttpUrl = (value: string): boolean => {
  const url = parseUrl(value)
  return url?.protocol === 'http:' || url?.protocol === 'https:'
}

export const getYouTubeVideoId = (value: string): string | null => {
  const url = parseUrl(value)
  if (!url) return null

  const host = url.hostname.replace(/^(www|m)\./, '')
  let id: string | null = null

  if (host === 'youtu.be') {
    id = url.pathname.slice(1)
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = url.pathname === '/watch' ? url.searchParams.get('v') : (url.pathname.match(YOUTUBE_PATH_ID)?.[1] ?? null)
  }

  return id && YOUTUBE_VIDEO_ID.test(id) ? id : null
}
```

Crie `src/fields/validators.ts`:

```ts
import { getYouTubeVideoId, isHttpUrl } from '@/utilities/url'

type FieldValue = string | null | undefined

export const validateRequiredHttpUrl = (value: FieldValue): true | string =>
  value && isHttpUrl(value) ? true : 'Informe um link completo, começando com https://'

export const validateOptionalHttpUrl = (value: FieldValue): true | string =>
  !value || isHttpUrl(value) ? true : 'Use um link completo, começando com https://'

export const validateOptionalYouTubeUrl = (value: FieldValue): true | string =>
  !value || getYouTubeVideoId(value) ? true : 'Use um link do YouTube (ex.: https://youtu.be/dQw4w9WgXcQ).'
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm test tests/unit/utilities.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utilities src/fields/validators.ts tests/unit/utilities.spec.ts
git commit -m "feat: add slug, URL and YouTube helpers with field validators"
```

---

### Task 4: Usuários e guildas

**Files:**
- Create: `src/collections/Guilds.ts`, `src/fields/slug.ts`, `src/fields/richText.ts`, `src/hooks/assignFirstUserAsAdmin.ts`, `src/hooks/preventDeletingGuildInUse.ts`, `tests/helpers/fixtures.ts`
- Modify: `src/collections/Users.ts` (reescrever), `src/payload.config.ts`
- Test: `tests/int/users.spec.ts`, `tests/int/guilds.spec.ts`

**Interfaces:**
- Consumes: `@/access` (Task 2), `validateRequiredHttpUrl` (Task 3), `slugify` (Task 3).
- Produces:
  - `slugField(sourceField: string): Field` (`@/fields/slug`)
  - `simpleRichTextEditor` (`@/fields/richText`)
  - Coleção `users`: campos `name`, `role` (`'admin' | 'editor'`, padrão `editor`), `guild` (relação com `guilds`).
  - Coleção `guilds`: campos `name`, `slug`, `shortDescription`, `description`, `logo`, `cover`, `links[] { platform, url }`, `members`.
  - `tests/helpers/fixtures.ts`: `getTestPayload()`, `resetDatabase(payload)`, `createUser(payload, { role, guild? })`, `createGuild(payload, name, overrides?)`, `createBaseFixture(payload)` → `{ admin, editorA, editorB, guildA, guildB }`, tipo `TestUser`.

- [ ] **Step 1: Criar os campos reutilizáveis**

Crie `src/fields/slug.ts`:

```ts
import type { Field } from 'payload'

import { slugify } from '@/utilities/slugify'

export const slugField = (sourceField: string): Field => ({
  name: 'slug',
  label: 'Slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'Gerado automaticamente a partir do nome. Aparece na URL.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => slugify(typeof value === 'string' && value ? value : String(data?.[sourceField] ?? '')),
    ],
  },
})
```

Crie `src/fields/richText.ts`:

```ts
import {
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const simpleRichTextEditor = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
    BoldFeature(),
    ItalicFeature(),
    LinkFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    FixedToolbarFeature(),
  ],
})
```

- [ ] **Step 2: Criar os hooks**

Crie `src/hooks/assignFirstUserAsAdmin.ts`:

```ts
import type { CollectionBeforeValidateHook } from 'payload'

export const assignFirstUserAsAdmin: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || !data) return data
  const { totalDocs } = await req.payload.count({ collection: 'users', req })
  return totalDocs === 0 ? { ...data, role: 'admin' } : data
}
```

Crie `src/hooks/preventDeletingGuildInUse.ts`:

```ts
import { APIError, type CollectionBeforeDeleteHook } from 'payload'

export const preventDeletingGuildInUse: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const members = await req.payload.count({ collection: 'users', where: { guild: { equals: id } }, req })
  if (members.totalDocs > 0) {
    throw new APIError('Esta guilda ainda tem membros ou jogos. Mova-os antes de excluí-la.', 400, null, true)
  }
}
```

- [ ] **Step 3: Coleções**

Substitua `src/collections/Users.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { adminOnly, adminOnlyField, adminOrSelf } from '@/access'
import { assignFirstUserAsAdmin } from '@/hooks/assignFirstUserAsAdmin'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Usuário', plural: 'Usuários' },
  auth: true,
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'email', 'role', 'guild'] },
  access: {
    read: adminOrSelf,
    create: adminOnly,
    update: adminOrSelf,
    delete: adminOnly,
  },
  hooks: { beforeValidate: [assignFirstUserAsAdmin] },
  fields: [
    { name: 'name', label: 'Nome', type: 'text', required: true },
    {
      name: 'role',
      label: 'Papel',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      access: { create: adminOnlyField, update: adminOnlyField },
      admin: { position: 'sidebar' },
    },
    {
      name: 'guild',
      label: 'Guilda',
      type: 'relationship',
      relationTo: 'guilds',
      access: { create: adminOnlyField, update: adminOnlyField },
      admin: { position: 'sidebar' },
      validate: (value: unknown, { siblingData }: { siblingData: { role?: string } }) =>
        siblingData.role === 'editor' && !value ? 'Editores precisam pertencer a uma guilda.' : true,
    },
  ],
}
```

Crie `src/collections/Guilds.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { adminOnly, adminOrOwnGuild, anyone } from '@/access'
import { simpleRichTextEditor } from '@/fields/richText'
import { slugField } from '@/fields/slug'
import { validateRequiredHttpUrl } from '@/fields/validators'
import { preventDeletingGuildInUse } from '@/hooks/preventDeletingGuildInUse'

export const Guilds: CollectionConfig = {
  slug: 'guilds',
  labels: { singular: 'Guilda', plural: 'Guildas' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug', 'updatedAt'] },
  access: {
    read: anyone,
    create: adminOnly,
    update: adminOrOwnGuild('id'),
    delete: adminOnly,
  },
  hooks: { beforeDelete: [preventDeletingGuildInUse] },
  fields: [
    { name: 'name', label: 'Nome', type: 'text', required: true },
    slugField('name'),
    {
      name: 'shortDescription',
      label: 'Descrição curta',
      type: 'textarea',
      required: true,
      maxLength: 160,
      admin: { description: 'Aparece nos cards. Até 160 caracteres.' },
    },
    { name: 'description', label: 'Descrição', type: 'richText', editor: simpleRichTextEditor },
    { name: 'logo', label: 'Logo', type: 'upload', relationTo: 'media' },
    { name: 'cover', label: 'Capa', type: 'upload', relationTo: 'media' },
    {
      name: 'links',
      label: 'Links',
      type: 'array',
      labels: { singular: 'Link', plural: 'Links' },
      fields: [
        {
          name: 'platform',
          label: 'Plataforma',
          type: 'select',
          required: true,
          options: [
            { label: 'Instagram', value: 'instagram' },
            { label: 'itch.io', value: 'itch' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'Site', value: 'website' },
            { label: 'Outro', value: 'other' },
          ],
        },
        { name: 'url', label: 'URL', type: 'text', validate: validateRequiredHttpUrl },
      ],
    },
    {
      name: 'members',
      label: 'Membros',
      type: 'textarea',
      admin: { description: 'Opcional. Um nome por linha.' },
    },
  ],
}
```

Em `src/payload.config.ts`, importe e registre a nova coleção:

```ts
import { Guilds } from './collections/Guilds'
```

```ts
  collections: [Users, Guilds, Media],
```

- [ ] **Step 4: Gerar tipos**

Run: `pnpm generate:types`
Expected: `src/payload-types.ts` passa a ter as interfaces `User` (com `role` e `guild`) e `Guild`.

- [ ] **Step 5: Helpers de teste**

Crie `tests/helpers/fixtures.ts`:

```ts
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { expect } from 'vitest'

import type { Guild, User } from '@/payload-types'

export type TestUser = User & { collection: 'users' }

// Payload's ValidationError message only names the field; the field's own message lives in data.errors.
export const expectFieldError = async (operation: Promise<unknown>, path: string, message: string) => {
  await expect(operation).rejects.toMatchObject({
    status: 400,
    data: {
      errors: expect.arrayContaining([expect.objectContaining({ path, message: expect.stringContaining(message) })]),
    },
  })
}

const COLLECTIONS_IN_DELETE_ORDER = ['users', 'guilds'] as const

export const getTestPayload = (): Promise<Payload> => getPayload({ config })

export const resetDatabase = async (payload: Payload): Promise<void> => {
  for (const collection of COLLECTIONS_IN_DELETE_ORDER) {
    await payload.delete({ collection, where: { id: { exists: true } }, overrideAccess: true })
  }
}

let userSequence = 0

export const createUser = async (
  payload: Payload,
  { role, guild = null }: { role: User['role']; guild?: number | null },
): Promise<TestUser> => {
  userSequence += 1
  const user = await payload.create({
    collection: 'users',
    data: {
      name: `${role} ${userSequence}`,
      email: `${role}-${userSequence}@forja.test`,
      password: 'test-password',
      role,
      guild,
    },
    overrideAccess: true,
  })
  return { ...user, collection: 'users' }
}

export const createGuild = (payload: Payload, name: string, overrides: Partial<Guild> = {}): Promise<Guild> =>
  payload.create({
    collection: 'guilds',
    data: { name, shortDescription: `Guilda ${name}`, ...overrides },
    overrideAccess: true,
  })

// The first user ever created becomes admin (see assignFirstUserAsAdmin), so the admin must come first.
export const createBaseFixture = async (payload: Payload) => {
  const admin = await createUser(payload, { role: 'admin' })
  const guildA = await createGuild(payload, 'Aurora')
  const guildB = await createGuild(payload, 'Bigorna')
  const editorA = await createUser(payload, { role: 'editor', guild: guildA.id })
  const editorB = await createUser(payload, { role: 'editor', guild: guildB.id })
  return { admin, guildA, guildB, editorA, editorB }
}
```

- [ ] **Step 6: Escrever os testes de usuários**

Crie `tests/int/users.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  createBaseFixture,
  createGuild,
  expectFieldError,
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

describe('users', () => {
  it('makes the very first user an admin and later users editors', async () => {
    const first = await payload.create({
      collection: 'users',
      data: { name: 'Primeira', email: 'first@forja.test', password: 'test-password' },
      overrideAccess: true,
    })
    const guild = await createGuild(payload, 'Aurora')
    const second = await payload.create({
      collection: 'users',
      data: { name: 'Segundo', email: 'second@forja.test', password: 'test-password', guild: guild.id },
      overrideAccess: true,
    })

    expect(first.role).toBe('admin')
    expect(second.role).toBe('editor')
  })

  it('rejects an editor without a guild', async () => {
    await createBaseFixture(payload)

    await expectFieldError(
      payload.create({
        collection: 'users',
        data: { name: 'Sem guilda', email: 'noguild@forja.test', password: 'test-password', role: 'editor' },
        overrideAccess: true,
      }),
      'guild',
      'Editores precisam pertencer a uma guilda.',
    )
  })

  it('ignores an editor trying to change their own role or guild', async () => {
    const { editorA, guildA, guildB } = await createBaseFixture(payload)

    const updated = await payload.update({
      collection: 'users',
      id: editorA.id,
      data: { name: 'Novo nome', role: 'admin', guild: guildB.id },
      user: editorA,
      overrideAccess: false,
      depth: 0,
    })

    expect(updated.name).toBe('Novo nome')
    expect(updated.role).toBe('editor')
    expect(updated.guild).toBe(guildA.id)
  })

  it('lets editors see only themselves', async () => {
    const { editorA } = await createBaseFixture(payload)

    const { docs } = await payload.find({ collection: 'users', user: editorA, overrideAccess: false })

    expect(docs.map((user) => user.id)).toEqual([editorA.id])
  })

  it('forbids editors from creating users', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)

    await expect(
      payload.create({
        collection: 'users',
        data: { name: 'Intruso', email: 'x@forja.test', password: 'test-password', guild: guildA.id },
        user: editorA,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})
```

- [ ] **Step 7: Escrever os testes de guildas**

Crie `tests/int/guilds.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createBaseFixture, createGuild, getTestPayload, resetDatabase } from '../helpers/fixtures'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  await resetDatabase(payload)
})

describe('guilds', () => {
  it('generates the slug from the name', async () => {
    const guild = await createGuild(payload, 'Têmpera')
    expect(guild.slug).toBe('tempera')
  })

  it('lets an editor update their own guild', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)

    const updated = await payload.update({
      collection: 'guilds',
      id: guildA.id,
      data: { shortDescription: 'Narrativa e exploração.' },
      user: editorA,
      overrideAccess: false,
    })

    expect(updated.shortDescription).toBe('Narrativa e exploração.')
  })

  it('forbids an editor from updating another guild', async () => {
    const { editorA, guildB } = await createBaseFixture(payload)

    await expect(
      payload.update({
        collection: 'guilds',
        id: guildB.id,
        data: { shortDescription: 'Invadido' },
        user: editorA,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const untouched = await payload.findByID({ collection: 'guilds', id: guildB.id })
    expect(untouched.shortDescription).toBe('Guilda Bigorna')
  })

  it('forbids editors from creating or deleting guilds', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)

    await expect(
      payload.create({
        collection: 'guilds',
        data: { name: 'Nova', shortDescription: 'x' },
        user: editorA,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    await expect(
      payload.delete({ collection: 'guilds', id: guildA.id, user: editorA, overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('blocks deleting a guild that still has members', async () => {
    const { admin, guildA } = await createBaseFixture(payload)

    await expect(
      payload.delete({ collection: 'guilds', id: guildA.id, user: admin, overrideAccess: false }),
    ).rejects.toThrow('Esta guilda ainda tem membros ou jogos')
  })
})
```

- [ ] **Step 8: Rodar tudo**

Run: `pnpm test`
Expected: PASS (unit + smoke + users + guilds).

- [ ] **Step 9: Tipos e commit**

```bash
pnpm typecheck
git add -A
git commit -m "feat: add users and guilds with guild-scoped access"
```

---

### Task 5: Fluxo de publicação (rascunho → aprovação do admin)

**Files:**
- Create: `src/hooks/publication.ts`, `src/fields/publication.ts`
- Modify: `src/collections/Guilds.ts`, `tests/helpers/fixtures.ts`, `tests/int/guilds.spec.ts`
- Test: `tests/int/publication.spec.ts`

**Interfaces:**
- Consumes: `isAdmin`, `adminOrOwnGuild`, `publishedOrOwnGuild` (Task 2).
- Produces:
  - `requireDraftForNonAdmins: CollectionBeforeChangeHook`: um usuário não-admin só pode gravar com `_status === 'draft'`; qualquer outra coisa lança `Forbidden` (403).
  - `recordPublisher: CollectionBeforeChangeHook`: ao publicar, preenche `publishedBy` (id do usuário) e `publishedAt` (ISO).
  - `publicationFields: Field[]` (`@/fields/publication`), que adiciona `publishedBy` e `publishedAt`, só leitura na barra lateral.
  - `draftVersions` (`@/hooks/publication`): `{ drafts: true, maxPerDoc: 25 }`.
  - `createGuild` passa a criar guildas **publicadas** por padrão.

Como o Payload se comporta (validado contra a 3.90.2): com `draft: true`, o Payload força `data._status = 'draft'` antes dos hooks, a menos que o próprio `data` traga `'published'`. Um save sem `draft` chega ao hook com `_status` diferente de `'draft'`. Por isso a regra é "não-admin só grava rascunho", e não "não-admin não manda `published`".

- [ ] **Step 1: Escrever os testes do fluxo**

Crie `tests/int/publication.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createBaseFixture, createGuild, getTestPayload, resetDatabase } from '../helpers/fixtures'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  await resetDatabase(payload)
})

describe('publication workflow (guilds)', () => {
  it('keeps the published version live while an editor draft waits for approval', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)

    await payload.update({
      collection: 'guilds',
      id: guildA.id,
      data: { shortDescription: 'Rascunho novo' },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })

    const live = await payload.findByID({ collection: 'guilds', id: guildA.id, overrideAccess: false })
    const draft = await payload.findByID({
      collection: 'guilds',
      id: guildA.id,
      draft: true,
      user: editorA,
      overrideAccess: false,
    })
    expect(live.shortDescription).toBe('Guilda Aurora')
    expect(draft.shortDescription).toBe('Rascunho novo')
  })

  it('forbids an editor from saving without draft mode', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)

    await expect(
      payload.update({
        collection: 'guilds',
        id: guildA.id,
        data: { shortDescription: 'Direto no ar' },
        user: editorA,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('forbids an editor from publishing explicitly', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)

    await expect(
      payload.update({
        collection: 'guilds',
        id: guildA.id,
        data: { shortDescription: 'Publicado pelo editor', _status: 'published' },
        draft: true,
        user: editorA,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })

    const live = await payload.findByID({ collection: 'guilds', id: guildA.id })
    expect(live.shortDescription).toBe('Guilda Aurora')
  })

  it('publishes the pending draft when an admin approves it and records who did it', async () => {
    const { admin, editorA, guildA } = await createBaseFixture(payload)
    await payload.update({
      collection: 'guilds',
      id: guildA.id,
      data: { shortDescription: 'Aprovado' },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })

    const published = await payload.update({
      collection: 'guilds',
      id: guildA.id,
      data: { _status: 'published' },
      user: admin,
      overrideAccess: false,
      depth: 0,
    })

    expect(published.shortDescription).toBe('Aprovado')
    expect(published.publishedBy).toBe(admin.id)
    expect(published.publishedAt).toEqual(expect.any(String))
  })

  it('never shows unpublished guilds to anonymous visitors', async () => {
    await createBaseFixture(payload)
    await createGuild(payload, 'Rascunho', { _status: 'draft' })

    const { docs } = await payload.find({ collection: 'guilds', overrideAccess: false })

    expect(docs.map((guild) => guild.name).sort()).toEqual(['Aurora', 'Bigorna'])
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test tests/int/publication.spec.ts`
Expected: FAIL. A coleção ainda não tem drafts: o `_status` é rejeitado e o editor consegue salvar direto.

- [ ] **Step 3: Implementar hooks e campos**

Crie `src/hooks/publication.ts`:

```ts
import { Forbidden, type CollectionBeforeChangeHook } from 'payload'

import { isAdmin } from '@/access'

export const draftVersions = { drafts: true, maxPerDoc: 25 } as const

// Requests without a user come from trusted server code (seed, scripts) running with overrideAccess.
export const requireDraftForNonAdmins: CollectionBeforeChangeHook = ({ data, req }) => {
  if (req.user && !isAdmin(req.user) && data._status !== 'draft') {
    throw new Forbidden(req.t)
  }
  return data
}

export const recordPublisher: CollectionBeforeChangeHook = ({ data, req }) => {
  if (data._status !== 'published') return data
  return { ...data, publishedBy: req.user?.id ?? null, publishedAt: new Date().toISOString() }
}
```

Crie `src/fields/publication.ts`:

```ts
import type { Field } from 'payload'

export const publicationFields: Field[] = [
  {
    name: 'publishedBy',
    label: 'Publicado por',
    type: 'relationship',
    relationTo: 'users',
    admin: { readOnly: true, position: 'sidebar' },
  },
  {
    name: 'publishedAt',
    label: 'Publicado em',
    type: 'date',
    admin: { readOnly: true, position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
  },
]
```

- [ ] **Step 4: Aplicar nas guildas**

Em `src/collections/Guilds.ts`:

1. Troque o import de acesso e acrescente os novos imports:

```ts
import { adminOnly, adminOrOwnGuild, publishedOrOwnGuild } from '@/access'
import { publicationFields } from '@/fields/publication'
import { draftVersions, recordPublisher, requireDraftForNonAdmins } from '@/hooks/publication'
```

2. Substitua `access`, `hooks` e acrescente `versions`:

```ts
  access: {
    read: publishedOrOwnGuild('id'),
    readVersions: adminOrOwnGuild('id'),
    create: adminOnly,
    update: adminOrOwnGuild('id'),
    delete: adminOnly,
  },
  versions: draftVersions,
  hooks: {
    beforeChange: [requireDraftForNonAdmins, recordPublisher],
    beforeDelete: [preventDeletingGuildInUse],
  },
```

3. Acrescente `...publicationFields,` como último item de `fields`.

- [ ] **Step 5: Ajustar helpers e o teste antigo de guildas**

Em `tests/helpers/fixtures.ts`, faça `createGuild` publicar por padrão:

```ts
export const createGuild = (payload: Payload, name: string, overrides: Partial<Guild> = {}): Promise<Guild> =>
  payload.create({
    collection: 'guilds',
    data: { name, shortDescription: `Guilda ${name}`, _status: 'published', ...overrides },
    overrideAccess: true,
  })
```

Em `tests/int/guilds.spec.ts`, o editor agora precisa salvar como rascunho. Troque o teste `lets an editor update their own guild` por:

```ts
  it('lets an editor save a draft of their own guild', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)

    const updated = await payload.update({
      collection: 'guilds',
      id: guildA.id,
      data: { shortDescription: 'Narrativa e exploração.' },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })

    expect(updated.shortDescription).toBe('Narrativa e exploração.')
    expect(updated._status).toBe('draft')
  })
```

E, em `forbids an editor from updating another guild`, acrescente `draft: true,` ao `payload.update` (garante que o 403 vem da guilda errada, não da falta de rascunho).

- [ ] **Step 6: Tipos e testes**

```bash
pnpm generate:types
pnpm test
```

Expected: PASS em todos os arquivos.

- [ ] **Step 7: Commit**

```bash
pnpm typecheck
git add -A
git commit -m "feat: require admin approval to publish guild changes"
```

---

### Task 6: Jogos

**Files:**
- Create: `src/collections/Games.ts`, `src/hooks/assignOwnGuild.ts`
- Modify: `src/payload.config.ts`, `src/hooks/preventDeletingGuildInUse.ts`, `tests/helpers/fixtures.ts`
- Test: `tests/int/games.spec.ts`

**Interfaces:**
- Consumes: `@/access` (Task 2), `validateOptionalHttpUrl` e `validateOptionalYouTubeUrl` (Task 3), `slugField` e `simpleRichTextEditor` (Task 4), `draftVersions`, `requireDraftForNonAdmins`, `recordPublisher` e `publicationFields` (Task 5).
- Produces:
  - Coleção `games`: `title`, `slug`, `guild` (obrigatório), `status` (`'in-development' | 'released' | 'paused'`), `synopsis` (≤280), `cover`, `gallery`, `trailerUrl`, `description`, `platforms` (`'pc' | 'web' | 'mobile' | 'console'`[]), `playUrl`, `credits`, `releaseDate`, `publishedBy`, `publishedAt`.
  - `assignOwnGuild: CollectionBeforeChangeHook`: para não-admins, força `data.guild` = guilda do usuário.
  - `createGame(payload, guildId, overrides?)` em `tests/helpers/fixtures.ts` (cria publicado).

- [ ] **Step 1: Escrever os testes**

Crie `tests/int/games.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  createBaseFixture,
  createGame,
  expectFieldError,
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

describe('games', () => {
  it('always files an editor-created game under the editor guild', async () => {
    const { editorA, guildA, guildB } = await createBaseFixture(payload)

    const game = await payload.create({
      collection: 'games',
      data: { title: 'Maré Baixa', synopsis: 'Puzzle cooperativo.', guild: guildB.id },
      draft: true,
      user: editorA,
      overrideAccess: false,
      depth: 0,
    })

    expect(game.guild).toBe(guildA.id)
    expect(game._status).toBe('draft')
    expect(game.slug).toBe('mare-baixa')
  })

  it('forbids an editor from editing a game of another guild', async () => {
    const { editorA, guildB } = await createBaseFixture(payload)
    const game = await createGame(payload, guildB.id)

    await expect(
      payload.update({
        collection: 'games',
        id: game.id,
        data: { title: 'Invadido' },
        draft: true,
        user: editorA,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('keeps an editor from moving their game to another guild', async () => {
    const { editorA, guildA, guildB } = await createBaseFixture(payload)
    const game = await createGame(payload, guildA.id)

    const draft = await payload.update({
      collection: 'games',
      id: game.id,
      data: { guild: guildB.id },
      draft: true,
      user: editorA,
      overrideAccess: false,
      depth: 0,
    })

    expect(draft.guild).toBe(guildA.id)
  })

  it('forbids an editor from publishing a game', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    const game = await createGame(payload, guildA.id)

    await expect(
      payload.update({
        collection: 'games',
        id: game.id,
        data: { title: 'Direto no ar' },
        user: editorA,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })

    const live = await payload.findByID({ collection: 'games', id: game.id })
    expect(live.title).toBe('Ecos de Ferro')
  })

  it('forbids editors from deleting games', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    const game = await createGame(payload, guildA.id)

    await expect(
      payload.delete({ collection: 'games', id: game.id, user: editorA, overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('shows only published games to anonymous visitors', async () => {
    const { guildA } = await createBaseFixture(payload)
    await createGame(payload, guildA.id)
    await createGame(payload, guildA.id, { title: 'Protótipo secreto', _status: 'draft' })

    const { docs } = await payload.find({ collection: 'games', overrideAccess: false })

    expect(docs.map((game) => game.title)).toEqual(['Ecos de Ferro'])
  })

  it('rejects a trailer that is not a YouTube link when publishing', async () => {
    const { guildA } = await createBaseFixture(payload)

    await expectFieldError(
      createGame(payload, guildA.id, { trailerUrl: 'https://vimeo.com/1' }),
      'trailerUrl',
      'Use um link do YouTube',
    )
  })

  it('blocks deleting a guild that still has games', async () => {
    const { admin } = await createBaseFixture(payload)
    const emptyGuild = await payload.create({
      collection: 'guilds',
      data: { name: 'Centelha', shortDescription: 'x', _status: 'published' },
      overrideAccess: true,
    })
    await createGame(payload, emptyGuild.id)

    await expect(
      payload.delete({ collection: 'guilds', id: emptyGuild.id, user: admin, overrideAccess: false }),
    ).rejects.toThrow('Esta guilda ainda tem membros ou jogos')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test tests/int/games.spec.ts`
Expected: FAIL (`createGame` não existe, coleção `games` não existe).

- [ ] **Step 3: Hook e coleção**

Crie `src/hooks/assignOwnGuild.ts`:

```ts
import type { CollectionBeforeChangeHook } from 'payload'

import { getUserGuildId, isAdmin } from '@/access'

export const assignOwnGuild: CollectionBeforeChangeHook = ({ data, req }) => {
  if (!req.user || isAdmin(req.user)) return data
  return { ...data, guild: getUserGuildId(req.user) }
}
```

Crie `src/collections/Games.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { adminOnly, adminOrGuildMember, adminOrOwnGuild, publishedOrOwnGuild } from '@/access'
import { publicationFields } from '@/fields/publication'
import { simpleRichTextEditor } from '@/fields/richText'
import { slugField } from '@/fields/slug'
import { validateOptionalHttpUrl, validateOptionalYouTubeUrl } from '@/fields/validators'
import { assignOwnGuild } from '@/hooks/assignOwnGuild'
import { draftVersions, recordPublisher, requireDraftForNonAdmins } from '@/hooks/publication'

export const Games: CollectionConfig = {
  slug: 'games',
  labels: { singular: 'Jogo', plural: 'Jogos' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'guild', 'status', 'updatedAt'] },
  access: {
    read: publishedOrOwnGuild('guild'),
    readVersions: adminOrOwnGuild('guild'),
    create: adminOrGuildMember,
    update: adminOrOwnGuild('guild'),
    delete: adminOnly,
  },
  versions: draftVersions,
  hooks: { beforeChange: [assignOwnGuild, requireDraftForNonAdmins, recordPublisher] },
  fields: [
    { name: 'title', label: 'Título', type: 'text', required: true },
    slugField('title'),
    {
      name: 'guild',
      label: 'Guilda',
      type: 'relationship',
      relationTo: 'guilds',
      required: true,
      admin: { position: 'sidebar', description: 'Editores sempre publicam na própria guilda.' },
    },
    {
      name: 'status',
      label: 'Status do jogo',
      type: 'select',
      required: true,
      defaultValue: 'in-development',
      options: [
        { label: 'Em desenvolvimento', value: 'in-development' },
        { label: 'Lançado', value: 'released' },
        { label: 'Pausado', value: 'paused' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'synopsis',
      label: 'Sinopse',
      type: 'textarea',
      required: true,
      maxLength: 280,
      admin: { description: 'Aparece nos cards. Até 280 caracteres.' },
    },
    { name: 'cover', label: 'Capa (16:9)', type: 'upload', relationTo: 'media' },
    { name: 'gallery', label: 'Galeria', type: 'upload', relationTo: 'media', hasMany: true },
    {
      name: 'trailerUrl',
      label: 'Trailer (YouTube)',
      type: 'text',
      validate: validateOptionalYouTubeUrl,
    },
    { name: 'description', label: 'Descrição', type: 'richText', editor: simpleRichTextEditor },
    {
      name: 'platforms',
      label: 'Plataformas',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'PC', value: 'pc' },
        { label: 'Web', value: 'web' },
        { label: 'Mobile', value: 'mobile' },
        { label: 'Console', value: 'console' },
      ],
    },
    {
      name: 'playUrl',
      label: 'Link para jogar',
      type: 'text',
      validate: validateOptionalHttpUrl,
      admin: { description: 'Normalmente a página do jogo na itch.io.' },
    },
    { name: 'credits', label: 'Créditos', type: 'textarea' },
    { name: 'releaseDate', label: 'Data', type: 'date' },
    ...publicationFields,
  ],
}
```

Em `src/payload.config.ts`:

```ts
import { Games } from './collections/Games'
```

```ts
  collections: [Users, Guilds, Games, Media],
```

- [ ] **Step 4: Guilda com jogos também não pode ser excluída**

Substitua `src/hooks/preventDeletingGuildInUse.ts`:

```ts
import { APIError, type CollectionBeforeDeleteHook } from 'payload'

export const preventDeletingGuildInUse: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const byGuild = { guild: { equals: id } }
  const [members, games] = await Promise.all([
    req.payload.count({ collection: 'users', where: byGuild, req }),
    req.payload.count({ collection: 'games', where: byGuild, req }),
  ])
  if (members.totalDocs > 0 || games.totalDocs > 0) {
    throw new APIError('Esta guilda ainda tem membros ou jogos. Mova-os antes de excluí-la.', 400, null, true)
  }
}
```

- [ ] **Step 5: Helpers de teste**

Em `tests/helpers/fixtures.ts`:

1. Troque o import de tipos: `import type { Game, Guild, User } from '@/payload-types'`
2. Inclua `games` no reset: `const COLLECTIONS_IN_DELETE_ORDER = ['games', 'users', 'guilds'] as const`
3. Acrescente:

```ts
export const createGame = (payload: Payload, guildId: number, overrides: Partial<Game> = {}): Promise<Game> =>
  payload.create({
    collection: 'games',
    data: {
      title: 'Ecos de Ferro',
      synopsis: 'Um metroidvania sobre uma ferreira que reconstrói uma cidade mecânica.',
      guild: guildId,
      _status: 'published',
      ...overrides,
    },
    overrideAccess: true,
  })
```

- [ ] **Step 6: Tipos e testes**

```bash
pnpm generate:types
pnpm test
```

Expected: PASS em todos os arquivos.

- [ ] **Step 7: Commit**

```bash
pnpm typecheck
git add -A
git commit -m "feat: add games scoped to guilds with the approval workflow"
```

---

### Task 7: Artigos e mídia

**Files:**
- Create: `src/collections/Articles.ts`
- Modify: `src/collections/Media.ts` (reescrever), `src/payload.config.ts`, `tests/helpers/fixtures.ts`
- Test: `tests/int/articles.spec.ts`

**Interfaces:**
- Consumes: `anyone`, `adminOnly`, `authenticated` (Task 2), `validateRequiredHttpUrl` (Task 3).
- Produces:
  - Coleção `articles`: `title`, `description`, `authors[] { name }` (mínimo 1), `date`, `venue`, `url`, `guild?`, `tags` (texto, múltiplo). Ordenação padrão por `-date`.
  - Coleção `media`: `alt` (obrigatório), só imagens.

- [ ] **Step 1: Escrever os testes**

Crie `tests/int/articles.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createBaseFixture, expectFieldError, getTestPayload, resetDatabase } from '../helpers/fixtures'

let payload: Payload

const article = {
  title: 'Geração procedural de masmorras com gramáticas de grafos',
  description: 'Um estudo sobre geração de níveis.',
  authors: [{ name: 'Ana Lima' }, { name: 'Pedro Souza' }],
  date: '2026-09-01T00:00:00.000Z',
  venue: 'SBGames 2026',
  url: 'https://doi.org/10.0000/exemplo',
}

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  await resetDatabase(payload)
})

describe('articles', () => {
  it('lets admins create articles and anyone read them', async () => {
    const { admin } = await createBaseFixture(payload)
    await payload.create({ collection: 'articles', data: article, user: admin, overrideAccess: false })

    const { docs } = await payload.find({ collection: 'articles', overrideAccess: false })

    expect(docs).toHaveLength(1)
    expect(docs[0].authors?.map((author) => author.name)).toEqual(['Ana Lima', 'Pedro Souza'])
  })

  it('forbids editors from creating articles', async () => {
    const { editorA } = await createBaseFixture(payload)

    await expect(
      payload.create({ collection: 'articles', data: article, user: editorA, overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('requires a full publication link', async () => {
    const { admin } = await createBaseFixture(payload)

    await expectFieldError(
      payload.create({
        collection: 'articles',
        data: { ...article, url: 'doi.org/10.0000/exemplo' },
        user: admin,
        overrideAccess: false,
      }),
      'url',
      'Informe um link completo',
    )
  })

  it('requires at least one author', async () => {
    const { admin } = await createBaseFixture(payload)

    await expect(
      payload.create({
        collection: 'articles',
        data: { ...article, authors: [] },
        user: admin,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test tests/int/articles.spec.ts`
Expected: FAIL (coleção `articles` não existe).

- [ ] **Step 3: Implementar**

Crie `src/collections/Articles.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { adminOnly, anyone } from '@/access'
import { validateRequiredHttpUrl } from '@/fields/validators'

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: 'Artigo', plural: 'Artigos' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'venue', 'date'] },
  defaultSort: '-date',
  access: {
    read: anyone,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'title', label: 'Título', type: 'text', required: true },
    { name: 'description', label: 'Descrição', type: 'textarea', required: true },
    {
      name: 'authors',
      label: 'Autores',
      type: 'array',
      minRows: 1,
      required: true,
      labels: { singular: 'Autor', plural: 'Autores' },
      fields: [{ name: 'name', label: 'Nome', type: 'text', required: true }],
    },
    { name: 'date', label: 'Data', type: 'date', required: true },
    {
      name: 'venue',
      label: 'Veículo',
      type: 'text',
      required: true,
      admin: { description: 'Revista ou evento. Ex.: SBGames 2026.' },
    },
    {
      name: 'url',
      label: 'Link da publicação',
      type: 'text',
      validate: validateRequiredHttpUrl,
      admin: { description: 'Se houver DOI, prefira o link https://doi.org/..., que não quebra.' },
    },
    {
      name: 'guild',
      label: 'Guilda',
      type: 'relationship',
      relationTo: 'guilds',
      admin: { position: 'sidebar', description: 'Opcional. Usado só para filtrar.' },
    },
    { name: 'tags', label: 'Tags', type: 'text', hasMany: true, admin: { position: 'sidebar' } },
  ],
}
```

Substitua `src/collections/Media.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { adminOnly, anyone, authenticated } from '@/access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Imagem', plural: 'Imagens' },
  access: {
    read: anyone,
    create: authenticated,
    update: adminOnly,
    delete: adminOnly,
  },
  upload: { mimeTypes: ['image/*'] },
  fields: [
    {
      name: 'alt',
      label: 'Texto alternativo',
      type: 'text',
      required: true,
      admin: { description: 'Descreva a imagem para quem usa leitor de tela.' },
    },
  ],
}
```

Em `src/payload.config.ts`:

```ts
import { Articles } from './collections/Articles'
```

```ts
  collections: [Users, Guilds, Games, Articles, Media],
```

Em `tests/helpers/fixtures.ts`:

```ts
const COLLECTIONS_IN_DELETE_ORDER = ['games', 'articles', 'users', 'guilds'] as const
```

- [ ] **Step 4: Tipos e testes**

```bash
pnpm generate:types
pnpm test
```

Expected: PASS em todos os arquivos.

- [ ] **Step 5: Commit**

```bash
pnpm typecheck
git add -A
git commit -m "feat: add articles showcase and image-only media"
```

---

### Task 8: Fila "aguardando aprovação" no painel

**Files:**
- Create: `src/lib/pendingReviews.ts`, `src/components/admin/PendingReviews.tsx`
- Modify: `src/payload.config.ts`, `src/app/(payload)/admin/importMap.js` (gerado)
- Test: `tests/int/pending-reviews.spec.ts`

**Interfaces:**
- Consumes: `isAdmin` (Task 2), coleções `guilds` e `games` com drafts (Tasks 5 e 6).
- Produces:
  - `type PendingReview = { collection: 'guilds' | 'games'; id: number; title: string; updatedAt: string }`
  - `listPendingReviews(payload: Payload): Promise<PendingReview[]>`, ordenado do mais recente para o mais antigo.
  - `PendingReviews` (Server Component), exibido no topo do dashboard só para admins.

Como o Payload se comporta: `find({ draft: true, where: { _status: { equals: 'draft' } } })` retorna os docs cuja **versão mais recente** é rascunho. Isso inclui edições pendentes de docs publicados e docs novos nunca publicados, e é exatamente a fila de aprovação.

- [ ] **Step 1: Escrever os testes**

Crie `tests/int/pending-reviews.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { listPendingReviews } from '@/lib/pendingReviews'

import { createBaseFixture, createGame, getTestPayload, resetDatabase } from '../helpers/fixtures'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  await resetDatabase(payload)
})

describe('listPendingReviews', () => {
  it('is empty when everything is published', async () => {
    const { guildA } = await createBaseFixture(payload)
    await createGame(payload, guildA.id)

    expect(await listPendingReviews(payload)).toEqual([])
  })

  it('lists editor drafts of guilds and games, newest first', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    const game = await createGame(payload, guildA.id)

    await payload.update({
      collection: 'guilds',
      id: guildA.id,
      data: { shortDescription: 'Nova descrição' },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })
    await payload.update({
      collection: 'games',
      id: game.id,
      data: { title: 'Ecos de Ferro 2' },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })

    const reviews = await listPendingReviews(payload)

    expect(reviews.map(({ collection, id, title }) => ({ collection, id, title }))).toEqual([
      { collection: 'games', id: game.id, title: 'Ecos de Ferro 2' },
      { collection: 'guilds', id: guildA.id, title: 'Aurora' },
    ])
  })

  it('includes brand-new games that were never published', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    await payload.create({
      collection: 'games',
      data: { title: 'Circuito 404', synopsis: 'Roguelike de cartas.', guild: guildA.id },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })

    const reviews = await listPendingReviews(payload)

    expect(reviews.map((review) => review.title)).toEqual(['Circuito 404'])
  })

  it('drops an item once an admin publishes it', async () => {
    const { admin, editorA, guildA } = await createBaseFixture(payload)
    const game = await createGame(payload, guildA.id)
    await payload.update({
      collection: 'games',
      id: game.id,
      data: { title: 'Aprovado' },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })

    await payload.update({
      collection: 'games',
      id: game.id,
      data: { _status: 'published' },
      user: admin,
      overrideAccess: false,
    })

    expect(await listPendingReviews(payload)).toEqual([])
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test tests/int/pending-reviews.spec.ts`
Expected: FAIL (`@/lib/pendingReviews` não existe).

- [ ] **Step 3: Implementar a consulta**

Crie `src/lib/pendingReviews.ts`:

```ts
import type { Payload, Where } from 'payload'

export type PendingReview = {
  collection: 'guilds' | 'games'
  id: number
  title: string
  updatedAt: string
}

const latestVersionIsDraft: Where = { _status: { equals: 'draft' } }

export const listPendingReviews = async (payload: Payload): Promise<PendingReview[]> => {
  const query = { draft: true, where: latestVersionIsDraft, depth: 0, pagination: false, overrideAccess: true } as const
  const [guilds, games] = await Promise.all([
    payload.find({ collection: 'guilds', ...query }),
    payload.find({ collection: 'games', ...query }),
  ])

  return [
    ...guilds.docs.map((doc) => ({
      collection: 'guilds' as const,
      id: doc.id,
      title: doc.name,
      updatedAt: doc.updatedAt,
    })),
    ...games.docs.map((doc) => ({
      collection: 'games' as const,
      id: doc.id,
      title: doc.title,
      updatedAt: doc.updatedAt,
    })),
  ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm test tests/int/pending-reviews.spec.ts`
Expected: PASS.

- [ ] **Step 5: Componente no dashboard**

Crie `src/components/admin/PendingReviews.tsx`:

```tsx
import config from '@payload-config'
import { headers } from 'next/headers'
import Link from 'next/link'
import { getPayload } from 'payload'

import { isAdmin } from '@/access'
import { listPendingReviews } from '@/lib/pendingReviews'

const collectionLabels = { guilds: 'Guilda', games: 'Jogo' } as const

export async function PendingReviews() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!isAdmin(user)) return null

  const reviews = await listPendingReviews(payload)

  return (
    <section style={{ marginBottom: 'calc(var(--base) * 2)' }}>
      <h2>Aguardando aprovação</h2>
      {reviews.length === 0 ? (
        <p>Nada na fila. Tudo o que foi enviado já está publicado.</p>
      ) : (
        <ul>
          {reviews.map((review) => (
            <li key={`${review.collection}-${review.id}`}>
              <Link href={`/admin/collections/${review.collection}/${review.id}`}>
                {collectionLabels[review.collection]}: {review.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
```

Em `src/payload.config.ts`, dentro de `admin`:

```ts
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      beforeDashboard: ['@/components/admin/PendingReviews#PendingReviews'],
    },
  },
```

```bash
pnpm generate:importmap
```

Expected: `src/app/(payload)/admin/importMap.js` passa a importar `PendingReviews`.

- [ ] **Step 6: Verificar no navegador**

```bash
pnpm dev
```

1. Abra http://localhost:3000/admin e crie o primeiro usuário (ele vira admin).
2. Crie uma guilda publicada e um editor dessa guilda (Usuários → novo, papel Editor).
3. Numa janela anônima, entre como o editor, edite a guilda e clique em **Salvar rascunho**. Depois tente **Publicar** e confirme que aparece um erro.
4. Volte ao admin: o dashboard mostra "Aguardando aprovação" com "Guilda: …". Abra, publique e confirme que a fila esvazia.

- [ ] **Step 7: Commit**

```bash
pnpm typecheck
pnpm lint
git add -A
git commit -m "feat: show pending reviews on the admin dashboard"
```

---

### Task 9: Seed, migração inicial e documentação

**Files:**
- Create: `src/seed/data.ts`, `src/seed/seed.ts`, `src/seed/index.ts`, `src/migrations/*` (gerado)
- Modify: `package.json`, `CLAUDE.md`
- Test: `tests/int/seed.spec.ts`

**Interfaces:**
- Consumes: todas as coleções.
- Produces:
  - `seed(payload: Payload): Promise<void>` (`@/seed/seed`): apaga `games`, `articles`, `users` e `guilds` e recria 1 admin, 8 guildas, 3 jogos e 3 artigos, tudo publicado. Recusa rodar com `NODE_ENV=production`.
  - `SEED_ADMIN = { name, email: 'admin@forja.local', password: 'forja-dev' }`
  - script `pnpm seed`

- [ ] **Step 1: Escrever o teste**

Crie `tests/int/seed.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { SEED_ADMIN, seed } from '@/seed/seed'

import { getTestPayload } from '../helpers/fixtures'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

const countAll = async () => ({
  users: (await payload.count({ collection: 'users' })).totalDocs,
  guilds: (await payload.count({ collection: 'guilds' })).totalDocs,
  games: (await payload.count({ collection: 'games' })).totalDocs,
  articles: (await payload.count({ collection: 'articles' })).totalDocs,
})

describe('seed', () => {
  it('creates the prototype content, published and visible to visitors', async () => {
    await seed(payload)

    expect(await countAll()).toEqual({ users: 1, guilds: 8, games: 3, articles: 3 })
    const visibleGames = await payload.find({ collection: 'games', overrideAccess: false })
    expect(visibleGames.totalDocs).toBe(3)
    const { docs } = await payload.find({ collection: 'users', where: { email: { equals: SEED_ADMIN.email } } })
    expect(docs[0].role).toBe('admin')
  })

  it('can run again without duplicating content', async () => {
    await seed(payload)
    await seed(payload)

    expect(await countAll()).toEqual({ users: 1, guilds: 8, games: 3, articles: 3 })
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test tests/int/seed.spec.ts`
Expected: FAIL (`@/seed/seed` não existe).

- [ ] **Step 3: Dados do protótipo**

Crie `src/seed/data.ts`:

```ts
import type { Article, Game, Guild } from '@/payload-types'

type GuildSeed = Pick<Guild, 'name' | 'shortDescription'>
type GameSeed = Pick<Game, 'title' | 'synopsis' | 'status' | 'platforms'> & { guildName: string }
type ArticleSeed = Pick<Article, 'title' | 'description' | 'authors' | 'date' | 'venue' | 'url'> & {
  guildName?: string
}

export const guilds: GuildSeed[] = [
  { name: 'Aurora', shortDescription: 'Narrativa e jogos de exploração.' },
  { name: 'Bigorna', shortDescription: 'Gameplay e sistemas.' },
  { name: 'Centelha', shortDescription: 'Jogos educativos.' },
  { name: 'Brasa', shortDescription: 'Arte e animação.' },
  { name: 'Têmpera', shortDescription: 'Áudio e trilha sonora.' },
  { name: 'Faísca', shortDescription: 'Game jams e protótipos rápidos.' },
  { name: 'Malha', shortDescription: 'Multiplayer e redes.' },
  { name: 'Fornalha', shortDescription: 'Engines e ferramentas.' },
]

export const games: GameSeed[] = [
  {
    title: 'Ecos de Ferro',
    synopsis: 'Um metroidvania sobre uma ferreira que reconstrói uma cidade mecânica peça por peça.',
    status: 'in-development',
    platforms: ['pc', 'web'],
    guildName: 'Aurora',
  },
  {
    title: 'Maré Baixa',
    synopsis: 'Puzzle cooperativo para dois jogadores em uma vila de pescadores que afunda.',
    status: 'released',
    platforms: ['pc'],
    guildName: 'Malha',
  },
  {
    title: 'Circuito 404',
    synopsis: 'Roguelike de cartas onde cada deck é um programa que você depura em tempo real.',
    status: 'released',
    platforms: ['pc', 'web'],
    guildName: 'Fornalha',
  },
]

export const articles: ArticleSeed[] = [
  {
    title: 'Geração procedural de masmorras com gramáticas de grafos',
    description: 'Como gramáticas de grafos geram masmorras jogáveis e variadas.',
    authors: [{ name: 'Ana Lima' }, { name: 'Pedro Souza' }, { name: 'Júlia Rocha' }],
    date: '2026-09-01T00:00:00.000Z',
    venue: 'SBGames 2026',
    url: 'https://example.com/artigos/masmorras-procedurais',
    guildName: 'Bigorna',
  },
  {
    title: 'Jogos sérios no ensino de lógica: um estudo com 120 estudantes',
    description: 'Resultados de um experimento com jogos no ensino de lógica.',
    authors: [{ name: 'Carla Menezes' }, { name: 'Rafael Duarte' }],
    date: '2026-06-15T00:00:00.000Z',
    venue: 'Revista RBIE',
    url: 'https://example.com/artigos/jogos-serios-logica',
    guildName: 'Centelha',
  },
  {
    title: 'Áudio adaptativo em jogos de exploração: um framework leve',
    description: 'Um framework para trilhas que reagem ao estado do jogo.',
    authors: [{ name: 'Bruno Alves' }, { name: 'Letícia Prado' }],
    date: '2025-10-20T00:00:00.000Z',
    venue: 'SBGames 2025',
    url: 'https://example.com/artigos/audio-adaptativo',
  },
]
```

- [ ] **Step 4: Função de seed e script**

Crie `src/seed/seed.ts`:

```ts
import type { Payload } from 'payload'

import { articles, games, guilds } from './data'

export const SEED_ADMIN = { name: 'Admin Forja', email: 'admin@forja.local', password: 'forja-dev' }

const COLLECTIONS_IN_DELETE_ORDER = ['games', 'articles', 'users', 'guilds'] as const

export const seed = async (payload: Payload): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The seed wipes content and must never run in production.')
  }

  for (const collection of COLLECTIONS_IN_DELETE_ORDER) {
    await payload.delete({ collection, where: { id: { exists: true } }, overrideAccess: true })
  }

  await payload.create({ collection: 'users', data: { ...SEED_ADMIN, role: 'admin' }, overrideAccess: true })

  const guildIdByName = new Map<string, number>()
  for (const guild of guilds) {
    const created = await payload.create({
      collection: 'guilds',
      data: { ...guild, _status: 'published' },
      overrideAccess: true,
    })
    guildIdByName.set(guild.name, created.id)
  }

  const guildId = (name: string): number => {
    const id = guildIdByName.get(name)
    if (id === undefined) throw new Error(`Seed references unknown guild "${name}"`)
    return id
  }

  for (const { guildName, ...game } of games) {
    await payload.create({
      collection: 'games',
      data: { ...game, guild: guildId(guildName), _status: 'published' },
      overrideAccess: true,
    })
  }

  for (const { guildName, ...article } of articles) {
    await payload.create({
      collection: 'articles',
      data: { ...article, guild: guildName ? guildId(guildName) : null },
      overrideAccess: true,
    })
  }
}
```

Crie `src/seed/index.ts`:

```ts
import config from '@payload-config'
import { getPayload } from 'payload'

import { SEED_ADMIN, seed } from './seed'

const payload = await getPayload({ config })
await seed(payload)
payload.logger.info(`Seed complete. Admin login: ${SEED_ADMIN.email} / ${SEED_ADMIN.password}`)
process.exit(0)
```

```bash
npm pkg set scripts.seed="cross-env NODE_OPTIONS=--no-deprecation payload run src/seed/index.ts"
```

- [ ] **Step 5: Rodar os testes**

Run: `pnpm test`
Expected: PASS em todos os arquivos.

- [ ] **Step 6: Rodar o seed no banco de dev**

```bash
pnpm seed
```

Expected: log `Seed complete. Admin login: admin@forja.local / forja-dev`. Em `pnpm dev`, o login em `/admin` com essas credenciais mostra 8 guildas, 3 jogos e 3 artigos.

- [ ] **Step 7: Migração inicial**

O dev e os testes sincronizam o schema automaticamente (push). A produção precisa de migrações.

```bash
pnpm payload migrate:create initial
```

Expected: `src/migrations/<timestamp>_initial.ts`, `.json` e `index.ts` criados.

- [ ] **Step 8: Documentar no `CLAUDE.md`**

Na seção `## Comandos`, acrescente dentro do bloco:

```bash
pnpm seed                   # APAGA e recria o conteúdo de exemplo no banco local (admin@forja.local / forja-dev)
```

E acrescente uma nova seção logo depois de `## Comandos`:

````markdown
## Onde fica cada coisa

- **Regras de acesso:** `src/access/index.ts` (funções puras, com teste unitário). As coleções só compõem essas funções.
- **Fluxo de publicação:** `src/hooks/publication.ts`. Um não-admin só grava rascunho (`_status: 'draft'`), e publicar registra `publishedBy`/`publishedAt`. Vale para `guilds` e `games` (`versions: draftVersions`).
- **Editor sempre na própria guilda:** `src/hooks/assignOwnGuild.ts` (jogos) e o acesso `adminOrOwnGuild`.
- **Fila de aprovação:** `src/lib/pendingReviews.ts` + `src/components/admin/PendingReviews.tsx` (topo do dashboard, só para admins).
- **Testes de integração** rodam o Payload de verdade contra o banco `forja_test`. Use as fábricas de `tests/helpers/fixtures.ts`. O primeiro usuário criado vira admin, então `createBaseFixture` cria o admin antes de tudo.

**Armadilha da Local API:** `payload.find/update/...` usam `overrideAccess: true` por padrão. Em código que age em nome de alguém (páginas públicas, endpoints, testes de permissão), passe sempre `overrideAccess: false` e o `user` quando houver.
````

- [ ] **Step 9: Verificação final**

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected: tudo verde.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add prototype seed, initial migration and docs"
```
