const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("edmPmr", {
  isDesktop: true,
  platform: process.platform,
  getVersion: () => ipcRenderer.invoke("pmr:get-version"),
  listPrinters: () => ipcRenderer.invoke("pmr:list-printers"),
  printLabels: (html, options) =>
    ipcRenderer.invoke("pmr:print-labels", { html, options }),
});
