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
