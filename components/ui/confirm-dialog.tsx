"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
}

interface ConfirmState extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

let confirmFn: ((opts: ConfirmOptions) => Promise<boolean>) | null = null;

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  if (!confirmFn) {
    return Promise.resolve(window.confirm(opts.message));
  }
  return confirmFn(opts);
}

export function ConfirmDialogProvider() {
  const [state, setState] = useState<ConfirmState | null>(null);

  useEffect(() => {
    confirmFn = (opts) =>
      new Promise<boolean>((resolve) => {
        setState({ ...opts, resolve });
      });
    return () => {
      confirmFn = null;
    };
  }, []);

  if (!state) return null;

  function close(ok: boolean) {
    state?.resolve(ok);
    setState(null);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={() => close(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                state.variant === "destructive"
                  ? "bg-red-100 text-red-600"
                  : "bg-amber-100 text-amber-600"
              }`}
            >
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">
                {state.title ?? "Confirmar"}
              </h3>
              <p className="text-sm text-keu-black/70">{state.message}</p>
            </div>
          </div>
        </div>
        <div className="bg-keu-gray-light px-6 py-4 flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => close(false)}
          >
            {state.cancelText ?? "Cancelar"}
          </Button>
          <Button
            type="button"
            variant={state.variant === "destructive" ? "destructive" : "default"}
            onClick={() => close(true)}
          >
            {state.confirmText ?? "Confirmar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
