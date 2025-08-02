"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/loading-spinner"

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
        <Button 
          onClick={onGetFootballers}
          className="bg-gradient-to-r from-slate-500 to-slate-600 text-white border-slate-500 shadow-sm hover:from-slate-600 hover:to-slate-700"
        >
          {loading ? <LoadingSpinner size="sm" /> : "GET /data/footballers/"}
        </Button>
      </div>
    </div>
  )
}
