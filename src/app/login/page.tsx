import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Iniciar sesión | VendeYaOnline" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen">
      {/* Panel decorativo, sólo en pantallas grandes */}
      <div className="relative hidden overflow-hidden bg-accent lg:flex lg:w-1/2">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-lg text-accent-foreground">
            <h1 className="mb-6 text-5xl leading-tight text-balance xl:text-6xl">
              Gestiona tu tienda
            </h1>
            <p className="text-lg leading-relaxed text-accent-foreground/80">
              Accede al panel de administración para controlar tus productos, pedidos y
              hacer crecer tu negocio con VendeYaOnline.
            </p>
          </div>
        </div>
        <div className="absolute top-20 right-20 size-32 rounded-full border border-accent-foreground/20" />
        <div className="absolute bottom-40 left-20 size-20 rounded-full border border-accent-foreground/10" />
      </div>

      <div className="flex w-full items-center justify-center p-6 sm:p-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
