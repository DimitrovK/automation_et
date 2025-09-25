"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { BookOpen, Type, Link, List, ChevronLeft, ChevronRight } from "lucide-react"

export function Legend() {
  const [isCollapsed, setIsCollapsed] = useState(true)

  const formatExamples = [
    {
      category: "Text Formatting",
      icon: <Type className="h-4 w-4" />,
      items: [
        { syntax: "**bold text**", result: "bold text", type: "bold" },
        { syntax: "*italic text*", result: "italic text", type: "italic" },
        { syntax: "`code`", result: "code", type: "code" },
      ]
    },
    {
      category: "Structure",
      icon: <List className="h-4 w-4" />,
      items: [
        { syntax: "> quote text", result: "quoted text", type: "quote" },
        { syntax: "- list item", result: "bullet lists", type: "normal" },
        { syntax: "1. numbered item", result: "numbered lists", type: "normal" },
      ]
    },
    {
      category: "Links",
      icon: <Link className="h-4 w-4" />,
      items: [
        { syntax: "[link text](URL)", result: "clickable links", type: "normal" },
      ]
    }
  ]

  const renderResult = (item: any) => {
    switch (item.type) {
      case "bold":
        return <strong className="text-gray-900 dark:text-white">{item.result}</strong>
      case "italic":
        return <em className="text-gray-900 dark:text-white">{item.result}</em>
      case "code":
        return <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">{item.result}</code>
      case "quote":
        return <span className="italic text-gray-600 dark:text-gray-400 border-l-2 border-gray-300 pl-2">{item.result}</span>
      default:
        return <span className="text-gray-900 dark:text-white">{item.result}</span>
    }
  }

  return (
    <div className="w-full relative mb-6">
      <Card className={`transition-all duration-300 ease-in-out ${
        isCollapsed ? 'h-12' : 'h-auto'
      }`}>


        {isCollapsed ? (
          /* Collapsed State - Horizontal Text */
          <div className="h-12 flex items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-600" />
              <span className="whitespace-nowrap text-sm font-medium text-gray-600 dark:text-gray-400">
                Markdown Guide
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-3 w-3 -rotate-90" />
            </Button>
          </div>
        ) : (
          /* Expanded State - Full Content */
          <>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-600" />
                  Markdown Guide
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronRight className="h-3 w-3 rotate-90" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formatExamples.map((category, index) => (
                  <div key={category.category}>
                    <div className="flex items-center gap-2 mb-3">
                      {category.icon}
                      <Badge variant="outline" className="text-xs font-medium">
                        {category.category}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      {category.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center gap-2 text-xs">
                          <code className="font-mono text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                            {item.syntax}
                          </code>
                          <span className="text-gray-400">→</span>
                          <div className="text-xs">
                            {renderResult(item)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
