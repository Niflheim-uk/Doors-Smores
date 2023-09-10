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

## Planned Features
- Document cover page
- Document table of contents
- Tracing reports
- Options to include tracing information in primary documents
- Risk management
- Document level diff
- Auto sync with remote repository
- Header/footer templates
- User document styles
- Additional document templates

## Other planned
- A better ReadMe
- Some instructions
- ..A nice break
- ....A large drink

## Release Notes

- Beta testing only

## Known issues

- Many (apply DDT liberally to all surfaces)