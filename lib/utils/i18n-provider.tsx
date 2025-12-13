/**
 * Provider personalizado para next-intl que lee el idioma desde las preferencias
 * de la base de datos en lugar de la URL
 */

"use client";

import { useParams } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState, useCallback, useRef } from "react";

import { readPreferencesAsync } from "./preferences";

import type { Locale } from "@/i18n";

interface I18nProviderProps {
  children: React.ReactNode;
}

/**
 * Combina mensajes: usa traducciones del target si existen, sino usa español
 */
function mergeMessages(
  source: Record<string, any>,
  target: Record<string, any>
): Record<string, any> {
  const merged: Record<string, any> = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (!(key in merged)) {
      // Si no existe en target, usar español
      merged[key] = value;
    } else if (
      typeof value === "object" &&
      value !== null &&
      typeof merged[key] === "object" &&
      merged[key] !== null
    ) {
      // Si ambos son objetos, hacer merge recursivo
      merged[key] = mergeMessages(value, merged[key]);
    }
    // Si existe en target, mantenerlo (ya está traducido)
  }

  return merged;
}

// Cargar mensajes en español de forma inmediata (una sola vez, cacheado)
let cachedEsMessages: any = null;
const loadEsMessages = async () => {
  if (cachedEsMessages) return cachedEsMessages;
  try {
    const esModule = await import("@/messages/es.json");
    cachedEsMessages = esModule.default;
    return cachedEsMessages;
  } catch {
    return {};
  }
};

// Mensajes mínimos para evitar errores de contexto
const MINIMAL_MESSAGES = {
  nav: {
    dashboard: "Dashboard",
    quotations: "Cotizaciones",
    sales: "Ventas",
    products: "Productos",
    customers: "Clientes",
    expenses: "Gastos",
    reports: "Reportes",
    cashRegisters: "Cajas",
    configuration: "Configuración",
    users: "Usuarios",
    roles: "Roles",
    permissions: "Permisos",
    branches: "Sucursales",
    categories: "Categorías",
    inventory: "Inventario",
    analytics: "Analytics",
    support: "Soporte",
  },
  sidebar: {
    home: "Inicio",
    operation: "Operación",
    catalog: "Catálogo",
    management: "Gestión",
    reports: "Reportes",
    support: "Soporte",
  },
  header: {
    profile: "Perfil",
    settings: "Configuración",
    logout: "Cerrar sesión",
    theme: {
      light: "Claro",
      dark: "Oscuro",
      system: "Sistema",
    },
    notifications: "Notificaciones",
    noNotifications: "No hay notificaciones",
  },
  action: { 
    create: "Crear",
    cancel: "Cancelar",
    add: "Agregar",
    update: "Actualizar",
    delete: "Eliminar",
    refresh: "Actualizar",
    back: "Atrás",
    search: "Buscar",
  },
  status: { active: "Activo" },
  message: { 
    loading: "Cargando...",
    saving: "Agregando...",
  },
  form: { 
    required: "Requerido",
    name: "Nombre",
    lastName: "Apellido",
    select: "Seleccionar",
    quantity: "Cantidad",
    branch: "Sucursal",
    phone: "Teléfono",
    address: "Dirección",
    email: "Correo electrónico",
    ci: "CI (Cédula de Identidad)",
  },
  customers: {
    title: "Gestión de Clientes",
    description: "Administra los clientes de tu sistema de ventas",
    create: "Agregar Cliente",
  },
  common: {
    notes: "Notas",
    yes: "Sí",
    no: "No",
    confirm: "Confirmar",
    areYouSure: "¿Estás seguro?",
    search: "Buscar",
    select: "Seleccionar",
    all: "Todos",
    none: "Ninguno",
    optional: "Opcional",
    branch: "Sucursal",
    data: "Datos",
    perPage: "por página",
    noBranch: "Sin sucursal",
    noCategory: "Sin categoría",
    today: "Hoy",
    yesterday: "Ayer",
    thisWeek: "Esta semana",
    thisMonth: "Este mes",
    thisYear: "Este año",
    lastMonth: "Mes pasado",
    lastYear: "Año pasado",
    custom: "Personalizado",
    placeholders: {
      amount: "0.00",
      searchSales: "Buscar ventas...",
      searchProducts: "Buscar productos...",
      searchUsers: "Buscar usuarios por nombre, CI, correo, teléfono...",
      searchRoles: "Buscar roles por nombre o descripción...",
      searchBranches: "Buscar sucursales por nombre, dirección, teléfono, email...",
      roleExample: "Ej: Vendedor, Supervisor, Cajero...",
      roleDescription: "Descripción opcional del rol...",
      allBranches: "Todas las sucursales",
      filterByBranch: "Filtrar por sucursal",
      dateFormat: "dd/mm/aaaa",
      perPage: "por página",
      searchQuotations: "Buscar cotizaciones...",
      filterByStatus: "Filtrar por estado",
      searchCashRegisters: "Buscar por nombre o sucursal...",
      quantity: "Cantidad",
      price: "Precio",
      barcodeOrSerial: "Código de barras o serie",
      selectPaymentMethod: "Seleccionar método de pago",
      subtotal: "Subtotal",
      discount: "Descuento",
      additionalNotes: "Notas adicionales...",
      taxId: "Cédula de Identidad",
      name: "Nombre",
      lastName: "Apellido",
      address: "Dirección completa",
      selectRole: "Seleccionar rol",
      selectBranch: "Seleccionar sucursal",
    },
  },
  config: {
    title: "Configuración",
    sections: {
      preferences: "Preferencias",
      company: "Empresa",
    },
    preferences: {
      themeColor: "Color del sistema",
      currency: "Moneda",
      dateFormat: "Formato de fecha",
      language: "Idioma de la interfaz",
      phoneCountryCode: "Código de país para teléfonos",
      currencyNote: "La moneda se utilizará en ventas, cotizaciones y reportes.",
      dateFormatNote: "El formato se aplicará en toda la interfaz del sistema.",
      phoneCodeNote: "Este código se usará automáticamente al ingresar números de teléfono.",
      themeColorNote: "Personaliza el color principal de la interfaz.",
      languageNote: "El idioma se aplicará en toda la interfaz del sistema.",
      autoSave: "Las preferencias se guardan automáticamente.",
    },
    company: {
      name: "Nombre de la empresa",
      taxId: "NIT / RUC",
      phone: "Teléfono",
      address: "Dirección",
      website: "Sitio web",
      logo: "Logo de la empresa",
      owner: "Información del dueño",
      ownerName: "Nombre",
      ownerEmail: "Correo electrónico",
      notEditable: "No editable",
      updateInfo: "Actualizar información",
      updating: "Actualizando...",
      saveInBrowser: "Se guardará en tu navegador",
      phoneNote: "Este número se usará para WhatsApp.",
    },
    plan: {
      title: "Plan de suscripción",
      plan: "Plan",
      status: "Estado",
      expires: "Vence",
      period: "Período",
      monthly: "Mensual",
      yearly: "Anual",
      noDate: "Sin fecha (renovación)",
      noActivePlan: "No hay un plan activo. Contacta a administración.",
    },
    error: "Error al guardar la configuración",
    saved: "Configuración guardada correctamente",
  },
  reports: {
    title: "Reportes",
    description: "Análisis detallado de tus operaciones comerciales",
    basic: "Reportes Básicos",
    advanced: "Reportes Avanzados",
    advancedBadge: "Múltiples Sucursales",
    advancedLabel: "Avanzado",
    viewFullReport: "Ver reporte completo →",
    reports: {
      general: { title: "Reporte General", description: "Vista general de ingresos y egresos" },
      sales: { title: "Reporte de Ventas", description: "Análisis detallado de ventas" },
      products: { title: "Reporte de Productos", description: "Estado del inventario y top ventas" },
      expenses: { title: "Reporte de Gastos", description: "Desglose de gastos por categoría" },
      customers: { title: "Reporte de Clientes", description: "Clientes principales y retención" },
      cashRegisters: { title: "Reporte de Cajas", description: "Estado de cajas por sucursal" },
      aiAdvanced: { title: "Reporte Inteligente", description: "Comparativas e insights generados con IA" },
    },
    filters: {
      dateRange: "Rango de fechas",
      branch: "Todas las sucursales",
      export: "Exportar reporte",
      startDate: "Fecha inicio",
      endDate: "Fecha fin",
      apply: "Aplicar filtros",
    },
    aiSummary: {
      title: "Resumen inteligente",
      description: "Análisis resumido generado con IA",
      generating: "En proceso",
      powered: "IA Activa",
      loading: "Generando recomendaciones",
      highlights: "Aspectos destacados",
      actions: "Acciones sugeridas",
      unavailable: "No se pudo generar el resumen inteligente.",
    },
    aiAdvanced: {
      title: "Reporte Inteligente",
      description: "Comparativas por sucursal e insights automáticos",
      error: "No se pudo cargar el reporte inteligente",
      noData: "Sin datos para exportar",
      download: "Descargar informe IA",
      exported: "Reporte IA descargado",
      updated: "Actualizado",
      opportunities: "Oportunidades",
      risks: "Riesgos",
      nextActions: "Próximos pasos",
      branchHighlights: "Desempeño por sucursal",
      branches: "Sucursales",
      branch: "Sucursal",
      sales: "Ventas",
      revenue: "Ingresos",
      avgTicket: "Ticket prom.",
      topProducts: "Top productos",
      topCustomers: "Clientes destacados",
      netProfit: "Utilidad neta",
      margin: "Margen",
      expenses: "Gastos",
    },
  },
  analytics: {
    title: "Analytics y Business Intelligence",
    description: "Análisis avanzado de datos y métricas de tu negocio",
    kpis: {
      title: "KPIs Principales",
    },
    tabs: {
      trends: "Tendencias",
      profitability: "Rentabilidad",
      segmentation: "Segmentación",
      predictions: "Predicciones",
      overview: "Resumen",
    },
    trends: {
      title: "Análisis de Tendencias",
      description: "Evolución de ventas e ingresos en el tiempo",
    },
    profitability: {
      title: "Rentabilidad por Producto",
      description: "Análisis de ingresos, costos y márgenes de ganancia por producto",
    },
    segmentation: {
      title: "Segmentación de Clientes",
      description: "Análisis RFM: Recency, Frequency, Monetary",
    },
    predictions: {
      title: "Predicciones con Machine Learning",
      description: "Pronósticos de ventas futuras basados en datos históricos",
    },
    overview: {
      trends: "Tendencias Rápidas",
      topProducts: "Top Productos Rentables",
    },
    ai: {
      summaryTitle: "Resumen inteligente",
      summaryDescription: "Narrativa automática generada con IA.",
      highlights: "Puntos destacados",
      insightsEmpty: "Sin novedades para este período.",
      summaryFallback: "Sin datos disponibles.",
      recommendationsTitle: "Recomendaciones e insights",
      recommendationsDescription: "Acciones sugeridas y alertas detectadas automáticamente.",
      anomaliesTitle: "Anomalías",
      noAnomalies: "Sin anomalías relevantes detectadas.",
      recommendations: "Recomendaciones",
      noRecommendations: "Sin acciones específicas por ahora.",
      scenariosTitle: "Escenarios simulados",
      scenariosDescription: "Explora impactos potenciales con IA.",
      noScenarios: "Sin escenarios disponibles.",
      chatTitle: "Asistente conversacional",
      chatDescription: "Haz preguntas directas sobre tus métricas.",
      chatPlaceholder: "Ej. ¿Cuál fue el margen promedio esta semana?",
      chatButton: "Preguntar",
      chatIntro: "Hola, soy tu asistente inteligente. Pregúntame sobre tus ventas o KPIs.",
      reportTitle: "Reporte ejecutivo con IA",
      reportDescription: "Genera un documento listo para compartir con tu equipo.",
      reportButton: "Descargar reporte",
      reportGenerating: "Generando...",
      reportSuccess: "Reporte generado correctamente.",
      reportError: "No se pudo generar el reporte.",
    },
  },
  profile: {
    title: "Mi Perfil",
    description: "Gestiona tu información personal y configuración de cuenta",
    personalInfo: {
      title: "Información Personal",
      description: "Actualiza tu información personal y de contacto",
    },
    security: {
      title: "Seguridad",
      description: "Gestiona tu contraseña y configuración de seguridad",
      password: "Contraseña",
      lastUpdate: "Última actualización:",
      never: "Nunca",
      changePassword: "Cambiar Contraseña",
      passwordFields: {
        allFieldsRequired: "Todos los campos son requeridos",
        minLength: "La nueva contraseña debe tener al menos 8 caracteres",
        noMatch: "Las contraseñas no coinciden",
        samePassword: "La nueva contraseña debe ser diferente a la actual",
        error: "Error al cambiar la contraseña",
        success: "Contraseña actualizada correctamente",
        description: "Ingresa tu contraseña actual y la nueva contraseña",
        current: "Contraseña Actual",
        new: "Nueva Contraseña",
        confirm: "Confirmar Nueva Contraseña",
        minLengthHint: "Mínimo 8 caracteres",
      },
    },
    accountInfo: {
      title: "Información de la Cuenta",
      role: "Rol",
      noRole: "Sin rol",
      branch: "Sucursal",
      status: "Estado",
      createdAt: "Cuenta creada",
      lastLogin: "Último acceso",
    },
  },
  language: { 
    es: "Español",
    en: "English",
    pt: "Português",
  },
  app: { systemName: "Sistema Ventas" },
  support: {
    title: "Centro de soporte",
    description: "Crea y da seguimiento a los tickets enviados a nuestro equipo de soporte",
    createTicket: "Crear Ticket",
    stats: {
      open: "Abiertos",
      openDescription: "Pendientes de atención",
      inProgress: "En Progreso",
      inProgressDescription: "En proceso de resolución",
      resolved: "Resueltos",
      resolvedDescription: "Solucionados",
      closed: "Cerrados",
      closedDescription: "Finalizados",
      total: "del total",
    },
    filters: {
      search: "Búsqueda",
      searchPlaceholder: "Buscar por número, título o descripción...",
      status: "Estado",
      statusAll: "Todos",
      statusOpen: "Abiertos",
      statusInProgress: "En progreso",
      statusResolved: "Resueltos",
      statusClosed: "Cerrados",
      pageSize: "Datos",
      pageSize5: "5 por página",
      pageSize10: "10 por página",
      pageSize20: "20 por página",
      pageSize50: "50 por página",
    },
    table: {
      ticket: "Ticket",
      status: "Estado",
      priority: "Prioridad",
      updated: "Actualizado",
      comments: "Comentarios",
      actions: "Acciones",
      viewDetails: "Ver detalles",
      noTickets: "No se encontraron tickets con el filtro seleccionado.",
      loading: "Cargando tickets...",
    },
    cards: {
      viewDetails: "Ver detalles",
      priority: "Prioridad",
      category: "Categoría",
      comments: "comentario",
      commentsPlural: "comentarios",
      updated: "Actualizado:",
    },
    status: {
      open: "Abierto",
      inProgress: "En progreso",
      resolved: "Resuelto",
      closed: "Cerrado",
    },
    priority: {
      low: "Baja",
      medium: "Media",
      high: "Alta",
      urgent: "Urgente",
    },
  },
  cashRegisters: {
    title: "Gestión de Cajas",
    description: "Administra las cajas registradoras",
    create: "Agregar Caja",
    new: "Nueva Caja",
    edit: "Editar Caja",
    editDescription: "Modifica los datos de la caja",
    newDescription: "Completa los datos para crear una nueva caja registradora",
    deleteWarning: "Esta acción no se puede deshacer. Se eliminará permanentemente la caja",
    deleteWarningEnd: "y todos sus datos asociados.",
    form: {
      name: "Nombre asignado",
      branch: "Sucursal",
      selectBranch: "Seleccione una sucursal",
      assignedBranch: "Sucursal asignada",
      willUseBranch: "Se usará automáticamente tu sucursal asignada",
      noBranchesAvailable: "Sin sucursales disponibles",
      loadingInfo: "Cargando información...",
      initialBalance: "Balance Inicial",
      dateTime: "Fecha y hora",
      nameRequired: "El nombre de la caja es requerido",
      branchRequired: "Debe seleccionar una sucursal",
    },
  },
  products: {
    title: "Gestión de Productos",
    description: "Administra los productos de tu inventario",
    create: "Agregar Producto",
    new: "Nuevo Producto",
    edit: "Editar Producto",
    editDescription: "Modifica los datos del producto",
    newDescription: "Completa los datos para crear un nuevo producto",
    deleteWarning: "Esta acción no se puede deshacer. Se eliminará permanentemente el producto",
    deleteWarningEnd: "y todos sus datos asociados.",
    exportImport: {
      title: "Exportar / Importar Productos",
      description: "Exporta tus productos a Excel/CSV o impórtalos desde un archivo",
      export: "Exportar",
      import: "Importar",
      format: "Formato",
      selectFile: "Seleccionar archivo",
      selectedFile: "Archivo seleccionado",
      updateExisting: "Actualizar productos existentes (por SKU o código de barras)",
      skipErrors: "Continuar aunque haya errores",
      downloadTemplate: "Descargar Plantilla Excel",
      downloadTemplateCSV: "Descargar Plantilla CSV",
      exporting: "Exportando...",
      importing: "Importando...",
      exportButton: "Exportar Productos",
      importButton: "Importar Productos",
      exportSuccess: "Exportación completada correctamente",
      exportError: "Error al exportar productos",
      importSuccess: "Importación completada",
      importErrors: "Errores encontrados",
      imported: "Creados",
      updated: "Actualizados",
      skipped: "Omitidos",
      row: "Fila",
      templateDownloaded: "Plantilla descargada correctamente",
      fileRequired: "Selecciona un archivo",
    },
    form: {
      name: "Nombre del producto",
      description: "Descripción",
      price: "Precio",
      stock: "Stock",
      minStock: "Stock mínimo",
      reorderPoint: "Punto de Reorden",
      reorderPointPlaceholder: "Opcional: stock para reordenar",
      category: "Categoría",
      branch: "Sucursal",
      image: "Imagen del producto",
      barcode: "Código de barras",
      sku: "SKU",
      brand: "Marca",
      model: "Modelo",
      cost: "Precio de Compra",
      priceSale: "Precio de Venta",
      initialStock: "Stock Inicial",
      categoryRequired: "Debe seleccionar una categoría",
      branchRequired: "Debe seleccionar una sucursal",
      selectBranch: "Seleccionar sucursal",
      selectCategory: "Seleccionar categoría",
      noImage: "Sin imagen",
      changePhoto: "Cambiar foto",
      selectPhoto: "Seleccionar foto",
      scanBarcode: "Escanear código de barras",
      stopScan: "Detener escaneo",
      improveWithAI: "Mejorar con IA",
      generating: "Generando...",
      improveDescriptionAI: "Mejorar descripción con IA",
      cameraAccessError: "No se pudo acceder a la cámara",
      searchingProductInfo: "Buscando información del producto...",
      productInfoLoaded: "Información del producto cargada",
      productInfoNotFound: "No se encontró información del producto. Por favor, complete los campos manualmente.",
      errorSearchingProductInfo: "Error al buscar información del producto",
      nameRequired: "Por favor, ingresa al menos el nombre del producto",
      generatingDescriptionAI: "Generando descripción con IA...",
      infoGenerated: "Información generada",
      generatedSuccessfully: "generada exitosamente",
      descriptionGeneratedSuccessfully: "Descripción generada exitosamente",
      couldNotGenerateDescription: "No se pudo generar la descripción",
      errorGeneratingDescription: "Error al generar la descripción. Verifica que la API key esté configurada.",
      errorUploadingImage: "Error al subir la imagen",
    },
    export: {
      success: "Productos exportados correctamente",
    },
    import: {
      fileRequired: "Selecciona un archivo",
      success: "Productos importados correctamente",
      error: "Error al importar productos",
    },
  },
  quotations: {
    title: "Gestión de Cotizaciones",
    description: "Administra las cotizaciones realizadas",
    create: "Agregar Cotización",
    new: "Nueva Cotización",
    edit: "Editar Cotización",
    editDescription: "Modifica los datos de la cotización",
    newDescription: "Completa los datos para crear una nueva cotización",
    noQuotations: "No hay cotizaciones registradas",
    delete: {
      confirm: "¿Estás seguro de que deseas eliminar esta cotización?",
      description: "Se eliminará permanentemente la cotización",
    },
    form: {
      customer: "Cliente",
      customerPlaceholder: "Escribe el nombre del cliente...",
      validUntil: "Válida hasta",
      phone: "Teléfono",
      phonePlaceholder: "Número de teléfono",
      items: "Items",
      product: "Producto",
      quantity: "Cantidad",
      unitPrice: "Precio unitario",
      subtotal: "Subtotal",
      discount: "Descuento",
      total: "Total",
      notes: "Notas",
      notesPlaceholder: "Notas adicionales...",
      selectBranch: "Seleccionar sucursal",
      noProducts: "No hay productos agregados",
      addProduct: "Agregar Producto",
      pdf: {
        openingExisting: "Abriendo PDF existente",
        ready: "PDF listo y enlace generado",
        generated: "PDF generado correctamente",
        downloadError: "PDF descargado, pero no se pudo guardar el enlace",
        generateError: "No se pudo generar el PDF",
      },
      copyLink: "Copiar",
      linkCopied: "Enlace copiado al portapapeles",
      whatsapp: {
        noPhone: "Agrega un teléfono al cliente para enviar por WhatsApp",
        noWhatsappConfig: "Configura un número de WhatsApp en Configuración",
      },
    },
  },
  // Mensajes mínimos de Ventas para evitar MISSING_MESSAGE en el primer render
  sales: {
    title: "Gestión de Ventas",
    description: "Administra las ventas realizadas",
    create: "Agregar Venta",
    new: "Nueva Venta",
    edit: "Editar Venta",
    editDescription: "Modifica los datos de la venta",
    newDescription: "Completa los datos para crear una nueva venta",
    sale: "Venta",
    by: "por",
    cancelSuccess: "Venta anulada correctamente",
    stats: {
      total: "Total Ventas",
      today: "Hoy",
      thisMonth: "Este mes",
      thisYear: "Este año",
    },
    filters: {
      search: "Buscar ventas...",
      status: "Todos los estados",
      branch: "Todas las sucursales",
      dateRange: "Rango de fechas",
      paymentMethod: "Método de pago",
    },
    form: {
      customer: "Cliente",
      customerPlaceholder:
        "Escribe el nombre del cliente (puede no estar registrado)...",
      customerRequired:
        "Debe seleccionar o ingresar un cliente",
      phone: "Teléfono",
      phonePlaceholder: "Número de teléfono",
      items: "Items",
      addItem: "Agregar item",
      addProduct: "Agregar Producto",
      noProducts: "No hay productos agregados",
      product: "Producto",
      branch: "Sucursal",
      quantity: "Cantidad",
      unitPrice: "Precio unitario",
      subtotal: "Subtotal",
      discount: "Descuento",
      total: "Total",
      paymentMethod: "Método de pago",
      cash: "Efectivo",
      card: "Tarjeta",
      transfer: "Transferencia",
      qr: "QR / Billetera",
      notes: "Notas",
      notesPlaceholder: "Notas adicionales...",
      trackingCodes: "Códigos de seguimiento",
      scanCode: "Código o escaneo",
      stopScan: "Detener escaneo",
      validCodeRequired: "Ingresa un código válido",
      codeAlreadyAdded: "Este código ya se agregó al producto",
      codesExceedQuantity:
        "La cantidad de códigos no puede superar las unidades vendidas",
      codeScannedAndAdded: "Código escaneado y agregado",
      cameraNotAvailable:
        "La cámara no está disponible en este dispositivo o navegador",
      cameraAccessError: "No se pudo acceder a la cámara",
      codesQuantityMismatch:
        "La cantidad de códigos únicos debe coincidir con la cantidad vendida en cada producto",
      loadingCustomers: "Cargando clientes...",
      noCodesRegistered: "Sin códigos registrados.",
    },
    status: {
      completed: "Completada",
      pending: "Pendiente",
      cancelled: "Cancelada",
    },
    delete: {
      confirm: "¿Estás seguro de que deseas eliminar esta venta?",
      description: "Se eliminará permanentemente la venta",
    },
    cancel: {
      confirm: "¿Estás seguro de que deseas cancelar esta venta?",
      description: "Esta acción no se puede deshacer",
    },
    noSales: "No hay ventas registradas",
  },
  users: {
    title: "Gestión de Usuarios",
    description: "Administra todos los usuarios del sistema",
    create: "Agregar Usuario",
    sas: {
      delete: {
        confirm: "¿Estás seguro?",
        description: "Esta acción no se puede deshacer. Se eliminará permanentemente el usuario",
        descriptionEnd: "y todos sus datos asociados.",
      },
    },
  },
  roles: {
    title: "Gestión de Roles",
    description: "Administra los roles y permisos del sistema",
    create: "Agregar Rol",
    sas: {
      delete: {
        confirm: "¿Estás seguro?",
        description: "Esta acción no se puede deshacer. Se eliminará permanentemente el rol",
        cannotDelete: "No se puede eliminar",
        cannotDeleteDescription: "El rol <strong>Administrador</strong> no puede eliminarse por seguridad del sistema.",
      },
    },
  },
  branches: {
    title: "Gestión de Sucursales",
    description: "Administra las sucursales de tu organización",
    create: "Agregar Sucursal",
    new: "Nueva Sucursal",
    edit: "Editar Sucursal",
    editDescription: "Modifica los datos de la sucursal",
    newDescription: "Completa los datos para crear una nueva sucursal",
    deleteWarning: "Esta acción no se puede deshacer. Se eliminará permanentemente la sucursal",
    deleteWarningEnd: "y todos sus datos asociados.",
    form: {
      name: "Nombre",
      namePlaceholder: "Nombre de la sucursal",
      address: "Dirección",
      addressPlaceholder: "Dirección completa de la sucursal",
      phone: "Teléfono",
      phonePlaceholder: "Teléfono",
      email: "Correo Electrónico",
      emailPlaceholder: "correo@ejemplo.com",
    },
  },
  inventory: {
    title: "Inventario Avanzado",
    description: "Gestiona alertas, movimientos, transferencias y ajustes de inventario",
    tabs: {
      alerts: "Alertas",
      movements: "Movimientos",
      transfers: "Transferencias",
      adjustments: "Ajustes",
    },
    alerts: {
      title: "Alertas de Stock Bajo",
      description: "Productos con stock bajo o en punto de reorden",
      noAlerts: "No hay alertas de stock bajo",
      currentStock: "Stock actual",
      reorderPoint: "Punto de reorden",
      belowMin: "Bajo mínimo",
      atReorder: "En reorden",
    },
    movements: {
      title: "Historial de Movimientos",
      description: "Registro de todos los movimientos de inventario",
      noMovements: "No hay movimientos registrados",
      type: "Tipo",
    },
    transfers: {
      title: "Transferencias entre Sucursales",
      description: "Gestiona transferencias de productos entre sucursales",
      noTransfers: "No hay transferencias registradas",
      new: "Nueva Transferencia",
      product: "Producto",
      maxQuantity: "Máximo disponible",
      from: "Desde",
      to: "Hacia",
      quantity: "Cantidad",
      statusHeader: "Estado",
      requestedBy: "Solicitado por",
      date: "Fecha",
      selectProduct: "Seleccionar producto",
      fromBranch: "Sucursal Origen",
      toBranch: "Sucursal Destino",
      selectFromBranch: "Seleccionar sucursal origen",
      selectToBranch: "Seleccionar sucursal destino",
      notesPlaceholder: "Notas opcionales...",
      createDescription: "Crea una nueva transferencia de productos entre sucursales",
      created: "Transferencia creada",
      approved: "Transferencia aprobada",
      rejected: "Transferencia rechazada",
      completed: "Transferencia completada",
      error: "Error al procesar transferencia",
      status: {
        pending: "Pendiente",
        approved: "Aprobada",
        rejected: "Rechazada",
        inTransit: "En tránsito",
        completed: "Completada",
        cancelled: "Cancelada",
      },
    },
    adjustments: {
      title: "Ajustes de Inventario",
      description: "Ajusta el stock de productos con justificación",
      noAdjustments: "No hay ajustes registrados",
      reasonSuggestions: {
        loss: "Pérdida",
        damage: "Daño",
        expiration: "Vencimiento",
        theft: "Robo",
        countingError: "Error de conteo",
        return: "Devolución",
        correction: "Corrección",
        other: "Otros",
      },
    },
  },
  auth: {
    login: {
      title: "Iniciar sesión",
      subtitle: "Ingrese sus datos para iniciar sesión en su cuenta",
      email: "Correo",
      emailPlaceholder: "Correo electrónico o CI",
      password: "Contraseña",
      passwordPlaceholder: "Contraseña",
      submit: "Iniciar sesión",
      loading: "Iniciando sesión...",
      error: "Error al iniciar sesión",
      errorConnection: "Error de conexión. Por favor, intenta nuevamente.",
      errorConnectionShort: "Error de conexión",
      emailOrCiRequired: "El correo electrónico o CI es requerido",
      success: "Sesión iniciada correctamente",
      invalidCredentials: "Credenciales inválidas",
      systemName: "Sistema de Ventas",
      welcome: "Bienvenido",
      welcomeBack: "de nuevo",
      systemDescription: "Sistema de gestión de ventas",
      systemSubDescription:
        "Gestiona tu negocio de manera eficiente y profesional",
      managementSystem: "Sistema de Gestión",
      intelligent: "Inteligente",
      feature1: "Gestión completa de inventario",
      feature2: "Reportes en tiempo real",
      feature3: "Multi-sucursal y multi-usuario",
      imageAlt: "Sistema de gestión de ventas",
      copyright:
        "© {year} SmartPOS. Todos los derechos reservados.",
    },
  },
};

export function I18nProvider({ children }: I18nProviderProps) {
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const [locale, setLocale] = useState<Locale>("es");
  // Inicializar con mensajes mínimos para que siempre haya contexto
  const [messages, setMessages] = useState<any>(MINIMAL_MESSAGES);
  // Ref para rastrear si ya se cargó desde preferencias (evitar bucles)
  const hasLoadedFromPreferences = useRef(false);
  // Ref para acceder al locale actual sin incluirlo en dependencias
  const localeRef = useRef<Locale>("es");

  // Función para cargar mensajes de un idioma (definida antes de usarse)
  const loadLocaleMessages = useCallback(async (targetLocale: Locale) => {
    if (targetLocale === "es") {
      const esMessages = await loadEsMessages();
      if (esMessages && Object.keys(esMessages).length > 0) {
        // Actualizar estados sin forzar re-mount
        setLocale("es");
        localeRef.current = "es";
        setMessages(esMessages);
      }
    } else {
      try {
        const localeMessagesModule = await import(
          `@/messages/${targetLocale}.json`
        );
        const localeMessages = localeMessagesModule.default;
        const esMessages = await loadEsMessages();
        const mergedMessages = mergeMessages(esMessages, localeMessages);

        // Actualizar estados sin forzar re-mount
        setLocale(targetLocale);
        localeRef.current = targetLocale;
        setMessages(mergedMessages);
      } catch {
        // Si falla, usar español
        const esMessages = await loadEsMessages();
        if (esMessages && Object.keys(esMessages).length > 0) {
          setLocale("es");
          localeRef.current = "es";
          setMessages(esMessages);
        }
      }
    }
  }, []);

  // Cargar mensajes en español inmediatamente al montar
  // También verificar localStorage para idioma guardado
  useEffect(() => {
    const initializeMessages = async () => {
      // Verificar si hay un idioma guardado en localStorage (para login)
      let initialLocale: Locale = "es";
      if (typeof window !== "undefined") {
        const storedLanguage = localStorage.getItem("sas-language-preference");
        if (storedLanguage && ["es", "en", "pt"].includes(storedLanguage)) {
          initialLocale = storedLanguage as Locale;
        }
      }

      // Usar la función helper para cargar mensajes
      await loadLocaleMessages(initialLocale);
    };
    initializeMessages();
  }, [loadLocaleMessages]);

  // Escuchar cambios de idioma desde eventos (funciona con o sin slug)
  // Este listener se ejecuta ANTES de cargar desde preferencias para capturar cambios inmediatos
  useEffect(() => {
    let isProcessing = false; // Flag para evitar llamadas duplicadas

    const handleLanguageChange = async (event: Event) => {
      if (isProcessing) {
        return;
      }

      const customEvent = event as CustomEvent;
      // Si el evento tiene un slug diferente al actual, ignorarlo
      if (customEvent?.detail?.slug && customEvent.detail.slug !== slug) {
        return;
      }

      const newLanguage =
        customEvent?.detail?.language ||
        (typeof window !== "undefined"
          ? localStorage.getItem("sas-language-preference")
          : null);

      // Validar que el idioma no esté vacío y sea válido
      if (
        !newLanguage ||
        typeof newLanguage !== "string" ||
        !["es", "en", "pt"].includes(newLanguage)
      ) {
        return;
      }

      // Verificar si el idioma ya es el actual usando el ref para evitar dependencias
      if (newLanguage === localeRef.current) {
        return;
      }

      isProcessing = true;

      await loadLocaleMessages(newLanguage as Locale);
      isProcessing = false;
    };

    // Escuchar eventos de cambio de idioma
    if (typeof window !== "undefined") {
      window.addEventListener(
        "localStorage-language-changed",
        handleLanguageChange
      );
      window.addEventListener("language-updated", handleLanguageChange);

      return () => {
        window.removeEventListener(
          "localStorage-language-changed",
          handleLanguageChange
        );
        window.removeEventListener("language-updated", handleLanguageChange);
      };
    }
  }, [slug, loadLocaleMessages]);

  // Cargar idioma desde preferencias cuando tengamos slug (solo al montar o cambiar slug)
  useEffect(() => {
    if (!slug) {
      return;
    }

    // Resetear el flag cuando cambia el slug
    hasLoadedFromPreferences.current = false;

    let isMounted = true; // Flag para evitar actualizaciones después de desmontar

    const loadLocale = async () => {
      try {
        // Primero verificar si hay un idioma en localStorage (prioridad para cambios recientes)
        const storedLanguage =
          typeof window !== "undefined"
            ? localStorage.getItem("sas-language-preference")
            : null;

        if (storedLanguage && ["es", "en", "pt"].includes(storedLanguage)) {
          const storedLocale = storedLanguage as Locale;
          // Si el idioma almacenado es diferente al actual, usarlo
          if (isMounted && storedLocale !== locale) {
            await loadLocaleMessages(storedLocale);
            return;
          }
        }

        // Si no hay cambio reciente en localStorage, obtener desde preferencias
        // Solo si aún no se ha cargado desde preferencias (evitar bucles)
        if (!hasLoadedFromPreferences.current) {
          hasLoadedFromPreferences.current = true; // Marcar como cargado
          const prefs = await readPreferencesAsync(slug);
          const language = (prefs.language || "es") as Locale;

          // Validar que sea un locale válido
          const validLocale: Locale = ["es", "en", "pt"].includes(language)
            ? language
            : "es";

          // Solo cargar si es diferente al actual y el componente sigue montado
          if (isMounted && validLocale !== locale) {
            await loadLocaleMessages(validLocale);
          }
        }
      } catch (error) {
        // Error 401 es esperado en la página de login (no autenticado)
        if (error instanceof Error && error.message.includes("401")) {
          // Intentar obtener desde localStorage
          const storedLanguage =
            typeof window !== "undefined"
              ? localStorage.getItem("sas-language-preference")
              : null;
          if (
            isMounted &&
            storedLanguage &&
            ["es", "en", "pt"].includes(storedLanguage)
          ) {
            await loadLocaleMessages(storedLanguage as Locale);
            return;
          }
        }
        // Mantener español como fallback solo si no está ya en español y el componente sigue montado
        if (isMounted && locale !== "es") {
          setLocale("es");
          const esMessages = await loadEsMessages();
          if (esMessages && Object.keys(esMessages).length > 0) {
            setMessages(esMessages);
          }
        }
      }
    };

    loadLocale();

    return () => {
      isMounted = false; // Marcar como desmontado
    };
    // Solo ejecutar cuando cambia el slug, no cuando cambia locale o messages
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages || MINIMAL_MESSAGES}
      timeZone="America/La_Paz"
    >
      {children}
    </NextIntlClientProvider>
  );
}
