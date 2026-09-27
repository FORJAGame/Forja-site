import Image from 'next/image'

import icon from '@/app/icon.png'
import { Logo } from '@/components/brand/Logo'

export function AdminLogo() {
  return <Logo priority className="forja-admin-logo" />
}

export function AdminIcon() {
  return <Image src={icon} alt="Forja" width={18} height={18} />
}
