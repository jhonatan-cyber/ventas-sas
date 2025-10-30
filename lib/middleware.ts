import { NextResponse, type NextRequest } from "next/server"
import { JWTService } from "./auth/jwt"

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  })

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    '/',
    '/administracion/login'
  ]

  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Si es una ruta pública, permitir acceso
  if (isPublicRoute) {
    return response
  }

  // Verificar autenticación para rutas protegidas
  const token = JWTService.getTokenFromCookies(request.headers.get('cookie') || '')
  
  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = '/administracion/login'
    return NextResponse.redirect(url)
  }

  // Verificar si el token es válido
  const user = await JWTService.getAuthenticatedUser(token)
  
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/administracion/login'
    return NextResponse.redirect(url)
  }

  // Verificar si es super admin para rutas de administración
  const isAdminRoute = request.nextUrl.pathname.startsWith('/administracion') || request.nextUrl.pathname.startsWith('/admin')
  if (isAdminRoute && !user.isSuperAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Agregar información del usuario a los headers para uso en las páginas
  response.headers.set('x-user-id', user.id)
  response.headers.set('x-user-email', user.email || '')
  response.headers.set('x-user-role', user.role)
  response.headers.set('x-is-super-admin', user.isSuperAdmin.toString())

  return response
}

// Función para verificar autenticación (para uso futuro)
export async function verifyAuth(request: NextRequest) {
  try {
    // TODO: Implementar verificación de JWT
    // const token = request.cookies.get('auth-token')?.value
    // if (!token) return null
    
    // const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    // const user = await AuthService.getProfileById(decoded.userId)
    // return user
    
    return null
  } catch (error) {
    return null
  }
}

// Función para verificar si es super admin (para uso futuro)
export async function verifySuperAdmin(request: NextRequest) {
  try {
    // TODO: Implementar verificación de super admin
    // const user = await verifyAuth(request)
    // if (!user) return false
    
    // return user.isSuperAdmin
    
    return false
  } catch (error) {
    return false
  }
}
