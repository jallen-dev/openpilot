import { useEffect, useState } from "react"

import { ApiKeys } from "../../../src/shared/ApiKeys"
import {
  ApiKeysMessage,
  AppStateMessage,
  ConfigurationMessage,
  ModelChangedMessage,
  WorkspaceIndexStatusMessage
} from "../../../src/shared/OpenpilotMessage"
import useMessageListener from "../hooks/useMessageListener"
import GoogleProxy from "../proxies/GoogleProxy"
import OpenaiProxy from "../proxies/OpenaiProxy"
import { useAppStateStore } from "../stores/useAppStateStore"
import { useChatStore } from "../stores/useChatStore"
import { useErrorStore } from "../stores/useErrorStore"
import { useFileContextStore } from "../stores/useFileContextStore"
import { useSettingsStore } from "../stores/useSettingsStore"
import { vscode } from "../utils/vscode"
import "./App.css"
import ChatList from "./ChatList"
import PromptInput from "./PromptInput"

function App() {
  const setApiKeys = useSettingsStore((state) => state.setApiKeys)
  const setConfiguration = useSettingsStore((state) => state.setConfiguration)
  const setModel = useSettingsStore((state) => state.setModel)
  const model = useSettingsStore((state) => state.model)

  const setWorkspaceIndexed = useAppStateStore(
    (state) => state.setWorkspaceIndexed
  )

  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    vscode.postMessage({ type: "appLoaded" })
  }, [])

  useMessageListener<AppStateMessage>("appState", (message) => {
    const { keys, configuration, workspaceIndexed } = message
    initializeProxies(keys)
    setApiKeys(keys)
    setConfiguration(configuration)
    setWorkspaceIndexed(workspaceIndexed)
    setInitialized(true)
  })

  useMessageListener<ModelChangedMessage>("modelChanged", (message) => {
    if (message.model !== model) {
      useChatStore.getState().setChatMessages([])
      useFileContextStore.getState().setSuggestedFiles([])
      useFileContextStore.getState().clearRejectedFiles()
      useErrorStore.getState().setErrorMessage("")
      setModel(message.model)
    }
  })

  useMessageListener<WorkspaceIndexStatusMessage>(
    "workspaceIndexStatus",
    (message) => {
      setWorkspaceIndexed(message.indexed)
    }
  )

  useMessageListener<ApiKeysMessage>("apiKeys", (message) => {
    const { keys } = message
    initializeProxies(keys)
    setApiKeys(keys)
  })

  useMessageListener<ConfigurationMessage>("configuration", (message) => {
    setConfiguration(message.configuration)
  })

  if (!initialized) {
    return null
  }

  return (
    <main className="h-screen bg-vscode-sideBar-background flex flex-col overflow-y-hidden">
      <div className="grow w-full overflow-y-auto">
        <ChatList />
      </div>
      <div className="w-full p-4">
        {/* <FilePicker /> */}
        <PromptInput />
      </div>
    </main>
  )
}

export default App

function initializeProxies(keys: ApiKeys) {
  if (keys.OpenAI) {
    OpenaiProxy.init(keys.OpenAI)
  }
  if (keys.Google) {
    GoogleProxy.init(keys.Google)
  }
}
