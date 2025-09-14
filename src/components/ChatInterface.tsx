'use client'

import { useState, useRef, useEffect } from 'react'
import ChatBubble from '@/components/ChatBubble'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ChatInterfaceProps {
  onProspectSuggestion?: (data: any) => void
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function ChatInterface({ onProspectSuggestion }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! Ich bin dein Handwerker-Assistent 🔨 Erzähl mir von deinen Kunden oder Aufträgen - ich helfe dir bei der Verwaltung!'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: ''
      }

      setMessages(prev => [...prev, assistantMessage])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('0:"')) {
              const content = line.slice(3, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"')
              assistantContent += content
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: assistantContent }
                    : msg
                )
              )
            }
          }
        }
      }
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


  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <header className="sticky top-0 z-10 border-b border-border bg-white/95 backdrop-blur-sm">
        <div className="px-6 py-4">
          <h1 className="text-xl font-medium text-gray-900">KI Handwerker-Assistent</h1>
          <p className="text-sm text-muted mt-1">Erzähl mir von deinen Kunden und Aufträgen</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            role={message.role}
            content={message.content}
            timestamp={new Date()}
          />
        ))}

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
                  <span className="text-[15px] text-muted">Denke nach...</span>
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
                value={input}
                onChange={handleInputChange}
                placeholder="Erzähl mir von deinen Kunden oder Aufträgen..."
                disabled={isLoading}
                className="h-12 text-base resize-none"
              />
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
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

