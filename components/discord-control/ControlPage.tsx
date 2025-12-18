'use client';

import React from 'react';
import { DiscordProvider } from './DiscordContext';
import { Legend } from './Legend';
import { MessageBox } from './MessageBox';

export function DiscordControlPage() {
  return (
    <DiscordProvider>
      <div className="space-y-3">
        {/* Legend Component - Row layout */}
        <Legend />

        {/* Message Box Component - Full width */}
        <MessageBox />
      </div>
    </DiscordProvider>
  );
}
