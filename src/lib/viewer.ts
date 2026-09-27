import type { TypedUser } from 'payload'

export type Viewer = { draft: boolean; user: TypedUser | null }

export const PUBLIC_VIEWER: Viewer = { draft: false, user: null }

export const queryOptionsFor = ({ draft, user }: Viewer) => ({ draft, user, overrideAccess: false as const })
