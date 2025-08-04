import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { FMCard, FMCardHeader, FMCardBody } from "@/components/ui/fm-card"
import { FMTable, FMTableHeader, FMTableBody, FMTableRow, FMTableFooter, FMStat } from "@/components/ui/fm-table"
import { ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react"
import type { Footballer } from "@/types/player"

interface FootballerCardProps {
  footballer: Footballer
  defaultExpanded?: boolean
  showActions?: boolean
  onEdit?: (footballer: Footballer) => void
  onDelete?: (footballerId: number) => void
}

export function FootballerCard({ 
  footballer, 
  defaultExpanded = false, 
  showActions = false,
  onEdit,
  onDelete
}: FootballerCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(footballer)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(footballer.id)
  }

  return (
    <div className="fm-card border">
      <div 
        className="fm-card-header cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold fm-text-primary">{footballer.full_name}</h3>
              <div className="flex gap-1 flex-wrap items-center">
                <Badge 
                  variant="outline"
                  className="bg-gradient-to-r from-slate-500 to-slate-600 text-white border-slate-500 shadow-sm text-xs"
                >
                  ID: {footballer.id}
                </Badge>
                <Badge 
                  variant="outline"
                  className={`${
                    footballer.status === "APPROVED" 
                      ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white border-emerald-500 shadow-lg" 
                      : footballer.status === "AWAITING_REVISION"
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-500 shadow-lg"
                      : footballer.status === "AWAITING_CHANGE_CHECK"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg"
                      : footballer.status === "REFUSED"
                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500 shadow-lg"
                      : "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-500 shadow-lg"
                  }`}
                >
                  {footballer.status}
                </Badge>
              </div>
            </div>
            {!isExpanded && (
              <div className="mt-2 flex gap-4 text-sm fm-text-secondary">
                <span>Born: {footballer.date_of_birth}</span>
                <span>Nationality: {footballer.nation.nationality}</span>
                <span>Teams: {footballer.teams_played_for.length}</span>
                {footballer.teams_managed.length > 0 && (
                  <span>Managed: {footballer.teams_managed.length}</span>
                )}
              </div>
            )}
          </div>
          <div className="ml-4 flex items-center gap-2">
            {showActions && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEdit}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-sm hover:from-blue-600 hover:to-blue-700 h-7 px-2"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => e.stopPropagation()}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500 shadow-sm hover:from-red-600 hover:to-red-700 h-7 px-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to delete this footballer?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete <strong>{footballer.full_name}</strong> (ID: {footballer.id}). 
                        This action cannot be undone and will remove all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes, Delete Footballer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 fm-text-secondary" />
            ) : (
              <ChevronDown className="h-5 w-5 fm-text-secondary" />
            )}
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="fm-card-body pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player Info - Left Side */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold mb-3 uppercase tracking-wide fm-text-primary">Player Info</h4>
            
            <FMCard>
              <FMCardHeader>
                <h4 className="text-xs font-semibold fm-text-primary uppercase tracking-wider">General</h4>
              </FMCardHeader>
              <FMCardBody className="space-y-3 text-sm">
                <FMStat label="Born" value={footballer.date_of_birth} color="blue" />
                <FMStat label="Nationality" value={footballer.nation.nationality} color="blue" />
                <div className="flex justify-between items-center py-1">
                  <span className="fm-text-secondary">Wikipedia:</span>
                  {footballer.wikipedia_url ? (
                    <a 
                      href={footballer.wikipedia_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      View Page
                    </a>
                  ) : (
                    <span className="font-medium text-gray-500">null</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="fm-text-secondary">Status:</span>
                  <span className={`font-medium ${footballer.retired ? 'fm-stat-red' : 'fm-stat-green'}`}>
                    {footballer.retired ? 'Retired' : 'Active'}
                  </span>
                </div>
                <FMStat label="Teams" value={footballer.teams_played_for.length} color="blue" />
                <FMStat label="Managed" value={footballer.teams_managed.length} color="purple" />
              </FMCardBody>
            </FMCard>

            {footballer.available_for_career_path && (
              <FMCard>
                <FMCardHeader>
                  <h4 className="text-xs font-semibold fm-text-primary uppercase tracking-wider">Career Mode</h4>
                </FMCardHeader>
                <FMCardBody>
                  <div className="flex justify-between items-center text-sm">
                    <span className="fm-text-secondary">Difficulty:</span>
                    <span className={`font-medium px-2 py-1 rounded text-xs border ${
                      footballer.career_path_difficulty === 'EASY' ? 'bg-green-100 dark:bg-green-800/60 text-green-700 dark:text-green-200 border-green-300 dark:border-green-600/30' :
                      footballer.career_path_difficulty === 'NORMAL' ? 'bg-yellow-100 dark:bg-yellow-800/60 text-yellow-700 dark:text-yellow-200 border-yellow-300 dark:border-yellow-600/30' :
                      footballer.career_path_difficulty === 'HARD' ? 'bg-orange-100 dark:bg-orange-800/60 text-orange-700 dark:text-orange-200 border-orange-300 dark:border-orange-600/30' :
                      'bg-red-100 dark:bg-red-800/60 text-red-700 dark:text-red-200 border-red-300 dark:border-red-600/30'
                    }`}>
                      {footballer.career_path_difficulty}
                    </span>
                  </div>
                </FMCardBody>
              </FMCard>
            )}
          </div>

          {/* Career History - Right Side */}
          <div className="lg:col-span-2">
            {footballer.teams_played_for.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3 uppercase tracking-wide fm-text-primary">Career History</h4>
                <FMTable>
                  {/* Desktop header - hidden on mobile */}
                  <FMTableHeader className="hidden md:block">
                    <div className="grid grid-cols-12 gap-3 text-xs font-semibold fm-text-primary uppercase tracking-wider">
                      <div className="col-span-4">Club</div>
                      <div className="col-span-1 text-center">Apps</div>
                      <div className="col-span-1 text-center">Gls</div>
                      <div className="col-span-2 text-center">Transfer</div>
                      <div className="col-span-2 text-center">From</div>
                      <div className="col-span-2 text-center">To</div>
                    </div>
                  </FMTableHeader>
                  
                  <FMTableBody>
                    {footballer.teams_played_for.map((team, index) => (
                      <FMTableRow key={index} isEven={index % 2 === 0}>
                        {/* Desktop layout - hidden on mobile */}
                        <div className="hidden md:grid md:grid-cols-12 px-4 py-3 gap-3 text-sm">
                          <div className="col-span-4 font-medium fm-text-primary flex items-center" title={team.team_name}>
                            <span className="truncate">{team.team_name}</span>
                          </div>
                          <div className="col-span-1 text-center fm-stat-blue font-mono font-medium">
                            {team.apps}
                          </div>
                          <div className="col-span-1 text-center fm-stat-yellow font-mono font-medium">
                            {team.goals}
                          </div>
                          <div className="col-span-2 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${
                              team.transfer_type.toLowerCase() === 'loan' 
                                ? 'bg-orange-100 dark:bg-orange-800/60 text-orange-700 dark:text-orange-200 border-orange-300 dark:border-orange-600/30' 
                                : 'bg-green-100 dark:bg-green-800/60 text-green-700 dark:text-green-200 border-green-300 dark:border-green-600/30'
                            }`}>
                              {team.transfer_type === 'loan' ? 'Loan' : 'Permanent'}
                            </span>
                          </div>
                          <div className="col-span-2 text-center fm-stat-green font-mono">
                            {team.start_year}
                          </div>
                          <div className="col-span-2 text-center fm-stat-red font-mono">
                            {team.end_year || '-'}
                          </div>
                        </div>

                        {/* Mobile layout - visible only on mobile */}
                        <div className="block md:hidden px-4 py-3 space-y-2">
                          <div className="font-medium fm-text-primary" title={team.team_name}>
                            {team.team_name}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-xs text-gray-500 uppercase tracking-wide">Apps:</span>
                              <span className="ml-1 fm-stat-blue font-mono font-medium">{team.apps}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 uppercase tracking-wide">Goals:</span>
                              <span className="ml-1 fm-stat-yellow font-mono font-medium">{team.goals}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-xs text-gray-500 uppercase tracking-wide">Period:</span>
                              <span className="ml-1 fm-stat-green font-mono">{team.start_year} - {team.end_year || 'Present'}</span>
                            </div>
                            <div>
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${
                                team.transfer_type.toLowerCase() === 'loan' 
                                  ? 'bg-orange-100 dark:bg-orange-800/60 text-orange-700 dark:text-orange-200 border-orange-300 dark:border-orange-600/30' 
                                  : 'bg-green-100 dark:bg-green-800/60 text-green-700 dark:text-green-200 border-green-300 dark:border-green-600/30'
                              }`}>
                                {team.transfer_type === 'loan' ? 'Loan' : 'Permanent'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </FMTableRow>
                    ))}
                  </FMTableBody>
                  
                  <FMTableFooter>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
                      <div>
                        <span className="fm-text-secondary text-xs uppercase tracking-wide">Total Clubs: </span>
                        <span className="fm-text-primary font-bold">{footballer.teams_played_for.length}</span>
                      </div>
                      <div>
                        <span className="fm-text-secondary text-xs uppercase tracking-wide">Apps: </span>
                        <span className="fm-stat-blue font-bold font-mono">
                          {footballer.teams_played_for.reduce((sum, team) => sum + team.apps, 0)}
                        </span>
                      </div>
                      <div>
                        <span className="fm-text-secondary text-xs uppercase tracking-wide">Goals: </span>
                        <span className="fm-stat-yellow font-bold font-mono">
                          {footballer.teams_played_for.reduce((sum, team) => sum + team.goals, 0)}
                        </span>
                      </div>
                    </div>
                  </FMTableFooter>
                </FMTable>
              </div>
            )}
          </div>
        </div>

        {/* Management History */}
        {footballer.teams_managed.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold fm-stat-purple mb-3 uppercase tracking-wide">Management History</h4>
            <FMTable>
              {/* Desktop header - hidden on mobile */}
              <FMTableHeader className="hidden md:block">
                <div className="grid grid-cols-6 gap-2 text-xs font-medium fm-text-primary uppercase tracking-wide">
                  <div className="col-span-3">Club</div>
                  <div className="col-span-1 text-center">Joined</div>
                  <div className="col-span-1 text-center">Departed</div>
                  <div className="col-span-1 text-center">Duration</div>
                </div>
              </FMTableHeader>
              <div className="max-h-32 overflow-y-auto">
                {footballer.teams_managed.map((team, index) => (
                  <FMTableRow key={index} isEven={index % 2 === 0}>
                    {/* Desktop layout - hidden on mobile */}
                    <div className="hidden md:grid md:grid-cols-6 px-3 py-2 gap-2 text-sm">
                      <div className="col-span-3 font-medium fm-text-primary truncate" title={team.team_name}>
                        {team.team_name}
                      </div>
                      <div className="col-span-1 text-center fm-stat-green font-mono">
                        {team.start_year}
                      </div>
                      <div className="col-span-1 text-center fm-stat-red font-mono">
                        {team.end_year || 'Present'}
                      </div>
                      <div className="col-span-1 text-center fm-stat-blue font-mono">
                        {team.end_year ? team.end_year - team.start_year : 'Current'}
                      </div>
                    </div>

                    {/* Mobile layout - visible only on mobile */}
                    <div className="block md:hidden px-3 py-2 space-y-2">
                      <div className="font-medium fm-text-primary" title={team.team_name}>
                        {team.team_name}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Period:</span>
                          <span className="ml-1 fm-stat-green font-mono">{team.start_year} - {team.end_year || 'Present'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Duration:</span>
                          <span className="ml-1 fm-stat-blue font-mono">
                            {team.end_year ? `${team.end_year - team.start_year} years` : 'Current'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </FMTableRow>
                ))}
              </div>
            </FMTable>
          </div>
        )}
      </div>
      )}
    </div>
  )
}
