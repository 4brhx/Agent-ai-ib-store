'use client'

import Link from 'next/link'
import { useAgentStore } from '@/lib/store'
import { AVAILABLE_MODELS } from '@/lib/models'
import { Bot, Plus, MessageSquare, Settings, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AgentsPage() {
  const { agents, deleteAgent } = useAgentStore()

  const handleDelete = (id: string, name: string) => {
    if (confirm(`هل تريد حذف "${name}"؟`)) {
      deleteAgent(id)
      toast.success(`تم حذف ${name}`)
    }
  }

  return (
    <div className="px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
              <Bot className="mr-3 inline-block h-8 w-8 text-brand-400" />
              Agent Store
            </h1>
            <p className="text-lg text-gray-400">
              Browse and chat with AI agents — or create your own
            </p>
          </div>
          <Link
            href="/agents/create"
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 font-medium text-white transition-all hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            New Agent
          </Link>
        </div>

        {/* Agents Grid */}
        {agents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-16 text-center">
            <Bot className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <h3 className="mb-2 text-xl font-semibold text-white">No agents yet</h3>
            <p className="mb-6 text-gray-400">Create your first AI agent to get started</p>
            <Link
              href="/agents/create"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              Create Agent
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => {
              const model = AVAILABLE_MODELS.find((m) => m.id === agent.modelId)
              return (
                <div
                  key={agent.id}
                  className="group flex flex-col rounded-2xl border border-white/5 bg-gray-900/50 p-6 transition-all hover:border-brand-500/30 hover:bg-gray-900"
                >
                  {/* Avatar & Name */}
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-2xl">
                      {agent.avatar}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{agent.name}</h3>
                      <p className="text-xs text-gray-500">
                        {model?.name ?? 'Unknown Model'} • {model?.provider}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mb-4 flex-1 text-sm text-gray-400 line-clamp-2">
                    {agent.description}
                  </p>

                  {/* Capabilities */}
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {agent.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-gray-400"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 border-t border-white/5 pt-4">
                    <Link
                      href={`/chat/${agent.id}`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500/10 py-2 text-sm font-medium text-brand-400 transition-all hover:bg-brand-500/20"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Chat
                    </Link>
                    <Link
                      href={`/agents/edit/${agent.id}`}
                      className="flex items-center justify-center rounded-lg bg-white/5 p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
                    >
                      <Settings className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(agent.id, agent.name)}
                      className="flex items-center justify-center rounded-lg bg-white/5 p-2 text-gray-400 transition-all hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
