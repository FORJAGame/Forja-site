import { GeistMono } from 'geist/font/mono'
import { Inter, Saira_Condensed } from 'next/font/google'

const sairaCondensed = Saira_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-saira-condensed',
})

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const fontVariables = [sairaCondensed.variable, inter.variable, GeistMono.variable].join(' ')
