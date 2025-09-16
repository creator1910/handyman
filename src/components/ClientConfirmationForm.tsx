import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface Customer {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  address?: string
  isProspect: boolean
  matchScore?: number
}

interface ClientConfirmationFormProps {
  suggestedClients: Customer[]
  onConfirm: (customerId: string) => void
  onCancel: () => void
  onCreateNew: () => void
  isLoading?: boolean
  searchTerm: string
}

export function ClientConfirmationForm({
  suggestedClients,
  onConfirm,
  onCancel,
  onCreateNew,
  isLoading = false,
  searchTerm
}: ClientConfirmationFormProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(suggestedClients[0]?.id || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedClientId) {
      onConfirm(selectedClientId)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Kunden für "{searchTerm}" gefunden
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Bitte wählen Sie den richtigen Kunden aus oder erstellen Sie einen neuen:
        </p>

        <div className="space-y-3">
          {suggestedClients.map((client) => (
            <label
              key={client.id}
              className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedClientId === client.id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="selectedClient"
                value={client.id}
                checked={selectedClientId === client.id}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 mt-1"
                disabled={isLoading}
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {client.firstName} {client.lastName}
                  </span>
                  {client.matchScore && client.matchScore >= 80 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Beste Übereinstimmung
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    client.isProspect
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {client.isProspect ? 'Interessent' : 'Kunde'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {[client.email, client.phone, client.address].filter(Boolean).join(' • ')}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCreateNew}
          disabled={isLoading}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Neuen Kunden anlegen
        </Button>

        <div className="flex gap-3">
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
            disabled={isLoading || !selectedClientId}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Erstelle...
              </>
            ) : (
              'Kunden bestätigen'
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}