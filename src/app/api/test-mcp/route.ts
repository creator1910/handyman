import { NextRequest } from 'next/server'
import { getMCPClient } from '@/lib/mcp-client'

export async function GET(req: NextRequest) {
  try {
    console.log('Testing MCP client...')
    const mcpClient = getMCPClient()

    // Test customer retrieval
    const customers = await mcpClient.getCustomers()
    console.log('MCP customers:', customers)

    // Test offers retrieval
    const offers = await mcpClient.getOffers()
    console.log('MCP offers:', offers)

    return new Response(JSON.stringify({
      success: true,
      message: 'MCP client working via HTTP transport',
      customers: customers,
      offers: offers
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('MCP test error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}