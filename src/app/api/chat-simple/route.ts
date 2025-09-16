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
        
        findCustomer: tool({
          description: 'Findet einen Kunden anhand des Namens. Verwende diese Funktion wenn der User einen bestimmten Kunden erwähnt. Beispiele: "Erstelle ein Angebot für Max Mustermann", "Zeige Details von Maria Schmidt"',
          inputSchema: z.object({
            customerName: z.string().describe('Name des Kunden (Vor- und/oder Nachname)')
          }),
          execute: async (params) => {
            console.log('Finding customer via MCP with params:', params)
            try {
              const result = await mcpClient.findCustomerByName(params.customerName)
              console.log('MCP findCustomer result:', result)
              return result
            } catch (error) {
              console.error('MCP findCustomer error:', error)
              return {
                success: false,
                error: 'Fehler bei der Kundensuche über MCP',
                message: 'Es gab einen Fehler bei der Suche nach dem Kunden.'
              }
            }
          }
        }),

        getCustomerDetails: tool({
          description: 'Lädt alle Details eines Kunden inklusive Angebote, Rechnungen und Termine. Verwende dies für detaillierte Kundenabfragen.',
          inputSchema: z.object({
            customerId: z.string().describe('Die ID des Kunden')
          }),
          execute: async (params) => {
            console.log('Getting customer details via MCP with params:', params)
            try {
              const result = await mcpClient.getCustomerDetails(params.customerId)
              console.log('MCP getCustomerDetails result:', result)
              return result
            } catch (error) {
              console.error('MCP getCustomerDetails error:', error)
              return {
                success: false,
                error: 'Fehler beim Laden der Kundendetails über MCP',
                message: 'Es gab einen Fehler beim Laden der Kundendetails.'
              }
            }
          }
        }),

        createOffer: tool({
          description: 'Erstellt ein neues Angebot für einen Kunden. WICHTIG: Verwende zuerst findCustomer um den richtigen Kunden zu finden und bestätigen zu lassen. Beispiel: "Erstelle ein Angebot für Max Mustermann für Fassadenanstrich 50m² à 30€"',
          inputSchema: z.object({
            customerId: z.string().describe('Die ID des Kunden (von findCustomer erhalten)'),
            customerName: z.string().describe('Name des Kunden für Bestätigung'),
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