"use client"

import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface HelpDialogProps {
  className?: string
}

export function HelpDialog({ className = "" }: HelpDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`h-8 w-8 p-0 bg-transparent ${className}`}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            How to Use
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium">Player Names:</h4>
            <p className="text-gray-600 dark:text-gray-400">Use underscores instead of spaces (e.g., "Borislav_Tsonev")</p>
          </div>
          <div>
            <h4 className="font-medium">Requirements:</h4>
            <p className="text-gray-600 dark:text-gray-400">Make sure your n8n workflow is running on localhost:5678</p>
          </div>
          <div>
            <h4 className="font-medium">Troubleshooting:</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Use the settings (⚙️) button for configuration and testing
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
