import { cn } from '@/lib/utils'

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actions?: React.ReactNode
}

export default function ChatBubble({ role, content, timestamp, actions }: ChatBubbleProps) {
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
          <div className="text-[15px] leading-6 whitespace-pre-wrap">
            {content}
          </div>
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