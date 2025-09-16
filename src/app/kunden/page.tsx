'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { SearchInput } from '@/components/ui/SearchInput'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { CreateCustomerForm } from '@/components/CreateCustomerForm'
import { cn } from '@/lib/utils'

interface Customer {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  address?: string
  isProspect: boolean
  createdAt: string
  offers: any[]
  invoices: any[]
  appointments: any[]
}

export default function CustomersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'prospects' | 'customers'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  // Focus search input if coming from chat
  useEffect(() => {
    if (searchParams.get('focus') === 'search' && searchInputRef.current) {
      // Small delay to ensure component is mounted
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [searchParams])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer => {
    // Apply status filter
    let statusMatch = true
    if (filter === 'prospects') statusMatch = customer.isProspect
    if (filter === 'customers') statusMatch = !customer.isProspect
    
    // Apply search filter
    let searchMatch = true
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      searchMatch = (
        customer.firstName.toLowerCase().includes(query) ||
        customer.lastName.toLowerCase().includes(query) ||
        (customer.email?.toLowerCase().includes(query) ?? false) ||
        (customer.phone?.toLowerCase().includes(query) ?? false)
      )
    }
    
    return statusMatch && searchMatch
  })

  const toggleCustomerStatus = async (customerId: string, currentStatus: boolean) => {
    try {
      const customer = customers.find(c => c.id === customerId)
      if (!customer) return

      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...customer,
          isProspect: !currentStatus
        }),
      })

      if (response.ok) {
        await fetchCustomers()
      }
    } catch (error) {
      console.error('Error updating customer:', error)
    }
  }

  const createCustomer = async (customerData: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    isProspect: boolean
  }) => {
    setIsCreating(true)

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      })

      if (response.ok) {
        await fetchCustomers()
        setShowCreateModal(false)
      } else {
        console.error('Failed to create customer')
      }
    } catch (error) {
      console.error('Error creating customer:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const getLastActivity = (customer: Customer) => {
    try {
      const dates = []
      
      // Safely add offer dates
      if (customer.offers && Array.isArray(customer.offers)) {
        dates.push(...customer.offers.filter(o => o && o.createdAt).map(o => new Date(o.createdAt)))
      }
      
      // Safely add invoice dates
      if (customer.invoices && Array.isArray(customer.invoices)) {
        dates.push(...customer.invoices.filter(i => i && i.createdAt).map(i => new Date(i.createdAt)))
      }
      
      // Safely add appointment dates
      if (customer.appointments && Array.isArray(customer.appointments)) {
        dates.push(...customer.appointments.filter(a => a && a.createdAt).map(a => new Date(a.createdAt)))
      }
      
      if (dates.length === 0) return new Date(customer.createdAt)
      
      return new Date(Math.max(...dates.map(d => d.getTime())))
    } catch (error) {
      console.error('Error calculating last activity:', error)
      return new Date(customer.createdAt)
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
        {/* Header with search */}
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-medium text-gray-900">Kunden</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredCustomers.length} {filteredCustomers.length === 1 ? 'Kontakt' : 'Kontakte'}
                </p>
              </div>
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Neuer Kunde
              </Button>
            </div>
            
            {/* Search */}
            <SearchInput
              ref={searchInputRef}
              placeholder="Kunden durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />

            {/* Filter pills */}
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'primary' : 'tertiary'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Alle <span className="ml-1 text-xs opacity-75">({customers?.length || 0})</span>
              </Button>
              <Button
                variant={filter === 'prospects' ? 'primary' : 'tertiary'}
                size="sm"
                onClick={() => setFilter('prospects')}
              >
                Interessenten <span className="ml-1 text-xs opacity-75">({customers?.filter(c => c?.isProspect).length || 0})</span>
              </Button>
              <Button
                variant={filter === 'customers' ? 'primary' : 'tertiary'}
                size="sm"
                onClick={() => setFilter('customers')}
              >
                Kunden <span className="ml-1 text-xs opacity-75">({customers?.filter(c => !c?.isProspect).length || 0})</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Customer list - ChatGPT conversation style */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 px-6">
              <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <div className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'Keine Ergebnisse gefunden' : 'Keine Kunden vorhanden'}
              </div>
              <div className="text-sm text-center">
                {searchQuery 
                  ? `Keine Kunden entsprechen "${searchQuery}"`
                  : 'Starten Sie einen Chat, um Ihren ersten Interessenten anzulegen'
                }
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => {
                const lastActivity = getLastActivity(customer)
                
                return (
                  <div
                    key={customer.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/kunden/${customer.id}`)}
                  >
                    {/* Avatar placeholder */}
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-orange-600">
                        {customer.firstName[0]}{customer.lastName[0]}
                      </span>
                    </div>
                    
                    {/* Customer info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[15px] font-medium text-gray-900 truncate">
                          {customer.firstName} {customer.lastName}
                        </h3>
                        <Badge 
                          variant={customer.isProspect ? 'prospect' : 'customer'}
                          size="sm"
                        >
                          {customer.isProspect ? 'Interessent' : 'Kunde'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-500 truncate">
                        {customer.email || customer.phone || 'Keine Kontaktdaten'}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>{customer.offers?.length || 0} Angebote</span>
                        <span>{customer.invoices?.length || 0} Rechnungen</span>
                        <span>
                          Letzte Aktivität: {lastActivity.toLocaleDateString('de-DE', { 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action indicator */}
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {/* Create Customer Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Neuen Kunden anlegen"
        size="md"
      >
        <CreateCustomerForm
          onSubmit={createCustomer}
          onCancel={() => setShowCreateModal(false)}
          isLoading={isCreating}
        />
      </Modal>
    </AppShell>
  )
}