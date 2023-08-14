import { produce } from "immer"

import { ChatMessage } from "../../../src/shared/ChatMessage"
import { File } from "../../../src/shared/File"
import { OpenaiModel } from "../../../src/shared/Model"
import {
  SYSTEM_PROMPT,
  askWhatContextIsRequired,
  promptWithFileContext
} from "../prompts"
import OpenaiProxy from "../proxies/OpenaiProxy"
import { useChatStore } from "../stores/useChatStore"
import { useErrorStore } from "../stores/useErrorStore"
import { useSettingsStore } from "../stores/useSettingsStore"
import { decodeAIStreamChunk } from "../utils/decodeAiStreamChunk"
import { LlmService } from "./LlmService"

export class OpenaiService implements LlmService {
  private model: OpenaiModel

  constructor(model: OpenaiModel) {
    this.model = model
  }

  async chat(chatMessages: ChatMessage[], context?: File[]) {
    useErrorStore.getState().setErrorMessage("")

    const produceDiffs = useSettingsStore.getState().produceDiffs

    const prompt = produce(chatMessages, (draft) => {
      if (context && context.length) {
        draft[draft.length - 1].content = promptWithFileContext(
          draft[draft.length - 1].content,
          context,
          { produceDiffs }
        )
      }
    })

    try {
      const readable = await OpenaiProxy.streamingChat(
        this.model,
        prompt,
        SYSTEM_PROMPT
      )
      useChatStore.getState().setLoading(false)

      if (!readable.body) {
        console.error("Body was empty")
        return
      }

      const reader = readable.body.getReader()

      let result = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        result += decodeAIStreamChunk(value)
        useChatStore
          .getState()
          .setChatMessages([
            ...chatMessages,
            { content: result, participant: this.model }
          ])
      }
    } catch (e) {
      console.error(e)
      useErrorStore
        .getState()
        .setErrorMessage(
          "There was an error communicating with OpenAI. Please check that your API key is valid and try again. Try clearing chat if the problem persists."
        )
    }
  }

  async askForContext(
    chatMessages: ChatMessage[],
    candidateFileNames: string[]
  ): Promise<string[]> {
    const chatMessagesCopy = produce(chatMessages, (draft) => {
      draft[draft.length - 1].content = askWhatContextIsRequired(
        draft[draft.length - 1].content,
        candidateFileNames
      )
    })
    const result = await OpenaiProxy.nonStreamingChat(
      this.model,
      chatMessagesCopy,
      SYSTEM_PROMPT
    )

    if (Array.isArray(result)) {
      return result
    } else {
      return []
    }
  }
}
