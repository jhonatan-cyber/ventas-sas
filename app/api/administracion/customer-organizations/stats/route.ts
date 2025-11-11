import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { AdminJWTService } from "@/lib/auth/admin-jwt";
import { CustomerOrganizationService } from "@/lib/services/admin/customer-organization-service";
import { AuthService } from "@/lib/services/auth-service";

export async function GET(_request: NextRequest) {
  try {
    // Autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get("admin-auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await AdminJWTService.verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: "Token inválido o sin usuario" },
        { status: 401 }
      );
    }

    const profile = await AuthService.getProfileById(payload.userId);
    if (!profile || !profile.isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener estadísticas
    const stats = await CustomerOrganizationService.getStats();

    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    console.error(
      "Error en GET /api/administracion/customer-organizations/stats:",
      error
    );
    return NextResponse.json(
      { error: error.message || "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
