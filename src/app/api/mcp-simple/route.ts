import { NextRequest } from 'next/server';

// Try to import prisma, but handle if it fails in production
let prisma: any;
try {
  prisma = require('@/lib/prisma').prisma;
} catch (error) {
  console.error('Prisma import failed:', error);
  prisma = null;
}

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('MCP Simple request:', body);

    if (body.method === 'tools/call' && body.params) {
      const { name, arguments: args } = body.params;

      switch (name) {
        case 'create_customer':
          return await createCustomer(args);
        case 'get_customers':
          return await getCustomers(args);
        case 'update_customer':
          return await updateCustomer(args);
        case 'create_offer':
          return await createOffer(args);
        case 'get_offers':
          return await getOffers(args);
        default:
          return Response.json({
            error: { code: -32601, message: `Unknown tool: ${name}` }
          }, { status: 400 });
      }
    }

    return Response.json({
      error: { code: -32600, message: 'Invalid request' }
    }, { status: 400 });

  } catch (error) {
    console.error('MCP Simple error:', error);
    return Response.json({
      error: { code: -32603, message: 'Internal error' }
    }, { status: 500 });
  }
}

async function createCustomer(args: any) {
  try {
    // If no prisma (production without DB), return mock response
    if (!prisma) {
      const mockCustomer = {
        id: `mock-new-${Date.now()}`,
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email || null,
        phone: args.phone || null,
        address: args.address || null,
        isProspect: args.isProspect ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return Response.json({
        result: {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              customer: mockCustomer,
              message: `Kunde ${mockCustomer.firstName} ${mockCustomer.lastName} erfolgreich erstellt (Demo-Modus).`
            })
          }]
        }
      });
    }

    const customer = await prisma.customer.create({
      data: {
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email || null,
        phone: args.phone || null,
        address: args.address || null,
        isProspect: args.isProspect ?? true
      }
    });

    return Response.json({
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            customer,
            message: `Kunde ${customer.firstName} ${customer.lastName} erfolgreich erstellt.`
          })
        }]
      }
    });
  } catch (error: any) {
    return Response.json({
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Fehler beim Erstellen des Kunden',
            message: error.message
          })
        }]
      }
    });
  }
}

async function getCustomers(args: any) {
  try {
    // If no prisma (production without DB), return mock data
    if (!prisma) {
      const mockCustomers = [
        {
          id: "mock-1",
          firstName: "Max",
          lastName: "Mustermann",
          email: "max@example.com",
          phone: "0123456789",
          address: "Musterstraße 1, 12345 Berlin",
          isProspect: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _count: { offers: 0, invoices: 0, appointments: 0 }
        },
        {
          id: "mock-2",
          firstName: "Maria",
          lastName: "Schmidt",
          email: "maria@example.com",
          phone: "0987654321",
          address: "Beispielweg 2, 54321 Hamburg",
          isProspect: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _count: { offers: 1, invoices: 1, appointments: 2 }
        }
      ];

      const filteredCustomers = args.search
        ? mockCustomers.filter(c =>
            c.firstName.toLowerCase().includes(args.search.toLowerCase()) ||
            c.lastName.toLowerCase().includes(args.search.toLowerCase()) ||
            c.email.toLowerCase().includes(args.search.toLowerCase())
          )
        : mockCustomers;

      return Response.json({
        result: {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              customers: filteredCustomers,
              count: filteredCustomers.length,
              message: `${filteredCustomers.length} Kunden/Interessenten geladen (Demo-Daten).`
            })
          }]
        }
      });
    }

    const where = args.search ? {
      OR: [
        { firstName: { contains: args.search, mode: 'insensitive' as const } },
        { lastName: { contains: args.search, mode: 'insensitive' as const } },
        { email: { contains: args.search, mode: 'insensitive' as const } }
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

    return Response.json({
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            customers,
            count: customers.length,
            message: `${customers.length} Kunden/Interessenten geladen.`
          })
        }]
      }
    });
  } catch (error: any) {
    return Response.json({
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Fehler beim Laden der Kunden',
            message: error.message
          })
        }]
      }
    });
  }
}

async function updateCustomer(args: any) {
  try {
    const { id, ...data } = args;
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

    return Response.json({
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            customer,
            message: `Kunde ${customer.firstName} ${customer.lastName} erfolgreich aktualisiert.`
          })
        }]
      }
    });
  } catch (error: any) {
    return Response.json({
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Fehler beim Aktualisieren des Kunden',
            message: error.message
          })
        }]
      }
    });
  }
}

async function createOffer(args: any) {
  try {
    const offerCount = await prisma.offer.count();
    const offerNumber = `ANG-${new Date().getFullYear()}-${String(offerCount + 1).padStart(4, '0')}`;

    const offer = await prisma.offer.create({
      data: {
        customerId: args.customerId,
        offerNumber,
        jobDescription: args.jobDescription || null,
        measurements: args.measurements || null,
        materialsCost: args.materialsCost || 0,
        laborCost: args.laborCost || 0,
        totalCost: args.totalCost || 0,
        status: 'DRAFT'
      },
      include: {
        customer: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    return Response.json({
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            offer,
            message: `Angebot für ${offer.customer.firstName} ${offer.customer.lastName} erfolgreich erstellt.`
          })
        }]
      }
    });
  } catch (error: any) {
    return Response.json({
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Fehler beim Erstellen des Angebots',
            message: error.message
          })
        }]
      }
    });
  }
}

async function getOffers(args: any) {
  try {
    const where = args.customerId ? { customerId: args.customerId } : {};
    const offers = await prisma.offer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    return Response.json({
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            offers,
            count: offers.length,
            message: `${offers.length} Angebote geladen.`
          })
        }]
      }
    });
  } catch (error: any) {
    return Response.json({
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Fehler beim Laden der Angebote',
            message: error.message
          })
        }]
      }
    });
  }
}