import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const titleIsCustom =
          title != null && typeof title !== "string" && typeof title !== "number";
        return (
          <Toast key={id} {...props}>
            <div className={cn("flex-1 min-w-0", titleIsCustom ? "w-full" : "grid gap-1")}>
              {title &&
                (titleIsCustom ? (
                  <div className="w-full">{title}</div>
                ) : (
                  <ToastTitle>{title}</ToastTitle>
                ))}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
