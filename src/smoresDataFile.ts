import * as fs from "fs";
import * as path from "path";

export class SmoresDataFile {
  public data:any;
  constructor(readonly filePath:fs.PathLike) {
    this.read();
  }
  write():void {
    try {
      let jsonString = JSON.stringify(this.data);
      const directoryPath = path.dirname(this.filePath.toString());
      if (!fs.existsSync(directoryPath)){
        fs.mkdirSync(directoryPath, { recursive: true });
      }    
      jsonString = jsonString.replace(/\{/g, "{\n");
      jsonString = jsonString.replace(/\",/g, '",\n');
      jsonString = jsonString.replace(/\],/g, '],\n');

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
