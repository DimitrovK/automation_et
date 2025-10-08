/**
 * Custom hook for CSV file upload functionality
 * Uses QuestionsAPI class that leverages api-fetcher
 */

import { useState, useCallback } from "react"
import { parseCSV, getPreviewRows, validateCSVFile, ParsedQuestion } from "@/lib/csv-parser"
import { QuestionsAPI, type UploadQuestionsResponse } from "@/lib/questions-upload-client"

interface UploadResult {
  type: 'success' | 'error'
  message: string
  details?: UploadQuestionsResponse
}

export function useCSVUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [previewData, setPreviewData] = useState<ParsedQuestion[]>([])
  const [allData, setAllData] = useState<ParsedQuestion[]>([])

  /**
   * Handle file selection and parse for preview
   */
  const handleFileSelect = useCallback(async (file: File | null) => {
    if (!file) {
      setSelectedFile(null)
      setPreviewData([])
      setAllData([])
      setUploadResult(null)
      return
    }

    // Validate file
    const validation = validateCSVFile(file)
    if (!validation.valid) {
      setUploadResult({
        type: 'error',
        message: validation.error || 'Invalid file'
      })
      return
    }

    setSelectedFile(file)
    setUploadResult(null)

    try {
      // Parse CSV for preview
      const text = await file.text()
      const parseResult = parseCSV(text)

      if (!parseResult.success) {
        setUploadResult({
          type: 'error',
          message: parseResult.error || 'Failed to parse CSV'
        })
        setSelectedFile(null)
        return
      }

      setAllData(parseResult.data)
      setPreviewData(getPreviewRows(parseResult.data, 5))
    } catch (error) {
      setUploadResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to read file'
      })
      setSelectedFile(null)
    }
  }, [])

  /**
   * Handle upload using QuestionsAPI (which uses api-fetcher)
   */
  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setUploadResult({
        type: 'error',
        message: 'No file selected'
      })
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      // Use QuestionsAPI class which leverages api-fetcher
      const result = await QuestionsAPI.uploadQuestionsFromCSV(selectedFile)
      
      setUploadResult({ 
        type: result.successful > 0 ? 'success' : 'error', 
        message: result.message || `Upload complete!`,
        details: result
      })
      
      // Don't clear the file - keep it for review
    } catch (error) {
      setUploadResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Upload failed'
      })
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile])

  /**
   * Reset upload state
   */
  const resetUpload = useCallback(() => {
    setSelectedFile(null)
    setPreviewData([])
    setAllData([])
    setUploadResult(null)
    setIsUploading(false)
  }, [])

  return {
    selectedFile,
    isUploading,
    uploadResult,
    previewData,
    allData,
    handleFileSelect,
    handleUpload,
    resetUpload
  }
}
