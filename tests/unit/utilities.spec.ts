import { describe, expect, it } from 'vitest'

import {
  validateOptionalHttpUrl,
  validateOptionalYouTubeUrl,
  validateRequiredHttpUrl,
} from '@/fields/validators'
import { slugify } from '@/utilities/slugify'
import { getYouTubeVideoId, isHttpUrl } from '@/utilities/url'

describe('slugify', () => {
  it.each([
    ['Ecos de Ferro', 'ecos-de-ferro'],
    ['Têmpera!', 'tempera'],
    ['Circuito 404', 'circuito-404'],
    ['  Maré   Baixa  ', 'mare-baixa'],
    ['Áudio & Trilha', 'audio-trilha'],
    ['   ', ''],
  ])('%s → %s', (input, expected) => {
    expect(slugify(input)).toBe(expected)
  })
})

describe('isHttpUrl', () => {
  it('accepts only http and https URLs', () => {
    expect(isHttpUrl('https://doi.org/10.1000/xyz')).toBe(true)
    expect(isHttpUrl('http://example.com')).toBe(true)
    expect(isHttpUrl('ftp://example.com')).toBe(false)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('example.com')).toBe(false)
  })
})

describe('getYouTubeVideoId', () => {
  const id = 'dQw4w9WgXcQ'

  it.each([
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=42`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://youtube.com/shorts/${id}`,
  ])('extracts the id from %s', (url) => {
    expect(getYouTubeVideoId(url)).toBe(id)
  })

  it.each([
    'https://vimeo.com/123456',
    'https://www.youtube.com/watch?v=short',
    'https://youtu.be/',
    'not a url',
  ])('rejects %s', (url) => {
    expect(getYouTubeVideoId(url)).toBeNull()
  })
})

describe('field validators', () => {
  it('requires a full URL when the field is mandatory', () => {
    expect(validateRequiredHttpUrl('https://example.com')).toBe(true)
    expect(validateRequiredHttpUrl('')).toEqual(expect.any(String))
    expect(validateRequiredHttpUrl(undefined)).toEqual(expect.any(String))
    expect(validateRequiredHttpUrl('example.com')).toEqual(expect.any(String))
  })

  it('allows empty optional URLs but rejects malformed ones', () => {
    expect(validateOptionalHttpUrl(null)).toBe(true)
    expect(validateOptionalHttpUrl('https://itch.io/game')).toBe(true)
    expect(validateOptionalHttpUrl('itch.io/game')).toEqual(expect.any(String))
  })

  it('accepts only YouTube links for trailers', () => {
    expect(validateOptionalYouTubeUrl(undefined)).toBe(true)
    expect(validateOptionalYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
    expect(validateOptionalYouTubeUrl('https://vimeo.com/1')).toEqual(expect.any(String))
  })
})
