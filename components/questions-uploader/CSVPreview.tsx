'use client';

import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuestions } from './QuestionsContext';

export function CSVPreview() {
  const { previewData, allData } = useQuestions();
  const [showAll, setShowAll] = useState(false);

  if (previewData.length === 0) {
    return null;
  }

  const displayData = showAll ? allData : previewData;
  const hasMore = allData.length > previewData.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Info className="size-5 text-blue-600" />
              CSV File Preview
            </CardTitle>
            <CardDescription>
              {showAll
                ? `Showing all ${allData.length} rows from your CSV file`
                : `Showing first ${previewData.length} rows (Total: ${allData.length} rows)`}
            </CardDescription>
          </div>
          {hasMore && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll
                ? (
                    <>
                      <ChevronUp className="mr-2 size-4" />
                      Show Less
                    </>
                  )
                : (
                    <>
                      <ChevronDown className="mr-2 size-4" />
                      Show All (
                      {allData.length}
                      )
                    </>
                  )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[500px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white dark:bg-slate-800">
              <tr className="border-b">
                <th className="p-2 text-left font-medium">Row</th>
                {displayData[0] && Object.keys(displayData[0]).filter(k => k !== 'row').map(key => (
                  <th key={key} className="p-2 text-left font-medium capitalize">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, index) => (
                <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-2">
                    <Badge variant="outline">{row.row}</Badge>
                  </td>
                  {Object.entries(row).filter(([key]) => key !== 'row').map(([key, value]) => (
                    <td key={key} className="max-w-xs p-2">
                      <div className="truncate" title={value as string}>
                        {value as string}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
