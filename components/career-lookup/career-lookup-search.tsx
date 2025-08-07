import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GraphiteButton } from "@/components/ui/graphite-button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"


type SearchMode = 'name' | 'wikipedia_url';

interface CareerLookupSearchProps {
  searchValue: string;
  searchMode: SearchMode;
  loading: boolean;
  onSearchValueChange: (value: string) => void;
  onSearchModeChange: (mode: SearchMode) => void;
  onSearch: () => void;
  className?: string;
}

export function CareerLookupSearch({
  searchValue,
  searchMode,
  loading,
  onSearchValueChange,
  onSearchModeChange,
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
          {searchMode === 'name'
            ? 'We are searching Wikipedia so in order for this search to work, get the player name with underscores from there (e.g., "Borislav_Tsonev").'
            : 'Paste the full Wikipedia URL for the player (e.g., "https://en.wikipedia.org/wiki/Milenko_A%C4%8Dimovi%C4%87").'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 items-center">
          <span className="text-gray-700 font-medium">Name</span>
          <Input
            placeholder={searchMode === 'name' ? 'Enter player name...' : 'Enter Wikipedia URL...'}
            value={searchValue}
            onChange={(e) => onSearchValueChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Switch
            checked={searchMode === 'wikipedia_url'}
            onCheckedChange={(checked) => onSearchModeChange(checked ? 'wikipedia_url' : 'name')}
            aria-label="Toggle search mode"
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-emerald-600 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700"
          />
          <span className={searchMode === 'wikipedia_url' ? 'text-emerald-700 font-semibold' : 'text-gray-500'}>
            Wikipedia URL
          </span>
          <Button
            onClick={onSearch}
            disabled={loading || !searchValue.trim()}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-emerald-500 hover:border-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
