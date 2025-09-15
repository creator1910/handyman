import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const maxDuration = 30;

const handler = createMcpHandler(async (server) => {
  server.setRequestHandler('tools/list', async () => {
    return {
      tools: [
        {
          name: 'create_customer',
          description: 'Erstellt einen neuen Kunden oder Interessenten im CRM System',
          inputSchema: {
            type: 'object',
            properties: {
              firstName: { type: 'string', description: 'Vorname' },
              lastName: { type: 'string', description: 'Nachname' },
              email: { type: 'string', description: 'E-Mail-Adresse' },
              phone: { type: 'string', description: 'Telefonnummer' },
              address: { type: 'string', description: 'Adresse' },
              isProspect: { type: 'boolean', description: 'Ist Interessent' }
            },
            required: ['firstName', 'lastName']
          }
        },
        {
          name: 'get_customers',
          description: 'Lädt alle Kunden oder sucht nach bestimmten Kunden',
          inputSchema: {
            type: 'object',
            properties: {
              search: { type: 'string', description: 'Suchbegriff für Name oder E-Mail' }
            }
          }
        },
        {
          name: 'update_customer',
          description: 'Aktualisiert einen bestehenden Kunden',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Kunden-ID' },
              firstName: { type: 'string', description: 'Vorname' },
              lastName: { type: 'string', description: 'Nachname' },
              email: { type: 'string', description: 'E-Mail-Adresse' },
              phone: { type: 'string', description: 'Telefonnummer' },
              address: { type: 'string', description: 'Adresse' },
              isProspect: { type: 'boolean', description: 'Ist Interessent' }
            },
            required: ['id']
          }
        },
        {
          name: 'create_offer',
          description: 'Erstellt ein neues Angebot für einen Kunden',
          inputSchema: {
            type: 'object',
            properties: {
              customerId: { type: 'string', description: 'Kunden-ID' },
              jobDescription: { type: 'string', description: 'Arbeitsbeschreibung' },
              measurements: { type: 'string', description: 'Maße' },
              materialsCost: { type: 'number', description: 'Materialkosten' },
              laborCost: { type: 'number', description: 'Arbeitskosten' },
              totalCost: { type: 'number', description: 'Gesamtkosten' }
            },
            required: ['customerId']
          }
        },
        {
          name: 'get_offers',
          description: 'Lädt alle Angebote oder Angebote für einen bestimmten Kunden',
          inputSchema: {
            type: 'object',
            properties: {
              customerId: { type: 'string', description: 'Kunden-ID' }
            }
          }
        }
      ]
    };
  });

  server.setRequestHandler('tools/call', async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'create_customer':
        try {
          const customer = await prisma.customers.create({
            data: {
              firstName: args.firstName,
              lastName: args.lastName,
              email: args.email || null,
              phone: args.phone || null,
              address: args.address || null,
              isProspect: args.isProspect ?? true
            }
          });

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                customer,
                message: `Kunde ${customer.firstName} ${customer.lastName} erfolgreich erstellt.`
              })
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Fehler beim Erstellen des Kunden',
                message: error.message
              })
            }]
          };
        }

      case 'get_customers':
        try {
          const where = args.search ? {
            OR: [
              { firstName: { contains: args.search, mode: 'insensitive' as const } },
              { lastName: { contains: args.search, mode: 'insensitive' as const } },
              { email: { contains: args.search, mode: 'insensitive' as const } }
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
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                customers,
                count: customers.length,
                message: `${customers.length} Kunden/Interessenten geladen.`
              })
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Fehler beim Laden der Kunden',
                message: error.message
              })
            }]
          };
        }

      case 'update_customer':
        try {
          const { id, ...data } = args;
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
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                customer,
                message: `Kunde ${customer.firstName} ${customer.lastName} erfolgreich aktualisiert.`
              })
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Fehler beim Aktualisieren des Kunden',
                message: error.message
              })
            }]
          };
        }

      case 'create_offer':
        try {
          const offer = await prisma.offers.create({
            data: {
              customerId: args.customerId,
              jobDescription: args.jobDescription || null,
              measurements: args.measurements || null,
              materialsCost: args.materialsCost || 0,
              laborCost: args.laborCost || 0,
              totalCost: args.totalCost || 0,
              status: 'draft'
            },
            include: {
              customer: {
                select: { firstName: true, lastName: true }
              }
            }
          });

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                offer,
                message: `Angebot für ${offer.customer.firstName} ${offer.customer.lastName} erfolgreich erstellt.`
              })
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Fehler beim Erstellen des Angebots',
                message: error.message
              })
            }]
          };
        }

      case 'get_offers':
        try {
          const where = args.customerId ? { customerId: args.customerId } : {};
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
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                offers,
                count: offers.length,
                message: `${offers.length} Angebote geladen.`
              })
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Fehler beim Laden der Angebote',
                message: error.message
              })
            }]
          };
        }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });
});

export const { GET, POST } = handler;