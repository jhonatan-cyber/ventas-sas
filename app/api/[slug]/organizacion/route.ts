import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { handleApiError, createErrorContext } from "@/lib/utils/error-handler";
import { getCurrentSasUser } from "@/lib/utils/get-current-user";

export const runtime = "nodejs";

// GET - Obtener información de la organización
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug de organización requerido" },
        { status: 400 }
      );
    }

    // Verificar autenticación (no fallar si no está autenticado, solo retornar datos básicos)
    try {
      await getCurrentSasUser(request, slug);
    } catch (authError) {
      // Si hay error de autenticación, continuar sin usuario (para casos de carga inicial)
      console.warn("Error de autenticación en GET /organizacion:", authError);
    }

    // Obtener información de la organización directamente por slug (sin validaciones complejas)
    let organization: any = null;

    try {
      organization = await prisma.organization.findUnique({
        where: { slug },
        select: {
          id: true,
          name: true,
          razonSocial: true,
          nit: true,
          phone: true,
          address: true,
          website: true,
          owner: {
            select: {
              fullName: true,
            },
          },
          whiteLabelBranding: {
            select: {
              logoUrl: true,
            },
          },
        },
      } as any);
    } catch (dbError) {
      console.error("Error consultando organización:", dbError);
      return NextResponse.json(
        {
          error: "Error al consultar organización",
          details:
            dbError instanceof Error ? dbError.message : "Error desconocido",
        },
        { status: 500 }
      );
    }

    if (!organization) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        razonSocial: organization.razonSocial,
        nit: organization.nit,
        phone: organization.phone,
        address: organization.address,
        website: organization.website || null,
        logoUrl: organization.whiteLabelBranding?.logoUrl || null,
        ownerName: organization.owner ? `${organization.owner.nombre} ${organization.owner.apellido}` : null,
      },
    });
  } catch (error) {
    console.error("Error inesperado en GET /organizacion:", error);
    return handleApiError(
      error,
      createErrorContext(request, { action: "GET_ORGANIZATION" })
    );
  }
}
