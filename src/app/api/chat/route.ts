import { streamText, tool } from 'ai'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { SYSTEM_PROMPT } from '@/lib/chat-prompt'
import { getMCPClient } from '@/lib/mcp-client'

// Set the AI Gateway API key in environment
process.env.OPENAI_API_KEY = process.env.AI_GATEWAY_API_KEY

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    console.log('API called with messages:', messages)

    const mcpClient = getMCPClient()

    const result = streamText({
      model: 'openai/gpt-4o-mini',
      system: SYSTEM_PROMPT,
      messages,
      toolChoice: 'auto',
      tools: {
        createCustomer: tool({
          description: 'Erstellt einen neuen Kunden oder Interessenten im CRM System. Verwende diese Funktion wenn der User neue Kundendaten (mindestens Vor- und Nachname) nennt. Beispiel: "Max Mustermann, max@example.com, 0123456789, Hauptstraße 1 Hamburg"',
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
          description: 'Lädt alle Kunden oder sucht nach bestimmten Kunden. Verwende diese Funktion wenn der User nach bestehenden Kunden fragt oder alle Kunden sehen möchte. Beispiele: "Zeige alle Kunden", "Suche nach Mustermann", "Welche Kunden haben wir?"',
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
        
        updateCustomer: tool({
          description: 'Aktualisiert einen bestehenden Kunden. Verwende diese Funktion wenn der User Änderungen an Kundendaten möchte. Du musst zuerst mit getCustomers die Kunden-ID finden. Beispiel: "Ändere die E-Mail von Max Mustermann"',
          inputSchema: z.object({
            id: z.string().describe('Die ID des zu aktualisierenden Kunden (muss von getCustomers geholt werden)'),
            firstName: z.string().optional().describe('Neuer Vorname'),
            lastName: z.string().optional().describe('Neuer Nachname'),
            email: z.string().optional().describe('Neue E-Mail-Adresse'),
            phone: z.string().optional().describe('Neue Telefonnummer'),
            address: z.string().optional().describe('Neue Adresse'),
            isProspect: z.boolean().optional().describe('true = Interessent, false = Kunde')
          }),
          execute: async (params) => {
            console.log('Updating customer via MCP with params:', params)
            try {
              const { id, ...updateData } = params
              const result = await mcpClient.updateCustomer(id, updateData)
              console.log('MCP updateCustomer result:', result)
              return result
            } catch (error) {
              console.error('MCP updateCustomer error:', error)
              return {
                success: false,
                error: 'Fehler beim Aktualisieren des Kunden über MCP',
                message: 'Es gab einen Fehler beim Aktualisieren der Kundendaten.'
              }
            }
          }
        }),
        
        createOffer: tool({
          description: 'Erstellt ein neues Angebot für einen Kunden. Verwende diese Funktion wenn der User ein Angebot erstellen möchte. Du musst zuerst mit getCustomers die Kunden-ID finden. Beispiel: "Erstelle ein Angebot für Max Mustermann für Fassadenanstrich 50m² à 30€"',
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
        }),
        
        getOffers: tool({
          description: 'Lädt alle Angebote oder Angebote für einen bestimmten Kunden. Verwende diese Funktion wenn der User nach Angeboten fragt. Beispiele: "Zeige alle Angebote", "Welche Angebote gibt es für Max Mustermann?"',
          inputSchema: z.object({
            customerId: z.string().optional().describe('ID des Kunden, für den Angebote geladen werden sollen - leer lassen für alle Angebote')
          }),
          execute: async (params) => {
            console.log('Getting offers via MCP with params:', params)
            try {
              const result = await mcpClient.getOffers(params.customerId)
              console.log('MCP getOffers result:', result)
              return result
            } catch (error) {
              console.error('MCP getOffers error:', error)
              return {
                success: false,
                error: 'Fehler beim Laden der Angebote über MCP',
                message: 'Es gab einen Fehler beim Laden der Angebote.'
              }
            }
          }
        })
      }
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}