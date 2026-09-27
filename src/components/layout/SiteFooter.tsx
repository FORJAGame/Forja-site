import Link from 'next/link'

import { Logo } from '@/components/brand/Logo'
import { Container } from '@/components/ui/Container'
import { type NavItem, siteConfig } from '@/config/site'
import { isExternalHref } from '@/utilities/url'

function FooterColumn({ title, links }: { title: string; links: NavItem[] }) {
  return (
    <div className="flex flex-col gap-md">
      <p className="type-label-mono-sm text-on-surface-muted">{title}</p>
      <ul className="flex flex-col gap-sm">
        {links.map((link) => (
          <li key={link.href}>
            {isExternalHref(link.href) ? (
              <a href={link.href} className="type-body-sm text-on-surface-variant hover:text-on-surface">
                {link.label}
              </a>
            ) : (
              <Link href={link.href} className="type-body-sm text-on-surface-variant hover:text-on-surface">
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-outline">
      <Container className="flex flex-col gap-2xl py-3xl">
        <div className="flex flex-col gap-2xl md:flex-row md:justify-between">
          <div className="flex flex-col gap-md">
            <Logo className="w-40" />
            <p className="type-body-sm text-on-surface-variant">{siteConfig.tagline}</p>
          </div>
          <div className="grid grid-cols-2 gap-xl sm:grid-cols-3 md:gap-2xl">
            <FooterColumn title="Navegação" links={siteConfig.nav} />
            <FooterColumn title="Redes" links={siteConfig.social} />
            <FooterColumn title="Contato" links={[{ label: siteConfig.email, href: `mailto:${siteConfig.email}` }]} />
          </div>
        </div>
        <div className="flex flex-col gap-sm md:flex-row md:justify-between">
          <p className="type-label-mono-sm text-on-surface-muted">© {year} Forja | CESAR</p>
          <p className="type-label-mono-sm text-on-surface-muted">Feito pelos alunos, mantido pela comunidade</p>
        </div>
      </Container>
    </footer>
  )
}
