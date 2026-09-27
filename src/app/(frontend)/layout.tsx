import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { MotionProvider } from '@/components/motion/MotionProvider'

import { cx } from '@/utilities/cx'

import { fontVariables } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Forja — Onde jogos são forjados', template: '%s · Forja' },
  description: 'Guildas de alunos do CESAR pesquisando, prototipando e lançando jogos.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The inline script removes `no-js` before first paint, so the attribute legitimately differs after hydration.
    <html lang="pt-BR" className={cx(fontVariables, 'no-js')} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.remove('no-js')" }} />
      </head>
      <body>
        <MotionProvider>
          <SiteHeader />
          <main id="conteudo">{children}</main>
          <SiteFooter />
        </MotionProvider>
      </body>
    </html>
  )
}
