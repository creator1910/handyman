import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/offers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: offer, error } = await supabase
      .from('offers')
      .select(`
        *,
        customer:customers!customerId (*)
      `)
      .eq('id', id)
      .single()

    if (error || !offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(offer)
  } catch (error) {
    console.error('Error fetching offer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offer' },
      { status: 500 }
    )
  }
}

// PUT /api/offers/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      jobDescription,
      measurements,
      materialsCost,
      laborCost,
      totalCost,
      status
    } = body

    const { data: offer, error } = await supabase
      .from('offers')
      .update({
        jobDescription: jobDescription || null,
        measurements: measurements || null,
        materialsCost: parseFloat(materialsCost) || 0,
        laborCost: parseFloat(laborCost) || 0,
        totalCost: parseFloat(totalCost) || 0,
        status
      })
      .eq('id', id)
      .select(`
        *,
        customer:customers!customerId (*)
      `)
      .single()

    if (error) throw error

    // 🎯 Auto-upgrade customer from "Interessent" to "Kunde" when offer is accepted
    if (status === 'ACCEPTED' && offer.customer.isProspect) {
      console.log(`🔄 Upgrading customer ${offer.customer.firstName} ${offer.customer.lastName} from Interessent to Kunde`)

      const { error: customerError } = await supabase
        .from('customers')
        .update({
          isProspect: false,
          updatedAt: new Date().toISOString()
        })
        .eq('id', offer.customerId)

      if (customerError) {
        console.error('Error upgrading customer status:', customerError)
        // Don't fail the offer update if customer update fails
      } else {
        console.log(`✅ Customer ${offer.customer.firstName} ${offer.customer.lastName} is now a Kunde!`)
        // Update the returned offer data to reflect the customer status change
        offer.customer.isProspect = false
      }
    }

    return NextResponse.json(offer)
  } catch (error) {
    console.error('Error updating offer:', error)
    return NextResponse.json(
      { error: 'Failed to update offer' },
      { status: 500 }
    )
  }
}