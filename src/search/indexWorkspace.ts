import { readFile } from "fs/promises"
import {
  RecursiveCharacterTextSplitter,
  SupportedTextSplitterLanguage,
  SupportedTextSplitterLanguages
} from "langchain/text_splitter"
import path from "path"
import * as vscode from "vscode"

import { getAllFilesInDirectory, getWorkspacePath } from "../utils/workspace"
import vectorStore from "./VectorStore"

export async function indexWorkspace(
  token: vscode.CancellationToken,
  onProcessed: (total: number) => void,
  options: { modifiedSince?: number } = {}
) {
  let canceled = false
  token.onCancellationRequested(() => {
    canceled = true
  })

  const workspacePath = getWorkspacePath()
  if (!workspacePath) {
    return {
      success: false,
      message:
        "There was an error indexing the workspace: No workspace found. Please open a folder."
    }
  }

  const filesPaths = await getAllFilesInDirectory(workspacePath, options)
  const groups = await groupFilesByExtension(filesPaths)

  for (const [language, filesMetadata] of Object.entries(groups)) {
    if (filesMetadata.length === 0) {
      continue
    }

    const splitter = splitterForLanguage(language)

    const filesBatchSize =
      (vscode.workspace
        .getConfiguration("openpilot")
        .get("index.filesBatchSize") as number) ?? 20

    for (let i = 0; i < filesMetadata.length; i += filesBatchSize) {
      if (canceled) {
        canceled = false
        return { success: false, message: "Canceled" }
      }

      const batchedFilesMetadata = filesMetadata.slice(i, i + filesBatchSize)
      onProcessed(batchedFilesMetadata.length)

      const filesContents = await Promise.all(
        batchedFilesMetadata.map((file) =>
          readFile(file.path, { encoding: "utf8" })
        )
      )

      try {
        const output = await splitter.createDocuments(
          filesContents,
          batchedFilesMetadata
        )
        const contents = output.map((doc) => doc.pageContent)
        const metaDatas = output.map((doc) => doc.metadata)
        await vectorStore.addDocuments(contents, metaDatas)
      } catch (e: any) {
        return { success: false, message: e.message }
      }
    }
  }

  return { success: true }
}

function splitterForLanguage(language: string) {
  if (isSupportedLanguage(language)) {
    return RecursiveCharacterTextSplitter.fromLanguage(language, {
      chunkSize: 1000,
      chunkOverlap: 0
    })
  } else {
    return new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    })
  }
}

function isSupportedLanguage(
  language: string
): language is SupportedTextSplitterLanguage {
  return SupportedTextSplitterLanguages.includes(
    language as SupportedTextSplitterLanguage
  )
}

async function groupFilesByExtension(
  entries: { name: string; path: string }[]
) {
  type GroupedFiles = {
    [key in SupportedTextSplitterLanguage | "other"]: {
      name: string
      path: string
    }[]
  }

  const groups: GroupedFiles = {
    java: [],
    js: [],
    python: [],
    ruby: [],
    cpp: [],
    go: [],
    php: [],
    proto: [],
    rst: [],
    html: [],
    latex: [],
    sol: [],
    swift: [],
    rust: [],
    scala: [],
    markdown: [],
    other: []
  }
  for (const entry of entries) {
    const extension = path.extname(entry.name)
    let bucket: SupportedTextSplitterLanguage | "other"
    switch (extension) {
      case ".js":
      case ".jsx":
      case ".ts":
      case ".tsx":
      case ".json":
      case ".cjs":
      case ".mjs":
        bucket = "js"
        break
      case ".css":
      case ".scss":
      case ".sass":
      case ".html":
      case ".htm":
        bucket = "html"
        break
      case ".md":
      case ".markdown":
        bucket = "markdown"
        break
      case ".py":
        bucket = "python"
        break
      case ".rst":
        bucket = "rst"
        break
      case ".rb":
        bucket = "ruby"
        break
      case ".go":
        bucket = "go"
        break
      case ".java":
        bucket = "java"
        break
      case ".php":
        bucket = "php"
        break
      case ".c":
      case ".cpp":
      case ".h":
      case ".hpp":
      case ".cs":
        bucket = "cpp"
        break
      case ".swift":
        bucket = "swift"
        break
      case ".rs":
        bucket = "rust"
        break
      case ".scala":
        bucket = "scala"
        break
      case ".sol":
        bucket = "sol"
        break
      case ".proto":
        bucket = "proto"
        break
      case ".tex":
        bucket = "latex"
        break
      default:
        bucket = "other"
        break
    }

    groups[bucket].push(entry)
  }
  return groups
}
