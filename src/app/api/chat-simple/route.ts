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
          description: 'Findet einen Kunden anhand des Namens für allgemeine Abfragen (NICHT für Angebotserstellung). Verwende diese Funktion nur für: "Zeige Details von Maria Schmidt", "Wer ist Max Mustermann". Für Angebotserstellung verwende createOfferWithLookup.',
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

        createOfferWithLookup: tool({
          description: 'PRIMÄRE Funktion für Angebotserstellung! Erstellt ein neues Angebot für einen Kunden mit automatischer Kundensuche und Bestätigung. Verwende diese Funktion IMMER wenn der User ein Angebot erstellen möchte. Beispiele: "Erstelle ein Angebot für Max Mustermann", "Angebot für Juli Knorr", "Ich möchte ein Angebot für..."',
          inputSchema: z.object({
            clientName: z.string().describe('Name des Kunden (Vor- und/oder Nachname)'),
            jobDescription: z.string().optional().describe('Beschreibung der Arbeit'),
            measurements: z.string().optional().describe('Maße oder Fläche'),
            materialsCost: z.number().min(0).default(0).describe('Materialkosten in Euro'),
            laborCost: z.number().min(0).default(0).describe('Arbeitskosten in Euro')
          }),
          execute: async (params) => {
            console.log('Creating offer with client lookup via MCP with params:', params)
            try {
              const offerDetails = {
                jobDescription: params.jobDescription,
                measurements: params.measurements,
                materialsCost: params.materialsCost,
                laborCost: params.laborCost
              }

              const result = await mcpClient.createOfferWithClientLookup(params.clientName, offerDetails)
              console.log('MCP createOfferWithClientLookup result:', result)

              // If we need client confirmation, format the response appropriately
              if (result.needsClientConfirmation && result.suggestedClients) {
                return {
                  ...result,
                  message: `Ich habe ${result.suggestedClients.length} Kunden für "${params.clientName}" gefunden. Bitte bestätigen Sie den richtigen Kunden:

${result.suggestedClients.map((customer: any, index: number) =>
  `${index + 1}. **${customer.firstName} ${customer.lastName}** ${customer.isProspect ? '(Interessent)' : '(Kunde)'}
   ${[customer.email, customer.phone, customer.address].filter(Boolean).join(' • ')}`
).join('\n\n')}

Welchen Kunden möchten Sie auswählen?`
                }
              }

              // If we need to create a new client
              if (result.needsClientCreation) {
                return {
                  ...result,
                  message: `Kein Kunde mit dem Namen "${params.clientName}" gefunden. Soll ich einen neuen Kunden anlegen?

**Vorschlag:**
- Vorname: ${result.suggestedClientData?.firstName || ''}
- Nachname: ${result.suggestedClientData?.lastName || ''}

Bestätigen Sie die Daten oder korrigieren Sie diese.`
                }
              }

              return result
            } catch (error) {
              console.error('MCP createOfferWithClientLookup error:', error)
              return {
                success: false,
                error: 'Fehler beim Erstellen des Angebots über MCP',
                message: 'Es gab einen Fehler beim Erstellen des Angebots.'
              }
            }
          }
        }),

        confirmOfferClient: tool({
          description: 'Bestätigt einen Kunden für die Angebotserstellung und erstellt das Angebot mit PDF. Verwende dies nachdem createOfferWithLookup Kundenoptionen zurückgegeben hat.',
          inputSchema: z.object({
            customerId: z.string().describe('Die ID des bestätigten Kunden'),
            jobDescription: z.string().optional().describe('Beschreibung der Arbeit'),
            measurements: z.string().optional().describe('Maße oder Fläche'),
            materialsCost: z.number().min(0).default(0).describe('Materialkosten in Euro'),
            laborCost: z.number().min(0).default(0).describe('Arbeitskosten in Euro')
          }),
          execute: async (params) => {
            console.log('Confirming offer client via MCP with params:', params)
            try {
              const offerDetails = {
                jobDescription: params.jobDescription,
                measurements: params.measurements,
                materialsCost: params.materialsCost,
                laborCost: params.laborCost
              }

              const result = await mcpClient.createOfferWithConfirmedClient(params.customerId, offerDetails)
              console.log('MCP createOfferWithConfirmedClient result:', result)

              // If successful, format the response with PDF link
              if (result.success && result.pdfUrl) {
                return {
                  ...result,
                  message: `${result.message}

📄 Angebot: ${result.pdfUrl}

Das Angebot wurde erfolgreich erstellt und steht als PDF zum Download bereit.`
                }
              }

              return result
            } catch (error) {
              console.error('MCP confirmOfferClient error:', error)
              return {
                success: false,
                error: 'Fehler beim Bestätigen des Angebots über MCP',
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