import config from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { resolvePreviewTarget } from '@/lib/queries/preview'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })

  const target = await resolvePreviewTarget(payload, user, searchParams.get('collection'), searchParams.get('id'))
  if ('status' in target) return new Response(target.message, { status: target.status })

  ;(await draftMode()).enable()
  redirect(target.path)
}
