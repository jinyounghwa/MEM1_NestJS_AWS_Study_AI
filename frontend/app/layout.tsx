import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '☁️ NestJS + AWS Learning Tutor',
  description: 'MEM1 기반 AI 튜터 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
