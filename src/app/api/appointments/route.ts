import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/appointments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, date, notes, photos } = body

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        customerId,
        date: new Date(date).toISOString(),
        notes: notes || null,
        photos: photos || null
      })
      .select(`
        *,
        customer:customers!customerId (*)
      `)
      .single()

    if (error) throw error

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}