'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

interface PriceItem {
  id: string
  name: string
  unit: string
  price: number
  category: 'material' | 'labor'
}

interface CompanySettings {
  companyName: string
  address: string
  phone: string
  email: string
  iban: string
  bic: string
  taxId: string
  hourlyRate: number
}

export default function SettingsPage() {
  const [priceList, setPriceList] = useState<PriceItem[]>([
    { id: '1', name: 'Wandfarbe weiß', unit: 'Liter', price: 12.50, category: 'material' },
    { id: '2', name: 'Grundierung', unit: 'Liter', price: 15.80, category: 'material' },
    { id: '3', name: 'Malerarbeiten', unit: 'Stunde', price: 45.00, category: 'labor' },
    { id: '4', name: 'Vorbereitungsarbeiten', unit: 'Stunde', price: 40.00, category: 'labor' },
  ])

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: 'Mustermann Handwerk GmbH',
    address: 'Musterstraße 123\n12345 Musterstadt',
    phone: '+49 123 456789',
    email: 'info@mustermann-handwerk.de',
    iban: 'DE89 3704 0044 0532 0130 00',
    bic: 'COBADEFFXXX',
    taxId: 'DE123456789',
    hourlyRate: 45.00
  })

  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [newPriceItem, setNewPriceItem] = useState<Partial<PriceItem>>({
    name: '',
    unit: '',
    price: 0,
    category: 'material'
  })

  const handleSavePrice = (id: string, updatedItem: PriceItem) => {
    setPriceList(prev => prev.map(item => 
      item.id === id ? updatedItem : item
    ))
    setEditingPrice(null)
  }

  const handleAddPrice = () => {
    if (!newPriceItem.name || !newPriceItem.unit) return

    const newItem: PriceItem = {
      id: Date.now().toString(),
      name: newPriceItem.name,
      unit: newPriceItem.unit,
      price: newPriceItem.price || 0,
      category: newPriceItem.category || 'material'
    }

    setPriceList(prev => [...prev, newItem])
    setNewPriceItem({ name: '', unit: '', price: 0, category: 'material' })
  }

  const handleDeletePrice = (id: string) => {
    setPriceList(prev => prev.filter(item => item.id !== id))
  }

  const materialItems = priceList.filter(item => item.category === 'material')
  const laborItems = priceList.filter(item => item.category === 'labor')

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-border bg-white/95 backdrop-blur-sm">
          <div className="px-6 py-4">
            <h1 className="text-xl font-medium text-gray-900">Einstellungen</h1>
            <p className="text-sm text-muted mt-1">Verwalten Sie Ihre Preislisten und Rechnungsdaten</p>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
          {/* Price Lists Card */}
          <Card>
            <CardHeader>
              <CardTitle>Preislisten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Materials */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Materialien</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-4 text-xs font-medium text-muted uppercase tracking-wider border-b border-border pb-2">
                    <div>Name</div>
                    <div>Einheit</div>
                    <div>Preis</div>
                    <div>Aktionen</div>
                  </div>
                  
                  {materialItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-4 gap-4 py-2 border-b border-border hover:bg-surface/50">
                      {editingPrice === item.id ? (
                        <EditableRow
                          item={item}
                          onSave={(updatedItem) => handleSavePrice(item.id, updatedItem)}
                          onCancel={() => setEditingPrice(null)}
                        />
                      ) : (
                        <>
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-sm text-muted">{item.unit}</div>
                          <div className="text-sm font-medium">{item.price.toFixed(2)} €</div>
                          <div className="flex gap-2">
                            <Button
                              variant="tertiary"
                              size="sm"
                              onClick={() => setEditingPrice(item.id)}
                            >
                              Bearbeiten
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeletePrice(item.id)}
                            >
                              Löschen
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Labor */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Arbeitsleistungen</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-4 text-xs font-medium text-muted uppercase tracking-wider border-b border-border pb-2">
                    <div>Name</div>
                    <div>Einheit</div>
                    <div>Preis</div>
                    <div>Aktionen</div>
                  </div>
                  
                  {laborItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-4 gap-4 py-2 border-b border-border hover:bg-surface/50">
                      {editingPrice === item.id ? (
                        <EditableRow
                          item={item}
                          onSave={(updatedItem) => handleSavePrice(item.id, updatedItem)}
                          onCancel={() => setEditingPrice(null)}
                        />
                      ) : (
                        <>
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-sm text-muted">{item.unit}</div>
                          <div className="text-sm font-medium">{item.price.toFixed(2)} €</div>
                          <div className="flex gap-2">
                            <Button
                              variant="tertiary"
                              size="sm"
                              onClick={() => setEditingPrice(item.id)}
                            >
                              Bearbeiten
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeletePrice(item.id)}
                            >
                              Löschen
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add new item */}
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Neuen Eintrag hinzufügen</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Input
                    placeholder="Name"
                    value={newPriceItem.name || ''}
                    onChange={(e) => setNewPriceItem(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Einheit"
                    value={newPriceItem.unit || ''}
                    onChange={(e) => setNewPriceItem(prev => ({ ...prev, unit: e.target.value }))}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Preis"
                    value={newPriceItem.price || ''}
                    onChange={(e) => setNewPriceItem(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  />
                  <select
                    className="h-11 w-full rounded-lg border border-border bg-white px-4 py-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                    value={newPriceItem.category || 'material'}
                    onChange={(e) => setNewPriceItem(prev => ({ ...prev, category: e.target.value as 'material' | 'labor' }))}
                  >
                    <option value="material">Material</option>
                    <option value="labor">Arbeitsleistung</option>
                  </select>
                  <Button onClick={handleAddPrice}>
                    Hinzufügen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Rechnungsdaten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input
                    label="Firmenname"
                    value={companySettings.companyName}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, companyName: e.target.value }))}
                  />
                  
                  <Textarea
                    label="Adresse"
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                  />
                  
                  <Input
                    label="Telefon"
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                  />
                  
                  <Input
                    label="E-Mail"
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-4">
                  <Input
                    label="IBAN"
                    value={companySettings.iban}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, iban: e.target.value }))}
                  />
                  
                  <Input
                    label="BIC"
                    value={companySettings.bic}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, bic: e.target.value }))}
                  />
                  
                  <Input
                    label="Steuernummer"
                    value={companySettings.taxId}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, taxId: e.target.value }))}
                  />
                  
                  <Input
                    label="Stundensatz (€)"
                    type="number"
                    step="0.01"
                    value={companySettings.hourlyRate}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) }))}
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button>
                  Einstellungen speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AppShell>
  )
}

interface EditableRowProps {
  item: PriceItem
  onSave: (item: PriceItem) => void
  onCancel: () => void
}

function EditableRow({ item, onSave, onCancel }: EditableRowProps) {
  const [editedItem, setEditedItem] = useState<PriceItem>(item)

  const handleSave = () => {
    onSave(editedItem)
  }

  return (
    <>
      <Input
        value={editedItem.name}
        onChange={(e) => setEditedItem(prev => ({ ...prev, name: e.target.value }))}
        className="h-8 text-sm"
      />
      <Input
        value={editedItem.unit}
        onChange={(e) => setEditedItem(prev => ({ ...prev, unit: e.target.value }))}
        className="h-8 text-sm"
      />
      <Input
        type="number"
        step="0.01"
        value={editedItem.price}
        onChange={(e) => setEditedItem(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
        className="h-8 text-sm"
      />
      <div className="flex gap-1">
        <Button variant="success" size="sm" onClick={handleSave}>
          ✓
        </Button>
        <Button variant="tertiary" size="sm" onClick={onCancel}>
          ✕
        </Button>
      </div>
    </>
  )
}