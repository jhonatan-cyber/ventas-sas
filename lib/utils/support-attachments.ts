import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

export interface SavedSupportAttachment {
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_PREFIXES = ['image/', 'application/pdf', 'text/plain']

function getMaxSize() {
  const envValue = process.env.SUPPORT_ATTACHMENT_MAX_BYTES
  if (!envValue) return DEFAULT_MAX_SIZE
  const parsed = Number(envValue)
  return Number.isFinite(parsed) ? parsed : DEFAULT_MAX_SIZE
}

export function validateSupportAttachment(file: File) {
  const maxSize = getMaxSize()
  if (file.size > maxSize) {
    throw new Error(`El archivo ${file.name} supera el límite de ${(maxSize / (1024 * 1024)).toFixed(1)}MB`)
  }

  if (!ALLOWED_MIME_PREFIXES.some((prefix) => (file.type || '').startsWith(prefix))) {
    throw new Error(`El tipo de archivo ${file.type || 'desconocido'} no está permitido`)
  }
}

export async function saveSupportAttachment(
  file: File,
  organizationSlug: string,
  ticketId: string
): Promise<SavedSupportAttachment> {
  validateSupportAttachment(file)

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'support', organizationSlug, ticketId)
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true })
  }

  const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const timeStamp = Date.now()
  const fileName = `${timeStamp}-${sanitizedOriginalName}`
  const filePath = path.join(uploadsDir, fileName)

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  await writeFile(filePath, buffer)

  return {
    fileName,
    filePath: `/uploads/support/${organizationSlug}/${ticketId}/${fileName}`,
    fileSize: buffer.length,
    mimeType: file.type || 'application/octet-stream',
  }
}

