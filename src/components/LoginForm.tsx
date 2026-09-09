"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions";

export default function LoginForm({ resetOk }: { resetOk: boolean }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="bg-white p-8 rounded-2xl shadow-2xl">
      {resetOk && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
          Contraseña actualizada — ya puedes entrar con ella.
        </p>
      )}

      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 mb-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />

      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-semibold text-slate-700">Contraseña</label>
        <Link href="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <input
        name="password"
        type="password"
        required
        autoComplete="current-password"
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
        {pending ? "Entrando..." : "Entrar"}
      </button>

      <p className="text-sm text-slate-600 mt-5 text-center">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}
