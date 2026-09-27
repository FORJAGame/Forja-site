import type { ReactNode } from 'react'

export const metadata = {
  title: 'Forja',
  description: 'Iniciativa de desenvolvimento de jogos do CESAR.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
