import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/offers
export async function GET() {
  try {
    const { data: offers, error } = await supabase
      .from('offers')
      .select(`
        *,
        customer:customers!customerId (*)
      `)
      .order('createdAt', { ascending: false })

    if (error) throw error

    return NextResponse.json(offers || [])
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