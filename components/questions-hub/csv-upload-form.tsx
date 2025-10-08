"use client"

import React, { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Upload, 
  FileText, 
  X,
} from "lucide-react"

interface CSVUploadFormProps {
  selectedFile: File | null
  isUploading: boolean
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: () => void
}

export function CSVUploadForm({
  selectedFile,
  isUploading,
  onFileSelect,
  onRemoveFile
}: CSVUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

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
                onClick={onRemoveFile}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
