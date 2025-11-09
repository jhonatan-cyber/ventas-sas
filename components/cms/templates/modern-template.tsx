interface ModernTemplateProps {
  title: string
  content: string
  excerpt?: string | null
  publishedAt?: Date | null
}

export function ModernTemplate({ title, content, excerpt, publishedAt }: ModernTemplateProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      {/* Hero with gradient */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-800 dark:via-purple-800 dark:to-pink-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
              {title}
            </h1>
            {excerpt && (
              <p className="text-xl md:text-2xl text-white/90 mb-6 max-w-2xl mx-auto">
                {excerpt}
              </p>
            )}
            {publishedAt && (
              <div className="text-sm text-white/80">
                <time dateTime={publishedAt.toISOString()}>
                  {new Date(publishedAt).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </time>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-16 -mt-8 relative z-10">
        <article className="max-w-4xl mx-auto bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl p-8 md:p-12">
          <div
            className="prose prose-lg dark:prose-invert max-w-none cms-content
              [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-gray-900 [&_h1]:dark:text-white
              [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:text-gray-900 [&_h2]:dark:text-white
              [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:text-gray-900 [&_h3]:dark:text-white
              [&_p]:mb-6 [&_p]:text-gray-700 [&_p]:dark:text-gray-300 [&_p]:text-lg [&_p]:leading-relaxed
              [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-6
              [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-6
              [&_li]:mb-2
              [&_a]:text-indigo-600 [&_a]:dark:text-indigo-400 [&_a]:underline [&_a]:hover:text-indigo-800 [&_a]:dark:hover:text-indigo-300
              [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-8 [&_img]:shadow-xl
              [&_strong]:font-bold
              [&_em]:italic"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </article>
      </div>
    </div>
  )
}

