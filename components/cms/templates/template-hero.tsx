"use client"

interface TemplateHeroProps {
  title: string
  excerpt?: string | null
  content: string
  organizationName?: string
}

export function TemplateHero({ title, excerpt, content, organizationName }: TemplateHeroProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {organizationName && (
              <div className="mb-6">
                <span className="text-sm md:text-base text-gray-400 uppercase tracking-wider">
                  {organizationName}
                </span>
              </div>
            )}
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              {title}
            </h1>
            
            {excerpt && (
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                {excerpt}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#content"
                className="px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                Explorar
              </a>
              <a
                href="#content"
                className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors"
              >
                Saber más
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div id="content" className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div
            className="prose prose-lg prose-invert max-w-none
              [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:mb-6 [&_h1]:text-white
              [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:mb-4 [&_h2]:text-white
              [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:mb-3 [&_h3]:text-white
              [&_p]:mb-6 [&_p]:text-gray-300 [&_p]:text-lg [&_p]:leading-relaxed
              [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-6 [&_ul]:text-gray-300
              [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-6 [&_ol]:text-gray-300
              [&_li]:mb-2
              [&_a]:text-blue-400 [&_a]:hover:text-blue-300 [&_a]:underline
              [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-8 [&_img]:shadow-2xl
              [&_strong]:font-bold [&_strong]:text-white
              [&_em]:italic"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </div>
  )
}

