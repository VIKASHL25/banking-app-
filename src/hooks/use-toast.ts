
import { toast as sonnerToast } from "sonner";
import { useToast as useToastShadcn } from "@/components/ui/use-toast";

// Re-export sonner toast for direct usage
export const toast = sonnerToast;

// Create a compatible interface with what the Toaster component expects
export function useToast() {
  const shadcnToast = useToastShadcn();
  return {
    toast,
    // Add empty toasts array to satisfy the Toaster component's type requirements
    toasts: []
  };
}
