import { NextRequest } from 'next/server';
import { getMCPClient } from '@/lib/mcp-client';

export async function GET(req: NextRequest) {
  try {
    console.log('Debug MCP endpoint called');
    console.log('NODE_ENV:', process.env.NODE_ENV);

    const mcpClient = getMCPClient();

    // Try to get customers
    console.log('Attempting to get customers...');
    const result = await mcpClient.getCustomers();
    console.log('MCP result:', result);

    return Response.json({
      success: true,
      environment: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
      result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug MCP error:', error);
    return Response.json({
      success: false,
      environment: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}