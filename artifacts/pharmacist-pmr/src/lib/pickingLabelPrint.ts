import { getDesktopBridge } from "@/lib/electronBridge";

export async function printPickingLabelHtml(
  html: string,
  options?: { deviceName?: string; silent?: boolean },
): Promise<"electron" | "browser"> {
  const bridge = getDesktopBridge();

  if (bridge) {
    await bridge.printLabels(html, {
      silent: options?.silent ?? true,
      deviceName: options?.deviceName,
    });
    return "electron";
  }

  const printFrame = document.createElement("iframe");
  printFrame.style.position = "fixed";
  printFrame.style.right = "0";
  printFrame.style.bottom = "0";
  printFrame.style.width = "0";
  printFrame.style.height = "0";
  printFrame.style.border = "0";
  document.body.appendChild(printFrame);

  const doc = printFrame.contentDocument;
  if (!doc) {
    document.body.removeChild(printFrame);
    throw new Error("Could not open print frame");
  }

  doc.open();
  doc.write(html);
  doc.close();

  await new Promise<void>((resolve) => {
    printFrame.onload = () => resolve();
    setTimeout(resolve, 300);
  });

  printFrame.contentWindow?.focus();
  printFrame.contentWindow?.print();
  setTimeout(() => document.body.removeChild(printFrame), 500);
  return "browser";
}
