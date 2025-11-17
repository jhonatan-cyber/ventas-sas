/**
 * Sistema de traducción (i18n) para el sistema SAS
 * 
 * Soporta múltiples idiomas y lee la preferencia desde la base de datos
 */

import { useEffect, useState } from 'react'

// Cache en memoria para el idioma
let languageCache: Map<string, string> = new Map()

/**
 * Invalida el caché de idioma para un slug específico
 */
export function invalidateLanguageCache(slug: string): void {
  languageCache.delete(slug)
}

/**
 * Obtiene el idioma desde las preferencias
 * @param slug - El slug de la organización
 * @returns El código de idioma (por defecto 'es')
 */
export function getLanguage(slug: string): string {
  if (typeof window === 'undefined') {
    return 'es'
  }

  // Verificar caché
  const cached = languageCache.get(slug)
  if (cached) {
    return cached
  }

  // Intentar leer desde las preferencias (caché de preferences.ts)
  try {
    // Importar dinámicamente para evitar dependencias circulares
    const { readPreferences } = require('./preferences')
    const prefs = readPreferences(slug)
    if (prefs.language) {
      languageCache.set(slug, prefs.language)
      return prefs.language
    }
  } catch {
    // Si hay error, continuar con default
  }

  // Fallback: intentar desde cookies
  try {
    const raw = document.cookie.split('; ').find(c => c.startsWith(`sas-prefs-${slug}=`))?.split('=')[1]
    if (raw) {
      const prefs = JSON.parse(decodeURIComponent(raw))
      if (prefs.language) {
        languageCache.set(slug, prefs.language)
        return prefs.language
      }
    }
  } catch {
    // Si hay error, continuar con default
  }

  // Fallback: default
  const defaultLang = 'es'
  languageCache.set(slug, defaultLang)
  return defaultLang
}

/**
 * Obtiene el idioma desde la URL (para SSR)
 */
export function getLanguageFromUrl(): string {
  if (typeof window === 'undefined') return 'es'
  
  const pathname = window.location.pathname
  const match = pathname.match(/^\/([^/]+)/)
  return match ? getLanguage(match[1]) : 'es'
}

/**
 * Actualiza el caché de idioma cuando se actualizan las preferencias
 * Esta función debe ser llamada cuando se actualiza el idioma en las preferencias
 */
export function updateLanguageCache(slug: string, language: string): void {
  languageCache.set(slug, language)
  // Disparar evento para que los componentes se actualicen
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('language-updated', { detail: { slug, language } }))
  }
}

// Traducciones disponibles
const translations: Record<string, Record<string, string>> = {
  es: {
    // Navegación
    'nav.dashboard': 'Dashboard',
    'nav.quotations': 'Cotizaciones',
    'nav.sales': 'Ventas',
    'nav.products': 'Productos',
    'nav.customers': 'Clientes',
    'nav.expenses': 'Gastos',
    'nav.reports': 'Reportes',
    'nav.cashRegisters': 'Cajas',
    'nav.configuration': 'Configuración',
    'nav.users': 'Usuarios',
    'nav.roles': 'Roles',
    'nav.permissions': 'Permisos',
    'nav.branches': 'Sucursales',
    'nav.categories': 'Categorías',
    
    // Secciones del sidebar
    'sidebar.home': 'Inicio',
    'sidebar.operation': 'Operación',
    'sidebar.catalog': 'Catálogo',
    'sidebar.management': 'Gestión',
    'sidebar.reports': 'Reportes',
    
    // Acciones comunes
    'action.create': 'Crear',
    'action.edit': 'Editar',
    'action.delete': 'Eliminar',
    'action.save': 'Guardar',
    'action.cancel': 'Cancelar',
    'action.close': 'Cerrar',
    'action.search': 'Buscar',
    'action.filter': 'Filtrar',
    'action.export': 'Exportar',
    'action.view': 'Ver',
    'action.details': 'Detalles',
    
    // Estados
    'status.active': 'Activo',
    'status.inactive': 'Inactivo',
    'status.pending': 'Pendiente',
    'status.completed': 'Completado',
    'status.cancelled': 'Cancelado',
    'status.expired': 'Vencido',
    'status.converted': 'Convertido',
    
    // Mensajes
    'message.loading': 'Cargando...',
    'message.noData': 'No hay datos disponibles',
    'message.error': 'Error',
    'message.success': 'Éxito',
    'message.confirmDelete': '¿Estás seguro de que deseas eliminar?',
    'message.saved': 'Guardado correctamente',
    'message.deleted': 'Eliminado correctamente',
    'message.errorSaving': 'Error al guardar',
    'message.errorDeleting': 'Error al eliminar',
    
    // Formularios
    'form.required': 'Este campo es obligatorio',
    'form.invalid': 'Valor inválido',
    'form.name': 'Nombre',
    'form.email': 'Correo electrónico',
    'form.phone': 'Teléfono',
    'form.address': 'Dirección',
    'form.quantity': 'Cantidad',
    'form.price': 'Precio',
    'form.total': 'Total',
    'form.subtotal': 'Subtotal',
    'form.discount': 'Descuento',
    
    // Configuración
    'config.preferences': 'Preferencias',
    'config.currency': 'Moneda',
    'config.dateFormat': 'Formato de fecha',
    'config.language': 'Idioma',
    'config.themeColor': 'Color del sistema',
    'config.phoneCountryCode': 'Código de país para teléfonos',
    
    // Preferencias de idioma
    'language.es': 'Español',
    'language.en': 'English',
    'language.pt': 'Português',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.quotations': 'Quotations',
    'nav.sales': 'Sales',
    'nav.products': 'Products',
    'nav.customers': 'Customers',
    'nav.expenses': 'Expenses',
    'nav.reports': 'Reports',
    'nav.cashRegisters': 'Cash Registers',
    'nav.configuration': 'Configuration',
    'nav.users': 'Users',
    'nav.roles': 'Roles',
    'nav.permissions': 'Permissions',
    'nav.branches': 'Branches',
    'nav.categories': 'Categories',
    
    // Sidebar sections
    'sidebar.home': 'Home',
    'sidebar.operation': 'Operation',
    'sidebar.catalog': 'Catalog',
    'sidebar.management': 'Management',
    'sidebar.reports': 'Reports',
    
    // Common actions
    'action.create': 'Create',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.close': 'Close',
    'action.search': 'Search',
    'action.filter': 'Filter',
    'action.export': 'Export',
    'action.view': 'View',
    'action.details': 'Details',
    
    // Status
    'status.active': 'Active',
    'status.inactive': 'Inactive',
    'status.pending': 'Pending',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
    'status.expired': 'Expired',
    'status.converted': 'Converted',
    
    // Messages
    'message.loading': 'Loading...',
    'message.noData': 'No data available',
    'message.error': 'Error',
    'message.success': 'Success',
    'message.confirmDelete': 'Are you sure you want to delete?',
    'message.saved': 'Saved successfully',
    'message.deleted': 'Deleted successfully',
    'message.errorSaving': 'Error saving',
    'message.errorDeleting': 'Error deleting',
    
    // Forms
    'form.required': 'This field is required',
    'form.invalid': 'Invalid value',
    'form.name': 'Name',
    'form.email': 'Email',
    'form.phone': 'Phone',
    'form.address': 'Address',
    'form.quantity': 'Quantity',
    'form.price': 'Price',
    'form.total': 'Total',
    'form.subtotal': 'Subtotal',
    'form.discount': 'Discount',
    
    // Configuration
    'config.preferences': 'Preferences',
    'config.currency': 'Currency',
    'config.dateFormat': 'Date format',
    'config.language': 'Language',
    'config.themeColor': 'System color',
    'config.phoneCountryCode': 'Phone country code',
    
    // Language preferences
    'language.es': 'Español',
    'language.en': 'English',
    'language.pt': 'Português',
  },
  pt: {
    // Navegação
    'nav.dashboard': 'Painel',
    'nav.quotations': 'Cotações',
    'nav.sales': 'Vendas',
    'nav.products': 'Produtos',
    'nav.customers': 'Clientes',
    'nav.expenses': 'Despesas',
    'nav.reports': 'Relatórios',
    'nav.cashRegisters': 'Caixas',
    'nav.configuration': 'Configuração',
    'nav.users': 'Usuários',
    'nav.roles': 'Funções',
    'nav.permissions': 'Permissões',
    'nav.branches': 'Filiais',
    'nav.categories': 'Categorias',
    
    // Seções da barra lateral
    'sidebar.home': 'Início',
    'sidebar.operation': 'Operação',
    'sidebar.catalog': 'Catálogo',
    'sidebar.management': 'Gestão',
    'sidebar.reports': 'Relatórios',
    
    // Ações comuns
    'action.create': 'Criar',
    'action.edit': 'Editar',
    'action.delete': 'Excluir',
    'action.save': 'Salvar',
    'action.cancel': 'Cancelar',
    'action.close': 'Fechar',
    'action.search': 'Buscar',
    'action.filter': 'Filtrar',
    'action.export': 'Exportar',
    'action.view': 'Ver',
    'action.details': 'Detalhes',
    
    // Status
    'status.active': 'Ativo',
    'status.inactive': 'Inativo',
    'status.pending': 'Pendente',
    'status.completed': 'Concluído',
    'status.cancelled': 'Cancelado',
    'status.expired': 'Expirado',
    'status.converted': 'Convertido',
    
    // Mensagens
    'message.loading': 'Carregando...',
    'message.noData': 'Nenhum dado disponível',
    'message.error': 'Erro',
    'message.success': 'Sucesso',
    'message.confirmDelete': 'Tem certeza de que deseja excluir?',
    'message.saved': 'Salvo com sucesso',
    'message.deleted': 'Excluído com sucesso',
    'message.errorSaving': 'Erro ao salvar',
    'message.errorDeleting': 'Erro ao excluir',
    
    // Formulários
    'form.required': 'Este campo é obrigatório',
    'form.invalid': 'Valor inválido',
    'form.name': 'Nome',
    'form.email': 'E-mail',
    'form.phone': 'Telefone',
    'form.address': 'Endereço',
    'form.quantity': 'Quantidade',
    'form.price': 'Preço',
    'form.total': 'Total',
    'form.subtotal': 'Subtotal',
    'form.discount': 'Desconto',
    
    // Configuração
    'config.preferences': 'Preferências',
    'config.currency': 'Moeda',
    'config.dateFormat': 'Formato de data',
    'config.language': 'Idioma',
    'config.themeColor': 'Cor do sistema',
    'config.phoneCountryCode': 'Código do país para telefones',
    
    // Preferências de idioma
    'language.es': 'Español',
    'language.en': 'English',
    'language.pt': 'Português',
  },
}

/**
 * Traduce una clave de traducción
 * @param key - La clave de traducción (ej: 'nav.dashboard')
 * @param slug - El slug de la organización (opcional, se obtiene de la URL si no se proporciona)
 * @param params - Parámetros opcionales para reemplazar en la traducción
 * @returns El texto traducido o la clave si no se encuentra
 */
export function t(key: string, slug?: string, params?: Record<string, string | number>): string {
  const lang = slug ? getLanguage(slug) : getLanguageFromUrl()
  const translation = translations[lang]?.[key] || translations['es']?.[key] || key
  
  // Reemplazar parámetros si existen
  if (params) {
    return Object.entries(params).reduce(
      (text, [param, value]) => text.replace(`{{${param}}}`, String(value)),
      translation
    )
  }
  
  return translation
}

/**
 * Hook para usar traducciones en componentes React
 * @param slug - El slug de la organización
 * @returns Función de traducción
 */
export function useTranslation(slug?: string) {
  // Obtener slug de la URL si no se proporciona
  const actualSlug = slug || (typeof window !== 'undefined' ? getLanguageFromUrl() : '')
  
  // Estado para forzar re-render cuando cambia el idioma
  const [language, setLanguage] = useState(() => getLanguage(actualSlug))
  const [updateKey, setUpdateKey] = useState(0)
  
  // Efecto para escuchar cambios en el idioma
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const checkLanguage = () => {
      const currentLang = getLanguage(actualSlug)
      if (currentLang !== language) {
        setLanguage(currentLang)
        setUpdateKey(prev => prev + 1)
      }
    }
    
    // Verificar cambios periódicamente (cada 200ms para respuesta más rápida)
    const interval = setInterval(checkLanguage, 200)
    
    // También escuchar eventos personalizados
    const handleLanguageUpdate = (event?: CustomEvent) => {
      // Si el evento tiene el slug correcto, actualizar inmediatamente
      if (!event || !event.detail || event.detail.slug === actualSlug) {
        checkLanguage()
      }
    }
    
    window.addEventListener('language-updated', handleLanguageUpdate as EventListener)
    
    // Verificar inmediatamente al montar
    checkLanguage()
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('language-updated', handleLanguageUpdate as EventListener)
    }
  }, [actualSlug, language, updateKey])
  
  return {
    t: (key: string, params?: Record<string, string | number>) => t(key, actualSlug, params),
    language,
  }
}

