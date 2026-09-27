import { parse } from 'yaml'

type TypographyToken = {
  fontFamily: string
  fontSize: string
  fontWeight?: number
  lineHeight?: number | string
  letterSpacing?: string
}

export type DesignTokens = {
  colors: Record<string, string>
  typography: Record<string, TypographyToken>
  rounded: Record<string, string>
  spacing: Record<string, string | number>
}

// Each family must be loaded with next/font in src/app/(frontend)/fonts.ts under this CSS variable.
const FONT_VARIABLES: Record<string, string> = {
  'Saira Condensed': '--font-saira-condensed',
  Inter: '--font-inter',
  'Geist Mono': '--font-geist-mono',
}

// DESIGN.md: Saira Condensed and Geist Mono are always uppercase.
const UPPERCASE_FAMILIES = new Set(['Saira Condensed', 'Geist Mono'])

const HEADER = '/* Generated from DESIGN.md by `pnpm tokens`. Do not edit by hand. */'

export const readDesignTokens = (designMd: string): DesignTokens => {
  const frontMatter = designMd.match(/^---\n([\s\S]*?)\n---/)
  if (!frontMatter) throw new Error('DESIGN.md has no YAML front matter')
  return parse(frontMatter[1]) as DesignTokens
}

const fontVariable = (family: string): string => {
  const variable = FONT_VARIABLES[family]
  if (!variable) throw new Error(`No font variable for "${family}". Load it with next/font and map it in FONT_VARIABLES.`)
  return variable
}

const themeLines = ({ colors, rounded, spacing }: DesignTokens): string[] => [
  '  --color-*: initial;',
  ...Object.entries(colors).map(([name, value]) => `  --color-${name}: ${value};`),
  ...Object.entries(rounded).map(([name, value]) => `  --radius-${name}: ${value};`),
  ...Object.entries(spacing).map(([name, value]) => `  --spacing-${name}: ${value};`),
]

const typographyUtility = (name: string, token: TypographyToken): string =>
  [
    `@utility type-${name} {`,
    `  font-family: var(${fontVariable(token.fontFamily)});`,
    `  font-size: ${token.fontSize};`,
    token.fontWeight !== undefined && `  font-weight: ${token.fontWeight};`,
    token.lineHeight !== undefined && `  line-height: ${token.lineHeight};`,
    token.letterSpacing !== undefined && `  letter-spacing: ${token.letterSpacing};`,
    UPPERCASE_FAMILIES.has(token.fontFamily) && '  text-transform: uppercase;',
    '}',
  ]
    .filter(Boolean)
    .join('\n')

export const generateTokensCss = (designMd: string): string => {
  const tokens = readDesignTokens(designMd)
  const utilities = Object.entries(tokens.typography).map(([name, token]) => typographyUtility(name, token))

  return [HEADER, '', '@theme static {', ...themeLines(tokens), '}', '', utilities.join('\n\n'), ''].join('\n')
}
