import {
  ChromaClient,
  Collection,
  OpenAIEmbeddingFunction
} from "chromadb/dist/module"
import { Metadata } from "chromadb/dist/module/types"
import { range } from "lodash"
import { commands } from "vscode"

import { ApiKeys } from "../shared/ApiKeys"
import { FileSearchResult } from "../shared/File"
import { getWorkspacePath } from "../utils/workspace"

class VectorStore {
  private client = new ChromaClient()
  private _collection?: Collection

  async embeddings() {
    const { OpenAI } = await commands.executeCommand<ApiKeys>(
      "openpilot.getApiKeys"
    )
    if (!OpenAI) {
      throw new Error("OpenAI API key not set")
    }

    return new OpenAIEmbeddingFunction({
      openai_api_key: OpenAI
    })
  }

  get collectionName() {
    const workspacePath = getWorkspacePath()
    if (!workspacePath) {
      throw new Error("No workspace")
    }

    return workspacePath.slice(1, -1).replace(/\//g, "_")
  }

  async getCollection() {
    if (!this._collection) {
      const embeddingFunction = await this.embeddings()
      this._collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        embeddingFunction
      })
    }

    return this._collection
  }

  async addDocuments(documents: string[], metadatas: Metadata[]) {
    const collection = await this.getCollection()

    if (!collection) {
      console.error("Failed to get the collection.")
      return
    }

    try {
      const existing = await collection.count()
      const ids = range(existing, existing + documents.length).map((i) =>
        i.toString()
      )
      await collection.add({ ids, documents, metadatas })
    } catch (e: any) {
      console.error("Failed to add documents to vector store.", e)
      // there might be something wrong with the collection, like the OpenAI key was not correct
      // set collection to undefined so when the user retries it will be recreated
      this._collection = undefined

      throw new Error("Failed to add documents to vector store. " + e.message)
    }
  }

  async search(query: string) {
    if (!query) {
      return []
    }

    const collection = await this.getCollection()

    const queryResult = await collection.query({
      nResults: 10,
      queryTexts: query
    })

    // de-dupe and also transform to a more useful format
    const results = new Map<string, FileSearchResult>()
    for (let i = 0; i < queryResult.ids[0].length; i++) {
      const metadata = queryResult.metadatas[0][i]
      const path = metadata ? (metadata["path"] as string) : ""
      const relativePath = path.replace(getWorkspacePath() ?? "", "")

      if (results.has(relativePath)) {
        // skip this file (duplicate)
        continue
      }

      const name = metadata ? (metadata["name"] as string) : ""

      const score = queryResult.distances ? queryResult.distances[0][i] : 0
      const content = queryResult.documents
        ? queryResult.documents[0][i] ?? ""
        : ""

      results.set(relativePath, {
        path: relativePath,
        score,
        name,
        content
      })
    }

    return [...results.values()]
  }

  async deleteCollection() {
    await this.client.deleteCollection({ name: this.collectionName })
    this._collection = undefined
  }

  async count() {
    try {
      const collection = await this.getCollection()
      return collection.count()
    } catch (e) {
      console.error("Failed to count documents in vector store.", e)
      return 0
    }
  }
}

const vectorStore = new VectorStore()

export default vectorStore
