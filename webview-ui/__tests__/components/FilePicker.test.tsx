import { render, screen } from "@testing-library/react"

import FilePicker from "../../src/components/FilePicker"
import { useFileContextStore } from "../../src/stores/useFileContextStore"
import { useSettingsStore } from "../../src/stores/useSettingsStore"

const testFileSearchResults = [
  { path: "src/file1.ts", name: "file1.ts", content: "content1", score: 0.5 },
  { path: "src/file2.ts", name: "file1.ts", content: "content2", score: 0.5 }
]

test("renders nothing when includeFiles is false", () => {
  useSettingsStore.getState().setIncludeFiles(false)
  useFileContextStore.getState().setSuggestedFiles(testFileSearchResults)
  render(<FilePicker />)

  expect(screen.queryByText(/Files to include/i)).not.toBeInTheDocument()
})

test("renders nothing when there are no files", () => {
  useSettingsStore.getState().setIncludeFiles(false)
  render(<FilePicker />)

  expect(screen.queryByText(/Files to include/i)).not.toBeInTheDocument()
})

test("renders a list of files", () => {
  useSettingsStore.getState().setIncludeFiles(true)
  useFileContextStore.getState().setSuggestedFiles(testFileSearchResults)
  render(<FilePicker />)

  expect(screen.queryByText(/Files to include/i)).toBeInTheDocument()
})

test("matches snapshot", () => {
  useSettingsStore.getState().setIncludeFiles(true)
  useFileContextStore.getState().setSuggestedFiles(testFileSearchResults)
  const { asFragment } = render(<FilePicker />)

  expect(asFragment()).toMatchSnapshot()
})
