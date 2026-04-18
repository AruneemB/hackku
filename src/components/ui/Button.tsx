// ============================================================
// COMPONENT: Button (Base UI)
// OWNER: Track A (Frontend & UX)
// DESCRIPTION: Reusable button with variant support.
//   Variants: primary, secondary, danger, ghost
//   Sizes: sm, md, lg
// ============================================================

"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: ReactNode;
}

const VARIANT_STYLES = {
  primary: styles.primary,
  secondary: styles.secondary,
  danger: styles.danger,
  ghost: styles.ghost,
} as const;

const SIZE_STYLES = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
} as const;

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  className = "",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = [
    styles.button,
    VARIANT_STYLES[variant],
    SIZE_STYLES[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      type={type}
      {...props}
    >
      {isLoading ? (
        <>
          <span aria-hidden="true" className={styles.spinner} />
          <span>Loading</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
