import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// GET /api/invoices/[id]/pdf
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers!customerId (
          firstName,
          lastName,
          email,
          phone,
          address
        ),
        offer:offers!offerId (
          offerNumber,
          jobDescription,
          materialsCost,
          laborCost,
          totalCost
        )
      `)
      .eq('id', id)
      .single()

    if (error || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Header
    page.drawText('RECHNUNG', {
      x: 50,
      y: 800,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    // Invoice details
    const startY = 750
    let currentY = startY

    // Invoice number and date
    page.drawText(`Rechnungsnummer: ${invoice.invoiceNumber}`, {
      x: 50,
      y: currentY,
      size: 12,
      font: boldFont,
    })
    currentY -= 20

    page.drawText(`Datum: ${new Date(invoice.createdAt).toLocaleDateString('de-DE')}`, {
      x: 50,
      y: currentY,
      size: 12,
      font,
    })
    currentY -= 20

    page.drawText(`Angebotsnummer: ${invoice.offer.offerNumber}`, {
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

    page.drawText(`${invoice.customer.firstName} ${invoice.customer.lastName}`, {
      x: 50,
      y: currentY,
      size: 12,
      font,
    })
    currentY -= 15

    if (invoice.customer.address) {
      page.drawText(invoice.customer.address, {
        x: 50,
        y: currentY,
        size: 12,
        font,
      })
      currentY -= 15
    }

    if (invoice.customer.email) {
      page.drawText(`E-Mail: ${invoice.customer.email}`, {
        x: 50,
        y: currentY,
        size: 12,
        font,
      })
      currentY -= 15
    }

    if (invoice.customer.phone) {
      page.drawText(`Telefon: ${invoice.customer.phone}`, {
        x: 50,
        y: currentY,
        size: 12,
        font,
      })
      currentY -= 15
    }

    currentY -= 30

    // Job description
    if (invoice.offer.jobDescription) {
      page.drawText('LEISTUNGSBESCHREIBUNG:', {
        x: 50,
        y: currentY,
        size: 14,
        font: boldFont,
      })
      currentY -= 20

      page.drawText(invoice.offer.jobDescription, {
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
    page.drawText(`${invoice.offer.materialsCost.toFixed(2)} €`, {
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
    page.drawText(`${invoice.offer.laborCost.toFixed(2)} €`, {
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
    page.drawText('Rechnungsbetrag:', {
      x: 50,
      y: currentY,
      size: 14,
      font: boldFont,
    })
    page.drawText(`${invoice.totalAmount.toFixed(2)} €`, {
      x: 450,
      y: currentY,
      size: 14,
      font: boldFont,
    })

    currentY -= 40

    // Payment info
    page.drawText('Zahlbar binnen 14 Tagen nach Rechnungsdatum.', {
      x: 50,
      y: currentY,
      size: 12,
      font,
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
        'Content-Disposition': `attachment; filename="Rechnung_${invoice.invoiceNumber}.pdf"`,
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