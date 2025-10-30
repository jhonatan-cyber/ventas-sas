import { useState, useEffect } from "react"
import { Customer } from "@/lib/types"

interface UseCustomersProps {
  page: number
  pageSize: number
  searchQuery: string
  statusFilter: "all" | "active" | "inactive"
}

export function useCustomers({ page, pageSize, searchQuery, statusFilter }: UseCustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
          search: searchQuery,
          status: statusFilter
        })

        const response = await fetch(`/api/administracion/customers?${params}`)
        if (response.ok) {
          const data = await response.json()
          setCustomers(data.customers || [])
          setTotalCustomers(data.total || 0)
        }
      } catch (error) {
        console.error("Error fetching customers:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomers()
  }, [page, pageSize, searchQuery, statusFilter])

  return { customers, totalCustomers, isLoading }
}

