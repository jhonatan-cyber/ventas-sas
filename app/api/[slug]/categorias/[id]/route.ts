import { NextRequest, NextResponse } from 'next/server'
import { CategoryService } from '@/lib/services/sales/category-service'

// GET - Obtener categoría por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params
    const category = await CategoryService.getCategoryById(id)
    
    if (!category) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error al obtener categoría:', error)
    return NextResponse.json(
      { error: 'Error al obtener la categoría' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar categoría
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, isActive } = body

    const category = await CategoryService.updateCategory(id, {
      name,
      description,
      isActive
    })

    return NextResponse.json(category)
  } catch (error: any) {
    console.error('Error al actualizar categoría:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar la categoría' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar categoría
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params
    await CategoryService.deleteCategory(id)
    return NextResponse.json({ message: 'Categoría eliminada correctamente' })
  } catch (error: any) {
    console.error('Error al eliminar categoría:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar la categoría' },
      { status: 500 }
    )
  }
}

