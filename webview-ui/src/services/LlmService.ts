import { ChatMessage } from "../../../src/shared/ChatMessage"
import { File } from "../../../src/shared/File"

export interface LlmService {
  askForContext: (
    chatMessages: ChatMessage[],
    candidateFileNames: string[]
  ) => Promise<string[]>
  chat: (chatMessages: ChatMessage[], context?: File[]) => Promise<void>
}
