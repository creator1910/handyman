import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { processHandwerkerText } from '@/lib/text-formatting'
import MarkdownText from './MarkdownText'

interface ToolCall {
  id: string
  name: string
  parameters: any
  result?: any
}

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actions?: React.ReactNode
  toolCalls?: ToolCall[]
}

function formatToolCallResult(toolCall: ToolCall) {
  if (!toolCall.result) return null
  
  const { success, message, customer, offer, invoice, customers, offers, invoices } = toolCall.result
  
  if (!success) {
    return (
      <div className="text-red-600 text-sm">
        ❌ {message || 'Fehler beim Ausführen der Aktion'}
      </div>
    )
  }
  
  return (
    <div className="text-green-600 text-sm">
      ✅ {message}
      {customer && (
        <div className="mt-1 text-xs text-gray-600">
          {customer.firstName} {customer.lastName} ({customer.isProspect ? 'Interessent' : 'Kunde'})
        </div>
      )}
      {offer && (
        <div className="mt-1 text-xs text-gray-600">
          Angebot {offer.offerNumber} - {offer.totalCost}€
        </div>
      )}
      {invoice && (
        <div className="mt-1 text-xs text-gray-600">
          Rechnung {invoice.invoiceNumber} - {invoice.totalAmount}€
        </div>
      )}
    </div>
  )
}

function formatToolCallDescription(toolCall: ToolCall) {
  switch (toolCall.name) {
    case 'createCustomer':
      const { firstName, lastName, isProspect } = toolCall.parameters
      return `${isProspect ? 'Interessent' : 'Kunde'} "${firstName} ${lastName}" erstellen`
    case 'createOffer':
      return `Angebot erstellen (${toolCall.parameters.totalCost || 0}€)`
    case 'createInvoice':
      return `Rechnung erstellen (${toolCall.parameters.totalAmount || 0}€)`
    case 'getCustomers':
      return toolCall.parameters.search ? `Kunden suchen: "${toolCall.parameters.search}"` : 'Alle Kunden laden'
    case 'updateCustomer':
      return 'Kundendaten aktualisieren'
    case 'deleteCustomer':
      return 'Kunde löschen'
    case 'getOffers':
      return 'Angebote laden'
    case 'getInvoices':
      return 'Rechnungen laden'
    default:
      return `${toolCall.name} ausführen`
  }
}

export default function ChatBubble({ role, content, timestamp, actions, toolCalls }: ChatBubbleProps) {
  const isUser = role === 'user'
  
  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex flex-col', isUser ? 'items-end' : 'items-start', 'max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl')}>
        {/* Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3 shadow-soft border',
            isUser 
              ? 'bg-surface border-border ml-4' 
              : 'bg-white border-border mr-4'
          )}
        >
          {content && (
            <div className="text-[15px] leading-6">
              <MarkdownText className="text-[15px] leading-6">
                {processHandwerkerText(content)}
              </MarkdownText>
            </div>
          )}
          
          {/* Tool calls display */}
          {toolCalls && toolCalls.length > 0 && (
            <div className={cn('space-y-3', content ? 'mt-3 pt-3 border-t border-gray-200' : '')}>
              {toolCalls.map((toolCall, index) => (
                <div key={toolCall.id || index} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    🔧 {formatToolCallDescription(toolCall)}
                  </div>
                  {toolCall.result && formatToolCallResult(toolCall)}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        <div className={cn('mt-1 px-2 text-xs text-muted', isUser ? 'mr-1' : 'ml-1')}>
          {timestamp.toLocaleTimeString('de-DE', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
        
        {/* Actions for AI messages */}
        {!isUser && actions && (
          <div className="mt-3 mr-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}