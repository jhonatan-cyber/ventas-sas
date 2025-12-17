/**
 * Página principal de inventario avanzado
 */

"use client"

import { Package, AlertTriangle, RefreshCw, ArrowRightLeft } from "lucide-react"
import { useState } from "react"

import { InventoryAdjustments } from "./inventory-adjustments"
import { InventoryAlerts } from "./inventory-alerts"
import { InventoryMovements } from "./inventory-movements"
import { InventoryTransfers } from "./inventory-transfers"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface InventoryPageClientProps {
  customerSlug: string
}

export function InventoryPageClient({ customerSlug }: InventoryPageClientProps) {
const [activeTab, setActiveTab] = useState("alerts")

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-4 md:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">
          Inventario Avanzado
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Gestiona alertas, movimientos, transferencias y ajustes de inventario
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 rounded-full">
          <TabsTrigger value="alerts" className="rounded-full">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Alertas</span>
          </TabsTrigger>
          <TabsTrigger value="movements" className="rounded-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Movimientos</span>
          </TabsTrigger>
          <TabsTrigger value="transfers" className="rounded-full">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Transferencias</span>
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="rounded-full">
            <Package className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Ajustes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-6">
          <InventoryAlerts customerSlug={customerSlug} />
        </TabsContent>

        <TabsContent value="movements" className="mt-6">
          <InventoryMovements customerSlug={customerSlug} />
        </TabsContent>

        <TabsContent value="transfers" className="mt-6">
          <InventoryTransfers customerSlug={customerSlug} />
        </TabsContent>

        <TabsContent value="adjustments" className="mt-6">
          <InventoryAdjustments customerSlug={customerSlug} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

