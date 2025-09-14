import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/offers
export async function GET() {
  try {
    const offers = await prisma.offer.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        customer: true
      }
    })

    return NextResponse.json(offers)
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
    const offerCount = await prisma.offer.count()
    const offerNumber = `ANB-${String(offerCount + 1).padStart(4, '0')}`

    const offer = await prisma.offer.create({
      data: {
        offerNumber,
        customerId,
        jobDescription,
        measurements,
        materialsCost: parseFloat(materialsCost) || 0,
        laborCost: parseFloat(laborCost) || 0,
        totalCost: parseFloat(totalCost) || 0
      },
      include: {
        customer: true
      }
    })

    return NextResponse.json(offer, { status: 201 })
  } catch (error) {
    console.error('Error creating offer:', error)
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    )
  }
}