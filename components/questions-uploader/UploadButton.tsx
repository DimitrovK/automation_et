'use client';

import { Check, Loader2, Play, Square, Upload } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { ApiButton } from '@/components/ui/emerald-button';
import { useQuestions } from './QuestionsContext';

export function UploadButton() {
  const {
    isUploading,
    handleUpload,
    allData,
    isPaused,
    stopUpload,
    resumeUpload,
    finishUpload,
    uploadResult,
  } = useQuestions();
  const questionCount = allData.length;

  // If upload is stopped/paused, show resume and finish buttons
  if (isPaused && uploadResult?.type === 'stopped') {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-3">
          <Button
            onClick={resumeUpload}
            variant="default"
            size="lg"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Play className="size-5" />
            Resume Upload
          </Button>
          <Button
            onClick={finishUpload}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <Check className="size-5" />
            Finish & Review Results
          </Button>
        </div>
        <p className="text-sm text-orange-600 dark:text-orange-400">
          ⏸️ Upload paused -
          {' '}
          {uploadResult.details?.successful || 0}
          {' '}
          questions uploaded so far
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-3">
        <ApiButton
          onClick={handleUpload}
          disabled={isUploading}
          size="lg"
        >
          {isUploading
            ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" />
                  Uploading Questions...
                </>
              )
            : (
                <>
                  <Upload className="mr-2 size-5" />
                  Upload
                  {' '}
                  {questionCount}
                  {' '}
                  {questionCount === 1 ? 'Question' : 'Questions'}
                </>
              )}
        </ApiButton>

        {isUploading && (
          <Button
            onClick={stopUpload}
            variant="destructive"
            size="lg"
            className="gap-2"
          >
            <Square className="size-5" />
            Stop Upload
          </Button>
        )}
      </div>

      {isUploading && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          You can stop the upload at any time to review progress
        </p>
      )}
    </div>
  );
}
