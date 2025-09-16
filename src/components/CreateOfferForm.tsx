import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface CreateOfferFormProps {
  onSubmit: (offerData: {
    customerId: string
    customerName: string
    jobDescription: string
    measurements: string
    materialsCost: number
    laborCost: number
    totalCost: number
  }) => void
  onCancel: () => void
  isLoading?: boolean
  preselectedCustomer?: {
    id: string
    name: string
  }
}

interface Customer {
  id: string
  firstName: string
  lastName: string
  email?: string
}

export function CreateOfferForm({ onSubmit, onCancel, isLoading = false, preselectedCustomer }: CreateOfferFormProps) {
  const [formData, setFormData] = useState({
    customerId: preselectedCustomer?.id || '',
    customerName: preselectedCustomer?.name || '',
    jobDescription: '',
    measurements: '',
    materialsCost: 0,
    laborCost: 0,
    totalCost: 0
  })

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-calculate total cost
  useEffect(() => {
    const total = formData.materialsCost + formData.laborCost
    if (total !== formData.totalCost) {
      setFormData(prev => ({ ...prev, totalCost: total }))
    }
  }, [formData.materialsCost, formData.laborCost])

  // Load customers on component mount if no preselected customer
  useEffect(() => {
    if (!preselectedCustomer) {
      fetchCustomers()
    }
  }, [preselectedCustomer])

  const fetchCustomers = async () => {
    setLoadingCustomers(true)
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoadingCustomers(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerId) {
      newErrors.customerId = 'Kunde ist erforderlich'
    }

    if (!formData.jobDescription.trim()) {
      newErrors.jobDescription = 'Arbeitsbeschreibung ist erforderlich'
    }

    if (formData.materialsCost < 0) {
      newErrors.materialsCost = 'Materialkosten können nicht negativ sein'
    }

    if (formData.laborCost < 0) {
      newErrors.laborCost = 'Arbeitskosten können nicht negativ sein'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Update customer name when customer changes
    if (field === 'customerId') {
      const selectedCustomer = customers.find(c => c.id === value)
      if (selectedCustomer) {
        setFormData(prev => ({
          ...prev,
          customerId: value as string,
          customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
        }))
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer selection */}
      <div>
        <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
          Kunde *
        </label>
        {preselectedCustomer ? (
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
            <strong>{preselectedCustomer.name}</strong>
          </div>
        ) : (
          <>
            <select
              id="customerId"
              value={formData.customerId}
              onChange={handleChange('customerId')}
              className={`w-full rounded-lg border px-4 py-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:border-orange-500 ${
                errors.customerId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading || loadingCustomers}
            >
              <option value="">Kunde auswählen...</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.firstName} {customer.lastName} {customer.email ? `(${customer.email})` : ''}
                </option>
              ))}
            </select>
            {loadingCustomers && (
              <p className="mt-1 text-sm text-gray-500">Lade Kunden...</p>
            )}
            {errors.customerId && (
              <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>
            )}
          </>
        )}
      </div>

      {/* Job description */}
      <div>
        <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">
          Arbeitsbeschreibung *
        </label>
        <textarea
          id="jobDescription"
          value={formData.jobDescription}
          onChange={handleChange('jobDescription')}
          rows={3}
          className={`w-full rounded-lg border px-4 py-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:border-orange-500 resize-none ${
            errors.jobDescription ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="z.B. Fassadenanstrich, Innenrenovierung..."
          disabled={isLoading}
        />
        {errors.jobDescription && (
          <p className="mt-1 text-sm text-red-600">{errors.jobDescription}</p>
        )}
      </div>

      {/* Measurements */}
      <div>
        <label htmlFor="measurements" className="block text-sm font-medium text-gray-700 mb-1">
          Maße / Fläche
        </label>
        <Input
          id="measurements"
          type="text"
          value={formData.measurements}
          onChange={handleChange('measurements')}
          placeholder="z.B. 50m², 3 Räume..."
          disabled={isLoading}
        />
      </div>

      {/* Cost fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="materialsCost" className="block text-sm font-medium text-gray-700 mb-1">
            Materialkosten
          </label>
          <Input
            id="materialsCost"
            type="number"
            min="0"
            step="0.01"
            value={formData.materialsCost}
            onChange={handleChange('materialsCost')}
            className={errors.materialsCost ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            disabled={isLoading}
          />
          {errors.materialsCost && (
            <p className="mt-1 text-sm text-red-600">{errors.materialsCost}</p>
          )}
        </div>

        <div>
          <label htmlFor="laborCost" className="block text-sm font-medium text-gray-700 mb-1">
            Arbeitskosten
          </label>
          <Input
            id="laborCost"
            type="number"
            min="0"
            step="0.01"
            value={formData.laborCost}
            onChange={handleChange('laborCost')}
            className={errors.laborCost ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            disabled={isLoading}
          />
          {errors.laborCost && (
            <p className="mt-1 text-sm text-red-600">{errors.laborCost}</p>
          )}
        </div>
      </div>

      {/* Total cost (readonly) */}
      <div>
        <label htmlFor="totalCost" className="block text-sm font-medium text-gray-700 mb-1">
          Gesamtkosten
        </label>
        <Input
          id="totalCost"
          type="number"
          value={formData.totalCost}
          readOnly
          className="bg-gray-50 text-gray-700 font-medium"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Abbrechen
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Erstelle...
            </>
          ) : (
            'Angebot erstellen'
          )}
        </Button>
      </div>
    </form>
  )
}