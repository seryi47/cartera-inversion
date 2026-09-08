"use client";

import { useTransition } from "react";
import { deleteRoundAction } from "@/lib/actions";

export default function DeleteRoundButton({ roundId }: { roundId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (confirm("¿Borrar esta aportación?")) {
          startTransition(() => deleteRoundAction(roundId));
        }
      }}
      disabled={pending}
      className="text-slate-400 hover:text-red-600 text-xs disabled:opacity-50"
    >
      Borrar
    </button>
  );
}
