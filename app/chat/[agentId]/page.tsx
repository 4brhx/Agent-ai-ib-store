'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAgentStore } from '@/lib/store'
import { AVAILABLE_MODELS } from '@/lib/models'
import { Send, Loader2, ArrowLeft, Bot, User, RotateCcw, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { getAgent } = useAgentStore()
  const agent = getAgent(params.agentId as string)
  const model = agent ? AVAILABLE_MODELS.find((m) => m.id === agent.modelId) : null

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!agent) router.push('/agents')
  }, [agent, router])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isLoading || !agent) return

    setInput('')
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          agentId: agent.id,
          modelId: agent.modelId,
          instructions: agent.instructions,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      // Stream response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          assistantContent += chunk
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: assistantContent } : m))
          )
        }
      }
    } catch (error) {
      const errMsg: ChatMessage = {
        id: `msg-${Date.now() + 2}`,
        role: 'assistant',
        content: '⚠️ Sorry, something went wrong. Please check your API key and try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }

  if (!agent) return null

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-gray-900/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/agents"
            className="flex items-center justify-center rounded-lg bg-white/5 p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-xl">
            {agent.avatar}
          </div>
          <div>
            <h2 className="font-semibold text-white">{agent.name}</h2>
            <p className="text-xs text-gray-500">
              {model?.name} • {model?.provider}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-400 transition-all hover:bg-white/10 hover:text-white"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-500/10 text-4xl">
              {agent.avatar}
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">{agent.name}</h3>
            <p className="mb-6 max-w-md text-sm text-gray-400">{agent.description}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Hello!', 'What can you do?', 'Help me with...'].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q)
                    setTimeout(() => sendMessage(), 0)
                  }}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-400 transition-all hover:bg-white/5 hover:text-white"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm',
                    msg.role === 'user'
                      ? 'bg-brand-500/20 text-brand-400'
                      : 'bg-white/10 text-gray-300'
                  )}
                >
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : agent.avatar}
                </div>
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3',
                    msg.role === 'user'
                      ? 'bg-brand-500 text-white'
                      : 'border border-white/5 bg-gray-900 text-gray-200'
                  )}
                >
                  <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm">
                  {agent.avatar}
                </div>
                <div className="rounded-2xl border border-white/5 bg-gray-900 px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/10 bg-gray-900/50 p-4">
        <div className="mx-auto flex max-w-3xl items-end gap-3">
          <div className="flex-1 rounded-xl border border-white/10 bg-white/5 transition-all focus-within:border-brand-500">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${agent.name}...`}
              rows={1}
              className="w-full resize-none bg-transparent px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all',
              input.trim() && !isLoading
                ? 'bg-brand-500 text-white hover:bg-brand-600'
                : 'bg-white/5 text-gray-600'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-gray-600">
          Built by IB • Powered by {model?.provider ?? 'AI'}
        </p>
      </div>
    </div>
  )
}
