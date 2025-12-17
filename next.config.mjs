/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    // Habilitar optimización de imágenes
    unoptimized: false,
    
    // Formatos modernos (AVIF y WebP son más eficientes)
    formats: ['image/avif', 'image/webp'],
    
    // Tamaños de imagen permitidos para optimización
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Dominios remotos permitidos (agregar según necesidad)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com', // Para S3/AWS
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com', // Para Cloudinary
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Para Supabase Storage
      },
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com', // Para Vercel Blob
      },
      // Agregar más dominios según tu proveedor de imágenes
    ],
    
    // Calidad de imagen (1-100, default: 75)
    // Balance entre calidad y tamaño de archivo
    minimumCacheTTL: 60, // Cache por 60 segundos mínimo
    
    // Configuración adicional para producción
    dangerouslyAllowSVG: true, // Permitir SVG (usar con precaución)
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

export default nextConfig
