import { ExtensionContext, StatusBarAlignment, StatusBarItem, ThemeColor, window } from "vscode";
import { DoorsSmores } from "../doorsSmores";
import { VersionController } from "../versionControl/versionController";


export class StatusBar {
  private static item: StatusBarItem;
  private static remoteHealthy:boolean;
  private static remoteInUse:boolean;
  private static syncInProgress:boolean;
  private static spinTimer:NodeJS.Timeout;
  private static readonly spinPeriod:number = 3000;
  constructor (){}
  public static register(context:ExtensionContext) {
    StatusBar.item = window.createStatusBarItem(StatusBarAlignment.Left);
    context.subscriptions.push(StatusBar.item);
  }
  public static update() {
    const document = DoorsSmores.getActiveDocument();
    const project = DoorsSmores.getActiveProject();
    var traceText = "";
    var remoteText = "";
    if(document) {
      const numTraces = document.getNumberTraces();
      const numMissing = document.getNumberMissingTraces();
      traceText = `$(link): ${numTraces}$(thumbsup) ${numMissing}$(thumbsdown)`;
    }
    if(project && project.data.repoRemote && StatusBar.remoteInUse) {
      if(StatusBar.syncInProgress) {
        remoteText = "$(sync~spin)";
      } else {
        remoteText = "$(sync)";
      }
      if(StatusBar.remoteHealthy) {
        StatusBar.item.backgroundColor = undefined;
        StatusBar.item.tooltip = "";
      } else {
        StatusBar.item.backgroundColor = new ThemeColor("statusBarItem.errorBackground");
        StatusBar.item.tooltip = "Unable to synchronize with remote repository";
      }
    }
    if(document || project) {
      StatusBar.item.text = `${traceText}${remoteText}`;
      StatusBar.item.show();
//      StatusBar.item.command = {title:'Get Trace Report',command:'doors-smores.ExportTraceReport',arguments:[document]};
    } else {
      StatusBar.item.hide();
    }
  }
  public static updateHealthy(healthy:boolean) {
    StatusBar.remoteHealthy = healthy;
    StatusBar.update();
  }
  public static syncStart() {
    StatusBar.spinTimer = setTimeout(StatusBar.spinStop, StatusBar.spinPeriod);
    StatusBar.syncInProgress = true;
    StatusBar.update();
  }
  public static updateRemoteUse(inUse:boolean) {
    StatusBar.remoteInUse = inUse;
  }
  private static spinStop() {
    StatusBar.syncInProgress = false;
    StatusBar.update();
  }
}