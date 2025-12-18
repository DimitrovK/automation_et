'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function FormatGuidelines() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">CSV Format Guidelines</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="size-8 p-0"
          >
            {isExpanded
              ? (
                  <ChevronUp className="size-4" />
                )
              : (
                  <ChevronDown className="size-4" />
                )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <p className="mb-2 font-medium">Required Columns (in order):</p>
              <ul className="list-inside list-disc space-y-1 text-gray-600 dark:text-gray-400">
                <li>
                  <code>Questions</code>
                  {' '}
                  - The question text
                </li>
                <li>
                  <code>Difficulty</code>
                  {' '}
                  - Question difficulty (Easy, Normal, Hard, Expert)
                </li>
                <li>
                  <code>A</code>
                  {' '}
                  - Answer option A
                </li>
                <li>
                  <code>B</code>
                  {' '}
                  - Answer option B
                </li>
                <li>
                  <code>C</code>
                  {' '}
                  - Answer option C
                </li>
                <li>
                  <code>D</code>
                  {' '}
                  - Answer option D
                </li>
                <li>
                  <code>Correct answer</code>
                  {' '}
                  - Correct answer letter (A, B, C, or D)
                </li>
                <li>
                  <code>Country</code>
                  {' '}
                  - Country/region category (will be looked up in database)
                </li>
                <li>
                  <code>Player</code>
                  {' '}
                  - Player name category (optional, will be looked up)
                </li>
                <li>
                  <code>Team</code>
                  {' '}
                  - Team name category (optional, will be looked up)
                </li>
                <li>
                  <code>Uplouded</code>
                  {' '}
                  - Upload status (optional, for tracking)
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-medium">Format Example:</p>
              <div className="overflow-x-auto rounded bg-gray-50 p-2 text-xs dark:bg-gray-800">
                <code>
                  Questions,Difficulty,A,B,C,D,Correct answer,Country,Player,Team,Uplouded
                  <br />
                  "Which Australian football club did Bobby Charlton play for as a guest player in the 1980 Night Series?",Expert,Option A,Option B,Option C,Option D,C,Australia,Bobby Charlton,,Done
                </code>
              </div>
            </div>
            <div>
              <p className="mb-2 font-medium">Tips:</p>
              <ul className="list-inside list-disc space-y-1 text-gray-600 dark:text-gray-400">
                <li>Use commas to separate columns</li>
                <li>Wrap text containing commas in double quotes</li>
                <li>First row must contain column headers exactly as shown above</li>
                <li>Correct answer must be A, B, C, or D</li>
                <li>At least one category (Country, Player, or Team) must be provided</li>
                <li>All non-empty categories will be looked up and added to the question</li>
                <li>Empty optional fields can be left blank between commas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
