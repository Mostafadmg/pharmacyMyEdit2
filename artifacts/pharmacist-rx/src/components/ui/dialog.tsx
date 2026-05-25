import * as React from "react"

import * as DialogPrimitive from "@radix-ui/react-dialog"

import { X } from "lucide-react"



import { cn } from "@/lib/utils"
import { RX_MODAL_CONTENT_Z, RX_MODAL_OVERLAY_Z } from "@/lib/modalLayers"



/** Mirrors `modal` on the nearest `<Dialog>` — used to skip the dimming overlay. */

const DialogModalContext = React.createContext(true)



const Dialog = ({

  modal = true,

  children,

  ...props

}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) => (

  <DialogModalContext.Provider value={modal}>

    <DialogPrimitive.Root modal={modal} {...props}>

      {children}

    </DialogPrimitive.Root>

  </DialogModalContext.Provider>

)



const DialogTrigger = DialogPrimitive.Trigger



const DialogPortal = DialogPrimitive.Portal



const DialogClose = DialogPrimitive.Close



const DialogOverlay = React.forwardRef<

  React.ElementRef<typeof DialogPrimitive.Overlay>,

  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>

>(({ className, ...props }, ref) => (

  <DialogPrimitive.Overlay

    ref={ref}

    className={cn(

      "fixed inset-0 bg-secondary/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      RX_MODAL_OVERLAY_Z,

      className

    )}

    {...props}

  />

))

DialogOverlay.displayName = DialogPrimitive.Overlay.displayName



type DialogContentProps = React.ComponentPropsWithoutRef<

  typeof DialogPrimitive.Content

> & {

  /** Hide the default top-right close control (use when the dialog supplies its own). */

  hideCloseButton?: boolean;

  /** Force-hide the dimming overlay (e.g. lightweight popovers). */

  hideOverlay?: boolean;

  /** @deprecated All dialogs use RX_MODAL_* layers by default. */
  elevated?: boolean;

  /** Extra classes for the dimmed backdrop (e.g. stronger fade). */
  overlayClassName?: string;

};



/** Native `<select>` menus render outside the dialog node; ignore those interactions. */

function isNativeSelectInteraction(target: EventTarget | null): boolean {

  if (!(target instanceof HTMLElement)) return false;

  const tag = target.tagName;

  if (tag === "SELECT" || tag === "OPTION" || tag === "OPTGROUP") return true;

  return Boolean(target.closest("select"));

}



const DialogContent = React.forwardRef<

  React.ElementRef<typeof DialogPrimitive.Content>,

  DialogContentProps

>(

  (

    {

      className,

      children,

      hideCloseButton = false,

      hideOverlay = false,

      elevated = false,

      overlayClassName,

      onPointerDownOutside,

      onInteractOutside,

      ...props

    },

    ref,

  ) => {

    const dialogModal = React.useContext(DialogModalContext)

    const showOverlay = !hideOverlay && dialogModal



    return (

      <DialogPortal>

        {showOverlay ? (
          <DialogOverlay
            className={cn(RX_MODAL_OVERLAY_Z, overlayClassName)}
          />
        ) : null}

        <DialogPrimitive.Content

          ref={ref}

          className={cn(

            "fixed left-[50%] top-[50%] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl",

            RX_MODAL_CONTENT_Z,

            !showOverlay && "shadow-2xl ring-1 ring-border",

            className

          )}

          onPointerDownOutside={(event) => {

            if (isNativeSelectInteraction(event.target)) {

              event.preventDefault();

              return;

            }

            onPointerDownOutside?.(event);

          }}

          onInteractOutside={(event) => {

            if (isNativeSelectInteraction(event.target)) {

              event.preventDefault();

              return;

            }

            onInteractOutside?.(event);

          }}

          {...props}

        >

          {children}

          {!hideCloseButton ? (

            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full border border-border bg-card p-1.5 text-muted-foreground opacity-80 transition-all hover:bg-muted hover:text-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">

              <X className="h-4 w-4" />

              <span className="sr-only">Close</span>

            </DialogPrimitive.Close>

          ) : null}

        </DialogPrimitive.Content>

      </DialogPortal>

    )

  },

)

DialogContent.displayName = DialogPrimitive.Content.displayName



const DialogHeader = ({

  className,

  ...props

}: React.HTMLAttributes<HTMLDivElement>) => (

  <div

    className={cn(

      "flex flex-col space-y-1.5 text-center sm:text-left",

      className

    )}

    {...props}

  />

)

DialogHeader.displayName = "DialogHeader"



const DialogBody = ({

  className,

  ...props

}: React.HTMLAttributes<HTMLDivElement>) => (

  <div

    className={cn(

      "min-h-0 flex-1 overflow-y-auto px-6 py-4",

      className

    )}

    {...props}

  />

)

DialogBody.displayName = "DialogBody"



const DialogFooter = ({

  className,

  ...props

}: React.HTMLAttributes<HTMLDivElement>) => (

  <div

    className={cn(

      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",

      className

    )}

    {...props}

  />

)

DialogFooter.displayName = "DialogFooter"



const DialogTitle = React.forwardRef<

  React.ElementRef<typeof DialogPrimitive.Title>,

  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>

>(({ className, ...props }, ref) => (

  <DialogPrimitive.Title

    ref={ref}

    className={cn(

      "text-lg font-semibold leading-none tracking-tight",

      className

    )}

    {...props}

  />

))

DialogTitle.displayName = DialogPrimitive.Title.displayName



const DialogDescription = React.forwardRef<

  React.ElementRef<typeof DialogPrimitive.Description>,

  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>

>(({ className, ...props }, ref) => (

  <DialogPrimitive.Description

    ref={ref}

    className={cn("text-sm text-muted-foreground", className)}

    {...props}

  />

))

DialogDescription.displayName = DialogPrimitive.Description.displayName



export {

  Dialog,

  DialogPortal,

  DialogOverlay,

  DialogTrigger,

  DialogClose,

  DialogContent,

  DialogHeader,

  DialogBody,

  DialogFooter,

  DialogTitle,

  DialogDescription,

}


