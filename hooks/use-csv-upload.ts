/**
 * Custom hook for CSV file upload functionality
 * Uses QuestionsAPI class that leverages api-fetcher
 */

import { useState, useCallback, useRef } from "react"
import { parseCSV, getPreviewRows, validateCSVFile, ParsedQuestion } from "@/lib/csv-parser"
import { QuestionsAPI, type UploadQuestionsResponse } from "@/lib/questions-upload-client"

interface UploadResult {
  type: 'success' | 'error' | 'stopped'
  message: string
  details?: UploadQuestionsResponse
}

type QuestionStatus = 'AWAITING_REVISION' | 'APPROVED'

export function useCSVUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [previewData, setPreviewData] = useState<ParsedQuestion[]>([])
  const [allData, setAllData] = useState<ParsedQuestion[]>([])
  const [selectedStatus, setSelectedStatus] = useState<QuestionStatus>('AWAITING_REVISION')
  const [isPaused, setIsPaused] = useState(false)
  
  // Use ref to track if upload should stop
  const shouldStopRef = useRef(false)
  const partialResultsRef = useRef<UploadQuestionsResponse | null>(null)

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
    setIsPaused(false)
    shouldStopRef.current = false

    try {
      // Use QuestionsAPI class which leverages api-fetcher with status and stop callback
      const result = await QuestionsAPI.uploadQuestionsFromCSV(
        selectedFile, 
        selectedStatus,
        () => shouldStopRef.current, // Check if should stop
        (partialResults) => {
          partialResultsRef.current = partialResults // Save partial results
        }
      )
      
      // Check if upload was stopped
      if (shouldStopRef.current && partialResultsRef.current) {
        setUploadResult({ 
          type: 'stopped', 
          message: `Upload stopped. Processed ${partialResultsRef.current.total} questions.`,
          details: partialResultsRef.current
        })
        setIsPaused(true)
      } else {
        setUploadResult({ 
          type: result.successful > 0 ? 'success' : 'error', 
          message: result.message || `Upload complete!`,
          details: result
        })
      }
      
      // Don't clear the file - keep it for review
    } catch (error) {
      setUploadResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Upload failed'
      })
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, selectedStatus])

  /**
   * Stop the upload process
   */
  const stopUpload = useCallback(() => {
    shouldStopRef.current = true
  }, [])

  /**
   * Resume the upload process
   */
  const resumeUpload = useCallback(async () => {
    setIsPaused(false)
    shouldStopRef.current = false
    await handleUpload()
  }, [handleUpload])

  /**
   * Finish/acknowledge the stopped upload
   */
  const finishUpload = useCallback(() => {
    setIsPaused(false)
    // Keep the results but mark as finished
  }, [])

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
    selectedStatus,
    isPaused,
    handleFileSelect,
    handleUpload,
    resetUpload,
    setSelectedStatus,
    stopUpload,
    resumeUpload,
    finishUpload
  }
}
