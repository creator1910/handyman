import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface CreateCustomerFormProps {
  onSubmit: (customerData: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    isProspect: boolean
  }) => void
  onCancel: () => void
  isLoading?: boolean
  prefilledData?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    address?: string
    isProspect?: boolean
  }
}

export function CreateCustomerForm({ onSubmit, onCancel, isLoading = false, prefilledData }: CreateCustomerFormProps) {
  const [formData, setFormData] = useState({
    firstName: prefilledData?.firstName || '',
    lastName: prefilledData?.lastName || '',
    email: prefilledData?.email || '',
    phone: prefilledData?.phone || '',
    address: prefilledData?.address || '',
    isProspect: prefilledData?.isProspect ?? true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Vorname ist erforderlich'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Nachname ist erforderlich'
    }

    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'E-Mail-Adresse ist ungültig'
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

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            Vorname *
          </label>
          <Input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange('firstName')}
            className={errors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            disabled={isLoading}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Nachname *
          </label>
          <Input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange('lastName')}
            className={errors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            disabled={isLoading}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Contact fields */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          E-Mail
        </label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          className={errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Telefon
        </label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange('phone')}
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Adresse
        </label>
        <Input
          id="address"
          type="text"
          value={formData.address}
          onChange={handleChange('address')}
          disabled={isLoading}
        />
      </div>

      {/* Customer type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="customerType"
              checked={formData.isProspect}
              onChange={() => setFormData(prev => ({ ...prev, isProspect: true }))}
              className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300"
              disabled={isLoading}
            />
            <span className="ml-2 text-sm text-gray-700">Interessent</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="customerType"
              checked={!formData.isProspect}
              onChange={() => setFormData(prev => ({ ...prev, isProspect: false }))}
              className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300"
              disabled={isLoading}
            />
            <span className="ml-2 text-sm text-gray-700">Kunde</span>
          </label>
        </div>
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
            'Kunde erstellen'
          )}
        </Button>
      </div>
    </form>
  )
}