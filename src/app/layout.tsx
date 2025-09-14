import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'craft.ai - Handwerker Assistent',
  description: 'AI-powered back office assistant for German craftsmen',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  )
}