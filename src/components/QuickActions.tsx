'use client'

import { Button } from '@/components/ui/Button'

function ActionIcon({ name }: { name: string }) {
  switch (name) {
    case 'check':
      return (
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    case 'edit':
      return (
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    case 'close':
      return (
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    case 'plus':
      return (
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )
    case 'search':
      return (
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    case 'document':
      return (
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    case 'filter':
      return (
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
        </svg>
      )
    default:
      return null
  }
}

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
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-all duration-200 hover:shadow-sm"
          onClick={() => onAction('confirm_customer', data)}
        >
          <ActionIcon name="check" />
          Kunde erstellen
        </button>
        <button
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-all duration-200 hover:shadow-sm"
          onClick={() => onAction('edit_customer', data)}
        >
          <ActionIcon name="edit" />
          Bearbeiten
        </button>
        <button
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-all duration-200 hover:shadow-sm"
          onClick={() => onAction('cancel', data)}
        >
          <ActionIcon name="close" />
          Abbrechen
        </button>
      </div>
    )
  }

  if (type === 'customer_list') {
    return (
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
        <button
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-all duration-200 hover:shadow-sm"
          onClick={() => onAction('add_customer')}
        >
          <ActionIcon name="plus" />
          Neuen Kunden hinzufügen
        </button>
        <button
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-all duration-200 hover:shadow-sm"
          onClick={() => onAction('search_customers')}
        >
          <ActionIcon name="search" />
          Kunden suchen
        </button>
        <button
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-all duration-200 hover:shadow-sm"
          onClick={() => onAction('export_customers')}
        >
          <ActionIcon name="document" />
          Exportieren
        </button>
      </div>
    )
  }

  if (type === 'offer_suggestion' && data) {
    return (
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
        <button
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-all duration-200 hover:shadow-sm"
          onClick={() => onAction('confirm_offer', data)}
        >
          <ActionIcon name="check" />
          Angebot erstellen
        </button>
        <button
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-all duration-200 hover:shadow-sm"
          onClick={() => onAction('edit_offer', data)}
        >
          <ActionIcon name="edit" />
          Preise anpassen
        </button>
        <button
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-all duration-200 hover:shadow-sm"
          onClick={() => onAction('cancel', data)}
        >
          <ActionIcon name="close" />
          Abbrechen
        </button>
      </div>
    )
  }

  if (type === 'offer_list') {
    return (
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
        <button
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-all duration-200 hover:shadow-sm"
          onClick={() => onAction('create_offer')}
        >
          <ActionIcon name="plus" />
          Neues Angebot
        </button>
        <button
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-all duration-200 hover:shadow-sm"
          onClick={() => onAction('filter_offers')}
        >
          <ActionIcon name="filter" />
          Filter
        </button>
        <button
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-all duration-200 hover:shadow-sm"
          onClick={() => onAction('export_offers')}
        >
          <ActionIcon name="document" />
          PDF Export
        </button>
      </div>
    )
  }

  return null
}