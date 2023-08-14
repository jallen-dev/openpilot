import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

import { ChatMessage } from "../../../src/shared/ChatMessage"
import { vscode } from "../utils/vscode"

interface ChatState {
  userPrompt: string
  loading: boolean // used to show loading indicator for non-streaming chats
  chatMessages: ChatMessage[]
  setUserPrompt: (prompt: string) => void
  setLoading: (loading: boolean) => void
  setChatMessages: (messages: ChatMessage[]) => void
}

export const useChatStore = create<ChatState>()(
  immer((set, get) => ({
    userPrompt: vscode.getState()?.userPrompt ?? "",
    chatMessages: vscode.getState()?.chatMessages ?? [],
    loading: false,
    setUserPrompt: (userPrompt: string) => {
      vscode.setState({ userPrompt })
      set({ userPrompt })
    },
    setLoading: (loading: boolean) => set({ loading }),
    setChatMessages: (chatMessages: ChatMessage[]) => {
      vscode.setState({ chatMessages })
      set({ chatMessages })
    }
  }))
)
