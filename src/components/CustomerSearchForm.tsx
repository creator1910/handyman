import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface CustomerSearchFormProps {
  onSubmit: (searchTerm: string) => void
  onCancel: () => void
  isLoading?: boolean
}

export function CustomerSearchForm({ onSubmit, onCancel, isLoading = false }: CustomerSearchFormProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      onSubmit(searchTerm.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">
          Suchbegriff
        </label>
        <Input
          id="searchTerm"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Name, E-Mail oder Telefonnummer..."
          disabled={isLoading}
          autoFocus
        />
      </div>

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
          disabled={isLoading || !searchTerm.trim()}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Suche...
            </>
          ) : (
            'Suchen'
          )}
        </Button>
      </div>
    </form>
  )
}