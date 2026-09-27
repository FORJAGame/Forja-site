import { describe, expect, it } from 'vitest'

import { cx } from '@/utilities/cx'
import { pluralize } from '@/utilities/pluralize'
import { isExternalHref } from '@/utilities/url'

describe('cx', () => {
  it('joins truthy class names only', () => {
    expect(cx('a', false, null, undefined, 'b', '')).toBe('a b')
  })
})

describe('pluralize', () => {
  it('uses the singular only for exactly one', () => {
    expect(pluralize(0, 'jogo', 'jogos')).toBe('0 jogos')
    expect(pluralize(1, 'jogo', 'jogos')).toBe('1 jogo')
    expect(pluralize(12, 'membro', 'membros')).toBe('12 membros')
  })
})

describe('isExternalHref', () => {
  it('treats http, mailto and tel links as external', () => {
    expect(isExternalHref('https://doi.org/10.1')).toBe(true)
    expect(isExternalHref('mailto:forja@exemplo.com')).toBe(true)
    expect(isExternalHref('tel:+5581999999999')).toBe(true)
    expect(isExternalHref('/jogos')).toBe(false)
    expect(isExternalHref('/#como-funciona')).toBe(false)
  })
})
