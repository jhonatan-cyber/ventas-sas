"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { HelpCircle, Clock, CheckCircle2, XCircle, AlertCircle, MessageSquare, MoreVertical, Eye } from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface SupportTicketSummary {
  id: string
  ticketNumber: string
  title: string
  status: string
  priority: string
  category: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    comments: number
  }
}

interface SupportSasCardsProps {
  tickets: SupportTicketSummary[]
  onViewDetails: (ticketId: string) => void
}

export function SupportSasCards({ tickets, onViewDetails }: SupportSasCardsProps) {
  const t = useTranslations()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return {
          label: t('support.status.open'),
          className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
          icon: HelpCircle,
          iconColor: "text-blue-600 dark:text-blue-400",
        }
      case "in_progress":
        return {
          label: t('support.status.inProgress'),
          className: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
          icon: Clock,
          iconColor: "text-yellow-600 dark:text-yellow-400",
        }
      case "resolved":
        return {
          label: t('support.status.resolved'),
          className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
          icon: CheckCircle2,
          iconColor: "text-green-600 dark:text-green-400",
        }
      case "closed":
        return {
          label: t('support.status.closed'),
          className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800",
          icon: XCircle,
          iconColor: "text-gray-600 dark:text-gray-400",
        }
      default:
        return {
          label: status,
          className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800",
          icon: HelpCircle,
          iconColor: "text-gray-600 dark:text-gray-400",
        }
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return {
          label: t('support.priority.low'),
          className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
        }
      case "medium":
        return {
          label: t('support.priority.medium'),
          className: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
        }
      case "high":
        return {
          label: t('support.priority.high'),
          className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
        }
      case "urgent":
        return {
          label: t('support.priority.urgent'),
          className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
        }
      default:
        return {
          label: priority,
          className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800",
        }
    }
  }
  if (tickets.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {tickets.map((ticket) => {
        const statusBadge = getStatusBadge(ticket.status)
        const priorityBadge = getPriorityBadge(ticket.priority)
        const StatusIcon = statusBadge.icon

        return (
          <Card key={ticket.id} className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header con número de ticket, badges y menú de acciones */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0`}>
                      <StatusIcon className={`h-5 w-5 ${statusBadge.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {ticket.ticketNumber}
                        </span>
                        <Badge className={`${statusBadge.className} text-xs px-2 py-0.5 shrink-0`}>
                          {statusBadge.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                        {ticket.title}
                      </p>
                    </div>
                  </div>

                  {/* Menú de acciones */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem 
                        onClick={() => onViewDetails(ticket.id)} 
                        className="cursor-pointer text-blue-600 focus:text-blue-600 dark:text-blue-400 dark:focus:text-blue-400"
                      >
                        <Eye className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                        <span className="text-blue-600 dark:text-blue-400">{t('support.cards.viewDetails')}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Información detallada */}
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                  {/* Prioridad */}
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <Badge className={`${priorityBadge.className} text-xs px-2 py-0`}>
                      {priorityBadge.label}
                    </Badge>
                  </div>

                  {/* Categoría si existe */}
                  {ticket.category && (
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">{ticket.category}</span>
                    </div>
                  )}

                  {/* Comentarios */}
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {ticket._count?.comments || 0} {ticket._count?.comments === 1 ? t('support.cards.comments') : t('support.cards.commentsPlural')}
                    </span>
                  </div>

                  {/* Fecha de actualización */}
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {t('support.cards.updated')} {format(new Date(ticket.updatedAt), "dd MMM yyyy, HH:mm", { locale: es })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

