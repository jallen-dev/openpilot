import { ReactMarkdown } from "react-markdown/lib/react-markdown"
import remarkGfm from "remark-gfm"

import { ApiKeys } from "../../../src/shared/ApiKeys"
import {
  ChatMessage,
  ModelMessage,
  UserMessage
} from "../../../src/shared/ChatMessage"
import {
  Model,
  OPENPILOT_MODEL,
  displayNameForModel
} from "../../../src/shared/Model"
import useMessageListener from "../hooks/useMessageListener"
import { useAppStateStore } from "../stores/useAppStateStore"
import { useChatStore } from "../stores/useChatStore"
import { useErrorStore } from "../stores/useErrorStore"
import { useSettingsStore } from "../stores/useSettingsStore"
import { SyntaxHighlighterWrapper } from "./SyntaxHighlighterWrapper"

function ChatList() {
  const chatMessages = useChatStore((state) => state.chatMessages)
  const setChatMessages = useChatStore((state) => state.setChatMessages)

  const workspaceIndexed = useAppStateStore((state) => state.workspaceIndexed)

  const model = useSettingsStore((state) => state.model)
  const apiKeys = useSettingsStore((state) => state.apiKeys)

  const errorMessage = useErrorStore((state) => state.errorMessage)

  const loading = useChatStore((state) => state.loading)

  useMessageListener("clearChat", () => {
    setChatMessages([])

    useErrorStore.getState().setErrorMessage("")
  })

  return (
    <section className="w-full h-full">
      {[
        startingChat({ model, workspaceIndexed, apiKeys }),
        ...chatMessages
      ].map((chat, index) => (
        <div key={index}>
          {isUserChat(chat) ? <UserChat {...chat} /> : <ModelChat {...chat} />}
        </div>
      ))}
      {loading && <div className="p-4">Waiting for response...</div>}
      {errorMessage && (
        <div className="p-4 bg-red-800 text-white">{errorMessage}</div>
      )}
    </section>
  )
}

export default ChatList

function UserChat({ content }: UserMessage) {
  return (
    <div className="p-4 bg-vscode-textBlockQuote-background border-t border-b border-zinc-500">
      <span>You: </span>
      <span>{content}</span>
    </div>
  )
}

function ModelChat({ content, participant }: ModelMessage) {
  return (
    <div className="p-4 overflow-x-scroll">
      <span>{displayNameForModel(participant)}: </span>
      <ReactMarkdown
        children={content}
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "")
            return !inline && match ? (
              <SyntaxHighlighterWrapper
                {...props}
                children={String(children).replace(/\n$/, "")}
                language={match[1]}
              />
            ) : (
              <code {...props} className={className}>
                {children}
              </code>
            )
          }
        }}
      />
    </div>
  )
}

function isUserChat(chat: UserMessage | ModelMessage): chat is UserMessage {
  return chat.participant === "user"
}

function startingChat({
  model,
  workspaceIndexed,
  apiKeys
}: {
  model: Model
  workspaceIndexed: boolean
  apiKeys: ApiKeys
}): ChatMessage {
  if (!(apiKeys.OpenAI || apiKeys.Google)) {
    return {
      content: `Welcome to OpenPilot! You first need to set your API keys.\n\nClick the ••• menu in the top right of this panel and select "Set API Key."\n\nTo create a new OpenAI key, visit https://platform.openai.com/account/api-keys`,
      participant: OPENPILOT_MODEL
    }
  }

  if (!apiKeys.OpenAI) {
    return {
      content: `In order for OpenPilot to automatically include relevant files for context, you first need to index your workspace. This requires an API key from OpenAI.\n\nYou can still chat with the LLM without this feature enabled.`,
      participant: model
    }
  }

  if (!workspaceIndexed) {
    return {
      content: `In order for OpenPilot to automatically include relevant files for context, you first need to index your workspace. Select "Index Workspace" from the menu in the top right.\n\nYou can still chat with the LLM without this feature enabled.`,
      participant: model
    }
  }

  return {
    content: `Hello! Type your prompt and OpenPilot will automatically include any relevant files into the chat context.
  
  Switch chat models using the menu in the top right.`,
    participant: model
  }
}
