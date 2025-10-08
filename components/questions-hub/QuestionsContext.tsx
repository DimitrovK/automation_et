"use client"

import React, { createContext, useContext, ReactNode } from "react"
import { useCSVUpload } from "@/hooks/use-csv-upload"
import type { ParsedQuestion } from "@/lib/csv-parser"
import type { UploadQuestionsResponse } from "@/lib/questions-upload-client"

// Context state interface
interface QuestionsContextState {
  // File state
  selectedFile: File | null
  handleFileSelect: (file: File | null) => void
  resetUpload: () => void
  
  // Upload state
  isUploading: boolean
  handleUpload: () => Promise<void>
  
  // Results state
  uploadResult: {
    type: 'success' | 'error'
    message: string
    details?: UploadQuestionsResponse
  } | null
  
  // Preview data
  previewData: ParsedQuestion[]
  allData: ParsedQuestion[]
}

// Create context
const QuestionsContext = createContext<QuestionsContextState | undefined>(undefined)

// Context provider component
export function QuestionsProvider({ children }: { children: ReactNode }) {
  const csvUploadHook = useCSVUpload()

  const value: QuestionsContextState = {
    selectedFile: csvUploadHook.selectedFile,
    handleFileSelect: csvUploadHook.handleFileSelect,
    resetUpload: csvUploadHook.resetUpload,
    isUploading: csvUploadHook.isUploading,
    handleUpload: csvUploadHook.handleUpload,
    uploadResult: csvUploadHook.uploadResult,
    previewData: csvUploadHook.previewData,
    allData: csvUploadHook.allData,
  }

  return (
    <QuestionsContext.Provider value={value}>
      {children}
    </QuestionsContext.Provider>
  )
}

// Custom hook to use Questions context
export function useQuestions() {
  const context = useContext(QuestionsContext)
  if (context === undefined) {
    throw new Error('useQuestions must be used within a QuestionsProvider')
  }
  return context
}
