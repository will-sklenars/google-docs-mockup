export type Copy = string[]

export type Document = {
  id: number
  version: number
  copy: Copy
}

export type DocumentWithoutId = {
  version: number
  copy: Copy
}

export type DocumentStore = (Document | null)[]

export const BLANK_DOCUMENT: DocumentWithoutId = { copy: [], version: 0 }

export const PRODUCTION_DOCUMENT_STORE: DocumentStore = []
