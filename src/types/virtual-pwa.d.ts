declare module "virtual:pwa-register" {
  export function registerSW(options?: {
    onRegistered?: (r?: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (err?: unknown) => void;
  }): () => Promise<void>;
}

declare module "virtual:pwa-register/react" {
  export function useRegisterSW(options?: {
    onRegistered?: (r?: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (err?: unknown) => void;
  }): {
    offlineReady: boolean;
    needRefresh: boolean;
    updateServiceWorker: (reload?: boolean) => Promise<void>;
  };
}
