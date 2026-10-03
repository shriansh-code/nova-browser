const { app, BrowserWindow, session, ipcMain } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1050, minHeight: 650,
    backgroundColor: "#080a0f",
    title: "Nova Browser",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: false,
      webviewTag: true
    }
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, "src", "index.html"));
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_, permission, callback) => {
    callback(["fullscreen", "clipboard-read", "clipboard-write"].includes(permission));
  });
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
