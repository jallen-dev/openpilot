import { useCallback, useEffect, useRef } from "react"

import { ChatMessage } from "../../../src/shared/ChatMessage"
import {
  FileContentsMessage,
  MatchingFilesMessage
} from "../../../src/shared/OpenpilotMessage"
import useMessageListener from "../hooks/useMessageListener"
import { llmFactory } from "../services/LlmFactory"
import { useAppStateStore } from "../stores/useAppStateStore"
import { useChatStore } from "../stores/useChatStore"
import { useErrorStore } from "../stores/useErrorStore"
import { useSettingsStore } from "../stores/useSettingsStore"
import { vscode } from "../utils/vscode"

export default function PromptInput() {
  const userPrompt = useChatStore((state) => state.userPrompt)
  const setUserPrompt = useChatStore((state) => state.setUserPrompt)
  const loading = useChatStore((state) => state.loading)

  const apiKeys = useSettingsStore((state) => state.apiKeys)
  const includeFiles = useSettingsStore((state) => state.includeFiles)

  const textarea = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    textarea.current!.style.height = textarea.current!.scrollHeight + "px"
  }, [])

  useMessageListener<MatchingFilesMessage>("matchingFiles", async (message) => {
    const candidateFilePaths = message.files.map((file) => file.path)
    const paths = await confirmFilePaths(candidateFilePaths)

    if (paths) {
      vscode.postMessage({
        type: "getFileContents",
        paths
      })
    }
  })

  useMessageListener<FileContentsMessage>("fileContents", async ({ files }) => {
    const model = useSettingsStore.getState().model
    const service = llmFactory(model)
    const chatMessages = useChatStore.getState().chatMessages
    await service.chat(chatMessages, files)
    useChatStore.getState().setLoading(false)
  })

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const prompt = e.target.value
      setUserPrompt(prompt)

      // magic to make the textarea grow
      textarea.current!.style.height = "auto"
      textarea.current!.style.height =
        Math.min(150, textarea.current!.scrollHeight) + "px"
    },
    [includeFiles]
  )

  const hasKeys = apiKeys.OpenAI || apiKeys.Google
  const placeholder = hasKeys
    ? "Type your prompt and hit Enter. Shift+Enter to add a new line."
    : "Set your API keys in the settings."

  return (
    <textarea
      ref={textarea}
      className="w-full p-2 resize-none rounded-md"
      placeholder={placeholder}
      value={userPrompt}
      disabled={!hasKeys}
      onChange={handleChange}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.shiftKey === false) {
          e.preventDefault()

          if (hasKeys && !loading) {
            submitPrompt(userPrompt)
            setUserPrompt("")
          }
        }
      }}
    />
  )
}

async function submitPrompt(content: string) {
  useChatStore.getState().setLoading(true)
  useErrorStore.getState().setErrorMessage("")

  const newChat: ChatMessage = { content, participant: "user" }
  const chatMessages = [...useChatStore.getState().chatMessages, newChat]
  useChatStore.getState().setChatMessages(chatMessages)

  const model = useSettingsStore.getState().model
  const includeFiles = useSettingsStore.getState().includeFiles

  const workspaceIndexed = useAppStateStore.getState().workspaceIndexed

  const service = llmFactory(model)

  if (includeFiles && workspaceIndexed) {
    vscode.postMessage({
      type: "getFilesMatchingPrompt",
      prompt: content
    })
  } else {
    await service.chat(chatMessages)
    useChatStore.getState().setLoading(false)
  }
}

async function confirmFilePaths(candidateFileNames: string[]) {
  const chatMessages = useChatStore.getState().chatMessages
  if (chatMessages.length === 0) {
    return []
  }

  const model = useSettingsStore.getState().model
  const service = llmFactory(model)

  return service.askForContext(chatMessages, candidateFileNames)
}
