const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
} = require("electron");
const path = require("path");

const isDev = !app.isPackaged;
const DEV_URL = process.env.VITE_DEV_SERVER_URL ?? "http://localhost:5175";

/** @type {BrowserWindow | null} */
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "EveryDayMeds PMR",
    backgroundColor: "#faf6f3",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(
      path.join(__dirname, "..", "dist", "public", "index.html"),
    );
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("pmr:get-version", () => app.getVersion());

ipcMain.handle("pmr:list-printers", async () => {
  const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
  if (!win) return [];
  return win.webContents.getPrintersAsync();
});

ipcMain.handle("pmr:print-labels", async (_event, payload) => {
  const { html, options = {} } = payload ?? {};
  if (!html || typeof html !== "string") {
    throw new Error("No label HTML provided");
  }

  const printWin = new BrowserWindow({
    show: false,
    webPreferences: { sandbox: true },
  });

  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  await printWin.loadURL(dataUrl);

  return new Promise((resolve, reject) => {
    const printOptions = {
      silent: options.silent !== false,
      printBackground: true,
      deviceName: options.deviceName || undefined,
      margins: { marginType: "none" },
    };

    printWin.webContents.print(printOptions, (success, failureReason) => {
      printWin.close();
      if (success) resolve({ ok: true });
      else reject(new Error(failureReason || "Print failed"));
    });
  });
});
