import { Model } from "./Model"

export type ChatMessage = UserMessage | ModelMessage

export type UserMessage = {
  content: string
  participant: "user"
}

export type ModelMessage = {
  content: string
  participant: Model
}

export type GoogleRequestMessage = {
  content: string
  author: "user" | "assistant"
}
