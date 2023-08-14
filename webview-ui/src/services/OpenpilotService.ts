import { ChatMessage } from "../../../src/shared/ChatMessage"
import { File } from "../../../src/shared/File"
import { LlmService } from "./LlmService"

export class OpenpilotService implements LlmService {
  async chat(chatMessages: ChatMessage[], context?: File[] | undefined) {
    // no-op
    return
  }

  async askForContext(chatMessages: ChatMessage[]): Promise<string[]> {
    // no-op
    return []
  }
}
