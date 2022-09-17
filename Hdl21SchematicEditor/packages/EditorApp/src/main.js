/**
 * # Hdl21 Schematic Editor 
 * ## Main Process
 * 
 * Primary OS interactions, including 
 * * Save file
 * * Load file
 * * Create the main editor window in the first place 
 */

// Workspace Imports
import { Platform, Message, MessageKind } from "PlatformInterface";
// Local Imports
import { Channels } from './channels';

import { app, BrowserWindow, ipcMain } from 'electron';
import * as fs from 'fs';


// Schematic content from THE_ONLY_FILENAME_FOR_NOW
const THE_ONLY_FILENAME_FOR_NOW = "schematic.sch.svg";
const loadFile = () => {
  const content = fs.readFileSync(THE_ONLY_FILENAME_FOR_NOW, 'utf8');
  // console.log(content);
  return content;
};
const saveFile = contents => {
  fs.writeFile(THE_ONLY_FILENAME_FOR_NOW, contents, err => console.log(err));
}


const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // Send a message to the renderer, on our named channel.
  const sendMessage = msg => {
    return mainWindow.webContents.send(Channels.MainToRenderer, msg);
  };

  // Handle incoming messages from the renderer process.
  const handleMessage = (_event, msg) => {

    switch (msg.kind) {
      case MessageKind.RendererUp: {
        // Editor has reported it's alive, send it some schematic content 
        return sendMessage({ kind: MessageKind.LoadFile, body: loadFile() });
      }
      case MessageKind.SaveFile: return saveFile(msg.body)
      case MessageKind.LogInMain: return console.log(msg.body)
      case MessageKind.Change: return; // FIXME(?)
      default: {
        console.log("UNKNOWN MESSAGE KIND: ");
        console.log(msg);
      }
    }
  };

  // Register our callback for incoming messages from the renderer process.
  ipcMain.on(Channels.RendererToMain, handleMessage);

  // Load index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools. 
  // FIXME: make this a dev-mode thing. But definitely don't turn it off until we know how. 
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
if (require('electron-squirrel-startup')) {
  app.quit();
}
