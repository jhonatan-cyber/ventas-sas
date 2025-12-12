"use client"

import { m } from 'framer-motion'
import { ReactNode } from 'react'
import { Table, TableBody, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface AnimatedTableProps {
  children: ReactNode
  className?: string
}

interface AnimatedTableRowProps extends AnimatedTableProps {
  delay?: number
  hover?: boolean
}

export function AnimatedTable({ children, className }: AnimatedTableProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      <Table>
        {children}
      </Table>
    </m.div>
  )
}

export function AnimatedTableHeader({ children, className }: AnimatedTableProps) {
  return (
    <m.thead
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={className}
    >
      <TableHeader>
        {children}
      </TableHeader>
    </m.thead>
  )
}

export function AnimatedTableBody({ children, className }: AnimatedTableProps) {
  return (
    <m.tbody
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={className}
    >
      <TableBody>
        {children}
      </TableBody>
    </m.tbody>
  )
}

export function AnimatedTableRow({ 
  children, 
  className, 
  delay = 0, 
  hover = true 
}: AnimatedTableRowProps) {
  return (
    <m.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.3, 
        delay,
        ease: 'easeOut' 
      }}
      whileHover={hover ? { 
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        transition: { duration: 0.2 }
      } : undefined}
      className={cn(
        "transition-colors duration-200",
        className
      )}
    >
      <TableRow>
        {children}
      </TableRow>
    </m.tr>
  )
}

// Variantes para animaciones más complejas
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0
  }
}

// Tabla con stagger automático
export function StaggeredTable({ 
  children, 
  className 
}: { 
  children: ReactNode[], 
  className?: string 
}) {
  return (
    <m.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children.map((child, index) => (
        <m.div
          key={index}
          variants={itemVariants}
        >
          {child}
        </m.div>
      ))}
    </m.div>
  )
}