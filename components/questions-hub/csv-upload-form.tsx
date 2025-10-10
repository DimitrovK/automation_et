"use client"

import React, { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Upload, 
  FileText, 
  X,
  CheckCircle,
  Clock
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useQuestions } from "./QuestionsContext"

export function CSVUploadForm() {
  const { selectedFile, isUploading, handleFileSelect, resetUpload, selectedStatus, setSelectedStatus } = useQuestions()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    handleFileSelect(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-emerald-600" />
          Upload Questions CSV
        </CardTitle>
        <CardDescription>
          Select a CSV file containing your questions to upload to the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Input */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={onFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Select CSV File
              </Button>
            </label>
          </div>

          {/* Selected File Display */}
          {selectedFile && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-md border border-emerald-200 dark:border-emerald-800">
              <FileText className="h-5 w-5 text-emerald-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetUpload}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Status Selector - Only show when file is selected */}
        {selectedFile && (
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="status-select" className="text-sm font-medium">
              Question Status
            </Label>
            <div className="flex items-center gap-3">
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as 'AWAITING_REVISION' | 'APPROVED')}
                disabled={isUploading}
              >
                <SelectTrigger id="status-select" className="w-[240px]">
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
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedStatus === 'APPROVED' 
                  ? '✓ Questions will be immediately available in the app'
                  : '⚠ Questions will require manual review before appearing'
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
