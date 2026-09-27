import { APIError, type CollectionBeforeDeleteHook } from 'payload'

export const preventDeletingGuildInUse: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const members = await req.payload.count({ collection: 'users', where: { guild: { equals: id } }, req })
  if (members.totalDocs > 0) {
    throw new APIError('Esta guilda ainda tem membros ou jogos. Mova-os antes de excluí-la.', 400, null, true)
  }
}
