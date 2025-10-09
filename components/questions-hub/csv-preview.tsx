"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Info, ChevronDown, ChevronUp } from "lucide-react"
import { useQuestions } from "./QuestionsContext"
import type { ParsedQuestion } from "@/types/csv"

export function CSVPreview() {
  const { previewData, allData } = useQuestions()
  const [showAll, setShowAll] = useState(false)
  
  if (previewData.length === 0) {
    return null
  }

  const displayData = showAll ? allData : previewData
  const hasMore = allData.length > previewData.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              CSV File Preview
            </CardTitle>
            <CardDescription>
              {showAll 
                ? `Showing all ${allData.length} rows from your CSV file`
                : `Showing first ${previewData.length} rows (Total: ${allData.length} rows)`
              }
            </CardDescription>
          </div>
          {hasMore && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show All ({allData.length})
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10">
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Row</th>
                {displayData[0] && Object.keys(displayData[0]).filter(k => k !== 'row').map(key => (
                  <th key={key} className="text-left p-2 font-medium capitalize">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, index) => (
                <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-2">
                    <Badge variant="outline">{row.row}</Badge>
                  </td>
                  {Object.entries(row).filter(([key]) => key !== 'row').map(([key, value]) => (
                    <td key={key} className="p-2 max-w-xs">
                      <div className="truncate" title={value as string}>
                        {value as string}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
