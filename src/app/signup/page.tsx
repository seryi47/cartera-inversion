"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction } from "@/lib/actions";
import Logo from "@/components/Logo";

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUpAction, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-blue-900/50 p-1.5">
            <Logo size={44} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Crear cuenta</h1>
          <p className="mt-1 text-sm text-slate-300">
            Sembraremos tu cartera con los 5 fondos ya definidos
          </p>
        </div>

        <form action={formAction} className="bg-white p-8 rounded-2xl shadow-2xl">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 mb-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Contraseña <span className="font-normal text-slate-400">(mínimo 6 caracteres)</span>
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
            {pending ? "Creando..." : "Crear cuenta"}
          </button>

          <p className="text-sm text-slate-600 mt-5 text-center">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
