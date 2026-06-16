import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Modell für den Chat. Sonnet 4.6 — gutes Verhältnis aus Qualität und Kosten
// für hohes Chat-Volumen. Für anspruchsvollere Aufgaben auf claude-opus-4-8 wechseln.
export const CHAT_MODEL = "claude-sonnet-4-6";
