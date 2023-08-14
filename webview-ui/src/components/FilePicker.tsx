import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react"

import { MatchingFilesMessage } from "../../../src/shared/OpenpilotMessage"
import useMessageListener from "../hooks/useMessageListener"
import { useFileContextStore } from "../stores/useFileContextStore"
import { useSettingsStore } from "../stores/useSettingsStore"
import { truncate } from "../utils/truncate"
import { vscode } from "../utils/vscode"

function FilePicker() {
  const suggestedFiles = useFileContextStore((state) => state.suggestedFiles)
  const rejectedFilePaths = useFileContextStore(
    (state) => state.rejectedFilePaths
  )

  const setSuggestedFiles = useFileContextStore(
    (state) => state.setSuggestedFiles
  )
  const rejectFile = useFileContextStore((state) => state.rejectFile)
  const undoRejectFile = useFileContextStore((state) => state.undoRejectFile)

  const includeFiles = useSettingsStore((state) => state.includeFiles)

  useMessageListener<MatchingFilesMessage>("matchingFiles", (message) => {
    const files = message.files
    if (files) {
      setSuggestedFiles(files)
    }
  })

  if (!includeFiles) {
    return null
  }

  if (suggestedFiles.length === 0) {
    return null
  }

  const showFile = (path: string) => {
    vscode.postMessage({
      type: "showFile",
      path
    })
  }

  return (
    <div className="flex flex-col gap-2 py-4">
      <span>Files to include:</span>
      {suggestedFiles
        .sort((a, b) => a.score - b.score)
        .map((file) => (
          <div key={file.path} className="flex flex-row gap-4">
            <VSCodeCheckbox
              checked={!rejectedFilePaths.includes(file.path)}
              onChange={() =>
                rejectedFilePaths.includes(file.path)
                  ? undoRejectFile(file.path)
                  : rejectFile(file.path)
              }
            />
            <div className="grow">
              <a href="#" onClick={() => showFile(file.path)} title={file.path}>
                {truncate(file.path, 40)}
              </a>
            </div>
          </div>
        ))}
    </div>
  )
}

export default FilePicker
