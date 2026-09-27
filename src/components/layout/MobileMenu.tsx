'use client'

import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { ButtonLink } from '@/components/ui/ButtonLink'
import { siteConfig } from '@/config/site'
import { cx } from '@/utilities/cx'

const BAR = 'h-0.5 w-[22px] bg-on-surface transition-transform duration-200 ease-forge'

// The menu covers the page, so everything behind it must be unreachable by keyboard and scroll.
const PAGE_BEHIND_MENU = 'main, footer'

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const close = () => setIsOpen(false)

  useEffect(() => {
    if (!isOpen) return
    const pageBehind = document.querySelectorAll(PAGE_BEHIND_MENU)
    pageBehind.forEach((element) => element.setAttribute('inert', ''))
    document.body.style.overflow = 'hidden'

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      toggleRef.current?.focus()
    }
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      pageBehind.forEach((element) => element.removeAttribute('inert'))
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <div className="md:hidden">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls="menu-mobile"
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
        onClick={() => setIsOpen((open) => !open)}
        className="flex size-11 flex-col items-center justify-center gap-[5px]"
      >
        <span className={cx(BAR, isOpen && 'translate-y-[7px] rotate-45')} />
        <span className={cx(BAR, isOpen && 'opacity-0')} />
        <span className={cx(BAR, isOpen && '-translate-y-[7px] -rotate-45')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.nav
            id="menu-mobile"
            aria-label="Principal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col gap-2xl bg-neutral px-margin-mobile py-2xl"
          >
            <ul className="flex flex-col gap-lg">
              {siteConfig.nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={close} className="type-headline-md">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ButtonLink href={siteConfig.cta.href} onClick={close} className="w-full">
              {siteConfig.cta.label}
            </ButtonLink>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  )
}
