import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-xl p-10 shadow-sm text-center">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="Use Mas Não Abuse" width={120} height={48} className="h-12 w-auto" />
          </div>
          <p className="text-sm text-muted-foreground mb-8">
            Planejamento financeiro pessoal
          </p>
          <LoginForm />
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">
              acesso seguro via OAuth 2.0
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
        </div>
      </div>
    </div>
  );
}
