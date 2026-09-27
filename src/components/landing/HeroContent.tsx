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
  hidden: { y: '140%' },
  visible: { y: '0%', transition: { duration: DURATION.hero } },
}

const introLayerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 0, transition: { delay: ACCENT_DELAY, duration: DURATION.micro * 2 } },
}

// The negative margin gives diacritics (the tilde in "SÃO") room inside the mask without changing the layout.
function MaskedLine({ children }: { children: ReactNode }) {
  return (
    <span className="-my-[0.14em] block overflow-hidden py-[0.14em]">
      <motion.span data-reveal className="block" variants={lineVariants}>
        {children}
      </motion.span>
    </span>
  )
}

// The word is red from the start; a white copy on top fades out to "light it up". A white copy underneath
// the red one would leak through the anti-aliased edges as a light halo.
function Accent({ children }: { children: string }) {
  return (
    <span className="relative inline-block text-primary">
      {children}
      <motion.span
        data-reveal-exit
        aria-hidden="true"
        className="absolute inset-0 text-on-surface"
        variants={introLayerVariants}
      >
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
      <motion.div data-reveal initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
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
        data-reveal
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
