interface BusinessTemplateProps {
  title: string
  content: string
  excerpt?: string | null
  publishedAt?: Date | null
}

export function BusinessTemplate({ title, content, excerpt, publishedAt }: BusinessTemplateProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      {/* Header Section */}
      <header className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {title}
            </h1>
            {excerpt && (
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                {excerpt}
              </p>
            )}
            {publishedAt && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
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
      </header>

      {/* Content Section */}
      <main className="py-12">
        <div className="container mx-auto px-4">
          <article className="max-w-4xl mx-auto bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm p-8 md:p-12">
            <div
              className="prose prose-lg dark:prose-invert max-w-none cms-content
                [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-gray-900 [&_h1]:dark:text-white
                [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:text-gray-900 [&_h2]:dark:text-white
                [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:text-gray-900 [&_h3]:dark:text-white
                [&_p]:mb-6 [&_p]:text-gray-700 [&_p]:dark:text-gray-300 [&_p]:text-base [&_p]:leading-relaxed
                [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-6
                [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-6
                [&_li]:mb-2
                [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_a]:hover:text-blue-800 [&_a]:dark:hover:text-blue-300
                [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-8 [&_img]:shadow-md
                [&_strong]:font-bold
                [&_em]:italic"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </article>
        </div>
      </main>
    </div>
  )
}

