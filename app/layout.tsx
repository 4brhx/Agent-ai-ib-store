import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Navbar } from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IB Agent Store - Build & Deploy AI Agents',
  description: 'Create, customize, and deploy AI agents powered by multiple LLM providers. Built by IB.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="ltr" className="dark">
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#1f2937', color: '#fff', border: '1px solid #374151' } }} />
      </body>
    </html>
  )
}
