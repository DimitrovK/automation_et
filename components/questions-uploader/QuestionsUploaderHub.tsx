"use client"

import React from "react"
import { QuestionsProvider, useQuestions } from "./QuestionsContext"
import { CSVUploadForm } from "./CSVUploadForm"
import { CSVPreview } from "./CSVPreview"
import { UploadButton } from "./UploadButton"
import { UploadResultDisplay } from "./UploadResultDisplay"
import { ConsoleLogDisplay } from "./ConsoleLogDisplay"
import { FormatGuidelines } from "./FormatGuidelines"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function QuestionsUploaderHub() {
  return (
    <QuestionsProvider>
      <QuestionsUploaderHubContent />
    </QuestionsProvider>
  )
}

function QuestionsUploaderHubContent() {
  const { selectedFile, uploadResult, isPaused } = useQuestions()

  // Hide upload button if upload was successful (but not if paused)
  const showUploadButton = selectedFile && (!uploadResult?.details?.successful || isPaused)
  const showRefreshButton = uploadResult?.details?.successful && !isPaused

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      {/* Format Guidelines Component - Collapsed by default at top */}
      <FormatGuidelines />

      {/* File Selection Component with Status Selector - Uses context directly */}
      <CSVUploadForm />

      {/* CSV Preview Component - Uses context directly */}
      <CSVPreview />

      {/* Upload Results Display - Uses context directly */}
      <UploadResultDisplay />

      {/* Console Log Display */}
      <ConsoleLogDisplay />

      {/* Upload Button - Below console, hidden after successful upload - Uses context directly */}
      {showUploadButton && <UploadButton />}

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
