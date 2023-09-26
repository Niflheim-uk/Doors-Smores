import { existsSync, mkdirSync, readFileSync, rmSync, rmdirSync, writeFileSync } from "fs";
import { basename, dirname, extname, join } from "path";
import { DoorsSmores } from "../doorsSmores";

const nonJSONFields = [
  'text',
  'translationRationale',
  'expectedResults'
];
export class SmoresFile {
  static dataSubDirName = '.smoresData';
  static nodeExtension = 'json';
  static projectExtension = 'smores-project';
  static imageFilename = 'image';
  static defaultImage = 'defaultImage.jpg';
  private dirPath:string;
  private filename:string;
  private filenameNoExt:string;
  public data:any;
  constructor(private filepath:string) {
    this.dirPath = dirname(filepath);
    this.filename = basename(filepath);
    const ext = extname(filepath).slice(1);
    if(ext === SmoresFile.nodeExtension) {
      this.filenameNoExt = basename(filepath, `.${SmoresFile.nodeExtension}`);
    } else if(ext === SmoresFile.projectExtension) {
      this.filenameNoExt = basename(filepath, `.${SmoresFile.projectExtension}`);
    } else {
      this.filenameNoExt = "unknown";
      console.error('File extension did not match known types');
    }
    this.read();
  }
  static exists(id:number) {
    const filepath = DoorsSmores.getNodeFilepath(id);
    return existsSync(filepath);
  }
  getFilepath() {
    return this.filepath;
  }
  getDirPath() {
    return this.dirPath;
  }
  getFilename() {
    return this.filename;
  }
  getFilenameNoExt() {
    return this.filenameNoExt;
  }
  write() {
    try {
      if (!existsSync(this.dirPath)){
        mkdirSync(this.dirPath, { recursive: true });
      }    
      let jsonData = JSON.parse(JSON.stringify(this.data));
      jsonData = this.writeNonJSONFiles(jsonData);
      let jsonString = JSON.stringify(jsonData, null, 4);
      const jsonFile = this.getJSONFilepath();
      writeFileSync(jsonFile, `${jsonString}\n`);
      console.log(`wrote file ${this.data.id}`);
    } catch (err) {
      console.error(err);
    }
  }
  read() {
    const jsonFile = this.getJSONFilepath();
    if (existsSync(jsonFile)){
      const nodeJson = readFileSync(jsonFile, "utf-8");
      this.data = JSON.parse(nodeJson);
      this.readNonJSONFiles();
    } else {
      this.data = JSON.parse("{}");
    }

  }
  deleteFile() {
    if(existsSync(this.dirPath)) {
      rmSync(this.dirPath, {recursive:true, force:true});
    }
  }
  private getJSONFilepath() {
    return join(this.dirPath, this.filename);
  }
  private getTextFilepath() {
    return join(this.dirPath, "Text.txt");
  }
  private getExpectedResultsFilepath() {
    return join(this.dirPath, "ExpectedResults.txt");
  }
  private getTranslationRationaleFilepath() {
    return join(this.dirPath, "TranslationRationale.txt");
  }
  private writeNonJSONFiles(jsonData:any):any {
    if(jsonData.text) {
      const filepath = this.getTextFilepath();
      writeFileSync(filepath, jsonData.text);
      console.log(`wrote file ${filepath}`);
      jsonData.text = undefined;
    }
    if(jsonData.expectedResults) {
      const filepath = this.getExpectedResultsFilepath();
      writeFileSync(filepath, jsonData.expectedResults);
      console.log(`wrote file ${filepath}`);
      jsonData.expectedResults = undefined;
    }
    if(jsonData.translationRationale) {
      const filepath = this.getTranslationRationaleFilepath();
      writeFileSync(filepath, jsonData.translationRationale);
      console.log(`wrote file ${filepath}`);
      jsonData.translationRationale = undefined;
    }
    return jsonData;
  }
  private readNonJSONFiles() {
    let filepath = this.getTextFilepath();
    if (existsSync(filepath)){
      this.data.text = readFileSync(filepath, "utf-8");
    }
    filepath = this.getExpectedResultsFilepath();
    if (existsSync(filepath)){
      this.data.expectedResults = readFileSync(filepath, "utf-8");
    }
    filepath = this.getTranslationRationaleFilepath();
    if (existsSync(filepath)){
      this.data.translationRationale = readFileSync(filepath, "utf-8");
    }

  }
}
