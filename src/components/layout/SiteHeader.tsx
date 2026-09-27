import Link from 'next/link'

import { Logo } from '@/components/brand/Logo'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Container } from '@/components/ui/Container'
import { siteConfig } from '@/config/site'

import { MobileMenu } from './MobileMenu'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-outline bg-neutral/85 backdrop-blur-md">
      <a
        href="#conteudo"
        className="type-button sr-only focus:not-sr-only focus:absolute focus:left-md focus:top-md focus:z-50 focus:bg-primary focus:px-md focus:py-sm"
      >
        Pular para o conteúdo
      </a>
      <Container className="flex h-16 items-center justify-between md:h-[76px]">
        <Link href="/" aria-label="Forja — página inicial">
          <Logo priority className="w-[92px] md:w-[120px]" />
        </Link>
        <nav aria-label="Principal" className="max-md:hidden">
          <ul className="flex gap-xl">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="type-nav-link text-on-surface-variant transition-colors duration-200 hover:text-on-surface"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <ButtonLink href={siteConfig.cta.href} size="sm" className="max-md:hidden">
          {siteConfig.cta.label}
        </ButtonLink>
        <MobileMenu />
      </Container>
    </header>
  )
}
