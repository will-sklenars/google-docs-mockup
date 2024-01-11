import { Document } from './document-store.js'

export type UpdateInfo = {
  id: number
  version: number
  lineNumber: number
  newLineValue: string
  oldLineValue: string
  insert?: boolean
}

export const updateDocumentLogic = (
  document: Document,
  updateInfo: UpdateInfo,
): Document => {
  let nextDocument = {
    ...document,
    copy: [...document.copy],
  }
  if (updateInfo.insert) {
    nextDocument = insertLine(
      nextDocument,
      updateInfo.lineNumber,
      updateInfo.newLineValue,
    )

    return nextDocument
  }

  if (
    clientVersionIsConsistentWithServer(
      nextDocument.version,
      updateInfo.version,
    )
  ) {
    nextDocument = updateLine(nextDocument, updateInfo)
  } else {
    nextDocument = updateDocumentFromStaleClient(nextDocument, updateInfo)
  }

  return nextDocument
}

const clientVersionIsConsistentWithServer = (
  serverVersion: number,
  clientVersion: number,
): boolean => {
  return clientVersion === serverVersion
}

const updateLine = (document: Document, updateInfo: UpdateInfo): Document => {
  let copy = document.copy
  if (updateInfo.newLineValue === null) {
    copy = eraseLine(copy, updateInfo.lineNumber)
  } else {
    copy = overwriteLine(copy, updateInfo.lineNumber, updateInfo.newLineValue)
  }
  return {
    ...document,
    copy,
    version: increment(document.version),
  }
}

const updateDocumentFromStaleClient = (
  document: Document,
  updateInfo: UpdateInfo,
): Document => {
  if (
    oldLineIsConsistentWithServer(
      updateInfo.oldLineValue,
      document.copy[updateInfo.lineNumber],
    )
  ) {
    return updateLine(document, updateInfo)
  } else {
    return reconcileUpdateForStaleLine(document, updateInfo)
  }
}

const oldLineIsConsistentWithServer = (
  oldLine: string,
  serverLine: string,
): boolean => oldLine === serverLine

const reconcileUpdateForStaleLine = (
  document: Document,
  updateInfo: UpdateInfo,
): Document => {
  if (!updateInfo.newLineValue) {
    // if we are setting the line to blank - or deleting  - don't perform the operation, and instead return the current server state. This is because the user doesn't know what is actually on that particular line. They need to see current state to decide if they want to delete it or not.
    return document
  }
  // otherwise, treat the update like an insert
  updateInfo.insert = true
  return insertLine(document, updateInfo.lineNumber, updateInfo.newLineValue)
}

const eraseLine = (copy: string[], lineNumber: number) => {
  copy.splice(lineNumber, 1)
  return copy
}

const overwriteLine = (
  copy: string[],
  lineNumber: number,
  newLineValue: string,
): string[] => {
  copy[lineNumber] = newLineValue
  return copy
}

const insertLine = (
  document: Document,
  lineNumber: number,
  newLineValue: string,
): Document => {
  const copy = document.copy
  copy.splice(lineNumber, 0, newLineValue)
  return {
    ...document,
    copy,
    version: increment(document.version),
  }
}

const increment = (version: number): number => {
  return version + 1
}
