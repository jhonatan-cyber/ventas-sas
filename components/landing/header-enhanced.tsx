"use client"

import { BarChart3, Menu, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { ThemeToggle } from "./theme-toggle"

interface HeaderProps {
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

const navItems = [
  { href: "#features", label: "Funcionalidades" },
  { href: "#beneficios", label: "Beneficios" },
  { href: "#precios", label: "Precios" },
  { href: "#faq", label: "FAQ" }
]

export function HeaderEnhanced({ mobileMenuOpen, setMobileMenuOpen }: HeaderProps) {
  const [activeSection, setActiveSection] = useState("")
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)

      const sections = navItems.map(item => item.href.substring(1))
      const currentSection = sections.find(section => {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          return rect.top <= 100 && rect.bottom >= 100
        }
        return false
      })

      if (currentSection) {
        setActiveSection(`#${currentSection}`)
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${scrolled
        ? "border-border/60 bg-background/98 backdrop-blur-xl shadow-lg"
        : "border-border/40 bg-background/95 backdrop-blur-xl"
        } supports-[backdrop-filter]:bg-background/70`}
    >
      <div className="container mx-auto max-w-7xl relative flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer group">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 shadow-lg transition-all duration-300 ${scrolled ? "shadow-blue-500/30" : "shadow-blue-500/20"
            } group-hover:shadow-emerald-500/40 group-hover:scale-105`}>
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-600 bg-clip-text text-transparent leading-tight">
              SmartPOS
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center justify-center flex-1">
          <div className="flex items-center gap-1 bg-muted/30 rounded-full p-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${activeSection === item.href
                  ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />

        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/98 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
          <div className="container px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors ${activeSection === item.href
                  ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t my-4" />
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm font-medium text-muted-foreground">Tema</span>
              <ThemeToggle />
            </div>

          </div>
        </div>
      )}
    </header>
  )
}
