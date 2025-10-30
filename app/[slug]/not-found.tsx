import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#1a1a1a]">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
            <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
            Cliente no encontrado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            El cliente que estás buscando no está registrado o se encuentra inactivo en nuestro sistema.
          </p>
        </div>
        <div className="pt-4">
          <Link href="/">
            <Button>
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

