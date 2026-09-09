"use client";

import { useEffect, useState, useTransition } from "react";
import { deleteRoundAction } from "@/lib/actions";

export default function DeleteRoundButton({ roundId }: { roundId: string }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  function close() {
    setVisible(false);
    setTimeout(() => setOpen(false), 120);
  }

  function confirmDelete() {
    setOpen(false);
    startTransition(() => deleteRoundAction(roundId));
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={pending}
        className="text-slate-400 hover:text-red-600 text-xs disabled:opacity-50"
      >
        Borrar
      </button>

      {open && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 transition-opacity duration-150 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
          onClick={close}
        >
          <div
            className={`bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-sm transition-all duration-150 ${
              visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-slate-900 mb-1">¿Borrar esta aportación?</h3>
            <p className="text-sm text-slate-500 mb-5">Se eliminará y no se puede deshacer.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={close}
                className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
              >
                Borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
