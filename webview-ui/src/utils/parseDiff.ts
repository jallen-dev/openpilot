export function parseDiff(diff: string | string[]) {
  if (Array.isArray(diff)) {
    diff = diff.join("\n")
  }
  const lines = diff.split("\n")

  if (lines.length === 0) {
    return {}
  }

  const path = extractPath(lines.shift())

  // sometimes the LLM will put a blank line after the path, sometimes not
  if (lines[0] === "") {
    lines.shift()
  }

  const oldContent = extractOldContent(lines)
  const newContent = extractNewContent(lines)

  return { path, oldContent, newContent }
}

function extractOldContent(lines: string[]) {
  const result = []

  for (const line of lines) {
    if (line.startsWith("+")) {
      continue
    }

    result.push(cleanupLine(line))
  }

  return result.join("\n")
}

function extractNewContent(lines: string[]) {
  const result = []

  for (const line of lines) {
    if (line.startsWith("-")) {
      continue
    }

    result.push(cleanupLine(line))
  }

  return result.join("\n")
}

function cleanupLine(line: string) {
  if (line.startsWith("+") || line.startsWith("-")) {
    line = line.slice(1)
    // sometimes the model just puts a +/- with no space after, and sometimes it does.
    // TODO: this can mess up indentation. Figure out a better way to determine correct indent
    // if (line.startsWith(" ")) {
    //   line = line.slice(1)
    // }
  }

  return line
}

function extractPath(line?: string) {
  line = line?.trim()
  if (startsWithComment(line)) {
    // use regex to get the path from the line
    // a path looks like a string of letters, numbers, underscores, slashes, and dots but not two slashes in a row
    return line.match(/([a-zA-Z0-9_\-./]+[^/])\s*$/)?.[1]
  }
}

function startsWithComment(line?: string): line is string {
  if (!line) {
    return false
  }

  return (
    line.startsWith("//") ||
    line.startsWith("#") ||
    line.startsWith("/*") ||
    line.startsWith("<!--")
  )
}
