import Link from 'next/link'
import type { ReactNode } from 'react'

import { cx } from '@/utilities/cx'
import { isExternalHref } from '@/utilities/url'

import { Arrow } from './Arrow'

export type ButtonVariant = 'primary' | 'secondary' | 'onPrimary'
export type ButtonSize = 'md' | 'sm'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'border border-outline-strong text-on-surface hover:border-on-surface',
  onPrimary: 'bg-neutral text-on-surface hover:bg-surface-raised',
}

// DESIGN.md › button-primary padding is 12px 26px.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: 'px-[26px] py-3',
  sm: 'px-md py-sm',
}

type ButtonLinkProps = {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
  arrow?: boolean
  className?: string
  onClick?: () => void
  children: ReactNode
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  arrow = false,
  className,
  onClick,
  children,
}: ButtonLinkProps) {
  const classes = cx(
    'group type-button inline-flex items-center justify-center gap-sm rounded-xs transition-colors duration-200 ease-forge',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  )
  const content = (
    <>
      {children}
      {arrow && <Arrow />}
    </>
  )

  return isExternalHref(href) ? (
    <a href={href} className={classes} onClick={onClick}>
      {content}
    </a>
  ) : (
    <Link href={href} className={classes} onClick={onClick}>
      {content}
    </Link>
  )
}
