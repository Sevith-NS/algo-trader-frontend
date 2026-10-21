import clsx from 'clsx';

/**
 * Shared page chrome for the product surfaces (everything except the landing
 * page, which runs in the brand register).
 *
 * These exist because the app had drifted into five different heading
 * treatments and two container widths across nine routes. One primitive per
 * concern keeps a new page from inventing a sixth.
 *
 * The scale is fixed deliberately:
 *   h1          text-3xl/4xl font-black tracking-tight   (matches the landing
 *                                                         page's display voice
 *                                                         one step quieter)
 *   description text-sm leading-relaxed, max 2ch-wide column
 *   eyebrow     mono uppercase 0.22em - rationed, not on every page
 */

const SHELL = 'w-full';

export function PageShell({
  children,
  className,
  as: Tag = 'main',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'main' | 'div';
}) {
  return <Tag className={clsx(SHELL, className)}>{children}</Tag>;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  icon,
  actions,
  meta,
  className,
  level = 2,
}: {
  title: string;
  description?: React.ReactNode;
  /** Small mono label above the title. Use sparingly, not on every page. */
  eyebrow?: string;
  icon?: React.ReactNode;
  /** Controls that belong beside the title (tab strips, refresh, filters). */
  actions?: React.ReactNode;
  /** Mono status line under the title: timestamps, counts, coverage. */
  meta?: React.ReactNode;
  className?: string;
  /** 1 for a top-level page; 2 inside a section that already has its h1. */
  level?: 1 | 2;
}) {
  const Heading = level === 1 ? 'h1' : 'h2';
  return (
    <header className={clsx('mb-8', className)}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-3 text-micro uppercase text-fg-3">
              {eyebrow}
            </p>
          )}
          <Heading className="text-silver flex items-center gap-3 text-h2 font-normal tracking-[-0.03em] md:text-[40px] md:leading-[44px]">
            {icon}
            {title}
          </Heading>
          {description && (
            <p className="mt-3 max-w-2xl text-body-sm text-fg-2">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0 sm:text-right">{actions}</div>}
      </div>
      {meta && (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 tabular text-caption text-fg-3">
          {meta}
        </div>
      )}
    </header>
  );
}

/**
 * Section panel used across the product surfaces, on glass (docs/DESIGN.md
 * §2.3) so panel styling lives in one place rather than being re-derived per
 * page.
 */
export function Panel({
  title,
  icon,
  aside,
  children,
  className,
  bodyClassName,
  level = 3,
  id,
}: {
  title?: string;
  icon?: React.ReactNode;
  /** Right-aligned count, timestamp or control. */
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Heading level for the title: 2 when the panel is a top-level page section. */
  level?: 2 | 3;
  /** Heading id, so the section is labelled by its title. */
  id?: string;
}) {
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <section aria-labelledby={title ? id : undefined} className={clsx('glass rounded-2xl p-5 md:p-6', className)}>
      {(title || aside) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <Heading id={id} className="flex items-center gap-3 text-micro uppercase text-fg">
              {icon ?? <span aria-hidden="true" className="ring-dot text-fg" />}
              {title}
            </Heading>
          )}
          {aside && (
            <span className="tabular shrink-0 text-caption text-fg-3">
              {aside}
            </span>
          )}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
