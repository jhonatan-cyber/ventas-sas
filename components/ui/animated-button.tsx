"use client"

import { ReactNode, forwardRef, memo } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AnimatedButtonProps extends React.ComponentProps<typeof Button> {
  children: ReactNode
  loading?: boolean
  pulse?: boolean
  bounce?: boolean
}

// Componente optimizado usando CSS en lugar de Framer Motion para mejor rendimiento
export const AnimatedButton = memo(forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className, loading, pulse, bounce: _bounce, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading

    return (
      <Button
        ref={ref}
        className={cn(
          // Animaciones CSS optimizadas con GPU acceleration
          "transform-gpu transition-all duration-150 ease-out",
          !isDisabled && "hover:scale-105 hover:-translate-y-0.5 active:scale-95",
          !isDisabled && "hover:shadow-lg",
          loading && "cursor-not-allowed opacity-70",
          pulse && "animate-pulse-scale",
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2 animate-spin" />
        )}
        {children}
      </Button>
    )
  }
))

AnimatedButton.displayName = "AnimatedButton"

// Botón con efecto de ondas - optimizado con CSS
export const RippleButton = memo(function RippleButton({ 
  children, 
  className, 
  onClick,
  ...props 
}: AnimatedButtonProps & { onClick?: (e: React.MouseEvent) => void }) {
  return (
    <Button
      className={cn(
        "relative overflow-hidden transform-gpu transition-all duration-150 active:scale-95",
        className
      )}
      onClick={(e) => {
        // Crear efecto de ondas de forma eficiente
        const button = e.currentTarget
        const rect = button.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height)
        const x = e.clientX - rect.left - size / 2
        const y = e.clientY - rect.top - size / 2
        
        const ripple = document.createElement("span") as HTMLSpanElement
        ripple.className = 'ripple-effect'
        ripple.style.width = `${size}px`
        ripple.style.height = `${size}px`
        ripple.style.left = `${x}px`
        ripple.style.top = `${y}px`
        
        button.appendChild(ripple)
        
        // Usar requestAnimationFrame para mejor rendimiento
        requestAnimationFrame(() => {
          setTimeout(() => ripple.remove(), 600)
        })
        
        onClick?.(e)
      }}
      {...props}
    >
      {children}
    </Button>
  )
})

// Botón flotante con animación - optimizado con CSS
export const FloatingActionButton = memo(function FloatingActionButton({ 
  children, 
  className,
  ...props 
}: AnimatedButtonProps) {
  return (
    <Button
      className={cn(
        "fixed bottom-6 right-6 z-50 rounded-full w-14 h-14",
        "shadow-lg hover:shadow-xl transition-all duration-200",
        "transform-gpu hover:scale-110 hover:rotate-3 active:scale-90",
        "animate-fab-enter",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
})