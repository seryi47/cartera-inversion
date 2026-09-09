import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const { reset } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white text-2xl font-bold shadow-lg shadow-blue-900/50">
            €
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Cartera de Inversión</h1>
          <p className="mt-1 text-sm text-slate-300">Inicia sesión para ver tu seguimiento</p>
        </div>

        <LoginForm resetOk={reset === "ok"} />
      </div>
    </div>
  );
}
