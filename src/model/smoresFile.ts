import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { dirname } from "path";
import { DoorsSmores } from "../doorsSmores";

export class SmoresFile {
  static dataSubDirName = '.smoresData';
  static imagesSubDirName = 'images';
  static nodeExtension = '.smores';
  static projectExtension = '.smores-project';
  public data:any;
  constructor(readonly filepath:string) {
    this.read();
  }
  static exists(id:number) {
    const filepath = DoorsSmores.getNodeFilepath(id);
    return existsSync(filepath);
  }
  getFilepath() {
    return this.filepath;
  }
  write() {
    let jsonString = JSON.stringify(this.data, null, 4);
    try {
      const directoryPath = dirname(this.filepath.toString());
      if (!existsSync(directoryPath)){
        mkdirSync(directoryPath, { recursive: true });
      }    
      writeFileSync(this.filepath, jsonString);
      console.log(`wrote file ${this.data.id}`);
    } catch (err) {
      console.error(err);
    }
  }
  read() {
    if (existsSync(this.filepath)){
      const nodeJson = readFileSync(this.filepath, "utf-8");
      this.data = JSON.parse(nodeJson);
    } else {
      this.data = JSON.parse("{}");
    }
  }
  deleteFile() {
    rmSync(this.filepath);
  }
}
