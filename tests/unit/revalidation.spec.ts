import { revalidatePath } from 'next/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { revalidateAfterDelete, revalidateOnPublish } from '@/hooks/revalidation'

type AfterChangeArgs = Parameters<typeof revalidateOnPublish>[0]
type AfterDeleteArgs = Parameters<typeof revalidateAfterDelete>[0]

const afterChange = (
  doc: Record<string, unknown>,
  { previousDoc = {}, context = {} }: { previousDoc?: Record<string, unknown>; context?: Record<string, unknown> } = {},
) => revalidateOnPublish({ doc, previousDoc, context, req: { context } } as unknown as AfterChangeArgs)

beforeEach(() => {
  vi.mocked(revalidatePath).mockClear()
})

describe('revalidateOnPublish', () => {
  // Route groups such as (frontend) are part of a page's cache tag, so '/guildas/[slug]' would match nothing.
  it('refreshes every public page through the root layout', () => {
    afterChange({ _status: 'published' })

    expect(vi.mocked(revalidatePath).mock.calls).toEqual([['/', 'layout']])
  })

  it('refreshes public pages for collections without drafts (articles)', () => {
    afterChange({ title: 'Artigo' })
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('leaves the cache alone for draft saves and autosaves', () => {
    afterChange({ _status: 'draft' }, { previousDoc: { _status: 'draft' } })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('refreshes public pages when a published document is unpublished', () => {
    afterChange({ _status: 'draft' }, { previousDoc: { _status: 'published' } })
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('can be switched off for trusted scripts such as the seed', () => {
    afterChange({ _status: 'published' }, { context: { disableRevalidate: true } })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('returns the document untouched', () => {
    const doc = { _status: 'published' }
    expect(afterChange(doc)).toBe(doc)
  })
})

describe('revalidateAfterDelete', () => {
  it('refreshes public pages when a document is deleted', () => {
    const doc = { id: 1 }
    const result = revalidateAfterDelete({ doc, context: {}, req: { context: {} } } as unknown as AfterDeleteArgs)

    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    expect(result).toBe(doc)
  })
})
