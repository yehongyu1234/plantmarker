/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ElectronAPI {
  // Window controls
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
  isMaximized: () => Promise<boolean>

  // File operations
  selectFolder: () => Promise<string | null>
  selectFile: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>
  saveFile: (defaultName: string, filters?: { name: string; extensions: string[] }[]) => Promise<string | null>
  readDirectory: (folderPath: string) => Promise<{ name: string; path: string }[]>
  readTextFile: (filePath: string) => Promise<string | null>
  writeFile: (filePath: string, content: string) => Promise<boolean>
  readImageBase64: (filePath: string) => Promise<string | null>
  getImageSize: (filePath: string) => Promise<{ width: number; height: number } | null>
}

interface Window {
  electronAPI: ElectronAPI
}
