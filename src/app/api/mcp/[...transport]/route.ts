import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const maxDuration = 30;

const handler = createMcpHandler({
  name: 'HandyAI CRM Server',
  version: '1.0.0',
  tools: {
    create_customer: {
      description: 'Erstellt einen neuen Kunden oder Interessenten im CRM System',
      inputSchema: z.object({
        firstName: z.string().min(1, 'Vorname ist erforderlich'),
        lastName: z.string().min(1, 'Nachname ist erforderlich'),
        email: z.string().email('Gültige E-Mail erforderlich').optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        isProspect: z.boolean().default(true)
      }),
      handler: async ({ firstName, lastName, email, phone, address, isProspect }) => {
        try {
          const customer = await prisma.customers.create({
            data: {
              firstName,
              lastName,
              email: email || null,
              phone: phone || null,
              address: address || null,
              isProspect: isProspect ?? true
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
    },

    get_customers: {
      description: 'Lädt alle Kunden oder sucht nach bestimmten Kunden',
      inputSchema: z.object({
        search: z.string().optional().describe('Suchbegriff für Name oder E-Mail')
      }),
      handler: async ({ search }) => {
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
    },

    update_customer: {
      description: 'Aktualisiert einen bestehenden Kunden',
      inputSchema: z.object({
        id: z.string().describe('Die ID des zu aktualisierenden Kunden'),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        isProspect: z.boolean().optional()
      }),
      handler: async ({ id, ...data }) => {
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
    },

    create_offer: {
      description: 'Erstellt ein neues Angebot für einen Kunden',
      inputSchema: z.object({
        customerId: z.string().cuid('Ungültige Kunden-ID'),
        jobDescription: z.string().optional(),
        measurements: z.string().optional(),
        materialsCost: z.number().min(0).default(0),
        laborCost: z.number().min(0).default(0),
        totalCost: z.number().min(0).default(0)
      }),
      handler: async ({ customerId, jobDescription, measurements, materialsCost, laborCost, totalCost }) => {
        try {
          const offer = await prisma.offers.create({
            data: {
              customerId,
              jobDescription: jobDescription || null,
              measurements: measurements || null,
              materialsCost: materialsCost || 0,
              laborCost: laborCost || 0,
              totalCost: totalCost || 0,
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
    },

    get_offers: {
      description: 'Lädt alle Angebote oder Angebote für einen bestimmten Kunden',
      inputSchema: z.object({
        customerId: z.string().optional().describe('ID des Kunden für spezifische Angebote')
      }),
      handler: async ({ customerId }) => {
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
    }
  }
});

export const { GET, POST } = handler;