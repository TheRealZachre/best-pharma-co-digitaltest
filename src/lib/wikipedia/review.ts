/**
 * Claude editorial review — TypeScript port of wiki-auditor/app/analysis.py
 */

import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicApiKey } from "@/lib/env";
import type { MaintenanceFlag } from "./fetch";

const MAX_CHARS = 12_000;

const DEFAULT_MODEL = "claude-sonnet-4-5";

const SYSTEM_PROMPT = `You are a meticulous Wikipedia editor performing a quality review. You assess \
articles against Wikipedia's core content policies: verifiability, neutral \
point of view, no original research, and the manual of style.

You will be given an article's plain text plus some metrics. Identify concrete, \
actionable improvements. Be specific and reference what is actually in the text \
— never invent problems to pad the list. If the article is genuinely strong, \
say so and return few or no issues.

Respond with ONLY a JSON object (no markdown, no preamble) in exactly this shape:

{
  "quality_tier": "stub | start | c | b | good | featured",
  "assessment": "2-3 sentence overall read on the article's health",
  "issues": [
    {
      "category": "Sourcing | Neutrality | Coverage | Structure | Clarity | Currency | Style",
      "severity": "high | medium | low",
      "title": "short imperative summary",
      "detail": "1-2 sentences explaining the problem",
      "suggested_action": "a concrete next step an editor could take"
    }
  ]
}

Order issues by severity (high first). Aim for 3-8 issues on a typical article.`;

function buildUserMessage(
  title: string,
  extract: string,
  metrics: Record<string, unknown>,
  flags: MaintenanceFlag[]
) {
  const text = extract.slice(0, MAX_CHARS);
  const truncated = extract.length > MAX_CHARS ? " [text truncated]" : "";
  const flagLines = flags.length
    ? flags
        .map((f) => `- ${f.label} (template: {{${f.template}}})`)
        .join("\n")
    : "- none detected";

  return `ARTICLE TITLE: ${title}

METRICS:
- Word count: ${metrics.word_count}
- Reference (<ref>) count: ${metrics.reference_count}
- Last edited: ${metrics.last_edited}

EXISTING MAINTENANCE FLAGS ON THE PAGE:
${flagLines}

ARTICLE TEXT:
"""
${text}${truncated}
"""`;
}

export async function analyseArticle(
  title: string,
  extract: string,
  metrics: Record<string, unknown>,
  flags: MaintenanceFlag[]
) {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return {
      error:
        "AI editorial review is disabled. Add ANTHROPIC_API_KEY to .dev.vars, restart npm run dev, and reload this page.",
      issues: [],
    };
  }
  if (!extract.trim()) {
    return { error: "No article text available to analyse.", issues: [] };
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANALYSIS_MODEL ?? DEFAULT_MODEL;

  try {
    const message = await client.messages.create({
      model,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserMessage(title, extract, metrics, flags),
        },
      ],
    });

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      const parts = cleaned.split("```");
      cleaned = parts[1] ?? "";
      if (cleaned.toLowerCase().startsWith("json")) cleaned = cleaned.slice(4);
      cleaned = cleaned.trim();
    }

    const report = JSON.parse(cleaned);
    report.issues = report.issues ?? [];
    return report;
  } catch (e: unknown) {
    if (e instanceof Anthropic.AuthenticationError) {
      return { error: "Invalid Anthropic API key.", issues: [] };
    }
    if (e instanceof SyntaxError) {
      return { error: "Could not parse model response as JSON.", issues: [] };
    }
    return { error: String(e), issues: [] };
  }
}
