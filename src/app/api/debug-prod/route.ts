import { NextRequest, NextResponse } from 'next/server'
import { getMCPClient } from '@/lib/mcp-client'

export const maxDuration = 30

export async function GET() {
  try {
    console.log('Production debug endpoint called')
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET'
    })

    const mcpClient = getMCPClient()

    console.log('Attempting to get customers...')
    const result = await mcpClient.getCustomers()
    console.log('MCP result:', result)

    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Production debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Production debug POST called with:', body)

    const mcpClient = getMCPClient()

    if (body.action === 'createCustomer') {
      const result = await mcpClient.createCustomer({
        firstName: body.firstName || 'Debug',
        lastName: body.lastName || 'Customer',
        email: body.email || 'debug@example.com'
      })
      return NextResponse.json({ success: true, result })
    }

    if (body.action === 'testChat') {
      const result = await mcpClient.getCustomers()
      return NextResponse.json({ success: true, result })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' })
  } catch (error) {
    console.error('Production debug POST error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}