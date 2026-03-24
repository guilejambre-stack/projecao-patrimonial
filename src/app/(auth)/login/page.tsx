import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-xl p-10 shadow-lg text-center">
          <h1 className="text-xl font-semibold text-foreground mb-1">
            Pranej Fin
          </h1>
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
