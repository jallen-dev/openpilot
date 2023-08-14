import { globby } from "@cjs-exporter/globby"
import { isBinaryFileSync } from "isbinaryfile"
import { workspace } from "vscode"

const FILES_TO_IGNORE = ["**/package-lock.json"]

export async function getNumberOfFilesInWorkspace(
  options: { modifiedSince?: number } = {}
) {
  const workspacePath = getWorkspacePath()
  if (!workspacePath) {
    return 0
  }

  const filesPaths = await getAllFilesInDirectory(workspacePath, options)
  return filesPaths.length
}

export async function getAllFilesInDirectory(
  directory: string,
  { modifiedSince }: { modifiedSince?: number } = {}
) {
  const allFiles = await globby("**/*", {
    gitignore: true,
    objectMode: true,
    cwd: directory,
    absolute: true,
    ignore: FILES_TO_IGNORE,
    stats: Boolean(modifiedSince)
  })
  const allTextFiles = allFiles.filter((file) => !isBinaryFileSync(file.path))

  if (modifiedSince) {
    return allTextFiles.filter((file) => file.stats!.mtimeMs > modifiedSince)
  }

  return allTextFiles
}

export function getWorkspacePath() {
  const workspace = getWorkspaceUri()
  if (!workspace) {
    return
  }

  return workspace.fsPath + "/"
}

function getWorkspaceUri() {
  if (!workspace.workspaceFolders) {
    console.warn("No workspace")
    return
  }

  return workspace.workspaceFolders[0].uri
}
