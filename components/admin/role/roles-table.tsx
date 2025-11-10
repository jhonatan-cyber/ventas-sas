"use client";

import {
  Eye,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Shield,
  FileText,
  Lock,
  Users,
  Key,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHasPermission } from "@/hooks/admin/use-user-permissions";
import { RoleWithStats } from "@/lib/services/admin/role-admin-service";

interface RolesTableProps {
  roles: RoleWithStats[];
  onEdit?: (role: RoleWithStats) => void;
  onView?: (role: RoleWithStats) => void;
  onToggleStatus?: (
    roleId: string,
    roleName: string,
    currentStatus: boolean,
    userCount: number
  ) => void;
  onDelete?: (roleId: string, roleName: string) => void;
  onManagePermissions?: (role: RoleWithStats) => void;
}

export function RolesTable({
  roles,
  onEdit,
  onView,
  onToggleStatus,
  onDelete,
  onManagePermissions,
}: RolesTableProps) {
  const canViewDetails = useHasPermission("roles_ver_detalles");
  const canEdit = useHasPermission("roles_editar");
  const canDelete = useHasPermission("roles_eliminar");
  const canActivate = useHasPermission("roles_activar");
  const canDeactivate = useHasPermission("roles_desactivar");
  const canManagePermissions = useHasPermission("roles_editar"); // Gestionar permisos requiere editar
  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#2a2a2a]">
            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
              <div className="flex items-center gap-2">Rol</div>
            </TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
              <div className="flex items-center gap-2">Descripción</div>
            </TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
              <div className="flex items-center gap-2">Permisos</div>
            </TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
              <div className="flex items-center gap-2">Usuarios</div>
            </TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
              <div className="flex items-center gap-2">Estado</div>
            </TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground py-8"
              >
                No hay roles registrados
              </TableCell>
            </TableRow>
          ) : (
            roles.map((role) => (
              <TableRow
                key={role.id}
                className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors border-b border-gray-100 dark:border-[#2a2a2a]"
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-black dark:text-white" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {role.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {role.description ? (
                      <>
                        <FileText className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {role.description}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(role.permissions) ? role.permissions : [])
                        .slice(0, 2)
                        .map((permission, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs border-gray-300 dark:border-gray-600"
                          >
                            {String(permission)}
                          </Badge>
                        ))}
                      {Array.isArray(role.permissions) &&
                        role.permissions.length > 2 && (
                          <Badge
                            variant="outline"
                            className="text-xs border-gray-300 dark:border-gray-600"
                          >
                            +{role.permissions.length - 2} más
                          </Badge>
                        )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                    <Badge
                      variant="secondary"
                      className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {role._count.adminUsers || 0} usuarios
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      role.isActive !== false
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                        : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                    }
                  >
                    {role.isActive !== false ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 justify-end text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => onView?.(role)}
                            disabled={!canViewDetails}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {canViewDetails
                          ? "Ver detalles"
                          : "No tiene permiso para ver detalles"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => onEdit?.(role)}
                            disabled={!canEdit}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {canEdit
                          ? "Editar rol"
                          : "No tiene permiso para editar roles"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => onManagePermissions?.(role)}
                            disabled={!canManagePermissions}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {canManagePermissions
                          ? "Gestionar permisos"
                          : "No tiene permiso para gestionar permisos"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`${
                              role.isActive ?? false
                                ? "text-orange-600 hover:text-orange-700"
                                : "text-green-600 hover:text-green-700"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            onClick={() => {
                              console.log("Toggle status clicked:", {
                                id: role.id,
                                currentStatus: role.isActive,
                              });
                              onToggleStatus?.(
                                role.id,
                                role.name,
                                role.isActive ?? false,
                                role._count.adminUsers || 0
                              );
                            }}
                            disabled={
                              ((role.isActive ?? false) && !canDeactivate) ||
                              (!(role.isActive ?? false) && !canActivate)
                            }
                          >
                            {role.isActive ?? false ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {role.isActive ?? false
                          ? canDeactivate
                            ? "Desactivar rol"
                            : "No tiene permiso para desactivar roles"
                          : canActivate
                          ? "Activar rol"
                          : "No tiene permiso para activar roles"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={
                              (role._count.adminUsers || 0) > 0 || !canDelete
                            }
                            onClick={() => onDelete?.(role.id, role.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {(role._count.adminUsers || 0) > 0
                          ? "No se puede eliminar: tiene usuarios asignados"
                          : !canDelete
                          ? "No tiene permiso para eliminar roles"
                          : "Eliminar rol"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}
