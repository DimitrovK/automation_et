import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

type SearchMode = 'name' | 'wikipedia_url';

type CareerLookupSearchProps = {
  searchValue: string;
  searchMode: SearchMode;
  loading: boolean;
  onSearchValueChange: (value: string) => void;
  onSearchModeChange: (mode: SearchMode) => void;
  onSearch: () => void;
  className?: string;
};

export function CareerLookupSearch({
  searchValue,
  searchMode,
  loading,
  onSearchValueChange,
  onSearchModeChange,
  onSearch,
  className,
}: CareerLookupSearchProps) {
  // Handle Enter key press to trigger search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="size-5" />
          Player Search
        </CardTitle>
        <CardDescription className="text-sm">
          {searchMode === 'name'
            ? 'We are searching Wikipedia so in order for this search to work, get the player name with underscores from there (e.g., "Borislav_Tsonev").'
            : 'Paste the full Wikipedia URL for the player (e.g., "https://en.wikipedia.org/wiki/Milenko_A%C4%87imovi%C4%87").'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Search Input */}
          <Input
            placeholder={searchMode === 'name' ? 'Enter player name...' : 'Enter Wikipedia URL...'}
            value={searchValue}
            onChange={e => onSearchValueChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full"
          />

          {/* Toggle and Button Row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Mode Toggle */}
            <div className="flex shrink-0 items-center gap-2">
              <Switch
                checked={searchMode === 'wikipedia_url'}
                onCheckedChange={checked => onSearchModeChange(checked ? 'wikipedia_url' : 'name')}
                aria-label="Toggle search mode"
                className="data-[state=unchecked]:bg-gray-200 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-emerald-600 dark:data-[state=unchecked]:bg-gray-700"
              />
              <span className={`text-sm font-medium ${searchMode === 'wikipedia_url' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
                Wikipedia URL
              </span>
            </div>

            {/* Search Button */}
            <Button
              onClick={onSearch}
              disabled={loading || !searchValue.trim()}
              className="w-full border-emerald-500 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg transition-all duration-200 hover:border-emerald-600 hover:from-emerald-600 hover:to-green-700 hover:shadow-xl sm:ml-auto sm:w-auto"
            >
              {loading
                ? (
                    <>
                      <span className="animate-pulse">Searching...</span>
                    </>
                  )
                : (
                    <>
                      <Search className="mr-2 size-4" />
                      Search
                    </>
                  )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
