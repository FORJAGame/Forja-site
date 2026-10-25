import { describe, expect, it } from 'vitest'

import UnknownPage from '@/app/(frontend)/[...unknown]/page'

const notFoundDigest = (render: () => unknown): string | undefined => {
  try {
    render()
  } catch (error) {
    return (error as { digest?: string }).digest
  }
  return undefined
}

describe('unknown routes', () => {
  it('render the site 404 for any URL no route handles', () => {
    expect(notFoundDigest(UnknownPage)).toMatch(/404/)
  })
})
