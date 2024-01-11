import {
  BLANK_DOCUMENT,
  Document,
  DocumentStore,
  DocumentWithoutId,
  PRODUCTION_DOCUMENT_STORE,
} from './document-store.js'
import { UpdateInfo, updateDocumentLogic } from './logic.js'

export const createNewDocument = (
  documentStore: DocumentStore = PRODUCTION_DOCUMENT_STORE,
  document: DocumentWithoutId = BLANK_DOCUMENT,
): Document => {
  // document id is the the index in the documentStore, 1-indexed
  const id = documentStore.length + 1
  documentStore.push({ ...document, id })
  return documentStore[id - 1]
}

export const fetchDocument = (
  documentStore: DocumentStore = PRODUCTION_DOCUMENT_STORE,
  documentId: number,
): Document | Error => {
  const document = documentStore[documentId - 1]
  if (!document) throw new Error('document not found')
  return document
}

export const deleteDocument = (
  documentStore: DocumentStore = PRODUCTION_DOCUMENT_STORE,
  documentId: number,
): boolean => {
  const document = documentStore[documentId - 1]
  if (!document) throw new Error('document not found')
  documentStore[documentId - 1] = null
  return true
}

export const updateDocument = (
  documentStore: DocumentStore = PRODUCTION_DOCUMENT_STORE,
  updateInfo: UpdateInfo,
): Document | Error => {
  const document = documentStore[updateInfo.id - 1]
  if (!document) throw new Error('document not found')

  const nextDocument = updateDocumentLogic(document, updateInfo)
  documentStore[updateInfo.id - 1] = nextDocument
  return nextDocument
}
