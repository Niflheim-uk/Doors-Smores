# Change Log

All notable changes to the "doors-smores" extension will be documented in this file.

### 0.5 patches (0.6 Coming Soon)
- Releasing documents
  - Documents may be issued as major or minor releases, with a summary of changes. 
  - Revision numbers auto increment accordingly.
  - A diff is provided of changes since the last issue to assist in generating the summary.
  - A revision history page is included in exported documents.
  - Document releases are tagged in the Git repository, or archived within the data directory if no repository is in use.
- Switched to using wkhtmltopdf for final stage of document exports. This allows:
  - Insertion of a cover page.
  - Insertion of a history page, based on the known revision history.
  - Auto-generation of a Table of Contents page.
  - Insertion of header/footer html. NB: Groundwork for user-defined header/footers is in place.
- Added (per project) remote repository setting
  - If set, changes and tags are auto-pulled from the remote periodically.
  - Commits are auto-pushed to the remote.
  - A status bar icon shows when the remote synchronization takes place.
  - The status bar item turns red while communication is lost with the remote.

## 0.5
- Converted multi-line fields to use external files instead of JSON to allow easier diff/merge between versions.
- When changes are made, all documents are auto-exported in Markdown format into the data directory prior to the commit to version control. This allows document level changes to be compared between revisions.
- Tracing reports can now be exported via the link icon in the navigation bar of the document tree view.
- An extension setting has been added to allow tracing information to be included in document fields as additional rows in requirement, design constraint and test case tables.
- An extension setting has been added to require upstream, downstream and test traces (if an appropriate document exists)
- A [wiki project](https://github.com/Niflheim-uk/Doors-Smores-Docs) has been instigated to provide instructions on how to use the extension
- The Projects view has been updated to show current/recent projects, and allow navigation of documents within the currently active project.


## 0.4
- Restructured codebase
- Added 2nd TreeView to view container for managing projects. 
- Existing TreeView now only contains the active document.

## 0.3
- Implemented tracing between documents
- Implemented trace suspicion on content change and verification process
- Restructured internal categories to include documentation level (facilitates trace validation)
- Switched from local svg files to codicon icons

## 0.2

- Fixed error if Update-TreeView command was triggered before TreeView was instantiated.
- Added mini SRS template, for when you just want something simple.
- Added design constraint type
- Added user requirement type
- Added software system test type
- Added software integration test type
- Added software unit test type
- Added tracing view (needs restricting by document type and node type)