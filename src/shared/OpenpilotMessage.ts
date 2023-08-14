import { ApiKeys } from "./ApiKeys"
import { Configuration } from "./Configuration"
import { File, FileSearchResult } from "./File"
import { Model } from "./Model"

export type WebviewMessage =
  | GetCurrentFileMessage
  | GetFilesMatchingPromptMessage
  | GetFileContentsMessage
  | ShowFileMessage
  | EditFileMessage
  | AppLoadedMessage

export type ExtensionMessage =
  | ClearChatMessage
  | CurrentFileMessage
  | MatchingFilesMessage
  | FileContentsMessage
  | ApiKeysMessage
  | ModelChangedMessage
  | ConfigurationMessage
  | WorkspaceIndexStatusMessage
  | AppStateMessage

export type ClearChatMessage = {
  type: "clearChat"
}

export type GetCurrentFileMessage = {
  type: "getCurrentFile"
}

export type CurrentFileMessage = {
  type: "currentFile"
  file?: File
}

export type GetFilesMatchingPromptMessage = {
  type: "getFilesMatchingPrompt"
  prompt: string
}

export type MatchingFilesMessage = {
  type: "matchingFiles"
  files: FileSearchResult[]
}

export type ShowFileMessage = {
  type: "showFile"
  path: string
}

export type EditFileMessage = {
  type: "editFile"
  path: string
  oldContent: string
  newContent: string
}

export type AppLoadedMessage = {
  type: "appLoaded"
}

export type ApiKeysMessage = {
  type: "apiKeys"
  keys: ApiKeys
}

export type ModelChangedMessage = {
  type: "modelChanged"
  model: Model
}

export type ConfigurationMessage = {
  type: "configuration"
  configuration: Configuration
}

export type WorkspaceIndexStatusMessage = {
  type: "workspaceIndexStatus"
  indexed: boolean
}

export type AppStateMessage = {
  type: "appState"
  keys: ApiKeys
  configuration: Configuration
  workspaceIndexed: boolean
}

export type GetFileContentsMessage = {
  type: "getFileContents"
  paths: string[]
}

export type FileContentsMessage = {
  type: "fileContents"
  files: File[]
}
