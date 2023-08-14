import { produce } from "immer"

import { ChatMessage } from "../../../src/shared/ChatMessage"
import { File } from "../../../src/shared/File"
import { GoogleModel } from "../../../src/shared/Model"
import {
  SYSTEM_PROMPT,
  askWhatContextIsRequired,
  promptWithFileContext
} from "../prompts"
import GoogleProxy from "../proxies/GoogleProxy"
import { useChatStore } from "../stores/useChatStore"
import { useErrorStore } from "../stores/useErrorStore"
import { useSettingsStore } from "../stores/useSettingsStore"
import { LlmService } from "./LlmService"

export class GoogleService implements LlmService {
  private model: GoogleModel

  constructor(model: GoogleModel) {
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
      const response = await GoogleProxy.chat(this.model, prompt, SYSTEM_PROMPT)

      if (response) {
        useChatStore.getState().setChatMessages([...chatMessages, response])
      }
    } catch (e) {
      console.error(e)
      useErrorStore
        .getState()
        .setErrorMessage(
          "There was an error communicating with Google. Please check that your API key is valid and try again. Try clearing chat if the problem persists."
        )

      // undo the last message and put it back in the prompt
      // TODO: there might be a bug if the user changes model before the response comes back
      // a better option might be a retry button on the last message, and delete the last message
      // if the user types a new one
      const messages = useChatStore.getState().chatMessages
      const lastMessage = messages.pop()
      if (lastMessage && lastMessage.participant === "user") {
        useChatStore.getState().setUserPrompt(lastMessage.content)
        useChatStore.getState().setChatMessages(messages)
      }
    } finally {
      useChatStore.getState().setLoading(false)
    }
  }

  async askForContext(
    chatMessages: ChatMessage[],
    candidateFileNames: string[]
  ) {
    const content = chatMessages[chatMessages.length - 1].content
    const chatMessagesCopy = produce(chatMessages, (draft) => {
      draft[draft.length - 1].content = askWhatContextIsRequired(
        content,
        candidateFileNames
      )
    })

    try {
      const response = await GoogleProxy.chat(
        this.model,
        chatMessagesCopy,
        SYSTEM_PROMPT
      )

      if (response) {
        return JSON.parse(response.content)
      } else {
        return []
      }
    } catch (e) {
      console.error(e)

      return []
    }
  }
}
