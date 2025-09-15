import { generateText, tool } from 'ai'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { SYSTEM_PROMPT } from '@/lib/chat-prompt'
import { getMCPClient } from '@/lib/mcp-client'

// Set the API key - try AI Gateway first, fallback to direct OpenAI
process.env.OPENAI_API_KEY = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    console.log('Simple API called with messages:', messages)

    const mcpClient = getMCPClient()

    // Use generateText instead of streamText to avoid streaming issues
    const result = await generateText({
      model: process.env.AI_GATEWAY_API_KEY ? 'openai/gpt-4o-mini' : 'gpt-4o-mini',
      system: SYSTEM_PROMPT,
      messages,
      toolChoice: 'auto',
      tools: {
        createCustomer: tool({
          description: 'Erstellt einen neuen Kunden oder Interessenten im CRM System. Verwende diese Funktion wenn der User neue Kundendaten (mindestens Vor- und Nachname) nennt.',
          inputSchema: z.object({
            firstName: z.string().min(1, 'Vorname ist erforderlich'),
            lastName: z.string().min(1, 'Nachname ist erforderlich'),
            email: z.string().email('Gültige E-Mail erforderlich').optional(),
            phone: z.string().optional(),
            address: z.string().optional(),
            isProspect: z.boolean().default(true)
          }),
          execute: async (params) => {
            console.log('Creating customer via MCP with params:', params)
            try {
              const result = await mcpClient.createCustomer(params)
              console.log('MCP createCustomer result:', result)
              return result
            } catch (error) {
              console.error('MCP createCustomer error:', error)
              return {
                success: false,
                error: 'Fehler beim Erstellen des Kunden über MCP',
                message: 'Es gab einen Fehler beim Erstellen des Kunden.'
              }
            }
          }
        }),
        
        getCustomers: tool({
          description: 'Lädt alle Kunden oder sucht nach bestimmten Kunden. Verwende diese Funktion wenn der User nach bestehenden Kunden fragt.',
          inputSchema: z.object({
            search: z.string().optional().describe('Suchbegriff für Name oder E-Mail - leer lassen um alle Kunden zu laden')
          }),
          execute: async (params) => {
            console.log('Getting customers via MCP with params:', params)
            try {
              const result = await mcpClient.getCustomers(params.search)
              console.log('MCP getCustomers result:', result)
              return result
            } catch (error) {
              console.error('MCP getCustomers error:', error)
              return {
                success: false,
                error: 'Fehler beim Laden der Kunden über MCP',
                message: 'Es gab einen Fehler beim Laden der Kundendaten.'
              }
            }
          }
        }),
        
        createOffer: tool({
          description: 'Erstellt ein neues Angebot für einen Kunden. Du musst zuerst mit getCustomers die Kunden-ID finden.',
          inputSchema: z.object({
            customerId: z.string().cuid('Ungültige Kunden-ID'),
            jobDescription: z.string().optional(),
            measurements: z.string().optional(),
            materialsCost: z.number().min(0).default(0),
            laborCost: z.number().min(0).default(0),
            totalCost: z.number().min(0).default(0)
          }),
          execute: async (params) => {
            console.log('Creating offer via MCP with params:', params)
            try {
              const result = await mcpClient.createOffer(params)
              console.log('MCP createOffer result:', result)
              return result
            } catch (error) {
              console.error('MCP createOffer error:', error)
              return {
                success: false,
                error: 'Fehler beim Erstellen des Angebots über MCP',
                message: 'Es gab einen Fehler beim Erstellen des Angebots.'
              }
            }
          }
        })
      }
    })

    // Return the complete response as JSON
    return new Response(JSON.stringify({
      content: result.text,
      toolResults: result.toolResults,
      usage: result.usage
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Simple chat API error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}