# Armazenamento S3 local (SeaweedFS) e preparação do deploy de dev — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** As imagens do site passam a ser gravadas num bucket S3: **SeaweedFS** no ambiente local e **Cloudflare R2** no deploy de dev. O código fica pronto para o Lucas criar o projeto na Vercel e as pipelines no GitHub Actions por conta própria.

**Architecture:**
- **Um adaptador para tudo.** O `@payloadcms/storage-s3` atende o SeaweedFS (local) e o R2 (deploy); só o `.env` muda.
- **Payload continua servindo as imagens.** Elas saem por `/api/media/file/...` com as regras de acesso da coleção, e o bucket fica privado. Assim o R2 não precisa de domínio público nem de CORS.
- **Variáveis de ambiente validadas.** Um módulo puro lê e valida as variáveis e falha cedo, com os nomes do que falta.
- **Seed com imagens.** O seed passa a enviar imagens de exemplo no estilo da marca (exercita o bucket de ponta a ponta). Ele se recusa a criar o admin com a senha pública padrão num banco remoto.

**Tech Stack:** Payload 3.90.2, `@payloadcms/storage-s3@3.90.2`, `@aws-sdk/client-s3` (só testes), SeaweedFS 4.47 (Docker), sharp, Vitest.

**Spec:** a conversa de 2026-09-27 e a memória `forja-mvp-scope`. Não há documento de spec separado. Decisões tomadas:
- Só o ambiente de dev agora; produção fica para depois (talvez com a própria Forja).
- **Foco em o ambiente local funcionar bem com S3.**
- O Lucas cria o projeto na Vercel e as pipelines no GitHub Actions por conta própria; este plano não cria nada disso.
- O MinIO foi descartado: foi arquivado em 2026 e as imagens oficiais não baixam mais (Docker Hub: `repository does not exist`; quay.io: 401). O Lucas escolheu o **SeaweedFS**.
- O deploy de dev usa o R2.

## Global Constraints

- Código, nomes e comentários em inglês; textos vistos no site ou no painel em português (CLAUDE.md › Convenções).
- Comentários só para o *porquê* (regra de negócio, contorno). Nada de comentar o *o quê*.
- Leia e grave dados só pela Local API do Payload; sem Prisma, sem ORM paralelo (CLAUDE.md › Decisões).
- Imagem do SeaweedFS fixada em `chrislusf/seaweedfs:4.47`, nunca `latest`.
- Bucket local `forja-media`, bucket de testes `forja-media-test`, credenciais locais `forja` / `forja-dev-secret` (só desenvolvimento).
- Limite de upload: **4 MB** (`4 * 1024 * 1024` bytes). Motivo: a Vercel recusa corpos de requisição acima de 4,5 MB.
- O bucket é privado; as imagens saem por `/api/media/file/<filename>` (já liberado em `next.config.ts` › `images.localPatterns`).
- `pnpm` 12 não está no PATH: rode `export PATH=$HOME/.local/share/pnpm/bin:$PATH` antes dos comandos.
- Toda mudança de coleção/config do Payload → `pnpm generate:types` e `pnpm generate:importmap`; mudança de schema → `pnpm payload migrate:create <nome>`.
- Commits com as linhas de atribuição:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_017xWBarWntqC3EztPCvvVC7
  ```
- Não criar projeto na Vercel, workflows do GitHub Actions, contas nem buckets remotos.

## Review Focus

1. **Variável ausente ou com o valor de exemplo no deploy:** o app falha ao iniciar com uma mensagem que nomeia as variáveis, em vez de um erro obscuro do AWS SDK no primeiro upload, ou de rodar com o `PAYLOAD_SECRET` do `.env.example` (que permitiria forjar sessões). Testado na Task 1.
2. **Imagem acima de 4 MB:** o upload é recusado com erro visível no painel e nenhum documento `media` fica criado pela metade. Verificado por HTTP e no navegador na Task 4.
3. **Seed apontado para o banco do deploy:** não cria o admin `admin@forja.local` / `forja-dev` (senha pública no repositório); exige `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. Testado na Task 3.
4. **Banco novo criado só por migrações (o Neon do deploy):** `payload migrate` aplica tudo, o build passa com o banco vazio, as páginas mostram os estados vazios e `/admin` oferece criar o primeiro usuário. Verificado na Task 4.
5. **Imagem excluída ou serviço reiniciado:** excluir a imagem no painel apaga o objeto do bucket (Task 2). Reiniciar o SeaweedFS não perde arquivos, porque o volume é persistente (Task 4).

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `docker-compose.yml` (modificar) | Serviço `storage` (SeaweedFS com S3) e serviço de uso único `storage-buckets` que cria os buckets |
| `docker/seaweedfs/s3.json` (criar) | Credenciais S3 de desenvolvimento |
| `.env.example` (modificar) | Variáveis `S3_*` locais, com notas para o R2 |
| `src/config/env.ts` (criar) | `readServerEnv`: lê e valida as variáveis do servidor |
| `src/payload.config.ts` (modificar) | Usa `readServerEnv`, registra o `s3Storage`, limita upload |
| `src/collections/Media.ts` (modificar) | `MAX_UPLOAD_BYTES` e descrição do limite no painel |
| `vitest.setup.ts` (modificar) | Testes usam o bucket `forja-media-test` |
| `tests/helpers/fixtures.ts` (modificar) | `resetDatabase` também limpa `media` |
| `src/seed/admin.ts` (criar) | `LOCAL_SEED_ADMIN`, `resolveSeedAdmin` |
| `src/seed/placeholderImage.ts` (criar) | Gera PNG de exemplo no estilo da marca |
| `src/seed/seed.ts`, `src/seed/index.ts` (modificar) | Seed com imagens e admin resolvido |
| `README.md` (criar) | Como rodar localmente e o que configurar no deploy de dev |
| `CLAUDE.md`, `package.json` (modificar) | Stack/comandos atualizados; script `vercel-build` |

---

### Task 1: SeaweedFS no ambiente local e leitura validada das variáveis

**Files:**
- Create: `src/config/env.ts`, `docker/seaweedfs/s3.json`, `tests/unit/env.spec.ts`
- Modify: `docker-compose.yml`, `package.json` (script `db:up`), `.env.example`, `.env` (local, não versionado)

**Interfaces:**
- Produces:
  - `readServerEnv(env?: Record<string, string | undefined>): ServerEnv`
  - `type ServerEnv = { databaseUrl: string; payloadSecret: string; storage: StorageEnv }`
  - `type StorageEnv = { endpoint: string; region: string; bucket: string; accessKeyId: string; secretAccessKey: string }`
  - `EXAMPLE_PAYLOAD_SECRET = 'troque-por-um-segredo-longo'`
  - Env vars: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_BUCKET_TEST`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.

- [ ] **Step 1: Write the failing test** — `tests/unit/env.spec.ts`

```ts
import { describe, expect, it } from 'vitest'

import { EXAMPLE_PAYLOAD_SECRET, readServerEnv } from '@/config/env'

const completeEnv = {
  DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:5432/forja',
  PAYLOAD_SECRET: 'a'.repeat(64),
  S3_ENDPOINT: 'http://127.0.0.1:8333',
  S3_REGION: 'us-east-1',
  S3_BUCKET: 'forja-media',
  S3_ACCESS_KEY_ID: 'forja',
  S3_SECRET_ACCESS_KEY: 'forja-dev-secret',
}

describe('readServerEnv', () => {
  it('reads the database, secret and storage settings', () => {
    expect(readServerEnv(completeEnv)).toEqual({
      databaseUrl: completeEnv.DATABASE_URL,
      payloadSecret: completeEnv.PAYLOAD_SECRET,
      storage: {
        endpoint: 'http://127.0.0.1:8333',
        region: 'us-east-1',
        bucket: 'forja-media',
        accessKeyId: 'forja',
        secretAccessKey: 'forja-dev-secret',
      },
    })
  })

  it('names every missing or blank variable at once', () => {
    const env = { ...completeEnv, S3_BUCKET: '  ', S3_ENDPOINT: undefined, PAYLOAD_SECRET: '' }
    expect(() => readServerEnv(env)).toThrow(
      'Missing environment variables: PAYLOAD_SECRET, S3_ENDPOINT, S3_BUCKET. See .env.example.',
    )
  })

  it('refuses the placeholder secret from .env.example, which would let anyone forge sessions', () => {
    expect(() => readServerEnv({ ...completeEnv, PAYLOAD_SECRET: EXAMPLE_PAYLOAD_SECRET })).toThrow(
      /PAYLOAD_SECRET still has the example value/,
    )
  })

  it('trims surrounding whitespace pasted into dashboards', () => {
    expect(readServerEnv({ ...completeEnv, S3_BUCKET: ' forja-media-dev \n' }).storage.bucket).toBe('forja-media-dev')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/env.spec.ts`
Expected: FAIL, `Cannot find module '@/config/env'` (or failed to resolve import).

- [ ] **Step 3: Write minimal implementation** — `src/config/env.ts`

```ts
export type StorageEnv = {
  endpoint: string
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
}

export type ServerEnv = {
  databaseUrl: string
  payloadSecret: string
  storage: StorageEnv
}

export const EXAMPLE_PAYLOAD_SECRET = 'troque-por-um-segredo-longo'

const REQUIRED_VARIABLES = [
  'DATABASE_URL',
  'PAYLOAD_SECRET',
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
] as const

type RequiredVariable = (typeof REQUIRED_VARIABLES)[number]

export const readServerEnv = (env: Record<string, string | undefined> = process.env): ServerEnv => {
  const read = (name: RequiredVariable) => env[name]?.trim() ?? ''

  const missing = REQUIRED_VARIABLES.filter((name) => !read(name))
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}. See .env.example.`)
  }

  // The example secret is public in the repository; a deploy using it would accept forged sessions.
  if (read('PAYLOAD_SECRET') === EXAMPLE_PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_SECRET still has the example value. Generate one with `openssl rand -hex 32`.')
  }

  return {
    databaseUrl: read('DATABASE_URL'),
    payloadSecret: read('PAYLOAD_SECRET'),
    storage: {
      endpoint: read('S3_ENDPOINT'),
      region: read('S3_REGION'),
      bucket: read('S3_BUCKET'),
      accessKeyId: read('S3_ACCESS_KEY_ID'),
      secretAccessKey: read('S3_SECRET_ACCESS_KEY'),
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/env.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Add SeaweedFS credentials** — `docker/seaweedfs/s3.json`

```json
{
  "identities": [
    {
      "name": "forja",
      "credentials": [{ "accessKey": "forja", "secretKey": "forja-dev-secret" }],
      "actions": ["Admin", "Read", "Write", "List", "Tagging"]
    }
  ]
}
```

- [ ] **Step 6: Add the storage services** — `docker-compose.yml` (keep the `postgres` service as is)

```yaml
services:
  postgres:
    # … unchanged …

  # SeaweedFS instead of MinIO: MinIO's community edition was archived in 2026 and its images no longer pull.
  storage:
    image: chrislusf/seaweedfs:4.47
    restart: unless-stopped
    command: server -dir=/data -s3 -s3.port=8333 -s3.config=/etc/seaweedfs/s3.json
    ports:
      - '8333:8333'
    volumes:
      - storagedata:/data
      - ./docker/seaweedfs/s3.json:/etc/seaweedfs/s3.json:ro
    healthcheck:
      test: ['CMD-SHELL', 'wget -q -O /dev/null http://127.0.0.1:8333/healthz']
      interval: 2s
      timeout: 5s
      retries: 30

  # Runs once through `pnpm db:up`; `docker compose up --wait` treats a container that exits as a failure.
  storage-buckets:
    image: chrislusf/seaweedfs:4.47
    profiles: ['setup']
    depends_on:
      storage:
        condition: service_healthy
    entrypoint: ['sh', '-c']
    command:
      - 'for bucket in forja-media forja-media-test; do echo "s3.bucket.create -name $$bucket" | weed shell -master=storage:9333; done'

volumes:
  pgdata:
  storagedata:
```

- [ ] **Step 7: Make `db:up` start storage and create the buckets** — `package.json` scripts

```json
"db:up": "docker compose up -d --wait postgres storage && docker compose run --rm storage-buckets",
```

- [ ] **Step 8: Document the variables** — append to `.env.example`, and append the same block to your local `.env`

```dotenv
# Imagens (S3). Local: SeaweedFS do docker-compose (`pnpm db:up`).
# Deploy de dev: Cloudflare R2 — S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com, S3_REGION=auto,
# S3_BUCKET=forja-media-dev e as chaves de um token R2 "Object Read & Write" restrito a esse bucket.
S3_ENDPOINT=http://127.0.0.1:8333
S3_REGION=us-east-1
S3_BUCKET=forja-media
S3_BUCKET_TEST=forja-media-test
S3_ACCESS_KEY_ID=forja
S3_SECRET_ACCESS_KEY=forja-dev-secret
```

- [ ] **Step 9: Verify the local storage end to end**

Run:
```bash
pnpm db:up
echo ok > /tmp/forja-s3-check.txt
A="--aws-sigv4 aws:amz:us-east-1:s3 --user forja:forja-dev-secret"
curl -s -o /dev/null -w "put %{http_code}\n" $A -T /tmp/forja-s3-check.txt http://127.0.0.1:8333/forja-media/check.txt
curl -s $A http://127.0.0.1:8333/forja-media/check.txt
curl -s -o /dev/null -w "anonymous %{http_code}\n" http://127.0.0.1:8333/forja-media/check.txt
curl -s -o /dev/null -w "delete %{http_code}\n" $A -X DELETE http://127.0.0.1:8333/forja-media/check.txt
pnpm db:up   # second run must also succeed (bucket creation is idempotent)
```
Expected: `put 200`, `ok`, `anonymous 403`, `delete 204`, and exit code 0 on both `pnpm db:up` runs.

- [ ] **Step 10: Commit**

```bash
git add src/config/env.ts tests/unit/env.spec.ts docker/seaweedfs/s3.json docker-compose.yml package.json .env.example
git commit -m "feat: add local S3 storage with SeaweedFS and validated server env"
```

---

### Task 2: Imagens do Payload no bucket S3

**Files:**
- Modify: `package.json` (deps), `src/payload.config.ts`, `src/collections/Media.ts`, `vitest.setup.ts`, `tests/helpers/fixtures.ts`
- Create: `tests/int/media.spec.ts`, `src/migrations/<timestamp>_media_storage_s3.ts` (+ `.json`, gerados)
- Generated: `src/payload-types.ts`, `src/app/(payload)/admin/importMap.js`

**Interfaces:**
- Consumes: `readServerEnv`, `StorageEnv` (Task 1).
- Produces: `MAX_UPLOAD_BYTES` exported from `src/collections/Media.ts` (`4 * 1024 * 1024`). Media docs get `url` = `/api/media/file/<filename>` and an optional `prefix` field. `resetDatabase` also empties `media`.

- [ ] **Step 1: Install the adapter and the test client**

```bash
pnpm add @payloadcms/storage-s3@3.90.2
pnpm add -D @aws-sdk/client-s3
```

- [ ] **Step 2: Point tests at the test bucket** — `vitest.setup.ts`, after the `DATABASE_URL` lines

```ts
if (!process.env.S3_BUCKET_TEST) {
  throw new Error('S3_BUCKET_TEST is not set. Copy the S3 block from .env.example to .env.')
}

process.env.S3_BUCKET = process.env.S3_BUCKET_TEST
```

- [ ] **Step 3: Let `resetDatabase` clear images** — `tests/helpers/fixtures.ts`

```ts
const COLLECTIONS_IN_DELETE_ORDER = ['games', 'articles', 'users', 'guilds', 'media'] as const
```

- [ ] **Step 4: Write the failing test** — `tests/int/media.spec.ts`

```ts
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { Payload } from 'payload'
import sharp from 'sharp'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { readServerEnv } from '@/config/env'

import { getTestPayload, resetDatabase } from '../helpers/fixtures'

let payload: Payload

const { storage } = readServerEnv()
const s3 = new S3Client({
  endpoint: storage.endpoint,
  region: storage.region,
  forcePathStyle: true,
  credentials: { accessKeyId: storage.accessKeyId, secretAccessKey: storage.secretAccessKey },
})

const objectExists = async (key: string): Promise<boolean> => {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: storage.bucket, Key: key }))
    return true
  } catch (error) {
    if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) return false
    throw error
  }
}

const uploadTestImage = async () => {
  const png = await sharp({ create: { width: 32, height: 18, channels: 3, background: '#D21312' } }).png().toBuffer()
  return payload.create({
    collection: 'media',
    data: { alt: 'Capa de teste' },
    file: { data: png, mimetype: 'image/png', name: 'capa-teste.png', size: png.length },
    overrideAccess: true,
  })
}

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  await resetDatabase(payload)
})

describe('media storage', () => {
  it('stores uploads in the S3 bucket and serves them through Payload', async () => {
    const media = await uploadTestImage()

    expect(media.url).toBe(`/api/media/file/${media.filename}`)
    expect(media.width).toBe(32)
    expect(await objectExists(media.filename!)).toBe(true)
  })

  it('removes the file from the bucket when the image is deleted', async () => {
    const media = await uploadTestImage()

    await payload.delete({ collection: 'media', id: media.id, overrideAccess: true })

    expect(await objectExists(media.filename!)).toBe(false)
  })
})
```

- [ ] **Step 5: Run test to verify it fails**

Run: `pnpm test tests/int/media.spec.ts`
Expected: FAIL. The first test fails on `objectExists(...)` returning `false`, because Payload still writes to the local `media/` folder.

- [ ] **Step 6: Add the upload limit to Media** — `src/collections/Media.ts`

```ts
import type { CollectionConfig } from 'payload'

import { adminOnly, anyone, authenticated } from '@/access'

// Vercel rejects request bodies above 4.5 MB, and uploads pass through the Payload API.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Imagem', plural: 'Imagens' },
  admin: {
    description: 'Imagens de até 4 MB. Comprima fotos e prints grandes antes de enviar.',
  },
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

- [ ] **Step 7: Register the S3 adapter** — `src/payload.config.ts`

Add the imports:
```ts
import { s3Storage } from '@payloadcms/storage-s3'

import { readServerEnv } from './config/env'
import { MAX_UPLOAD_BYTES } from './collections/Media'
```
(keep `Media` in the existing `import { Media } from './collections/Media'`; merge both into one import line: `import { MAX_UPLOAD_BYTES, Media } from './collections/Media'`).

Before `export default buildConfig({`:
```ts
const env = readServerEnv()
```

Replace the `db` and `secret` entries, and add `upload` and `plugins`:
```ts
  db: postgresAdapter({
    pool: { connectionString: env.databaseUrl },
  }),
  // …
  plugins: [
    s3Storage({
      bucket: env.storage.bucket,
      collections: { media: true },
      // Keeps the media schema identical in every environment, so migrations match.
      alwaysInsertFields: true,
      config: {
        endpoint: env.storage.endpoint,
        region: env.storage.region,
        forcePathStyle: true,
        credentials: { accessKeyId: env.storage.accessKeyId, secretAccessKey: env.storage.secretAccessKey },
      },
    }),
  ],
  secret: env.payloadSecret,
  upload: { limits: { fileSize: MAX_UPLOAD_BYTES } },
```

- [ ] **Step 8: Run test to verify it passes**

Run: `pnpm test tests/int/media.spec.ts`
Expected: PASS (2 tests). If `media.url` differs from `/api/media/file/<filename>`, stop and report. The whole plan depends on Payload serving the file, because `next.config.ts` only allows that path for `next/image`.

- [ ] **Step 9: Regenerate types and import map; create the migration**

```bash
pnpm generate:types
pnpm generate:importmap
pnpm payload migrate:create media_storage_s3
```
Expected: the new migration adds a nullable `prefix` column to `media` (open the generated `.ts` and confirm it touches only `media`). If it contains anything else, stop and report; the schema snapshot would be out of sync.

- [ ] **Step 10: Run the full suite**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: all green.

- [ ] **Step 11: Commit**

```bash
git add package.json pnpm-lock.yaml src/payload.config.ts src/collections/Media.ts vitest.setup.ts tests/helpers/fixtures.ts tests/int/media.spec.ts src/migrations src/payload-types.ts "src/app/(payload)/admin/importMap.js"
git commit -m "feat: store uploaded images in S3 and cap uploads at 4 MB"
```

---

### Task 3: Seed com imagens e admin seguro para bancos remotos

**Files:**
- Create: `src/seed/admin.ts`, `src/seed/placeholderImage.ts`, `tests/unit/seed-admin.spec.ts`, `tests/unit/placeholder-image.spec.ts`
- Modify: `src/seed/seed.ts`, `src/seed/index.ts`, `tests/int/seed.spec.ts`

**Interfaces:**
- Consumes: `SHARD_POLYGONS` from `src/components/brand/Shards.tsx` (viewBox `0 0 272 283`); `readDesignTokens(designMd: string): DesignTokens` from `src/design-system/tokens.ts`; `resetDatabase` clearing `media` (Task 2).
- Produces:
  - `type SeedAdmin = { name: string; email: string; password: string }`
  - `LOCAL_SEED_ADMIN: SeedAdmin` (replaces the old `SEED_ADMIN` export)
  - `isLocalDatabase(databaseUrl: string): boolean`
  - `resolveSeedAdmin(env: Record<string, string | undefined>): SeedAdmin`
  - `type PlaceholderPalette = { background: string; stripe: string; shard: string }`
  - `placeholderSvg(width: number, height: number, palette: PlaceholderPalette, variant: number): string`
  - `renderPlaceholderPng(width: number, height: number, palette: PlaceholderPalette, variant: number): Promise<Buffer>`
  - `seed(payload: Payload, admin?: SeedAdmin): Promise<void>`

- [ ] **Step 1: Write the failing tests**

`tests/unit/seed-admin.spec.ts`:
```ts
import { describe, expect, it } from 'vitest'

import { LOCAL_SEED_ADMIN, isLocalDatabase, resolveSeedAdmin } from '@/seed/admin'

const localDb = 'postgresql://postgres:postgres@127.0.0.1:5432/forja'
const remoteDb = 'postgresql://user:pass@ep-quiet-sky-123.sa-east-1.aws.neon.tech/forja?sslmode=require'

describe('isLocalDatabase', () => {
  it('recognizes the docker-compose database', () => {
    expect(isLocalDatabase(localDb)).toBe(true)
    expect(isLocalDatabase('postgresql://postgres:postgres@localhost:5432/forja')).toBe(true)
  })

  it('treats anything else, or an invalid URL, as remote', () => {
    expect(isLocalDatabase(remoteDb)).toBe(false)
    expect(isLocalDatabase('not a url')).toBe(false)
  })
})

describe('resolveSeedAdmin', () => {
  it('uses the public local login only against the local database', () => {
    expect(resolveSeedAdmin({ DATABASE_URL: localDb })).toBe(LOCAL_SEED_ADMIN)
  })

  it('refuses to create the public local login in a remote database', () => {
    expect(() => resolveSeedAdmin({ DATABASE_URL: remoteDb })).toThrow(/SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD/)
  })

  it('uses the admin given through the environment', () => {
    const admin = resolveSeedAdmin({
      DATABASE_URL: remoteDb,
      SEED_ADMIN_EMAIL: ' prof@cesar.school ',
      SEED_ADMIN_PASSWORD: 'uma-senha-bem-longa',
    })
    expect(admin).toEqual({ name: LOCAL_SEED_ADMIN.name, email: 'prof@cesar.school', password: 'uma-senha-bem-longa' })
  })

  it('rejects short passwords and half-filled settings', () => {
    expect(() =>
      resolveSeedAdmin({ DATABASE_URL: remoteDb, SEED_ADMIN_EMAIL: 'a@b.c', SEED_ADMIN_PASSWORD: 'curta' }),
    ).toThrow(/at least 12 characters/)
    expect(() => resolveSeedAdmin({ DATABASE_URL: localDb, SEED_ADMIN_EMAIL: 'a@b.c' })).toThrow(
      /SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD/,
    )
  })
})
```

`tests/unit/placeholder-image.spec.ts`:
```ts
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { placeholderSvg, renderPlaceholderPng } from '@/seed/placeholderImage'

const palette = { background: '#16161A', stripe: '#3A0C0C', shard: '#D21312' }

describe('placeholder images', () => {
  it('renders a PNG of the requested size', async () => {
    const png = await renderPlaceholderPng(320, 180, palette, 0)
    const metadata = await sharp(png).metadata()

    expect(metadata).toMatchObject({ format: 'png', width: 320, height: 180 })
  })

  it('uses the brand palette', () => {
    const svg = placeholderSvg(320, 180, palette, 0)

    expect(svg).toContain('#16161A')
    expect(svg).toContain('#3A0C0C')
    expect(svg).toContain('#D21312')
  })

  it('varies the composition so seeded galleries do not repeat one image', () => {
    expect(placeholderSvg(320, 180, palette, 0)).not.toBe(placeholderSvg(320, 180, palette, 1))
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/unit/seed-admin.spec.ts tests/unit/placeholder-image.spec.ts`
Expected: FAIL, modules `@/seed/admin` and `@/seed/placeholderImage` not found.

- [ ] **Step 3: Implement the admin resolution** — `src/seed/admin.ts`

```ts
export type SeedAdmin = { name: string; email: string; password: string }

export const LOCAL_SEED_ADMIN: SeedAdmin = { name: 'Admin Forja', email: 'admin@forja.local', password: 'forja-dev' }

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])
const MIN_PASSWORD_LENGTH = 12

export const isLocalDatabase = (databaseUrl: string): boolean => {
  try {
    return LOCAL_HOSTS.has(new URL(databaseUrl).hostname)
  } catch {
    return false
  }
}

// The local login is published in the repository, so it must never reach a database others can open.
export const resolveSeedAdmin = (env: Record<string, string | undefined>): SeedAdmin => {
  const email = env.SEED_ADMIN_EMAIL?.trim() ?? ''
  const password = env.SEED_ADMIN_PASSWORD ?? ''
  const missingSettings = 'Set both SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD'

  if (email && password) {
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`SEED_ADMIN_PASSWORD must have at least ${MIN_PASSWORD_LENGTH} characters.`)
    }
    return { name: LOCAL_SEED_ADMIN.name, email, password }
  }
  if (email || password) throw new Error(`${missingSettings}, or neither.`)
  if (isLocalDatabase(env.DATABASE_URL ?? '')) return LOCAL_SEED_ADMIN

  throw new Error(`${missingSettings} to seed a remote database; the local admin password is public.`)
}
```

- [ ] **Step 4: Implement the placeholder images** — `src/seed/placeholderImage.ts`

```ts
import sharp from 'sharp'

import { SHARD_POLYGONS } from '@/components/brand/Shards'

export type PlaceholderPalette = { background: string; stripe: string; shard: string }

const SHARD_VIEWBOX = { width: 272, height: 283 }
const STRIPE_ANGLE = -28 // DESIGN.md: diagonal stripes at ~28°, like the cuts of the logo lettering.

export const placeholderSvg = (width: number, height: number, palette: PlaceholderPalette, variant: number): string => {
  const stripeWidth = Math.round(width / 10)
  const offset = (variant * stripeWidth * 1.7) % (width / 2)
  const stripes = [0, 1, 2]
    .map((index) => {
      const x = offset + index * stripeWidth * 2.2
      return `<rect x="${x}" y="${-height}" width="${stripeWidth}" height="${height * 3}" fill="${palette.stripe}" />`
    })
    .join('')
  const shardSize = Math.round(height * 0.45)
  const shardX = width - shardSize - Math.round(width * 0.08) - (variant % 3) * Math.round(width * 0.12)
  const shardY = Math.round((height - shardSize) / 2)
  const scale = shardSize / SHARD_VIEWBOX.height
  const shards = SHARD_POLYGONS.map((points) => `<polygon points="${points}" fill="${palette.shard}" />`).join('')

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="${palette.background}" />`,
    `<g transform="rotate(${STRIPE_ANGLE} ${width / 2} ${height / 2})">${stripes}</g>`,
    `<g transform="translate(${shardX} ${shardY}) scale(${scale})">${shards}</g>`,
    '</svg>',
  ].join('')
}

export const renderPlaceholderPng = (
  width: number,
  height: number,
  palette: PlaceholderPalette,
  variant: number,
): Promise<Buffer> => sharp(Buffer.from(placeholderSvg(width, height, palette, variant))).png().toBuffer()
```

- [ ] **Step 5: Run the unit tests to verify they pass**

Run: `pnpm test tests/unit/seed-admin.spec.ts tests/unit/placeholder-image.spec.ts`
Expected: PASS (5 + 3 tests).

- [ ] **Step 6: Update the seed test first (it must fail)** — replace `tests/int/seed.spec.ts`

```ts
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { LOCAL_SEED_ADMIN } from '@/seed/admin'
import { seed } from '@/seed/seed'

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
  media: (await payload.count({ collection: 'media' })).totalDocs,
})

// 3 game covers + 3 gallery images for the first game.
const SEEDED = { users: 1, guilds: 8, games: 3, articles: 3, media: 6 }

describe('seed', () => {
  it('creates the prototype content, published and visible to visitors', async () => {
    await seed(payload)

    expect(await countAll()).toEqual(SEEDED)
    const visibleGames = await payload.find({ collection: 'games', overrideAccess: false })
    expect(visibleGames.totalDocs).toBe(3)
    const { docs } = await payload.find({ collection: 'users', where: { email: { equals: LOCAL_SEED_ADMIN.email } } })
    expect(docs[0].role).toBe('admin')
  })

  it('gives every game a cover stored in the bucket and a gallery to the first one', async () => {
    await seed(payload)

    const { docs } = await payload.find({ collection: 'games', depth: 1, sort: 'createdAt', overrideAccess: false })
    for (const game of docs) {
      expect(typeof game.cover === 'object' && game.cover?.url).toMatch(/^\/api\/media\/file\//)
    }
    expect(docs[0].gallery).toHaveLength(3)
  })

  it('creates the admin it is given', async () => {
    const admin = { name: 'Profa. Teste', email: 'profa@forja.test', password: 'uma-senha-bem-longa' }
    await seed(payload, admin)

    const { docs } = await payload.find({ collection: 'users', where: { email: { equals: admin.email } } })
    expect(docs).toHaveLength(1)
  })

  it('can run again without duplicating content or images', async () => {
    await seed(payload)
    await seed(payload)

    expect(await countAll()).toEqual(SEEDED)
  })
})
```

Run: `pnpm test tests/int/seed.spec.ts`
Expected: FAIL, `@/seed/seed` does not accept the admin argument yet, and `media` counts 0 / covers are missing.

- [ ] **Step 7: Seed images and the resolved admin** — replace `src/seed/seed.ts`

```ts
import { readFileSync } from 'node:fs'

import type { Payload } from 'payload'

import { readDesignTokens } from '@/design-system/tokens'
import { slugify } from '@/utilities/slugify'

import { LOCAL_SEED_ADMIN, type SeedAdmin } from './admin'
import { articles, games, guilds } from './data'
import { renderPlaceholderPng, type PlaceholderPalette } from './placeholderImage'

// The seed runs outside Next.js, where revalidatePath would throw.
const trustedScript = { overrideAccess: true, context: { disableRevalidate: true } } as const

const COLLECTIONS_IN_DELETE_ORDER = ['games', 'articles', 'users', 'guilds', 'media'] as const

const COVER = { width: 1600, height: 900 }
const GALLERY_SIZE = 3

const brandPalette = (): PlaceholderPalette => {
  const { colors } = readDesignTokens(readFileSync('DESIGN.md', 'utf8'))
  return { background: colors['surface-raised'], stripe: colors.ember, shard: colors.primary }
}

export const seed = async (payload: Payload, admin: SeedAdmin = LOCAL_SEED_ADMIN): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The seed wipes content and must never run in production.')
  }

  for (const collection of COLLECTIONS_IN_DELETE_ORDER) {
    await payload.delete({ collection, where: { id: { exists: true } }, ...trustedScript })
  }

  await payload.create({ collection: 'users', data: { ...admin, role: 'admin' }, ...trustedScript })

  const palette = brandPalette()
  let variant = 0
  const uploadPlaceholder = async (alt: string, name: string): Promise<number> => {
    const data = await renderPlaceholderPng(COVER.width, COVER.height, palette, variant++)
    const media = await payload.create({
      collection: 'media',
      data: { alt },
      file: { data, mimetype: 'image/png', name: `${name}.png`, size: data.length },
      ...trustedScript,
    })
    return media.id
  }

  const guildIdByName = new Map<string, number>()
  for (const guild of guilds) {
    const created = await payload.create({
      collection: 'guilds',
      data: { ...guild, slug: slugify(guild.name), _status: 'published' },
      ...trustedScript,
    })
    guildIdByName.set(guild.name, created.id)
  }

  const guildId = (name: string): number => {
    const id = guildIdByName.get(name)
    if (id === undefined) throw new Error(`Seed references unknown guild "${name}"`)
    return id
  }

  for (const [index, { guildName, ...game }] of games.entries()) {
    const slug = slugify(game.title)
    const cover = await uploadPlaceholder(`Capa provisória de ${game.title}`, `${slug}-capa`)
    const gallery =
      index === 0
        ? await Promise.all(
            Array.from({ length: GALLERY_SIZE }, (_, shot) =>
              uploadPlaceholder(`Imagem provisória ${shot + 1} de ${game.title}`, `${slug}-galeria-${shot + 1}`),
            ),
          )
        : []

    await payload.create({
      collection: 'games',
      data: { ...game, slug, cover, gallery, guild: guildId(guildName), _status: 'published' },
      ...trustedScript,
    })
  }

  for (const { guildName, ...article } of articles) {
    await payload.create({
      collection: 'articles',
      data: { ...article, guild: guildName ? guildId(guildName) : null },
      ...trustedScript,
    })
  }
}
```

Note: `Promise.all` with `variant++` inside is safe because `renderPlaceholderPng` is called synchronously for each item before any await resolves, so each gets a distinct variant.

- [ ] **Step 8: Resolve the admin in the CLI entry** — replace `src/seed/index.ts`

```ts
import config from '@payload-config'
import { getPayload } from 'payload'

import { LOCAL_SEED_ADMIN, resolveSeedAdmin } from './admin'
import { seed } from './seed'

const admin = resolveSeedAdmin(process.env)
const payload = await getPayload({ config })
await seed(payload, admin)

const login = admin === LOCAL_SEED_ADMIN ? `${admin.email} / ${admin.password}` : admin.email
payload.logger.info(`Seed complete. Admin login: ${login}`)
process.exit(0)
```

- [ ] **Step 9: Run tests and the real seed**

Run:
```bash
grep -rn "SEED_ADMIN\b" src tests   # must print nothing: every use now imports LOCAL_SEED_ADMIN
pnpm test && pnpm typecheck && pnpm lint
pnpm seed
```
Expected: suite green; `pnpm seed` ends with `Seed complete. Admin login: admin@forja.local / forja-dev`. Then with `pnpm dev`, `/jogos/ecos-de-ferro` shows the cover and a 3-image gallery loaded from `/api/media/file/...`.

- [ ] **Step 10: Commit**

```bash
git add src/seed tests/unit/seed-admin.spec.ts tests/unit/placeholder-image.spec.ts tests/int/seed.spec.ts
git commit -m "feat: seed placeholder images and require a private admin for remote databases"
```

---

### Task 4: Pronto para o deploy de dev — script, documentação e verificação ponta a ponta

**Files:**
- Modify: `package.json` (rename `ci` → `vercel-build`), `CLAUDE.md`
- Create: `README.md`

**Interfaces:**
- Consumes: everything above. `vercel-build` is the script Vercel (and `vercel build` in Actions) runs instead of `build` when present.

- [ ] **Step 1: Rename the deploy script** — `package.json`

Replace `"ci": "payload migrate && pnpm build",` with:
```json
"vercel-build": "payload migrate && pnpm build",
```
(`pnpm ci` collides with pnpm's own `ci` command; Vercel runs `vercel-build` automatically.)

- [ ] **Step 2: Write `README.md`** (Portuguese; audience: whoever inherits the project)

```markdown
# Forja — site

Site da Forja, a iniciativa de desenvolvimento de jogos do CESAR. Next.js + Payload CMS + Postgres.
As decisões de arquitetura e as regras do projeto estão no [`CLAUDE.md`](CLAUDE.md); o visual, no [`DESIGN.md`](DESIGN.md).

## Rodar localmente

Requisitos: Node 24+, pnpm 12 e Docker.

1. `cp .env.example .env` e troque o `PAYLOAD_SECRET` por `openssl rand -hex 32`.
2. `pnpm install`
3. `pnpm db:up` — sobe o Postgres e o SeaweedFS (armazenamento de imagens compatível com S3) e cria os buckets.
4. `pnpm seed` — conteúdo de exemplo. **Apaga** o conteúdo local. Login: `admin@forja.local` / `forja-dev`.
5. `pnpm dev` — site em http://localhost:3000, painel em http://localhost:3000/admin.

Os outros comandos (testes, tipos, migrações) estão no `CLAUDE.md`, seção "Comandos".

## Variáveis de ambiente

| Variável | Local | Deploy de dev |
|---|---|---|
| `DATABASE_URL` | Postgres do Docker | Connection string do Neon (`?sslmode=require`) |
| `PAYLOAD_SECRET` | `openssl rand -hex 32` | Outro valor gerado; nunca o do `.env.example` |
| `S3_ENDPOINT` | `http://127.0.0.1:8333` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `S3_REGION` | `us-east-1` | `auto` |
| `S3_BUCKET` | `forja-media` | `forja-media-dev` |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | `forja` / `forja-dev-secret` | Token R2 "Object Read & Write" restrito ao bucket |
| `S3_BUCKET_TEST` | `forja-media-test` | não usar |

O app não inicia se faltar alguma variável: a mensagem de erro diz quais.

## Deploy de dev

O projeto na Vercel e as pipelines do GitHub Actions são configurados fora deste repositório. O que o código espera:

- **Build:** `pnpm vercel-build`. Roda as migrações (`payload migrate`) e depois o `next build`. O build pré-renderiza páginas, então o banco precisa estar acessível durante o build.
- **Imagens no R2:** o bucket fica **privado**. O site entrega as imagens por `/api/media/file/...`, então não é preciso domínio público nem CORS no R2.
- **Uploads até 4 MB:** a Vercel recusa requisições maiores que 4,5 MB. O painel mostra erro para arquivos maiores.
- **Primeiro admin:** num banco vazio, o primeiro usuário criado em `/admin` vira admin. Crie o seu logo depois do primeiro deploy, **antes** de divulgar o link.
- **Conteúdo de exemplo no deploy (opcional):** rode o seed da sua máquina com as variáveis do deploy e um admin próprio. O seed se recusa a criar o admin padrão, cuja senha é pública, num banco remoto:
  `DATABASE_URL=… S3_…=… SEED_ADMIN_EMAIL=voce@… SEED_ADMIN_PASSWORD=… pnpm seed`
```

- [ ] **Step 3: Update `CLAUDE.md`**

  - In `## Stack`, replace the **Mídia** row with:
    `| Mídia | \`@payloadcms/storage-s3\`: **SeaweedFS** no ambiente local (Docker Compose) e **Cloudflare R2** no deploy. O Payload serve as imagens por \`/api/media/file/...\`; o bucket fica privado. Vídeo só por embed do YouTube. |`
  - In **Decisões que não devem ser revertidas**, add:
    `- **Sem MinIO.** A edição comunitária foi arquivada em 2026 e as imagens oficiais não baixam mais. O S3 local é o SeaweedFS, com a versão fixada no \`docker-compose.yml\`.`
  - In `## Comandos`, change the `pnpm db:up` comment to `# Postgres e SeaweedFS (Docker). Cria os bancos forja/forja_test e os buckets` and replace the `pnpm seed` line with `pnpm seed                   # APAGA e recria o conteúdo de exemplo, com imagens (admin@forja.local / forja-dev só em banco local)`.
  - In `## Onde fica cada coisa`, add:
    `- **Variáveis de ambiente:** \`src/config/env.ts\` (\`readServerEnv\`) valida tudo o que o servidor precisa e falha com os nomes do que falta. Nova variável obrigatória entra lá, no \`.env.example\` e na tabela do \`README.md\`.`
    `- **Imagens:** \`src/collections/Media.ts\` (limite de 4 MB, por causa do limite de 4,5 MB da Vercel) e o \`s3Storage\` em \`src/payload.config.ts\`. Os testes usam o bucket \`forja-media-test\`.`
  - In `## Riscos a ter em mente`, add:
    `- **Deploy de dev em contas pessoais:** serve para apresentar o MVP. Se a Forja adotar o site, a produção nasce nas contas institucionais; não promova o ambiente de dev a produção.`

- [ ] **Step 4: Verify a fresh database built only from migrations (Review Focus 4)**

```bash
docker compose exec -T postgres createdb -U postgres forja_migrations_check
export CHECK_DB=postgresql://postgres:postgres@127.0.0.1:5432/forja_migrations_check
DATABASE_URL=$CHECK_DB pnpm payload migrate
DATABASE_URL=$CHECK_DB pnpm build
DATABASE_URL=$CHECK_DB pnpm start -p 3111   # run in the background
```
Expected:
- `payload migrate` applies all 4 migrations with no prompt.
- The build passes with zero content.
- `curl -s -o /dev/null -w "%{http_code}"` returns 200 for `/`, `/guildas`, `/jogos` and `/artigos` on port 3111, and each page shows its empty state.
- `/admin` redirects to the create-first-user screen.

Then stop the server and run `docker compose exec -T postgres dropdb -U postgres forja_migrations_check`.

- [ ] **Step 5: Verify uploads in the browser and over HTTP (Review Focus 2 and 5)**

With the local DB seeded, run `pnpm build && pnpm start -p 3111` (background), then:
- **Normal upload.** With Playwright, log in as `admin@forja.local` and upload a ~1 MB PNG under Imagens. Set it as the cover of Circuito 404 and publish. Expected: `/jogos/circuito-404` shows the image, and `next/image` requests `/_next/image?url=%2Fapi%2Fmedia%2Ffile%2F...` with 200.
- **Oversized upload.** Upload a 5 MB file, e.g. from `head -c 5242880 /dev/urandom > big.png`, or better a real 5 MB PNG made with sharp. Expected: the panel shows an error; `GET /api/media?where[filename][like]=big` returns 0 docs; nothing new appears in the bucket.
- **Persistence.** Run `docker compose restart storage`, wait for it to be healthy, and reload `/jogos/circuito-404`. Expected: the image still loads.
- **Deletion.** Delete that image in the panel. Expected: a HEAD on the object in `forja-media` returns 404.
- Record each result in the ledger. Stop the server afterwards.

- [ ] **Step 6: Full suite and build**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add package.json README.md CLAUDE.md
git commit -m "docs: document local setup, env vars and the dev deploy contract"
```
