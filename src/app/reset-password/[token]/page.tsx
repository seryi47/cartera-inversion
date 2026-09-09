"use client";

import { useActionState } from "react";
import { use } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/lib/actions";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [state, formAction, pending] = useActionState(resetPasswordAction, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white text-2xl font-bold shadow-lg shadow-blue-900/50">
            €
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Elegir nueva contraseña</h1>
        </div>

        <form action={formAction} className="bg-white p-8 rounded-2xl shadow-2xl">
          <input type="hidden" name="token" value={token} />

          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Nueva contraseña <span className="font-normal text-slate-400">(mínimo 6 caracteres)</span>
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 mb-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          {state?.error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg py-2.5 font-semibold transition shadow-sm"
          >
            {pending ? "Guardando..." : "Guardar contraseña"}
          </button>

          <p className="text-sm text-slate-600 mt-5 text-center">
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
              Volver a entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
