import { PrismaClient } from '@prisma/client';
import path from 'path';

/**
 * CRM Database abstraction for MCP server
 * Uses Prisma to connect to the HandyAI database
 */
export class CRMDatabase {
  private prisma: PrismaClient;

  constructor() {
    // Connect to the main application's database
    this.prisma = new PrismaClient();
  }

  async createCustomer(data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: string;
    isProspect?: boolean;
  }) {
    try {
      const customer = await this.prisma.customer.create({
        data: {
          ...data,
          email: data.email || null,
          isProspect: data.isProspect ?? true
        }
      });

      return {
        success: true,
        customer,
        message: `${data.isProspect ? 'Interessent' : 'Kunde'} "${data.firstName} ${data.lastName}" wurde erfolgreich erstellt.`
      };
    } catch (error) {
      console.error('Fehler beim Erstellen des Kunden:', error);
      return {
        success: false,
        error: 'Fehler beim Erstellen des Kunden',
        message: 'Es gab einen Fehler beim Erstellen des Kunden.'
      };
    }
  }

  async getCustomers(search?: string) {
    try {
      const customers = await this.prisma.customer.findMany({
        where: search ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } }
          ]
        } : undefined,
        include: {
          _count: {
            select: {
              offers: true,
              invoices: true,
              appointments: true
            }
          }
        },
        orderBy: [
          { updatedAt: 'desc' }
        ]
      });

      return {
        success: true,
        customers,
        count: customers.length,
        message: `${customers.length} ${search ? 'gefundene ' : ''}Kunden/Interessenten geladen.`
      };
    } catch (error) {
      console.error('Fehler beim Laden der Kunden:', error);
      return {
        success: false,
        error: 'Fehler beim Laden der Kunden',
        message: 'Es gab einen Fehler beim Laden der Kundendaten.'
      };
    }
  }

  async updateCustomer(id: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    isProspect?: boolean;
  }) {
    try {
      const customer = await this.prisma.customer.update({
        where: { id },
        data: {
          ...data,
          email: data.email || null
        }
      });

      return {
        success: true,
        customer,
        message: `Kunde "${customer.firstName} ${customer.lastName}" wurde aktualisiert.`
      };
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Kunden:', error);
      return {
        success: false,
        error: 'Fehler beim Aktualisieren des Kunden',
        message: 'Es gab einen Fehler beim Aktualisieren der Kundendaten.'
      };
    }
  }

  async createOffer(data: {
    customerId: string;
    jobDescription?: string;
    measurements?: string;
    materialsCost?: number;
    laborCost?: number;
    totalCost?: number;
  }) {
    try {
      // Generate offer number
      const offerCount = await this.prisma.offer.count();
      const offerNumber = `ANG-${new Date().getFullYear()}-${String(offerCount + 1).padStart(4, '0')}`;

      const offer = await this.prisma.offer.create({
        data: {
          ...data,
          offerNumber,
          materialsCost: data.materialsCost ?? 0,
          laborCost: data.laborCost ?? 0,
          totalCost: data.totalCost ?? 0
        },
        include: {
          customer: true
        }
      });

      return {
        success: true,
        offer,
        message: `Angebot ${offerNumber} für ${offer.customer.firstName} ${offer.customer.lastName} wurde erstellt.`
      };
    } catch (error) {
      console.error('Fehler beim Erstellen des Angebots:', error);
      return {
        success: false,
        error: 'Fehler beim Erstellen des Angebots',
        message: 'Es gab einen Fehler beim Erstellen des Angebots.'
      };
    }
  }

  async getOffers(customerId?: string) {
    try {
      const offers = await this.prisma.offer.findMany({
        where: customerId ? { customerId } : undefined,
        include: {
          customer: true,
          invoice: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        offers,
        count: offers.length,
        message: `${offers.length} Angebote${customerId ? ' für diesen Kunden' : ''} geladen.`
      };
    } catch (error) {
      console.error('Fehler beim Laden der Angebote:', error);
      return {
        success: false,
        error: 'Fehler beim Laden der Angebote',
        message: 'Es gab einen Fehler beim Laden der Angebote.'
      };
    }
  }

  async getStats() {
    try {
      const [
        totalCustomers,
        totalProspects,
        totalOffers,
        totalInvoices,
        recentCustomers,
        recentOffers
      ] = await Promise.all([
        this.prisma.customer.count({ where: { isProspect: false } }),
        this.prisma.customer.count({ where: { isProspect: true } }),
        this.prisma.offer.count(),
        this.prisma.invoice.count(),
        this.prisma.customer.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }),
        this.prisma.offer.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        })
      ]);

      const totalRevenue = await this.prisma.invoice.aggregate({
        _sum: {
          totalAmount: true
        }
      });

      return {
        success: true,
        statistics: {
          customers: {
            total: totalCustomers,
            prospects: totalProspects,
            recent: recentCustomers
          },
          offers: {
            total: totalOffers,
            recent: recentOffers
          },
          invoices: {
            total: totalInvoices
          },
          revenue: {
            total: totalRevenue._sum.totalAmount || 0
          },
          conversionRate: totalCustomers > 0 ? (totalCustomers / (totalCustomers + totalProspects) * 100).toFixed(2) : '0.00'
        },
        message: 'CRM-Statistiken erfolgreich geladen.'
      };
    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error);
      return {
        success: false,
        error: 'Fehler beim Laden der Statistiken',
        message: 'Es gab einen Fehler beim Laden der CRM-Statistiken.'
      };
    }
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}