import * as vscode from "vscode";
import { DoorsSmores, ProjectInfo } from "../../doorsSmores";
import { DocumentNode } from "../../model/documentNode";
import { SmoresProject } from "../../model/smoresProject";
import { getNodeIcon } from "../treeIcons";
import { SmoresDocument } from "../../model/smoresDocument";

export enum ProjectTreeItemType {
  current,
  recent,
  project,
  document
};
export class ProjectTreeItem extends vscode.TreeItem {
  private isActive:boolean;
  constructor(readonly info:ProjectInfo, private itemType:ProjectTreeItemType) {
    const activeProject:SmoresProject|undefined = DoorsSmores.getActiveProject();

    var state = vscode.TreeItemCollapsibleState.None;
    let active = false;
    if(itemType === ProjectTreeItemType.current || itemType === ProjectTreeItemType.recent) {
      state = vscode.TreeItemCollapsibleState.Expanded;
    } else if(activeProject && info.path === activeProject.getFilepath()) {
      state = vscode.TreeItemCollapsibleState.Expanded;
      active = true;
    }
    super(info.name, state);
    this.isActive = active;
    var icon:vscode.ThemeIcon;
    switch(itemType) {
    case ProjectTreeItemType.current:
      this.contextValue = 'currentProjectFolder';
      break;
    case ProjectTreeItemType.recent:
      this.contextValue = 'recentProjectFolder';
      break;
    case ProjectTreeItemType.project:
      this.contextValue = 'recentProjectFolder';
      if(this.isActive === false) {
        this.contextValue = 'recentProject';
        this.iconPath = vscode.ThemeIcon.Folder;
      } else {
        this.contextValue = 'activeProject';
        const iconColour = new vscode.ThemeColor('foreground');
        this.iconPath = new vscode.ThemeIcon('folder-opened', iconColour);    
      }
      this.tooltip = `${info.name}\n\n${info.path}`;
      this.command = {title: 'Click', command :'doors-smores.OnProjectTreeItemClick',arguments:[this]};
      break;
    case ProjectTreeItemType.document:
      const item = new DocumentNode(info.path);
      this.iconPath = getNodeIcon(item);
      this.contextValue = 'document';
      this.tooltip = `${info.name}\n\n${info.path}`;
      this.command = {title: 'Click', command :'doors-smores.OnProjectTreeItemClick',arguments:[this]};
      break;
    }
  }
  public getType() {
    return this.itemType;
  }
  public static isProjectTreeItem(item:ProjectTreeItem) {
    if(item === undefined) {return false;}
    if(item.info === undefined) {return false;}
    if(item.info.name === undefined) {return false;}
    if(item.info.path === undefined) {return false;}
    if(item.itemType === undefined) {return false;}
    if(item.tooltip === undefined) {return false;}
    if(item.command === undefined) {return false;}
    if(item.iconPath === undefined) {return false;}
    return true;
  }
  public getChildren() {
    const activeProject = DoorsSmores.getActiveProject();
    var children:ProjectTreeItem[] = [];
    if(activeProject && this.info.path === activeProject.getFilepath()) {
      const childDocNodes = activeProject.getDocuments();
      for(let i=0; i< childDocNodes.length; i++) {
        const info:ProjectInfo = {
          name:childDocNodes[i].data.text,
          path:childDocNodes[i].getFilepath()
        };
        const item = new ProjectTreeItem(info, ProjectTreeItemType.document);
        children.push(item);
      }
    } 
    return children;
  }
  public onClick() {
    if(this.itemType === ProjectTreeItemType.project) {
      if(this.isActive) {
        DoorsSmores.closeActiveProject();
      } else {
        DoorsSmores.openProjectPath(this.info.path);
      }
    } else {
      const node = new SmoresDocument(this.info.path);
      DoorsSmores.openDocument(node);
    }
  }
  public getItemId() {
    if(this.itemType === ProjectTreeItemType.project) {
      return 0;
    } else {
      const node = new DocumentNode(this.info.path);
      return node.data.id;
    }
  }
}

