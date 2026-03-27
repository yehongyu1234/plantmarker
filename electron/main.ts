import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'PlantMarker',
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    // mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded, preload should be active')
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// Window controls
ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('window-close', () => {
  mainWindow?.close()
})

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false
})

// Select folder dialog
ipcMain.handle('select-folder', async () => {
  console.log('select-folder IPC called')
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  })
  if (result.canceled) return null
  return result.filePaths[0]
})

// Select file dialog
ipcMain.handle('select-file', async (_event: Electron.IpcMainInvokeEvent, filters?: Electron.FileFilter[]) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: filters || [{ name: 'All Files', extensions: ['*'] }],
  })
  if (result.canceled) return null
  return result.filePaths[0]
})

// Save file dialog
ipcMain.handle('save-file', async (_event: Electron.IpcMainInvokeEvent, defaultName: string, filters?: Electron.FileFilter[]) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultName,
    filters: filters || [{ name: 'All Files', extensions: ['*'] }],
  })
  if (result.canceled || !result.filePath) return null
  return result.filePath
})

// Read directory
ipcMain.handle('read-directory', async (_event: Electron.IpcMainInvokeEvent, folderPath: string) => {
  try {
    const entries = await fs.promises.readdir(folderPath, { withFileTypes: true })
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.webp']
    const files = entries
      .filter(entry => entry.isFile() && imageExtensions.includes(path.extname(entry.name).toLowerCase()))
      .map(entry => ({
        name: entry.name,
        path: path.join(folderPath, entry.name),
      }))
    return files
  } catch (err) {
    console.error('read-directory error:', folderPath, err)
    return []
  }
})

// Read text file
ipcMain.handle('read-text-file', async (_event: Electron.IpcMainInvokeEvent, filePath: string) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8')
    return content
  } catch (err) {
    console.error('read-text-file error:', filePath, err)
    return null
  }
})

// Write file
ipcMain.handle('write-file', async (_event: Electron.IpcMainInvokeEvent, filePath: string, content: string) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8')
    return true
  } catch {
    return false
  }
})

// Read image as base64
ipcMain.handle('read-image-base64', async (_event: Electron.IpcMainInvokeEvent, filePath: string) => {
  try {
    const buffer = await fs.promises.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase().replace('.', '')
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      bmp: 'image/bmp',
      webp: 'image/webp',
    }
    const mime = mimeMap[ext] || 'image/jpeg'
    return `data:${mime};base64,${buffer.toString('base64')}`
  } catch (err) {
    console.error('read-image-base64 error:', filePath, err)
    return null
  }
})

// Get image dimensions
ipcMain.handle('get-image-size', async (_event: Electron.IpcMainInvokeEvent, filePath: string) => {
  try {
    const buffer = await fs.promises.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()

    if (ext === '.png') {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
    }
    if (ext === '.jpg' || ext === '.jpeg') {
      let offset = 2
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) break
        const marker = buffer[offset + 1]
        if (marker >= 0xc0 && marker <= 0xc3) {
          return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) }
        }
        const length = buffer.readUInt16BE(offset + 2)
        offset += length + 2
      }
    }
    return null
  } catch (err) {
    console.error('get-image-size error:', filePath, err)
    return null
  }
})
