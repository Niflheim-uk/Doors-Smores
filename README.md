# Doors Smores

This project is for those that hate IBM DOORS, and similar offerings that make software documentation a headache.

The premise is simple. 
- Fragment documents into content nodes that have parent/child relationships. 
- Store those nodes as JSON files.
- Drop the complicated database and replace it with Git.

Requirement analysis software doesn't have to be that complicated... right?

## Current Features
- Can create and edit documents.
  - 8 document types are supported
    - User Requirements Specification
    - Software Requirements Specification
    - Architecture Design Specification
    - Detailed Design Specification
    - User Acceptance Test Protocol
    - Software System Test Protocol
    - Integration Test Protocol
    - Unit Test Protocol
  - Text content is entered in Markdown
  - Images can be added from source files or using Mermaid syntax
- Can export the document as a HTML document (with page breaks) for printing. 
- Option at project creation to initialise a Git repository for change control and team synchronization 
  - Changes are auto-commented and committed.
  - Node Id creation is machine dependant, allowing multiple users to share a repository without creating conflicting Ids.
  - If the project is nested within a folder that is already in a Git repository, the option converts to using the inherited repository.
- Tracing
  - Auto selection of appropriate documents
  - Auto filtering of target nodes
  - Tracking of total traces within current document
  - Tracking of total missing traces within current document
  - Trace report generation
  - Trace information may be included in primary documents
  - Missing traces may be highlighted within primary documents to aid review

# Planned release schedule
### 0.5
![y](https://www.iconfinder.com/icons/1930264/download/png/16) Markdown export on export all \
![y](https://www.iconfinder.com/icons/1930264/download/png/16) Auto export all on change to support document level diff \
![y](https://www.iconfinder.com/icons/1930264/download/png/16) Tracing reports \
![y](https://www.iconfinder.com/icons/1930264/download/png/16) Option to include tracing information in primary documents \
![y](https://www.iconfinder.com/icons/1930264/download/png/16) Option to highlight missing traces \
![n](https://www.iconfinder.com/icons/1891023/download/png/16) Some instructions \
![y](https://www.iconfinder.com/icons/1930264/download/png/16) Convert multi-line fields to external file references (easier for diff/merge)

### 0.6 
![n](https://www.iconfinder.com/icons/1891023/download/png/16) Document cover page \
![n](https://www.iconfinder.com/icons/1891023/download/png/16) Document table of contents \
![n](https://www.iconfinder.com/icons/1891023/download/png/16) All templates

### Future
- Risk management
- Document level diff
- Auto sync with remote repository
- Header/footer templates
- User document styles
- Script to protocol interfaces - Will allow test frameworks and test protocols to remain in sync.

## Release Notes

- Beta testing only

## Known issues

- Many (apply DDT liberally to all surfaces)