import { render, screen } from "@testing-library/react"

import PromptInput from "../../src/components/PromptInput"
import { useSettingsStore } from "../../src/stores/useSettingsStore"
import { vscode } from "../../src/utils/vscode"

const postMessage = vi.spyOn(vscode, "postMessage")
afterEach(() => {
  vi.resetAllMocks()
})

beforeAll(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

test("textbox is disabled when there are no keys", () => {
  useSettingsStore.getState().setApiKeys({ OpenAI: "" })
  useSettingsStore.getState().setIncludeFiles(true)
  render(<PromptInput />)

  expect(screen.getByRole("textbox")).toBeDisabled()
})

test("placeholder is correct when there are no keys", () => {
  useSettingsStore.getState().setApiKeys({ OpenAI: "" })
  render(<PromptInput />)

  expect(screen.getByRole("textbox")).toHaveAttribute(
    "placeholder",
    "Set your API keys in the settings."
  )
})

test("placeholder is correct when there are keys", () => {
  useSettingsStore.getState().setApiKeys({ OpenAI: "test" })
  render(<PromptInput />)

  expect(screen.getByRole("textbox")).toHaveAttribute(
    "placeholder",
    "Type your prompt and hit Enter. Shift+Enter to add a new line."
  )
})

test("matches snapshot", () => {
  const { asFragment } = render(<PromptInput />)
  expect(asFragment()).toMatchSnapshot()
})
