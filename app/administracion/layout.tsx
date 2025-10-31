import { ThemeProvider } from "@/components/theme-provider"

export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="admin-theme">
      {children}
    </ThemeProvider>
  )
}


