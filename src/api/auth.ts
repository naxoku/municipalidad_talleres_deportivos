import { API_URL } from "./config";

export async function login(email: string, contrasena: string) {
  const response = await fetch(`${API_URL}/api/auth.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, contrasena }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Error en login");
  return data;
}