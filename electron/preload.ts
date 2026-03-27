import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // File operations
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFile: (filters?: { name: string; extensions: string[] }[]) => ipcRenderer.invoke('select-file', filters),
  saveFile: (defaultName: string, filters?: { name: string; extensions: string[] }[]) =>
    ipcRenderer.invoke('save-file', defaultName, filters),
  readDirectory: (folderPath: string) => ipcRenderer.invoke('read-directory', folderPath),
  readTextFile: (filePath: string) => ipcRenderer.invoke('read-text-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
  readImageBase64: (filePath: string) => ipcRenderer.invoke('read-image-base64', filePath),
  getImageSize: (filePath: string) => ipcRenderer.invoke('get-image-size', filePath),
})
