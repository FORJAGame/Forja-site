import { revalidatePath } from 'next/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PUBLIC_ROUTES, revalidateAfterDelete, revalidateOnPublish } from '@/hooks/revalidation'

type AfterChangeArgs = Parameters<typeof revalidateOnPublish>[0]
type AfterDeleteArgs = Parameters<typeof revalidateAfterDelete>[0]

const afterChange = (doc: Record<string, unknown>, context: Record<string, unknown> = {}) =>
  revalidateOnPublish({ doc, context, req: { context } } as unknown as AfterChangeArgs)

beforeEach(() => {
  vi.mocked(revalidatePath).mockClear()
})

describe('revalidateOnPublish', () => {
  it('refreshes every public route when a document is published', () => {
    afterChange({ _status: 'published' })

    expect(vi.mocked(revalidatePath).mock.calls).toEqual(PUBLIC_ROUTES.map((route) => route))
  })

  it('refreshes public routes for collections without drafts (articles)', () => {
    afterChange({ title: 'Artigo' })
    expect(revalidatePath).toHaveBeenCalledWith('/artigos')
  })

  it('leaves the cache alone for draft saves and autosaves', () => {
    afterChange({ _status: 'draft' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('can be switched off for trusted scripts such as the seed', () => {
    afterChange({ _status: 'published' }, { disableRevalidate: true })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('returns the document untouched', () => {
    const doc = { _status: 'published' }
    expect(afterChange(doc)).toBe(doc)
  })
})

describe('revalidateAfterDelete', () => {
  it('refreshes public routes when a document is deleted', () => {
    const doc = { id: 1 }
    const result = revalidateAfterDelete({ doc, context: {}, req: { context: {} } } as unknown as AfterDeleteArgs)

    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(result).toBe(doc)
  })
})
