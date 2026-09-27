import type { Payload } from 'payload'

export const countPublishedGamesByGuild = async (payload: Payload): Promise<Map<number, number>> => {
  const { docs } = await payload.find({
    collection: 'games',
    overrideAccess: false,
    pagination: false,
    depth: 0,
    select: { guild: true },
  })
  const counts = new Map<number, number>()
  for (const { guild } of docs) {
    const guildId = typeof guild === 'object' ? guild.id : guild
    counts.set(guildId, (counts.get(guildId) ?? 0) + 1)
  }
  return counts
}
