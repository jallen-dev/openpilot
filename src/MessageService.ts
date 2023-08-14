import { Webview, commands, window, workspace } from "vscode"

import vectorStore from "./search/VectorStore"
import { ApiKeys } from "./shared/ApiKeys"
import { ExtensionMessage, WebviewMessage } from "./shared/OpenpilotMessage"
import { getCurrentFile, showFile } from "./utils/editor"
import { editFile, getFileContents } from "./utils/file"

class MessageService {
  private webview?: Webview

  setWebview(webview: Webview) {
    this.webview = webview
  }

  postMessageToWebview(message: ExtensionMessage) {
    if (this.webview) {
      this.webview.postMessage(message)
    } else {
      console.error("Error posting message to webview: Webview not set")
    }
  }

  handleMessageFromWebview = async (message: WebviewMessage) => {
    const type = message.type
    switch (type) {
      case "getCurrentFile":
        const file = getCurrentFile()
        this.postMessageToWebview({ type: "currentFile", file })
        break
      case "getFilesMatchingPrompt":
        try {
          const files = await vectorStore.search(message.prompt)

          this.postMessageToWebview({
            type: "matchingFiles",
            files
          })
        } catch (e: any) {
          console.error(e)
          window.showErrorMessage("Failed to get matching files. " + e.message)
        }
        break
      case "showFile":
        showFile(message.path)
        break
      case "editFile":
        editFile(message.path, message.oldContent, message.newContent)
        break
      case "appLoaded":
        const keys = await commands.executeCommand<ApiKeys>(
          "openpilot.getApiKeys"
        )
        const { includeFiles, produceDiffs } =
          workspace.getConfiguration("openpilot")
        const indexedDocCount = await vectorStore.count()

        this.postMessageToWebview({
          type: "appState",
          keys,
          configuration: { includeFiles, produceDiffs },
          workspaceIndexed: Boolean(indexedDocCount)
        })
        break
      case "getFileContents":
        const fileContents = await getFileContents(message.paths)
        this.postMessageToWebview({
          type: "fileContents",
          files: fileContents
        })
        break
    }
  }
}

export default new MessageService()
