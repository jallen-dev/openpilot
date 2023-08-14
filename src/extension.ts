import * as vscode from "vscode"

import MessageService from "./MessageService"
import OpenpilotView from "./OpenpilotView"
import { Extension } from "./helpers/Extension"
import vectorStore from "./search/VectorStore"
import { indexWorkspace } from "./search/indexWorkspace"
import { GOOGLE_MODELS, Model, OPENAI_MODELS } from "./shared/Model"
import { getCurrentFile } from "./utils/editor"
import { getNumberOfFilesInWorkspace } from "./utils/workspace"

export function activate(context: vscode.ExtensionContext) {
  Extension.getInstance(context)

  const configuration = vscode.workspace.getConfiguration("openpilot")

  // Set context variables for displaying the correct menu items
  if (configuration.get("includeFiles")) {
    vscode.commands.executeCommand(
      "setContext",
      "openpilot:includingFiles",
      true
    )
  }

  if (configuration.get("produceDiffs")) {
    vscode.commands.executeCommand(
      "setContext",
      "openpilot:producingDiffs",
      true
    )
  }

  context.secrets.get("OpenAI.apiKey").then((key) => {
    if (key) {
      vscode.commands.executeCommand(
        "setContext",
        "openpilot:hasSetOpenaiKey",
        true
      )
    }
  })

  // Register commands
  const clearChatCommand = vscode.commands.registerCommand(
    "openpilot.clearChat",
    () => {
      MessageService.postMessageToWebview({ type: "clearChat" })
    }
  )

  const getCurrentFileCommand = vscode.commands.registerCommand(
    "openpilot.getCurrentFile",
    () => {
      MessageService.postMessageToWebview({
        type: "currentFile",
        file: getCurrentFile()
      })
    }
  )

  const indexWorkspaceCommand = vscode.commands.registerCommand(
    "openpilot.indexWorkspace",
    async () => {
      const confirm = await vscode.window.showWarningMessage(
        `Indexing workspace requires sending source files to OpenAI to be transformed into embeddings.\n\nThis incurs a cost of $0.0004 per 1k tokens (or about $1 per 3000 "pages" of text).`,
        {
          modal: true
        },
        "OK"
      )

      if (!confirm) {
        return
      }

      const result = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Indexing workspace",
          cancellable: true
        },
        async (progress, token) => {
          token.onCancellationRequested(() => {
            console.log("User canceled indexing")
          })

          const count = await vectorStore.count()
          // If there are no files in the db, force a full reindex
          const lastModified = count
            ? (vscode.workspace
                .getConfiguration("openpilot")
                .get("lastIndexed") as number)
            : undefined

          const total = await getNumberOfFilesInWorkspace({
            modifiedSince: lastModified
          })

          progress.report({ increment: 0 })

          let totalProcessed = 0
          return indexWorkspace(
            token,
            (filesProcessed) => {
              totalProcessed += filesProcessed
              progress.report({
                increment: (filesProcessed / total) * 100,
                message: `Processed ${totalProcessed} of ${total} files`
              })
            },
            { modifiedSince: lastModified }
          )
        }
      )

      if (result.success) {
        const lastIndexed = new Date().valueOf()
        vscode.workspace
          .getConfiguration("openpilot")
          .update("lastIndexed", lastIndexed)

        MessageService.postMessageToWebview({
          type: "workspaceIndexStatus",
          indexed: true
        })
      } else {
        vscode.window.showErrorMessage(
          result.message ?? "There was an error indexing the workspace"
        )
      }
    }
  )

  const deleteVectorDbCommand = vscode.commands.registerCommand(
    "openpilot.deleteVectorDb",
    async () => {
      const confirm = await vscode.window.showWarningMessage(
        `Deleting the vector database will remove all indexed files from the database.`,
        {
          modal: true
        },
        "OK"
      )
      if (!confirm) {
        return
      }

      await vectorStore.deleteCollection()
    }
  )

  const selectModelCommand = vscode.commands.registerCommand(
    "openpilot.selectModel",
    async () => {
      const openAiItems = OPENAI_MODELS.map((model) => ({ label: model }))
      const googleItems = GOOGLE_MODELS.map((model) => ({ label: model }))
      const items: vscode.QuickPickItem[] = [
        { label: "OpenAI", kind: vscode.QuickPickItemKind.Separator },
        ...openAiItems,
        { label: "Google PaLM 2", kind: vscode.QuickPickItemKind.Separator },
        ...googleItems
      ]
      const quickPick = vscode.window.createQuickPick()
      quickPick.items = items
      quickPick.onDidChangeSelection((selection) => {
        const model = selection[0].label as Model

        MessageService.postMessageToWebview({
          type: "modelChanged",
          model
        })
        quickPick.dispose()
      })
      quickPick.onDidHide(() => quickPick.dispose())
      quickPick.show()
    }
  )

  const setApiKeyCommand = vscode.commands.registerCommand(
    "openpilot.setApiKey",
    async () => {
      const service = await vscode.window.showQuickPick(["OpenAI", "Google"], {
        title: "Select service to set API key for"
      })

      if (!service) {
        return
      }

      const key = `${service}.apiKey`

      const existingValue = await context.secrets.get(key)
      const value = await vscode.window.showInputBox({
        title: "Enter your API key",
        password: true,
        ignoreFocusOut: true,
        value: existingValue
      })
      if (value !== undefined) {
        context.secrets.store(key, value)

        if (service === "OpenAI") {
          vscode.commands.executeCommand(
            "setContext",
            "openpilot:hasSetOpenaiKey",
            true
          )
        }

        MessageService.postMessageToWebview({
          type: "apiKeys",
          keys: { [service]: value }
        })

        const model = service === "OpenAI" ? OPENAI_MODELS[0] : GOOGLE_MODELS[0]
        MessageService.postMessageToWebview({
          type: "modelChanged",
          model
        })
      }
    }
  )

  const getApiKeysCommand = vscode.commands.registerCommand(
    "openpilot.getApiKeys",
    async () => {
      const OpenAI = await context.secrets.get("OpenAI.apiKey")
      const Google = await context.secrets.get("Google.apiKey")
      return { OpenAI, Google }
    }
  )

  // Following commands are for toggling config options
  const includeFilesCommand = vscode.commands.registerCommand(
    "openpilot.includeFiles",
    async () => {
      configuration.update("includeFiles", true)
      vscode.commands.executeCommand(
        "setContext",
        "openpilot:includingFiles",
        true
      )
      MessageService.postMessageToWebview({
        type: "configuration",
        configuration: {
          includeFiles: true,
          produceDiffs: configuration.get("produceDiffs") as boolean
        }
      })
    }
  )

  const excludeFilesCommand = vscode.commands.registerCommand(
    "openpilot.excludeFiles",
    async () => {
      configuration.update("includeFiles", false)
      vscode.commands.executeCommand(
        "setContext",
        "openpilot:includingFiles",
        false
      )
      MessageService.postMessageToWebview({
        type: "configuration",
        configuration: {
          includeFiles: false,
          produceDiffs: configuration.get("produceDiffs") as boolean
        }
      })
    }
  )

  const produceDiffsCommand = vscode.commands.registerCommand(
    "openpilot.produceDiffs",
    async () => {
      configuration.update("produceDiffs", true)
      vscode.commands.executeCommand(
        "setContext",
        "openpilot:producingDiffs",
        true
      )
      MessageService.postMessageToWebview({
        type: "configuration",
        configuration: {
          includeFiles: configuration.get("includeFiles") as boolean,
          produceDiffs: true
        }
      })
    }
  )

  const dontProduceDiffsCommand = vscode.commands.registerCommand(
    "openpilot.dontProduceDiffs",
    async () => {
      configuration.update("produceDiffs", false)
      vscode.commands.executeCommand(
        "setContext",
        "openpilot:producingDiffs",
        false
      )
      MessageService.postMessageToWebview({
        type: "configuration",
        configuration: {
          includeFiles: configuration.get("includeFiles") as boolean,
          produceDiffs: false
        }
      })
    }
  )

  // Register webview
  const openpilotView = vscode.window.registerWebviewViewProvider(
    OpenpilotView.viewType,
    OpenpilotView.getInstance(context.extensionUri)
  )

  context.subscriptions.push(
    clearChatCommand,
    getCurrentFileCommand,
    indexWorkspaceCommand,
    deleteVectorDbCommand,
    selectModelCommand,
    setApiKeyCommand,
    getApiKeysCommand,
    openpilotView,
    includeFilesCommand,
    excludeFilesCommand,
    produceDiffsCommand,
    dontProduceDiffsCommand
  )
}

export function deactivate() {}
