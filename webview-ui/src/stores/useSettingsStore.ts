import { create } from "zustand"

import { ApiKeys } from "../../../src/shared/ApiKeys"
import { Configuration } from "../../../src/shared/Configuration"
import { Model } from "../../../src/shared/Model"

interface SettingsState {
  model: Model
  apiKeys: ApiKeys
  includeFiles: boolean
  produceDiffs: boolean
  setModel: (model: Model) => void
  setApiKeys: (apiKeys: ApiKeys) => void
  setIncludeFiles: (includeFiles: boolean) => void
  setProduceDiffs: (produceDiffs: boolean) => void
  setConfiguration: (configuration: Configuration) => void
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  model: "gpt-3.5-turbo",
  apiKeys: {},
  includeFiles: false,
  produceDiffs: false,
  setModel: (newModel) => set({ model: newModel }),
  setApiKeys: (newKeys) => {
    const { apiKeys } = get()
    set({ apiKeys: { ...apiKeys, ...newKeys } })
  },
  setIncludeFiles: (includeFiles) => set({ includeFiles }),
  setProduceDiffs: (produceDiffs) => set({ produceDiffs }),
  setConfiguration: (configuration: Configuration) => {
    const { includeFiles, produceDiffs } = configuration
    set({ includeFiles, produceDiffs })
  }
}))
