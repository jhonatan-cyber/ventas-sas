"use client"

interface TemplateBusinessProps {
  title: string
  excerpt?: string | null
  content: string
  organizationName?: string
}

export function TemplateBusiness({ title, excerpt, content, organizationName }: TemplateBusinessProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      {/* Top Bar */}
      <div className="bg-gray-900 dark:bg-black text-white py-3">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            {organizationName && (
              <span className="text-sm font-medium">{organizationName}</span>
            )}
            <div className="flex gap-4 text-sm">
              <a href="#" className="hover:text-gray-300">Contacto</a>
              <a href="#" className="hover:text-gray-300">Sobre Nosotros</a>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white dark:from-[#2a2a2a] dark:to-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a]">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              {title}
            </h1>
            
            {excerpt && (
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                {excerpt}
              </p>
            )}
            
            <div className="flex flex-wrap gap-4">
              <a
                href="#content"
                className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Comenzar
              </a>
              <a
                href="#content"
                className="px-6 py-3 border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Más información
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div id="content" className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
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
              [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_img]:shadow-md
              [&_strong]:font-bold
              [&_em]:italic"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </div>
  )
}

