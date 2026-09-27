import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { fontVariables } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Forja — Onde jogos são forjados', template: '%s · Forja' },
  description: 'Guildas de alunos do CESAR pesquisando, prototipando e lançando jogos.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={fontVariables}>
      <body>{children}</body>
    </html>
  )
}
