"use client"

interface TemplateMinimalProps {
  title: string
  excerpt?: string | null
  content: string
  organizationName?: string
}

export function TemplateMinimal({ title, excerpt, content, organizationName }: TemplateMinimalProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <article className="max-w-3xl mx-auto">
          <header className="mb-12 text-center">
            {organizationName && (
              <div className="mb-4">
                <span className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {organizationName}
                </span>
              </div>
            )}
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {title}
            </h1>
            
            {excerpt && (
              <p className="text-xl text-gray-600 dark:text-gray-400 italic max-w-2xl mx-auto">
                {excerpt}
              </p>
            )}
          </header>

          <div
            className="prose prose-lg dark:prose-invert max-w-none
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
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </article>
      </div>
    </div>
  )
}

