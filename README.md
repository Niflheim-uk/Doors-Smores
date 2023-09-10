# Doors Smores

This project is for those that hate IBM DOORS, and similar offerings that make software documentation a headache.

The premise is simple. 
- Fragment documents into content nodes that have parent/child relationships. 
- Store those nodes as JSON files.
- Drop the complicated database and replace it with Git.

Requirement analysis software doesn't have to be that complicated... right?

## Current Features
- Can create and edit documents.
  - Text content is entered in Markdown
  - Images can be added from source files
  - Images can be added using Mermaid syntax
- Can view the HTML representation of the document (or portion of).
- Can export the HTML representation for printing. 
- Can use Git to track changes to the Doors Smores project 
  - Changes are auto-commented and committed.
  - Node Id creation is machine dependant, allowing multiple users to share a repository without creating conflicting Ids.
- Tracing between documents

# Planned release schedule
### 0.5
![y](https://www.iconfinder.com/icons/1930264/download/png/16) Markdown export on export all \
![y](https://www.iconfinder.com/icons/1930264/download/png/16) Auto export all on change to support document level diff \
![n](https://www.iconfinder.com/icons/1891023/download/png/16) Tracing reports \
![y](https://www.iconfinder.com/icons/1930264/download/png/16) Option to include tracing information in primary documents \
![n](https://www.iconfinder.com/icons/1891023/download/png/16) Option to highlight missing traces \
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

## Release Notes

- Beta testing only

## Known issues

- Many (apply DDT liberally to all surfaces)