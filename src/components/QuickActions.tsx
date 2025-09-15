'use client'

import { Button } from '@/components/ui/Button'

interface QuickActionsProps {
  type: 'customer_suggestion' | 'offer_suggestion' | 'customer_list' | 'offer_list'
  data?: any
  onAction: (action: string, data?: any) => void
}

export default function QuickActions({ type, data, onAction }: QuickActionsProps) {
  if (type === 'customer_suggestion' && data) {
    return (
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
        <button 
          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors duration-200"
          onClick={() => onAction('confirm_customer', data)}
        >
          ✅ Kunde erstellen
        </button>
        <button 
          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200"
          onClick={() => onAction('edit_customer', data)}
        >
          ✏️ Bearbeiten
        </button>
        <button 
          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
          onClick={() => onAction('cancel', data)}
        >
          ❌ Abbrechen
        </button>
      </div>
    )
  }

  if (type === 'customer_list') {
    return (
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
        <button 
          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors duration-200"
          onClick={() => onAction('add_customer')}
        >
          ➕ Neuen Kunden hinzufügen
        </button>
        <button 
          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200"
          onClick={() => onAction('search_customers')}
        >
          🔍 Kunden suchen
        </button>
        <button 
          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
          onClick={() => onAction('export_customers')}
        >
          📄 Exportieren
        </button>
      </div>
    )
  }

  if (type === 'offer_suggestion' && data) {
    return (
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
        <button 
          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors duration-200"
          onClick={() => onAction('confirm_offer', data)}
        >
          ✅ Angebot erstellen
        </button>
        <button 
          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200"
          onClick={() => onAction('edit_offer', data)}
        >
          ✏️ Preise anpassen
        </button>
        <button 
          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
          onClick={() => onAction('cancel', data)}
        >
          ❌ Abbrechen
        </button>
      </div>
    )
  }

  if (type === 'offer_list') {
    return (
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
        <button 
          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors duration-200"
          onClick={() => onAction('create_offer')}
        >
          ➕ Neues Angebot
        </button>
        <button 
          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors duration-200"
          onClick={() => onAction('filter_offers')}
        >
          🏷️ Filter
        </button>
        <button 
          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
          onClick={() => onAction('export_offers')}
        >
          📄 PDF Export
        </button>
      </div>
    )
  }

  return null
}