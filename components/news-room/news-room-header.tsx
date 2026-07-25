"use client"

import React from 'react'
import { ArrowLeft, HelpCircle } from 'lucide-react'
import Link from "next/link"
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AppHeader } from "@/components/layout/app-header"
import { Badge } from '@/components/ui/badge'
import { NewsRoomHeaderProps } from './types'

const NewsRoomTitle = ({ alertCount }: { alertCount: number }) => (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <h1 className="min-w-0 truncate font-display text-base font-semibold tracking-tight text-foreground sm:text-xl">
            Real Time Intelligence Gathering
        </h1>
        {alertCount > 0 && (
            <Badge variant="destructive" className="hidden shrink-0 animate-pulse whitespace-nowrap sm:inline-flex">
                {alertCount} New Alerts
            </Badge>
        )}
        {alertCount > 0 && (
            <Badge variant="destructive" className="shrink-0 animate-pulse sm:hidden">
                {alertCount}
            </Badge>
        )}
        <Tooltip>
            <TooltipTrigger asChild>
                <HelpCircle className="hidden h-5 w-5 shrink-0 cursor-help text-muted-foreground sm:block" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-sm text-foreground">
                <p className="text-sm text-muted-foreground">
                We gather information about all your supply chains, including nodes, edges (paths), and connections at regular intervals. 
                All relevant updates and intelligence are provided here in the news room to keep you informed about your supply chain status.
                </p>
            </TooltipContent>
        </Tooltip>
    </div>
)

const BackButton = () => (
    <Button asChild variant="ghost" size="icon" className="text-foreground hover:bg-accent">
        <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
        </Link>
    </Button>
)

export function NewsRoomHeader({ alertCount }: NewsRoomHeaderProps) {
  return (
    <TooltipProvider>
        <AppHeader 
            as="div"
            title={<NewsRoomTitle alertCount={alertCount} />}
            leftContent={<BackButton />}
            className="relative border-b border-border bg-background/80 backdrop-blur-xl shadow-sm"
        />
    </TooltipProvider>
  )
} 