"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Team, n8nWikiPlayerData, Footballer } from "@/types/player"
import { ConnectionSettings } from "@/components/career-lookup/connection-settings"
import { HelpDialog } from "@/components/career-lookup/help-dialog"
import { CareerLookupSearch } from "@/components/career-lookup/career-lookup-search"
import { CareerLookupDataValidation } from "@/components/career-lookup/career-lookup-data-validation"
import { CareerLookupPlayerConfiguration } from "@/components/career-lookup/career-lookup-player-configuration"
import { CareerLookupInfo } from "@/components/career-lookup/career-lookup-info"

import { useAuth } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Navigation } from "@/components/navigation"
import { FootballerAPI } from "@/lib/footballer-api"
import config from "@/lib/config"

export default function FootballerCareerApp() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const [playerName, setPlayerName] = useState("")
  const [playerData, setPlayerData] = useState<n8nWikiPlayerData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Connection settings from ConnectionSettings component
  const [connectionSettings, setConnectionSettings] = useState({
    webhookUrl: config.N8N_WEBHOOK_URL
  })

  // State for managing data source choice from validation
  const [chosenDataSource, setChosenDataSource] = useState<'wikipedia' | 'database' | null>(null)

  // State for database player info (fetched via API when playerDBId is available)
  const [dbPlayerInfo, setDbPlayerInfo] = useState<Footballer | null>(null)
  const [loadingDbPlayer, setLoadingDbPlayer] = useState(false)

  // Fetch database player info using the playerDBId
  const fetchDbPlayerInfo = async (playerDBId: number) => {
    try {
      setLoadingDbPlayer(true)
      const footballer = await FootballerAPI.getFootballer(playerDBId)      
      setDbPlayerInfo(footballer)
      return footballer
    } catch (error) {
      setDbPlayerInfo(null)
      return null
    } finally {
      setLoadingDbPlayer(false)
    }
  }

  // Handle reload player - triggers a fresh search with current player name
  const handleReloadPlayer = () => {
    if (playerName.trim()) {
      // Reset states
      setChosenDataSource(null)
      setDbPlayerInfo(null)
      setError(null)
      // Trigger a new search
      handleSearch()
    }
  }

  const handleSearch = async () => {
    if (!playerName.trim()) return

    setLoading(true)
    setError(null)
    setPlayerData(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      try {
        const response = await fetch(connectionSettings.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: playerName }),
          signal: controller.signal,
          mode: "cors",
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const data = await response.json()
        setPlayerData(data)
      } catch (fetchError) {
        clearTimeout(timeoutId)
        throw fetchError
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDataSourceChosen = (dataSource: 'wikipedia' | 'database') => {
    setChosenDataSource(dataSource)
    console.log(`Data source chosen: ${dataSource}`)
  }

  useEffect(() => {
    if (playerData) {
      // Check if player exists in DB and fetch player info via API
      if (playerData.playerFoundInDB && playerData.playerDBId) {
        fetchDbPlayerInfo(playerData.playerDBId)
      } else {
        // Reset state for new players
        setChosenDataSource(null)
        setDbPlayerInfo(null) // Clear previous DB player info
      }
    }
  }, [playerData])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner message="Authenticating" subtitle="Verifying staff access..." />
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-800 dark:to-emerald-900/30 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <Navigation />
        
        {/* Header with utility buttons */}
        <div className="text-center space-y-2 relative">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Footballer Career Lookup</h1>
          <p className="text-gray-600 dark:text-gray-300">Search for detailed career information of football players</p>

          {/* Desktop layout - settings button positioned absolutely */}
          <div className="absolute top-0 right-0 hidden md:flex gap-2 items-center">
            {/* Connection Settings Dialog */}
            <ConnectionSettings
              onSettingsChange={setConnectionSettings}
            />

            {/* Help/Info Dialog */}
            <HelpDialog />
          </div>
        </div>

        {/* Search Form */}
        <CareerLookupSearch
          playerName={playerName}
          loading={loading}
          onPlayerNameChange={setPlayerName}
          onSearch={handleSearch}
        />

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {error}
              <br />
              <br />
              <strong>Quick fixes:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Click the settings button (⚙️) above to test your connection</li>
                <li>Make sure your n8n workflow is running on the specified port</li>
                <li>Try the API testing button (💻) above for direct webhook testing</li>
                <li>Check the help button (❓) for more guidance</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {/* Data Validation Dialog */}
        <CareerLookupDataValidation
          playerData={playerData}
          dbPlayerInfo={dbPlayerInfo}
          onDataSourceChosen={handleDataSourceChosen}
        />

        {/* Player Data Display - Two Column Layout */}
        {playerData && (
          <>
            <CareerLookupInfo
              playerData={playerData}
              dbPlayerInfo={dbPlayerInfo}
              chosenDataSource={chosenDataSource}
              onDataSourceChange={setChosenDataSource}
            />

            {/* Player Configuration Section - Full Width */}
            <CareerLookupPlayerConfiguration
              playerData={playerData}
              dbPlayerInfo={dbPlayerInfo}
              chosenDataSource={chosenDataSource}
              onErrorChange={setError}
              onReloadPlayer={handleReloadPlayer}
            />
          </>
        )}
      </div>
    </div>
  )
}
