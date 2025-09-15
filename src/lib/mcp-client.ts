import { prisma } from './prisma';

/**
 * MCP Client for communicating with the HandyAI CRM MCP Server
 * Uses HTTP transport in production, direct database in development
 */
export class MCPClient {
  private baseUrl: string;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    // Use the MCP API route endpoint - in production, we can use relative URLs
    this.baseUrl = this.isProduction
      ? '/api/mcp-simple'
      : 'http://localhost:3004/api/mcp-simple';
  }

  private async callTool(name: string, arguments_: any) {
    if (!this.isProduction) {
      // In development, use direct database operations for now
      return this.handleToolDirectly(name, arguments_);
    }

    try {
      const response = await fetch(`${this.baseUrl}`, {
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

  private async handleToolDirectly(name: string, arguments_: any) {
    switch (name) {
      case 'create_customer':
        try {
          const customer = await prisma.customer.create({
            data: {
              firstName: arguments_.firstName,
              lastName: arguments_.lastName,
              email: arguments_.email || null,
              phone: arguments_.phone || null,
              address: arguments_.address || null,
              isProspect: arguments_.isProspect ?? true
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

      case 'get_customers':
        try {
          const where = arguments_.search ? {
            OR: [
              { firstName: { contains: arguments_.search, mode: 'insensitive' as const } },
              { lastName: { contains: arguments_.search, mode: 'insensitive' as const } },
              { email: { contains: arguments_.search, mode: 'insensitive' as const } }
            ]
          } : {};

          const customers = await prisma.customer.findMany({
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

      case 'update_customer':
        try {
          const { id, ...data } = arguments_;
          const customer = await prisma.customer.update({
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

      case 'create_offer':
        try {
          const offerCount = await prisma.offer.count();
          const offerNumber = `ANG-${new Date().getFullYear()}-${String(offerCount + 1).padStart(4, '0')}`;

          const offer = await prisma.offer.create({
            data: {
              customerId: arguments_.customerId,
              offerNumber,
              jobDescription: arguments_.jobDescription || null,
              measurements: arguments_.measurements || null,
              materialsCost: arguments_.materialsCost || 0,
              laborCost: arguments_.laborCost || 0,
              totalCost: arguments_.totalCost || 0,
              status: 'DRAFT'
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

      case 'get_offers':
        try {
          const where = arguments_.customerId ? { customerId: arguments_.customerId } : {};
          const offers = await prisma.offer.findMany({
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

      default:
        throw new Error(`Unknown tool: ${name}`);
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