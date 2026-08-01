"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Store } from "lucide-react";
import {
  Button,
  Checkbox,
  Input,
  InputGroup,
  Label,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { loginUser } from "@/app/api/request";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import { DEFAULT_ROUTE } from "@/config/navigation";

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await loginUser({ email, password });
      setAuth(response.data.user);
      toast.success("Inicio de sesión exitoso");
      router.push(DEFAULT_ROUTE);
    } catch (error) {
      handleAxiosError(error, "Credenciales incorrectas");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
            <Store className="size-5 text-accent-foreground" />
          </div>
          <span className="text-xl font-semibold">VendeYa</span>
        </div>
        <h2 className="text-3xl sm:text-4xl">Panel de Administración</h2>
        <p className="text-muted">Ingresa tus credenciales para gestionar tu tienda</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <TextField value={email} onChange={setEmail} type="email" isRequired>
          <Label>Correo electrónico</Label>
          <InputGroup>
            <InputGroup.Prefix>
              <Mail className="size-4 text-muted" />
            </InputGroup.Prefix>
            <InputGroup.Input placeholder="nombre@ejemplo.com" autoComplete="email" />
          </InputGroup>
        </TextField>

        <TextField
          value={password}
          onChange={setPassword}
          type={showPassword ? "text" : "password"}
          isRequired
        >
          <Label>Contraseña</Label>
          <InputGroup>
            <InputGroup.Prefix>
              <Lock className="size-4 text-muted" />
            </InputGroup.Prefix>
            <InputGroup.Input placeholder="••••••••" autoComplete="current-password" />
            <InputGroup.Suffix>
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="text-muted transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </InputGroup.Suffix>
          </InputGroup>
        </TextField>

        <Checkbox>
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Label>Recordarme</Label>
          </Checkbox.Content>
        </Checkbox>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isDisabled={isLoading}
          className="group"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" />
              Iniciando sesión...
            </>
          ) : (
            <>
              Iniciar sesión
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>

      <div className="space-y-3 rounded-xl bg-surface-secondary p-5">
        <p className="text-sm font-medium">¿No tienes credenciales o no las recuerdas?</p>
        <p className="text-sm text-muted">
          Comunícate con el administrador para obtener acceso:
        </p>
        <div className="space-y-2">
          <a
            href="mailto:vendeyaonline10@gmail.com"
            className="flex items-center gap-2 text-sm text-link hover:underline"
          >
            <Mail className="size-4" />
            vendeyaonline10@gmail.com
          </a>
          <a
            href="https://wa.me/573204172443"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-link hover:underline"
          >
            <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            +57 320 417 2443
          </a>
        </div>
      </div>
    </div>
  );
}
