import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateOfferPDF } from '@/lib/pdf-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch offer with customer details
    const { data: offer, error } = await supabase
      .from('offers')
      .select(`
        *,
        customer:customers!customerId (
          firstName,
          lastName,
          email,
          phone,
          address
        )
      `)
      .eq('id', id)
      .single()

    if (error || !offer) {
      return NextResponse.json(
        { error: 'Angebot nicht gefunden' },
        { status: 404 }
      )
    }

    // Generate PDF
    const pdfBytes = await generateOfferPDF({
      offerNumber: offer.offerNumber,
      customer: offer.customer,
      jobDescription: offer.jobDescription || '',
      measurements: offer.measurements,
      materialsCost: offer.materialsCost || 0,
      laborCost: offer.laborCost || 0,
      totalCost: offer.totalCost || 0,
      createdAt: offer.createdAt,
    })

    // Return PDF as response
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Angebot-${offer.offerNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Fehler beim Generieren der PDF' },
      { status: 500 }
    )
  }
}