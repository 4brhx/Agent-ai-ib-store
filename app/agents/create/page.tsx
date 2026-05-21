'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAgentStore } from '@/lib/store'
import { AVAILABLE_MODELS } from '@/lib/models'
import { Bot, Wand2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const AVATARS = ['🤖', '🧠', '💡', '🎯', '🚀', '⚡', '🔮', '🌟', '👨‍💻', '📊', '✍️', '🎨', '🔬', '🛠️', '💬', '🦾']

export default function CreateAgentPage() {
  const router = useRouter()
  const { addAgent } = useAgentStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [modelId, setModelId] = useState('openai/gpt-4o-mini')
  const [avatar, setAvatar] = useState('🤖')
  const [capabilities, setCapabilities] = useState<string[]>(['chat'])

  const allCapabilities = ['chat', 'coding', 'analysis', 'writing', 'creative', 'research', 'math', 'translation']

  const toggleCapability = (cap: string) => {
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !instructions.trim()) {
      toast.error('Please fill in name and instructions')
      return
    }

    const newAgent = {
      id: `agent-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      modelId,
      avatar,
      capabilities,
      createdAt: new Date().toISOString(),
      isPublic: true,
    }

    addAgent(newAgent)
    toast.success(`${name} created successfully!`)
    router.push('/agents')
  }

  return (
    <div className="px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/agents"
            className="flex items-center justify-center rounded-lg bg-white/5 p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              <Wand2 className="mr-2 inline-block h-7 w-7 text-brand-400" />
              Create New Agent
            </h1>
            <p className="mt-1 text-gray-400">Design your custom AI assistant</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar */}
          <div className="rounded-2xl border border-white/5 bg-gray-900/50 p-6">
            <label className="mb-3 block text-sm font-medium text-gray-300">Avatar</label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-all ${
                    avatar === a
                      ? 'bg-brand-500/20 ring-2 ring-brand-500'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Name & Description */}
          <div className="rounded-2xl border border-white/5 bg-gray-900/50 p-6">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Agent Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Code Expert"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what this agent does"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div className="rounded-2xl border border-white/5 bg-gray-900/50 p-6">
            <label className="mb-3 block text-sm font-medium text-gray-300">
              AI Model
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => setModelId(model.id)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                    modelId === model.id
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-white/5 bg-white/5 hover:border-white/10'
                  }`}
                >
                  <span className="text-lg">{model.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{model.name}</div>
                    <div className="text-xs text-gray-500">{model.provider}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-2xl border border-white/5 bg-gray-900/50 p-6">
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Instructions * <span className="text-gray-500">(System Prompt)</span>
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="You are a helpful assistant that specializes in..."
              rows={6}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Capabilities */}
          <div className="rounded-2xl border border-white/5 bg-gray-900/50 p-6">
            <label className="mb-3 block text-sm font-medium text-gray-300">
              Capabilities
            </label>
            <div className="flex flex-wrap gap-2">
              {allCapabilities.map((cap) => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => toggleCapability(cap)}
                  className={`rounded-full px-4 py-1.5 text-sm transition-all ${
                    capabilities.includes(cap)
                      ? 'bg-brand-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {cap}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 py-4 font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl"
          >
            <Bot className="h-5 w-5" />
            Create Agent
          </button>
        </form>
      </div>
    </div>
  )
}
