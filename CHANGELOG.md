# Change Log

All notable changes to the "doors-smores" extension will be documented in this file.

## 0.4.6
- Changed data storage of multi-line fields to use separate files instead of JSON. This allows for easier diff between versions.

## 0.4.0
- Restructured codebase
- Added 2nd TreeView to view container for managing projects. 
- Existing TreeView now only contains the active document.

## 0.3.0
- Implemented tracing between documents
- Implemented trace suspicion on content change and verification process
- Restructured internal categories to include documentation level (facilitates trace validation)
- Switched from local svg files to codicon icons

## 0.2.0

- Fixed error if Update-TreeView command was triggered before TreeView was instantiated.
- Added mini SRS template, for when you just want something simple.
- Added design constraint type
- Added user requirement type
- Added software system test type
- Added software integration test type
- Added software unit test type
- Added tracing view (needs restricting by document type and node type)