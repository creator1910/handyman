import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// GET /api/offers/[id]/pdf
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
        { error: 'Offer not found' },
        { status: 404 }
      )
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Header
    page.drawText('ANGEBOT', {
      x: 50,
      y: 800,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    // Offer details
    const startY = 750
    let currentY = startY

    // Offer number and date
    page.drawText(`Angebotsnummer: ${offer.offerNumber}`, {
      x: 50,
      y: currentY,
      size: 12,
      font: boldFont,
    })
    currentY -= 20

    page.drawText(`Datum: ${new Date(offer.createdAt).toLocaleDateString('de-DE')}`, {
      x: 50,
      y: currentY,
      size: 12,
      font,
    })
    currentY -= 40

    // Customer details
    page.drawText('KUNDE:', {
      x: 50,
      y: currentY,
      size: 14,
      font: boldFont,
    })
    currentY -= 20

    page.drawText(`${offer.customer.firstName} ${offer.customer.lastName}`, {
      x: 50,
      y: currentY,
      size: 12,
      font,
    })
    currentY -= 15

    if (offer.customer.address) {
      page.drawText(offer.customer.address, {
        x: 50,
        y: currentY,
        size: 12,
        font,
      })
      currentY -= 15
    }

    if (offer.customer.email) {
      page.drawText(`E-Mail: ${offer.customer.email}`, {
        x: 50,
        y: currentY,
        size: 12,
        font,
      })
      currentY -= 15
    }

    if (offer.customer.phone) {
      page.drawText(`Telefon: ${offer.customer.phone}`, {
        x: 50,
        y: currentY,
        size: 12,
        font,
      })
      currentY -= 15
    }

    currentY -= 30

    // Job description
    if (offer.jobDescription) {
      page.drawText('LEISTUNGSBESCHREIBUNG:', {
        x: 50,
        y: currentY,
        size: 14,
        font: boldFont,
      })
      currentY -= 20

      page.drawText(offer.jobDescription, {
        x: 50,
        y: currentY,
        size: 12,
        font,
      })
      currentY -= 40
    }

    // Cost breakdown
    page.drawText('KOSTENAUFSTELLUNG:', {
      x: 50,
      y: currentY,
      size: 14,
      font: boldFont,
    })
    currentY -= 30

    // Materials
    page.drawText('Materialkosten:', {
      x: 50,
      y: currentY,
      size: 12,
      font,
    })
    page.drawText(`${offer.materialsCost.toFixed(2)} €`, {
      x: 450,
      y: currentY,
      size: 12,
      font,
    })
    currentY -= 20

    // Labor
    page.drawText('Arbeitskosten:', {
      x: 50,
      y: currentY,
      size: 12,
      font,
    })
    page.drawText(`${offer.laborCost.toFixed(2)} €`, {
      x: 450,
      y: currentY,
      size: 12,
      font,
    })
    currentY -= 20

    // Line
    page.drawLine({
      start: { x: 50, y: currentY - 5 },
      end: { x: 500, y: currentY - 5 },
      thickness: 1,
      color: rgb(0, 0, 0),
    })
    currentY -= 20

    // Total
    page.drawText('Gesamtbetrag:', {
      x: 50,
      y: currentY,
      size: 14,
      font: boldFont,
    })
    page.drawText(`${offer.totalCost.toFixed(2)} €`, {
      x: 450,
      y: currentY,
      size: 14,
      font: boldFont,
    })

    // Footer
    page.drawText('Vielen Dank für Ihr Vertrauen!', {
      x: 50,
      y: 100,
      size: 12,
      font,
    })

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save()

    // Return PDF
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Angebot_${offer.offerNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}