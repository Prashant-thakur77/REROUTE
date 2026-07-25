"use client"

import React from 'react'
import { MapPin, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ExtendedCriticalEvent, TimelineEventCardProps } from '@/components/news-room/types'

// Glassmorphic Card Component
export function GlassmorphicCard({ 
  children, 
  className = "", 
  ...props 
}: { 
  children: React.ReactNode
  className?: string
  [key: string]: any 
}) {
  return (
    <Card
      className={`rounded-xl border border-border bg-card shadow-sm ${className}`}
      {...props}
    >
      {children}
    </Card>
  )
}

export function TimelineEventCard({ event, onClick, isCollapsed = false, isBlurred = false }: TimelineEventCardProps) {
  const getSeverityColor = (severity: number) => {
    if (severity >= 60) return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800/30'
    if (severity >= 40) return 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/30 dark:border-orange-800/30'
    return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/30 dark:border-yellow-800/30'
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH': return 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400'
      case 'MEDIUM': return 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400'
      case 'LOW': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'WEATHER': return '☁️'
      case 'GEOPOLITICAL': return '🌍'
      case 'OPERATIONAL': return '⚙️'
      case 'ECONOMIC': return '💰'
      default: return '📊'
    }
  }

  const formatCategory = (category: string) => {
    if (!category) return ''
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
  }

  const formatTimeAgo = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  // Adjust styling and content based on collapsed state
  const cardClassName = isCollapsed
    ? "cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 hover:bg-accent/40"
    : "cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-300 hover:bg-accent/40"
  
  const summaryLines = isCollapsed ? "line-clamp-1" : "line-clamp-2"
  const titleLines = isCollapsed ? "line-clamp-1" : "line-clamp-2"

  return (
    <TooltipProvider>
      <GlassmorphicCard 
        className={`${cardClassName} ${isBlurred ? 'pointer-events-none' : ''} h-full flex flex-col`}
        onClick={() => !isBlurred && onClick(event)}
      >
        <CardHeader className={isCollapsed ? "pb-2" : "pb-3"}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={isCollapsed ? "text-base" : "text-lg"}>{getCategoryIcon(event.category)}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Category: {formatCategory(event.category)}</p>
                </TooltipContent>
              </Tooltip>

              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      className={`text-xs ${getSeverityColor(event.severity)}`}
                    >
                      {`S${event.severity}`}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Severity Score: {event.severity} out of 100</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      className={`text-xs ${getSeverityColor(event.severity)}`}
                    >
                      {`Severity ${event.severity}`}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Severity Score: {event.severity} out of 100</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`text-xs ${getImpactColor(event.impact)}`}>
                    {event.impact.charAt(0)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Estimated Impact: {event.impact}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`text-xs ${getImpactColor(event.impact)}`}>
                    {`${event.impact} Impact`}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Estimated Impact: {event.impact}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <h4 className={`font-semibold text-foreground text-sm leading-tight ${titleLines}`}>
            {event.title}
          </h4>
        </CardHeader>
        <CardContent className="pt-0 flex-grow flex flex-col justify-between">
          <div>
            <p className={`text-xs text-muted-foreground mb-3 ${summaryLines}`}>
              {event.summary}
            </p>
            
            <div className={`space-y-2 text-xs ${isCollapsed ? 'space-y-1' : ''}`}>
              <div className="flex min-w-0 items-center text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1 shrink-0" />
                {isCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="truncate">{event.nodeName}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{event.nodeName}, {event.location}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <span className="truncate">{event.nodeName}, {event.location}</span>
                )}
              </div>
              {!isCollapsed && (
                <div className="flex min-w-0 items-center text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1 shrink-0" />
                  <span className="truncate">{event.timeframe}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            {!isCollapsed && event.affectedEntities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {event.affectedEntities.slice(0, 2).map((entity, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-1 py-0 border-border text-muted-foreground">
                    {entity}
                  </Badge>
                ))}
                {event.affectedEntities.length > 2 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs px-1 py-0 border-border text-muted-foreground">
                        +{event.affectedEntities.length - 2} more
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{event.affectedEntities.slice(2).join(', ')}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}

            {!isCollapsed && event.sources.length > 0 && (
              <div className="mt-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">{Math.round(event.sources[0].credibility * 100)}% credible</span>
                      <span className="mx-1">•</span>
                      <span>{formatTimeAgo(event.sources[0].publishedAt)}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Source: {event.sources[0].title}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </CardContent>
      </GlassmorphicCard>
    </TooltipProvider>
  )
} 