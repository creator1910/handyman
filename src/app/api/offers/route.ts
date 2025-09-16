import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/offers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const offerNumber = searchParams.get('offerNumber')
    const customerName = searchParams.get('customerName')
    const status = searchParams.get('status')

    let query = supabase
      .from('offers')
      .select(`
        *,
        customer:customers!customerId (*)
      `)

    // Filter by offer number if provided
    if (offerNumber) {
      query = query.eq('offerNumber', offerNumber)
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }

    const { data: offers, error } = await query.order('createdAt', { ascending: false })

    if (error) throw error

    let filteredOffers = offers || []

    // Filter by customer name if provided (client-side filtering)
    if (customerName && filteredOffers.length > 0) {
      filteredOffers = filteredOffers.filter((offer: any) =>
        `${offer.customer.firstName} ${offer.customer.lastName}`.toLowerCase()
          .includes(customerName.toLowerCase())
      )
    }

    return NextResponse.json(filteredOffers)
  } catch (error) {
    console.error('Error fetching offers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    )
  }
}

// POST /api/offers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      customerId, 
      jobDescription, 
      measurements, 
      materialsCost, 
      laborCost, 
      totalCost 
    } = body

    // Generate offer number
    const { count } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })

    const offerNumber = `ANB-${String((count || 0) + 1).padStart(4, '0')}`

    const { data: offer, error } = await supabase
      .from('offers')
      .insert({
        offerNumber,
        customerId,
        jobDescription: jobDescription || null,
        measurements: measurements || null,
        materialsCost: parseFloat(materialsCost) || 0,
        laborCost: parseFloat(laborCost) || 0,
        totalCost: parseFloat(totalCost) || 0,
        status: 'DRAFT'
      })
      .select(`
        *,
        customer:customers!customerId (*)
      `)
      .single()

    if (error) throw error

    return NextResponse.json(offer, { status: 201 })
  } catch (error) {
    console.error('Error creating offer:', error)
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    )
  }
}