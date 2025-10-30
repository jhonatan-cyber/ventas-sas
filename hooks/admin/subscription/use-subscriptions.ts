import { useState, useEffect } from "react"

interface UseSubscriptionsProps {
  page: number
  pageSize: number
  searchQuery: string
  statusFilter: string
}

export function useSubscriptions({ page, pageSize, searchQuery, statusFilter }: UseSubscriptionsProps) {
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [totalSubscriptions, setTotalSubscriptions] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
          search: searchQuery,
          status: statusFilter
        })

        const response = await fetch(`/api/administracion/subscriptions?${params}`)
        if (response.ok) {
          const data = await response.json()
          setSubscriptions(data.subscriptions || [])
          setTotalSubscriptions(data.total || 0)
        }
      } catch (error) {
        console.error("Error fetching subscriptions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscriptions()
  }, [page, pageSize, searchQuery, statusFilter])

  return { subscriptions, totalSubscriptions, isLoading }
}

