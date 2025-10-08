"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertTriangle, Info, Copy, ChevronDown, ChevronUp, FileCheck, AlertCircle } from "lucide-react"
import { UploadQuestionsResponse } from "@/lib/questions-upload-client"

interface UploadResultDisplayProps {
  result: {
    type: 'success' | 'error'
    message: string
    details?: UploadQuestionsResponse
  } | null
}

interface CategorizedError {
  row: string
  message: string
  type: 'duplicate' | 'failed' | 'skipped' | 'other'
  fullText?: string
}

type FilterType = 'all' | 'uploaded' | 'duplicates' | 'skipped' | 'failed'

export function UploadResultDisplay({ result }: UploadResultDisplayProps) {
  const [showDetails, setShowDetails] = useState(true)
  const [copied, setCopied] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  if (!result) return null

  const details = result.details

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Categorize errors by type
  const categorizeErrors = (errors: string[]): CategorizedError[] => {
    return errors.map(error => {
      const rowMatch = error.match(/Row (\d+):/)
      const row = rowMatch ? rowMatch[1] : '?'
      
      let type: 'duplicate' | 'failed' | 'skipped' | 'other' = 'other'
      let message = error
      
      if (error.includes('duplicate')) {
        type = 'duplicate'
        message = error.replace(/Row \d+: /, '').replace(' (duplicate skipped)', '')
      } else if (error.includes('Failed to upload')) {
        type = 'failed'
        message = error.replace(/Row \d+: /, '')
      } else if (error.includes('Categories not found') || error.includes('No categories provided') || error.includes('Missing question text')) {
        type = 'skipped'
        message = error.replace(/Row \d+: /, '').replace(' (question skipped)', '')
      }
      
      return { row, message, type }
    })
  }

  // If no details, show simple alert
  if (!details) {
    return (
      <Alert variant={result.type === 'success' ? 'default' : 'destructive'}>
        {result.type === 'success' ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        <AlertDescription>
          <p className="font-medium">{result.message}</p>
        </AlertDescription>
      </Alert>
    )
  }

  const categorizedErrors = details.errors ? categorizeErrors(details.errors) : []
  const successfulErrors = categorizedErrors.filter(e => e.type === 'other')
  const duplicateErrors = categorizedErrors.filter(e => e.type === 'duplicate')
  const failedErrors = categorizedErrors.filter(e => e.type === 'failed')
  const skippedErrors = categorizedErrors.filter(e => e.type === 'skipped')

  // Get questions for the active filter
  const getFilteredQuestions = () => {
    switch (activeFilter) {
      case 'uploaded':
        return details.uploadedQuestions || []
      case 'duplicates':
        return details.duplicateQuestions || []
      case 'skipped':
        return details.skippedQuestions || []
      case 'failed':
        return details.failedQuestions || []
      default:
        return []
    }
  }

  const filteredQuestions = getFilteredQuestions()
  const hasQuestions = filteredQuestions.length > 0

  // Show detailed results card
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-blue-600" />
          Upload Results
        </CardTitle>
        <CardDescription>{result.message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
              activeFilter === 'all'
                ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600 scale-105'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:scale-105'
            }`}
          >
            <span className="text-2xl font-bold text-blue-600">{details.total}</span>
            <span className="text-sm text-gray-600 dark:text-gray-300">Total</span>
          </button>
          <button
            onClick={() => setActiveFilter('uploaded')}
            disabled={details.successful === 0}
            className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
              details.successful === 0 
                ? 'opacity-50 cursor-not-allowed' 
                : activeFilter === 'uploaded'
                ? 'bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-600 scale-105'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:scale-105 cursor-pointer'
            }`}
          >
            <span className="text-2xl font-bold text-green-600">{details.successful}</span>
            <span className="text-sm text-gray-600 dark:text-gray-300">✅ Uploaded</span>
          </button>
          <button
            onClick={() => setActiveFilter('duplicates')}
            disabled={details.duplicates === 0}
            className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
              details.duplicates === 0 
                ? 'opacity-50 cursor-not-allowed' 
                : activeFilter === 'duplicates'
                ? 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-400 dark:border-yellow-600 scale-105'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 hover:scale-105 cursor-pointer'
            }`}
          >
            <span className="text-2xl font-bold text-yellow-600">{details.duplicates}</span>
            <span className="text-sm text-gray-600 dark:text-gray-300">⚠️ Duplicates</span>
          </button>
          <button
            onClick={() => setActiveFilter('skipped')}
            disabled={details.skipped === 0}
            className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
              details.skipped === 0 
                ? 'opacity-50 cursor-not-allowed' 
                : activeFilter === 'skipped'
                ? 'bg-orange-100 dark:bg-orange-900/40 border-orange-400 dark:border-orange-600 scale-105'
                : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:scale-105 cursor-pointer'
            }`}
          >
            <span className="text-2xl font-bold text-orange-600">{details.skipped}</span>
            <span className="text-sm text-gray-600 dark:text-gray-300">⏭️ Skipped</span>
          </button>
          <button
            onClick={() => setActiveFilter('failed')}
            disabled={details.failed === 0}
            className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
              details.failed === 0 
                ? 'opacity-50 cursor-not-allowed' 
                : activeFilter === 'failed'
                ? 'bg-red-100 dark:bg-red-900/40 border-red-400 dark:border-red-600 scale-105'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:scale-105 cursor-pointer'
            }`}
          >
            <span className="text-2xl font-bold text-red-600">{details.failed}</span>
            <span className="text-sm text-gray-600 dark:text-gray-300">❌ Failed</span>
          </button>
        </div>

        {/* Filtered Questions Display */}
        {activeFilter !== 'all' && hasQuestions && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                {activeFilter === 'uploaded' && <CheckCircle className="h-4 w-4 text-green-600" />}
                {activeFilter === 'duplicates' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                {activeFilter === 'skipped' && <AlertCircle className="h-4 w-4 text-orange-600" />}
                {activeFilter === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Questions ({filteredQuestions.length})
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter('all')}
              >
                Clear Filter
              </Button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredQuestions.map((q, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    activeFilter === 'uploaded'
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                      : activeFilter === 'duplicates'
                      ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                      : activeFilter === 'skipped'
                      ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800'
                      : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Badge variant="outline" className="shrink-0">
                      Row {q.row}
                    </Badge>
                    <Badge variant="secondary" className="shrink-0">
                      {q.difficulty}
                    </Badge>
                    {q.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {q.categories.map((cat, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {q.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Summary */}
        {details.successful > 0 && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 dark:text-green-200">Successfully Uploaded!</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              {details.successful} question{details.successful !== 1 ? 's' : ''} uploaded successfully and set to <strong>AWAITING_REVISION</strong> status.
            </AlertDescription>
          </Alert>
        )}

        {/* Details Toggle */}
        {details.errors && details.errors.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                Detailed Breakdown ({details.errors.length} items)
              </h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(details.errors.join('\n'))}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy All'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Show
                    </>
                  )}
                </Button>
              </div>
            </div>

            {showDetails && (
              <div className="space-y-4">
                {/* Duplicates */}
                {duplicateErrors.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                    <h5 className="font-semibold text-sm mb-2 flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                      <AlertTriangle className="h-4 w-4" />
                      Duplicates ({duplicateErrors.length})
                    </h5>
                    <div className="space-y-1">
                      {duplicateErrors.map((error, index) => (
                        <div key={index} className="text-sm flex items-start gap-2 text-yellow-700 dark:text-yellow-300">
                          <Badge variant="outline" className="shrink-0 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border-yellow-300">
                            Row {error.row}
                          </Badge>
                          <span>{error.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skipped */}
                {skippedErrors.length > 0 && (
                  <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                    <h5 className="font-semibold text-sm mb-2 flex items-center gap-2 text-orange-800 dark:text-orange-200">
                      <AlertCircle className="h-4 w-4" />
                      Skipped ({skippedErrors.length})
                    </h5>
                    <div className="space-y-1">
                      {skippedErrors.map((error, index) => (
                        <div key={index} className="text-sm flex items-start gap-2 text-orange-700 dark:text-orange-300">
                          <Badge variant="outline" className="shrink-0 bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 border-orange-300">
                            Row {error.row}
                          </Badge>
                          <span>{error.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Failed */}
                {failedErrors.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 border border-red-200 dark:border-red-800">
                    <h5 className="font-semibold text-sm mb-2 flex items-center gap-2 text-red-800 dark:text-red-200">
                      <XCircle className="h-4 w-4" />
                      Failed ({failedErrors.length})
                    </h5>
                    <div className="space-y-1">
                      {failedErrors.map((error, index) => (
                        <div key={index} className="text-sm flex items-start gap-2 text-red-700 dark:text-red-300">
                          <Badge variant="outline" className="shrink-0 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-300">
                            Row {error.row}
                          </Badge>
                          <span>{error.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* API Response Raw Data (for debugging) */}
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            View Raw API Response
          </summary>
          <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-x-auto">
            {JSON.stringify(details, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  )
}
