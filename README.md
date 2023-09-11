# Doors Smores

This project is for those that hate IBM DOORS, and similar offerings that make software documentation a headache.

The premise is simple. 
- Fragment documents into content nodes that have parent/child relationships. 
- Store those nodes as JSON files.
- Drop the complicated database and replace it with Git.

Requirement analysis software doesn't have to be that complicated... right?

# Pre-requisites
- Requires Git to be installed for version control features. See [this page](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) for instructions on installing Git.
- Requires [wkhtmltopdf](https://wkhtmltopdf.org) for exporting documents

# Documentation
- Instructions on how to use Doors Smores can be found [here](https://github.com/Niflheim-uk/Doors-Smores-Docs)

# Current Features
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
- Releasing documents
  - Documents may be issued as major or minor releases, with a summary of changes. 
  - Revision numbers auto increment accordingly.
  - A diff is provided of changes since the last issue to assist in generating the summary.
  - A revision history page is included in exported documents.
  - Document releases are tagged in the Git repository, or archived within the data directory if no repository is in use.

# Planned release schedule

### 0.7
![y](https://github.com/Niflheim-uk/Doors-Smores-Docs/blob/main/media/complete_icon.png?raw=true) User defined header & footer to allow document branding. \
![n](https://github.com/Niflheim-uk/Doors-Smores-Docs/blob/main/media/incomplete_icon.png?raw=true) User defined document styles

### 0.8
![n](https://github.com/Niflheim-uk/Doors-Smores-Docs/blob/main/media/incomplete_icon.png?raw=true) Risk management - includes the following:
- Define types of harm with severity
- Define risks that result in harm
- Define risk controls that mitigate risks
- Trace types of harm to the risks that cause it.
- Trace risks to the risk control that mitigate it
- Trace risk control to the requirement that implements it.
- Produce risk analysis reports.

## Other planned features
- Document review mechanism
- Document approval mechanism
- Document diff between releases, and between release and current draft.
- Script to protocol interfaces 
   - Will allow test protocols to be consumed by test frameworks (formal documentation and scripted tests remain in sync).

## Known issues

- Many (apply DDT liberally to all surfaces)
  - Hopefully less than earlier