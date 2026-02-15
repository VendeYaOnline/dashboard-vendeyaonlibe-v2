import { LoginForm } from "../../components/login/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-primary-foreground max-w-lg">
            <h1 className="font-serif text-5xl xl:text-6xl leading-tight text-balance mb-6">
              Gestiona tu tienda
            </h1>
            <p className="text-lg text-primary-foreground/80 leading-relaxed">
              Accede al panel de administración para controlar tus productos,
              pedidos y hacer crecer tu negocio con VendeYa.
            </p>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-accent/10" />
        <div className="absolute top-20 right-20 w-32 h-32 border border-primary-foreground/20 rounded-full" />
        <div className="absolute bottom-40 left-20 w-20 h-20 border border-primary-foreground/10 rounded-full" />
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
