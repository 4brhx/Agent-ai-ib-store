'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot, Cpu, MessageSquare, Plus, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Home', icon: Sparkles },
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/models', label: 'Models', icon: Cpu },
  { href: '/agents/create', label: 'Create', icon: Plus },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 font-bold text-white shadow-lg shadow-brand-500/25">
            IB
          </div>
          <span className="text-lg font-bold text-white">Agent Store</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                pathname === href
                  ? 'bg-brand-500/10 text-brand-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
