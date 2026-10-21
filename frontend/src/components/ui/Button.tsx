import clsx from 'clsx';
import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from './icons';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'paper';
type Size = 'md' | 'sm' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full border font-medium tracking-[-0.01em] whitespace-nowrap ' +
  'transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease-standard active:scale-[0.98] ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<Variant, string> = {
  // White is the action; colour is reserved for meaning (docs/DESIGN.md §7.1).
  primary: 'btn-solid border-white text-ink-0',
  secondary: 'btn-frost border-white/25 text-fg hover:border-white/50',
  danger: 'border-down/60 bg-transparent text-down hover:bg-down/10',
  ghost: 'border-transparent bg-transparent text-fg-2 hover:bg-white/[0.06] hover:text-fg',
  // Placing paper (simulated) orders only.
  paper: 'border-transparent bg-paper text-ink-0 hover:brightness-110',
};

const sizes: Record<Size, string> = {
  md: 'min-h-11 px-5 text-body-sm',
  sm: 'min-h-8 px-3 text-caption',
  lg: 'min-h-14 px-8 text-body',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return clsx(base, variants[variant], sizes[size], className);
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
};

export function Button({ variant = 'primary', size = 'md', loading, disabled, className, children, ...rest }: Props) {
  return (
    <button
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

export function ButtonLink({ href, variant = 'primary', size = 'md', className, children }: {
  href: string; variant?: Variant; size?: Size; className?: string; children: ReactNode;
}) {
  return <Link href={href} className={buttonClass(variant, size, className)}>{children}</Link>;
}
