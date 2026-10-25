import { Fragment } from 'react'

export function LineBreaks({ text }: { text: string }) {
  return text.split('\n').map((line, index) => (
    <Fragment key={index}>
      {index > 0 && ' '}
      <span className="block">{line}</span>
    </Fragment>
  ))
}
