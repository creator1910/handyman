'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ChatBubble from '@/components/ChatBubble'
import QuickActions from '@/components/QuickActions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { CreateCustomerForm } from '@/components/CreateCustomerForm'
import { CreateOfferForm } from '@/components/CreateOfferForm'

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

const CHAT_STORAGE_KEY = 'craft-ai-chat-history'
const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: '👋 Hallo! Ich bin dein craft.ai Assistent und helfe dir dabei, dein Handwerker-Business zu organisieren.\n\nSag mir einfach, was du brauchst:\n\n🎯 Schnellstart:\n- Erstelle einen neuen Kunden: Max Mustermann\n- Zeige mir alle meine Kunden\n- Erstelle ein Angebot für Maria Schmidt\n- Suche nach Kunden namens Weber\n\n💡 Einfach loslegen: Beschreib mir deinen Auftrag oder Kunden - ich kümmere mich um den Rest!'
}

// Helper function to load chat history from localStorage
const loadChatHistory = (): Message[] => {
  if (typeof window === 'undefined') return [WELCOME_MESSAGE] // SSR protection

  try {
    const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY)
    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages)
      if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
        // Always ensure welcome message is first
        const hasWelcome = parsedMessages.some(msg => msg.id === 'welcome')
        if (!hasWelcome) {
          return [WELCOME_MESSAGE, ...parsedMessages]
        }
        return parsedMessages
      }
    }
  } catch (error) {
    console.error('Error loading chat history:', error)
  }
  return [WELCOME_MESSAGE]
}

export default function ChatInterface({ onProspectSuggestion }: ChatInterfaceProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(() => loadChatHistory())
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Modal states
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false)
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [isCreatingOffer, setIsCreatingOffer] = useState(false)

  // Data for pre-filled forms
  const [suggestedCustomerData, setSuggestedCustomerData] = useState<any>(null)
  const [suggestedOfferData, setSuggestedOfferData] = useState<any>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }


  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
    } catch (error) {
      console.error('Error saving chat history:', error)
    }
  }, [messages])

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
      console.log('Chat response result:', result)

      let assistantContent = result.content

      let quickActions: Message['quickActions'] = undefined

      // Process tool results (both when AI generates text and when it doesn't)
      if (result.toolResults && result.toolResults.length > 0) {
        console.log('Processing tool results:', result.toolResults)
        const toolResult = result.toolResults[0]
        console.log('First tool result:', toolResult)

        // Check if this is a successful tool that should override the generic message
        const shouldOverrideContent = !assistantContent || assistantContent.includes('Ich habe deine Anfrage bearbeitet')
        if (toolResult.toolName === 'getCustomers' && toolResult.output.success && shouldOverrideContent) {
          const customers = toolResult.output.customers

          // Create table format for customers
          const tableHeader = '| Name | Kontakt | Adresse | Status | Angebote | Rechnungen |\n|------|---------|---------|--------|----------|------------|'
          const tableRows = customers.map((c: any) => {
            // Handle both Prisma (_count) and Supabase (array with count) formats
            const offersCount = c._count?.offers ?? (c.offers?.[0]?.count ?? 0)
            const invoicesCount = c._count?.invoices ?? (c.invoices?.[0]?.count ?? 0)
            const contact = [c.email, c.phone].filter(Boolean).join(' • ') || 'Keine Kontaktdaten'
            const address = c.address || 'Keine Adresse'
            const status = c.isProspect ? 'Interessent' : 'Kunde'

            return `| **${c.firstName} ${c.lastName}** | ${contact} | ${address} | ${status} | ${offersCount} | ${invoicesCount} |`
          }).join('\n')

          assistantContent = `## Deine Kunden (${customers.length})\n\n${tableHeader}\n${tableRows}`
          
          quickActions = { type: 'customer_list' }
          
        } else if (toolResult.toolName === 'createCustomer' && toolResult.output.success && shouldOverrideContent) {
          const customer = toolResult.output.customer
          assistantContent = `## Kunde erfolgreich erstellt\n\n` +
            `**${customer.firstName} ${customer.lastName}** wurde als ${customer.isProspect ? 'Interessent' : 'Kunde'} angelegt.\n\n` +
            `### Kontaktdaten\n` +
            `| Feld | Wert |\n|------|------|\n` +
            `| E-Mail | ${customer.email || 'Nicht angegeben'} |\n` +
            `| Telefon | ${customer.phone || 'Nicht angegeben'} |\n` +
            `| Adresse | ${customer.address || 'Nicht angegeben'} |\n` +
            `| Status | ${customer.isProspect ? 'Interessent' : 'Kunde'} |\n\n` +
            `Der Kunde kann jetzt für Angebote und Rechnungen verwendet werden.`
            
        } else if ((toolResult.toolName === 'createOffer' || toolResult.toolName === 'createOfferWithLookup' || toolResult.toolName === 'confirmOfferClient') && toolResult.output.success && shouldOverrideContent) {
          const offer = toolResult.output.offer
          const pdfUrl = toolResult.output.pdfUrl

          if (offer && offer.offerNumber) {
            assistantContent = `## Angebot erfolgreich erstellt\n\n` +
              `Angebot ${offer.offerNumber} für ${offer.customer?.firstName || ''} ${offer.customer?.lastName || ''}\n\n` +
              `## Kostenaufstellung\n` +
              `| Position | Betrag |\n|----------|--------|\n` +
              `| Materialkosten | ${offer.materialsCost || 0}€ |\n` +
              `| Arbeitskosten | ${offer.laborCost || 0}€ |\n` +
              `| Gesamtkosten | ${offer.totalCost || 0}€ |\n\n` +
              `${offer.jobDescription ? `Beschreibung: ${offer.jobDescription}\n\n` : ''}` +
              `${pdfUrl ? `📄 Angebot: ${pdfUrl}\n\n` : ''}` +
              `Das Angebot ist bereit zum Versenden.`
          } else {
            // Use the message from the tool result if no detailed offer data
            assistantContent = toolResult.output.message || 'Angebot wurde erstellt.'
            if (pdfUrl) {
              assistantContent += `\n\n📄 Angebot: ${pdfUrl}`
            }
          }

          quickActions = { type: 'offer_list' }

        } else if (toolResult.toolName === 'findCustomer' && toolResult.output.success && shouldOverrideContent) {
          const customers = toolResult.output.customers
          const bestMatch = toolResult.output.bestMatch

          if (customers.length === 1) {
            assistantContent = `## Kunde gefunden\n\n` +
              `### ${bestMatch.firstName} ${bestMatch.lastName}\n\n` +
              `| Feld | Wert |\n|------|------|\n` +
              `| E-Mail | ${bestMatch.email || 'Nicht angegeben'} |\n` +
              `| Telefon | ${bestMatch.phone || 'Nicht angegeben'} |\n` +
              `| Adresse | ${bestMatch.address || 'Nicht angegeben'} |\n` +
              `| Status | ${bestMatch.isProspect ? 'Interessent' : 'Kunde'} |\n\n` +
              `Ist das der richtige Kunde?`
          } else {
            const tableHeader = '| # | Name | Kontakt | Status |\n|---|------|---------|--------|'
            const tableRows = customers.map((c: any, index: number) => {
              const contact = [c.email, c.phone].filter(Boolean).join(' • ') || 'Keine Kontaktdaten'
              const status = c.isProspect ? 'Interessent' : 'Kunde'
              return `| ${index + 1} | **${c.firstName} ${c.lastName}** | ${contact} | ${status} |`
            }).join('\n')

            assistantContent = `## Mehrere Kunden gefunden\n\n` +
              `Ich habe ${customers.length} passende Kunden gefunden:\n\n` +
              `${tableHeader}\n${tableRows}\n\n` +
              `Welcher Kunde ist gemeint?`
          }

        } else if (toolResult.toolName === 'getCustomerDetails' && toolResult.output.success && shouldOverrideContent) {
          const customer = toolResult.output.customer
          const offersCount = customer.offers?.length || 0
          const invoicesCount = customer.invoices?.length || 0
          const appointmentsCount = customer.appointments?.length || 0

          assistantContent = `## Kundendetails\n\n` +
            `### ${customer.firstName} ${customer.lastName}\n\n` +
            `| Feld | Wert |\n|------|------|\n` +
            `| E-Mail | ${customer.email || 'Nicht angegeben'} |\n` +
            `| Telefon | ${customer.phone || 'Nicht angegeben'} |\n` +
            `| Adresse | ${customer.address || 'Nicht angegeben'} |\n` +
            `| Status | ${customer.isProspect ? 'Interessent' : 'Kunde'} |\n` +
            `| Erstellt | ${new Date(customer.createdAt).toLocaleDateString('de-DE')} |\n\n` +
            `### Übersicht\n` +
            `| Kategorie | Anzahl |\n|-----------|--------|\n` +
            `| Angebote | ${offersCount} |\n` +
            `| Rechnungen | ${invoicesCount} |\n` +
            `| Termine | ${appointmentsCount} |\n`

          if (offersCount > 0) {
            assistantContent += `\n### Letzte Angebote\n` +
              `| Angebot | Betrag | Status |\n|---------|--------|--------|\n` +
              customer.offers.slice(0, 3).map((offer: any) =>
                `| ${offer.offerNumber} | ${offer.totalCost}€ | ${offer.status} |`
              ).join('\n')
          }

        } else if (toolResult.toolName === 'acceptOffer' && toolResult.output.success && shouldOverrideContent) {
          const offer = toolResult.output.offer
          assistantContent = `## Angebot akzeptiert! 🎉\n\n` +
            `Angebot ${offer.offerNumber} für ${offer.customer.firstName} ${offer.customer.lastName} wurde erfolgreich akzeptiert.\n\n` +
            `### Status-Update:\n` +
            `- ✅ Angebot: **Angenommen**\n` +
            `- 🎯 Kunde: **${offer.customer.firstName} ${offer.customer.lastName}** ist jetzt ein **Kunde** (nicht mehr Interessent)\n\n` +
            `Der Kunde kann jetzt Rechnungen erhalten und weitere Aufträge bekommen.`

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

  // API call functions
  const createCustomerViaAPI = async (customerData: any) => {
    setIsCreatingCustomer(true)
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      })

      if (response.ok) {
        setShowCreateCustomerModal(false)
        setSuggestedCustomerData(null)
        // Add success message to chat
        const successMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Kunde **${customerData.firstName} ${customerData.lastName}** wurde erfolgreich erstellt!`
        }
        setMessages(prev => [...prev, successMessage])
      } else {
        console.error('Failed to create customer')
      }
    } catch (error) {
      console.error('Error creating customer:', error)
    } finally {
      setIsCreatingCustomer(false)
    }
  }

  const createOfferViaChat = async (offerData: any) => {
    setIsCreatingOffer(true)
    try {
      // Send via chat API to use MCP tools
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `Erstelle ein Angebot für ${offerData.customerName}: ${offerData.jobDescription}, Materialkosten ${offerData.materialsCost}€, Arbeitskosten ${offerData.laborCost}€, Gesamtkosten ${offerData.totalCost}€`
      }

      setMessages(prev => [...prev, userMessage])
      setShowCreateOfferModal(false)
      setSuggestedOfferData(null)

      const response = await fetch('/api/chat-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (response.ok) {
        const result = await response.json()
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.content || 'Angebot wurde erstellt!'
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Error creating offer:', error)
    } finally {
      setIsCreatingOffer(false)
    }
  }


  const clearChatHistory = () => {
    setMessages([WELCOME_MESSAGE])
    localStorage.removeItem(CHAT_STORAGE_KEY)
  }

  const handleQuickAction = async (action: string, data?: any) => {
    console.log('Quick action:', action, data)

    switch (action) {
      case 'confirm_customer':
        if (data) {
          setSuggestedCustomerData(data)
          setShowCreateCustomerModal(true)
        }
        break

      case 'edit_customer':
        if (data) {
          setSuggestedCustomerData(data)
          setShowCreateCustomerModal(true)
        }
        break

      case 'add_customer':
        setSuggestedCustomerData(null)
        setShowCreateCustomerModal(true)
        break

      case 'search_customers':
        router.push('/kunden?focus=search')
        break

      case 'create_offer':
        setSuggestedOfferData(null)
        setShowCreateOfferModal(true)
        break

      case 'confirm_offer':
        if (data) {
          setSuggestedOfferData(data)
          setShowCreateOfferModal(true)
        }
        break

      case 'cancel':
        // Clear any pending actions and close modals
        setSuggestedCustomerData(null)
        setSuggestedOfferData(null)
        setShowCreateCustomerModal(false)
        setShowCreateOfferModal(false)
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
            <div className="flex justify-between items-center mb-4">
              <div></div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">craft.ai Assistant</h1>
                <p className="text-gray-600">Dein KI-Assistent für Handwerker-CRM</p>
              </div>
              <button
                onClick={clearChatHistory}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                title="Chat löschen"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
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

      {/* Create Customer Modal */}
      <Modal
        isOpen={showCreateCustomerModal}
        onClose={() => {
          setShowCreateCustomerModal(false)
          setSuggestedCustomerData(null)
        }}
        title="Neuen Kunden anlegen"
        size="md"
      >
        <CreateCustomerForm
          onSubmit={createCustomerViaAPI}
          onCancel={() => {
            setShowCreateCustomerModal(false)
            setSuggestedCustomerData(null)
          }}
          isLoading={isCreatingCustomer}
          prefilledData={suggestedCustomerData}
        />
      </Modal>

      {/* Create Offer Modal */}
      <Modal
        isOpen={showCreateOfferModal}
        onClose={() => {
          setShowCreateOfferModal(false)
          setSuggestedOfferData(null)
        }}
        title="Neues Angebot erstellen"
        size="lg"
      >
        <CreateOfferForm
          onSubmit={createOfferViaChat}
          onCancel={() => {
            setShowCreateOfferModal(false)
            setSuggestedOfferData(null)
          }}
          isLoading={isCreatingOffer}
          preselectedCustomer={suggestedOfferData?.customer}
        />
      </Modal>

    </div>
  )
}

