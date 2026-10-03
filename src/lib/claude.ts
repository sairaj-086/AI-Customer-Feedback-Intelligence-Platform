import Anthropic from "@anthropic-ai/sdk";
import { Sentiment } from "@prisma/client";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-5";

export interface ClassificationResult {
  sentiment: Sentiment;
  theme: string;
  summary: string;
}

/**
 * Classifies a single piece of raw feedback into sentiment + a short
 * theme label + a one-line summary. Called right after a feedback row
 * is created (see /api/feedback route).
 */
export async function classifyFeedback(rawText: string): Promise<ClassificationResult> {
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 300,
    system:
      "You classify customer feedback for a B2B analytics product. " +
      "Respond ONLY with minified JSON, no markdown fences, no preamble, " +
      'matching exactly: {"sentiment":"POSITIVE|NEUTRAL|NEGATIVE","theme":"2-4 word theme label","summary":"one sentence summary"}',
    messages: [{ role: "user", content: rawText }],
  });

  const textBlock = msg.content.find((b) => b.type === "text");
  const raw = textBlock && "text" in textBlock ? textBlock.text : "{}";

  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      sentiment: (parsed.sentiment as Sentiment) ?? "NEUTRAL",
      theme: parsed.theme ?? "Uncategorized",
      summary: parsed.summary ?? rawText.slice(0, 140),
    };
  } catch {
    return { sentiment: "NEUTRAL", theme: "Uncategorized", summary: rawText.slice(0, 140) };
  }
}

/**
 * Answers a natural-language question about a tenant's feedback.
 * `contextRows` should already be scoped to the tenant and trimmed to a
 * reasonable number of rows (recency + relevance filter, not a full dump).
 */
export async function answerQuestion(question: string, contextRows: string[]): Promise<string> {
  const context = contextRows.map((r, i) => `[${i + 1}] ${r}`).join("\n");

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 700,
    system:
      "You are an analyst answering questions about a company's customer feedback. " +
      "Only use the numbered feedback excerpts provided as context — if the answer " +
      "isn't supported by them, say so. Cite excerpt numbers like [3] when relevant. " +
      "Be concise and specific; prefer bullet points for multi-part answers.",
    messages: [
      {
        role: "user",
        content: `Feedback excerpts:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  const textBlock = msg.content.find((b) => b.type === "text");
  return textBlock && "text" in textBlock ? textBlock.text : "No answer generated.";
}

/**
 * Generates a Voice-of-Customer report in markdown from a batch of
 * classified feedback covering one period.
 */
export async function generateVocReport(
  periodLabel: string,
  rows: { rawText: string; sentiment: Sentiment | null; theme: string | null }[]
): Promise<string> {
  const summary = rows
    .map((r) => `- [${r.sentiment ?? "UNCLASSIFIED"}] (${r.theme ?? "Uncategorized"}) ${r.rawText}`)
    .join("\n");

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system:
      "You write concise Voice-of-Customer reports for product/leadership teams. " +
      "Output clean markdown with these sections: ## Summary, ## Sentiment Breakdown, " +
      "## Top Themes, ## Notable Quotes, ## Recommended Actions. Be specific and data-driven, " +
      "grounded only in the feedback given. No preamble before the markdown.",
    messages: [
      {
        role: "user",
        content: `Period: ${periodLabel}\nTotal feedback items: ${rows.length}\n\n${summary}`,
      },
    ],
  });

  const textBlock = msg.content.find((b) => b.type === "text");
  return textBlock && "text" in textBlock ? textBlock.text : "# Report generation failed";
}
