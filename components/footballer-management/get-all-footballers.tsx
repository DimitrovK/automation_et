"use client"

import React from "react"
import { ApiButton } from "@/components/ui/emerald-button"
import { Database } from "lucide-react"

interface GetAllFootballersProps {
  loading: boolean
  onGetFootballers: () => void
}

export function GetAllFootballers({ loading, onGetFootballers }: GetAllFootballersProps) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">Get All Footballers</h4>
      <p className="text-xs text-gray-500 mb-3">
        Retrieve a paginated list of all footballers with optional filtering, searching, and sorting.
      </p>
      <div className="flex gap-2 flex-wrap">
        <ApiButton 
          onClick={onGetFootballers}
          loading={loading}
          loadingText="Loading..."
          icon={Database}
        >
          GET /data/footballers/
        </ApiButton>
      </div>
    </div>
  )
}
