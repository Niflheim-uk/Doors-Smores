import { DoorsSmores } from "../../doorsSmores";
import { SmoresProject } from "../../model/smoresProject";
import { Converter, ConverterOptions } from "showdown";
import { getHtmlFromMd, getIndentedHtmlFromMd } from "../markdownConversion";

const introTemplateMd:string[] = [
/*0*/`# Introduction`,    
/*1*/`## Purpose`,
/*2*/`This document defines a trace report within the PROJECT_NAME project.`,
/*3*/`## Scope`,
/*4*/`The scope of this document is the traces from DOCUMENT_TYPE, DOCUMENT_NAME to other documents within the PROJECT_NAME project.`,
/*5*/`# References`,
/*6*/`The following documents may be referenced by this report.`,
/*7*/``,
/*8*/`# Glossary`,
/*9*/`The following terms may be used within this document to differentiate types of traces.`,
/*10*/`| Term            | Definition                                                                           |
|-----------------|--------------------------------------------------------------------------------------|
| Decomposes to   | A user requirement decomposes to a software requirement                              |
| Decomposed from | A software requirement is decomposed from a user requirement                         |
| Satisfied by    | A software requirement is satisfied by an architectural requirement                  |
| Satisfies       | An architectural requirement satisfies a software requirement                        |
| Detailed by     | A software or architectural requirement is detailed by a detailed design requirement |
| Details         | A detailed design requirement details a software or architectural requirement        |
| Verified by     | A requirement is verified by a test case                                             |
| Verifies        | A test case verifies a requirement                                                   |`,
/*11*/`# Traces`];

export function getTraceReportIntroFromTemplate(documentType:string, documentName:string) {
  const project = DoorsSmores.getActiveProject();
  if(project === undefined) {
    return "";
  }
  var intro:string[]=[];
  for(let i=0; i<introTemplateMd.length; i++) {
    if(Array.isArray(intro)) {
      intro.push(introTemplateMd[i]);
    } else {
      intro = [introTemplateMd[i]];
    }
  }
  const projectName = project.getFilenameNoExt();
  
  intro[2] = intro[2].replace(/PROJECT_NAME/g, projectName);
  intro[4] = intro[4].replace(/PROJECT_NAME/g, projectName);
  intro[4] = intro[4].replace(/DOCUMENT_TYPE/g, documentType);
  intro[4] = intro[4].replace(/DOCUMENT_NAME/g, documentName);
  intro[0] = getHtmlFromMd(intro[0]);
  intro[1] = getHtmlFromMd(intro[1]);
  intro[2] = getIndentedHtmlFromMd(intro[2]);
  intro[3] = getHtmlFromMd(intro[3]);
  intro[4] = getIndentedHtmlFromMd(intro[4]);
  intro[5] = getHtmlFromMd(intro[5]);
  intro[6] = getIndentedHtmlFromMd(intro[6]);
  intro[7] = getReferenceTable(project);
  intro[8] = getHtmlFromMd(intro[8]);
  intro[9] = getIndentedHtmlFromMd(intro[9]);
  intro[10] = getIndentedHtmlFromMd(intro[10]);
  intro[11] = getHtmlFromMd(intro[11]);
  return intro.join('\n');
}

function getReferenceTable(project:SmoresProject):string {
  const documents = project.getDocuments();
  let table = `
| ID  | Name |    
|-----|------|    
`;
  for(let i=0; i<documents.length; i++) {
    const documentType = documents[i].data.documentData?.documentType;
    const documentName = documents[i].data.text;
    table = table.concat(`| [${i+1}] | ${documentType} - ${documentName} |    \n`);
  }
  return getIndentedHtmlFromMd(table);
}