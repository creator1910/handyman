'use client'

import { useState, useRef, useEffect } from 'react'
import ChatBubble from '@/components/ChatBubble'
import QuickActions from '@/components/QuickActions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ChatInterfaceProps {
  onProspectSuggestion?: (data: any) => void
}

interface ToolCall {
  id: string
  name: string
  parameters: any
  result?: any
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCall[]
  quickActions?: {
    type: 'customer_suggestion' | 'offer_suggestion' | 'customer_list' | 'offer_list'
    data?: any
  }
}

export default function ChatInterface({ onProspectSuggestion }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! Ich bin dein Handwerker-Assistent 🔨\n\nErzähl mir von deinen Kunden oder Aufträgen - ich helfe dir bei der Verwaltung!\n\n**Was ich für dich tun kann:**\n• Kunden verwalten und erstellen\n• Angebote kalkulieren und erstellen\n• Kundendaten durchsuchen\n• Aufträge organisieren'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response not ok:', response.status, errorText)
        throw new Error(`Failed to get response: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      
      let assistantContent = result.content

      let quickActions: Message['quickActions'] = undefined

      // If the AI used tools but didn't generate text, create a summary
      if (!assistantContent && result.toolResults && result.toolResults.length > 0) {
        const toolResult = result.toolResults[0]
        if (toolResult.toolName === 'getCustomers' && toolResult.output.success) {
          const customers = toolResult.output.customers
          assistantContent = `## 👥 Deine Kunden (${customers.length})\n\n${customers.map((c: any) => 
            `**${c.firstName} ${c.lastName}**\n` +
            `📧 ${c.email || 'Keine E-Mail'}\n` +
            `📞 ${c.phone || 'Keine Telefonnummer'}\n` +
            `📍 ${c.address || 'Keine Adresse'}\n` +
            `Status: ${c.isProspect ? '🔍 Interessent' : '✅ Kunde'}\n` +
            `📊 ${c._count.offers} Angebote • ${c._count.invoices} Rechnungen\n`
          ).join('\n')}`
          
          quickActions = { type: 'customer_list' }
          
        } else if (toolResult.toolName === 'createCustomer' && toolResult.output.success) {
          const customer = toolResult.output.customer
          assistantContent = `## ✅ Kunde erfolgreich erstellt!\n\n` +
            `**${customer.firstName} ${customer.lastName}**\n\n` +
            `📧 ${customer.email || 'Keine E-Mail'}\n` +
            `📞 ${customer.phone || 'Keine Telefonnummer'}\n` +
            `📍 ${customer.address || 'Keine Adresse'}\n` +
            `Status: ${customer.isProspect ? '🔍 Interessent' : '✅ Kunde'}\n\n` +
            `Der Kunde wurde erfolgreich in der Datenbank gespeichert und kann jetzt für Angebote verwendet werden.`
            
        } else if (toolResult.toolName === 'createOffer' && toolResult.output.success) {
          const offer = toolResult.output.offer
          assistantContent = `## ✅ Angebot erfolgreich erstellt!\n\n` +
            `**${offer.offerNumber}** für **${offer.customer.firstName} ${offer.customer.lastName}**\n\n` +
            `📋 ${offer.jobDescription || 'Keine Beschreibung'}\n` +
            `📏 ${offer.measurements || 'Keine Maße angegeben'}\n\n` +
            `💰 **Kostenaufstellung:**\n` +
            `• Materialkosten: ${offer.materialsCost}€\n` +
            `• Arbeitskosten: ${offer.laborCost}€\n` +
            `• **Gesamtkosten: ${offer.totalCost}€**\n\n` +
            `Das Angebot wurde erstellt und kann jetzt versendet werden.`
            
          quickActions = { type: 'offer_list' }
        }
      }

      // Check if AI is suggesting customer creation from text
      if (result.content && result.content.includes('Kunde') && result.content.includes('erstellen')) {
        // Extract potential customer data from the conversation
        const userMsg = [...messages, userMessage].find(m => m.role === 'user')?.content || ''
        const customerMatch = userMsg.match(/(\w+)\s+(\w+)(?:,\s*([^,]+@[^,]+))?(?:,\s*([\d\s+\-()]+))?(?:,\s*(.+))?/)
        
        if (customerMatch) {
          quickActions = { 
            type: 'customer_suggestion',
            data: {
              firstName: customerMatch[1],
              lastName: customerMatch[2],
              email: customerMatch[3],
              phone: customerMatch[4],
              address: customerMatch[5]
            }
          }
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent || result.content || 'Ich habe deine Anfrage bearbeitet!',
        quickActions
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Entschuldigung, es gab einen Fehler. Bitte versuche es noch einmal.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleQuickAction = async (action: string, data?: any) => {
    console.log('Quick action:', action, data)
    
    switch (action) {
      case 'confirm_customer':
        if (data) {
          setInput(`Erstelle einen neuen Kunden: ${data.firstName} ${data.lastName}${data.email ? `, ${data.email}` : ''}${data.phone ? `, ${data.phone}` : ''}${data.address ? `, ${data.address}` : ''}`)
        }
        break
        
      case 'add_customer':
        setInput('Erstelle einen neuen Kunden: ')
        break
        
      case 'search_customers':
        setInput('Suche nach Kunde: ')
        break
        
      case 'create_offer':
        setInput('Erstelle ein Angebot für: ')
        break
        
      case 'confirm_offer':
        if (data) {
          setInput(`Erstelle ein Angebot für ${data.customerName}: ${data.description}, Materialkosten ${data.materialsCost}€, Arbeitskosten ${data.laborCost}€`)
        }
        break
        
      case 'cancel':
        // Just clear any pending actions
        break
        
      default:
        console.log('Unhandled quick action:', action)
    }
  }


  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-white to-gray-50/50">
      {/* Messages area - takes full available space */}
      <div className="flex-1 overflow-y-auto">
        {/* Header integrated into messages area */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">HandyAI Assistant</h1>
            <p className="text-gray-600">Dein KI-Assistent für Handwerker-CRM</p>
          </div>
        </div>

        {/* Messages container */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="space-y-6">
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={new Date()}
                toolCalls={message.toolCalls}
                actions={message.quickActions ? (
                  <QuickActions
                    type={message.quickActions.type}
                    data={message.quickActions.data}
                    onAction={handleQuickAction}
                  />
                ) : undefined}
              />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex flex-col items-start max-w-2xl">
                  <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-gray-500 text-sm">Bearbeite deine Anfrage...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Sticky input area - Claude-like */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-end bg-white border border-gray-300 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                placeholder="Erzähl mir von deinen Kunden oder Aufträgen..."
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none border-0 bg-transparent px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 text-base leading-6 min-h-[48px] max-h-32 overflow-y-auto"
                style={{
                  height: 'auto',
                  minHeight: '48px'
                }}
                ref={(textarea) => {
                  if (textarea) {
                    textarea.style.height = 'auto'
                    textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px'
                  }
                }}
              />
              <div className="flex items-end p-2">
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {/* Helper text */}
            <div className="mt-2 text-xs text-gray-400 text-center">
              Drücke Enter zum Senden, Shift+Enter für neue Zeile
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

