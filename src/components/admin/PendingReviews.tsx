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
