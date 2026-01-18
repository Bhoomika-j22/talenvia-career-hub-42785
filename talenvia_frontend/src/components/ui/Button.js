import React from "react";

/**
 * Button component aligned with Talenvia theme.
 */

// PUBLIC_INTERFACE
export function Button({ variant = "default", as: As, className = "", ...props }) {
  /** Reusable button with variants: default | primary | ghost | danger. */
  const variantClass =
    variant === "primary"
      ? "tv-btn--primary"
      : variant === "ghost"
        ? "tv-btn--ghost"
        : variant === "danger"
          ? "tv-btn--danger"
          : "";

  const Comp = As || "button";

  return <Comp className={`tv-btn ${variantClass} ${className}`.trim()} {...props} />;
}
