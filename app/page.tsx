'use client'

import Link from 'next/link'
import { Bot, Cpu, MessageSquare, Zap, Shield, Globe, ArrowRight, Sparkles } from 'lucide-react'
import { useAgentStore } from '@/lib/store'
import { AVAILABLE_MODELS } from '@/lib/models'

export default function HomePage() {
  const { agents } = useAgentStore()

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:px-6">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-brand-500/10 blur-[120px]" />
          <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm text-brand-300">
            <Sparkles className="h-4 w-4" />
            Powered by IB
          </div>
          
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            <span className="gradient-text">AI Agents</span>
            <br />
            <span className="text-white">Your Way</span>
          </h1>
          
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 sm:text-xl">
            Build, customize, and deploy AI agents powered by the world&apos;s best models.
            Connect to GPT-4o, Claude, Gemini, and more — all in one place.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/agents/create"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl hover:shadow-brand-500/30"
            >
              Create Agent
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/agents"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 font-semibold text-white transition-all hover:bg-white/10"
            >
              Browse Store
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/5 bg-gray-900/50 px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{agents.length}</div>
            <div className="mt-1 text-sm text-gray-400">Active Agents</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{AVAILABLE_MODELS.length}</div>
            <div className="mt-1 text-sm text-gray-400">AI Models</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">5+</div>
            <div className="mt-1 text-sm text-gray-400">Providers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">&infin;</div>
            <div className="mt-1 text-sm text-gray-400">Possibilities</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-400">
              Build powerful AI agents without writing a single line of code
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Bot, title: 'Custom Agents', desc: 'Create specialized AI assistants with custom instructions and personalities' },
              { icon: Cpu, title: 'Multiple Models', desc: 'Choose from GPT-4o, Claude, Gemini, DeepSeek, Llama, and more' },
              { icon: MessageSquare, title: 'Real-time Chat', desc: 'Stream responses in real-time with a beautiful chat interface' },
              { icon: Zap, title: 'Instant Deploy', desc: 'Create and use agents instantly — no configuration needed' },
              { icon: Shield, title: 'Private & Secure', desc: 'Your conversations stay private. Data stored locally.' },
              { icon: Globe, title: 'Multi-Provider', desc: 'Access OpenAI, Anthropic, Google, Meta, and Mistral through one API' },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-white/5 bg-gray-900/50 p-6 transition-all hover:border-brand-500/30 hover:bg-gray-900"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 transition-colors group-hover:bg-brand-500/20">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-gradient-to-br from-brand-500/10 via-gray-900 to-purple-500/10 p-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Ready to Build?</h2>
          <p className="mb-8 text-gray-400">
            Start creating your first AI agent in seconds
          </p>
          <Link
            href="/agents/create"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-semibold text-gray-900 transition-all hover:bg-gray-100"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500/20 text-xs font-bold text-brand-400">
              IB
            </div>
            Built by IB &middot; Agent Store v1.0
          </div>
          <div className="text-sm text-gray-500">
            Powered by OpenRouter
          </div>
        </div>
      </footer>
    </div>
  )
}
