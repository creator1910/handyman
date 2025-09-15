/**
 * MCP Client for communicating with the HandyAI CRM MCP Server
 * Uses HTTP transport to communicate with the MCP API route
 */
export class MCPClient {
  private baseUrl: string;

  constructor() {
    // Use the MCP API route endpoint - in production, we can use relative URLs
    this.baseUrl = process.env.NODE_ENV === 'production'
      ? '/api/mcp'
      : 'http://localhost:3000/api/mcp';
  }

  private async callTool(name: string, arguments_: any) {
    try {
      const response = await fetch(`${this.baseUrl}/stateless`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'tools/call',
          params: {
            name,
            arguments: arguments_
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.result?.content?.[0]?.text ? JSON.parse(data.result.content[0].text) : data.result;
    } catch (error) {
      console.error('MCP tool call error:', error);
      throw error;
    }
  }

  // CRM-specific convenience methods
  async createCustomer(data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: string;
    isProspect?: boolean;
  }) {
    return this.callTool('create_customer', data);
  }

  async getCustomers(search?: string) {
    return this.callTool('get_customers', { search });
  }

  async updateCustomer(id: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    isProspect?: boolean;
  }) {
    return this.callTool('update_customer', { id, ...data });
  }

  async createOffer(data: {
    customerId: string;
    jobDescription?: string;
    measurements?: string;
    materialsCost?: number;
    laborCost?: number;
    totalCost?: number;
  }) {
    return this.callTool('create_offer', data);
  }

  async getOffers(customerId?: string) {
    return this.callTool('get_offers', { customerId });
  }
}

// Singleton instance for the application
let mcpClient: MCPClient | null = null;

export function getMCPClient(): MCPClient {
  if (!mcpClient) {
    mcpClient = new MCPClient();
  }
  return mcpClient;
}