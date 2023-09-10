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
  static getProjectRoot() {
    if(SmoresDataFile._projectFilepath) {
      const baseFolder = path.dirname(SmoresDataFile._projectFilepath.toString());
      return baseFolder;
    }
    return "";
  }
  static getDataFilepath() {
    const baseFolder = SmoresDataFile.getProjectRoot();
    const dataPath = path.join(baseFolder, '.smoresData');
    return dataPath;
  }
  static getNodeFilepath(nodeId:number) {
    const dataFolder = SmoresDataFile.getDataFilepath();
    const nodePath = path.join(dataFolder, `${nodeId}.smores`);
    return nodePath;
  }
  static getImagesFilepath() {
    const dataFolder = SmoresDataFile.getDataFilepath();
    const imagesPath = path.join(dataFolder, 'images');
    return imagesPath;
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
      console.log(`wrote file ${this.data.id}`);
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
