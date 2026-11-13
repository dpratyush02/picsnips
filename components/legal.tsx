import type { ReactNode } from "react";

export function Legal({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="px-6 py-16">
      <article className="mx-auto max-w-2xl">
        <p className="text-sm text-muted-foreground">Updated {updated}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_h2]:pt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_strong]:text-foreground">
          {children}
        </div>
      </article>
    </main>
  );
}
