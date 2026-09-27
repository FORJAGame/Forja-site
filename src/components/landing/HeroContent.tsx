'use client'

import { motion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

import { DURATION } from '@/components/motion/tokens'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { landingCopy } from '@/content/landing'

// DESIGN.md › Motion › Hero: lines rise through a mask, the accent lights up last, then the rest fades in.
const TITLE_DELAY = 0.35
const LINE_STAGGER = 0.12
const ACCENT_DELAY = 0.55
const DETAILS_DELAY = 0.9

const lineVariants: Variants = {
  hidden: { y: '105%' },
  visible: { y: '0%', transition: { duration: DURATION.hero } },
}

const accentVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { delay: ACCENT_DELAY, duration: DURATION.micro * 2 } },
}

function MaskedLine({ children }: { children: ReactNode }) {
  return (
    <span className="block overflow-hidden pb-[0.04em]">
      <motion.span className="block" variants={lineVariants}>
        {children}
      </motion.span>
    </span>
  )
}

function Accent({ children }: { children: string }) {
  return (
    <span className="relative inline-block">
      {children}
      <motion.span aria-hidden="true" className="absolute inset-0 text-primary" variants={accentVariants}>
        {children}
      </motion.span>
    </span>
  )
}

export function HeroContent({ guildCount }: { guildCount: number }) {
  const { hero } = landingCopy
  const pillars = [`${guildCount} guildas`, ...hero.pillars].join('  |  ')

  return (
    <div className="flex flex-col gap-lg">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Eyebrow>{hero.eyebrow}</Eyebrow>
      </motion.div>
      <motion.h1
        id="hero-title"
        className="type-display-mobile lg:type-display-xl"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: LINE_STAGGER, delayChildren: TITLE_DELAY }}
      >
        <MaskedLine>{hero.firstLine}</MaskedLine>{' '}
        <MaskedLine>
          {hero.secondLine} <Accent>{hero.accent}</Accent>
        </MaskedLine>
      </motion.h1>
      <motion.div
        className="flex flex-col gap-lg"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: DETAILS_DELAY }}
      >
        <p className="type-body-lg max-w-[540px] text-on-surface-variant">{hero.subtitle}</p>
        <div className="flex flex-col gap-md md:flex-row">
          <ButtonLink href={hero.primaryAction.href}>{hero.primaryAction.label}</ButtonLink>
          <ButtonLink href={hero.secondaryAction.href} variant="secondary" arrow>
            {hero.secondaryAction.label}
          </ButtonLink>
        </div>
        <p className="type-label-mono text-on-surface-muted">{pillars}</p>
      </motion.div>
    </div>
  )
}
