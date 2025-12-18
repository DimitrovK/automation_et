'use client';

import { Loader2, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type DeleteFootballerProps = {
  footballerId: string;
  deleteLoading: boolean;
  onFootballerIdChange: (id: string) => void;
  onDeleteFootballer: () => void;
};

export function DeleteFootballer({
  footballerId,
  deleteLoading,
  onFootballerIdChange,
  onDeleteFootballer,
}: DeleteFootballerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleConfirmDelete = () => {
    setIsDialogOpen(false);
    onDeleteFootballer();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="size-5" />
          Delete Footballer
        </CardTitle>
        <CardDescription>
          DELETE /data/footballers/
          {'{id}'}
          /
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="delete-footballer-id">Footballer ID</Label>
          <Input
            id="delete-footballer-id"
            type="number"
            placeholder="Enter footballer ID to delete"
            value={footballerId}
            onChange={e => onFootballerIdChange(e.target.value)}
            disabled={deleteLoading}
          />
        </div>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              disabled={deleteLoading || !footballerId.trim()}
              variant="destructive"
              className="w-full"
            >
              {deleteLoading
                ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Deleting...
                    </>
                  )
                : (
                    <>
                      <Trash2 className="mr-2 size-4" />
                      Delete Footballer
                    </>
                  )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this footballer?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete footballer with ID
                {' '}
                <strong>{footballerId}</strong>
                .
                This action cannot be undone and will remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, Delete Footballer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-xs text-gray-600 dark:text-gray-400">
          Make sure you have the correct ID. Deletion is permanent and cannot be reversed.
        </p>
      </CardContent>
    </Card>
  );
}
