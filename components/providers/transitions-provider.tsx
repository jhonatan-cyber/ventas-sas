"use client"

import { LazyMotion, domAnimation } from 'framer-motion'
import { ReactNode } from 'react'

interface TransitionsProviderProps {
  children: ReactNode
}

/**
 * Provider global para optimizar las animaciones de Framer Motion
 * Usa LazyMotion para cargar solo las funciones de animación necesarias
 */
export function TransitionsProvider({ children }: TransitionsProviderProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  )
}

// Configuración global de transiciones
export const globalTransitions = {
  // Transiciones de página
  page: {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 1.02 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  },

  // Transiciones de modal
  modal: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  },

  // Transiciones de card
  card: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: { y: -4, scale: 1.02 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },

  // Transiciones de lista
  list: {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
      }
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }
  },

  // Transiciones de botón
  button: {
    hover: { scale: 1.05, y: -2 },
    tap: { scale: 0.95 },
    transition: { duration: 0.2 }
  },

  // Transiciones de input
  input: {
    focus: { scale: 1.01 },
    transition: { duration: 0.2 }
  }
}

// Configuración de reducción de movimiento
export const reducedMotionConfig = {
  initial: false,
  animate: { transition: { duration: 0.01 } },
  exit: { transition: { duration: 0.01 } },
  transition: { duration: 0.01 }
}

// Hook para detectar preferencia de movimiento reducido
export function useReducedMotion() {
  if (typeof window === 'undefined') return false
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}