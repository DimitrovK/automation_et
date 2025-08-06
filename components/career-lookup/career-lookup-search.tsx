import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface CareerLookupSearchProps {
  playerName: string
  loading: boolean
  onPlayerNameChange: (value: string) => void
  onSearch: () => void
  className?: string
}

export function CareerLookupSearch({
  playerName,
  loading,
  onPlayerNameChange,
  onSearch,
  className
}: CareerLookupSearchProps) {
  // Handle Enter key press to trigger search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch()
    }
  }
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Player Search
        </CardTitle>
        <CardDescription>
          We are searching Wikipedia so in order for this search to work, get the player name with underscores from there (e.g., "Borislav_Tsonev").
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            placeholder="Enter player name..."
            value={playerName}
            onChange={(e) => onPlayerNameChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button 
            onClick={onSearch} 
            disabled={loading || !playerName.trim()}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-emerald-500 hover:border-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
