import * as fs from "fs";
import * as path from "path";
import * as vscode from 'vscode';

export class SmoresDataFile {
  private static _projectFilepath:fs.PathLike|undefined;
  static setProjectFilepath(projectFilepath:fs.PathLike):void {
    SmoresDataFile._projectFilepath = projectFilepath;
  }
  static getProjectFilepath():fs.PathLike|undefined {
    return SmoresDataFile._projectFilepath;
  }
  static clearProjectFilepath() {
    SmoresDataFile._projectFilepath = undefined;
  }
  static getExtensionPath():string|undefined {
    const _extension = vscode.extensions.getExtension("Niflheim.doors-smores");
    return _extension?.extensionPath;
  }
  static getProjectRoot() {
    if(SmoresDataFile._projectFilepath) {
      const baseFolder = path.dirname(SmoresDataFile._projectFilepath.toString());
      return baseFolder;
    }
    return undefined;
  }
  static getDataFilepath() {
    const baseFolder = SmoresDataFile.getProjectRoot();
    if(baseFolder) {
      const dataPath = path.join(baseFolder, '.smoresData');
      return dataPath;
    }
    return undefined;
  }
  static getNodeFilepath(nodeId:number) {
    const dataFolder = SmoresDataFile.getDataFilepath();
    if(dataFolder) {
      const nodePath = path.join(dataFolder, `${nodeId}.smores`);
      return nodePath;
    }
    return undefined;
  }
  static getImagesFilepath() {
    const dataFolder = SmoresDataFile.getDataFilepath();
    if(dataFolder) {
      const imagesPath = path.join(dataFolder, 'images');
      return imagesPath;
    }
    return undefined;
  }

  public data:any;
  constructor(readonly filePath:fs.PathLike) {
    this.read();
  }
  write() {
    let jsonString = JSON.stringify(this.data, null, 4);
    try {
      const directoryPath = path.dirname(this.filePath.toString());
      if (!fs.existsSync(directoryPath)){
        fs.mkdirSync(directoryPath, { recursive: true });
      }    
      fs.writeFileSync(this.filePath, jsonString);
    } catch (err) {
      console.error(err);
    }
  }
  read() {
    if (fs.existsSync(this.filePath)){
      const nodeJson = fs.readFileSync(this.filePath, "utf-8");
      this.data = JSON.parse(nodeJson);
    } else {
      this.data = JSON.parse("{}");
    }
  }
  deleteDataFile() {
    fs.rmSync(this.filePath);
  }
  getNodeFilepath(nodeId:number):fs.PathLike {
    const nodeFolder = path.dirname(this.filePath.toString());
    const nodeFilename = `${nodeId}.smores`;
    const nodeFilepath = path.join(nodeFolder, nodeFilename);
    return nodeFilepath;
  }
}
