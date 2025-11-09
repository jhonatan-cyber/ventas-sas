"use client"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface PhotoUploadProps {
  currentPhoto?: string | null
  onPhotoChange: (photoUrl: string | null) => void
  userId?: string
  disabled?: boolean
  fullName?: string | null
}

export function PhotoUpload({
  currentPhoto,
  onPhotoChange,
  userId,
  disabled = false,
  fullName,
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhoto || null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sincronizar preview con currentPhoto cuando cambie desde fuera
  useEffect(() => {
    setPreview(currentPhoto || null)
  }, [currentPhoto])

  const getInitials = () => {
    if (fullName) {
      const parts = fullName.split(" ")
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return fullName.slice(0, 2).toUpperCase()
    }
    return "U"
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de archivo no permitido', {
        description: 'Use JPEG, PNG o WebP',
      })
      return
    }

    // Validar tamaño (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Archivo demasiado grande', {
        description: 'El tamaño máximo es 5MB',
      })
      return
    }

    // Mostrar preview inmediatamente
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Subir archivo
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)

      const response = await fetch('/api/administracion/users/upload-photo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir la foto')
      }

      // Actualizar preview con la URL de la foto
      setPreview(data.photoUrl)
      onPhotoChange(data.photoUrl)
      toast.success('Foto subida correctamente')
    } catch (error: any) {
      console.error('Error subiendo foto:', error)
      toast.error('Error al subir la foto', {
        description: error.message || 'Intente nuevamente',
      })
      // Revertir preview
      setPreview(currentPhoto || null)
    } finally {
      setUploading(false)
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemovePhoto = () => {
    setPreview(null)
    onPhotoChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.success('Foto eliminada')
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="w-24 h-24 border-2 border-gray-200 dark:border-gray-700">
        <AvatarImage src={preview || undefined} alt="Foto de perfil" />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-semibold">
          {getInitials()}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-2 items-center">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
          id="photo-upload"
        />
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="rounded-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {preview ? 'Cambiar Foto' : 'Subir Foto'}
              </>
            )}
          </Button>

          {preview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemovePhoto}
              disabled={disabled || uploading}
              className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <X className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          JPEG, PNG o WebP. Máximo 5MB
        </p>
      </div>
    </div>
  )
}

