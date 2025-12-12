import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SessionsPageClient } from "@/components/admin/sessions/sessions-page-client"

export default async function SessionsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-auth-token')?.value

  if (!token) {
    redirect('/administracion/login')
  }

  return <SessionsPageClient />
}