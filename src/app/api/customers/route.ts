import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/customers
export async function GET() {
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select(`
        *,
        offers(*),
        invoices(*),
        appointments(*)
      `)
      .order('createdAt', { ascending: false })

    if (error) throw error

    return NextResponse.json(customers || [])
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// POST /api/customers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, address, isProspect } = body

    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        address: address || null,
        isProspect: isProspect ?? true
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}