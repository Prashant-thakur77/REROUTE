"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-6 text-center shadow-lg sm:p-8">
        <h1 className="text-xl font-bold text-destructive sm:text-2xl">Authentication Error</h1>
        <p className="break-words text-sm text-muted-foreground sm:text-base">
          {error || "An error occurred during authentication. Please try again."}
        </p>
        <div className="pt-4">
          <Link href="/signin">
            <Button variant="default" className="h-11 w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background p-4 text-muted-foreground">Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}
