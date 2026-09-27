'use client'

import { motion } from 'motion/react'

import { DiagonalBands } from '@/components/brand/DiagonalBands'
import { SHARD_POLYGONS } from '@/components/brand/Shards'
import { Parallax } from '@/components/motion/Parallax'
import { DURATION } from '@/components/motion/tokens'

// DESIGN.md › Motion › Hero: sparks strike in diagonally, then the bands slide in.
const SHARD_STAGGER = 0.08
const BANDS_DELAY = 0.25

export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, x: -160 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: DURATION.hero, delay: BANDS_DELAY }}
      >
        <DiagonalBands />
      </motion.div>
      <Parallax className="absolute right-[-10%] top-[4%] w-[60%] max-w-[640px] md:right-[-2%] md:top-[12%] md:w-[44%]">
        <svg viewBox="0 0 272 283" fill="currentColor" focusable="false" className="w-full text-primary">
          {SHARD_POLYGONS.map((points, index) => (
            <motion.polygon
              key={points}
              points={points}
              initial={{ opacity: 0, x: -60, y: 60, scale: 1.08 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              transition={{ duration: DURATION.hero, delay: index * SHARD_STAGGER }}
            />
          ))}
        </svg>
      </Parallax>
    </div>
  )
}
