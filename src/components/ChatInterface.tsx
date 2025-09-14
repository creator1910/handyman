'use client'

import { useState } from 'react'
import ChatBubble from '@/components/ChatBubble'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ProspectSuggestion {
  customer: string
  jobType: string
  description: string
  parsedAt: Date
}

interface ChatInterfaceProps {
  onProspectSuggestion?: (data: ProspectSuggestion) => void
}

export default function ChatInterface({ onProspectSuggestion }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hallo! Ich bin Ihr KI-Assistent für Handwerker. Erzählen Sie mir von Ihrem nächsten Auftrag - ich helfe Ihnen dabei, alle Details zu erfassen und einen neuen Interessenten anzulegen.',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingSuggestion, setPendingSuggestion] = useState<ProspectSuggestion | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Simulate AI processing
    setTimeout(() => {
      const suggestion = parseJobDetails(inputValue)
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Ich habe folgende Details aus Ihrer Nachricht erkannt:\n\n` +
          `**Kunde:** ${suggestion.customer}\n` +
          `**Auftrag:** ${suggestion.jobType}\n` +
          `**Beschreibung:** ${suggestion.description}\n\n` +
          `Soll ich einen neuen Interessenten mit diesen Daten anlegen?`,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      setPendingSuggestion(suggestion)
      setShowConfirmation(true)
      setIsLoading(false)
    }, 1000)
  }

  const handleConfirmProspect = async () => {
    if (!pendingSuggestion) return

    setIsLoading(true)
    try {
      // Extract first and last name
      const nameParts = pendingSuggestion.customer.split(' ')
      const firstName = nameParts[0] || 'Unbekannt'
      const lastName = nameParts.slice(1).join(' ') || ''

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          isProspect: true,
        }),
      })

      if (response.ok) {
        const newCustomer = await response.json()
        const confirmationMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: `✅ Interessent wurde erfolgreich angelegt!\n\n**${firstName} ${lastName}** ist jetzt in Ihrem System und kann unter "Kunden" bearbeitet werden.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, confirmationMessage])
        
        if (onProspectSuggestion) {
          onProspectSuggestion(pendingSuggestion)
        }
      } else {
        throw new Error('Failed to create prospect')
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: '❌ Es gab einen Fehler beim Anlegen des Interessenten. Bitte versuchen Sie es erneut.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setPendingSuggestion(null)
      setShowConfirmation(false)
    }
  }

  const handleRejectProspect = () => {
    const rejectionMessage: ChatMessage = {
      id: (Date.now() + 2).toString(),
      role: 'assistant',
      content: 'Verstanden! Beschreiben Sie gerne einen anderen Auftrag oder geben Sie mehr Details an.',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, rejectionMessage])
    setPendingSuggestion(null)
    setShowConfirmation(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <header className="sticky top-0 z-10 border-b border-border bg-white/95 backdrop-blur-sm">
        <div className="px-6 py-4">
          <h1 className="text-xl font-medium text-gray-900">Chat Assistent</h1>
          <p className="text-sm text-muted mt-1">Beschreiben Sie Ihren Auftrag</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin">
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1
          const shouldShowConfirmation = showConfirmation && pendingSuggestion && isLastMessage && message.role === 'assistant'
          
          return (
            <ChatBubble
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
              actions={shouldShowConfirmation ? (
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={handleRejectProspect}
                    disabled={isLoading}
                  >
                    Nein
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleConfirmProspect}
                    disabled={isLoading}
                  >
                    Ja, anlegen
                  </Button>
                </div>
              ) : undefined}
            />
          )
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex flex-col items-start max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl mr-4">
              <div className="bg-white border border-border rounded-2xl px-4 py-3 shadow-soft">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-[15px] text-muted">Analysiere...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <footer className="sticky bottom-0 border-t border-border bg-white/95 backdrop-blur-sm">
        <div className="px-6 py-4">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Beschreiben Sie Ihren Auftrag..."
                disabled={isLoading}
                className="h-12 text-base resize-none"
              />
            </div>
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="h-12 px-6 shrink-0"
            >
              <span className="mr-2" aria-hidden="true">📤</span>
              Senden
            </Button>
          </form>
        </div>
      </footer>
    </div>
  )
}

// Simple deterministic parser for job details
function parseJobDetails(input: string): any {
  const lowerInput = input.toLowerCase()
  
  // Extract customer name (basic pattern matching)
  const namePatterns = [
    /für (.+?) /i,
    /kunde (.+?) /i,
    /herr (.+?) /i,
    /frau (.+?) /i,
    /bei (.+?) /i
  ]
  
  let customer = 'Unbekannt'
  for (const pattern of namePatterns) {
    const match = input.match(pattern)
    if (match) {
      customer = match[1].split(' ')[0]
      break
    }
  }

  // Determine job type
  let jobType = 'Sonstiges'
  if (lowerInput.includes('malen') || lowerInput.includes('streichen') || lowerInput.includes('farbe')) {
    jobType = 'Malerarbeiten'
  } else if (lowerInput.includes('garten') || lowerInput.includes('rasen') || lowerInput.includes('pflege')) {
    jobType = 'Gartenpflege'
  } else if (lowerInput.includes('renovier') || lowerInput.includes('sanieren')) {
    jobType = 'Renovierung'
  } else if (lowerInput.includes('dach') || lowerInput.includes('ziegel')) {
    jobType = 'Dacharbeiten'
  }

  return {
    customer,
    jobType,
    description: input,
    parsedAt: new Date()
  }
}