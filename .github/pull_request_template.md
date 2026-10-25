## O que muda

<!-- O que este PR faz e por quê. Se resolve uma issue, escreva "Fecha #123" para fechá-la no merge. -->

## Como testar

<!-- O passo a passo para quem revisa ver a mudança funcionando: páginas, usuário (admin ou editor), dados de exemplo (`pnpm seed`). -->

## Prints

<!-- Para mudança visual: antes e depois, no desktop e no celular. Apague esta seção se não se aplica. -->

## Checklist

- [ ] `pnpm typecheck && pnpm lint && pnpm test` passam
- [ ] Mudança visual segue o `DESIGN.md`, só com tokens (se o `DESIGN.md` não cobria o caso, ele foi atualizado primeiro)
- [ ] Mudou uma coleção: rodei `pnpm generate:types` e criei a migração (`pnpm payload migrate:create <nome>`)
- [ ] Mexeu em regra de acesso ou publicação: tem teste com `overrideAccess: false`
- [ ] Variável de ambiente nova: está em `src/config/env.ts`, no `.env.example` e na tabela do `README.md`
- [ ] Registrou componente no painel: rodei `pnpm generate:importmap`
- [ ] Atualizei o `README.md` ou o `CLAUDE.md` se algo que eles descrevem mudou

<!-- Marque só o que se aplica. -->
