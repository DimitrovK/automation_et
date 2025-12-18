'use client';

import { Search } from 'lucide-react';
import React from 'react';
import { ApiButton } from '@/components/ui/emerald-button';
import { Input } from '@/components/ui/input';

type GetSingleFootballerProps = {
  footballerId: string;
  singleLoading: boolean;
  onFootballerIdChange: (id: string) => void;
  onGetSingleFootballer: () => void;
};

export function GetSingleFootballer({
  footballerId,
  singleLoading,
  onFootballerIdChange,
  onGetSingleFootballer,
}: GetSingleFootballerProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && footballerId.trim()) {
      onGetSingleFootballer();
    }
  };

  return (
    <div>
      <h4 className="mb-2 text-sm font-medium">Get Single Footballer</h4>
      <p className="mb-3 text-xs text-gray-500">
        Retrieve detailed information for a specific footballer by their unique ID.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Enter footballer ID"
          value={footballerId}
          onChange={e => onFootballerIdChange(e.target.value)}
          className="w-40"
          onKeyPress={handleKeyPress}
        />
        <ApiButton
          onClick={onGetSingleFootballer}
          disabled={!footballerId.trim()}
          loading={singleLoading}
          loadingText="Loading..."
          icon={Search}
        >
          GET /data/footballers/
          {'{id}'}
        </ApiButton>
      </div>
    </div>
  );
}
