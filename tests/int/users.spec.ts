import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  createBaseFixture,
  createGuild,
  createUser,
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
  it('promotes the very first user to admin and leaves later users as editors', async () => {
    const first = await payload.create({
      collection: 'users',
      data: { name: 'Primeira', email: 'first@forja.test', password: 'test-password', role: 'editor' },
      overrideAccess: true,
    })
    const guild = await createGuild(payload, 'Aurora')
    const second = await payload.create({
      collection: 'users',
      data: {
        name: 'Segundo',
        email: 'second@forja.test',
        password: 'test-password',
        role: 'editor',
        guild: guild.id,
      },
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
        data: { name: 'Intruso', email: 'x@forja.test', password: 'test-password', role: 'editor', guild: guildA.id },
        user: editorA,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('refuses to demote the last admin', async () => {
    const { admin } = await createBaseFixture(payload)

    await expect(
      payload.update({
        collection: 'users',
        id: admin.id,
        data: { role: 'editor' },
        user: admin,
        overrideAccess: false,
      }),
    ).rejects.toThrow('A Forja precisa de pelo menos um admin')
  })

  it('refuses to delete the last admin', async () => {
    const { admin } = await createBaseFixture(payload)

    await expect(
      payload.delete({ collection: 'users', id: admin.id, user: admin, overrideAccess: false }),
    ).rejects.toThrow('A Forja precisa de pelo menos um admin')
  })

  it('lets an admin step down when another admin remains', async () => {
    const { admin, guildA } = await createBaseFixture(payload)
    await createUser(payload, { role: 'admin' })

    const updated = await payload.update({
      collection: 'users',
      id: admin.id,
      data: { role: 'editor', guild: guildA.id },
      user: admin,
      overrideAccess: false,
    })

    expect(updated.role).toBe('editor')
  })
  it('lets only admins unlock an account locked by failed logins', async () => {
    const { admin, editorA } = await createBaseFixture(payload)
    const unlockAdminAs = (user: typeof admin) =>
      payload.unlock({ collection: 'users', data: { email: admin.email }, overrideAccess: false, req: { user } })

    await expect(unlockAdminAs(editorA)).rejects.toMatchObject({ status: 403 })
    await expect(unlockAdminAs(admin)).resolves.toBe(true)
  })
})
