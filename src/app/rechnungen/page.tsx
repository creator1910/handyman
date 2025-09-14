'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface Invoice {
  id: string
  invoiceNumber: string
  customerId: string
  offerId: string
  totalAmount: number
  status: 'DRAFT' | 'SENT' | 'PAID'
  createdAt: string
  customer: {
    firstName: string
    lastName: string
    email?: string
  }
  offer: {
    offerNumber: string
    jobDescription?: string
  }
}

interface AcceptedOffer {
  id: string
  offerNumber: string
  totalCost: number
  customer: {
    firstName: string
    lastName: string
  }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [acceptedOffers, setAcceptedOffers] = useState<AcceptedOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedOfferId, setSelectedOfferId] = useState('')

  useEffect(() => {
    fetchInvoices()
    fetchAcceptedOffers()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices')
      const data = await response.json()
      setInvoices(data)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAcceptedOffers = async () => {
    try {
      const response = await fetch('/api/offers')
      const data = await response.json()
      // Filter for accepted offers that don't have invoices yet
      const accepted = data.filter((offer: any) => 
        offer.status === 'ACCEPTED' && 
        !invoices.some(invoice => invoice.offerId === offer.id)
      )
      setAcceptedOffers(accepted)
    } catch (error) {
      console.error('Error fetching offers:', error)
    }
  }

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
        await fetchInvoices()
        await fetchAcceptedOffers()
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
        await fetchInvoices()
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
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'SENT': return 'bg-blue-100 text-blue-800'
      case 'PAID': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
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

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse space-y-4 w-full max-w-md">
            <div className="h-4 bg-surface rounded w-3/4"></div>
            <div className="h-4 bg-surface rounded w-1/2"></div>
            <div className="h-4 bg-surface rounded w-2/3"></div>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rechnungen</h1>
              <p className="text-gray-600">Erstellen und verwalten Sie Ihre Rechnungen</p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              disabled={acceptedOffers.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Neue Rechnung
            </button>
          </div>
          
          {acceptedOffers.length === 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Keine angenommenen Angebote verfügbar. Erstellen Sie erst ein Angebot und lassen Sie es annehmen.
              </p>
            </div>
          )}
        </div>

        {/* Invoices list */}
        <div className="flex-1 overflow-auto">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <div className="text-6xl mb-4">📄</div>
              <div className="text-lg font-medium">Keine Rechnungen vorhanden</div>
              <div className="text-sm">Erstellen Sie Ihre erste Rechnung aus einem angenommenen Angebot</div>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid gap-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {invoice.invoiceNumber}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}
                          >
                            {getStatusText(invoice.status)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          Kunde: {invoice.customer.firstName} {invoice.customer.lastName}
                        </p>

                        <p className="text-sm text-gray-600 mt-1">
                          Angebot: {invoice.offer.offerNumber}
                        </p>

                        {invoice.offer.jobDescription && (
                          <p className="text-sm text-gray-600 mt-1">
                            {invoice.offer.jobDescription}
                          </p>
                        )}

                        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                          <span>💶 {invoice.totalAmount.toFixed(2)} €</span>
                          <span>Erstellt: {new Date(invoice.createdAt).toLocaleDateString('de-DE')}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => downloadPDF(invoice.id, invoice.invoiceNumber)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
                        >
                          📄 PDF
                        </button>
                        
                        {invoice.status === 'DRAFT' && (
                          <button
                            onClick={() => updateInvoiceStatus(invoice.id, 'SENT')}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium hover:bg-blue-200"
                          >
                            Versenden
                          </button>
                        )}
                        
                        {invoice.status === 'SENT' && (
                          <button
                            onClick={() => updateInvoiceStatus(invoice.id, 'PAID')}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm font-medium hover:bg-green-200"
                          >
                            Als bezahlt markieren
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4">Neue Rechnung erstellen</h2>
              
              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Angenommenes Angebot
                  </label>
                  <select
                    value={selectedOfferId}
                    onChange={(e) => setSelectedOfferId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Angebot auswählen</option>
                    {acceptedOffers.map(offer => (
                      <option key={offer.id} value={offer.id}>
                        {offer.offerNumber} - {offer.customer.firstName} {offer.customer.lastName} ({offer.totalCost.toFixed(2)} €)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Erstellen
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}