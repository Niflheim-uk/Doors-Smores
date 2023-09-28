import { workspace } from "vscode";

export class Settings {

  private static get(config:string, setting:string, defaultVal:any) {
    const configuration = workspace.getConfiguration(config);
    const value = configuration.get(setting);
    if(value) {
      return value;
    } else {
      Settings.set(config, setting, defaultVal);
      return defaultVal;
    }
  }
  private static set(config:string, setting:string, defaultVal:any) {
    const configuration = workspace.getConfiguration(config);
    configuration.update(setting, defaultVal);
  }
  public static getMaxHistory() {
    return Settings.get('history', 'maximumRecentProjects', 5);
  }
  public static getRollUpMinor() {
    return Settings.get('documentRelease', 'rollUpMinorReleasesIntoMajor', true);
  }
  public static getUseCustomHeader() {
    return Settings.get('customisation.header', 'customHeader', false);
  }
  public static getCustomHeaderPath() {
    return Settings.get('customisation.header', 'customHeaderHtml', "");
  }
  public static getUseCustomFooter() {
    return Settings.get('customisation.footer', 'customFooter', false);
  }
  public static getIncludeTracing() {
    return Settings.get('tracing', 'includeTraceDetailInDocuments', false);
  }
  public static getRequireTracing() {
    return Settings.get('tracing', 'tracingRequired', false);
  }
}
