"use client"

import React from "react"
import { FileText } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useAuth } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"
import { QuestionsUploaderHub } from "@/components/questions-uploader/QuestionsUploaderHub"

export default function QuestionsUploaderPage() {
  const { isLoading, isAuthenticated } = useAuth()

  // Authentication check
  if (isLoading) {
    return <LoadingSpinner message="Authenticating" subtitle="Verifying staff access..." />
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-800 dark:to-emerald-900/30 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <Navigation />

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            Questions Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Upload and manage quiz questions via CSV files
          </p>
        </div>

        {/* Main Control Component */}
        <QuestionsUploaderHub />
      </div>
    </div>
  )
}