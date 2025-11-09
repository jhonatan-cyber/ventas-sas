interface MinimalTemplateProps {
  title: string
  content: string
  excerpt?: string | null
  publishedAt?: Date | null
}

export function MinimalTemplate({ title, content, excerpt, publishedAt }: MinimalTemplateProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <article className="max-w-3xl mx-auto">
          <header className="mb-12 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              {title}
            </h1>
            {excerpt && (
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 italic max-w-2xl mx-auto">
                {excerpt}
              </p>
            )}
            {publishedAt && (
              <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                <time dateTime={publishedAt.toISOString()}>
                  {new Date(publishedAt).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </time>
              </div>
            )}
          </header>

          <div
            className="prose prose-lg dark:prose-invert max-w-none cms-content
              [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-gray-900 [&_h1]:dark:text-white
              [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:text-gray-900 [&_h2]:dark:text-white
              [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:text-gray-900 [&_h3]:dark:text-white
              [&_p]:mb-6 [&_p]:text-gray-700 [&_p]:dark:text-gray-300 [&_p]:text-lg [&_p]:leading-relaxed
              [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-6
              [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-6
              [&_li]:mb-2
              [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_a]:hover:text-blue-800 [&_a]:dark:hover:text-blue-300
              [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-8 [&_img]:shadow-lg
              [&_strong]:font-bold
              [&_em]:italic"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </article>
      </div>
    </div>
  )
}

