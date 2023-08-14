import { create } from "zustand"

import { File, FileSearchResult } from "../../../src/shared/File"
import { vscode } from "../utils/vscode"

interface FileContextState {
  suggestedFiles: FileSearchResult[]
  rejectedFilePaths: string[]
  setSuggestedFiles: (files: FileSearchResult[]) => void
  rejectFile: (file: string) => void
  undoRejectFile: (file: string) => void
  clearRejectedFiles: () => void
  getFilesToInclude: () => File[]
}

export const useFileContextStore = create<FileContextState>()((set, get) => ({
  suggestedFiles: vscode.getState()?.suggestedFiles ?? [],
  rejectedFilePaths: vscode.getState()?.rejectedFilePaths ?? [],
  setSuggestedFiles: (suggestedFiles: FileSearchResult[]) => {
    vscode.setState({ suggestedFiles })
    set({ suggestedFiles })
  },
  rejectFile: (file: string) =>
    set((state) => {
      vscode.setState({ rejectedFilePaths: [...state.rejectedFilePaths, file] })
      return {
        rejectedFilePaths: [...state.rejectedFilePaths, file]
      }
    }),
  undoRejectFile: (file: string) =>
    set((state) => {
      vscode.setState({
        rejectedFilePaths: state.rejectedFilePaths.filter((f) => f !== file)
      })
      return {
        rejectedFilePaths: state.rejectedFilePaths.filter((f) => f !== file)
      }
    }),
  clearRejectedFiles: () => {
    vscode.setState({ rejectedFilePaths: [] })
    set({ rejectedFilePaths: [] })
  },
  getFilesToInclude: () => {
    const { suggestedFiles, rejectedFilePaths } = get()
    return suggestedFiles.filter((f) => !rejectedFilePaths.includes(f.path))
  }
}))
