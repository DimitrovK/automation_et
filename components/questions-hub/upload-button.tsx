"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { ApiButton } from "@/components/ui/emerald-button"
import { Upload, Loader2 } from "lucide-react"

interface UploadButtonProps {
  isUploading: boolean
  questionCount: number
  onUpload: () => void
}

export function UploadButton({ isUploading, questionCount, onUpload }: UploadButtonProps) {
  return (
    <div className="flex justify-center">
      <ApiButton
        onClick={onUpload}
        disabled={isUploading}
        size="lg"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Uploading Questions...
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 mr-2" />
            Upload {questionCount} {questionCount === 1 ? 'Question' : 'Questions'}
          </>
        )}
      </ApiButton>
    </div>
  )
}
