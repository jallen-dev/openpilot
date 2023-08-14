export type File = {
  path: string
  name: string
  content: string
}

export type FileSearchResult = File & {
  score: number
}
