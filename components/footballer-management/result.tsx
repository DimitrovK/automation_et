"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FootballerCard } from "@/components/footballer-management/footballer-card"
import type { Footballer } from "@/types/player"

type ResultType = 'create' | 'update' | 'delete'

interface ResultProps {
  type: ResultType
  footballer?: Footballer
  deletedFootballerId?: number
  showActions?: boolean
  onEdit?: (footballer: Footballer) => void
  onDelete?: (footballerId: number) => void
  customId?: string
}

const getResultConfig = (type: ResultType, footballerId?: number) => {
  switch (type) {
    case 'create':
      return {
        title: "Created Footballer Result",
        description: "Result from POST /data/footballers/ - New footballer created successfully",
        icon: "✅"
      }
    case 'update':
      return {
        title: "Updated Footballer Result", 
        description: `Result from PUT /data/footballers/${footballerId}/ - Footballer updated successfully`,
        icon: "📝"
      }
    case 'delete':
      return {
        title: "Footballer Deleted",
        description: `Result from DELETE /data/footballers/${footballerId}/ - Footballer successfully removed`,
        icon: "🗑️"
      }
    default:
      return {
        title: "Operation Result",
        description: "Operation completed successfully",
        icon: "✅"
      }
  }
}

export function Result({ 
  type,
  footballer,
  deletedFootballerId,
  showActions = false,
  onEdit,
  onDelete,
  customId
}: ResultProps) {
  const config = getResultConfig(type, footballer?.id || deletedFootballerId)
  const cardId = customId || `${type}-footballer-result`

  return (
    <Card id={cardId} className="transition-all duration-300">
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
        <CardDescription>
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {type === 'delete' && deletedFootballerId ? (
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
              <span className="text-lg">{config.icon}</span>
              <div>
                <p className="font-medium">Footballer ID {deletedFootballerId} has been permanently deleted</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
              </div>
            </div>
          </div>
        ) : footballer ? (
          <FootballerCard 
            footballer={footballer} 
            defaultExpanded={true} 
            showActions={showActions}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}
