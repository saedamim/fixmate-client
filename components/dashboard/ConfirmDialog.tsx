"use client";

import { useEffect, useRef } from "react";

// A modal that asks before an action that cannot be undone. Escape closes it, Tab stays inside it, and focus goes back
// to the button that opened it (or to `fallbackFocus` when that button is gone, for example a removed card).
export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  busyLabel,
  busy,
  error,
  onConfirm,
  onClose,
  fallbackFocus,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  busyLabel: string;
  busy: boolean;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
  fallbackFocus?: React.RefObject<HTMLElement | null>;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
      if (e.key !== "Tab") return;

      const buttons = dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled)");
      if (!buttons?.length) return e.preventDefault();

      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      const active = document.activeElement;

      if (!dialogRef.current?.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

  useEffect(() => {
    const opener = document.activeElement;
    const fallback = fallbackFocus?.current;
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();

    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
      else fallback?.focus();
    };
  }, [fallbackFocus]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="confirm-title" className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{message}</p>

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button onClick={onClose} disabled={busy} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
