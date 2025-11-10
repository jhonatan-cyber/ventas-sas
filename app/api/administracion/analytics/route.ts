import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { AdminAnalyticsService } from '@/lib/services/admin/admin-analytics-service'
import { handleApiError } from '@/lib/utils/error-handler'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const payload = AdminJWTService.verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'growth'
    const days = parseInt(searchParams.get('days') || '90', 10)

    let data

    switch (type) {
      case 'growth':
        data = await AdminAnalyticsService.getOrganizationGrowth(days)
        break
      case 'revenue':
        data = await AdminAnalyticsService.getRevenueByPlan()
        break
      case 'users':
        data = await AdminAnalyticsService.getUserActivity(days)
        break
      default:
        return NextResponse.json(
          { error: 'Tipo de analytics no válido' },
          { status: 400 }
        )
    }

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}

