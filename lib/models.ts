import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";
import type { LanguageModel } from "ai";

// Registry aller verfügbaren Modelle. Jeder Eintrag weiß, welcher Anbieter,
// welche Region (für DSGVO) und welcher Env-Key nötig ist.
export type ModelInfo = {
  id: string;
  label: string;
  provider: string;
  region: "EU" | "US";
  envVar: string;
  build: () => LanguageModel;
};

export const MODELS: ModelInfo[] = [
  {
    id: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    provider: "Anthropic",
    region: "US",
    envVar: "ANTHROPIC_API_KEY",
    build: () => anthropic("claude-sonnet-4-6"),
  },
  {
    id: "claude-opus-4-8",
    label: "Claude Opus 4.8",
    provider: "Anthropic",
    region: "US",
    envVar: "ANTHROPIC_API_KEY",
    build: () => anthropic("claude-opus-4-8"),
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "OpenAI",
    region: "US",
    envVar: "OPENAI_API_KEY",
    build: () => openai("gpt-4o"),
  },
  {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    provider: "Google",
    region: "US",
    envVar: "GOOGLE_GENERATIVE_AI_API_KEY",
    build: () => google("gemini-2.0-flash"),
  },
  {
    id: "mistral-large-latest",
    label: "Mistral Large",
    provider: "Mistral (EU)",
    region: "EU",
    envVar: "MISTRAL_API_KEY",
    build: () => mistral("mistral-large-latest"),
  },
];

export const DEFAULT_MODEL_ID = "claude-sonnet-4-6";

export function getModel(id: string): ModelInfo {
  return (
    MODELS.find((m) => m.id === id) ??
    MODELS.find((m) => m.id === DEFAULT_MODEL_ID)!
  );
}

// Ist der nötige API-Key gesetzt? Nur serverseitig aufrufen.
export function isAvailable(m: ModelInfo): boolean {
  return !!process.env[m.envVar];
}
