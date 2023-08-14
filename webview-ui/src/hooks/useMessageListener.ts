import { useEffect } from "react"

import { ExtensionMessage } from "../../../src/shared/OpenpilotMessage"

export default function useMessageListener<T extends ExtensionMessage>(
  messageType: ExtensionMessage["type"],
  callback: (message: T) => void
) {
  useEffect(() => {
    const listener = (event: MessageEvent<ExtensionMessage>) => {
      const message = event.data
      if (message.type === messageType) {
        callback(message as T)
      }
    }
    window.addEventListener("message", listener)
    return () => window.removeEventListener("message", listener)
  }, [messageType, callback])
}
