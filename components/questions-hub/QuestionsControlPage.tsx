"use client"

import React from "react"
import { QuestionsProvider, useQuestions } from "./QuestionsContext"
import { CSVUploadForm } from "./csv-upload-form"
import { CSVPreview } from "./csv-preview"
import { UploadButton } from "./upload-button"
import { UploadResultDisplay } from "./upload-result-display"
import { ConsoleLogDisplay } from "./console-log-display"
import { FormatGuidelines } from "./format-guidelines"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function QuestionsControlPage() {
  return (
    <QuestionsProvider>
      <QuestionsControlPageContent />
    </QuestionsProvider>
  )
}

function QuestionsControlPageContent() {
  const {
    selectedFile,
    handleFileSelect,
    resetUpload,
    isUploading,
    handleUpload,
    uploadResult,
    previewData,
    allData
  } = useQuestions()

  const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    handleFileSelect(file)
  }

  // Hide upload button if upload was successful
  const showUploadButton = selectedFile && !uploadResult?.details?.successful
  const showRefreshButton = uploadResult?.details?.successful

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      {/* Format Guidelines Component - Collapsed by default at top */}
      <FormatGuidelines />

      {/* File Selection Component */}
      <CSVUploadForm
        selectedFile={selectedFile}
        isUploading={isUploading}
        onFileSelect={onFileSelect}
        onRemoveFile={resetUpload}
      />

      {/* CSV Preview Component */}
      <CSVPreview data={previewData} allData={allData} />

      {/* Upload Results Display */}
      <UploadResultDisplay result={uploadResult} />

      {/* Console Log Display */}
      <ConsoleLogDisplay />

      {/* Upload Button - Below console, hidden after successful upload */}
      {showUploadButton && (
        <UploadButton
          isUploading={isUploading}
          questionCount={allData.length}
          onUpload={handleUpload}
        />
      )}

      {/* Refresh Button - Shows after successful upload */}
      {showRefreshButton && (
        <div className="flex justify-center">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Start New Upload
          </Button>
        </div>
      )}
    </div>
  )
}
