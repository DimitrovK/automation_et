'use client';

import { Database } from 'lucide-react';
import React from 'react';
import { ApiButton } from '@/components/ui/emerald-button';

type GetAllFootballersProps = {
  loading: boolean;
  onGetFootballers: () => void;
};

export function GetAllFootballers({ loading, onGetFootballers }: GetAllFootballersProps) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-medium">Get All Footballers</h4>
      <p className="mb-3 text-xs text-gray-500">
        Retrieve a paginated list of all footballers with optional filtering, searching, and sorting.
      </p>
      <div className="flex flex-wrap gap-2">
        <ApiButton
          onClick={onGetFootballers}
          loading={loading}
          loadingText="Loading..."
          icon={Database}
        >
          GET /data/footballers/
        </ApiButton>
      </div>
    </div>
  );
}
