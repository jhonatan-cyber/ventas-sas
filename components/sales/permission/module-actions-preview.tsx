"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getModuleActions, getConfiguredModules } from "@/lib/config/sas-module-actions"
import { getSasModuleLabelsMap } from "@/lib/config/sas-modules"

interface ModuleActionsPreviewProps {
  selectedModule?: string
}

export function ModuleActionsPreview({ selectedModule }: ModuleActionsPreviewProps) {
  const moduleLabels = getSasModuleLabelsMap()
  const configuredModules = getConfiguredModules()

  if (selectedModule) {
    const actions = getModuleActions(selectedModule)
    const moduleLabel = moduleLabels[selectedModule] || selectedModule

    return (
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-200">
            Acciones disponibles para {moduleLabel}
          </CardTitle>
          <CardDescription className="text-xs text-blue-700 dark:text-blue-300">
            Este módulo tiene {actions.length} acción(es) disponible(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Badge 
                key={action.id} 
                variant="secondary" 
                className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700"
              >
                {action.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-200">
          Acciones por módulo
        </CardTitle>
        <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
          Cada módulo tiene diferentes acciones disponibles según su funcionalidad
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {configuredModules.slice(0, 6).map((moduleId) => {
          const actions = getModuleActions(moduleId)
          const moduleLabel = moduleLabels[moduleId] || moduleId
          
          return (
            <div key={moduleId} className="space-y-1">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {moduleLabel} ({actions.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {actions.slice(0, 4).map((action) => (
                  <Badge 
                    key={action.id} 
                    variant="outline" 
                    className="text-xs h-5 px-2"
                  >
                    {action.label}
                  </Badge>
                ))}
                {actions.length > 4 && (
                  <Badge variant="outline" className="text-xs h-5 px-2 text-gray-500">
                    +{actions.length - 4} más
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
        {configuredModules.length > 6 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
            Y {configuredModules.length - 6} módulo(s) más...
          </div>
        )}
      </CardContent>
    </Card>
  )
}