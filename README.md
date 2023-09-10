# Doors Smores

This project is for those that hate IBM DOORS, and similar offerings that make software documentation a headache.

The premise is simple. 
- Fragment documents into content nodes that have parent/child relationships. 
- Store those nodes as JSON files.
- Drop the complicated database and replace it with Git.

Requirement analysis software doesn't have to be that complicated... right?

## Current Features
- Can create an empty document, or a Software Requirement Specification based on the IEEE template.
- Can add headings, comments, functional requirements, image files, images created via Mermaid.
- Can rearrange content within a document.
- Can edit and delete existing content.
- Can view HTML representation of the document (or portion of).
- Can export HTML representation. 
- Can create a Git repository within the project directory for use by Doors Smores.
  - Will auto commit new content changes.
  - Will auto commit node migration changes.
- Can use existing Git repository found in a parent folder.
  - Auto commit is limited to the scope of the Doors Smores project folder.
- Node Id creation is machine dependant, allowing multiple users to share a repository without creating conflicting Ids.

## Planned Features
- Tracing between documents
- Tracing reports
- Options to include tracing information in primary documents
- Document level diff
- Auto sync with remote repository
- Header/footer templates
- User document styles
- Additional document templates
- Additional content types
- TreeView icons for easier recognition

## Other planned
- A better ReadMe
- Some instructions
- ..A nice break
- ....A large drink

## Release Notes

- Beta testing only

## Known issues

- Many (apply DDT liberally to all surfaces)