"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Store } from "lucide-react";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-xl text-foreground">VendeYa</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl text-foreground">
          Panel de Administración
        </h2>
        <p className="text-muted-foreground">
          Ingresa tus credenciales para gestionar tu tienda
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Correo electrónico
          </Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-12 h-12 bg-secondary border-0 focus:ring-2 focus:ring-accent transition-all"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Contraseña
          </Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12 pr-12 h-12 bg-secondary border-0 focus:ring-2 focus:ring-accent transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Remember & Forgot - Removed forgot password link */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label
              htmlFor="remember"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Recordarme
            </Label>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base transition-all group"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              <span>Iniciando sesión...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Iniciar sesión</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </Button>
      </form>

      <div className="bg-secondary/50 rounded-xl p-5 space-y-3">
        <p className="text-sm text-foreground font-medium">
          ¿No tienes credenciales o no las recuerdas?
        </p>
        <p className="text-sm text-muted-foreground">
          Comunícate con el administrador para obtener acceso:
        </p>
        <div className="space-y-2">
          <a
            href="mailto:vendeyaonline10@gmail.com"
            className="flex items-center gap-2 text-sm hover:text-primary/80 transition-colors text-primary"
          >
            <Mail className="h-4 w-4" />
            vendeyaonline10@gmail.com
          </a>
          <a
            href="https://wa.me/573204172443"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm hover:text-primary/80 transition-colors text-primary"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            +57 320 417 2443
          </a>
        </div>
      </div>
    </div>
  );
}
