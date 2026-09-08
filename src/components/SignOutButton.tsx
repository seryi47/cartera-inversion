"use client";

import { signOutAction } from "@/lib/actions";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOutAction()}
      className="text-sm text-slate-500 hover:text-slate-800"
    >
      Cerrar sesión
    </button>
  );
}
