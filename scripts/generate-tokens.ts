import { readFileSync, writeFileSync } from 'node:fs'

import { generateTokensCss } from '../src/design-system/tokens'

writeFileSync('src/styles/tokens.css', generateTokensCss(readFileSync('DESIGN.md', 'utf8')))
console.log('src/styles/tokens.css updated from DESIGN.md')
