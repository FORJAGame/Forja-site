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

describe('SiteHeader and the fixed mobile menu', () => {
  // backdrop-filter, filter or transform on an ancestor becomes the containing block of `position: fixed`
  // children, which squeezed the full-screen menu into the 64px header (see the menu bug of 2026-09-27).
  it('keeps the header itself free of properties that trap the fixed menu', () => {
    const { container } = render(<SiteHeader />)
    const header = container.querySelector('header')

    expect(header?.className).not.toMatch(/(^|\s)(backdrop-|filter|blur-|transform|translate-|scale-|rotate-)/)
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

describe('MobileMenu focus handling', () => {
  const renderWithPage = () =>
    render(
      <>
        <header>
          <MobileMenu />
        </header>
        <main>
          <a href="/jogos">Conteúdo</a>
        </main>
        <footer>
          <a href="/artigos">Rodapé</a>
        </footer>
      </>,
    )

  it('returns focus to the menu button when closed with Escape from inside the menu', async () => {
    const user = userEvent.setup()
    renderWithPage()

    await user.click(screen.getByRole('button', { name: 'Abrir menu' }))
    screen.getByRole('link', { name: 'Jogos' }).focus()
    await user.keyboard('{Escape}')

    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveFocus()
  })

  it('keeps keyboard users inside the open menu by making the page behind it inert', async () => {
    const user = userEvent.setup()
    const { container } = renderWithPage()

    await user.click(screen.getByRole('button', { name: 'Abrir menu' }))
    expect(container.querySelector('main')).toHaveAttribute('inert')
    expect(container.querySelector('footer')).toHaveAttribute('inert')

    await user.keyboard('{Escape}')
    expect(container.querySelector('main')).not.toHaveAttribute('inert')
    expect(container.querySelector('footer')).not.toHaveAttribute('inert')
  })
})

describe('SiteFooter', () => {
  it('shows the contact e-mail as a mailto link', () => {
    render(<SiteFooter />)
    expect(screen.getByRole('link', { name: siteConfig.email })).toHaveAttribute('href', `mailto:${siteConfig.email}`)
  })
})
