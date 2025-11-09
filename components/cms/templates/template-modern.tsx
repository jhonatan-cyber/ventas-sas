"use client"

interface TemplateModernProps {
  title: string
  excerpt?: string | null
  content: string
  organizationName?: string
}

export function TemplateModern({ title, excerpt, content, organizationName }: TemplateModernProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#1a1a1a] dark:to-[#0a0a0a]">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            {organizationName && (
              <div className="mb-4">
                <span className="text-sm md:text-base text-blue-100 uppercase tracking-wider font-medium">
                  {organizationName}
                </span>
              </div>
            )}
            
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
              {title}
            </h1>
            
            {excerpt && (
              <p className="text-xl md:text-2xl text-blue-50 max-w-2xl mx-auto leading-relaxed">
                {excerpt}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl p-8 md:p-12">
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
                [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-6 [&_img]:shadow-lg
                [&_strong]:font-bold
                [&_em]:italic"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

