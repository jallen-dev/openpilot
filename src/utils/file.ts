import { distance } from "fastest-levenshtein"
import path from "path"
import { TextEncoder } from "util"
import { Uri, WorkspaceEdit, workspace } from "vscode"

import { File } from "../shared/File"
import { getWorkspacePath } from "./workspace"

export async function editFile(
  relativePath: string,
  oldContent: string,
  newContent: string
) {
  const fileUri = Uri.file(getWorkspacePath() + relativePath)
  const document = await workspace.openTextDocument(fileUri)
  const fileContent = document.getText()
  const fileLines = fileContent.split("\n")

  let start = 0
  let end = fileLines.length
  let smallestDistance = distance(
    oldContent,
    fileLines.slice(start, end).join("\n")
  )
  while (end > 0) {
    const newDistance = distance(
      oldContent,
      fileLines.slice(start, end - 1).join("\n")
    )
    if (newDistance > smallestDistance) {
      break
    }
    smallestDistance = newDistance
    end--
  }
  while (start < end) {
    const newDistance = distance(
      oldContent,
      fileLines.slice(start + 1, end).join("\n")
    )
    if (newDistance > smallestDistance) {
      break
    }
    smallestDistance = newDistance
    start++
  }

  const newFileContent = fileContent.replace(
    fileLines.slice(start, end).join("\n"),
    newContent
  )

  const edit = new WorkspaceEdit()
  edit.createFile(Uri.file(getWorkspacePath() + relativePath), {
    overwrite: true,
    contents: new TextEncoder().encode(newFileContent)
  })

  workspace.applyEdit(edit)
  document.save()
}

export async function getFileContents(filePaths: string[]) {
  const files = await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        const fileUri = Uri.file(getWorkspacePath() + filePath)
        const document = await workspace.openTextDocument(fileUri)
        return {
          path: filePath,
          name: path.basename(filePath),
          content: document.getText()
        }
      } catch (e) {
        console.error(e)
      }
    })
  )

  return files.filter((file) => file !== undefined) as File[]
}
