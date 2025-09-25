"use client"

import React from "react"
import { MessageCircle } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useAuth } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"
import { DiscordControlPage } from "@/components/discord-control/ControlPage"

export default function DiscordControlPageWrapper() {
  const { user, isLoading, isAuthenticated } = useAuth()

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
            <MessageCircle className="h-8 w-8 text-indigo-600" />
            Discord Control
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Send messages to Discord channels using the ExtraTime bot
          </p>
        </div>

        {/* Main Control Component */}
        <DiscordControlPage />
      </div>
    </div>
  )
}