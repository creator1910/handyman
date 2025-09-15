import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { prisma } from './prisma';

/**
 * MCP Client for communicating with the HandyAI CRM MCP Server
 * Provides a clean interface to execute CRM tools via MCP protocol
 * Falls back to direct database operations in production environments
 */
export class MCPClient {
  private process: ChildProcess | null = null;
  private requestId = 1;
  private pendingRequests: Map<number, { resolve: Function; reject: Function }> = new Map();
  private isProductionMode = false;

  constructor() {
    // Check if we're in a serverless environment (Vercel)
    this.isProductionMode = !!process.env.VERCEL || process.env.NODE_ENV === 'production';

    if (!this.isProductionMode) {
      this.startMCPServer();
    }
  }

  private startMCPServer() {
    try {
      const serverPath = path.resolve(process.cwd(), 'mcp-crm-server', 'dist', 'index.js');
      
      this.process = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          DATABASE_URL: `file:${path.resolve(process.cwd(), 'prisma', 'dev.db')}`
        }
      });

      if (this.process.stdout) {
        this.process.stdout.on('data', (data) => {
          const lines = data.toString().split('\n').filter((line: string) => line.trim());
          
          for (const line of lines) {
            try {
              const response = JSON.parse(line);
              if (response.id && this.pendingRequests.has(response.id)) {
                const { resolve } = this.pendingRequests.get(response.id)!;
                this.pendingRequests.delete(response.id);
                resolve(response);
              }
            } catch (error) {
              // Ignore non-JSON lines (like server startup messages)
            }
          }
        });
      }

      if (this.process.stderr) {
        this.process.stderr.on('data', (data) => {
          // Log stderr but don't treat as errors (server uses stderr for logging)
          console.log('MCP Server:', data.toString().trim());
        });
      }

      this.process.on('error', (error) => {
        console.error('MCP Server process error:', error);
      });

      this.process.on('exit', (code) => {
        console.log('MCP Server exited with code:', code);
        this.process = null;
      });

    } catch (error) {
      console.error('Failed to start MCP Server:', error);
    }
  }

  private async sendRequest(method: string, params: any = {}): Promise<any> {
    if (!this.process || !this.process.stdin) {
      throw new Error('MCP Server not available');
    }

    const id = this.requestId++;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      // Set timeout for requests
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('MCP request timeout'));
        }
      }, 10000); // 10 second timeout

      this.process!.stdin!.write(JSON.stringify(request) + '\n');
    });
  }

  async listTools() {
    const response = await this.sendRequest('tools/list');
    return response.result?.tools || [];
  }

  async callTool(name: string, arguments_: any) {
    const response = await this.sendRequest('tools/call', {
      name,
      arguments: arguments_
    });
    
    if (response.result?.content?.[0]?.text) {
      return JSON.parse(response.result.content[0].text);
    }
    
    throw new Error('Invalid MCP tool response');
  }

  async listResources() {
    const response = await this.sendRequest('resources/list');
    return response.result?.resources || [];
  }

  async readResource(uri: string) {
    const response = await this.sendRequest('resources/read', { uri });
    
    if (response.result?.contents?.[0]?.text) {
      return JSON.parse(response.result.contents[0].text);
    }
    
    throw new Error('Invalid MCP resource response');
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
    if (this.isProductionMode) {
      try {
        const customer = await prisma.customers.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address || null,
            isProspect: data.isProspect ?? true
          }
        });
        return {
          success: true,
          customer,
          message: `Kunde ${customer.firstName} ${customer.lastName} erfolgreich erstellt.`
        };
      } catch (error: any) {
        return {
          success: false,
          error: 'Fehler beim Erstellen des Kunden',
          message: error.message
        };
      }
    }
    return this.callTool('create_customer', data);
  }

  async getCustomers(search?: string) {
    if (this.isProductionMode) {
      try {
        const where = search ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } }
          ]
        } : {};

        const customers = await prisma.customers.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                offers: true,
                invoices: true,
                appointments: true
              }
            }
          }
        });

        return {
          success: true,
          customers,
          count: customers.length,
          message: `${customers.length} Kunden/Interessenten geladen.`
        };
      } catch (error: any) {
        return {
          success: false,
          error: 'Fehler beim Laden der Kunden',
          message: error.message
        };
      }
    }
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
    if (this.isProductionMode) {
      try {
        const customer = await prisma.customers.update({
          where: { id },
          data: {
            ...(data.firstName && { firstName: data.firstName }),
            ...(data.lastName && { lastName: data.lastName }),
            ...(data.email !== undefined && { email: data.email || null }),
            ...(data.phone !== undefined && { phone: data.phone || null }),
            ...(data.address !== undefined && { address: data.address || null }),
            ...(data.isProspect !== undefined && { isProspect: data.isProspect })
          }
        });
        return {
          success: true,
          customer,
          message: `Kunde ${customer.firstName} ${customer.lastName} erfolgreich aktualisiert.`
        };
      } catch (error: any) {
        return {
          success: false,
          error: 'Fehler beim Aktualisieren des Kunden',
          message: error.message
        };
      }
    }
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
    if (this.isProductionMode) {
      try {
        const offer = await prisma.offers.create({
          data: {
            customerId: data.customerId,
            jobDescription: data.jobDescription || null,
            measurements: data.measurements || null,
            materialsCost: data.materialsCost || 0,
            laborCost: data.laborCost || 0,
            totalCost: data.totalCost || 0,
            status: 'draft'
          },
          include: {
            customer: {
              select: { firstName: true, lastName: true }
            }
          }
        });
        return {
          success: true,
          offer,
          message: `Angebot für ${offer.customer.firstName} ${offer.customer.lastName} erfolgreich erstellt.`
        };
      } catch (error: any) {
        return {
          success: false,
          error: 'Fehler beim Erstellen des Angebots',
          message: error.message
        };
      }
    }
    return this.callTool('create_offer', data);
  }

  async getOffers(customerId?: string) {
    if (this.isProductionMode) {
      try {
        const where = customerId ? { customerId } : {};
        const offers = await prisma.offers.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        });
        return {
          success: true,
          offers,
          count: offers.length,
          message: `${offers.length} Angebote geladen.`
        };
      } catch (error: any) {
        return {
          success: false,
          error: 'Fehler beim Laden der Angebote',
          message: error.message
        };
      }
    }
    return this.callTool('get_offers', { customerId });
  }

  async getStats() {
    return this.readResource('crm://stats/overview');
  }

  disconnect() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.pendingRequests.clear();
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