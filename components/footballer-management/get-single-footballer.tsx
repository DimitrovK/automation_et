"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/loading-spinner"

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
        <Button 
          onClick={onGetSingleFootballer}
          disabled={singleLoading || !footballerId.trim()}
          className="bg-gradient-to-r from-slate-500 to-slate-600 text-white border-slate-500 shadow-sm hover:from-slate-600 hover:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {singleLoading ? <LoadingSpinner size="sm" /> : "GET /data/footballers/{id}"}
        </Button>
      </div>
    </div>
  )
}
