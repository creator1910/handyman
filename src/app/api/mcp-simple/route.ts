import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email || null,
        phone: args.phone || null,
        address: args.address || null,
        isProspect: args.isProspect ?? true
      })
      .select()
      .single();

    if (error) throw error;

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
    let query = supabase
      .from('customers')
      .select('*, offers(count), invoices(count), appointments(count)')
      .order('createdAt', { ascending: false });

    if (args.search) {
      query = query.or(
        `firstName.ilike.%${args.search}%,lastName.ilike.%${args.search}%,email.ilike.%${args.search}%`
      );
    }

    const { data: customers, error } = await query;

    if (error) throw error;

    return Response.json({
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            customers: customers || [],
            count: customers?.length || 0,
            message: `${customers?.length || 0} Kunden/Interessenten geladen.`
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
    const { count } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true });

    const offerNumber = `ANG-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`;

    const { data: offer, error } = await supabase
      .from('offers')
      .insert({
        customerId: args.customerId,
        offerNumber,
        jobDescription: args.jobDescription || null,
        measurements: args.measurements || null,
        materialsCost: args.materialsCost || 0,
        laborCost: args.laborCost || 0,
        totalCost: args.totalCost || 0,
        status: 'DRAFT'
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

    if (args.customerId) {
      query = query.eq('customerId', args.customerId);
    }

    const { data: offers, error } = await query;

    if (error) throw error;

    return Response.json({
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            offers: offers || [],
            count: offers?.length || 0,
            message: `${offers?.length || 0} Angebote geladen.`
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