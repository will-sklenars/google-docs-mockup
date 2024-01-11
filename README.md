## to run this code

- clone the repo
- npm install
- npm run build:watch
- npm run test:watch

## about the project

[Video walkthrough](https://drive.google.com/file/d/1nF0ZAIdJPhFFUPnkH_A4kJAALLV5KkJL/view?usp=sharing)

- 0:00 introduce the different files
- 1:11 talk through the readme, expected functionality, and limitations of the - system
- 5:40 look at document-store.ts
- 7:20 look at api.ts. State the API end points, and discuss data store dependency injection
- 9:50 look at test cases
- 19:30 look at the logic
- 27:50 wrapup

api.ts represents a mockup of a google docs server, which exposes the endpoints:

- createDocument
- fetchDocument
- updateDocument
- deleteDocument

For each endpoint, you can inject a DocumentStore (for testing purposes), otherwise PRODUCTION_DOCUMENT_STORE is used.

Clients can hit these endpoints. Here, the tests represent clients performing edits on documents.

A document is represented as an object with an Id, version number, and copy represented as an array of strings.
Each item in the copy array represents a new line. Line number is the array index.

As a user, you only receives updates from other users when you attempt to edit the document yourself (in normal google docs, all users would be streamed updates from all other concurrent users).
If you attempt to edit the document, but your client document version has lagged behind the server document version, then document reconciliation logic is applied.

Note: the system doesn't need to know about different users - as long as each user keeps track of their own document version number.

To accommodate scenarios where a client is updating from a stale document version, the client is required to send through the 'old value' for the line they are updating. If the old value is consistent with the server's current value for that line, the update will be allowed. If the client's old value for the line is outdated, then the client's update will be treated as a new line insert. If the client is attempting to delete or erase a stale line, then the delete will be rejected and the client will be updated to the current server version.
