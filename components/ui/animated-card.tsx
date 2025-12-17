"use client"

import { m } from 'framer-motion'
import { ReactNode } from 'react'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function AnimatedCard({ 
  children, 
  className, 
  delay = 0, 
  hover = true,
  onClick,
  onMouseEnter,
  onMouseLeave
}: AnimatedCardProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: 'easeOut' 
      }}
      whileHover={hover ? { 
        y: -4, 
        scale: 1.02,
        transition: { duration: 0.2 }
      } : undefined}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn("h-full", className)}
    >
      <Card className="h-full transition-shadow duration-200 hover:shadow-lg">
        {children}
      </Card>
    </m.div>
  )
}

// Componentes específicos con animaciones
export function AnimatedCardHeader({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <m.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <CardHeader className={className}>
        {children}
      </CardHeader>
    </m.div>
  )
}

export function AnimatedCardContent({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <CardContent className={className}>
        {children}
      </CardContent>
    </m.div>
  )
}

export function AnimatedCardFooter({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <CardFooter className={className}>
        {children}
      </CardFooter>
    </m.div>
  )
}

// Grid de cards con stagger
export function AnimatedCardGrid({ 
  children, 
  className,
  staggerDelay = 0.1 
}: { 
  children: ReactNode[], 
  className?: string,
  staggerDelay?: number 
}) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <m.div
          key={index}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4, 
            delay: index * staggerDelay,
            ease: 'easeOut' 
          }}
        >
          {child}
        </m.div>
      ))}
    </div>
  )
}