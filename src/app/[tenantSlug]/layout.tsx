import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LO Commission Portal',
}

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
