import { supabase, Customer, Offer } from './supabase';
import { createId } from '@paralleldrive/cuid2';

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
      ? `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''}/api/mcp-simple`
      : 'http://localhost:3005/api/mcp-simple';

    console.log('MCP Client initialized:', {
      isProduction: this.isProduction,
      baseUrl: this.baseUrl,
      NODE_ENV: process.env.NODE_ENV
    });
  }

  private async callTool(name: string, arguments_: any) {
    console.log('MCP callTool called:', {
      name,
      arguments: arguments_,
      isProduction: this.isProduction,
      baseUrl: this.baseUrl
    });

    // Always use direct database operations - HTTP calls don't work well in serverless
    console.log('Using direct database operations');
    return this.handleToolDirectly(name, arguments_);

    // Commented out HTTP approach - doesn't work reliably in Vercel serverless
    // if (!this.isProduction) {
    //   console.log('Using direct database operations (development mode)');
    //   return this.handleToolDirectly(name, arguments_);
    // }
    // console.log('Using HTTP MCP calls (production mode)');
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
          const now = new Date().toISOString();
          const { data: customer, error } = await supabase
            .from('customers')
            .insert({
              id: createId(),
              firstName: arguments_.firstName,
              lastName: arguments_.lastName,
              email: arguments_.email || null,
              phone: arguments_.phone || null,
              address: arguments_.address || null,
              isProspect: arguments_.isProspect ?? true,
              createdAt: now,
              updatedAt: now
            })
            .select()
            .single();

          if (error) throw error;

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
          let query = supabase
            .from('customers')
            .select('*, offers(count), invoices(count), appointments(count)')
            .order('createdAt', { ascending: false });

          if (arguments_.search) {
            // Split search into words for better matching
            const searchWords = arguments_.search.split(' ').filter(word => word.trim());

            if (searchWords.length === 1) {
              // Single word search - check each field
              query = query.or(
                `firstName.ilike.%${arguments_.search}%,lastName.ilike.%${arguments_.search}%,email.ilike.%${arguments_.search}%`
              );
            } else {
              // Multi-word search - check if words match firstName and lastName
              const firstWord = searchWords[0];
              const lastWord = searchWords[searchWords.length - 1];
              query = query.or(
                `firstName.ilike.%${firstWord}%,lastName.ilike.%${lastWord}%,` +
                `firstName.ilike.%${arguments_.search}%,lastName.ilike.%${arguments_.search}%,email.ilike.%${arguments_.search}%`
              );
            }
          }

          const { data: customers, error } = await query;

          if (error) throw error;

          return {
            success: true,
            customers: customers || [],
            count: customers?.length || 0,
            message: `${customers?.length || 0} Kunden/Interessenten geladen.`
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
          const updateData: any = {};

          if (data.firstName) updateData.firstName = data.firstName;
          if (data.lastName) updateData.lastName = data.lastName;
          if (data.email !== undefined) updateData.email = data.email || null;
          if (data.phone !== undefined) updateData.phone = data.phone || null;
          if (data.address !== undefined) updateData.address = data.address || null;
          if (data.isProspect !== undefined) updateData.isProspect = data.isProspect;

          const { data: customer, error } = await supabase
            .from('customers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

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
          const { count } = await supabase
            .from('offers')
            .select('*', { count: 'exact', head: true });

          const offerNumber = `ANG-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`;

          const now = new Date().toISOString();
          const { data: offer, error } = await supabase
            .from('offers')
            .insert({
              id: createId(),
              customerId: arguments_.customerId,
              offerNumber,
              jobDescription: arguments_.jobDescription || null,
              measurements: arguments_.measurements || null,
              materialsCost: arguments_.materialsCost || 0,
              laborCost: arguments_.laborCost || 0,
              totalCost: arguments_.totalCost || 0,
              status: 'DRAFT',
              createdAt: now,
              updatedAt: now
            })
            .select(`
              *,
              customer:customers!customerId (
                firstName,
                lastName
              )
            `)
            .single();

          if (error) throw error;

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
          let query = supabase
            .from('offers')
            .select(`
              *,
              customer:customers!customerId (
                firstName,
                lastName,
                email
              )
            `)
            .order('createdAt', { ascending: false });

          if (arguments_.customerId) {
            query = query.eq('customerId', arguments_.customerId);
          }

          const { data: offers, error } = await query;

          if (error) throw error;

          return {
            success: true,
            offers: offers || [],
            count: offers?.length || 0,
            message: `${offers?.length || 0} Angebote geladen.`
          };
        } catch (error: any) {
          return {
            success: false,
            error: 'Fehler beim Laden der Angebote',
            message: error.message
          };
        }

      case 'find_customer_by_name':
        try {
          const searchTerm = arguments_.customerName;
          let query = supabase
            .from('customers')
            .select('*')
            .order('createdAt', { ascending: false });

          // Split search into words for better matching
          const searchWords = searchTerm.split(' ').filter(word => word.trim());

          if (searchWords.length === 1) {
            // Single word search - check each field
            query = query.or(
              `firstName.ilike.%${searchTerm}%,lastName.ilike.%${searchTerm}%`
            );
          } else {
            // Multi-word search - check if words match firstName and lastName
            const firstWord = searchWords[0];
            const lastWord = searchWords[searchWords.length - 1];
            query = query.or(
              `firstName.ilike.%${firstWord}%,lastName.ilike.%${lastWord}%,` +
              `firstName.ilike.%${searchTerm}%,lastName.ilike.%${searchTerm}%`
            );
          }

          const { data: customers, error } = await query;

          if (error) throw error;

          if (!customers || customers.length === 0) {
            return {
              success: false,
              error: 'Kunde nicht gefunden',
              message: `Kein Kunde mit dem Namen "${searchTerm}" gefunden.`
            };
          }

          // Calculate similarity scores for better matching
          const scoredCustomers = customers.map(customer => {
            const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
            const searchLower = searchTerm.toLowerCase();

            // Simple scoring: exact match > contains > fuzzy match
            let score = 0;
            if (fullName === searchLower) score = 100;
            else if (fullName.includes(searchLower)) score = 80;
            else if (searchLower.includes(customer.firstName.toLowerCase()) ||
                     searchLower.includes(customer.lastName.toLowerCase())) score = 60;
            else score = 30;

            return { ...customer, matchScore: score };
          });

          // Sort by score and take top matches
          const sortedCustomers = scoredCustomers
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 5);

          return {
            success: true,
            customers: sortedCustomers,
            bestMatch: sortedCustomers[0],
            count: sortedCustomers.length,
            message: `${sortedCustomers.length} Kunden für "${searchTerm}" gefunden.`
          };
        } catch (error: any) {
          return {
            success: false,
            error: 'Fehler bei der Kundensuche',
            message: error.message
          };
        }

      case 'get_customer_details':
        try {
          const { data: customer, error } = await supabase
            .from('customers')
            .select(`
              *,
              offers(*),
              invoices(*),
              appointments(*)
            `)
            .eq('id', arguments_.customerId)
            .single();

          if (error || !customer) {
            return {
              success: false,
              error: 'Kunde nicht gefunden',
              message: 'Der angegebene Kunde wurde nicht gefunden.'
            };
          }

          return {
            success: true,
            customer,
            message: `Details für ${customer.firstName} ${customer.lastName} geladen.`
          };
        } catch (error: any) {
          return {
            success: false,
            error: 'Fehler beim Laden der Kundendetails',
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

  async findCustomerByName(customerName: string) {
    return this.callTool('find_customer_by_name', { customerName });
  }

  async getCustomerDetails(customerId: string) {
    return this.callTool('get_customer_details', { customerId });
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