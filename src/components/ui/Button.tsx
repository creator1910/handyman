import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth = false, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
    
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-600 active:bg-primary-700 shadow-soft',
      secondary: 'border border-border bg-white text-gray-900 hover:bg-surface active:bg-gray-50',
      tertiary: 'text-gray-700 hover:bg-surface active:bg-gray-100',
      success: 'bg-status-accepted text-white hover:bg-green-600 active:bg-green-700',
      danger: 'bg-status-declined text-white hover:bg-red-600 active:bg-red-700'
    }
    
    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-11 px-4',
      lg: 'h-12 px-6 text-base'
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }