'use strict'

const { contextBridge, ipcRenderer } = require('electron')

/**
 * 沙箱 preload 必须使用 CommonJS；勿用 Vite 再打 preload.ts，否则会偶发双产物拼接损坏此流程。
 * 新增 IPC 时请在此文件与 vite-env.d.ts 同步更新。
 */
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFile: filters => ipcRenderer.invoke('select-file', filters),
  saveFile: (defaultName, filters) => ipcRenderer.invoke('save-file', defaultName, filters),
  readDirectory: folderPath => ipcRenderer.invoke('read-directory', folderPath),
  readTextFile: filePath => ipcRenderer.invoke('read-text-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  readImageBase64: filePath => ipcRenderer.invoke('read-image-base64', filePath),
  getImageSize: filePath => ipcRenderer.invoke('get-image-size', filePath),
  readWorkspaceFile: folderPath => ipcRenderer.invoke('read-workspace-file', folderPath),
  writeWorkspaceFile: (folderPath, content) =>
    ipcRenderer.invoke('write-workspace-file', folderPath, content),
})
