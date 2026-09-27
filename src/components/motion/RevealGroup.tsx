'use client'

import { motion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

import { REVEAL_VIEWPORT } from './Reveal'
import { DURATION, REVEAL_OFFSET, STAGGER } from './tokens'

const groupVariants: Variants = { hidden: {}, visible: { transition: { staggerChildren: STAGGER } } }

const itemVariants: Variants = {
  hidden: { opacity: 0, y: REVEAL_OFFSET },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.enter } },
}

const GROUP_TAGS = { div: motion.div, ul: motion.ul, ol: motion.ol }
const ITEM_TAGS = { div: motion.div, li: motion.li }

type RevealGroupProps = { as?: keyof typeof GROUP_TAGS; className?: string; label?: string; children: ReactNode }

export function RevealGroup({ as = 'div', className, label, children }: RevealGroupProps) {
  const Group = GROUP_TAGS[as] as typeof motion.div

  return (
    <Group
      aria-label={label}
      className={className}
      variants={groupVariants}
      initial="hidden"
      whileInView="visible"
      viewport={REVEAL_VIEWPORT}
    >
      {children}
    </Group>
  )
}

type RevealItemProps = { as?: keyof typeof ITEM_TAGS; className?: string; children: ReactNode }

export function RevealItem({ as = 'div', className, children }: RevealItemProps) {
  const Item = ITEM_TAGS[as] as typeof motion.div

  return (
    <Item data-reveal className={className} variants={itemVariants}>
      {children}
    </Item>
  )
}
