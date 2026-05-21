'use client'

import { AVAILABLE_MODELS } from '@/lib/models'
import { Cpu, Zap, DollarSign, MessageSquare } from 'lucide-react'

export default function ModelsPage() {
  return (
    <div className="px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
            <Cpu className="mr-3 inline-block h-8 w-8 text-brand-400" />
            Available Models
          </h1>
          <p className="text-lg text-gray-400">
            {AVAILABLE_MODELS.length} AI models from leading providers — choose the best fit for your agent
          </p>
        </div>

        {/* Models Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {AVAILABLE_MODELS.map((model) => (
            <div
              key={model.id}
              className="group rounded-2xl border border-white/5 bg-gray-900/50 p-6 transition-all hover:border-brand-500/30 hover:bg-gray-900"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{model.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white">{model.name}</h3>
                    <p className="text-sm text-gray-500">{model.provider}</p>
                  </div>
                </div>
              </div>

              <p className="mb-4 text-sm text-gray-400">{model.description}</p>

              {/* Stats */}
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                    <MessageSquare className="h-3 w-3" />
                    Context
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-white">
                    {model.contextWindow >= 1000000
                      ? `${model.contextWindow / 1000000}M`
                      : `${model.contextWindow / 1000}K`}
                  </div>
                </div>
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                    <Zap className="h-3 w-3" />
                    Output
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-white">
                    {model.maxOutput / 1000}K
                  </div>
                </div>
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                    <DollarSign className="h-3 w-3" />
                    Input
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-white">
                    ${model.pricing.input}/M
                  </div>
                </div>
              </div>

              {/* Capabilities */}
              <div className="flex flex-wrap gap-1.5">
                {model.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs text-brand-300"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
