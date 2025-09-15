import { NextRequest } from 'next/server'
import { getMCPClient } from '@/lib/mcp-client'

export async function GET(req: NextRequest) {
  try {
    console.log('Testing MCP client...')
    const mcpClient = getMCPClient()
    
    // Test basic functionality
    const tools = await mcpClient.listTools()
    console.log('MCP tools:', tools)
    
    // Test customer retrieval
    const customers = await mcpClient.getCustomers()
    console.log('MCP customers:', customers)
    
    return new Response(JSON.stringify({
      success: true,
      tools: tools.map(t => t.name),
      customers: customers
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