import { addToast as heroAddToast } from "@heroui/react";

export type ToastColor =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger";

type LegacyVariant = "success" | "error" | "info" | "warning";

export interface ShowToastOptions {
  title?: string;
  description?: string;
  color?: ToastColor;
  /** Legacy param — still supported */
  variant?: LegacyVariant;
  timeout?: number; // ms
  hideIcon?: boolean;
  endContent?: any;
  shouldShowTimeoutProgress?: boolean;
  icon?: any;
}

const variantMap: Record<LegacyVariant, ToastColor> = {
  success: "success",
  error: "danger",
  warning: "warning",
  info: "primary",
};

/**
 * showToast: small wrapper to normalize `variant` -> `color` and provide defaults
 */
export function showToast(opts: ShowToastOptions) {
  const color =
    opts.color ?? (opts.variant ? variantMap[opts.variant] : "default");

  // Map our generic fields to the library's addToast options.
  heroAddToast({
    title: opts.title,
    description: opts.description,
    color,
    timeout: opts.timeout,
    hideIcon: opts.hideIcon,
    endContent: opts.endContent,
    shouldShowTimeoutProgress: opts.shouldShowTimeoutProgress,
    icon: opts.icon,
  });
}

export default showToast;
