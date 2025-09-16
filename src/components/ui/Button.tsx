import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth = false, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
    
    const variants = {
      primary: 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-sm',
      secondary: 'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 active:bg-gray-100 shadow-sm',
      tertiary: 'text-gray-700 hover:bg-gray-50 active:bg-gray-100',
      success: 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700 shadow-sm',
      danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm'
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