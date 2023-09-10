import * as vscode from "vscode";
import * as fs from 'fs';
import * as path from 'path';
import { SmoresNode } from "../model/smoresNode";
import {getBodyHtml} from './bodyHtml';
import { getNonce } from "../utils/utils";

const _extension = vscode.extensions.getExtension("Niflheim.doors-smores");
let _extensionPath:string|undefined = undefined;
let _stylesCss:Buffer[]=[];
let _scriptJs:Buffer;

if(_extension) {
  _extensionPath = _extension.extensionPath;
  // Local path to css styles
  const stylesPaths:string[] = [
    path.join(_extensionPath, 'resources', 'theme.css'),
    path.join(_extensionPath, 'resources', 'smores.css'),
    path.join(_extensionPath, 'resources', 'displayStyle.css'),
    path.join(_extensionPath, 'resources', 'pagination.css')
  ];
  const scriptPath = path.join(_extensionPath, 'resources', 'smoresScript.js');
  _stylesCss[0] = fs.readFileSync(stylesPaths[0]);
  _stylesCss[1] = fs.readFileSync(stylesPaths[1]);
  _stylesCss[2] = fs.readFileSync(stylesPaths[2]);
  _stylesCss[3] = fs.readFileSync(stylesPaths[3]);
  _scriptJs = fs.readFileSync(scriptPath);
}

export function getPageHtml(node:SmoresNode, exporting:boolean, editNode?:SmoresNode):string {
  const nonce = getNonce();
  const bodyHtml = getBodyHtml(node, exporting, editNode);
  let scripts = "";
  if(exporting===false) {
    scripts = `<script nonce="${nonce}">${_scriptJs}</script>`;
  }
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}';">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style nonce="${nonce}">${_stylesCss[0]}</style>
      <style nonce="${nonce}">${_stylesCss[1]}</style>
      <style nonce="${nonce}">${_stylesCss[2]}</style>
      <style nonce="${nonce}">${_stylesCss[3]}</style>
      ${scripts}
      <title>${node.data.text}</title>
    </head>
    <body>${bodyHtml}</body>
  </html>`;  
}