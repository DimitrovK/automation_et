"use client"

import React, { useState, useEffect } from "react"
import { FootballerAPI } from "@/lib/footballer-api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { OperationNavigation } from "@/components/footballer-management/operation-navigation"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Navigation } from "@/components/navigation"
import { FootballerCard } from "@/components/footballer-management/footballer-card"
import { GetAllFootballers } from "@/components/footballer-management/get-all-footballers"
import { GetSingleFootballer } from "@/components/footballer-management/get-single-footballer"
import { CreateFootballer } from "@/components/footballer-management/create-footballer"
import { DeleteFootballer } from "@/components/footballer-management/delete-footballer"
import { Result } from "@/components/footballer-management/result"
import { UpdateFootballer } from "@/components/footballer-management/update-footballer"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import type { FootballersResponse, Footballer, CreateFootballerRequest, FootballerNation, FootballerTeam } from "@/types/player"
import { useAuth } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"

export default function FootballerManagementPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const [footballers, setFootballers] = useState<Footballer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<{
    count: number
    next: string | null
    previous: string | null
    totalPages: number
  } | null>(null)

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [retiredFilter, setRetiredFilter] = useState("all")
  const [isPlayerFilter, setIsPlayerFilter] = useState("all")
  const [isManagerFilter, setIsManagerFilter] = useState("all")
  const [careerDifficultyFilter, setCareerDifficultyFilter] = useState("all")
  const [ordering, setOrdering] = useState("last_name,first_name")
  
  // Collapsible state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState("overview")

  // Single footballer fetch states
  const [footballerId, setFootballerId] = useState("")
  const [singleFootballer, setSingleFootballer] = useState<Footballer | null>(null)
  const [singleLoading, setSingleLoading] = useState(false)

  // Create footballer states
  const [createLoading, setCreateLoading] = useState(false)
  const [createdFootballer, setCreatedFootballer] = useState<Footballer | null>(null)
  const [nations, setNations] = useState<FootballerNation[]>([])
  const [nationsLoading, setNationsLoading] = useState(false)

  // Delete footballer states
  const [deleteFootballerId, setDeleteFootballerId] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deletedFootballerId, setDeletedFootballerId] = useState<number | null>(null)

  // Update footballer states
  const [updateFootballerId, setUpdateFootballerId] = useState("")
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updatedFootballer, setUpdatedFootballer] = useState<Footballer | null>(null)
  const [footballerToUpdate, setFootballerToUpdate] = useState<Footballer | null>(null)
  const [fetchForUpdateLoading, setFetchForUpdateLoading] = useState(false)
  
  // Footballer teams states for update view
  const [footballerTeams, setFootballerTeams] = useState<FootballerTeam[]>([])
  const [footballerTeamsLoading, setFootballerTeamsLoading] = useState(false)
  
  const [updateForm, setUpdateForm] = useState<CreateFootballerRequest>({
    status: "AWAITING_REVISION",
    user: 1,
    first_name: "",
    last_name: "",
    nation_id: 1,
    date_of_birth: "",
    show_date_of_birth_on_search: true,
    retired: false,
    is_player: true,
    is_manager: false,
    might_change: false,
    available_for_career_path: true,
    career_path_difficulty: "NORMAL"
  })
  const [createForm, setCreateForm] = useState<CreateFootballerRequest>({
    status: "AWAITING_REVISION",
    user: 1, // Default user ID
    first_name: "",
    last_name: "",
    nation_id: 1, // Default to first nation
    date_of_birth: "",
    show_date_of_birth_on_search: true,
    retired: false,
    is_player: true,
    is_manager: false,
    might_change: false,
    available_for_career_path: true,
    career_path_difficulty: "NORMAL"
  })

  // Load nations on component mount
  useEffect(() => {
    handleLoadNations()
  }, [])

  const handleGetFootballers = async (page: number = 1, resetPage: boolean = false) => {
    setLoading(true)
    setError(null)
    setSingleFootballer(null) // Clear single footballer result
    
    const actualPage = resetPage ? 1 : page
    
    try {
      const params: Record<string, string | number> = {
        page: actualPage
      }

      // Add search
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }

      // Add filters
      if (statusFilter && statusFilter !== "all") params.status = statusFilter
      if (retiredFilter && retiredFilter !== "all") params.retired = retiredFilter
      if (isPlayerFilter && isPlayerFilter !== "all") params.is_player = isPlayerFilter
      if (isManagerFilter && isManagerFilter !== "all") params.is_manager = isManagerFilter
      if (careerDifficultyFilter && careerDifficultyFilter !== "all") params.career_path_difficulty = careerDifficultyFilter
      
      // Add ordering
      if (ordering) params.ordering = ordering

      const response: FootballersResponse = await FootballerAPI.getFootballers(params)
      setFootballers(response.results)
      const totalPages = Math.ceil(response.count / 10) // Assuming 10 items per page
      setPagination({
        count: response.count,
        next: response.next,
        previous: response.previous,
        totalPages
      })
      setCurrentPage(actualPage)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch footballers")
    } finally {
      setLoading(false)
    }
  }

  const handleGetSingleFootballer = async () => {
    if (!footballerId.trim()) {
      setError("Please enter a footballer ID")
      return
    }

    const id = parseInt(footballerId.trim())
    if (isNaN(id)) {
      setError("Please enter a valid footballer ID (number)")
      return
    }

    setSingleLoading(true)
    setError(null)
    setSingleFootballer(null)
    // Clear list results when fetching single footballer
    setFootballers([])
    setPagination(null)
    
    try {
      const footballer = await FootballerAPI.getFootballer(id)
      setSingleFootballer(footballer)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch footballer")
    } finally {
      setSingleLoading(false)
    }
  }

  const handleCreateFootballer = async () => {
    // Basic validation
    if (!createForm.last_name.trim()) {
      setError("Last name is required")
      return
    }

    if (!createForm.date_of_birth) {
      setError("Date of birth is required")
      return
    }

    setCreateLoading(true)
    setError(null)
    setCreatedFootballer(null)
    // Clear other results
    setFootballers([])
    setPagination(null)
    setSingleFootballer(null)
    
    try {
      const newFootballer = await FootballerAPI.createFootballer(createForm)
      setCreatedFootballer(newFootballer)
      
      // Scroll to the created footballer card after a short delay
      setTimeout(() => {
        const createdFootballerElement = document.getElementById('created-footballer-result')
        if (createdFootballerElement) {
          createdFootballerElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          })
          
          // Add a subtle highlight animation
          createdFootballerElement.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.3)'
          setTimeout(() => {
            createdFootballerElement.style.boxShadow = ''
          }, 2000)
        }
      }, 100)
      
      // Reset form after successful creation
      setCreateForm({
        status: "AWAITING_REVISION",
        user: 1,
        first_name: "",
        last_name: "",
        nation_id: 1,
        date_of_birth: "",
        show_date_of_birth_on_search: true,
        retired: false,
        is_player: true,
        is_manager: false,
        might_change: false,
        available_for_career_path: true,
        career_path_difficulty: "NORMAL"
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create footballer")
    } finally {
      setCreateLoading(false)
    }
  }

  const handleLoadNations = async () => {
    if (nations.length > 0) return // Already loaded
    
    setNationsLoading(true)
    try {
      const loadedNations = await FootballerAPI.getNations()
      setNations(loadedNations)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load nations")
    } finally {
      setNationsLoading(false)
    }
  }

  const handleDeleteFootballer = async () => {
    if (!deleteFootballerId.trim()) {
      setError("Please enter a footballer ID to delete")
      return
    }

    const id = parseInt(deleteFootballerId.trim())
    if (isNaN(id)) {
      setError("Please enter a valid footballer ID (number)")
      return
    }

    setDeleteLoading(true)
    setError(null)
    setDeletedFootballerId(null)
    // Clear other results
    setFootballers([])
    setPagination(null)
    setSingleFootballer(null)
    setCreatedFootballer(null)
    
    try {
      await FootballerAPI.deleteFootballer(id)
      setDeletedFootballerId(id)
      
      // Clear the input field after successful deletion
      setDeleteFootballerId("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete footballer")
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteFromCard = async (footballerId: number) => {
    setError(null)
    setDeletedFootballerId(null)
    // Clear other results
    setFootballers([])
    setPagination(null)
    setSingleFootballer(null)
    setCreatedFootballer(null)
    setUpdatedFootballer(null)
    
    try {
      await FootballerAPI.deleteFootballer(footballerId)
      setDeletedFootballerId(footballerId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete footballer")
    }
  }

  const handleEditFromCard = async (footballer: Footballer) => {
    // Pre-populate the update form with the footballer's data
    setUpdateFootballerId(footballer.id.toString())
    setFootballerToUpdate(footballer)
    
    // Set the update form with current data
    setUpdateForm({
      status: footballer.status,
      user: footballer.user,
      first_name: footballer.first_name || "",
      last_name: footballer.last_name,
      nation_id: footballer.nation.id,
      date_of_birth: footballer.date_of_birth,
      show_date_of_birth_on_search: footballer.show_date_of_birth_on_search,
      retired: footballer.retired,
      is_player: footballer.is_player,
      is_manager: footballer.is_manager,
      might_change: footballer.might_change,
      available_for_career_path: footballer.available_for_career_path,
      career_path_difficulty: footballer.career_path_difficulty
    })
    
    // Clear other results to focus on updating
    setError(null)
    setFootballers([])
    setPagination(null)
    setSingleFootballer(null)
    setCreatedFootballer(null)
    setDeletedFootballerId(null)
    setUpdatedFootballer(null)
    
    // Fetch footballer teams data
    setFootballerTeamsLoading(true)
    try {
      const footballerTeamsData = await FootballerAPI.getFootballerTeams(footballer.id)
      setFootballerTeams(footballerTeamsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch footballer teams")
    } finally {
      setFootballerTeamsLoading(false)
    }
    
    // Switch to the update tab
    setActiveTab("update")
    
    // Scroll to top after a brief delay to ensure tab switch completes
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  const handleFetchFootballerForUpdate = async () => {
    if (!updateFootballerId.trim()) {
      setError("Please enter a footballer ID to update")
      return
    }

    const id = parseInt(updateFootballerId.trim())
    if (isNaN(id)) {
      setError("Please enter a valid footballer ID (number)")
      return
    }

    setFetchForUpdateLoading(true)
    setError(null)
    setFootballerToUpdate(null)
    setFootballerTeams([])
    // Clear other results
    setFootballers([])
    setPagination(null)
    setSingleFootballer(null)
    setCreatedFootballer(null)
    setUpdatedFootballer(null)
    setDeletedFootballerId(null)
    
    try {
      // Fetch footballer and teams data in parallel
      const [footballer, footballerTeamsData] = await Promise.all([
        FootballerAPI.getFootballer(id),
        FootballerAPI.getFootballerTeams(id)
      ])
      
      setFootballerToUpdate(footballer)
      setFootballerTeams(footballerTeamsData)
      
      // Populate the update form with current data
      setUpdateForm({
        status: footballer.status,
        user: footballer.user,
        first_name: footballer.first_name || "",
        last_name: footballer.last_name,
        nation_id: footballer.nation.id,
        date_of_birth: footballer.date_of_birth,
        show_date_of_birth_on_search: footballer.show_date_of_birth_on_search,
        retired: footballer.retired,
        is_player: footballer.is_player,
        is_manager: footballer.is_manager,
        might_change: footballer.might_change,
        available_for_career_path: footballer.available_for_career_path,
        career_path_difficulty: footballer.career_path_difficulty
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch footballer for update")
    } finally {
      setFetchForUpdateLoading(false)
    }
  }

  // Handle team changes saved
  const handleTeamsSaved = async () => {
    if (footballerToUpdate) {
      try {
        setFootballerTeamsLoading(true)
        const teams = await FootballerAPI.getFootballerTeams(footballerToUpdate.id)
        setFootballerTeams(teams)
      } catch (error) {
        console.error('Error refreshing team data after save:', error)
      } finally {
        setFootballerTeamsLoading(false)
      }
    }
  }

  const handleUpdateFootballer = async (teamChanges?: Array<{ id: number; changes: Partial<FootballerTeam> }>) => {
    if (!footballerToUpdate) {
      setError("Please load a footballer to update first")
      return
    }

    // Basic validation
    if (!updateForm.last_name.trim()) {
      setError("Last name is required")
      return
    }

    if (!updateForm.date_of_birth) {
      setError("Date of birth is required")
      return
    }

    setUpdateLoading(true)
    setError(null)
    setUpdatedFootballer(null)
    // Clear other results
    setFootballers([])
    setPagination(null)
    setSingleFootballer(null)
    setCreatedFootballer(null)
    setDeletedFootballerId(null)
    
    try {
      // Update footballer first
      const updatedFootballer = await FootballerAPI.updateFootballer(footballerToUpdate.id, updateForm)
      
      // If there are team changes, save them too
      if (teamChanges && teamChanges.length > 0) {
        const patchPromises = teamChanges.map(({ id, changes }) => {
          // Get the original team to preserve the role
          const originalTeam = footballerTeams.find(team => team.id === id)
          if (originalTeam) {
            const patchData = {
              role: originalTeam.role,
              ...changes
            }
            return FootballerAPI.patchFootballerTeam(id, patchData)
          }
          return Promise.resolve()
        })
        
        // Wait for all team updates to complete
        await Promise.all(patchPromises.filter(promise => promise))
      }
      
      // After all updates are complete, fetch the complete footballer data with fresh team info
      const completeUpdatedFootballer = await FootballerAPI.getFootballer(footballerToUpdate.id)
      
      // Also refresh the team data for the update form
      try {
        const refreshedTeams = await FootballerAPI.getFootballerTeams(footballerToUpdate.id)
        setFootballerTeams(refreshedTeams)
      } catch (teamError) {
        console.warn("Failed to refresh team data:", teamError)
        // Don't fail the whole operation if team refresh fails
      }
      
      // Show the result with the complete footballer data (including fresh team data)
      setUpdatedFootballer(completeUpdatedFootballer)
      
      // Scroll to the updated footballer card after a short delay
      setTimeout(() => {
        const updatedFootballerElement = document.getElementById('updated-footballer-result')
        if (updatedFootballerElement) {
          updatedFootballerElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          })
          
          // Add a subtle highlight animation
          updatedFootballerElement.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.3)'
          setTimeout(() => {
            updatedFootballerElement.style.boxShadow = ''
          }, 2000)
        }
      }, 100)
      
      // Clear the footballer to update and reset form
      setFootballerToUpdate(null)
      setUpdateFootballerId("")
      setUpdateForm({
        status: "AWAITING_REVISION",
        user: 1,
        first_name: "",
        last_name: "",
        nation_id: 1,
        date_of_birth: "",
        show_date_of_birth_on_search: true,
        retired: false,
        is_player: true,
        is_manager: false,
        might_change: false,
        available_for_career_path: true,
        career_path_difficulty: "NORMAL"
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update footballer")
    } finally {
      setUpdateLoading(false)
    }
  }

  const handlePreviousPage = () => {
    if (pagination?.previous && currentPage > 1) {
      handleGetFootballers(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination?.next && currentPage < (pagination?.totalPages || 1)) {
      handleGetFootballers(currentPage + 1)
    }
  }

  const handlePageSelect = (page: number) => {
    if (page >= 1 && page <= (pagination?.totalPages || 1)) {
      handleGetFootballers(page)
    }
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (pagination?.totalPages || 1)) {
      handleGetFootballers(page)
    }
  }

  const handleSearch = () => {
    handleGetFootballers(1, true)
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setRetiredFilter("all")
    setIsPlayerFilter("all")
    setIsManagerFilter("all")
    setCareerDifficultyFilter("all")
    setOrdering("last_name,first_name")
    // Auto-reload with cleared filters
    setTimeout(() => {
      handleGetFootballers(1, true)
    }, 100)
  }

  // Function to get active filters (only non-default ones)
  const getActiveFilters = () => {
    const filters: string[] = []
    
    if (searchQuery.trim()) {
      filters.push(`Search: "${searchQuery}"`)
    }
    if (statusFilter !== "all") {
      const statusLabels = {
        "AWAITING_REVISION": "Awaiting Revision",
        "APPROVED": "Approved", 
        "DENIED": "Denied",
        "AWAITING_CHANGE_CHECK": "Awaiting Change Check"
      }
      filters.push(`Status: ${statusLabels[statusFilter as keyof typeof statusLabels] || statusFilter}`)
    }
    if (retiredFilter !== "all") {
      filters.push(`Retired: ${retiredFilter === "true" ? "Yes" : "No"}`)
    }
    if (isPlayerFilter !== "all") {
      filters.push(`Player: ${isPlayerFilter === "true" ? "Yes" : "No"}`)
    }
    if (isManagerFilter !== "all") {
      filters.push(`Manager: ${isManagerFilter === "true" ? "Yes" : "No"}`)
    }
    if (careerDifficultyFilter !== "all") {
      filters.push(`Difficulty: ${careerDifficultyFilter}`)
    }
    if (ordering !== "last_name,first_name") {
      const orderingLabels = {
        "last_name,first_name": "Name (A-Z)",
        "-last_name,-first_name": "Name (Z-A)",
        "created_at": "Oldest first",
        "-created_at": "Newest first", 
        "date_of_birth": "Youngest first",
        "-date_of_birth": "Oldest first (by age)",
        "nation__name": "Nation (A-Z)",
        "-nation__name": "Nation (Z-A)"
      }
      filters.push(`Sort: ${orderingLabels[ordering as keyof typeof orderingLabels] || ordering}`)
    }
    
    return filters
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Clear all result states when switching tabs (except when coming from edit button)
    if (value !== "update") {
      setFootballers([])
      setPagination(null)
      setSingleFootballer(null)
      setCreatedFootballer(null)
      setDeletedFootballerId(null)
      setUpdatedFootballer(null)
      setFootballerToUpdate(null)
      setError(null)
    }
  }

  const renderFootballer = (footballer: Footballer) => (
    <FootballerCard 
      key={footballer.id} 
      footballer={footballer} 
      showActions={true}
      onEdit={handleEditFromCard}
      onDelete={handleDeleteFromCard}
    />
  )

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
        
        <div className="container mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Footballer Management</h1>
            <p className="text-gray-600">Test page for footballer API endpoints</p>
          </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="text-red-800">{error}</div>
              <Button variant="outline" size="sm" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>API Tests</CardTitle>
          <CardDescription>
            Test the footballer API endpoints organized by operation type
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile-friendly navigation */}
          <OperationNavigation activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Tab Content */}
          <div className="w-full">
            {activeTab === "overview" && (
              <div className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <h4 className="text-lg font-medium mb-2">Footballer API Testing</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Select an operation type above to test different API operations
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                      <div className="p-4 border rounded-lg">
                        <h5 className="font-medium text-emerald-600">Read</h5>
                        <p className="text-sm text-gray-500">GET operations</p>
                        <p className="text-xs text-gray-400">✅ Available</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h5 className="font-medium text-emerald-600">Create</h5>
                        <p className="text-sm text-gray-500">POST operations</p>
                        <p className="text-xs text-gray-400">✅ Available</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h5 className="font-medium text-emerald-600">Update</h5>
                        <p className="text-sm text-gray-500">PUT operations</p>
                        <p className="text-xs text-gray-400">✅ Available</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h5 className="font-medium text-red-600">Delete</h5>
                        <p className="text-sm text-gray-500">DELETE operations</p>
                        <p className="text-xs text-gray-400">✅ Available</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "read" && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GetAllFootballers 
                    loading={loading}
                    onGetFootballers={() => handleGetFootballers(1)}
                  />

                  <GetSingleFootballer
                    footballerId={footballerId}
                    singleLoading={singleLoading}
                    onFootballerIdChange={setFootballerId}
                    onGetSingleFootballer={handleGetSingleFootballer}
                  />
                </div>
              </div>
            )}

            {activeTab === "create" && (
              <div className="space-y-4 mt-4">
                <CreateFootballer
                  createForm={createForm}
                  createLoading={createLoading}
                  nations={nations}
                  nationsLoading={nationsLoading}
                  onFormChange={setCreateForm}
                  onCreateFootballer={handleCreateFootballer}
                />
              </div>
            )}

            {activeTab === "update" && (
              <div className="space-y-4 mt-4">
                <UpdateFootballer
                  updateForm={updateForm}
                  updateLoading={updateLoading}
                  nations={nations}
                  nationsLoading={nationsLoading}
                  footballerToUpdate={footballerToUpdate}
                  fetchLoading={fetchForUpdateLoading}
                  footballerId={updateFootballerId}
                  footballerTeams={footballerTeams}
                  footballerTeamsLoading={footballerTeamsLoading}
                  onFormChange={setUpdateForm}
                  onUpdateFootballer={handleUpdateFootballer}
                  onFootballerIdChange={setUpdateFootballerId}
                  onFetchFootballerForUpdate={handleFetchFootballerForUpdate}
                  onTeamsSaved={handleTeamsSaved}
                />
              </div>
            )}

            {activeTab === "delete" && (
              <div className="space-y-4 mt-4">
                <DeleteFootballer
                  footballerId={deleteFootballerId}
                  deleteLoading={deleteLoading}
                  onFootballerIdChange={setDeleteFootballerId}
                  onDeleteFootballer={handleDeleteFootballer}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search - Only show when we have list results */}
      {(footballers.length > 0 || pagination) && (
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Filters & Search</CardTitle>
                    <CardDescription>
                      Search, filter, and sort the footballer list data
                    </CardDescription>
                  </div>
                  {isFiltersOpen ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="space-y-6">
                {/* Search */}
                <div className="space-y-2">
                  <Label htmlFor="search">Search (Name, Nation)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="search"
                      placeholder="Search by first name, last name, nation..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={loading}>
                      Search
                    </Button>
                  </div>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="AWAITING_REVISION">Awaiting Revision</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="DENIED">Denied</SelectItem>
                        <SelectItem value="AWAITING_CHANGE_CHECK">Awaiting Change Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Retired Filter */}
                  <div className="space-y-2">
                    <Label>Retired Status</Label>
                    <Select value={retiredFilter} onValueChange={setRetiredFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All players" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All players</SelectItem>
                        <SelectItem value="true">Retired</SelectItem>
                        <SelectItem value="false">Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Player Filter */}
                  <div className="space-y-2">
                    <Label>Is Player</Label>
                    <Select value={isPlayerFilter} onValueChange={setIsPlayerFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All entries" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All entries</SelectItem>
                        <SelectItem value="true">Players only</SelectItem>
                        <SelectItem value="false">Non-players only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Manager Filter */}
                  <div className="space-y-2">
                    <Label>Is Manager</Label>
                    <Select value={isManagerFilter} onValueChange={setIsManagerFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All entries" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All entries</SelectItem>
                        <SelectItem value="true">Managers only</SelectItem>
                        <SelectItem value="false">Non-managers only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Career Difficulty Filter */}
                  <div className="space-y-2">
                    <Label>Career Difficulty</Label>
                    <Select value={careerDifficultyFilter} onValueChange={setCareerDifficultyFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All difficulties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All difficulties</SelectItem>
                        <SelectItem value="EASY">Easy</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="HARD">Hard</SelectItem>
                        <SelectItem value="EXTREME">Extreme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ordering */}
                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select value={ordering} onValueChange={setOrdering}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose sorting" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last_name,first_name">Name (A-Z)</SelectItem>
                        <SelectItem value="-last_name,-first_name">Name (Z-A)</SelectItem>
                        <SelectItem value="created_at">Oldest first</SelectItem>
                        <SelectItem value="-created_at">Newest first</SelectItem>
                        <SelectItem value="date_of_birth">Youngest first</SelectItem>
                        <SelectItem value="-date_of_birth">Oldest first (by age)</SelectItem>
                        <SelectItem value="nation__name">Nation (A-Z)</SelectItem>
                        <SelectItem value="-nation__name">Nation (Z-A)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handleSearch} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      "Apply Filters"
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleClearFilters} disabled={loading}>
                    Clear All Filters
                  </Button>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Single Footballer Result */}
      {singleFootballer && (
        <Card>
          <CardHeader>
            <CardTitle>Single Footballer Result</CardTitle>
            <CardDescription>
              Result from GET /data/footballers/{footballerId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FootballerCard footballer={singleFootballer} defaultExpanded={true} showActions={true} onEdit={handleEditFromCard} onDelete={handleDeleteFromCard} />
          </CardContent>
        </Card>
      )}

      {/* Created Footballer Result */}
      {createdFootballer && (
        <Result
          type="create"
          footballer={createdFootballer}
          showActions={true}
          onEdit={handleEditFromCard}
          onDelete={handleDeleteFromCard}
          customId="created-footballer-result"
        />
      )}

      {/* Updated Footballer Result */}
      {updatedFootballer && (
        <Result
          type="update"
          footballer={updatedFootballer}
          showActions={true}
          onEdit={handleEditFromCard}
          onDelete={handleDeleteFromCard}
          customId="updated-footballer-result"
        />
      )}

      {/* Deleted Footballer Result */}
      {deletedFootballerId && (
        <Result
          type="delete"
          deletedFootballerId={deletedFootballerId}
        />
      )}

      {/* List Results */}
      {footballers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>List Results</CardTitle>
            <CardDescription>
              {pagination && `Showing ${footballers.length} of ${pagination.count} results`}
              {(() => {
                const activeFilters = getActiveFilters()
                return activeFilters.length > 0 ? (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Active Filters: </span>
                    <span className="text-sm text-muted-foreground">
                      {activeFilters.join(" • ")}
                    </span>
                  </div>
                ) : null
              })()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Footballers Grid */}
            <div className="grid grid-cols-1 gap-4">
              {footballers.map((footballer) => (
                <div key={footballer.id}>
                  <FootballerCard footballer={footballer} defaultExpanded={false} showActions={true} onEdit={handleEditFromCard} onDelete={handleDeleteFromCard} />
                </div>
              ))}
            </div>

            {/* Simple Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={!pagination.previous || loading}
                >
                  Previous
                </Button>
                
                <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!pagination.next || loading}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

        </div>
      </div>
    </div>
  )
}
