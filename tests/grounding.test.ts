import { describe, it, expect } from "vitest"
import { getGrounding, confidencePct } from "@/lib/grounding"

const source = (credibility: number) => ({ url: "", title: "", credibility, publishedAt: "" })

describe("getGrounding", () => {
  it("treats high explicit confidence as high level, no review", () => {
    const g = getGrounding({ confidence: 0.82, sources: [source(0.95)] } as any)
    expect(g.level).toBe("high")
    expect(g.needsReview).toBe(false)
    expect(confidencePct(g)).toBe("82%")
  })

  it("flags low confidence as needing review", () => {
    const g = getGrounding({ confidence: 0.4, sources: [source(0.6)] } as any)
    expect(g.level).toBe("low")
    expect(g.needsReview).toBe(true)
  })

  it("uses the review threshold at 0.6", () => {
    expect(getGrounding({ confidence: 0.59, sources: [source(0.9)] } as any).needsReview).toBe(true)
    expect(getGrounding({ confidence: 0.6, sources: [source(0.9)] } as any).needsReview).toBe(false)
  })

  it("falls back to average source credibility when confidence is absent", () => {
    const g = getGrounding({ sources: [source(0.9), source(0.7)] } as any)
    expect(g.confidence).toBeCloseTo(0.8)
    expect(g.avgCredibility).toBeCloseTo(0.8)
  })

  it("treats a claim with no confidence and no sources as ungrounded + review", () => {
    const g = getGrounding({} as any)
    expect(g.hasGrounding).toBe(false)
    expect(g.needsReview).toBe(true)
    expect(g.confidence).toBeNull()
    expect(confidencePct(g)).toBe("—")
  })

  it("clamps out-of-range confidence to 0–1", () => {
    expect(getGrounding({ confidence: 1.5 } as any).confidence).toBe(1)
    expect(getGrounding({ confidence: -0.2, sources: [] } as any).confidence).toBe(0)
  })

  it("handles null/undefined citations safely", () => {
    expect(getGrounding(null).needsReview).toBe(true)
    expect(getGrounding(undefined).hasGrounding).toBe(false)
  })
})
