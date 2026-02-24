import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ConvexClientProvider from '@/components/ConvexClientProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LO Commission Portal',
  description: 'Loan Officer Commission Tracking Portal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  )
}
