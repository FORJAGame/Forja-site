import { getYouTubeVideoId, isHttpUrl } from '@/utilities/url'

type FieldValue = string | null | undefined

export const validateRequiredHttpUrl = (value: FieldValue): true | string =>
  value && isHttpUrl(value) ? true : 'Informe um link completo, começando com https://'

export const validateOptionalHttpUrl = (value: FieldValue): true | string =>
  !value || isHttpUrl(value) ? true : 'Use um link completo, começando com https://'

export const validateOptionalYouTubeUrl = (value: FieldValue): true | string =>
  !value || getYouTubeVideoId(value) ? true : 'Use um link do YouTube (ex.: https://youtu.be/dQw4w9WgXcQ).'
