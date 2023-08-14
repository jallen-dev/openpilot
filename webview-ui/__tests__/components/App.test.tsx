import { fireEvent, render } from "@testing-library/react"

import App from "../../src/components/App"
import { useAppStateStore } from "../../src/stores/useAppStateStore"
import { useSettingsStore } from "../../src/stores/useSettingsStore"
import { vscode } from "../../src/utils/vscode"

const postMessage = vi.spyOn(vscode, "postMessage")
afterEach(() => {
  vi.resetAllMocks()
})

test("posts an appLoaded message on init", () => {
  render(<App />)

  expect(postMessage).toHaveBeenCalledWith({
    type: "appLoaded"
  })
})

test("sets the correct state when it receives an appState message", () => {
  render(<App />)

  const data = {
    type: "appState",
    keys: {
      OpenAI: "openai-key",
      Google: "google-key"
    },
    configuration: {
      produceDiffs: false,
      includeFiles: true
    },
    workspaceIndexed: true
  }
  fireEvent(window, new MessageEvent("message", { data }))

  expect(useSettingsStore.getState().apiKeys).toEqual({
    OpenAI: "openai-key",
    Google: "google-key"
  })
  expect(useSettingsStore.getState().produceDiffs).toEqual(false)
  expect(useSettingsStore.getState().includeFiles).toEqual(true)
  expect(useAppStateStore.getState().workspaceIndexed).toEqual(true)
})
