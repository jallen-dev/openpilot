import { create } from "zustand"

import { vscode } from "../utils/vscode"

interface ErrorState {
  errorMessage: string
  setErrorMessage: (errorMessage: string) => void
}

export const useErrorStore = create<ErrorState>()((set, get) => ({
  errorMessage: vscode.getState()?.errorMessage ?? "",
  setErrorMessage: (errorMessage: string) => {
    vscode.setState({ errorMessage })
    set({ errorMessage })
  }
}))
