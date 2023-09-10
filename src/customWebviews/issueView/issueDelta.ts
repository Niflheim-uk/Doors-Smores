import { SmoresDocument } from "../../model/smoresDocument";
import { VersionController } from "../../versionControl/versionController";


export function getDeltaHtml(document:SmoresDocument, traceReport:boolean) {
  const diffRecords = VersionController.getDiffRecords(document, traceReport);

}