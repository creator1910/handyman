'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

interface Offer {
  id: string
  offerNumber: string
  customerId: string
  jobDescription?: string
  measurements?: string
  materialsCost: number
  laborCost: number
  totalCost: number
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED'
  createdAt: string
  customer: {
    firstName: string
    lastName: string
    email?: string
  }
}

interface Customer {
  id: string
  firstName: string
  lastName: string
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    customerId: '',
    jobDescription: '',
    measurements: '',
    materialsCost: '',
    laborCost: '',
    totalCost: ''
  })

  useEffect(() => {
    fetchOffers()
    fetchCustomers()
  }, [])

  useEffect(() => {
    // Calculate total cost when materials or labor costs change
    const materials = parseFloat(formData.materialsCost) || 0
    const labor = parseFloat(formData.laborCost) || 0
    const total = materials + labor
    if (total !== parseFloat(formData.totalCost) || 0) {
      setFormData(prev => ({ ...prev, totalCost: total.toString() }))
    }
  }, [formData.materialsCost, formData.laborCost])

  const fetchOffers = async () => {
    try {
      const response = await fetch('/api/offers')
      const data = await response.json()
      setOffers(data)
    } catch (error) {
      console.error('Error fetching offers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchOffers()
        setShowCreateModal(false)
        setFormData({
          customerId: '',
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
      const offer = offers.find(o => o.id === offerId)
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
        await fetchOffers()
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
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'SENT': return 'bg-blue-100 text-blue-800'
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'DECLINED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Angebote</h1>
              <p className="text-gray-600">Erstellen und verwalten Sie Ihre Angebote</p>
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
          {offers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-lg font-medium">Keine Angebote vorhanden</div>
              <div className="text-sm">Erstellen Sie Ihr erstes Angebot</div>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid gap-4">
                {offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {offer.offerNumber}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}
                          >
                            {getStatusText(offer.status)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mt-1">
                          Kunde: {offer.customer.firstName} {offer.customer.lastName}
                        </p>

                        {offer.jobDescription && (
                          <p className="text-sm text-gray-600 mt-1">
                            {offer.jobDescription}
                          </p>
                        )}

                        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            {offer.totalCost.toFixed(2)} €
                          </span>
                          <span>Erstellt: {new Date(offer.createdAt).toLocaleDateString('de-DE')}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4">Neues Angebot erstellen</h2>

              <form onSubmit={handleCreateOffer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kunde
                  </label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Kunde auswählen</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.firstName} {customer.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Leistungsbeschreibung
                  </label>
                  <textarea
                    value={formData.jobDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Materialkosten (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.materialsCost}
                      onChange={(e) => setFormData(prev => ({ ...prev, materialsCost: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Arbeitskosten (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.laborCost}
                      onChange={(e) => setFormData(prev => ({ ...prev, laborCost: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gesamtbetrag (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.totalCost}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-xl"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="submit"
                  >
                    Erstellen
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}