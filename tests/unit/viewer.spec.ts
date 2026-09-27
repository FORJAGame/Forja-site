import { describe, expect, it } from 'vitest'

import { PUBLIC_VIEWER, queryOptionsFor } from '@/lib/viewer'

describe('queryOptionsFor', () => {
  it('reads published content as an anonymous visitor by default', () => {
    expect(queryOptionsFor(PUBLIC_VIEWER)).toEqual({ draft: false, user: null, overrideAccess: false })
  })

  it('reads drafts with the logged-in user, never overriding access', () => {
    const user = { id: 1, collection: 'users' } as never
    expect(queryOptionsFor({ draft: true, user })).toEqual({ draft: true, user, overrideAccess: false })
  })
})
