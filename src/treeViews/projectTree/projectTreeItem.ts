import * as vscode from "vscode";
import { DoorsSmores, ProjectInfo } from "../../doorsSmores";
import { DocumentNode } from "../../model/documentNode";
import { SmoresProject } from "../../model/smoresProject";
import { getNodeIcon } from "../treeIcons";

export class ProjectTreeItem extends vscode.TreeItem {
  private isActive:boolean;
  constructor(readonly info:ProjectInfo, private isProject:boolean) {
    const activeProject:SmoresProject|undefined = DoorsSmores.getActiveProject();
    var state = vscode.TreeItemCollapsibleState.None;
    let active = false;
    if(activeProject && info.path === activeProject.getFilepath()) {
      state = vscode.TreeItemCollapsibleState.Expanded;
      active = true;
    }
    super(info.name, state);
    this.isActive = active;
    var icon:vscode.ThemeIcon;
    if(isProject) {
      icon = vscode.ThemeIcon.Folder;
      if(this.isActive === false) {
        this.contextValue = 'recentProject';
      } else {
        const iconColour = new vscode.ThemeColor('foreground');
        icon = new vscode.ThemeIcon('folder-opened', iconColour);    
      }
    } else {
      const item = new DocumentNode(info.path);
      icon = getNodeIcon(item);
      this.contextValue = 'document';
    }
    this.tooltip = `${info.name}\n\n${info.path}`;
    this.iconPath = icon;
    this.command = {title: 'Click', command :'doors-smores.OnProjectTreeItemClick',arguments:[this]};
  }
  public static isProjectTreeItem(item:ProjectTreeItem) {
    if(item === undefined) {return false;}
    if(item.info === undefined) {return false;}
    if(item.info.name === undefined) {return false;}
    if(item.info.path === undefined) {return false;}
    if(item.isProject === undefined) {return false;}
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
        const item = new ProjectTreeItem(info, false);
        children.push(item);
      }
    } 
    return children;
  }
  public onClick() {
    if(this.isProject) {
      if(this.isActive) {
        DoorsSmores.closeActiveProject();
      } else {
        DoorsSmores.openProjectPath(this.info.path);
      }
    } else {
      const node = new DocumentNode(this.info.path);
      DoorsSmores.openDocument(node);
    }
  }
  public getItemId() {
    if(this.isProject) {
      return 0;
    } else {
      const node = new DocumentNode(this.info.path);
      return node.data.id;
    }
  }
}

