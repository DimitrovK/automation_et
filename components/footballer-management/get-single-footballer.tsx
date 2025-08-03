"use client"

import React from "react"
import { ApiButton } from "@/components/ui/emerald-button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface GetSingleFootballerProps {
  footballerId: string
  singleLoading: boolean
  onFootballerIdChange: (id: string) => void
  onGetSingleFootballer: () => void
}

export function GetSingleFootballer({ 
  footballerId, 
  singleLoading, 
  onFootballerIdChange, 
  onGetSingleFootballer 
}: GetSingleFootballerProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && footballerId.trim()) {
      onGetSingleFootballer()
    }
  }

  return (
    <div>
      <h4 className="text-sm font-medium mb-2">Get Single Footballer</h4>
      <p className="text-xs text-gray-500 mb-3">
        Retrieve detailed information for a specific footballer by their unique ID.
      </p>
      <div className="flex gap-2 items-center flex-wrap">
        <Input
          placeholder="Enter footballer ID"
          value={footballerId}
          onChange={(e) => onFootballerIdChange(e.target.value)}
          className="w-40"
          onKeyPress={handleKeyPress}
        />
        <ApiButton 
          onClick={onGetSingleFootballer}
          disabled={!footballerId.trim()}
          loading={singleLoading}
          loadingText="Loading..."
          icon={Search}
        >
          GET /data/footballers/{"{id}"}
        </ApiButton>
      </div>
    </div>
  )
}
