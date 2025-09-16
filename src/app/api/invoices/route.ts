import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/invoices
export async function GET() {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers!customerId (*),
        offer:offers!offerId (*)
      `)
      .order('createdAt', { ascending: false })

    if (error) throw error

    return NextResponse.json(invoices || [])
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

// POST /api/invoices
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { offerId } = body

    // Get the accepted offer
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select(`
        *,
        customer:customers!customerId (*)
      `)
      .eq('id', offerId)
      .single()

    if (offerError || !offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      )
    }

    if (offer.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Only accepted offers can be converted to invoices' },
        { status: 400 }
      )
    }

    // Check if invoice already exists for this offer
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('offerId', offerId)
      .single()

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice already exists for this offer' },
        { status: 400 }
      )
    }

    // Generate invoice number
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })

    const invoiceNumber = `RG-${String((count || 0) + 1).padStart(4, '0')}`

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        invoiceNumber,
        customerId: offer.customerId,
        offerId: offer.id,
        totalAmount: offer.totalCost,
        status: 'DRAFT'
      })
      .select(`
        *,
        customer:customers!customerId (*),
        offer:offers!offerId (*)
      `)
      .single()

    if (error) throw error

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}