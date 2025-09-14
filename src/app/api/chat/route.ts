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
  try {
    const { messages } = await req.json()

    const result = streamText({
      model: 'openai/gpt-4o-mini',
      system: SYSTEM_PROMPT,
      messages,
      tools: {
        createCustomer: tool({
          description: 'Erstellt einen neuen Kunden oder Interessenten im CRM System',
          inputSchema: createCustomerSchema,
          execute: async (params) => {
            console.log('Creating customer with params:', params)
            return await createCustomer(params)
          }
        }),
        
        getCustomers: tool({
          description: 'Lädt alle Kunden oder sucht nach bestimmten Kunden',
          inputSchema: z.object({
            search: z.string().optional().describe('Suchbegriff für Name oder E-Mail')
          }),
          execute: async (params) => {
            console.log('Getting customers with params:', params)
            return await getCustomers(params.search)
          }
        }),
        
        updateCustomer: tool({
          description: 'Aktualisiert einen bestehenden Kunden',
          inputSchema: z.object({
            id: z.string().describe('Die ID des zu aktualisierenden Kunden'),
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            email: z.string().optional(),
            phone: z.string().optional(),
            address: z.string().optional(),
            isProspect: z.boolean().optional()
          }),
          execute: async (params) => {
            console.log('Updating customer with params:', params)
            const { id, ...updateData } = params
            return await updateCustomer(id, updateData)
          }
        }),
        
        createOffer: tool({
          description: 'Erstellt ein neues Angebot für einen Kunden',
          inputSchema: createOfferSchema,
          execute: async (params) => {
            console.log('Creating offer with params:', params)
            return await createOffer(params)
          }
        }),
        
        getOffers: tool({
          description: 'Lädt alle Angebote oder Angebote für einen bestimmten Kunden',
          inputSchema: z.object({
            customerId: z.string().optional().describe('ID des Kunden, für den Angebote geladen werden sollen')
          }),
          execute: async (params) => {
            console.log('Getting offers with params:', params)
            return await getOffers(params.customerId)
          }
        })
      }
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}