import { NextRequest, NextResponse } from "next/server"

import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { SupportService } from "@/lib/services/admin/support-service"
import { chatCompleteWithOptions } from "@/lib/services/ai/provider"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const token = request.cookies.get("admin-auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const payload = await AdminJWTService.verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const text: string = body?.text || ""

    let prompt

    if (text.trim()) {
      // Modo mejorar borrador escrito por el agente
      prompt = [
        {
          role: "system" as const,
          content:
            "Actúas como AGENTE DE SOPORTE de la empresa. Solo debes reescribir el mensaje dado, " +
            "manteniendo el mismo significado y contexto, mejorando ortografía, gramática y claridad en ESPAÑOL. " +
            "No agregues información nueva, no cambies las políticas ni el contenido técnico. " +
            "Escribe la respuesta como la escribiría un agente de soporte profesional, usando un tono cercano y respetuoso. " +
            "Si el nombre del cliente aparece en el contexto puedes usarlo SOLO en el saludo inicial, " +
            "pero NO añadas firmas ni cierres como 'Atentamente' ni nombres (ni del agente ni del cliente). " +
            "Devuelve únicamente el mensaje mejorado, sin explicaciones adicionales.",
        },
        {
          role: "user" as const,
          content: text,
        },
      ]
    } else {
      // Modo "responder con IA": generar una nueva respuesta al último mensaje del cliente
      const ticket = await SupportService.getTicketById(id)

      if (!ticket) {
        return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
      }

      const comments = ticket.comments || []
      let lastCustomerMessage: string | null = null

      for (let i = comments.length - 1; i >= 0; i--) {
        const c = comments[i] as any
        if (c.authorType !== "admin") {
          lastCustomerMessage = c.content || null
          break
        }
      }

      const baseContext =
        `Asistes en un ticket de soporte con título: "${ticket.title}".` +
        (ticket.description ? ` Descripción original del ticket: "${ticket.description}".` : "")

      const customerContext = lastCustomerMessage
        ? `\n\nÚltimo mensaje del cliente (lo que debes responder): "${lastCustomerMessage}".`
        : "\n\nNo hay mensajes previos del cliente, genera un primer mensaje de respuesta basado en la descripción."

      prompt = [
        {
          role: "system" as const,
          content:
            "Actúas como AGENTE DE SOPORTE de la empresa. Debes redactar una respuesta completa y profesional en ESPAÑOL " +
            "para enviar al cliente en el contexto del ticket descrito. " +
            "Usa un tono empático, claro y conciso. No inventes datos técnicos que no estén en el contexto, " +
            "pero puedes hacer preguntas aclaratorias si es necesario. " +
            "Si el nombre del cliente aparece en el contexto puedes usarlo SOLO en el saludo inicial, " +
            "pero NO añadas firmas ni cierres como 'Atentamente' ni nombres (ni del agente ni del cliente). " +
            "Devuelve únicamente el mensaje de respuesta, sin explicaciones adicionales.",
        },
        {
          role: "user" as const,
          content: `${baseContext}${customerContext}`,
        },
      ]
    }

    const improved = await chatCompleteWithOptions(prompt, { temperature: 0.3 })

    return NextResponse.json({ success: true, text: improved, ticketId: id })
  } catch (error) {
    console.error("Error mejorando comentario de soporte (admin):", error)
    return NextResponse.json({ error: "No se pudo mejorar el texto con IA" }, { status: 500 })
  }
}


