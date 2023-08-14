import { ChatMessage } from "../../../src/shared/ChatMessage"
import { FileSearchResult } from "../../../src/shared/File"

export type AppState = {
  errorMessage: string
  userPrompt: string
  chatMessages: ChatMessage[]
  suggestedFiles: FileSearchResult[]
  rejectedFilePaths: string[]
}
