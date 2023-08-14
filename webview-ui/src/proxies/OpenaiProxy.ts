import { OpenAIStream, StreamingTextResponse } from "ai"
import {
  ChatCompletionRequestMessage,
  Configuration,
  OpenAIApi
} from "openai-edge"

import { ChatMessage } from "../../../src/shared/ChatMessage"
import { OpenaiModel } from "../../../src/shared/Model"

class OpenaiProxy {
  private _openai?: OpenAIApi

  init(apiKey: string) {
    this._openai = new OpenAIApi(
      new Configuration({
        apiKey
      })
    )
  }

  get openai() {
    if (!this._openai) {
      throw new Error("OpenAI not initialized")
    }
    return this._openai
  }

  async streamingChat(
    model: OpenaiModel,
    chatMessages: ChatMessage[],
    systemPrompt: string
  ) {
    const messages: ChatCompletionRequestMessage[] = [
      {
        role: "system",
        content: systemPrompt
      },
      ...chatMessages.map(chatToCompletionRequestMessage)
    ]

    const completion = await this.openai.createChatCompletion({
      model,
      messages,
      stream: true
    })

    const stream = OpenAIStream(completion)
    return new StreamingTextResponse(stream)
  }

  async nonStreamingChat(
    model: OpenaiModel,
    chatMessages: ChatMessage[],
    systemPrompt: string
  ) {
    const messages: ChatCompletionRequestMessage[] = [
      {
        role: "system",
        content: systemPrompt
      },
      ...chatMessages.map(chatToCompletionRequestMessage)
    ]

    const completion = await this.openai.createChatCompletion({
      model,
      messages
    })

    const json = await completion.json()

    return JSON.parse(json.choices[0].message.content)
  }
}

export default new OpenaiProxy()

function chatToCompletionRequestMessage(
  chat: ChatMessage
): ChatCompletionRequestMessage {
  return {
    role: chat.participant === "user" ? "user" : "assistant",
    content: chat.content
  }
}
