const YOUTUBE_VIDEO_ID = /^[\w-]{11}$/
const YOUTUBE_PATH_ID = /^\/(?:embed|shorts|live)\/([^/?]+)/

const parseUrl = (value: string): URL | null => {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

export const isHttpUrl = (value: string): boolean => {
  const url = parseUrl(value)
  return url?.protocol === 'http:' || url?.protocol === 'https:'
}

export const getYouTubeVideoId = (value: string): string | null => {
  const url = parseUrl(value)
  if (!url) return null

  const host = url.hostname.replace(/^(www|m)\./, '')
  let id: string | null = null

  if (host === 'youtu.be') {
    id = url.pathname.slice(1)
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = url.pathname === '/watch' ? url.searchParams.get('v') : (url.pathname.match(YOUTUBE_PATH_ID)?.[1] ?? null)
  }

  return id && YOUTUBE_VIDEO_ID.test(id) ? id : null
}
