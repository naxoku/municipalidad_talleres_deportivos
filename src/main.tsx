import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { registerSW } from "virtual:pwa-register";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";

import "@/styles/globals.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Provider>
          <App />
        </Provider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);

// Registrar service worker (plugin VitePWA genera `sw.js` y registerSW helper)
try {
  // registerSW devuelve una función que permite forzar la actualización cuando sea necesario
  registerSW({
    onRegistered(r?: ServiceWorkerRegistration | undefined) {
      // r: ServiceWorkerRegistration | undefined
      console.log("Service Worker registrado:", r);
    },
    onRegisterError(err?: unknown) {
      console.error("Error registrando Service Worker:", err);
    },
  });
} catch (err) {
  // fallbacks silenciosos en entornos donde no está disponible
  console.debug("registerSW no disponible:", err);
}
