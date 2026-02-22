import { Toaster, toast } from "sonner";

export function ToastHost() {
  return <Toaster richColors position="top-right" />;
}

export const notify = {
  ok: (m: string) => toast.success(m),
  err: (m: string) => toast.error(m),
  info: (m: string) => toast(m)
};