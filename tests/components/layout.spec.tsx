// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { MobileMenu } from '@/components/layout/MobileMenu'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { siteConfig } from '@/config/site'

describe('SiteHeader', () => {
  it('offers a skip link to the main content', () => {
    render(<SiteHeader />)
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute('href', '#conteudo')
  })

  it('links every section of the main navigation and the call to action', () => {
    render(<SiteHeader />)

    const nav = screen.getByRole('navigation', { name: 'Principal' })
    for (const item of siteConfig.nav) {
      expect(nav.querySelector(`a[href="${item.href}"]`)).toHaveTextContent(item.label)
    }
    expect(screen.getAllByRole('link', { name: siteConfig.cta.label })[0]).toHaveAttribute('href', siteConfig.cta.href)
  })
})

describe('MobileMenu', () => {
  it('opens and closes with the button, announcing its state', async () => {
    const user = userEvent.setup()
    render(<MobileMenu />)
    const toggle = screen.getByRole('button', { name: 'Abrir menu' })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)

    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'Jogos' })).toBeInTheDocument()
  })

  it('closes with Escape', async () => {
    const user = userEvent.setup()
    render(<MobileMenu />)

    await user.click(screen.getByRole('button', { name: 'Abrir menu' }))
    await user.keyboard('{Escape}')

    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('SiteFooter', () => {
  it('shows the contact e-mail as a mailto link', () => {
    render(<SiteFooter />)
    expect(screen.getByRole('link', { name: siteConfig.email })).toHaveAttribute('href', `mailto:${siteConfig.email}`)
  })
})
