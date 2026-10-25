import { notFound } from 'next/navigation'

// With two root layouts (site and admin) Next has no app-wide 404, so unmatched URLs would get its bare page.
export default function UnknownPage(): never {
  notFound()
}
