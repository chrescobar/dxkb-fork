import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResultsOverviewProps {
  isLoading: boolean;
  searchResults: Record<string, unknown>;
  labelsByType: Record<string, string>;
}

interface SearchResultItem {
  result?: { response?: { numFound?: number } };
}

const ResultsOverview = ({ isLoading, searchResults, labelsByType }: ResultsOverviewProps) => {
  const searchTypes = Object.keys(labelsByType);
  const getNumFound = (type: string) => (searchResults[type] as SearchResultItem | undefined)?.result?.response?.numFound ?? 0;

  return (
    <Card className="mb-8 px-4 py-8">
      <CardHeader>
        <CardTitle className="">Search Results</CardTitle>
      </CardHeader>
      <CardContent className="">
        {isLoading ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Loading results...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-y-2 text-primary sm:grid-cols-3">
            <div className="space-y-2 border-border sm:border-r sm:pr-8">
              {searchTypes.slice(0, 5).map((type) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-foreground">{labelsByType[type]}:</span>
                  <span className="text-secondary">{getNumFound(type)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 sm:px-8">
              {searchTypes.slice(5, 10).map((type) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-foreground">{labelsByType[type]}:</span>
                  <span className="text-secondary">{getNumFound(type)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-border sm:border-l sm:pl-8">
              {searchTypes.slice(10, 15).map((type) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-foreground">{labelsByType[type]}:</span>
                  <span className="text-secondary">{getNumFound(type)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ResultsOverview;