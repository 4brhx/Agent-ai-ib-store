export interface AIModel {
  id: string
  name: string
  provider: string
  description: string
  contextWindow: number
  maxOutput: number
  pricing: { input: number; output: number }
  capabilities: string[]
  icon: string
}

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Most capable OpenAI model with vision, fast responses, and broad knowledge.',
    contextWindow: 128000,
    maxOutput: 16384,
    pricing: { input: 2.5, output: 10 },
    capabilities: ['vision', 'function-calling', 'json-mode', 'streaming'],
    icon: '🟢',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Fast and affordable for everyday tasks. Great balance of speed and quality.',
    contextWindow: 128000,
    maxOutput: 16384,
    pricing: { input: 0.15, output: 0.6 },
    capabilities: ['vision', 'function-calling', 'json-mode', 'streaming'],
    icon: '🟡',
  },
  {
    id: 'anthropic/claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    description: 'Advanced reasoning and analysis. Excellent for complex coding and writing tasks.',
    contextWindow: 200000,
    maxOutput: 8192,
    pricing: { input: 3, output: 15 },
    capabilities: ['vision', 'function-calling', 'streaming', 'long-context'],
    icon: '🟠',
  },
  {
    id: 'anthropic/claude-haiku-3.5',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    description: 'Lightning fast with impressive intelligence. Best for quick interactions.',
    contextWindow: 200000,
    maxOutput: 8192,
    pricing: { input: 0.25, output: 1.25 },
    capabilities: ['vision', 'function-calling', 'streaming'],
    icon: '⚡',
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    description: 'Multimodal AI with excellent speed. Great for diverse content types.',
    contextWindow: 1000000,
    maxOutput: 8192,
    pricing: { input: 0.1, output: 0.4 },
    capabilities: ['vision', 'function-calling', 'streaming', 'long-context'],
    icon: '💎',
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    description: 'Powerful open-source model. Exceptional at coding and reasoning tasks.',
    contextWindow: 64000,
    maxOutput: 8192,
    pricing: { input: 0.14, output: 0.28 },
    capabilities: ['function-calling', 'streaming', 'coding'],
    icon: '🔵',
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    description: 'Open-source powerhouse. Strong general capabilities with great value.',
    contextWindow: 131072,
    maxOutput: 4096,
    pricing: { input: 0.35, output: 0.4 },
    capabilities: ['function-calling', 'streaming'],
    icon: '🦙',
  },
  {
    id: 'mistralai/mistral-large-latest',
    name: 'Mistral Large',
    provider: 'Mistral',
    description: 'European AI excellence. Strong multilingual and reasoning capabilities.',
    contextWindow: 128000,
    maxOutput: 8192,
    pricing: { input: 2, output: 6 },
    capabilities: ['function-calling', 'streaming', 'multilingual'],
    icon: '🌊',
  },
]
