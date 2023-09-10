import * as vscode from "vscode";
import * as fs from 'fs';
import * as path from 'path';
import { SmoresNode } from "../model/smoresNode";
import {getBodyHtml} from './bodyHtml';

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

export function getPageHtml(node:SmoresNode, editNode?:SmoresNode):string {

  const bodyHtml = getBodyHtml(node, editNode);
  
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${_stylesCss[0]}</style>
      <style>${_stylesCss[1]}</style>
      <style>${_stylesCss[2]}</style>
      <style>${_stylesCss[3]}</style>
      <script>${_scriptJs}</script>
      <title>Smores Preview</title>
    </head>
    <body>${bodyHtml}</body>
  </html>`;  
}