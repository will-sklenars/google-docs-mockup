import {
  createNewDocument,
  deleteDocument,
  fetchDocument,
  updateDocument,
} from '../src/api.js'
import { Copy, Document, DocumentStore } from '../src/document-store.js'
import { UpdateInfo } from '../src/logic.js'

describe('fetchDocument', () => {
  const testingDocumentStore: DocumentStore = []
  createNewDocument(testingDocumentStore, {
    version: 1,
    copy: ['test document'],
  })

  test('Returns the document by id if found', () => {
    expect(fetchDocument(testingDocumentStore, 1)).toBe(testingDocumentStore[0])
  })

  test('Throws an error if document not found', () => {
    expect(() => {
      fetchDocument(testingDocumentStore, 2)
    }).toThrow()
  })
})

describe('createNewDocument', () => {
  const testingDocumentStore: DocumentStore = []

  test('createNewDocument creates a blank document and saves it in DocumentStore', () => {
    const copy: Copy = []
    const mockBlankDocument = {
      id: 1,
      version: 0,
      copy,
    }
    const newDocument = createNewDocument(testingDocumentStore)
    expect(newDocument).toEqual(mockBlankDocument)
    expect(testingDocumentStore[0]).toEqual(mockBlankDocument)
  })
})

describe('deleteDocument', () => {
  const testingDocumentStore: DocumentStore = []
  createNewDocument(testingDocumentStore, {
    version: 1,
    copy: ['test document'],
  })

  test('Throws an error if we try delete a document that doesnt exist', () => {
    expect(() => {
      deleteDocument(testingDocumentStore, 2)
    }).toThrow()
  })

  const documentDeleted = deleteDocument(testingDocumentStore, 1)
  test('return true for successful deletion', () => {
    expect(documentDeleted).toBe(true)
  })

  test('Deleted document is no longer present in DocumentStore', () => {
    expect(() => {
      fetchDocument(testingDocumentStore, 1)
    }).toThrow()
  })
})

describe('client update when the client document version is consistent with the server document version', () => {
  test('editing a line', () => {
    const testingDocumentStore: DocumentStore = []
    createNewDocument(testingDocumentStore, {
      version: 0,
      copy: ['line zero', 'line one'],
    })

    const updateInfo: UpdateInfo = {
      id: 1,
      version: 0,
      lineNumber: 1,
      newLineValue: 'line one has been edited',
      oldLineValue: 'line one',
    }

    const returnedDocumentMock: Document = {
      id: 1,
      version: 1,
      copy: ['line zero', 'line one has been edited'],
    }
    const updatedDocument = updateDocument(testingDocumentStore, updateInfo)
    expect(updatedDocument).toEqual(returnedDocumentMock)
    // also check that the document returned is the document stored in the data store
    expect(updatedDocument).toBe(testingDocumentStore[updateInfo.id - 1])
  })

  test('set line to blank', () => {
    const testingDocumentStore: DocumentStore = []
    createNewDocument(testingDocumentStore, {
      version: 0,
      copy: ['line zero', 'line one'],
    })

    const updateInfo: UpdateInfo = {
      id: 1,
      version: 0,
      lineNumber: 1,
      newLineValue: '',
      oldLineValue: 'line one',
    }

    const returnedDocumentMock: Document = {
      id: 1,
      version: 1,
      copy: ['line zero', ''],
    }
    const updatedDocument = updateDocument(testingDocumentStore, updateInfo)
    expect(updatedDocument).toEqual(returnedDocumentMock)
    // also check that the document returned is the document stored in the data store
    expect(updatedDocument).toBe(testingDocumentStore[updateInfo.id - 1])
  })

  test('erase line', () => {
    const testingDocumentStore: DocumentStore = []
    createNewDocument(testingDocumentStore, {
      version: 0,
      copy: ['line zero', 'line one'],
    })

    const updateInfo: UpdateInfo = {
      id: 1,
      version: 0,
      lineNumber: 1,
      newLineValue: null,
      oldLineValue: 'line one',
    }

    const returnedDocumentMock: Document = {
      id: 1,
      version: 1,
      copy: ['line zero'],
    }
    const updatedDocument = updateDocument(testingDocumentStore, updateInfo)
    expect(updatedDocument).toEqual(returnedDocumentMock)
    // also check that the document returned is the document stored in the data store
    expect(updatedDocument).toBe(testingDocumentStore[updateInfo.id - 1])
  })

  test('insert line in middle of doc', () => {
    const clientVersion = 3
    const editingLine = 2

    const testingDocumentStore: DocumentStore = []
    createNewDocument(testingDocumentStore, {
      version: 0,
      copy: ['line zero', 'line one', 'line two'],
    })

    const updateInfo: UpdateInfo = {
      id: 1,
      version: 0,
      lineNumber: 0,
      newLineValue: 'insert me before line zero',
      oldLineValue: 'line zero',
      insert: true,
    }

    const returnedDocumentMock: Document = {
      id: 1,
      version: 1,
      copy: ['insert me before line zero', 'line zero', 'line one', 'line two'],
    }

    const updatedDocument = updateDocument(testingDocumentStore, updateInfo)
    expect(updatedDocument).toEqual(returnedDocumentMock)
    // also check that the document returned is the document stored in the data store
    expect(updatedDocument).toBe(testingDocumentStore[updateInfo.id - 1])
  })

  test('insert line at end of doc', () => {
    const testingDocumentStore: DocumentStore = []
    createNewDocument(testingDocumentStore, {
      version: 0,
      copy: ['line zero', 'line one', 'line two'],
    })

    const updateInfo: UpdateInfo = {
      id: 1,
      version: 0,
      lineNumber: 3,
      newLineValue: 'line three',
      oldLineValue: null,
      insert: true,
    }

    const returnedDocumentMock: Document = {
      id: 1,
      version: 1,
      copy: ['line zero', 'line one', 'line two', 'line three'],
    }

    const updatedDocument = updateDocument(testingDocumentStore, updateInfo)
    expect(updatedDocument).toEqual(returnedDocumentMock)
    // also check that the document returned is the document stored in the data store
    expect(updatedDocument).toBe(testingDocumentStore[updateInfo.id - 1])
  })
})

describe('client update when client document version is stale', () => {
  test('Despite the client having fallen behind, the old version of the line they are trying to update is consistent with the server. Allow the update, and merge it with server current state.', () => {
    const testingDocumentStore: DocumentStore = []
    createNewDocument(testingDocumentStore, {
      version: 3,
      copy: ['line zero', 'line one', 'line two'],
    })

    const clientDocument = {
      version: 1,
      copy: ['line zero'],
    }

    const updateInfo: UpdateInfo = {
      id: 1,
      version: clientDocument.version,
      lineNumber: 0,
      newLineValue: 'line 0',
      oldLineValue: clientDocument.copy[0],
    }

    const returnedDocumentMock: Document = {
      id: 1,
      version: 4,
      copy: ['line 0', 'line one', 'line two'],
    }

    const updatedDocument = updateDocument(testingDocumentStore, updateInfo)
    expect(updatedDocument).toEqual(returnedDocumentMock)
    // also check that the document returned is the document stored in the data store
    expect(updatedDocument).toBe(testingDocumentStore[updateInfo.id - 1])
  })

  test('Edit a line. Client old line is inconsistent with server. Insert instead of update.', () => {
    const testingDocumentStore: DocumentStore = []
    createNewDocument(testingDocumentStore, {
      version: 3,
      copy: ['line zero', 'line one', 'line two'],
    })

    const clientDocument = {
      version: 1,
      copy: ['line zero is inconsistent with server'],
    }

    const updateInfo: UpdateInfo = {
      id: 1,
      version: clientDocument.version,
      lineNumber: 0,
      newLineValue: 'line 0 - will be inserted',
      oldLineValue: clientDocument.copy[0],
    }

    const returnedDocumentMock: Document = {
      id: 1,
      version: 4,
      copy: ['line 0 - will be inserted', 'line zero', 'line one', 'line two'],
    }

    const updatedDocument = updateDocument(testingDocumentStore, updateInfo)
    expect(updatedDocument).toEqual(returnedDocumentMock)
    // also check that the document returned is the document stored in the data store
    expect(updatedDocument).toBe(testingDocumentStore[updateInfo.id - 1])
  })

  test('Set line to blank. Client line is consistent with the server', () => {
    const testingDocumentStore: DocumentStore = []
    createNewDocument(testingDocumentStore, {
      version: 3,
      copy: ['line zero', 'line one', 'line two'],
    })

    const clientDocument = {
      version: 1,
      copy: ['line zero'],
    }

    const updateInfo: UpdateInfo = {
      id: 1,
      version: clientDocument.version,
      lineNumber: 0,
      newLineValue: '',
      oldLineValue: clientDocument.copy[0],
    }

    const returnedDocumentMock: Document = {
      id: 1,
      version: 4,
      copy: ['', 'line one', 'line two'],
    }

    const updatedDocument = updateDocument(testingDocumentStore, updateInfo)
    expect(updatedDocument).toEqual(returnedDocumentMock)
    // also check that the document returned is the document stored in the data store
    expect(updatedDocument).toBe(testingDocumentStore[updateInfo.id - 1])
  })

  test('set line to blank. Client line is inconsistent with server. Make no update, return server state.', () => {
    const testingDocumentStore: DocumentStore = []
    createNewDocument(testingDocumentStore, {
      version: 3,
      copy: ['line zero', 'line one', 'line two'],
    })

    const clientDocument = {
      version: 1,
      copy: ['line 0'],
    }

    const updateInfo: UpdateInfo = {
      id: 1,
      version: clientDocument.version,
      lineNumber: 0,
      newLineValue: '',
      oldLineValue: clientDocument.copy[0],
    }

    const returnedDocumentMock: Document = {
      id: 1,
      version: 3,
      copy: ['line zero', 'line one', 'line two'],
    }

    const updatedDocument = updateDocument(testingDocumentStore, updateInfo)
    expect(updatedDocument).toEqual(returnedDocumentMock)
    // also check that the document returned is the document stored in the data store
    expect(updatedDocument).toBe(testingDocumentStore[updateInfo.id - 1])
  })

  test('erase line, client old line is consistent with server', () => {
    const testingDocumentStore: DocumentStore = []
    createNewDocument(testingDocumentStore, {
      version: 3,
      copy: ['line zero', 'line one', 'line two'],
    })

    const clientDocument = {
      version: 1,
      copy: ['line zero'],
    }

    const updateInfo: UpdateInfo = {
      id: 1,
      version: clientDocument.version,
      lineNumber: 0,
      newLineValue: null,
      oldLineValue: clientDocument.copy[0],
    }

    const returnedDocumentMock: Document = {
      id: 1,
      version: 4,
      copy: ['line one', 'line two'],
    }

    const updatedDocument = updateDocument(testingDocumentStore, updateInfo)
    expect(updatedDocument).toEqual(returnedDocumentMock)
    // also check that the document returned is the document stored in the data store
    expect(updatedDocument).toBe(testingDocumentStore[updateInfo.id - 1])
  })

  test('erase line, client old line is inconsistent with server. Return current server state', () => {
    const testingDocumentStore: DocumentStore = []
    createNewDocument(testingDocumentStore, {
      version: 3,
      copy: ['line zero', 'line one', 'line two'],
    })

    const clientDocument = {
      version: 1,
      copy: ['line zero is inconsistent'],
    }

    const updateInfo: UpdateInfo = {
      id: 1,
      version: clientDocument.version,
      lineNumber: 0,
      newLineValue: null,
      oldLineValue: clientDocument.copy[0],
    }

    const returnedDocumentMock: Document = {
      id: 1,
      version: 3,
      copy: ['line zero', 'line one', 'line two'],
    }

    const updatedDocument = updateDocument(testingDocumentStore, updateInfo)
    expect(updatedDocument).toEqual(returnedDocumentMock)
    // also check that the document returned is the document stored in the data store
    expect(updatedDocument).toBe(testingDocumentStore[updateInfo.id - 1])
  })
})
