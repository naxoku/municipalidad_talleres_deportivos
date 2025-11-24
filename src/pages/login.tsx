import { useState } from "react";
import { Card, CardBody, CardHeader, Input, Button } from "@heroui/react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { useAuth } from "@/context/auth";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    try {
      await login({ email, password });
    } catch {
      // El error ya se maneja en el contexto con toast
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-primary-50 via-background to-secondary-50">
      <Card className="w-[450px] shadow-xl">
        <CardHeader className="flex flex-col gap-3 items-center pb-0 pt-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            M
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Bienvenido</h1>
            <p className="text-small text-default-500">
              Sistema de Gestión de Talleres Deportivos
            </p>
          </div>
        </CardHeader>
        <CardBody className="overflow-hidden px-8 py-6">
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <Input
              isRequired
              endContent={<Mail className="text-default-400" size={18} />}
              label="Email"
              placeholder="usuario@muni.cl"
              type="email"
              value={email}
              variant="bordered"
              onValueChange={setEmail}
            />
            <Input
              isRequired
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="text-default-400" size={18} />
                  ) : (
                    <Eye className="text-default-400" size={18} />
                  )}
                </button>
              }
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              startContent={<Lock className="text-default-400" size={18} />}
              type={showPassword ? "text" : "password"}
              value={password}
              variant="bordered"
              onValueChange={setPassword}
            />

            <div className="text-xs text-default-500 bg-default-100 p-3 rounded-lg">
              <p className="font-semibold mb-1">Usuarios de prueba:</p>
              <p>
                • Admin:{" "}
                <code className="text-xs">admin@municipalidad.gob</code>
              </p>
              <p>
                • Profesor:{" "}
                <code className="text-xs">heidy.montoya@municipalidad.gob</code>
              </p>
              <p className="mt-1">
                Contraseña: <code className="text-xs">password</code>
              </p>
            </div>

            <div className="flex gap-2 justify-end mt-2">
              <Button
                fullWidth
                color="primary"
                isLoading={isLoading}
                size="lg"
                type="submit"
              >
                Iniciar Sesión
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
