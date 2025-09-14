import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/appointments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, date, notes, photos } = body

    const appointment = await prisma.appointment.create({
      data: {
        customerId,
        date: new Date(date),
        notes,
        photos
      },
      include: {
        customer: true
      }
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}