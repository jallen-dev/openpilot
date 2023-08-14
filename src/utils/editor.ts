import path from "path"
import { window, workspace } from "vscode"

import { File } from "../shared/File"
import { getWorkspacePath } from "./workspace"

export function getCurrentFile(): File | undefined {
  if (!window.activeTextEditor) {
    console.warn("No active text editor")
    return
  }

  const workspacePath = getWorkspacePath()
  if (!workspacePath) {
    return
  }

  // get just the part after the workspace
  const filePath = window.activeTextEditor.document.uri.fsPath.replace(
    workspacePath,
    ""
  )

  const name = path.basename(window.activeTextEditor.document.uri.fsPath)
  const content = window.activeTextEditor.document.getText()

  return { path: filePath, name, content }
}

export async function showFile(path: string) {
  const workspacePath = getWorkspacePath()
  if (!workspacePath) {
    return
  }

  const filePath = workspacePath + path
  const document = await workspace.openTextDocument(filePath)
  window.showTextDocument(document)
}
