import { createOpenAI } from '@ai-sdk/openai'

export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set')
  }
  return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
}
