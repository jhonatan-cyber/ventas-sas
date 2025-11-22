## Plan de implementación de reportes para SAS

### 1. Alcance y priorización

- **Definir prioridades**
  - [x] Elegir 3–5 reportes básicos para la primera versión.
    - Reportes básicos v1:
      - [x] Reporte de ventas por período (sección 2).
      - [x] Reporte de gastos por período (sección 3).
      - [x] Reporte de productos / inventario básico (sección 4).
      - [x] Reporte de clientes básico (sección 5).
      - [x] Reporte general (sección 7).
  - [x] Elegir 2–3 reportes avanzados que agreguen más valor al negocio.
    - Reportes avanzados v1:
      - [x] Analytics de ventas (tendencias y comparaciones) (sección 8).
      - [x] Rentabilidad de productos (sección 9).
      - [x] Segmentación de clientes (RFM) (sección 10).
  - [x] Alinear con los tipos de negocio principales que usan SAS
    - Foco en comercios minoristas, distribuidoras y servicios con alta rotación de productos.
    - Priorizamos reportes que ayuden a:
      - Controlar flujo de caja (ventas/gastos).
      - Tomar decisiones de compra de inventario.
      - Entender quiénes son los mejores clientes.

- **Diseño general de UX**
  - [x] Definir un módulo único de `Reportes` en el menú.
    - Ruta sugerida: `/[slug]/reportes`.
  - [x] Decidir si se muestran en pestañas (Ventas, Clientes, Productos, etc.) o en una sola pantalla con filtros.
    - Diseño acordado:
      - Pestañas principales: **Resumen**, **Ventas**, **Gastos**, **Productos**, **Clientes**, **Cajas**.
      - Dentro de cada pestaña, selector de tipo de reporte (básico/avanzado) y rango de fechas.
  - [x] Unificar acciones: **Ver en pantalla**, **Exportar a PDF**, **Exportar a Excel/CSV**.
    - En cada reporte:
      - Botón primario: `Exportar PDF`.
      - Botón secundario: `Exportar CSV` (opcional en primera iteración).
      - Todos los reportes comparten cabecera de filtros (fechas + filtros específicos).

---

## Reportes básicos

### 2. Reporte de ventas por período

- **Back-end**
  - [x] Usar `ReportsService.getSalesReport` para obtener datos por rango de fechas.
  - [x] Exponer endpoint `/api/[slug]/reportes/sales` (`app/api/[slug]/reportes/sales/route.ts`).
- **Front-end**
  - [x] Crear vista con filtros de rango de fechas (`components/sales/reports/sales-report-client.tsx`).
  - [x] Mostrar:
    - [x] Total ventas (`totalSales`)
    - [x] Ingresos (`totalRevenue`)
    - [x] Ingresos netos (`netRevenue`)
    - [x] Ventas completadas/canceladas (`byStatus`).
    - [x] Gráfico y tabla `byDate` (fecha, cantidad, ingresos).
    - [x] Gráfico de métodos de pago y ranking de productos/clientes (topProducts, topCustomers).
  - [x] Botón **Exportar PDF** usando `exportSalesReportToPDF`.

### 3. Reporte de gastos por período

- **Back-end**
  - [x] Usar `ReportsService.getExpensesReport`.
  - [x] Endpoint `GET /api/[slug]/reportes/expenses` (`app/api/[slug]/reportes/expenses/route.ts`).
- **Front-end**
  - [x] Filtros: rango de fechas (inicio y fin) en `ExpensesReportClient`.
  - [x] Mostrar:
    - [x] Total de gastos (`totalExpenses`).
    - [x] Monto total (`totalAmount`).
    - [x] Tabla por categoría (`byCategory`) y gráfico asociado.
  - [x] Botón **Exportar PDF** usando `exportExpensesReportToPDF`.

### 4. Reporte de productos / inventario básico

- **Back-end**
  - [x] Usar `ReportsService.getProductsReport`.
  - [x] Endpoint `GET /api/[slug]/reportes/products` (`app/api/[slug]/reportes/products/route.ts`).
- **Front-end**
  - [x] Mostrar resumen en `ProductsReportClient`:
    - [x] Total productos, activos, inactivos.
    - [x] Stock bajo, sin stock.
    - [x] Valor total de stock (`totalStockValue`).
  - [x] Tablas y gráficos:
    - [x] `topSelling` (producto, cantidad, ingresos) con tabla y gráfico.
    - [x] `byCategory` (categoría, cantidad de productos) con tabla y gráfico.
  - [x] Botón **Exportar PDF** usando `exportProductsReportToPDF`.

### 5. Reporte de clientes básico

- **Back-end**
  - [x] Usar `ReportsService.getCustomersReport`.
  - [x] Endpoint `GET /api/[slug]/reportes/customers` (`app/api/[slug]/reportes/customers/route.ts`).
- **Front-end**
  - [x] Mostrar en `CustomersReportClient`:
    - [x] Total clientes, activos.
    - [x] Con compras / sin compras.
    - [x] Tabla de `topCustomers` (cliente, compras, total gastado, última compra).
    - [x] Tabla y gráfico de `byPurchaseCount` (rango, cantidad de clientes).
  - [x] Botón **Exportar PDF** usando `exportCustomersReportToPDF`.

### 6. Reporte de cajas

- **Back-end**
  - [x] Usar `ReportsService.getCashRegisterReport`.
  - [x] Endpoint `GET /api/[slug]/reportes/cash-registers` (`app/api/[slug]/reportes/cash-registers/route.ts`).
- **Front-end**
  - [x] Mostrar en `CashRegistersReportClient`:
    - [x] Total de cajas, abiertas, cerradas.
    - [x] Balance total.
    - [x] Total de aperturas y cierres.
    - [x] Tabla y gráfico `byBranch` (sucursal, número de cajas).
  - [x] Botón **Exportar PDF** usando `exportCashRegistersReportToPDF`.

### 7. Reporte general

- **Back-end**
  - [x] Usar `ReportsService.getGeneralReport`.
  - [x] Endpoint `GET /api/[slug]/reportes/general` (`app/api/[slug]/reportes/general/route.ts`).
- **Front-end**
  - [x] Mostrar en `GeneralReportClient`:
    - [x] Ingresos, gastos, utilidad neta, margen de utilidad.
    - [x] Contadores: ventas, gastos, cotizaciones, productos, clientes.
  - [x] Botón **Exportar PDF** usando `exportGeneralReportToPDF`.

---

## Reportes avanzados

### 8. Analytics de ventas (tendencias y comparaciones)

- **Back-end**
  - [x] Usar `lib/services/analytics/analytics-service.ts` (KPI/Trends).
  - [x] Endpoints:
    - [x] `/api/[slug]/analytics/kpis` (`app/api/[slug]/analytics/kpis/route.ts`).
    - [x] `/api/[slug]/analytics/trends` (tendencias de ventas para `AnalyticsPageClient`).
    - [x] `/api/[slug]/analytics` con `type=sales|products|revenue|quotations|comparison` (dashboard básico de analytics).
- **Front-end**
  - [x] Dashboard avanzado:
    - [x] `AnalyticsDashboardClient` (métricas básicas, comparación de períodos, ventas, productos, ingresos, cotizaciones).
    - [x] `AnalyticsPageClient` (KPIs configurables, tendencias, predicciones, insights IA).

### 9. Rentabilidad de productos

- **Back-end**
  - [x] Usar `AnalyticsService.getProductProfitability`.
  - [x] Endpoint `/api/[slug]/analytics/profitability` (rentabilidad por producto).
- **Front-end**
  - [x] Tabla `ProductProfitabilityTable` en `AnalyticsPageClient` con:
    - [x] Producto, ingresos, costo, utilidad, margen %, unidades vendidas, precio promedio.
  - [x] Filtros de rango de fechas mediante `DateRangePicker`.

### 10. Segmentación de clientes (RFM)

- **Back-end**
  - [x] Usar `AnalyticsService.getCustomerSegmentation`.
  - [x] Endpoint `GET /api/[slug]/analytics/segmentation` (`app/api/[slug]/analytics/segmentation/route.ts`).
- **Front-end**
  - [x] Mostrar segmentos en `AnalyticsPageClient`:
    - [x] Campeones, Leales, Potenciales, En riesgo, Dormidos.
  - [x] Visualización con `CustomerSegmentationChart` y métricas por segmento.

### 11. Analytics de cotizaciones

- **Back-end**
  - [x] Usar `AnalyticsService.getQuotationAnalytics` (tipo `quotations` en `AnalyticsService`).
  - [x] Endpoint genérico `/api/[slug]/analytics?type=quotations&days=30` (`app/api/[slug]/analytics/route.ts`).
- **Front-end**
  - [x] Gráfico diario de cotizaciones en `AnalyticsDashboardClient` con `QuotationChart`:
    - [x] Cotizaciones creadas, convertidas, vencidas.
  - [x] Comparativa de períodos disponible vía `type=comparison` en el mismo endpoint.

### 12. Desempeño por sucursal

- **Back-end**
  - [x] Usar `ReportsService.getBranchPerformanceReport`.
  - [x] Endpoint `GET /api/[slug]/reportes/branches` (`app/api/[slug]/reportes/branches/route.ts`).
- **Front-end**
  - [x] Vista dedicada de sucursales `BranchesReportClient`:
    - [x] Tabla con sucursal, ventas, ingresos, ticket promedio, contribución %.
    - [x] Gráfico de barras comparando sucursales (`BranchesPerformanceChart`).
  - [x] Enlace desde el contenedor de reportes (`ReportsContainer`) a la ruta `/[slug]/reportes/branches`.

---

## 13. Exportación y formatos

- [ ] Unificar generación de PDFs de reportes en `pdf-reports-export.ts`.
- [ ] Asegurar que todos los reportes tengan:
  - [ ] Botón **Exportar PDF**.
  - [ ] Botón **Exportar CSV/Excel** (opcional, según prioridad).
- [ ] Respetar:
  - [ ] Logo, nombre, NIT, dirección y color de empresa configurado.
  - [ ] Formatos de fechas y moneda según preferencias del cliente.

---

## 14. Seguridad y rendimiento

- [ ] Proteger endpoints de reportes con permisos (roles).
- [ ] Agregar cache donde aplique (ya hay `getCachedData` en analytics).
- [ ] Limitar rangos de fechas muy grandes o paginar resultados pesados.


