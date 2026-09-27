export type NavItem = { label: string; href: string }

// Contact and social links are placeholders until the Forja confirms the official ones.
export const siteConfig = {
  name: 'Forja',
  tagline: 'Iniciativa de desenvolvimento de jogos do CESAR.',
  description: 'Guildas de alunos do CESAR pesquisando, prototipando e lançando jogos.',
  email: 'forja@exemplo.com',
  nav: [
    { label: 'Guildas', href: '/guildas' },
    { label: 'Jogos', href: '/jogos' },
    { label: 'Artigos', href: '/artigos' },
    { label: 'Sobre', href: '/#sobre' },
  ] satisfies NavItem[],
  cta: { label: 'Participe', href: '/#como-funciona' } satisfies NavItem,
  social: [
    { label: 'Instagram', href: 'https://www.instagram.com/' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
  ] satisfies NavItem[],
}
