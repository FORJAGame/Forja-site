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
