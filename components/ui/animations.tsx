"use client"

import { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface FadeInProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 duration-500",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

interface SlideInProps {
  children: ReactNode
  direction?: "left" | "right" | "up" | "down"
  delay?: number
  className?: string
}

export function SlideIn({ children, direction = "up", delay = 0, className }: SlideInProps) {
  const directionClasses = {
    left: "slide-in-from-left-4",
    right: "slide-in-from-right-4",
    up: "slide-in-from-bottom-4",
    down: "slide-in-from-top-4",
  }

  return (
    <div
      className={cn(
        "animate-in fade-in duration-500",
        directionClasses[direction],
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

interface StaggerContainerProps {
  children: ReactNode
  className?: string
}

export function StaggerContainer({ children, className }: StaggerContainerProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {children}
    </div>
  )
}

