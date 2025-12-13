import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://smartpos.bo'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/administracion/',
          '/*/dashboard',
          '/*/login',
          '/*/perfil',
          '/*/configuracion',
          '/*/_next/',
          '/private/',
          '/admin/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/administracion/',
          '/*/dashboard',
          '/*/login',
          '/*/perfil',
          '/*/configuracion',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}