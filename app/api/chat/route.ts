import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages, modelId, instructions } = await req.json()

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return new Response('OPENROUTER_API_KEY not configured', { status: 503 })
  }

  const openrouter = createOpenRouter({ apiKey })

  const result = streamText({
    model: openrouter.chat(modelId || 'openai/gpt-4o-mini'),
    system: instructions || 'You are a helpful AI assistant. Be concise and helpful.',
    messages,
  })

  return result.toDataStreamResponse()
}
