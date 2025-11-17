import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { ProfilePageClient } from "@/components/sales/profile/profile-page-client"
import { getCurrentSasUser } from "@/lib/utils/get-current-user"

export default async function PerfilPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const cookieStore = await cookies()

  // Crear un objeto request simulado para getCurrentSasUser
  const request = {
    cookies: {
      get: (name: string) => {
        const cookie = cookieStore.get(name)
        return cookie ? { value: cookie.value } : undefined
      }
    }
  } as any

  // Obtener usuario actual
  const user = await getCurrentSasUser(request, slug)

  if (!user) {
    redirect(`/${slug}/login`)
  }

  return <ProfilePageClient initialUser={user} customerSlug={slug} />
}

