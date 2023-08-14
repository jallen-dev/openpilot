import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vs, vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

import { ReactComponent as Icon } from "../../../media/icons/dark/replace-all.svg"
import { parseDiff } from "../utils/parseDiff"
import { vscode } from "../utils/vscode"

export function SyntaxHighlighterWrapper({
  language,
  children,
  ...props
}: {
  language: string
  children: string | string[]
}) {
  function handleClick() {
    const { path, oldContent, newContent } = parseDiff(children)
    if (path) {
      vscode.postMessage({
        type: "editFile",
        path,
        oldContent,
        newContent
      })
    }
  }
  return (
    <div className="relative">
      {language === "diff" && (
        <button
          className="w-8 h-8 bg-zinc-700 absolute right-2 top-2 rounded-sm inline-flex justify-center items-center"
          onClick={handleClick}
          title="Apply diff"
        >
          <Icon />
        </button>
      )}
      <SyntaxHighlighter
        {...props}
        children={children}
        // TODO: figure out how to detect light mode
        style={vscDarkPlus}
        language={language}
        PreTag="div"
      />
    </div>
  )
}
