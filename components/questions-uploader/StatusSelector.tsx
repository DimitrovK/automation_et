"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock } from "lucide-react"
import { useQuestions } from "./QuestionsContext"

export function StatusSelector() {
  const { selectedStatus, setSelectedStatus, isUploading } = useQuestions()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          Question Status
        </CardTitle>
        <CardDescription className="text-xs">
          Select the status for uploaded questions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Select
            value={selectedStatus}
            onValueChange={(value) => setSelectedStatus(value as 'AWAITING_REVISION' | 'APPROVED')}
            disabled={isUploading}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AWAITING_REVISION">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span>Awaiting Revision</span>
                </div>
              </SelectItem>
              <SelectItem value="APPROVED">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Approved</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Badge variant={selectedStatus === 'APPROVED' ? 'default' : 'secondary'} className="shrink-0">
            {selectedStatus === 'APPROVED' ? (
              <><CheckCircle className="h-3 w-3 mr-1" /> Ready to Publish</>
            ) : (
              <><Clock className="h-3 w-3 mr-1" /> Needs Review</>
            )}
          </Badge>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          {selectedStatus === 'APPROVED' 
            ? '✓ Questions will be immediately available in the app'
            : '⚠ Questions will require manual review before appearing in the app'
          }
        </p>
      </CardContent>
    </Card>
  )
}
