import { streamText, tool } from 'ai'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { SYSTEM_PROMPT } from '@/lib/chat-prompt'
import {
  createCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
  createOffer,
  createInvoice,
  getOffers,
  getInvoices,
  createCustomerSchema,
  createOfferSchema,
  createInvoiceSchema
} from '@/lib/crm-operations'

// Set the AI Gateway API key in environment
process.env.OPENAI_API_KEY = process.env.AI_GATEWAY_API_KEY

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const result = streamText({
    model: 'openai/gpt-4o-mini',
    system: SYSTEM_PROMPT,
    messages,
    // TODO: Add function calling tools - currently disabled due to version compatibility issues
  })

  return result.toTextStreamResponse()
}