import {
  ChatMessage,
  GoogleRequestMessage
} from "../../../src/shared/ChatMessage"
import { GoogleModel } from "../../../src/shared/Model"

class GoogleProxy {
  private _apiKey?: string

  init(apiKey: string) {
    this._apiKey = apiKey
  }

  private get apiKey() {
    if (!this._apiKey) {
      throw new Error("Google not initialized")
    }
    return this._apiKey
  }

  async chat(model: GoogleModel, chats: ChatMessage[], systemPrompt: string) {
    const messages = chats.map(chatToGoogleRequestMessage)

    const result = await fetch(
      `https://generativelanguage.googleapis.com/v1beta2/models/${model}:generateMessage?key=${this.apiKey}`,
      {
        method: "POST",
        body: JSON.stringify({
          prompt: {
            context: systemPrompt,
            messages
          }
        })
      }
    )

    const response = await result.json()
    const content = response.candidates[0].content
    return { participant: model, content } as ChatMessage
  }
}

export default new GoogleProxy()

function chatToGoogleRequestMessage(chat: ChatMessage): GoogleRequestMessage {
  return {
    author: chat.participant === "user" ? "user" : "assistant",
    content: chat.content
  }
}
