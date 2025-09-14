import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/invoices
export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        customer: true,
        offer: true
      }
    })

    return NextResponse.json(invoices)
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
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { customer: true }
    })

    if (!offer) {
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
    const existingInvoice = await prisma.invoice.findUnique({
      where: { offerId }
    })

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice already exists for this offer' },
        { status: 400 }
      )
    }

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count()
    const invoiceNumber = `RG-${String(invoiceCount + 1).padStart(4, '0')}`

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: offer.customerId,
        offerId: offer.id,
        totalAmount: offer.totalCost
      },
      include: {
        customer: true,
        offer: true
      }
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}