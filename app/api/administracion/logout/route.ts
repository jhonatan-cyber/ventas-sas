import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.set('admin-auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
  
  // Nota: El cliente debe limpiar el caché de permisos en sessionStorage
  // Esto se hace automáticamente cuando el PermissionsProvider detecta que no hay sesión
  return res
}


