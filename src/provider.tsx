import type { NavigateOptions } from "react-router-dom";

import { useHref, useNavigate } from "react-router-dom";
import { HeroUIProvider } from "@heroui/system";
import { ToastProvider } from "@heroui/toast";

import { AuthProvider } from "@/context/auth";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      {/* Force toasts to appear top-center on all viewports */}
      <ToastProvider placement="top-center" toastOffset={8} />
      <AuthProvider>{children}</AuthProvider>
    </HeroUIProvider>
  );
}
