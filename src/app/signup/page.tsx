"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction } from "@/lib/actions";

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUpAction, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form action={formAction} className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h1 className="text-xl font-semibold mb-1">Crear cuenta</h1>
        <p className="text-sm text-slate-500 mb-6">
          Al crear la cuenta se sembrará tu cartera con los 5 fondos que ya definimos (podrás ajustar los pesos después).
        </p>

        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="block text-sm font-medium mb-1">Contraseña (mínimo 6 caracteres)</label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {state?.error && <p className="text-sm text-red-600 mb-4">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg py-2 font-medium transition"
        >
          {pending ? "Creando..." : "Crear cuenta"}
        </button>

        <p className="text-sm text-slate-500 mt-4 text-center">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
