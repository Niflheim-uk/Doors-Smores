import * as fs from "fs";
import * as path from "path";

export class SmoresDataFile {
  private static _projectFilepath:fs.PathLike;
  static setProjectFilePath(projectFilepath:fs.PathLike):void {
    SmoresDataFile._projectFilepath = projectFilepath;
  }
  static getProjectFilePath():fs.PathLike {
    return SmoresDataFile._projectFilepath;
  }
  static getNodeFilepath(nodeId:number) {
    const baseFolder = path.dirname(SmoresDataFile._projectFilepath.toString());
    const dataFolder = path.basename(SmoresDataFile._projectFilepath.toString(), '.smores-project');
    const nodePath = path.join(baseFolder, dataFolder, `${nodeId}.smores`);
    return nodePath;
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
  getNodeFilepath(nodeId:number):fs.PathLike {
    const nodeFolder = path.dirname(this.filePath.toString());
    const nodeFilename = `${nodeId}.smores`;
    const nodeFilepath = path.join(nodeFolder, nodeFilename);
    return nodeFilepath;
  }
}
