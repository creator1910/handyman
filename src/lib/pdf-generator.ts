import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface OfferData {
  offerNumber: string
  customer: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
    address?: string
  }
  jobDescription: string
  measurements?: string
  materialsCost: number
  laborCost: number
  totalCost: number
  createdAt: string
}

export async function generateOfferPDF(offerData: OfferData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const { width, height } = page.getSize()
  const margin = 60
  let yPosition = height - margin

  // Colors
  const primaryColor = rgb(1, 0.4, 0) // Orange color matching the UI
  const textColor = rgb(0.2, 0.2, 0.2)
  const lightGray = rgb(0.95, 0.95, 0.95)

  // Header
  page.drawText('craft.ai', {
    x: margin,
    y: yPosition,
    size: 24,
    font: boldFont,
    color: primaryColor,
  })

  page.drawText('Handwerker-Angebot', {
    x: width - margin - 150,
    y: yPosition,
    size: 16,
    font: boldFont,
    color: textColor,
  })

  yPosition -= 50

  // Offer number and date
  page.drawText(`Angebotsnummer: ${offerData.offerNumber}`, {
    x: margin,
    y: yPosition,
    size: 12,
    font: boldFont,
    color: textColor,
  })

  const date = new Date(offerData.createdAt).toLocaleDateString('de-DE')
  page.drawText(`Datum: ${date}`, {
    x: width - margin - 100,
    y: yPosition,
    size: 12,
    font: font,
    color: textColor,
  })

  yPosition -= 40

  // Customer information
  page.drawText('Kunde:', {
    x: margin,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: textColor,
  })

  yPosition -= 25

  const customerInfo = [
    `${offerData.customer.firstName} ${offerData.customer.lastName}`,
    offerData.customer.email,
    offerData.customer.phone,
    offerData.customer.address,
  ].filter(Boolean)

  customerInfo.forEach((info) => {
    page.drawText(info!, {
      x: margin,
      y: yPosition,
      size: 11,
      font: font,
      color: textColor,
    })
    yPosition -= 18
  })

  yPosition -= 20

  // Job description
  page.drawText('Leistungsbeschreibung:', {
    x: margin,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: textColor,
  })

  yPosition -= 25

  // Split long text into lines
  const maxLineWidth = width - 2 * margin
  const words = offerData.jobDescription.split(' ')
  let currentLine = ''

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const textWidth = font.widthOfTextAtSize(testLine, 11)

    if (textWidth <= maxLineWidth) {
      currentLine = testLine
    } else {
      if (currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y: yPosition,
          size: 11,
          font: font,
          color: textColor,
        })
        yPosition -= 18
      }
      currentLine = word
    }
  })

  if (currentLine) {
    page.drawText(currentLine, {
      x: margin,
      y: yPosition,
      size: 11,
      font: font,
      color: textColor,
    })
    yPosition -= 18
  }

  if (offerData.measurements) {
    yPosition -= 10
    page.drawText(`Maße/Fläche: ${offerData.measurements}`, {
      x: margin,
      y: yPosition,
      size: 11,
      font: font,
      color: textColor,
    })
    yPosition -= 18
  }

  yPosition -= 30

  // Cost breakdown
  page.drawText('Kostenaufstellung:', {
    x: margin,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: textColor,
  })

  yPosition -= 30

  // Table header background
  page.drawRectangle({
    x: margin,
    y: yPosition - 5,
    width: width - 2 * margin,
    height: 25,
    color: lightGray,
  })

  // Table headers
  page.drawText('Position', {
    x: margin + 10,
    y: yPosition + 5,
    size: 11,
    font: boldFont,
    color: textColor,
  })

  page.drawText('Betrag', {
    x: width - margin - 80,
    y: yPosition + 5,
    size: 11,
    font: boldFont,
    color: textColor,
  })

  yPosition -= 30

  // Materials cost
  page.drawText('Materialkosten', {
    x: margin + 10,
    y: yPosition,
    size: 11,
    font: font,
    color: textColor,
  })

  page.drawText(`${offerData.materialsCost.toFixed(2)} €`, {
    x: width - margin - 80,
    y: yPosition,
    size: 11,
    font: font,
    color: textColor,
  })

  yPosition -= 20

  // Labor cost
  page.drawText('Arbeitskosten', {
    x: margin + 10,
    y: yPosition,
    size: 11,
    font: font,
    color: textColor,
  })

  page.drawText(`${offerData.laborCost.toFixed(2)} €`, {
    x: width - margin - 80,
    y: yPosition,
    size: 11,
    font: font,
    color: textColor,
  })

  yPosition -= 30

  // Total line
  page.drawRectangle({
    x: margin,
    y: yPosition - 5,
    width: width - 2 * margin,
    height: 25,
    color: lightGray,
  })

  page.drawText('Gesamtsumme', {
    x: margin + 10,
    y: yPosition + 5,
    size: 12,
    font: boldFont,
    color: textColor,
  })

  page.drawText(`${offerData.totalCost.toFixed(2)} €`, {
    x: width - margin - 80,
    y: yPosition + 5,
    size: 12,
    font: boldFont,
    color: primaryColor,
  })

  yPosition -= 60

  // Footer
  page.drawText('Alle Preise inkl. gesetzlicher Mehrwertsteuer.', {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: textColor,
  })

  yPosition -= 20

  page.drawText('Dieses Angebot ist 30 Tage gültig.', {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: textColor,
  })

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}