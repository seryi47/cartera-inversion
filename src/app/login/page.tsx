import LoginForm from "@/components/LoginForm";
import Logo from "@/components/Logo";

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
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-blue-900/50 p-1.5">
            <Logo size={44} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Cartera de Inversión</h1>
          <p className="mt-1 text-sm text-slate-300">Inicia sesión para ver tu seguimiento</p>
        </div>

        <LoginForm resetOk={reset === "ok"} />
      </div>
    </div>
  );
}
