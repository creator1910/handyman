import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/offers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        customer: true
      }
    })

    if (!offer) {
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

    const offer = await prisma.offer.update({
      where: { id },
      data: {
        jobDescription,
        measurements,
        materialsCost: parseFloat(materialsCost) || 0,
        laborCost: parseFloat(laborCost) || 0,
        totalCost: parseFloat(totalCost) || 0,
        status
      },
      include: {
        customer: true
      }
    })

    return NextResponse.json(offer)
  } catch (error) {
    console.error('Error updating offer:', error)
    return NextResponse.json(
      { error: 'Failed to update offer' },
      { status: 500 }
    )
  }
}