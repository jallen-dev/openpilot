import { create } from "zustand"

interface AppState {
  workspaceIndexed: boolean
  setWorkspaceIndexed: (workspaceIndexed: boolean) => void
}

export const useAppStateStore = create<AppState>()((set, get) => ({
  workspaceIndexed: false,
  setWorkspaceIndexed: (workspaceIndexed: boolean) => {
    set({ workspaceIndexed })
  }
}))
