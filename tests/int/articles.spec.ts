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
