'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { SearchInput } from '@/components/ui/SearchInput'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
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
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'prospects' | 'customers'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

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

  const getLastActivity = (customer: Customer) => {
    const dates = [
      ...customer.offers.map(o => new Date(o.createdAt)),
      ...customer.invoices.map(i => new Date(i.createdAt)),
      ...customer.appointments.map(a => new Date(a.createdAt))
    ]
    
    if (dates.length === 0) return new Date(customer.createdAt)
    
    return new Date(Math.max(...dates.map(d => d.getTime())))
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
        {/* Header with search */}
        <header className="sticky top-0 z-10 border-b border-border bg-white/95 backdrop-blur-sm">
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-medium text-gray-900">Kunden</h1>
                <p className="text-sm text-muted mt-1">
                  {filteredCustomers.length} {filteredCustomers.length === 1 ? 'Kontakt' : 'Kontakte'}
                </p>
              </div>
              <Button size="sm">
                <span className="mr-2">👤</span>
                Neuer Kunde
              </Button>
            </div>
            
            {/* Search */}
            <SearchInput
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
                Alle <span className="ml-1 text-xs opacity-75">({customers.length})</span>
              </Button>
              <Button
                variant={filter === 'prospects' ? 'primary' : 'tertiary'}
                size="sm"
                onClick={() => setFilter('prospects')}
              >
                Interessenten <span className="ml-1 text-xs opacity-75">({customers.filter(c => c.isProspect).length})</span>
              </Button>
              <Button
                variant={filter === 'customers' ? 'primary' : 'tertiary'}
                size="sm"
                onClick={() => setFilter('customers')}
              >
                Kunden <span className="ml-1 text-xs opacity-75">({customers.filter(c => !c.isProspect).length})</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Customer list - ChatGPT conversation style */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted px-6">
              <div className="text-4xl mb-4">🔍</div>
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
            <div className="divide-y divide-border">
              {filteredCustomers.map((customer) => {
                const lastActivity = getLastActivity(customer)
                const isSelected = selectedCustomer === customer.id
                
                return (
                  <div
                    key={customer.id}
                    className={cn(
                      'flex items-center gap-4 px-6 py-4 hover:bg-surface/50 cursor-pointer transition-colors',
                      isSelected && 'bg-primary/5 border-r-2 border-r-primary'
                    )}
                    onClick={() => setSelectedCustomer(customer.id)}
                  >
                    {/* Avatar placeholder */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-primary">
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
                      
                      <div className="text-sm text-muted truncate">
                        {customer.email || customer.phone || 'Keine Kontaktdaten'}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted mt-1">
                        <span>{customer.offers.length} Angebote</span>
                        <span>{customer.invoices.length} Rechnungen</span>
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
                      <div className="w-2 h-2 rounded-full bg-border"></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </AppShell>
  )
}