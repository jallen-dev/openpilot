export const OPENAI_MODELS = [
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-16k",
  "gpt-4",
  "gpt-4-32k"
] as const
export const GOOGLE_MODELS = ["chat-bison-001"] as const
export const OPENPILOT_MODEL = "openpilot" as const
export const ALL_MODELS = [
  ...OPENAI_MODELS,
  ...GOOGLE_MODELS,
  OPENPILOT_MODEL
] as const

export type OpenaiModel = (typeof OPENAI_MODELS)[number]
export type GoogleModel = (typeof GOOGLE_MODELS)[number]
export type OpenpilotModel = typeof OPENPILOT_MODEL
export type Model = (typeof ALL_MODELS)[number]

export function displayNameForModel(model: Model): string {
  return MODEL_DISPLAY_NAMES[model]
}

const MODEL_DISPLAY_NAMES: { [key in Model]: string } = {
  "gpt-3.5-turbo": "GPT 3.5 Turbo",
  "gpt-3.5-turbo-16k": "GPT 3.5 Turbo 16k",
  "gpt-4": "GPT 4",
  "gpt-4-32k": "GPT 4 32k",
  "chat-bison-001": "PaLM 2 Bison",
  openpilot: "OpenPilot"
}
