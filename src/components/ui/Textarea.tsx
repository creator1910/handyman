import { TextareaHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helper?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helper, ...props }, ref) => {
    const generatedId = useId()
    const textareaId = props.id || generatedId
    
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-900"
          >
            {label}
          </label>
        )}
        
        <textarea
          id={textareaId}
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border border-border bg-white px-4 py-3 text-[15px]',
            'placeholder:text-muted resize-y',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface',
            error && 'border-status-declined focus-visible:ring-status-declined/30',
            className
          )}
          ref={ref}
          {...props}
        />
        
        {(error || helper) && (
          <p className={cn(
            'text-sm',
            error ? 'text-status-declined' : 'text-muted'
          )}>
            {error || helper}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }