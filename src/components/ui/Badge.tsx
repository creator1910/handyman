import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'draft' | 'sent' | 'accepted' | 'declined' | 'paid' | 'prospect' | 'customer'
  size?: 'sm' | 'md'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center rounded-full font-medium'
    
    const variants = {
      default: 'bg-gray-100 text-gray-800',
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-50 text-blue-700 border border-blue-200',
      accepted: 'bg-green-50 text-green-700 border border-green-200',
      declined: 'bg-red-50 text-red-700 border border-red-200',
      paid: 'bg-sky-50 text-sky-700 border border-sky-200',
      prospect: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      customer: 'bg-green-50 text-green-700 border border-green-200'
    }
    
    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm'
    }

    return (
      <span
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }