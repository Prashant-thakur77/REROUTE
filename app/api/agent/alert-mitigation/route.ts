import '@/lib/zod-patch'
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { getAIKeyForModule, AI_MODELS } from "@/lib/ai-config"
import { generateObject } from "ai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Focused mitigation for a single threat alert. Unlike the strategy agent (which
// needs a full simulation), this generates a concise, actionable response plan
// directly from the alert's context.

const MitigationSchema = z.object({
  summary: z.string().describe("One concise sentence summarizing the recommended response."),
  steps: z
    .array(
      z.object({
        action: z.string().describe("A concrete, specific action referencing the affected node/region. No generic advice."),
        timeframe: z.enum(["immediate", "short-term", "long-term"]),
        owner: z.string().describe("Suggested owner role, e.g. 'Logistics lead', 'Procurement'."),
      }),
    )
    .min(2)
    .max(5),
})

export async function POST(req: NextRequest) {
  try {
    const { title, message, severity, node } = await req.json()

    if (!title && !message) {
      return NextResponse.json({ error: "Alert title or message is required." }, { status: 400 })
    }

    const google = createGoogleGenerativeAI({ apiKey: getAIKeyForModule("agents") })

    const result = (await generateObject({
      model: google(AI_MODELS.agents, { structuredOutputs: false }),
      schema: MitigationSchema as any,
      messages: [
        {
          role: "system",
          content:
            "You are a supply-chain resilience strategist. Given a threat alert, produce a short, concrete mitigation plan (2–5 steps). " +
            "Reference the affected node/region explicitly. Each step must be specific and actionable — never generic advice. " +
            "Distribute steps sensibly across immediate / short-term / long-term.",
        },
        {
          role: "user",
          content: `Threat alert${severity ? ` (severity: ${severity})` : ""}:
Title: ${title ?? "(none)"}
Details: ${message ?? "(none)"}
${node ? `Affected node: ${node}` : ""}

Generate the mitigation plan.`,
        },
      ],
      maxOutputTokens: 1024,
      temperature: 0.5,
    } as any)) as { object: z.infer<typeof MitigationSchema> }

    return NextResponse.json(result.object)
  } catch (err: any) {
    console.error("[alert-mitigation] error:", err?.message)
    const isQuota = String(err?.message).match(/quota|429|RESOURCE_EXHAUSTED/i)
    return NextResponse.json(
      { error: isQuota ? "AI quota exhausted. Try again shortly." : "Failed to generate mitigation." },
      { status: isQuota ? 429 : 500 },
    )
  }
}
