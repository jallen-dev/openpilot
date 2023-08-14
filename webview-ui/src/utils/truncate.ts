export function truncate(fullStr: string, strLen: number, separator = "...") {
  if (fullStr.length <= strLen) {
    return fullStr
  }

  var sepLen = separator.length,
    charsToShow = strLen - sepLen,
    frontChars = Math.ceil(charsToShow / 2),
    backChars = Math.floor(charsToShow / 2)

  return (
    fullStr.substring(0, frontChars) +
    separator +
    fullStr.substring(fullStr.length - backChars)
  )
}
