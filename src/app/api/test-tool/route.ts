import { NextRequest } from 'next/server'
import { getMCPClient } from '@/lib/mcp-client'

export async function POST(req: NextRequest) {
  try {
    const { tool, args } = await req.json()
    console.log(`Testing tool: ${tool} with args:`, args)
    
    const mcpClient = getMCPClient()
    
    let result
    switch (tool) {
      case 'getCustomers':
        result = await mcpClient.getCustomers(args?.search)
        break
      case 'createCustomer':
        result = await mcpClient.createCustomer(args)
        break
      default:
        throw new Error(`Unknown tool: ${tool}`)
    }
    
    return new Response(JSON.stringify({
      success: true,
      tool,
      args,
      result
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Tool test error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}