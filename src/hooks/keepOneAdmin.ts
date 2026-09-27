import { APIError, type CollectionBeforeChangeHook, type CollectionBeforeDeleteHook, type PayloadRequest } from 'payload'

const LAST_ADMIN_MESSAGE = 'A Forja precisa de pelo menos um admin. Promova outra pessoa antes.'

const assertAnotherAdminRemains = async (req: PayloadRequest, userId: number | string) => {
  const { totalDocs } = await req.payload.count({
    collection: 'users',
    where: { and: [{ role: { equals: 'admin' } }, { id: { not_equals: userId } }] },
    req,
  })
  if (totalDocs === 0) throw new APIError(LAST_ADMIN_MESSAGE, 400, null, true)
}

// Only guards actions taken by a person; trusted server code (seed, test resets) runs without a user.
export const keepOneAdminOnDemotion: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  if (req.user && operation === 'update' && originalDoc?.role === 'admin' && data.role === 'editor') {
    await assertAnotherAdminRemains(req, originalDoc.id)
  }
  return data
}

export const keepOneAdminOnDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  if (!req.user) return
  const user = await req.payload.findByID({ collection: 'users', id, depth: 0, req })
  if (user.role === 'admin') await assertAnotherAdminRemains(req, id)
}
