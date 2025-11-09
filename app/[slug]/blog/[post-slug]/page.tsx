import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CmsService } from "@/lib/services/admin/cms-service"
import { Calendar, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default async function CmsBlogPostView({
  params,
}: {
  params: Promise<{ slug: string; "post-slug": string }>
}) {
  const { slug, "post-slug": postSlug } = await params

  // Verificar que la organización existe
  const organization = await prisma.organization.findUnique({
    where: { slug },
    include: {
      customerOrganizations: {
        where: { isActive: true },
        include: {
          customer: true
        }
      }
    }
  })

  if (!organization) {
    redirect('/')
  }

  // Verificar que tenga al menos una relación activa con un cliente activo
  const activeCustomerOrgs = organization.customerOrganizations.filter(
    co => co.isActive && co.customer && co.customer.isActive && !co.customer.deletedAt
  )

  if (activeCustomerOrgs.length === 0) {
    redirect('/')
  }

  // Verificar si existe una suscripción activa
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      organizationId: organization.id,
      status: {
        in: ['active', 'trial']
      },
      OR: [
        { endDate: null },
        { endDate: { gt: new Date() } }
      ]
    }
  })

  if (!activeSubscription) {
    redirect(`/${slug}/en-mantenimiento`)
  }

  // Obtener el post de blog por slug
  const post = await CmsService.getBlogPostBySlug(postSlug, organization.id)

  // Si no existe o no está publicado, mostrar 404
  if (!post || !post.isPublished) {
    notFound()
  }

  // Incrementar contador de vistas (opcional, puede hacerse en background)
  // Por ahora solo mostramos el valor actual

  // Renderizar el post
  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <article className="max-w-4xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {post.category && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {post.category}
                </Badge>
              )}
              {post.publishedAt && (
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={post.publishedAt.toISOString()}>
                    {new Date(post.publishedAt).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </time>
                </div>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-gray-600 dark:text-gray-400 italic mb-6">
                {post.excerpt}
              </p>
            )}

            {post.featuredImage && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
          </header>

          <div
            className="prose prose-lg dark:prose-invert max-w-none cms-content
              [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-gray-900 [&_h1]:dark:text-white
              [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:text-gray-900 [&_h2]:dark:text-white
              [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:text-gray-900 [&_h3]:dark:text-white
              [&_p]:mb-4 [&_p]:text-gray-700 [&_p]:dark:text-gray-300
              [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4
              [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4
              [&_li]:mb-2
              [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline
              [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4
              [&_strong]:font-bold
              [&_em]:italic"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.tags && post.tags.length > 0 && (
            <footer className="mt-8 pt-6 border-t border-gray-200 dark:border-[#2a2a2a]">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </footer>
          )}
        </article>
      </div>
    </div>
  )
}

