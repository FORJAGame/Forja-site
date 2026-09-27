import type { Payload } from 'payload'
import sharp from 'sharp'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { getTestPayload, resetDatabase } from '../helpers/fixtures'
import { objectExists } from '../helpers/storage'

let payload: Payload

const uploadTestImage = async () => {
  const png = await sharp({ create: { width: 32, height: 18, channels: 3, background: '#D21312' } }).png().toBuffer()
  return payload.create({
    collection: 'media',
    data: { alt: 'Capa de teste' },
    file: { data: png, mimetype: 'image/png', name: 'capa-teste.png', size: png.length },
    overrideAccess: true,
  })
}

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  await resetDatabase(payload)
})

describe('media storage', () => {
  it('stores uploads in the S3 bucket and serves them through Payload', async () => {
    const media = await uploadTestImage()

    expect(media.url).toBe(`/api/media/file/${media.filename}`)
    expect(media.width).toBe(32)
    expect(await objectExists(media.filename!)).toBe(true)
  })

  it('removes the file from the bucket when the image is deleted', async () => {
    const media = await uploadTestImage()

    await payload.delete({ collection: 'media', id: media.id, overrideAccess: true })

    expect(await objectExists(media.filename!)).toBe(false)
  })
})
