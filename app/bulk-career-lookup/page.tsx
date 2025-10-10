"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Users,
  Search,
  Eye,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Globe,
  User,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Footballer } from "@/types/player"
import { useAuth } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Navigation } from "@/components/navigation"
import { FootballerAPI } from "@/lib/footballer-api"
import { AmberButton } from "@/components/ui/amber-button"
import { ApiButton } from "@/components/ui/emerald-button"
import { GraphiteButton } from "@/components/ui/graphite-button"
import config from "@/lib/config"
import Link from "next/link"
import { DeploymentLogEntry, createLogEntry } from "@/components/career-lookup/deployment-console"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Terminal, Clock, XCircle, Loader2 } from "lucide-react"

interface BulkLookupResult {
  footballer: Footballer
  status: 'pending' | 'processing' | 'completed' | 'error' | 'discrepancy'
  wikipediaData?: any
  databaseData?: Footballer
  discrepancies?: string[]
  error?: string
  logs: DeploymentLogEntry[]
}

interface BulkStats {
  total: number
  processed: number
  discrepancies: number
  errors: number
}

export default function BulkCareerLookupPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  
  // State for footballer data
  const [footballers, setFootballers] = useState<Footballer[]>([])
  const [loadingFootballers, setLoadingFootballers] = useState(false)
  const [selectedFootballers, setSelectedFootballers] = useState<Set<number>>(new Set())
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalFootballers, setTotalFootballers] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10) // Configurable page size
  
  // Bulk processing state
  const [bulkResults, setBulkResults] = useState<Map<number, BulkLookupResult>>(new Map())
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentlyProcessing, setCurrentlyProcessing] = useState<number | null>(null)
  
  // Collapse/expand state
  const [expandedPlayers, setExpandedPlayers] = useState<Set<number>>(new Set())
  
  // Filter settings
  const [playerFilter, setPlayerFilter] = useState<'all' | 'active' | 'retired'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [useWikipediaUrl, setUseWikipediaUrl] = useState(true)
  
  // Statistics
  const [stats, setStats] = useState<BulkStats>({ total: 0, processed: 0, discrepancies: 0, errors: 0 })

  // Load footballers on component mount and when page changes
  useEffect(() => {
    if (isAuthenticated) {
      loadFootballers()
    }
  }, [isAuthenticated, currentPage])

  // Update statistics when results change
  useEffect(() => {
    const results = Array.from(bulkResults.values())
    setStats({
      total: results.length,
      processed: results.filter(r => r.status === 'completed' || r.status === 'error' || r.status === 'discrepancy').length,
      discrepancies: results.filter(r => r.status === 'discrepancy').length,
      errors: results.filter(r => r.status === 'error').length,
    })
  }, [bulkResults])

  // Calculate stats for display
  const getDisplayStats = () => {
    const results = Array.from(bulkResults.values())
    const completed = results.filter(r => r.status === 'completed').length
    const errors = results.filter(r => r.status === 'error').length
    const discrepancies = results.filter(r => r.status === 'discrepancy').length
    const processed = completed + errors + discrepancies
    
    return {
      total: results.length,
      processed,
      withoutIssues: completed,
      discrepancies,
      errors,
    }
  }

  const applyFilters = () => {
    setCurrentPage(1) // Reset to first page when filters change
    setSelectedFootballers(new Set()) // Clear selections when applying new filters
    loadFootballers()
  }

  const loadFootballers = async () => {
    setLoadingFootballers(true)
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        page_size: itemsPerPage,
      }
      
      if (playerFilter !== 'all') {
        params.retired = playerFilter === 'retired' ? 'true' : 'false'
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      const response = await FootballerAPI.getFootballers(params)
      setFootballers(response.results)
      setTotalFootballers(response.count || 0)
      setTotalPages(Math.ceil((response.count || 0) / itemsPerPage))
    } catch (error) {
      console.error('Failed to load footballers:', error)
    } finally {
      setLoadingFootballers(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFootballers(new Set(footballers.map(f => f.id)))
    } else {
      setSelectedFootballers(new Set())
    }
  }

  const handleSelectFootballer = (footballerId: number, checked: boolean) => {
    const newSelection = new Set(selectedFootballers)
    if (checked) {
      newSelection.add(footballerId)
    } else {
      newSelection.delete(footballerId)
    }
    setSelectedFootballers(newSelection)
  }

  const togglePlayerExpanded = (footballerId: number) => {
    const newExpanded = new Set(expandedPlayers)
    if (newExpanded.has(footballerId)) {
      newExpanded.delete(footballerId)
    } else {
      newExpanded.add(footballerId)
    }
    setExpandedPlayers(newExpanded)
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      // Clear selections when changing pages to avoid confusion
      setSelectedFootballers(new Set())
    }
  }

  const processFootballerCareer = async (footballer: Footballer): Promise<BulkLookupResult> => {
    const logs: DeploymentLogEntry[] = []
    
    try {
      // Enhanced: Log which method is being used for Wikipedia lookup, plain text with URLs
      if (useWikipediaUrl && footballer.wikipedia_url) {
        logs.push(
          createLogEntry(
            'info',
            `Player's ${footballer.first_name} ${footballer.last_name} Wikipedia URL found: ${footballer.wikipedia_url}.`,
            {
              wikipedia_url: footballer.wikipedia_url,
              lookup_url: `/career-lookup?url=${encodeURIComponent(footballer.wikipedia_url)}&useWikiUrl=true`
            }
          )
        )
      } else {
        const fullName = `${footballer.first_name} ${footballer.last_name}`
        const wikiSearchUrl = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(fullName)}`
        logs.push(
          createLogEntry(
            'info',
            `No Wikipedia URL found for ${fullName}. Using player full name for lookup. Wikipedia search: ${wikiSearchUrl}.`,
            {
              wikipedia_search_url: wikiSearchUrl,
              lookup_url: `/career-lookup?name=${encodeURIComponent(fullName)}&useWikiUrl=false`
            }
          )
        )
      }

      logs.push(createLogEntry('request', `Calling n8n webhook for Wikipedia data...`))

      // Call n8n webhook for Wikipedia data
      const wikipediaData = await fetchWikipediaData(footballer)

      logs.push(createLogEntry('response', `Wikipedia data received successfully`, {
        playerFoundInDB: wikipediaData?.playerFoundInDB,
        teamsFound: wikipediaData?.teams?.length || 0
      }))

      logs.push(createLogEntry('request', `Fetching fresh database data...`))

      // Fetch fresh database data using the API
      const databaseData = await FootballerAPI.getFootballer(footballer.id)

      logs.push(createLogEntry('response', `Database data retrieved`, {
        teams_count: databaseData.teams_played_for?.length || 0
      }))

      logs.push(createLogEntry('loading', `Analyzing data for discrepancies...`))

      // Analyze for discrepancies between Wikipedia and database data
      const discrepancies = analyzeDiscrepancies(databaseData, wikipediaData)

      if (discrepancies.length > 0) {
        logs.push(createLogEntry('error', `${discrepancies.length} discrepancy(ies) found`, {
          discrepancies: discrepancies.slice(0, 3) // Show first 3 in logs
        }))
      } else {
        logs.push(createLogEntry('success', `No discrepancies found - data matches!`))
      }

      return {
        footballer,
        status: discrepancies.length > 0 ? 'discrepancy' : 'completed',
        wikipediaData,
        databaseData,
        discrepancies: discrepancies.length > 0 ? discrepancies : undefined,
        logs
      }
    } catch (error) {
      logs.push(createLogEntry('error', `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        error: error instanceof Error ? error.stack : error
      }))

      return {
        footballer,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        logs
      }
    }
  }

  const fetchWikipediaData = async (footballer: Footballer, retries = 2) => {
    const webhookUrl = config.N8N_WEBHOOK_URL;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        // Use Wikipedia URL if enabled and available, otherwise use name search
        let payload: any;
        if (useWikipediaUrl && footballer.wikipedia_url) {
          payload = {
            wikipedia_url: footballer.wikipedia_url,
            name: `${footballer.first_name} ${footballer.last_name}`,
            dateOfBirth: footballer.date_of_birth,
          };
        } else {
          payload = {
            name: `${footballer.first_name} ${footballer.last_name}`,
            dateOfBirth: footballer.date_of_birth,
          };
        }

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Wikipedia API request failed: ${response.status} - ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        if (attempt === retries) {
          // Last attempt failed, throw the error
          throw new Error(`Failed to fetch Wikipedia data after ${retries + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  const analyzeDiscrepancies = (databaseData: Footballer, wikipediaData: any): string[] => {
    const discrepancies: string[] = []
    
    // Check if Wikipedia data was found
    if (!wikipediaData || !wikipediaData.playerFoundInDB) {
      discrepancies.push(`Player not found in Wikipedia or no data returned`)
      return discrepancies
    }
    
    // Check basic player info discrepancies
    if (wikipediaData.dateOfBirth && wikipediaData.dateOfBirth !== databaseData.date_of_birth) {
      discrepancies.push(`Date of birth mismatch: DB has ${databaseData.date_of_birth}, Wikipedia has ${wikipediaData.dateOfBirth}`)
    }

    // Check nationality discrepancies
    if (wikipediaData.birthCountry && wikipediaData.countryFoundInDB === false) {
      discrepancies.push(`Country not found in database: Wikipedia shows ${wikipediaData.birthCountry}`)
    }

    // Check position discrepancies 
    if (wikipediaData.position) {
      // You might want to add position comparison logic here if you have position data in the database
      // discrepancies.push(`Position comparison needed: Wikipedia shows ${wikipediaData.position}`)
    }
    
    // Check team count discrepancies (unique teams vs total spells)
    const dbTeamCount = databaseData.teams_played_for?.length || 0
    const wikiTeamCount = wikipediaData.teams?.length || 0
    const dbUniqueTeams = new Set(databaseData.teams_played_for?.map(t => t.team_name.toLowerCase()) || []).size
    const wikiUniqueTeams = new Set(wikipediaData.teams?.map((t: any) => t.teamName.toLowerCase()) || []).size
    
    // Compare unique teams first
    if (Math.abs(dbUniqueTeams - wikiUniqueTeams) > 1) {
      discrepancies.push(`Unique team count difference: DB has ${dbUniqueTeams} unique teams (${dbTeamCount} total spells), Wikipedia has ${wikiUniqueTeams} unique teams (${wikiTeamCount} total spells)`)
    }
    // If unique teams are similar, check total spells
    else if (Math.abs(dbTeamCount - wikiTeamCount) > 2) {
      discrepancies.push(`Total career spells difference: DB has ${dbTeamCount} spells, Wikipedia has ${wikiTeamCount} spells`)
    }
    
    // Check career stats discrepancies
    if (wikipediaData.totalAppearances) {
      const dbApps = databaseData.teams_played_for?.reduce((sum, team) => sum + team.apps, 0) || 0
      const wikiApps = wikipediaData.totalAppearances
      if (Math.abs(dbApps - wikiApps) > 10) {
        discrepancies.push(`Total career appearances mismatch: DB has ${dbApps}, Wikipedia has ${wikiApps} (across all teams)`)
      }
    }
    
    if (wikipediaData.totalGoals) {
      const dbGoals = databaseData.teams_played_for?.reduce((sum, team) => sum + team.goals, 0) || 0
      const wikiGoals = wikipediaData.totalGoals
      if (Math.abs(dbGoals - wikiGoals) > 5) {
        discrepancies.push(`Total career goals mismatch: DB has ${dbGoals}, Wikipedia has ${wikiGoals} (across all teams)`)
      }
    }

    // Check team-specific discrepancies using position-based matching (like career-lookup-data-validation)
    if (wikipediaData.teams && Array.isArray(wikipediaData.teams)) {
      const notFoundTeams = wikipediaData.teams.filter((team: any) => !team.teamFound)
      if (notFoundTeams.length > 0) {
        discrepancies.push(`Teams not found in database: ${notFoundTeams.map((team: any) => team.teamName).join(', ')}`)
      }

      const wikiTeams = wikipediaData.teams
      const dbTeams = databaseData.teams_played_for || []
      
      // Compare teams by their position/order in arrays (like the validation component does)
      const minLength = Math.min(wikiTeams.length, dbTeams.length)
      
      // Helper function to get position suffix (1st, 2nd, 3rd, 4th, etc.)
      const getPositionSuffix = (position: number): string => {
        if (position >= 11 && position <= 13) return "th"
        switch (position % 10) {
          case 1: return "st"
          case 2: return "nd"
          case 3: return "rd"
          default: return "th"
        }
      }
      
      for (let i = 0; i < minLength; i++) {
        const wikiTeam = wikiTeams[i]
        const dbTeam = dbTeams[i]
        
        // Skip if Wikipedia team wasn't found
        if (!wikiTeam.teamFound) continue
        
        const positionSuffix = getPositionSuffix(i + 1)
        const teamPositionName = `${wikiTeam.teamName} (${i + 1}${positionSuffix} team)`
        
        // Check individual field mismatches
        if (wikiTeam.teamID !== dbTeam.team_id) {
          discrepancies.push(`${teamPositionName} - Team ID mismatch: Wikipedia=${wikiTeam.teamID || 'Not Found'}, DB=${dbTeam.team_id}`)
        }
        
        if (Math.abs((wikiTeam.appearances || 0) - (dbTeam.apps || 0)) > 2) {
          discrepancies.push(`${teamPositionName} - Appearances mismatch: Wikipedia=${wikiTeam.appearances}, DB=${dbTeam.apps}`)
        }
        
        if (Math.abs((wikiTeam.goals || 0) - (dbTeam.goals || 0)) > 1) {
          discrepancies.push(`${teamPositionName} - Goals mismatch: Wikipedia=${wikiTeam.goals}, DB=${dbTeam.goals}`)
        }
        
        if (wikiTeam.joinYear !== dbTeam.start_year) {
          discrepancies.push(`${teamPositionName} - Join year mismatch: Wikipedia=${wikiTeam.joinYear}, DB=${dbTeam.start_year}`)
        }
        
        if (wikiTeam.departYear !== dbTeam.end_year) {
          discrepancies.push(`${teamPositionName} - Depart year mismatch: Wikipedia=${wikiTeam.departYear || 'Current'}, DB=${dbTeam.end_year || 'Current'}`)
        }
        
        // Check transfer type mismatch
        const wikiTransferType = (wikiTeam.typeOfTransfer || "").toLowerCase().trim()
        const wikiType = wikiTransferType.includes("loan") ? "loan" : "permanent"
        if (wikiType !== dbTeam.transfer_type) {
          discrepancies.push(`${teamPositionName} - Transfer type mismatch: Wikipedia=${wikiType}, DB=${dbTeam.transfer_type}`)
        }
      }
      
      // Check if array lengths differ (missing teams)
      if (wikiTeams.length !== dbTeams.length) {
        if (wikiTeams.length > dbTeams.length) {
          const extraTeams = wikiTeams.length - dbTeams.length
          const extraTeamNames = wikiTeams
            .slice(dbTeams.length)
            .map((team: any) => team.teamName)
            .join(', ')
          discrepancies.push(`Wikipedia has ${extraTeams} additional team${extraTeams > 1 ? 's' : ''}: ${extraTeamNames}`)
        } else {
          const extraTeams = dbTeams.length - wikiTeams.length
          const extraTeamNames = dbTeams
            .slice(wikiTeams.length)
            .map((team: any) => team.team_name)
            .join(', ')
          discrepancies.push(`Database has ${extraTeams} additional team${extraTeams > 1 ? 's' : ''}: ${extraTeamNames}`)
        }
      }
    }
    
    return discrepancies
  }

  const startBulkProcessing = async () => {
    if (selectedFootballers.size === 0) return
    
    setIsProcessing(true)
    
    const selectedList = Array.from(selectedFootballers)
    const newResults = new Map(bulkResults)
    
    // Initialize all selected footballers as pending
    selectedList.forEach(footballerId => {
      const footballer = footballers.find(f => f.id === footballerId)
      if (footballer) {
        newResults.set(footballerId, {
          footballer,
          status: 'pending',
          logs: [createLogEntry('info', `Added to processing queue`)]
        })
      }
    })
    setBulkResults(newResults)
    
    // Process each footballer sequentially with delay
    for (const footballerId of selectedList) {
      const footballer = footballers.find(f => f.id === footballerId)
      if (!footballer) continue
      
      setCurrentlyProcessing(footballerId)
      
      // Update status to processing
      newResults.set(footballerId, {
        ...newResults.get(footballerId)!,
        status: 'processing'
      })
      setBulkResults(new Map(newResults))
      
      // Process the footballer
      const result = await processFootballerCareer(footballer)
      newResults.set(footballerId, result)
      setBulkResults(new Map(newResults))
      
      // Add delay between requests to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    setCurrentlyProcessing(null)
    setIsProcessing(false)
  }

  const resetResults = () => {
    setBulkResults(new Map())
    setCurrentlyProcessing(null)
    setIsProcessing(false)
  }

  const clearAllSelections = () => {
    setSelectedFootballers(new Set())
    setBulkResults(new Map())
    setCurrentlyProcessing(null)
    setIsProcessing(false)
    setExpandedPlayers(new Set())
  }

  const getStatusBadgeVariant = (status: BulkLookupResult['status']) => {
    switch (status) {
      case 'completed': return 'default'
      case 'processing': return 'secondary'
      case 'discrepancy': return 'destructive'
      case 'error': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusText = (status: BulkLookupResult['status']) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'processing': return 'Processing...'
      case 'completed': return 'Completed'
      case 'discrepancy': return 'Discrepancy Found'
      case 'error': return 'Error'
      default: return 'Unknown'
    }
  }

  const getCareerLookupHref = (footballer: Footballer) => {
    if (useWikipediaUrl && footballer.wikipedia_url) {
      return `/career-lookup?url=${encodeURIComponent(footballer.wikipedia_url)}&useWikiUrl=true`
    }
    return `/career-lookup?name=${encodeURIComponent(footballer.first_name + ' ' + footballer.last_name)}&useWikiUrl=false`
  }

  const getLogIcon = (type: DeploymentLogEntry['type']) => {
    switch (type) {
      case 'info':
        return <Terminal className="h-4 w-4 text-blue-500" />
      case 'request':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'response':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'loading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Terminal className="h-4 w-4 text-gray-500" />
    }
  }

  const getLogStyle = (type: DeploymentLogEntry['type']) => {
    switch (type) {
      case 'info':
        return 'text-blue-700 dark:text-blue-300'
      case 'request':
        return 'text-orange-700 dark:text-orange-300'
      case 'response':
        return 'text-green-700 dark:text-green-300'
      case 'success':
        return 'text-green-800 dark:text-green-200 font-medium'
      case 'error':
        return 'text-red-700 dark:text-red-300 font-medium'
      case 'loading':
        return 'text-blue-700 dark:text-blue-300'
      default:
        return 'text-gray-700 dark:text-gray-300'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-800 dark:to-emerald-900/30 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <Navigation />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bulk Career Lookup</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Check multiple players for career data discrepancies
            </p>
          </div>
        </div>

        {/* Controls and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Player Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Player Status</label>
                <Select value={playerFilter} onValueChange={(value: any) => setPlayerFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Players</SelectItem>
                    <SelectItem value="active">Active Players</SelectItem>
                    <SelectItem value="retired">Retired Players</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Review Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="AWAITING_REVISION">Awaiting Revision</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="DENIED">Denied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Players Per Page</label>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                    <SelectItem value="250">250 per page</SelectItem>
                    <SelectItem value="500">500 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <GraphiteButton 
                onClick={applyFilters} 
                disabled={loadingFootballers}
                loading={loadingFootballers}
                loadingText="Loading..."
                className="w-full"
              >
                Apply Filters
              </GraphiteButton>
            </CardContent>
          </Card>

          {/* Processing Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Bulk Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <ApiButton
                  onClick={startBulkProcessing}
                  disabled={selectedFootballers.size === 0 || isProcessing}
                  loading={isProcessing}
                  loadingText="Processing..."
                  className="flex-1"
                  icon={Play}
                >
                  Start
                </ApiButton>
                <GraphiteButton
                  onClick={clearAllSelections}
                  disabled={isProcessing}
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4" />
                </GraphiteButton>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Selected: {selectedFootballers.size} players
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label htmlFor="use-wikipedia-url" className="text-sm font-medium">
                    Use Wikipedia URLs
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    When available, use stored Wikipedia URLs of each player for career lookup
                  </span>
                </div>
                <Switch
                  id="use-wikipedia-url"
                  checked={useWikipediaUrl}
                  onCheckedChange={setUseWikipediaUrl}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-emerald-600 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700"
                />
              </div>
              
              {isProcessing && (
                <Progress value={(stats.processed / stats.total) * 100} className="w-full" />
              )}

              {/* Show Review Issues button after processing is complete and there are discrepancies/errors */}
              {!isProcessing && stats.processed > 0 && (stats.discrepancies > 0 || stats.errors > 0) && (
                <AmberButton
                  onClick={() => {
                    const resultsSection = document.querySelector('#results-summary')
                    if (resultsSection) {
                      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                  className="w-full mt-2 animate-in fade-in-50 duration-500"
                  icon={AlertTriangle}
                >
                  Review Issues ({stats.discrepancies + stats.errors})
                </AmberButton>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Processing Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(() => {
                const displayStats = getDisplayStats()
                return (
                  <>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <Badge variant="outline">{displayStats.total}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Processed:</span>
                      <Badge variant="outline">{displayStats.processed}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Without Issues:</span>
                      <Badge className="bg-green-100 text-green-800 border-green-300">{displayStats.withoutIssues}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Discrepancies:</span>
                      <Badge className="bg-orange-100 text-orange-800 border-orange-300">{displayStats.discrepancies}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Errors:</span>
                      <Badge variant="destructive">{displayStats.errors}</Badge>
                    </div>
                  </>
                )
              })()}
              {isProcessing && currentlyProcessing && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Currently Processing:
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    {(() => {
                      const footballer = footballers.find(f => f.id === currentlyProcessing)
                      const currentIndex = Array.from(selectedFootballers).indexOf(currentlyProcessing) + 1
                      const totalSelected = selectedFootballers.size
                      return footballer 
                        ? `${footballer.first_name} ${footballer.last_name} (${currentIndex} of ${totalSelected})`
                        : `Player ${currentIndex} of ${totalSelected}`
                    })()}
                  </div>
                </div>
              )}              
            </CardContent>
          </Card>
        </div>

        {/* Player List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Players ({totalFootballers} total, showing {footballers.length} on page {currentPage}/{totalPages})</span>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedFootballers.size === footballers.length && footballers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Select All (Page)
                </label>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingFootballers ? (
              <div className="flex justify-center items-center py-12">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Loading footballers...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {footballers.map((footballer) => {
                  const result = bulkResults.get(footballer.id)
                  const isSelected = selectedFootballers.has(footballer.id)
                  const isCurrentlyProcessing = currentlyProcessing === footballer.id
                  const isExpanded = expandedPlayers.has(footballer.id)
                  
                  return (
                    <div
                      key={footballer.id}
                      className={`relative rounded-lg transition-all duration-200 ${
                        isCurrentlyProcessing 
                          ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' 
                          : result && result.status === 'completed'
                          ? 'border-2 border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md'
                          : result && result.status === 'discrepancy'
                          ? 'border-2 border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-md'
                          : result && result.status === 'error'
                          ? 'border-2 border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md'
                          : result && result.status === 'pending'
                          ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-md'
                          : isSelected
                          ? 'border-2 border-gray-600 bg-gray-100 dark:bg-gray-800 shadow-md ring-2 ring-gray-400/50'
                          : 'border border-gray-200 dark:border-gray-700 hover:shadow-sm'
                      }`}
                    >
                      {/* Processing Indicator */}
                      {isCurrentlyProcessing && (
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 animate-pulse rounded-t-lg"></div>
                        </div>
                      )}

                      {/* Collapsed View - Always Visible */}
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-3 flex-1">
                          {/* Expand/Collapse Button - Show if there are discrepancies or logs */}
                          {result && ((result.discrepancies && result.discrepancies.length > 0) || (result.logs && result.logs.length > 0)) ? (
                            <button
                              onClick={() => togglePlayerExpanded(footballer.id)}
                              className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                          ) : (
                            <div className="flex-shrink-0 w-6" />
                          )}

                          {/* Selection Checkbox */}
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectFootballer(footballer.id, !!checked)}
                            disabled={isProcessing}
                            className={`rounded-md transition-colors ${
                              isSelected 
                                ? 'data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600' 
                                : ''
                            }`}
                          />

                          {/* Player Name and Basic Info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-base text-gray-900 dark:text-white truncate">
                              {footballer.first_name} {footballer.last_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {footballer.nation.name} • Born: {footballer.date_of_birth}
                            </div>
                          </div>

                          {/* Status Badge */}
                          {result && (
                            <Badge 
                              variant={getStatusBadgeVariant(result.status)} 
                              className={`shadow-sm ${
                                result.status === 'completed' ? 'bg-green-100 text-green-800 border-green-300' :
                                result.status === 'processing' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                result.status === 'discrepancy' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                result.status === 'error' ? 'bg-red-100 text-red-800 border-red-300' :
                                result.status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                'bg-gray-100 text-gray-800 border-gray-300'
                              }`}
                            >
                              {getStatusText(result.status)}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {/* Review Button */}
                          {result && result.status === 'discrepancy' && (
                            <Link
                              href={getCareerLookupHref(footballer)}
                              target="_blank"
                            >
                              <AmberButton 
                                onClick={() => {}} 
                                size="sm" 
                                className="hover:shadow-lg transition-shadow duration-200"
                                icon={Eye}
                              >
                                Review
                              </AmberButton>
                            </Link>
                          )}

                          {/* Error Indicator */}
                          {result && result.status === 'error' && (
                            <div className="flex items-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-md border border-red-200">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              <span className="text-xs font-medium">Failed</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded View - Only show when expanded */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 dark:border-gray-700">
                          {/* Discrepancy Details */}
                          {result && result.discrepancies && result.discrepancies.length > 0 && (
                            <div className="px-4 py-4">
                              <Card className="border-2 border-gray-300 bg-white dark:bg-gray-800 shadow-lg dark:border-gray-600">
                                <CardHeader className="pb-3">
                                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-base font-semibold">
                                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                                    Data Discrepancies Detected
                                  </CardTitle>
                                  <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
                                    {result.discrepancies.length} issue{result.discrepancies.length > 1 ? 's' : ''} found when comparing database and Wikipedia data
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="space-y-3">
                                    {result.discrepancies.slice(0, 3).map((discrepancy, idx) => (
                                      <div 
                                        key={idx} 
                                        className="flex items-start gap-3 p-3 bg-white/80 dark:bg-gray-900/40 rounded-lg border border-orange-300/60 dark:border-orange-600/40 shadow-sm"
                                      >
                                        <div className="w-2 h-2 bg-orange-600 rounded-full mt-2.5 flex-shrink-0"></div>
                                        <span className="text-sm text-orange-900 dark:text-orange-100 leading-relaxed font-medium">
                                          {discrepancy}
                                        </span>
                                      </div>
                                    ))}
                                    {result.discrepancies.length > 3 && (
                                      <div className="mt-4 space-y-3">
                                        <div className="p-3 bg-orange-200/60 dark:bg-orange-700/30 rounded-lg border border-orange-300 dark:border-orange-600 shadow-sm">
                                          <div className="text-sm text-orange-900 dark:text-orange-200 font-semibold text-center">
                                            +{result.discrepancies.length - 3} additional discrepanc{result.discrepancies.length - 3 > 1 ? 'ies' : 'y'} found
                                          </div>
                                        </div>
                                        <AmberButton
                                          onClick={() => {
                                            const footballerSection = document.querySelector(`[data-footballer-id="${footballer.id}"]`)
                                            if (footballerSection) {
                                              footballerSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                            }
                                          }}
                                          className="w-full text-sm shadow-md hover:shadow-lg transition-shadow duration-200"
                                          size="sm"
                                        >
                                          View All Issues ({result.discrepancies.length})
                                        </AmberButton>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}

                          {/* Processing Logs */}
                          {result && result.logs && result.logs.length > 0 && (
                            <div className="px-4 py-4">
                              <Card className="border-2 border-gray-300 bg-white dark:bg-gray-800 shadow-lg dark:border-gray-600">
                                <CardHeader className="pb-3">
                                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-base font-semibold">
                                    <Terminal className="h-5 w-5 text-blue-600" />
                                    Processing Logs
                                  </CardTitle>
                                  <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
                                    Detailed processing activity and search method used
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <ScrollArea className="h-64 w-full border rounded-lg">
                                    <div className="bg-gray-100 dark:bg-slate-700 p-4 space-y-2">
                                      {result.logs.length === 0 ? (
                                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                          <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                          <p className="text-sm">No processing logs yet</p>
                                        </div>
                                      ) : (
                                        result.logs.map((log, index) => (
                                          <div key={log.id} className="flex items-start gap-3 text-xs font-mono">
                                            <span className="text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0">
                                              {formatTimestamp(log.timestamp)}
                                            </span>
                                            <div className="flex-shrink-0 mt-0.5">
                                              {getLogIcon(log.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className={`${getLogStyle(log.type)} break-words`}>
                                                {log.message}
                                              </div>
                                              {log.data && (
                                                <details className="mt-1">
                                                  <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                                    View data
                                                  </summary>
                                                  <pre className="mt-1 p-2 bg-gray-200 dark:bg-slate-600 rounded text-xs overflow-x-auto">
                                                    <code>{JSON.stringify(log.data, null, 2)}</code>
                                                  </pre>
                                                </details>
                                              )}
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </ScrollArea>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {footballers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No players found with current filters</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your filter criteria</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {/* Show first page */}
                  {currentPage > 3 && (
                    <>
                      <PaginationItem>
                        <PaginationLink 
                          onClick={() => handlePageChange(1)}
                          className="cursor-pointer"
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                      {currentPage > 4 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                    </>
                  )}
                  
                  {/* Show pages around current page */}
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageStart = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
                    const pageNum = pageStart + i
                    if (pageNum > totalPages) return null
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink 
                          onClick={() => handlePageChange(pageNum)}
                          isActive={pageNum === currentPage}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}
                  
                  {/* Show last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink 
                          onClick={() => handlePageChange(totalPages)}
                          className="cursor-pointer"
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>

        {/* Results Summary */}
        {stats.processed > 0 && (
          <div id="results-summary">
            {/* Successful Results */}
            {Array.from(bulkResults.values()).filter(result => result.status === 'completed').length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    Successful Validations ({Array.from(bulkResults.values()).filter(result => result.status === 'completed').length})
                  </CardTitle>
                  <CardDescription>
                    Players with matching data between database and Wikipedia
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from(bulkResults.values())
                      .filter(result => result.status === 'completed')
                      .map(result => (
                        <div key={result.footballer.id} className="border border-green-200 rounded-lg p-3 bg-green-50 dark:bg-green-900/20">
                          <div className="font-medium text-sm">
                            {result.footballer.first_name} {result.footballer.last_name}
                          </div>
                          {result.wikipediaData && result.databaseData && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Teams: {result.databaseData.teams_played_for?.length || 0} | 
                              Apps: {result.databaseData.teams_played_for?.reduce((sum, team) => sum + team.apps, 0) || 0} | 
                              Goals: {result.databaseData.teams_played_for?.reduce((sum, team) => sum + team.goals, 0) || 0}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Results */}
            {stats.errors > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    Processing Errors ({stats.errors})
                  </CardTitle>
                  <CardDescription>
                    Players that could not be processed due to API errors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from(bulkResults.values())
                      .filter(result => result.status === 'error')
                      .map(result => (
                        <div key={result.footballer.id} className="border border-red-200 rounded-lg p-3 bg-red-50 dark:bg-red-900/20">
                          <div className="font-medium text-sm">
                            {result.footballer.first_name} {result.footballer.last_name}
                          </div>
                          <div className="text-sm text-red-700 dark:text-red-400 mt-1">
                            {result.error}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Discrepancy Results */}
            {stats.discrepancies > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-5 w-5" />
                    Discrepancies Found ({stats.discrepancies})
                  </CardTitle>
                  <CardDescription>
                    Comparison between database records and Wikipedia data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from(bulkResults.values())
                      .filter(result => result.status === 'discrepancy')
                      .map(result => (
                        <div key={result.footballer.id} data-footballer-id={result.footballer.id} className="border border-orange-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-lg">
                              {result.footballer.first_name} {result.footballer.last_name}
                            </div>
                            <Link
                              href={getCareerLookupHref(result.footballer)}
                              target="_blank"
                            >
                              <AmberButton 
                                onClick={() => {}} 
                                size="sm" 
                                className="hover:shadow-lg transition-shadow duration-200"
                                icon={Eye}
                              >
                                Review Details
                              </AmberButton>
                            </Link>
                          </div>
                          
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {result.footballer.nation.name} • Born: {result.footballer.date_of_birth}
                          </div>

                          {result.discrepancies && (
                            <div className="space-y-2">
                              <div className="font-medium text-sm text-orange-700 dark:text-orange-400">
                                Issues Found:
                              </div>
                              <ul className="space-y-1">
                                {result.discrepancies.map((discrepancy, idx) => (
                                  <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                    {discrepancy}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Quick stats comparison */}
                          {result.wikipediaData && result.databaseData && (
                            <div className="mt-3 pt-3 border-t border-orange-100">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="font-medium text-gray-700 dark:text-gray-300">Database</div>
                                  <div className="text-gray-600 dark:text-gray-400">
                                    Teams: {result.databaseData.teams_played_for?.length || 0} | 
                                    Apps: {result.databaseData.teams_played_for?.reduce((sum, team) => sum + team.apps, 0) || 0} | 
                                    Goals: {result.databaseData.teams_played_for?.reduce((sum, team) => sum + team.goals, 0) || 0}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-700 dark:text-gray-300">Wikipedia</div>
                                  <div className="text-gray-600 dark:text-gray-400">
                                    Teams: {result.wikipediaData.teams?.length || 0} | 
                                    Apps: {result.wikipediaData.totalAppearances || 'N/A'} | 
                                    Goals: {result.wikipediaData.totalGoals || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
