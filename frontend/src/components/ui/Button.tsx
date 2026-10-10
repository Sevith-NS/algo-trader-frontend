import clsx from 'clsx';
import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from './icons';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'md' | 'sm';

const base =
  'inline-flex items-center justify-center gap-2 rounded-sm border font-medium whitespace-nowrap ' +
  'transition-colors duration-fast ease-out disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary: 'border-transparent bg-up text-ink-0 hover:bg-[#46CC84]',
  secondary: 'border-control bg-transparent text-fg hover:border-fg-2',
  danger: 'border-down bg-transparent text-down hover:bg-down/10',
  ghost: 'border-transparent bg-transparent text-fg-2 hover:bg-ink-2 hover:text-fg',
};

const sizes: Record<Size, string> = {
  md: 'min-h-11 px-4 text-body-sm',
  sm: 'min-h-8 px-3 text-caption',
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
