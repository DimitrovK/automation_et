"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Calendar,
  MapPin,
  Users,
  Code,
  Settings,
  AlertCircle,
  HelpCircle,
  AlertTriangle,
  ExternalLink,
  Save,
  Edit,
  RotateCcw,
  Shield,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Team, PlayerData, PlayerConfiguration, CreateFootballerRequest, CreateFootballerTeamRequest } from "@/types/player"

import { useAuth } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Navigation } from "@/components/navigation"
import { JsonCommandPreview } from "@/components/career-lookup/json-command-preview"
import { DeploymentConsole, createLogEntry, type DeploymentLogEntry } from "@/components/career-lookup/deployment-console"
import { FootballerAPI } from "@/lib/footballer-api"
import config from "@/lib/config"

export default function FootballerCareerApp() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const deploymentConsoleRef = useRef<HTMLDivElement>(null)
  const [playerName, setPlayerName] = useState("")
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [loading, setLoading] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [deploymentLogs, setDeploymentLogs] = useState<DeploymentLogEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [useDirectConnection, setUseDirectConnection] = useState(true)
  const [webhookUrl, setWebhookUrl] = useState(config.N8N_WEBHOOK_URL)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [apiHelpOpen, setApiHelpOpen] = useState(false)
  const [isAdminMode, setIsAdminMode] = useState(true)
  const [adminBackendUrl, setAdminBackendUrl] = useState(config.ADMIN_BASE_URL)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isEditingNames, setIsEditingNames] = useState(false)

  const [dateOfBirth, setDateOfBirth] = useState("")
  const [nationality, setNationality] = useState("")
  const [wikipediaUrl, setWikipediaUrl] = useState("")
  const [isEditingDetails, setIsEditingDetails] = useState(false)

  const [originalConfig, setOriginalConfig] = useState<PlayerConfiguration | null>(null)
  const [originalFirstName, setOriginalFirstName] = useState("")
  const [originalLastName, setOriginalLastName] = useState("")
  const [originalDateOfBirth, setOriginalDateOfBirth] = useState("")
  const [originalNationality, setOriginalNationality] = useState("")
  const [originalWikipediaUrl, setOriginalWikipediaUrl] = useState("")

  const [playerConfig, setPlayerConfig] = useState<PlayerConfiguration>({
    status: "APPROVED",
    show_date_of_birth_on_search: false,
    retired: false,
    might_change: false,
    available_for_career_path: true,
    career_path_difficulty: "NORMAL",
  })

  // Validation state for data mismatches
  const [dataValidation, setDataValidation] = useState<{
    dateOfBirthMismatch: boolean
    countryMismatch: boolean
    countryIdMismatch: boolean
  }>({
    dateOfBirthMismatch: false,
    countryMismatch: false,
    countryIdMismatch: false,
  })

  // State for managing validation resolution
  const [validationDialogOpen, setValidationDialogOpen] = useState(false)
  const [validationResolved, setValidationResolved] = useState(false)
  const [chosenDataSource, setChosenDataSource] = useState<'wikipedia' | 'database' | null>(null)

  const addDebugInfo = (info: string) => {
    setDebugInfo((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${info}`])
    console.log(info)
  }

  const testConnection = async () => {
    setDebugInfo([])
    addDebugInfo("Testing connection...")
    addDebugInfo(`Testing: ${webhookUrl}`)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "test" }),
        signal: controller.signal,
        mode: "cors",
      })

      clearTimeout(timeoutId)
      addDebugInfo(`${webhookUrl} - Status: ${response.status}`)

      if (response.ok) {
        addDebugInfo(`✅ Connection successful!`)
      } else {
        addDebugInfo(`❌ Connection failed with status: ${response.status}`)
      }
    } catch (err) {
      addDebugInfo(`❌ Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const handleSearch = async () => {
    if (!playerName.trim()) return

    setLoading(true)
    setError(null)
    setPlayerData(null)
    setDebugInfo([])

    try {
      addDebugInfo(`Starting search for: ${playerName}`)

      let response: Response

      if (useDirectConnection) {
        addDebugInfo(`Using direct connection to: ${webhookUrl}`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)

        try {
          response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: playerName }),
            signal: controller.signal,
            mode: "cors",
          })
          clearTimeout(timeoutId)
          addDebugInfo(`Direct connection response status: ${response.status}`)
        } catch (fetchError) {
          clearTimeout(timeoutId)
          addDebugInfo(
            `Direct connection failed: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`,
          )
          throw fetchError
        }
      } else {
        addDebugInfo("Using API route proxy")

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)

        try {
          response = await fetch("/api/footballer-career", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: playerName }),
            signal: controller.signal,
          })
          clearTimeout(timeoutId)
          addDebugInfo(`API route response status: ${response.status}`)
        } catch (fetchError) {
          clearTimeout(timeoutId)
          addDebugInfo(`API route failed: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`)
          throw fetchError
        }
      }

      if (!response.ok) {
        const errorText = await response.text()
        addDebugInfo(`Error response: ${errorText}`)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      addDebugInfo("✅ Successfully received player data")
      setPlayerData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      addDebugInfo(`❌ Search failed: ${errorMessage}`)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const parsePlayerName = (fullName: string) => {
    const nameParts = fullName.replace(/_/g, " ").split(" ")
    if (nameParts.length >= 2) {
      const first = nameParts[0]
      const last = nameParts.slice(1).join(" ")
      return { first, last }
    }
    // For single names (like "Kaka"), put them in the Last Name field
    return { first: "", last: fullName.replace(/_/g, " ") }
  }

  const handleResync = () => {
    if (originalConfig) {
      setPlayerConfig(originalConfig)
    }
    setFirstName(originalFirstName)
    setLastName(originalLastName)
    setDateOfBirth(originalDateOfBirth)
    setNationality(originalNationality)
    setWikipediaUrl(originalWikipediaUrl)
    setIsEditingNames(false)
    setIsEditingDetails(false)
  }

  const handleUseWikipediaData = () => {
    if (!playerData) return
    
    // Restore original Wikipedia values
    setDateOfBirth(playerData.dateOfBirth)
    setNationality(playerData.birthCountry)
    setOriginalDateOfBirth(playerData.dateOfBirth)
    setOriginalNationality(playerData.birthCountry)
    
    setValidationResolved(true)
    setValidationDialogOpen(false)
    setChosenDataSource('wikipedia')
    console.log("Using Wikipedia data for player information")
  }

  const handleUseDatabaseData = () => {
    if (!playerData?.dbPlayerInfo) return
    
    // Update player information with database values
    setDateOfBirth(playerData.dbPlayerInfo.date_of_birth)
    setNationality(playerData.dbPlayerInfo.nation.name)
    setOriginalDateOfBirth(playerData.dbPlayerInfo.date_of_birth)
    setOriginalNationality(playerData.dbPlayerInfo.nation.name)
    
    setValidationResolved(true)
    setValidationDialogOpen(false)
    setChosenDataSource('database')
    console.log("Using database data for player information")
  }

  useEffect(() => {
    if (playerData) {
      const { first, last } = parsePlayerName(playerData.playerName)
      setFirstName(first)
      setLastName(last)
      setOriginalFirstName(first)
      setOriginalLastName(last)

      setDateOfBirth(playerData.dateOfBirth)
      setNationality(playerData.birthCountry)
      setWikipediaUrl("") // Initialize as empty, user can set manually
      setOriginalDateOfBirth(playerData.dateOfBirth)
      setOriginalNationality(playerData.birthCountry)
      setOriginalWikipediaUrl("")

      // Check if player exists in DB and has dbPlayerInfo
      if (playerData.playerFoundInDB && playerData.dbPlayerInfo) {
        // Pre-load player configuration from database
        const dbConfig = {
          status: "APPROVED" as const,
          show_date_of_birth_on_search: playerData.dbPlayerInfo.show_date_of_birth_on_search,
          retired: playerData.dbPlayerInfo.retired,
          might_change: playerData.dbPlayerInfo.might_change,
          available_for_career_path: playerData.dbPlayerInfo.available_for_career_path,
          career_path_difficulty: playerData.dbPlayerInfo.career_path_difficulty,
        }
        setPlayerConfig(dbConfig)
        setOriginalConfig(dbConfig)

        // Validate data consistency
        const validation = {
          dateOfBirthMismatch: playerData.dateOfBirth !== playerData.dbPlayerInfo.date_of_birth,
          countryMismatch: playerData.birthCountry !== playerData.dbPlayerInfo.nation.name,
          countryIdMismatch: playerData.countryID !== playerData.dbPlayerInfo.nation.id,
        }
        setDataValidation(validation)

        // Open validation dialog if there are mismatches
        const hasValidationIssues = validation.dateOfBirthMismatch || validation.countryMismatch || validation.countryIdMismatch
        if (hasValidationIssues) {
          setValidationDialogOpen(true)
          setValidationResolved(false)
        }

        // Log validation results
        if (validation.dateOfBirthMismatch) {
          console.warn(`Date of birth mismatch: API=${playerData.dateOfBirth}, DB=${playerData.dbPlayerInfo.date_of_birth}`)
        }
        if (validation.countryMismatch) {
          console.warn(`Country mismatch: API=${playerData.birthCountry}, DB=${playerData.dbPlayerInfo.nation.name}`)
        }
        if (validation.countryIdMismatch) {
          console.warn(`Country ID mismatch: API=${playerData.countryID}, DB=${playerData.dbPlayerInfo.nation.id}`)
        }
      } else {
        // Use default configuration for new players
        const defaultConfig = {
          status: "AWAITING_REVISION" as const,
          show_date_of_birth_on_search: false,
          retired: false,
          might_change: false,
          available_for_career_path: true,
          career_path_difficulty: "NORMAL" as const,
        }
        setPlayerConfig(defaultConfig)
        setOriginalConfig(defaultConfig)

        // Reset validation state
        setDataValidation({
          dateOfBirthMismatch: false,
          countryMismatch: false,
          countryIdMismatch: false,
        })
        setValidationResolved(false)
        setValidationDialogOpen(false)
        setChosenDataSource(null)
      }
    }
  }, [playerData])

  const getTeamAdminLink = (team: Team) => {
    if (!team.teamFound || !team.teamID) return null
    return config.getAdminUrl(`FootballData/team/${team.teamID}/change/`)
  }

  const addDeploymentLog = (type: DeploymentLogEntry['type'], message: string, data?: any) => {
    const logEntry = createLogEntry(type, message, data)
    setDeploymentLogs(prev => [...prev, logEntry])
    return logEntry
  }

  const clearDeploymentLogs = () => {
    setDeploymentLogs([])
  }

  const getCountryAdminLink = (playerData: PlayerData) => {
    if (!playerData.countryFoundInDB || !playerData.countryID) return null
    return config.getAdminUrl(`FootballData/nation/${playerData.countryID}/change/`)
  }

  const handleSaveConfiguration = async () => {
    // Only allow deployment if player is not found in DB
    if (playerData?.playerFoundInDB) {
      alert("This player already exists in the database. Deployment is only available for new players.")
      return
    }

    // Prevent multiple simultaneous deployments
    if (deploying) return

    // Clear previous logs
    clearDeploymentLogs()

    console.log("Player Configuration:", {
      playerName,
      firstName,
      lastName,
      dateOfBirth,
      nationality,
      playerData,
      configuration: playerConfig,
      dataValidation,
      configurationSource: "new_player",
    })
    
    // Show warning if there are validation issues
    if (dataValidation.dateOfBirthMismatch || dataValidation.countryMismatch || dataValidation.countryIdMismatch) {
      const confirmed = confirm(
        "Warning: Data validation issues detected. Are you sure you want to proceed with deployment? Check the console for details."
      )
      if (!confirmed) return
    }

    // Validate required fields
    if (!playerData?.countryID || !firstName.trim() || !lastName.trim() || !dateOfBirth) {
      alert("Please ensure all required fields are completed before deployment.")
      return
    }

    try {
      setDeploying(true)
      setError(null)

      // Scroll to deployment console
      setTimeout(() => {
        deploymentConsoleRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }, 100)

      addDeploymentLog('info', '🚀 Starting footballer deployment...')
      addDeploymentLog('info', `Player: ${firstName} ${lastName}`)
      
      // Prepare footballer data
      const footballerData: CreateFootballerRequest = {
        status: playerConfig.status,
        user: user!.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        nation_id: playerData.countryID!,
        date_of_birth: dateOfBirth,
        wikipedia_url: wikipediaUrl.trim() || null,
        show_date_of_birth_on_search: playerConfig.show_date_of_birth_on_search,
        retired: playerConfig.retired,
        is_player: true,
        is_manager: false,
        might_change: playerConfig.might_change,
        available_for_career_path: playerConfig.available_for_career_path,
        career_path_difficulty: playerConfig.career_path_difficulty,
      }

      addDeploymentLog('loading', 'Deploying footballer to database...')
      addDeploymentLog('request', 'POST /data/footballers/', footballerData)
      
      // Create the footballer
      const createdFootballer = await FootballerAPI.createFootballer(footballerData)
      
      addDeploymentLog('response', `✅ Footballer created successfully (ID: ${createdFootballer.id})`, createdFootballer)
      console.log("Footballer created successfully:", createdFootballer)

      // Create team records for teams found in the database
      const foundTeams = playerData.teams.filter(team => team.teamFound && team.teamID)
      let createdTeams = 0

      addDeploymentLog('info', `📊 Found ${foundTeams.length} teams to create records for`)

      for (let i = 0; i < foundTeams.length; i++) {
        const team = foundTeams[i]
        try {
          const transferTypeString = (team.typeOfTransfer || "").toLowerCase().trim()
          const transferType = transferTypeString.includes("loan") ? "loan" : "permanent"
          
          const teamData: CreateFootballerTeamRequest = {
            footballer_id: createdFootballer.id,
            team_id: team.teamID!,
            role: "player",
            apps: team.appearances,
            goals: team.goals,
            transfer_type: transferType,
            start_year: team.joinYear,
            end_year: team.departYear,
          }

          addDeploymentLog('loading', `Deploying team record ${i + 1}/${foundTeams.length}: ${team.teamName}`)
          addDeploymentLog('request', 'POST /data/footballer-teams/', teamData)

          const createdTeamRecord = await FootballerAPI.createFootballerTeam(teamData)
          
          addDeploymentLog('response', `✅ Team record created: ${team.teamName} (${team.joinYear}${team.departYear ? `-${team.departYear}` : ''})`, createdTeamRecord)
          createdTeams++
        } catch (teamError) {
          addDeploymentLog('error', `❌ Failed to create team record for ${team.teamName}: ${teamError instanceof Error ? teamError.message : 'Unknown error'}`)
          console.error(`Failed to create team record for ${team.teamName}:`, teamError)
        }
      }

      addDeploymentLog('success', `🎉 Deployment completed! Footballer: ${firstName} ${lastName}`)
      addDeploymentLog('success', `📈 Statistics: ${createdTeams}/${foundTeams.length} team records created`)

      // Optionally trigger a resync to show the updated state
      handleResync()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addDeploymentLog('error', `❌ Deployment failed: ${errorMessage}`)
      console.error("Deployment failed:", error)
      setError(`Deployment failed: ${errorMessage}`)
    } finally {
      setDeploying(false)
      addDeploymentLog('info', '🏁 Deployment process finished')
    }
  }

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
          {/* Mobile layout - settings button */}
          <div className="flex justify-end mb-4 md:hidden">
            <div className="flex gap-2 items-center">
              {/* Connection Settings Dialog */}
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Connection Settings
                    </DialogTitle>
                    <DialogDescription>Configure how to connect to your n8n webhook</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Webhook URL</Label>
                        <div className="flex gap-2">
                          <Input
                            id="webhook-url"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            placeholder={config.N8N_WEBHOOK_URL}
                            className="flex-1"
                          />
                          <Button onClick={testConnection} variant="outline" size="sm">
                            Test
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Enter your n8n webhook URL. This is where player search requests will be sent.
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="direct-connection"
                          checked={useDirectConnection}
                          onCheckedChange={setUseDirectConnection}
                        />
                        <Label htmlFor="direct-connection">Use direct connection to webhook</Label>
                      </div>
                      <p className="text-xs text-gray-500">
                        {useDirectConnection
                          ? "Requests go directly to the webhook URL above"
                          : "Requests go through the API route proxy below"}
                      </p>

                      <div className="space-y-2">
                        <Label htmlFor="api-url">API Route URL (Proxy)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="api-url"
                            value="/api/footballer-career"
                            disabled
                            className="flex-1 bg-gray-50 dark:bg-slate-600 cursor-not-allowed"
                          />
                          <Button
                            onClick={() => window.open("/api/footballer-career", "_blank")}
                            variant="outline"
                            size="sm"
                            disabled={useDirectConnection}
                          >
                            Open
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          {useDirectConnection
                            ? "API route is bypassed when using direct connection"
                            : "Currently using this API route as proxy to webhook"}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {debugInfo.length > 0 && (
                      <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium dark:text-white">Connection Test Results:</p>
                          <Badge variant="outline" className="text-xs">
                            {useDirectConnection ? `Direct: ${webhookUrl.split("/").pop()}` : "Via API Route"}
                          </Badge>
                        </div>
                        {debugInfo.map((info, index) => (
                          <p key={index} className="text-xs font-mono text-gray-700 dark:text-gray-300">
                            {info}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="admin-mode" checked={isAdminMode} onCheckedChange={setIsAdminMode} />
                      <Label htmlFor="admin-mode">Enable Admin Mode</Label>
                    </div>

                    {isAdminMode && (
                      <div className="space-y-2">
                        <Label htmlFor="admin-url">Admin Backend URL</Label>
                        <Input
                          id="admin-url"
                          value={adminBackendUrl}
                          onChange={(e) => setAdminBackendUrl(e.target.value)}
                          placeholder={config.ADMIN_BASE_URL}
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* API Help Dialog */}
              <Dialog open={apiHelpOpen} onOpenChange={setApiHelpOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
                    <Code className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      API Usage & Testing
                    </DialogTitle>
                    <DialogDescription>Direct webhook testing commands and troubleshooting</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Test webhook directly:</h4>
                      <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                        <code className="text-gray-800 dark:text-gray-200">
                          curl -X POST {webhookUrl} \\
                          <br />
                          -H "Content-Type: application/json" \\
                          <br />
                          -d {'{"name": "Borislav_Tsonev"}'}
                        </code>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2">Troubleshooting:</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                        <li>If curl works but web app doesn't, try toggling connection settings</li>
                        <li>Check browser console for CORS errors</li>
                        <li>Ensure n8n workflow is running on the specified port</li>
                        <li>Try both HTTP and HTTPS URLs if one fails</li>
                      </ul>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Help/Info Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      How to Use
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 text-sm">
                    <div>
                      <h4 className="font-medium">Player Names:</h4>
                      <p className="text-gray-600 dark:text-gray-400">Use underscores instead of spaces (e.g., "Borislav_Tsonev")</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Requirements:</h4>
                      <p className="text-gray-600 dark:text-gray-400">Make sure your n8n workflow is running on localhost:5678</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Troubleshooting:</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Use the settings (⚙️) and API (💻) buttons above for configuration and testing
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Footballer Career Lookup</h1>
          <p className="text-gray-600 dark:text-gray-300">Search for detailed career information of football players</p>

          {/* Desktop layout - settings button positioned absolutely */}
          <div className="absolute top-0 right-0 hidden md:flex gap-2 items-center">
            {/* Connection Settings Dialog */}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Connection Settings
                  </DialogTitle>
                  <DialogDescription>Configure how to connect to your n8n webhook</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Webhook URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="webhook-url"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          placeholder={config.N8N_WEBHOOK_URL}
                          className="flex-1"
                        />
                        <Button onClick={testConnection} variant="outline" size="sm">
                          Test
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Enter your n8n webhook URL. This is where player search requests will be sent.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="direct-connection"
                        checked={useDirectConnection}
                        onCheckedChange={setUseDirectConnection}
                      />
                      <Label htmlFor="direct-connection">Use direct connection to webhook</Label>
                    </div>
                    <p className="text-xs text-gray-500">
                      {useDirectConnection
                        ? "Requests go directly to the webhook URL above"
                        : "Requests go through the API route proxy below"}
                    </p>

                    <div className="space-y-2">
                      <Label htmlFor="api-url">API Route URL (Proxy)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="api-url"
                          value="/api/footballer-career"
                          disabled
                          className="flex-1 bg-gray-50 dark:bg-slate-600 cursor-not-allowed"
                        />
                        <Button
                          onClick={() => window.open("/api/footballer-career", "_blank")}
                          variant="outline"
                          size="sm"
                          disabled={useDirectConnection}
                        >
                          Open
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        {useDirectConnection
                          ? "API route is bypassed when using direct connection"
                          : "Currently using this API route as proxy to webhook"}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {debugInfo.length > 0 && (
                    <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-3 max-h-32 overflow-y-auto">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium dark:text-white">Connection Test Results:</p>
                        <Badge variant="outline" className="text-xs">
                          {useDirectConnection ? `Direct: ${webhookUrl.split("/").pop()}` : "Via API Route"}
                        </Badge>
                      </div>
                      {debugInfo.map((info, index) => (
                        <p key={index} className="text-xs font-mono text-gray-700 dark:text-gray-300">
                          {info}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="admin-mode" checked={isAdminMode} onCheckedChange={setIsAdminMode} />
                    <Label htmlFor="admin-mode">Enable Admin Mode</Label>
                  </div>

                  {isAdminMode && (
                    <div className="space-y-2">
                      <Label htmlFor="admin-url">Admin Backend URL</Label>
                      <Input
                        id="admin-url"
                        value={adminBackendUrl}
                        onChange={(e) => setAdminBackendUrl(e.target.value)}
                        placeholder={config.ADMIN_BASE_URL}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* API Help Dialog */}
            <Dialog open={apiHelpOpen} onOpenChange={setApiHelpOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
                  <Code className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    API Usage & Testing
                  </DialogTitle>
                  <DialogDescription>Direct webhook testing commands and troubleshooting</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Test webhook directly:</h4>
                    <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <code className="text-gray-800 dark:text-gray-200">
                        curl -X POST {webhookUrl} \\
                        <br />
                        -H "Content-Type: application/json" \\
                        <br />
                        -d {'{"name": "Borislav_Tsonev"}'}
                      </code>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Troubleshooting:</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                      <li>If curl works but web app doesn't, try toggling connection settings</li>
                      <li>Check browser console for CORS errors</li>
                      <li>Ensure n8n workflow is running on the specified port</li>
                      <li>Try both HTTP and HTTPS URLs if one fails</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Help/Info Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    How to Use
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium">Player Names:</h4>
                    <p className="text-gray-600 dark:text-gray-400">Use underscores instead of spaces (e.g., "Borislav_Tsonev")</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Requirements:</h4>
                    <p className="text-gray-600 dark:text-gray-400">Make sure your n8n workflow is running on localhost:5678</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Troubleshooting:</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Use the settings (⚙️) and API (💻) buttons above for configuration and testing
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Player Search
            </CardTitle>
            <CardDescription>We are searching Wikipedia so in order for this search to work, get the player name with underscores from there (e.g., "Borislav_Tsonev").</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter player name..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch} 
                disabled={loading || !playerName.trim()}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-emerald-500 hover:border-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </CardContent>
        </Card>

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
        <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Data Validation Required
              </DialogTitle>
              <DialogDescription>
                We found discrepancies between Wikipedia and Extratime DB information. Please choose which data to use for the player configuration.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Data Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Field</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Wikipedia Data</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Extratime DB Data</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {dataValidation.dateOfBirthMismatch && (
                      <tr className="bg-amber-50 dark:bg-amber-950/30">
                        <td className="px-4 py-3 text-sm font-medium">Date of Birth</td>
                        <td className="px-4 py-3 text-sm">{playerData?.dateOfBirth}</td>
                        <td className="px-4 py-3 text-sm">{playerData?.dbPlayerInfo?.date_of_birth}</td>
                        <td className="px-4 py-3">
                          <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-300">
                            Mismatch
                          </Badge>
                        </td>
                      </tr>
                    )}
                    {dataValidation.countryMismatch && (
                      <tr className="bg-amber-50 dark:bg-amber-950/30">
                        <td className="px-4 py-3 text-sm font-medium">Country</td>
                        <td className="px-4 py-3 text-sm">{playerData?.birthCountry}</td>
                        <td className="px-4 py-3 text-sm">{playerData?.dbPlayerInfo?.nation.name}</td>
                        <td className="px-4 py-3">
                          <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-300">
                            Mismatch
                          </Badge>
                        </td>
                      </tr>
                    )}
                    {dataValidation.countryIdMismatch && (
                      <tr className="bg-amber-50 dark:bg-amber-950/30">
                        <td className="px-4 py-3 text-sm font-medium">Country ID</td>
                        <td className="px-4 py-3 text-sm">{playerData?.countryID}</td>
                        <td className="px-4 py-3 text-sm">{playerData?.dbPlayerInfo?.nation.id}</td>
                        <td className="px-4 py-3">
                          <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-300">
                            Mismatch
                          </Badge>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleUseWikipediaData}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Use Wikipedia Data
                </Button>
                <Button
                  onClick={handleUseDatabaseData}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
                >
                  <Shield className="h-4 w-4" />
                  Use Database Data
                </Button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Your choice will update the Player Information section and affect the final configuration.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Data Validation Summary (for resolved validations) */}
        {playerData && playerData.playerFoundInDB && validationResolved && (dataValidation.dateOfBirthMismatch || dataValidation.countryMismatch || dataValidation.countryIdMismatch) && (
          <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950">
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <AlertDescription className="text-emerald-800 dark:text-emerald-300">
              <strong>Data Validation Resolved:</strong> You have chosen to use <strong>{chosenDataSource === 'wikipedia' ? 'Wikipedia' : 'Extratime Database'}</strong> data for conflicting information. The Player Configuration section has been updated accordingly.
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setValidationDialogOpen(true)}
                  className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
                >
                  Review Choices
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Player Data Display - Two Column Layout */}
        {playerData && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Sidebar - Player Profile */}
              <div className="lg:col-span-1 space-y-4">
                {/* Player Profile Card */}
                <Card className="sticky top-4">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl flex items-center justify-center gap-2">
                      {playerData.playerName}
                      {!playerData.playerFoundInDB && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                    </CardTitle>
                    <div className="flex justify-center">
                      {!playerData.playerFoundInDB && (
                        <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-300">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Not in Database
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Age</p>
                          <p className="font-medium text-sm dark:text-white">
                            {calculateAge(dateOfBirth)} ({dateOfBirth})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nationality</p>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm dark:text-white">{nationality}</p>
                            {!playerData.countryFoundInDB && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                          </div>
                          {!playerData.countryFoundInDB && (
                            <Badge
                              variant="destructive"
                              className="bg-amber-100 text-amber-800 border-amber-300 text-xs mt-1"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Not in Database
                            </Badge>
                          )}
                          {isAdminMode && getCountryAdminLink(playerData) && (
                            <a
                              href={getCountryAdminLink(playerData)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors text-xs mt-1"
                            >
                              Edit Country
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Position</p>
                          <p className="font-medium text-sm dark:text-white">{playerData.position}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Content - Senior Career */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Senior Career</CardTitle>
                    <CardDescription>Complete club history and statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-xs">
                              Club
                            </th>
                            <th className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-xs">
                              Apps
                            </th>
                            <th className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-xs">
                              Goals
                            </th>
                            <th className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-xs">
                              Transfer
                            </th>
                            <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-xs">
                              Season
                            </th>
                            <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-xs">
                              Status
                            </th>
                            {isAdminMode && (
                              <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-xs">
                                Admin Link
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {playerData.teams
                            .sort((a, b) => a.joinYear - b.joinYear)
                            .map((team, index) => (
                              <tr
                                key={index}
                                className={`border-b border-gray-100 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                                  !team.teamFound ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" : ""
                                }`}
                              >
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <div
                                        className={`font-medium ${!team.teamFound ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-white"} flex items-center gap-1`}
                                      >
                                        {!team.teamFound && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                        {team.teamName}
                                      </div>
                                      {team.originalTeamName !== team.teamName && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">({team.originalTeamName})</div>
                                      )}
                                      {team.teamFound && team.TeamNameDB && team.TeamNameDB !== team.teamName && (
                                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                          Name in DB: {team.TeamNameDB}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <div className="font-medium text-gray-900 dark:text-white">{team.appearances}</div>
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <div className="font-medium text-gray-900 dark:text-white">{team.goals}</div>
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      (team.typeOfTransfer || "").toLowerCase().includes("loan")
                                        ? "bg-orange-50 text-orange-700 border-orange-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                    }`}
                                  >
                                    {(team.typeOfTransfer || "").toLowerCase().includes("loan") ? "Loan" : "Permanent"}
                                  </Badge>
                                </td>
                                <td className="py-3 px-2 text-sm">
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {team.joinYear}
                                    {team.departYear ? `-${team.departYear}` : ""}
                                  </div>
                                </td>
                                <td className="py-3 px-2">
                                  {team.teamFound ? (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                                      Found in DB
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Not found in DB
                                    </Badge>
                                  )}
                                </td>
                                {isAdminMode && (
                                  <td className="py-3 px-2">
                                    {getTeamAdminLink(team) ? (
                                      <a
                                        href={getTeamAdminLink(team)!}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors text-sm"
                                      >
                                        Edit Team
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    ) : (
                                      <span className="text-gray-400 text-sm">No link</span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/30">
                            <td className="py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                              {playerData.summary.totalTeams} clubs
                            </td>
                            <td className="py-3 px-2 text-center font-semibold text-gray-900 dark:text-white">
                              {playerData.totalAppearances}
                            </td>
                            <td className="py-3 px-2 text-center font-semibold text-gray-900 dark:text-white">
                              {playerData.totalGoals}
                            </td>
                            <td className="py-3 px-2 text-center font-semibold text-gray-900 dark:text-white">-</td>
                            <td className="py-3 px-2 font-semibold text-gray-900 dark:text-white">Total</td>
                            <td className="py-3 px-2">
                              <div className="flex gap-1">
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                  {playerData.summary.foundTeams} found
                                </Badge>
                                {playerData.summary.notFoundTeams > 0 && (
                                  <Badge variant="destructive" className="text-xs bg-red-100 text-red-800">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {playerData.summary.notFoundTeams} missing
                                  </Badge>
                                )}
                              </div>
                            </td>
                            {isAdminMode && <td className="py-3 px-2"></td>}
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Player Configuration Section - Full Width */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Save className="h-6 w-6" />
                      Player Configuration
                    </CardTitle>
                    <CardDescription>Configure player settings for deployment to the database</CardDescription>
                  </div>
                  <Button variant="outline" onClick={handleResync} className="flex items-center gap-2 bg-transparent">
                    <RotateCcw className="h-4 w-4" />
                    Resync Data
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Top Row - Player Information and Player Settings */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Left Column - Player Information */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Player Information</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditingNames(!isEditingNames)
                          setIsEditingDetails(!isEditingDetails)
                        }}
                        className="h-8 px-3"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        {isEditingNames ? "Lock" : "Edit"}
                      </Button>
                    </div>
                    
                    {/* Player Status */}
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium">
                        Player Status
                      </Label>
                      <Select
                        value={playerConfig.status}
                        onValueChange={(value: "APPROVED" | "AWAITING_REVISION" | "DENIED" | "AWAITING_CHANGE_CHECK") =>
                          setPlayerConfig((prev) => ({
                            ...prev,
                            status: value,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="APPROVED">Approved</SelectItem>
                          <SelectItem value="AWAITING_REVISION">Awaiting Revision</SelectItem>
                          <SelectItem value="DENIED">Denied</SelectItem>
                          <SelectItem value="AWAITING_CHANGE_CHECK">Awaiting Change Check</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 dark:text-gray-400">The approval status of this footballer record</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name" className="text-sm font-medium">
                          First Name
                        </Label>
                        <Input
                          id="first-name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          disabled={!isEditingNames}
                          className={`${!isEditingNames ? "bg-gray-50 dark:bg-slate-600 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name" className="text-sm font-medium">
                          Last Name
                        </Label>
                        <Input
                          id="last-name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          disabled={!isEditingNames}
                          className={`${!isEditingNames ? "bg-gray-50 dark:bg-slate-600 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date-of-birth" className="text-sm font-medium">
                          Date of Birth
                        </Label>
                        <Input
                          id="date-of-birth"
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          disabled={!isEditingNames}
                          className={`${!isEditingNames ? "bg-gray-50 dark:bg-slate-600 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nationality" className="text-sm font-medium">
                          Nationality
                        </Label>
                        <Input
                          id="nationality"
                          value={nationality}
                          onChange={(e) => setNationality(e.target.value)}
                          disabled={!isEditingNames}
                          className={`${!isEditingNames ? "bg-gray-50 dark:bg-slate-600 cursor-not-allowed" : ""}`}
                        />
                      </div>
                    </div>

                    {/* Wikipedia URL - Full width */}
                    <div className="space-y-2">
                      <Label htmlFor="wikipediaUrl" className="text-sm font-medium">
                        Wikipedia URL
                      </Label>
                      <Input
                        id="wikipediaUrl"
                        placeholder="https://en.wikipedia.org/wiki/Player_Name"
                        value={wikipediaUrl}
                        onChange={(e) => setWikipediaUrl(e.target.value)}
                        disabled={!isEditingNames}
                        className={`${!isEditingNames ? "bg-gray-50 dark:bg-slate-600 cursor-not-allowed" : ""}`}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Optional: Link to the player's Wikipedia page
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Player information is automatically loaded from the search results. Click "Edit" to modify any field.
                    </p>
                  </div>

                  {/* Right Column - Player Settings */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Player Settings</h3>
                      {playerData?.playerFoundInDB && playerData?.dbPlayerInfo && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-700">
                          Pre-loaded from DB
                        </Badge>
                      )}
                    </div>
                    
                    {/* Display Settings */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="show_date_of_birth"
                          checked={playerConfig.show_date_of_birth_on_search}
                          onCheckedChange={(checked) =>
                            setPlayerConfig((prev) => ({
                              ...prev,
                              show_date_of_birth_on_search: checked as boolean,
                            }))
                          }
                        />
                        <Label htmlFor="show_date_of_birth" className="text-sm font-medium">
                          Show date of birth in search results
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                        Whether to display the year of birth in search results
                      </p>
                    </div>

                    {/* Player Status */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="retired"
                          checked={playerConfig.retired}
                          onCheckedChange={(checked) =>
                            setPlayerConfig((prev) => ({
                              ...prev,
                              retired: checked as boolean,
                            }))
                          }
                        />
                        <Label htmlFor="retired" className="text-sm font-medium">
                          Player is retired
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                        Indicates whether the footballer has retired from professional football
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="might_change"
                          checked={playerConfig.might_change}
                          onCheckedChange={(checked) =>
                            setPlayerConfig((prev) => ({
                              ...prev,
                              might_change: checked as boolean,
                            }))
                          }
                        />
                        <Label htmlFor="might_change" className="text-sm font-medium">
                          Information might change
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                        Indicates if the player information might need revisions in the future
                      </p>
                    </div>

                    {/* CareerPath Game Settings */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="available_for_career_path"
                          checked={playerConfig.available_for_career_path}
                          onCheckedChange={(checked) =>
                            setPlayerConfig((prev) => ({
                              ...prev,
                              available_for_career_path: checked as boolean,
                            }))
                          }
                        />
                        <Label htmlFor="available_for_career_path" className="text-sm font-medium">
                          Available for CareerPath game
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                        Whether the footballer is available in the CareerPath game
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="difficulty" className="text-sm font-medium">
                        CareerPath Difficulty Level
                      </Label>
                      <Select
                        value={playerConfig.career_path_difficulty}
                        onValueChange={(value: "EASY" | "NORMAL" | "HARD" | "EXTREME") =>
                          setPlayerConfig((prev) => ({
                            ...prev,
                            career_path_difficulty: value,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EASY">Easy</SelectItem>
                          <SelectItem value="NORMAL">Normal</SelectItem>
                          <SelectItem value="HARD">Hard</SelectItem>
                          <SelectItem value="EXTREME">Extreme</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 dark:text-gray-400">The difficulty level of this footballer in CareerPath</p>
                    </div>
                  </div>
                </div>

                <Separator className="my-8" />

                {/* JSON Commands Preview */}
                <JsonCommandPreview
                  playerData={playerData}
                  firstName={firstName}
                  lastName={lastName}
                  dateOfBirth={dateOfBirth}
                  nationality={nationality}
                  playerConfig={playerConfig}
                  countryID={playerData.countryID}
                />

                <Separator className="my-8" />

                {/* Validation Message and Save Button */}
                <div className="space-y-4">
                  {playerData.summary.notFoundTeams > 0 && (
                    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-amber-800 dark:text-amber-200">
                        <strong>Deployment Warning:</strong> {playerData.summary.notFoundTeams} team(s) not found in
                        database.
                        <br />
                        All teams must be added to the database before deployment. Use the admin links above to add
                        missing teams.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-center">
                    <Button
                      onClick={handleSaveConfiguration}
                      size="lg"
                      className="px-8 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-emerald-500 hover:border-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200"
                      disabled={playerData.summary.notFoundTeams > 0 || playerData?.playerFoundInDB || deploying}
                    >
                      <Save className="h-5 w-5 mr-2" />
                      {deploying 
                        ? 'Deploying...' 
                        : playerData?.playerFoundInDB 
                          ? 'Player Already in Database' 
                          : 'Deploy Footballer'
                      }
                    </Button>
                  </div>

                  {deploying ? (
                    <p className="text-center text-sm text-blue-600 font-medium">
                      🚀 Deploying footballer to database...
                    </p>
                  ) : playerData?.playerFoundInDB ? (
                    <p className="text-center text-sm text-amber-600 font-medium">
                      ⚠️ Player already exists - Deployment disabled for existing players
                    </p>
                  ) : playerData.summary.notFoundTeams === 0 ? (
                    <p className="text-center text-sm text-green-600 font-medium">
                      ✅ All teams verified in database - Ready for deployment
                    </p>
                  ) : null}
                </div>

                {/* Deployment Console */}
                <div ref={deploymentConsoleRef}>
                  <DeploymentConsole 
                    logs={deploymentLogs}
                    isActive={deploying}
                    onClear={clearDeploymentLogs}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
