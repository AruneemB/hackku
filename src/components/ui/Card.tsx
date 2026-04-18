import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Card.module.css";

interface CardProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  footer?: ReactNode;
  highlight?: "green" | "amber" | "red" | "blue";
  children: ReactNode;
}

const HIGHLIGHT_STYLES = {
  green: styles.green,
  amber: styles.amber,
  red: styles.red,
  blue: styles.blue,
} as const;

export function Card({
  title,
  subtitle,
  eyebrow,
  footer,
  highlight,
  children,
  className = "",
  ...props
}: CardProps) {
  const classes = [
    styles.card,
    highlight ? HIGHLIGHT_STYLES[highlight] : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={classes} {...props}>
      {(eyebrow || title || subtitle) && (
        <header className={styles.header}>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          {title ? <h2 className={styles.title}>{title}</h2> : null}
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </header>
      )}

      <div className={styles.body}>{children}</div>

      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </article>
  );
}
