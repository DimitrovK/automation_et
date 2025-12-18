'use client';

import type { ReactNode } from 'react';
import React, { createContext, useState } from 'react';

// Discord channel type
export type DiscordChannel = {
  id: string;
  name: string;
  description: string;
};

// Discord channels configuration
export const DISCORD_CHANNELS: DiscordChannel[] = [
  {
    id: '1260947625818193993',
    name: 'important-rules',
    description: 'Important server rules and guidelines',
  },
  {
    id: '1357777634565820516',
    name: 'announcements',
    description: 'Server announcements and updates',
  },
  {
    id: '1365720870361763960',
    name: 'status',
    description: 'Server status updates',
  },
  {
    id: '1364890244704632842',
    name: 'quizes-rules',
    description: 'Rules and guidelines for quizzes',
  },
  {
    id: '1364890395028357172',
    name: 'quizes-general',
    description: 'General quiz discussions and activities',
  },
  {
    id: '1364255266081603687',
    name: 'guess-the-luneup-rules',
    description: 'Rules for guess the lineup game',
  },
  {
    id: '1364254085703925780',
    name: 'guess-the-luneup-scoring',
    description: 'Scoring and results for guess the lineup',
  },
  {
    id: '1364255174436327444',
    name: 'guess-the-luneup-general',
    description: 'General discussions for guess the lineup',
  },
  {
    id: '1260853015435280464',
    name: 'community-introductions',
    description: 'Community member introductions',
  },
  {
    id: '1301569872815460373',
    name: 'community-general',
    description: 'General community discussions',
  },
  {
    id: '1364888309351972884',
    name: 'contact-us-bug-reports',
    description: 'Bug reports and technical issues',
  },
  {
    id: '1364888981799567430',
    name: 'contact-us-suggestions',
    description: 'Suggestions and feedback',
  },
  {
    id: '1427214216888324166',
    name: 'rules-and-scoring',
    description: 'Rules and scoring for Career Path',
  },
  { id: '1427214248173633536', name: 'announcements', description: 'Announcements for Career Path',
  },
  { id: '1427215165031452692', name: 'rules-and-scoring', description: 'Rules and scoring for Avatars of Football',
  },
  { id: '1427215261970206921', name: 'announcements', description: 'Announcements for Avatars of Football',
  },
  { id: '1427215180357435482', name: 'rules-and-scoring', description: 'Rules and scoring for Club Connection',
  },
  { id: '1427215280089862234', name: 'announcements', description: 'Announcements for Club Connection',
  },
  { id: '1427215201253589013', name: 'rules-and-scoring', description: 'Rules and scoring for TenaGoal',
  },
  { id: '1427215297303281776', name: 'announcements', description: 'Announcements for TenaGoal',
  },
];

// Context state interface
type DiscordContextState = {
  selectedChannelId: string;
  setSelectedChannelId: (channelId: string) => void;
  selectedChannel: DiscordChannel | undefined;
  channels: DiscordChannel[];
  message: string;
  setMessage: (message: string) => void;
  isSending: boolean;
  setIsSending: (sending: boolean) => void;
  sendResult: { type: 'success' | 'error'; message: string } | null;
  setSendResult: (result: { type: 'success' | 'error'; message: string } | null) => void;
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  clearResult: () => void;
};

// Create context
const DiscordContext = createContext<DiscordContextState | undefined>(undefined);

// Context provider component
export function DiscordProvider({ children }: { children: ReactNode }) {
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const selectedChannel = DISCORD_CHANNELS.find(ch => ch.id === selectedChannelId);

  const clearResult = () => setSendResult(null);

  const value: DiscordContextState = {
    selectedChannelId,
    setSelectedChannelId,
    selectedChannel,
    channels: DISCORD_CHANNELS,
    message,
    setMessage,
    isSending,
    setIsSending,
    sendResult,
    setSendResult,
    showPreview,
    setShowPreview,
    clearResult,
  };

  return (
    <DiscordContext value={value}>
      {children}
    </DiscordContext>
  );
}

// Custom hook to use Discord context
export function useDiscord() {
  const context = use(DiscordContext);
  if (context === undefined) {
    throw new Error('useDiscord must be used within a DiscordProvider');
  }
  return context;
}
