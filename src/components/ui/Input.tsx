import { InputHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helper, ...props }, ref) => {
    const generatedId = useId()
    const inputId = props.id || generatedId
    
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-900"
          >
            {label}
          </label>
        )}
        
        <input
          id={inputId}
          type={type}
          className={cn(
            'flex h-11 w-full rounded-lg border border-border bg-white px-4 py-2 text-[15px]',
            'placeholder:text-muted',
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

Input.displayName = 'Input'

export { Input }