import { create } from 'zustand'

export interface Agent {
  id: string
  name: string
  description: string
  instructions: string
  modelId: string
  avatar: string
  capabilities: string[]
  createdAt: string
  isPublic: boolean
}

interface AgentStore {
  agents: Agent[]
  addAgent: (agent: Agent) => void
  updateAgent: (id: string, updates: Partial<Agent>) => void
  deleteAgent: (id: string) => void
  getAgent: (id: string) => Agent | undefined
}

// Load from localStorage
function loadAgents(): Agent[] {
  if (typeof window === 'undefined') return getDefaultAgents()
  const stored = localStorage.getItem('ib-agents')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return getDefaultAgents()
    }
  }
  return getDefaultAgents()
}

function getDefaultAgents(): Agent[] {
  return [
    {
      id: 'agent-1',
      name: 'IB Assistant',
      description: 'مساعد ذكي متعدد الأغراض يساعدك في أي مهمة',
      instructions: 'أنت مساعد ذكي اسمك IB Assistant. ساعد المستخدم بأفضل طريقة ممكنة. كن ودوداً ومحترفاً.',
      modelId: 'openai/gpt-4o-mini',
      avatar: '🤖',
      capabilities: ['chat', 'coding', 'analysis'],
      createdAt: new Date().toISOString(),
      isPublic: true,
    },
    {
      id: 'agent-2',
      name: 'Code Master',
      description: 'خبير برمجة يكتب ويراجع الأكواد بكل اللغات',
      instructions: 'أنت خبير برمجة محترف. ساعد في كتابة أكواد نظيفة وفعّالة. اشرح الحلول بوضوح.',
      modelId: 'anthropic/claude-sonnet-4-20250514',
      avatar: '👨‍💻',
      capabilities: ['coding', 'debugging', 'review'],
      createdAt: new Date().toISOString(),
      isPublic: true,
    },
    {
      id: 'agent-3',
      name: 'Content Writer',
      description: 'كاتب محتوى إبداعي للمقالات والتسويق',
      instructions: 'أنت كاتب محتوى محترف. اكتب محتوى جذاب ومؤثر. استخدم لغة واضحة ومقنعة.',
      modelId: 'openai/gpt-4o',
      avatar: '✍️',
      capabilities: ['writing', 'marketing', 'creative'],
      createdAt: new Date().toISOString(),
      isPublic: true,
    },
    {
      id: 'agent-4',
      name: 'Data Analyst',
      description: 'محلل بيانات يستخرج الرؤى والأنماط',
      instructions: 'أنت محلل بيانات خبير. حلل البيانات واستخرج الرؤى المهمة. قدم التحليلات بطريقة مفهومة.',
      modelId: 'google/gemini-2.0-flash-001',
      avatar: '📊',
      capabilities: ['analysis', 'visualization', 'statistics'],
      createdAt: new Date().toISOString(),
      isPublic: true,
    },
  ]
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: loadAgents(),
  addAgent: (agent) => {
    set((state) => {
      const newAgents = [...state.agents, agent]
      if (typeof window !== 'undefined') localStorage.setItem('ib-agents', JSON.stringify(newAgents))
      return { agents: newAgents }
    })
  },
  updateAgent: (id, updates) => {
    set((state) => {
      const newAgents = state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a))
      if (typeof window !== 'undefined') localStorage.setItem('ib-agents', JSON.stringify(newAgents))
      return { agents: newAgents }
    })
  },
  deleteAgent: (id) => {
    set((state) => {
      const newAgents = state.agents.filter((a) => a.id !== id)
      if (typeof window !== 'undefined') localStorage.setItem('ib-agents', JSON.stringify(newAgents))
      return { agents: newAgents }
    })
  },
  getAgent: (id) => get().agents.find((a) => a.id === id),
}))
