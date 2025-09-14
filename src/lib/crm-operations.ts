import { prisma } from './prisma'
import { z } from 'zod'

// Zod schemas for validation
export const createCustomerSchema = z.object({
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  email: z.string().email("Gültige E-Mail-Adresse erforderlich").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  isProspect: z.boolean().default(true)
})

export const createOfferSchema = z.object({
  customerId: z.string().cuid("Ungültige Kunden-ID"),
  jobDescription: z.string().optional(),
  measurements: z.string().optional(),
  materialsCost: z.number().min(0).default(0),
  laborCost: z.number().min(0).default(0),
  totalCost: z.number().min(0).default(0)
})

export const createInvoiceSchema = z.object({
  customerId: z.string().cuid("Ungültige Kunden-ID"),
  offerId: z.string().cuid("Ungültige Angebots-ID"),
  totalAmount: z.number().min(0, "Betrag muss positiv sein")
})

// CRM Operations
export async function createCustomer(data: z.infer<typeof createCustomerSchema>) {
  try {
    const validated = createCustomerSchema.parse(data)
    
    // Convert empty email to null for database
    const customer = await prisma.customer.create({
      data: {
        ...validated,
        email: validated.email || null
      }
    })
    
    return {
      success: true,
      customer,
      message: `${validated.isProspect ? 'Interessent' : 'Kunde'} "${validated.firstName} ${validated.lastName}" wurde erfolgreich erstellt.`
    }
  } catch (error) {
    console.error('Error creating customer:', error)
    return {
      success: false,
      error: error instanceof z.ZodError ? error.issues : 'Fehler beim Erstellen des Kunden',
      message: 'Es gab einen Fehler beim Erstellen des Kunden.'
    }
  }
}

export async function getCustomers(search?: string) {
  try {
    const customers = await prisma.customer.findMany({
      where: search ? {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } }
        ]
      } : undefined,
      include: {
        _count: {
          select: {
            offers: true,
            invoices: true,
            appointments: true
          }
        }
      },
      orderBy: [
        { updatedAt: 'desc' }
      ]
    })
    
    return {
      success: true,
      customers,
      message: `${customers.length} ${search ? 'gefundene ' : ''}Kunden/Interessenten geladen.`
    }
  } catch (error) {
    console.error('Error getting customers:', error)
    return {
      success: false,
      error: 'Fehler beim Laden der Kunden',
      message: 'Es gab einen Fehler beim Laden der Kundendaten.'
    }
  }
}

export async function updateCustomer(id: string, data: Partial<z.infer<typeof createCustomerSchema>>) {
  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        email: data.email || null
      }
    })
    
    return {
      success: true,
      customer,
      message: `Kunde "${customer.firstName} ${customer.lastName}" wurde aktualisiert.`
    }
  } catch (error) {
    console.error('Error updating customer:', error)
    return {
      success: false,
      error: 'Fehler beim Aktualisieren des Kunden',
      message: 'Es gab einen Fehler beim Aktualisieren der Kundendaten.'
    }
  }
}

export async function deleteCustomer(id: string) {
  try {
    const customer = await prisma.customer.delete({
      where: { id }
    })
    
    return {
      success: true,
      customer,
      message: `Kunde "${customer.firstName} ${customer.lastName}" wurde gelöscht.`
    }
  } catch (error) {
    console.error('Error deleting customer:', error)
    return {
      success: false,
      error: 'Fehler beim Löschen des Kunden',
      message: 'Es gab einen Fehler beim Löschen des Kunden.'
    }
  }
}

export async function createOffer(data: z.infer<typeof createOfferSchema>) {
  try {
    const validated = createOfferSchema.parse(data)
    
    // Generate offer number
    const offerCount = await prisma.offer.count()
    const offerNumber = `ANG-${new Date().getFullYear()}-${String(offerCount + 1).padStart(4, '0')}`
    
    const offer = await prisma.offer.create({
      data: {
        ...validated,
        offerNumber
      },
      include: {
        customer: true
      }
    })
    
    return {
      success: true,
      offer,
      message: `Angebot ${offerNumber} für ${offer.customer.firstName} ${offer.customer.lastName} wurde erstellt.`
    }
  } catch (error) {
    console.error('Error creating offer:', error)
    return {
      success: false,
      error: error instanceof z.ZodError ? error.issues : 'Fehler beim Erstellen des Angebots',
      message: 'Es gab einen Fehler beim Erstellen des Angebots.'
    }
  }
}

export async function createInvoice(data: z.infer<typeof createInvoiceSchema>) {
  try {
    const validated = createInvoiceSchema.parse(data)
    
    // Check if offer exists and doesn't already have an invoice
    const existingOffer = await prisma.offer.findUnique({
      where: { id: validated.offerId },
      include: { invoice: true, customer: true }
    })
    
    if (!existingOffer) {
      return {
        success: false,
        error: 'Angebot nicht gefunden',
        message: 'Das angegebene Angebot konnte nicht gefunden werden.'
      }
    }
    
    if (existingOffer.invoice) {
      return {
        success: false,
        error: 'Rechnung bereits vorhanden',
        message: 'Für dieses Angebot existiert bereits eine Rechnung.'
      }
    }
    
    // Generate invoice number
    const invoiceCount = await prisma.invoice.count()
    const invoiceNumber = `RE-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`
    
    const invoice = await prisma.invoice.create({
      data: {
        ...validated,
        invoiceNumber
      },
      include: {
        customer: true,
        offer: true
      }
    })
    
    return {
      success: true,
      invoice,
      message: `Rechnung ${invoiceNumber} für ${invoice.customer.firstName} ${invoice.customer.lastName} wurde erstellt.`
    }
  } catch (error) {
    console.error('Error creating invoice:', error)
    return {
      success: false,
      error: error instanceof z.ZodError ? error.issues : 'Fehler beim Erstellen der Rechnung',
      message: 'Es gab einen Fehler beim Erstellen der Rechnung.'
    }
  }
}

export async function getOffers(customerId?: string) {
  try {
    const offers = await prisma.offer.findMany({
      where: customerId ? { customerId } : undefined,
      include: {
        customer: true,
        invoice: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return {
      success: true,
      offers,
      message: `${offers.length} Angebote${customerId ? ' für diesen Kunden' : ''} geladen.`
    }
  } catch (error) {
    console.error('Error getting offers:', error)
    return {
      success: false,
      error: 'Fehler beim Laden der Angebote',
      message: 'Es gab einen Fehler beim Laden der Angebote.'
    }
  }
}

export async function getInvoices(customerId?: string) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: customerId ? { customerId } : undefined,
      include: {
        customer: true,
        offer: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return {
      success: true,
      invoices,
      message: `${invoices.length} Rechnungen${customerId ? ' für diesen Kunden' : ''} geladen.`
    }
  } catch (error) {
    console.error('Error getting invoices:', error)
    return {
      success: false,
      error: 'Fehler beim Laden der Rechnungen',
      message: 'Es gab einen Fehler beim Laden der Rechnungen.'
    }
  }
}