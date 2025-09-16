import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// PUT /api/invoices/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    const { data: invoice, error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        customer:customers!customerId (*),
        offer:offers!offerId (*)
      `)
      .single()

    if (error) throw error

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}