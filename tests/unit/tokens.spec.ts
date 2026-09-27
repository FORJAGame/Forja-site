import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { generateTokensCss } from '@/design-system/tokens'

const designMd = (typography: string) => `---
version: alpha
name: Test
colors:
  primary: "#D21312"
  outline: "#FFFFFF17"
typography:
${typography}
rounded:
  xs: 2px
spacing:
  lg: 24px
  2xl: 56px
---

# Body
`

const displayAndBody = `  display-xl:
    fontFamily: Saira Condensed
    fontSize: 148px
    fontWeight: 800
    lineHeight: 0.88
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55`

describe('generateTokensCss', () => {
  it('turns colors, radii and spacing into Tailwind theme variables, replacing the default palette', () => {
    const css = generateTokensCss(designMd(displayAndBody))

    expect(css).toContain('@theme static {')
    expect(css).toContain('  --color-*: initial;')
    expect(css).toContain('  --color-primary: #D21312;')
    expect(css).toContain('  --color-outline: #FFFFFF17;')
    expect(css).toContain('  --radius-xs: 2px;')
    expect(css).toContain('  --spacing-lg: 24px;')
    expect(css).toContain('  --spacing-2xl: 56px;')
  })

  it('creates one type-* utility per typography token, using the next/font variable', () => {
    const css = generateTokensCss(designMd(displayAndBody))

    expect(css).toContain(`@utility type-display-xl {
  font-family: var(--font-saira-condensed);
  font-size: 148px;
  font-weight: 800;
  line-height: 0.88;
  letter-spacing: -0.01em;
  text-transform: uppercase;
}`)
    expect(css).toContain(`@utility type-body-md {
  font-family: var(--font-inter);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.55;
}`)
  })

  it('refuses a font family that the layout does not load', () => {
    const unknownFont = `  body-md:
    fontFamily: Comic Sans
    fontSize: 16px`

    expect(() => generateTokensCss(designMd(unknownFont))).toThrow('No font variable for "Comic Sans"')
  })

  it('refuses a file without YAML front matter', () => {
    expect(() => generateTokensCss('# Only prose')).toThrow('DESIGN.md has no YAML front matter')
  })

  it('keeps src/styles/tokens.css in sync with DESIGN.md (run `pnpm tokens` after editing DESIGN.md)', () => {
    const expected = generateTokensCss(readFileSync('DESIGN.md', 'utf8'))
    expect(readFileSync('src/styles/tokens.css', 'utf8')).toBe(expected)
  })
})
