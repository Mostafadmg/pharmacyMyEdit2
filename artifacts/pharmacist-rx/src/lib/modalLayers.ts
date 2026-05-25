/**
 * Z-index stack for the Rx portal (low → high).
 * Layout chrome (header, FAB): ~30–50
 * Patient chat dock: 180
 * Modal overlay: 200
 * Modal content / side drawers: 210
 * Popovers & selects inside modals: 220
 * Toasts: 230
 */
export const RX_MODAL_OVERLAY_Z = "z-[200]";
export const RX_MODAL_CONTENT_Z = "z-[210]";
export const RX_MODAL_POPOVER_Z = "z-[220]";
export const RX_TOAST_Z = "z-[230]";
/** Non-blocking patient chat — below clinical modals */
export const RX_CHAT_PANEL_Z = "z-[180]";
