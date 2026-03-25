import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#22405f]">
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />

        <div className="relative z-10 w-full max-w-md px-6">
          <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
            <Image
              src="/logo.jpg"
              alt="Use Mas Não Abuse"
              width={216}
              height={86}
              className="h-[76px] w-auto mx-auto mb-3"
            />
            <h1 className="text-[#22405f] text-lg font-bold tracking-tight mb-6">
              Planejamento Financeiro
            </h1>
            <p className="text-sm text-[#22405f]/70 mb-6">
              Faça login para acessar o sistema
            </p>
            <LoginForm />
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-xs text-white/40">
              acesso seguro via OAuth 2.0
            </span>
            <div className="flex-1 h-px bg-white/20" />
          </div>
        </div>
      </div>

      <div className="text-center py-4 text-xs text-white/30">
        Use Mas Não Abuse © {new Date().getFullYear()}
      </div>
    </div>
  );
}
