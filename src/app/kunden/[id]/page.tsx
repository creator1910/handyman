'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { Tabs } from '@/components/ui/Tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

interface Customer {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  address?: string
  isProspect: boolean
  createdAt: string
  updatedAt: string
  offers: Offer[]
  invoices: Invoice[]
  appointments: Appointment[]
}

interface Offer {
  id: string
  offerNumber: string
  jobDescription?: string
  materialsCost: number
  laborCost: number
  totalCost: number
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED'
  createdAt: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  totalAmount: number
  status: 'DRAFT' | 'SENT' | 'PAID'
  createdAt: string
  offer: Offer
}

interface Appointment {
  id: string
  date: string
  notes?: string
  photos?: string
  createdAt: string
}

interface CustomerProfilePageProps {
  params: Promise<{ id: string }>
}

export default function CustomerProfilePage({ params }: CustomerProfilePageProps) {
  const router = useRouter()
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    isProspect: true
  })

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setCustomerId(resolvedParams.id)
      fetchCustomer(resolvedParams.id)
    }
    loadParams()
  }, [params])

  const fetchCustomer = async (id: string) => {
    try {
      const response = await fetch(`/api/customers/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/kunden')
          return
        }
        throw new Error('Failed to fetch customer')
      }
      const data = await response.json()
      setCustomer(data)
      setEditForm({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        isProspect: data.isProspect
      })
    } catch (error) {
      console.error('Error fetching customer:', error)
      router.push('/kunden')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!customerId) return

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        await fetchCustomer(customerId)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error updating customer:', error)
    }
  }

  const toggleCustomerStatus = async () => {
    if (!customer || !customerId) return

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...customer,
          isProspect: !customer.isProspect
        }),
      })

      if (response.ok) {
        await fetchCustomer(customerId)
      }
    } catch (error) {
      console.error('Error updating customer status:', error)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse space-y-4 w-full max-w-md">
            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            <div className="h-4 bg-gray-100 rounded w-2/3"></div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!customer) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <svg className="w-16 h-16 mb-4 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="text-lg font-medium text-gray-900 mb-2">Kunde nicht gefunden</div>
            <Button onClick={() => router.push('/kunden')}>
              Zurück zur Übersicht
            </Button>
          </div>
        </div>
      </AppShell>
    )
  }

  const tabs = [
    {
      id: 'overview',
      label: 'Übersicht',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      content: (
        <div className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Kontaktinformationen</CardTitle>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="tertiary" size="sm" onClick={() => setIsEditing(false)}>
                        Abbrechen
                      </Button>
                      <Button size="sm" onClick={handleSave}>
                        Speichern
                      </Button>
                    </>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Bearbeiten
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Vorname"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                  <Input
                    label="Nachname"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                  <Input
                    label="E-Mail"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <Input
                    label="Telefon"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                  <div className="md:col-span-2">
                    <Textarea
                      label="Adresse"
                      value={editForm.address}
                      onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="text-[15px]">{customer.firstName} {customer.lastName}</p>
                  </div>

                  {customer.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                      <p className="text-[15px]">{customer.email}</p>
                    </div>
                  )}

                  {customer.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                      <p className="text-[15px]">{customer.phone}</p>
                    </div>
                  )}

                  {customer.address && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                      <p className="text-[15px] whitespace-pre-line">{customer.address}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Erstellt am</label>
                    <p className="text-[15px]">{new Date(customer.createdAt).toLocaleString('de-DE')}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="flex items-center gap-2">
                      <Badge variant={customer.isProspect ? 'prospect' : 'customer'}>
                        {customer.isProspect ? 'Interessent' : 'Kunde'}
                      </Badge>
                      <Button
                        variant="tertiary"
                        size="sm"
                        onClick={toggleCustomerStatus}
                      >
                        → {customer.isProspect ? 'Zu Kunde machen' : 'Zu Interessent machen'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-500">{customer.offers.length}</div>
                <div className="text-sm text-gray-500">Angebote</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-500">{customer.invoices.length}</div>
                <div className="text-sm text-gray-500">Rechnungen</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-500">{customer.appointments.length}</div>
                <div className="text-sm text-gray-500">Termine</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'offers',
      label: 'Angebote',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      content: (
        <OffersTab customer={customer} onRefresh={() => customerId && fetchCustomer(customerId)} />
      )
    },
    {
      id: 'invoices',
      label: 'Rechnungen',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      content: (
        <InvoicesTab customer={customer} onRefresh={() => customerId && fetchCustomer(customerId)} />
      )
    },
    {
      id: 'appointments',
      label: 'Termine',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      content: (
        <AppointmentsTab customer={customer} onRefresh={() => customerId && fetchCustomer(customerId)} />
      )
    }
  ]

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white">
          <div className="px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => router.push('/kunden')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Zurück
              </Button>

              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                <span className="text-lg font-medium text-orange-600">
                  {customer.firstName[0]}{customer.lastName[0]}
                </span>
              </div>

              <div>
                <h1 className="text-xl font-medium text-gray-900">
                  {customer.firstName} {customer.lastName}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={customer.isProspect ? 'prospect' : 'customer'}>
                    {customer.isProspect ? 'Interessent' : 'Kunde'}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Kunde seit {new Date(customer.createdAt).toLocaleDateString('de-DE')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex-1 overflow-hidden">
          <Tabs tabs={tabs} defaultTab="overview" />
        </div>
      </div>
    </AppShell>
  )
}

function OffersTab({ customer, onRefresh }: { customer: Customer, onRefresh: () => void }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    jobDescription: '',
    measurements: '',
    materialsCost: '',
    laborCost: '',
    totalCost: ''
  })

  useEffect(() => {
    const materials = parseFloat(formData.materialsCost) || 0
    const labor = parseFloat(formData.laborCost) || 0
    const total = materials + labor
    if (total !== parseFloat(formData.totalCost) || 0) {
      setFormData(prev => ({ ...prev, totalCost: total.toString() }))
    }
  }, [formData.materialsCost, formData.laborCost])

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          customerId: customer.id
        }),
      })

      if (response.ok) {
        onRefresh()
        setShowCreateModal(false)
        setFormData({
          jobDescription: '',
          measurements: '',
          materialsCost: '',
          laborCost: '',
          totalCost: ''
        })
      }
    } catch (error) {
      console.error('Error creating offer:', error)
    }
  }

  const updateOfferStatus = async (offerId: string, newStatus: string) => {
    try {
      const offer = customer.offers.find(o => o.id === offerId)
      if (!offer) return

      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...offer,
          status: newStatus
        }),
      })

      if (response.ok) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error updating offer:', error)
    }
  }

  const downloadPDF = async (offerId: string, offerNumber: string) => {
    try {
      const response = await fetch(`/api/offers/${offerId}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Angebot_${offerNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'draft'
      case 'SENT': return 'sent'
      case 'ACCEPTED': return 'accepted'
      case 'DECLINED': return 'declined'
      default: return 'draft'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Entwurf'
      case 'SENT': return 'Versendet'
      case 'ACCEPTED': return 'Angenommen'
      case 'DECLINED': return 'Abgelehnt'
      default: return status
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Angebote für {customer.firstName} {customer.lastName}</h2>
            <p className="text-sm text-gray-500 mt-1">{customer.offers.length} Angebote insgesamt</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Neues Angebot
          </Button>
        </div>
      </div>

      {/* Offers list */}
      <div className="flex-1 overflow-auto">
        {customer.offers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-lg font-medium">Keine Angebote vorhanden</div>
            <div className="text-sm">Erstellen Sie das erste Angebot für {customer.firstName}</div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {customer.offers.map((offer) => (
              <Card key={offer.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {offer.offerNumber}
                        </h3>
                        <Badge variant={getStatusColor(offer.status)}>
                          {getStatusText(offer.status)}
                        </Badge>
                      </div>

                      {offer.jobDescription && (
                        <p className="text-[15px] text-gray-600 mb-3">
                          {offer.jobDescription}
                        </p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          {offer.totalCost.toFixed(2)} €
                        </span>
                        <span>
                          Erstellt: {new Date(offer.createdAt).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => downloadPDF(offer.id, offer.offerNumber)}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PDF
                      </Button>

                      {offer.status === 'DRAFT' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => updateOfferStatus(offer.id, 'SENT')}
                        >
                          Versenden
                        </Button>
                      )}

                      {offer.status === 'SENT' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => updateOfferStatus(offer.id, 'ACCEPTED')}
                          >
                            Annehmen
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => updateOfferStatus(offer.id, 'DECLINED')}
                          >
                            Ablehnen
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Neues Angebot für {customer.firstName} {customer.lastName}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOffer} className="space-y-4">
                <Textarea
                  label="Leistungsbeschreibung"
                  value={formData.jobDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                  rows={3}
                  placeholder="Beschreiben Sie die zu erbringende Leistung..."
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    step="0.01"
                    label="Materialkosten (€)"
                    value={formData.materialsCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, materialsCost: e.target.value }))}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    label="Arbeitskosten (€)"
                    value={formData.laborCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, laborCost: e.target.value }))}
                  />
                </div>

                <Input
                  type="number"
                  step="0.01"
                  label="Gesamtbetrag (€)"
                  value={formData.totalCost}
                  readOnly
                  className="bg-gray-100"
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="tertiary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit">
                    Angebot erstellen
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function InvoicesTab({ customer, onRefresh }: { customer: Customer, onRefresh: () => void }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedOfferId, setSelectedOfferId] = useState('')

  // Get accepted offers that don't have invoices yet
  const acceptedOffersWithoutInvoice = customer.offers.filter(offer =>
    offer.status === 'ACCEPTED' &&
    !customer.invoices.some(invoice => invoice.offer?.id === offer.id)
  )

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOfferId) return

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offerId: selectedOfferId }),
      })

      if (response.ok) {
        onRefresh()
        setShowCreateModal(false)
        setSelectedOfferId('')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
    }
  }

  const updateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
    }
  }

  const downloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Rechnung_${invoiceNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'draft'
      case 'SENT': return 'sent'
      case 'PAID': return 'paid'
      default: return 'draft'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Entwurf'
      case 'SENT': return 'Versendet'
      case 'PAID': return 'Bezahlt'
      default: return status
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Rechnungen für {customer.firstName} {customer.lastName}</h2>
            <p className="text-sm text-gray-500 mt-1">{customer.invoices.length} Rechnungen insgesamt</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={acceptedOffersWithoutInvoice.length === 0}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Neue Rechnung
          </Button>
        </div>

        {acceptedOffersWithoutInvoice.length === 0 && customer.offers.some(o => o.status === 'ACCEPTED') && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Alle angenommenen Angebote haben bereits Rechnungen.
            </p>
          </div>
        )}

        {!customer.offers.some(o => o.status === 'ACCEPTED') && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Erstellen Sie erst ein Angebot und lassen Sie es annehmen, bevor Sie eine Rechnung erstellen können.
            </p>
          </div>
        )}
      </div>

      {/* Invoices list */}
      <div className="flex-1 overflow-auto">
        {customer.invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-lg font-medium">Keine Rechnungen vorhanden</div>
            <div className="text-sm">Erstellen Sie die erste Rechnung aus einem angenommenen Angebot</div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {customer.invoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </h3>
                        <Badge variant={getStatusColor(invoice.status)}>
                          {getStatusText(invoice.status)}
                        </Badge>
                      </div>

                      {invoice.offer && (
                        <p className="text-[15px] text-gray-600 mb-1">
                          Angebot: {invoice.offer.offerNumber}
                        </p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          {invoice.totalAmount.toFixed(2)} €
                        </span>
                        <span>
                          Erstellt: {new Date(invoice.createdAt).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => downloadPDF(invoice.id, invoice.invoiceNumber)}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PDF
                      </Button>

                      {invoice.status === 'DRAFT' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => updateInvoiceStatus(invoice.id, 'SENT')}
                        >
                          Versenden
                        </Button>
                      )}

                      {invoice.status === 'SENT' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => updateInvoiceStatus(invoice.id, 'PAID')}
                        >
                          Als bezahlt markieren
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Neue Rechnung für {customer.firstName} {customer.lastName}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Angenommenes Angebot
                  </label>
                  <select
                    value={selectedOfferId}
                    onChange={(e) => setSelectedOfferId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    required
                  >
                    <option value="">Angebot auswählen</option>
                    {acceptedOffersWithoutInvoice.map(offer => (
                      <option key={offer.id} value={offer.id}>
                        {offer.offerNumber} ({offer.totalCost.toFixed(2)} €)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="tertiary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit">
                    Rechnung erstellen
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function AppointmentsTab({ customer, onRefresh }: { customer: Customer, onRefresh: () => void }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    notes: '',
    photos: ''
  })

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          customerId: customer.id
        }),
      })

      if (response.ok) {
        onRefresh()
        setShowCreateModal(false)
        setFormData({
          date: '',
          notes: '',
          photos: ''
        })
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Termine für {customer.firstName} {customer.lastName}</h2>
            <p className="text-sm text-gray-500 mt-1">{customer.appointments.length} Termine insgesamt</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Neuer Termin
          </Button>
        </div>
      </div>

      {/* Appointments list */}
      <div className="flex-1 overflow-auto">
        {customer.appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="text-lg font-medium">Keine Termine vorhanden</div>
            <div className="text-sm">Erstellen Sie den ersten Termin für {customer.firstName}</div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {customer.appointments
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <h3 className="text-lg font-medium text-gray-900">
                            {new Date(appointment.date).toLocaleDateString('de-DE', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </h3>
                        </div>

                        {appointment.notes && (
                          <p className="text-[15px] text-gray-600 mb-3 whitespace-pre-line">
                            {appointment.notes}
                          </p>
                        )}

                        <div className="text-sm text-gray-500">
                          Erfasst: {new Date(appointment.createdAt).toLocaleDateString('de-DE')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {appointment.photos && (
                          <Badge variant="default" size="sm">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Fotos
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Neuer Termin für {customer.firstName} {customer.lastName}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAppointment} className="space-y-4">
                <Input
                  type="datetime-local"
                  label="Datum und Uhrzeit"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />

                <Textarea
                  label="Notizen zum Termin"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  placeholder="Termin details, vereinbarte Arbeiten, besondere Hinweise..."
                />

                <Input
                  type="text"
                  label="Fotos (optional)"
                  value={formData.photos}
                  onChange={(e) => setFormData(prev => ({ ...prev, photos: e.target.value }))}
                  placeholder="Foto-Links oder Beschreibung der Fotos"
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="tertiary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit">
                    Termin erstellen
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}