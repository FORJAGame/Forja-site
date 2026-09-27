import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'

import { readServerEnv } from '@/config/env'

const { storage } = readServerEnv()

const s3 = new S3Client({
  endpoint: storage.endpoint,
  region: storage.region,
  forcePathStyle: true,
  credentials: { accessKeyId: storage.accessKeyId, secretAccessKey: storage.secretAccessKey },
})

export const objectExists = async (key: string): Promise<boolean> => {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: storage.bucket, Key: key }))
    return true
  } catch (error) {
    if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) return false
    throw error
  }
}
